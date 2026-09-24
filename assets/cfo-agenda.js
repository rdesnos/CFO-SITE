(() => {
  const cfg = window.CFOAgendaConfig || {};
  const locale = cfg.locale || 'fr-FR';
  const dayMs = 86400000;
  const pad = n => String(n).padStart(2,'0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
  const parseDate = s => {
    if (!s) return null;
    const [y,m,d] = String(s).split('-').map(Number);
    return new Date(y,m-1,d,12,0,0,0);
  };
  const clone = d => new Date(d.getTime());
  const startOfWeek = d => {
    const x = clone(d), day = (x.getDay()+6)%7;
    x.setDate(x.getDate()-day); x.setHours(12,0,0,0); return x;
  };
  const endOfWeek = d => { const x=startOfWeek(d); x.setDate(x.getDate()+6); return x; };
  const monthName = d => new Intl.DateTimeFormat(locale,{month:'long',year:'numeric'}).format(d);
  const shortDay = d => new Intl.DateTimeFormat(locale,{weekday:'short'}).format(d).replace('.','');
  const dayMonth = d => new Intl.DateTimeFormat(locale,{day:'2-digit',month:'short'}).format(d).replace('.','');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  class CFOAgenda {
    constructor(root){
      this.root = root;
      this.canvas = root.querySelector('[data-canvas]');
      this.status = root.querySelector('[data-status]');
      this.period = root.querySelector('[data-period]');
      this.artist = root.dataset.artist || 'marine';
      this.view = root.dataset.view || 'year';
      this.fixedTypes = (root.dataset.types || '').split(',').filter(Boolean);
      this.filter = 'all';
      this.anchor = new Date(); this.anchor.setHours(12,0,0,0);
      this.events = [];
      this.bind();
      this.load();
    }

    bind(){
      this.root.querySelectorAll('[data-view]').forEach(btn => btn.addEventListener('click', () => {
        this.view = btn.dataset.view;
        this.paint();
      }));
      this.root.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', () => {
        const a = btn.dataset.action;
        if (a === 'today') this.anchor = new Date();
        else this.shift(a === 'prev' ? -1 : 1);
        this.anchor.setHours(12,0,0,0);
        this.paint();
      }));
      this.root.querySelectorAll('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
        this.filter = btn.dataset.filter;
        this.root.querySelectorAll('[data-filter]').forEach(x => x.classList.toggle('is-active', x===btn));
        this.paint();
      }));
    }

    shift(dir){
      if (this.view === 'year') this.anchor.setFullYear(this.anchor.getFullYear()+dir);
      if (this.view === 'quarter') this.anchor.setMonth(this.anchor.getMonth()+3*dir);
      if (this.view === 'month') this.anchor.setMonth(this.anchor.getMonth()+dir);
      if (this.view === 'week') this.anchor.setDate(this.anchor.getDate()+7*dir);
    }

    async load(){
      const from = new Date(this.anchor.getFullYear()-1,0,1,12);
      const to = new Date(this.anchor.getFullYear()+2,11,31,12);
      const url = cfg.supabaseUrl + '/rest/v1/rpc/cfo_agenda_events';
      try{
        const res = await fetch(url,{
          method:'POST',
          headers:{
            'apikey':cfg.supabaseKey,
            'Content-Type':'application/json'
          },
          body:JSON.stringify({
            p_artist_slug:this.artist,
            p_from:iso(from),
            p_to:iso(to),
            p_types:this.fixedTypes.length ? this.fixedTypes : null
          }),
          cache:'no-store'
        });
        if(!res.ok) throw new Error('HTTP '+res.status);
        this.events = await res.json();
        if(!Array.isArray(this.events)) this.events=[];
        this.status.textContent = '';
        this.status.hidden = true;
        this.paint();
      }catch(e){
        console.error('[CFO Agenda]',e);
        this.status.hidden = false;
        this.status.textContent = 'Agenda momentanément indisponible.';
      }
    }

    visibleEvents(){
      return this.events.filter(e => this.filter==='all' || e.event_type===this.filter);
    }

    paint(){
      this.root.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('is-active', b.dataset.view===this.view));
      if(this.view==='year') this.renderYear();
      if(this.view==='quarter') this.renderQuarter();
      if(this.view==='month') this.renderMonth();
      if(this.view==='week') this.renderWeek();
    }

    eventCard(e, compact=false){
      const cls = 'type-' + esc(e.event_type || 'other');
      const city = e.city ? '<b>'+esc(e.city)+'</b>' : '<b>'+esc(e.title || 'Événement')+'</b>';
      const venue = e.venue ? '<span>'+esc(e.venue)+'</span>' : '';
      const verified = e.cfo_override || e.verified ? '<em title="Donnée CFO vérifiée">●</em>' : '';
      return '<article class="cfo-agenda__event '+cls+(compact?' is-compact':'')+'">'+verified+city+venue+'</article>';
    }

    monthEvents(year,month){
      return this.visibleEvents().filter(e => {
        const d=parseDate(e.event_date);
        return d && d.getFullYear()===year && d.getMonth()===month;
      });
    }

    miniMonth(year,month){
      const first = new Date(year,month,1,12);
      const last = new Date(year,month+1,0,12);
      const start = startOfWeek(first);
      const monthEvents = this.monthEvents(year,month);
      let html = '<section class="cfo-agenda__mini"><h3>'+esc(new Intl.DateTimeFormat(locale,{month:'long'}).format(first))+'</h3>';
      html += '<div class="cfo-agenda__weekdays">'+['L','M','M','J','V','S','D'].map(x=>'<span>'+x+'</span>').join('')+'</div><div class="cfo-agenda__days">';
      for(let i=0;i<42;i++){
        const d=clone(start); d.setDate(start.getDate()+i);
        const inMonth=d.getMonth()===month;
        const ev=monthEvents.filter(e=>e.event_date===iso(d));
        html += '<div class="cfo-agenda__day'+(inMonth?'':' is-out')+(ev.length?' has-event':'')+'"><span>'+d.getDate()+'</span>';
        if(ev.length) html += '<div class="cfo-agenda__dots">'+ev.slice(0,4).map(e=>'<i class="type-'+esc(e.event_type||'other')+'"></i>').join('')+'</div>';
        html += '</div>';
      }
      html += '</div>';
      if(monthEvents.length){
        html += '<div class="cfo-agenda__mini-list">'+monthEvents.map(e=>{
          const d=parseDate(e.event_date);
          return '<div><time>'+dayMonth(d)+'</time>'+this.eventCard(e,true)+'</div>';
        }).join('')+'</div>';
      }
      html += '</section>';
      return html;
    }

    renderYear(){
      const y=this.anchor.getFullYear();
      this.period.textContent=String(y);
      this.canvas.className='cfo-agenda__canvas view-year';
      this.canvas.innerHTML='<div class="cfo-agenda__year-grid">'+Array.from({length:12},(_,m)=>this.miniMonth(y,m)).join('')+'</div>';
    }

    renderQuarter(){
      const q=Math.floor(this.anchor.getMonth()/3);
      const y=this.anchor.getFullYear();
      this.period.textContent='T'+(q+1)+' · '+y;
      this.canvas.className='cfo-agenda__canvas view-quarter';
      this.canvas.innerHTML='<div class="cfo-agenda__quarter-grid">'+[0,1,2].map(i=>this.miniMonth(y,q*3+i)).join('')+'</div>';
    }

    renderMonth(){
      const y=this.anchor.getFullYear(), m=this.anchor.getMonth();
      const first=new Date(y,m,1,12), start=startOfWeek(first);
      this.period.textContent=monthName(first);
      const evs=this.monthEvents(y,m);
      let html='<div class="cfo-agenda__month"><div class="cfo-agenda__month-head">'+['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(x=>'<span>'+x+'</span>').join('')+'</div><div class="cfo-agenda__month-grid">';
      for(let i=0;i<42;i++){
        const d=clone(start); d.setDate(start.getDate()+i);
        const dayEvents=evs.filter(e=>e.event_date===iso(d));
        html+='<section class="cfo-agenda__month-day'+(d.getMonth()===m?'':' is-out')+(iso(d)===iso(new Date())?' is-today':'')+'"><time>'+d.getDate()+'</time>';
        html+=dayEvents.map(e=>this.eventCard(e,true)).join('');
        html+='</section>';
      }
      html+='</div></div>';
      this.canvas.className='cfo-agenda__canvas view-month';
      this.canvas.innerHTML=html;
    }

    renderWeek(){
      const start=startOfWeek(this.anchor), end=endOfWeek(this.anchor);
      this.period.textContent=dayMonth(start)+' — '+dayMonth(end)+' '+end.getFullYear();
      const evs=this.visibleEvents();
      let html='<div class="cfo-agenda__week">';
      for(let i=0;i<7;i++){
        const d=clone(start); d.setDate(start.getDate()+i);
        const dayEvents=evs.filter(e=>e.event_date===iso(d));
        html+='<section class="cfo-agenda__week-day'+(iso(d)===iso(new Date())?' is-today':'')+'"><header><span>'+esc(shortDay(d))+'</span><strong>'+d.getDate()+'</strong></header><div>';
        html+=dayEvents.length ? dayEvents.map(e=>this.eventCard(e,false)).join('') : '<p class="is-empty">—</p>';
        html+='</div></section>';
      }
      html+='</div>';
      this.canvas.className='cfo-agenda__canvas view-week';
      this.canvas.innerHTML=html;
    }
  }

  const boot=()=>document.querySelectorAll('[data-cfo-agenda]').forEach(root=>{if(!root._cfoAgenda)root._cfoAgenda=new CFOAgenda(root)});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
