(function(){
  const RPC='https://fjpcuxsezeuajhlotzij.supabase.co/rest/v1/rpc/';
  const KEY='sb_publishable_VTwtMvGk29IDrz__M99Yag_TYrLzTRG';

  const fmt=n=>n==null?'—':new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(Number(n));
  const pct=n=>n==null?'—':(Number(n)>0?'+':'')+Number(n).toLocaleString('fr-FR',{maximumFractionDigits:1})+' %';
  const compact=n=>{
    if(n==null)return '—';
    const x=Number(n);
    if(Math.abs(x)>=1000000)return (x/1000000).toLocaleString('fr-FR',{maximumFractionDigits:2})+' M';
    if(Math.abs(x)>=1000)return (x/1000).toLocaleString('fr-FR',{maximumFractionDigits:1})+' k';
    return fmt(x);
  };
  const datefr=s=>{if(!s)return '—';const p=String(s).split('-');return p.length===3?p[2]+'/'+p[1]:s;};
  const norm=s=>(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();

  function updatePanel(rows){
    const root=document.querySelector('#panel.cfo-panel-cards');
    if(!root||!Array.isArray(rows))return;
    const byName=new Map(rows.map(r=>[norm(r.artist_name),r]));
    root.querySelectorAll('.cfo-artist-card').forEach(card=>{
      const h=card.querySelector('.cfo-artist-head h3');
      if(!h)return;
      const r=byName.get(norm(h.textContent));
      if(!r)return;
      const vals=card.querySelectorAll('.cfo-artist-kpis b');
      if(vals[0])vals[0].textContent=fmt(r.spotify_monthly_listeners);
      if(vals[1])vals[1].textContent=fmt(r.spotify_followers);
      if(vals[2])vals[2].textContent=fmt(r.social_followers_total);
      if(vals[3])vals[3].textContent=fmt(r.airplay_7d);
      const fresh=card.querySelector('.cfo-card-fresh');
      if(fresh)fresh.textContent='Donnée au '+datefr(r.latest_data_date)+' · Airplay '+pct(r.airplay_change_pct);
    });
    root.dataset.live='1';
  }

  function projectionByUiTitle(rows,title){
    const key=norm(title);
    const aliases={
      'ma faute':'ma faute',
      'coeur maladroit':'coeur maladroit',
      'princesse chaos':'princesse chaos'
    };
    const wanted=aliases[key]||key;
    return rows.find(r=>{
      const candidates=[r.title,r.raw_title].filter(Boolean).map(norm);
      return candidates.some(c=>c===wanted||c.startsWith(wanted+' ')||wanted.startsWith(c+' '));
    })||null;
  }

  function updateProjections(rows,cert){
    const root=document.querySelector('#projections.cfo-projections');
    if(!root||!Array.isArray(rows))return;
    root.querySelectorAll('.cfo-proj-card').forEach(card=>{
      const h=card.querySelector('.cfo-proj-title h3');
      if(!h)return;
      const r=projectionByUiTitle(rows,h.textContent);
      if(!r)return;
      const vals=card.querySelectorAll('.cfo-proj-kpis b');
      if(vals[0])vals[0].textContent=fmt(r.current_streams);
      if(vals[1])vals[1].textContent=fmt(r.weekly_current);
      if(vals[2])vals[2].textContent=fmt(r.mm7);
      if(vals[3])vals[3].textContent=fmt(r.projection_30d);

      const trend=card.querySelector('.cfo-proj-title .trend');
      if(trend){
        const v=Number(r.weekly_rate);
        trend.classList.remove('down','neutral','up');
        if(r.weekly_rate==null||Math.abs(v)<0.5){
          trend.classList.add('neutral');
          trend.textContent='Rythme stable';
        }else{
          trend.classList.add(v>0?'up':'down');
          trend.textContent='Rythme '+pct(v);
        }
      }

      const small=card.querySelector(':scope > small');
      if(small){
        const bits=[];
        if(r.observation_date)bits.push('Donnée au '+datefr(r.observation_date));
        if(r.source)bits.push(r.source);
        if(r.verified)bits.push('vérifié');
        small.textContent=bits.join(' · ');
      }
    });

    const meta=root.querySelector('.cfo-proj-meta strong');
    const first=rows.find(r=>r.observation_date);
    if(meta&&first)meta.textContent=datefr(first.observation_date);

    if(cert&&cert.title){
      const maFaute=[...root.querySelectorAll('.cfo-proj-card')].find(c=>norm(c.querySelector('h3')?.textContent)==='ma faute');
      const note=maFaute?.querySelector('.cfo-cert-note');
      if(note){
        const label=(cert.current_level||'').toLowerCase()==='diamond'?'Diamant':cert.current_level;
        note.innerHTML='<b>Certification officielle : '+label+'</b><span>'+datefr(cert.certified_on)+' · source CFO / SNEP</span>';
      }
    }
    root.dataset.live='1';
  }

  function trackByUiTitle(tracks,title){
    const wanted=norm(title);
    return (tracks||[]).find(t=>{
      const vals=[t.display_label,t.title].filter(Boolean).map(norm);
      return vals.some(v=>v===wanted||v.startsWith(wanted+' ')||wanted.startsWith(v+' '));
    })||null;
  }


  function chartHeightSeries(container,rows,label){
    if(!container||!Array.isArray(rows)||!rows.length)return;
    const values=rows.map(r=>Number(r.value)).filter(Number.isFinite);
    if(!values.length)return;
    const min=Math.min.apply(null,values), max=Math.max.apply(null,values), span=max-min||1;
    container.innerHTML=rows.map(r=>{
      const v=Number(r.value);
      const h=28+((v-min)/span)*72;
      return '<i data-cfo-point="1" data-cfo-date="'+String(r.date||'')+'" data-cfo-value="'+v+'" data-cfo-label="'+label+'" style="height:'+h.toFixed(1)+'%"></i>';
    }).join('');
    container.setAttribute('aria-label',label+' : survolez chaque barre pour la valeur exacte');
  }

  function chartSparkline(svg,rows,label){
    if(!svg||!Array.isArray(rows)||rows.length<2)return;
    const values=rows.map(r=>Number(r.value)).filter(Number.isFinite);
    if(values.length<2)return;
    const min=Math.min.apply(null,values), max=Math.max.apply(null,values), span=max-min||1;
    const w=150,h=54,pad=4;
    const pts=rows.map((r,i)=>{
      const x=pad+i*((w-pad*2)/(rows.length-1));
      const y=h-pad-((Number(r.value)-min)/span)*(h-pad*2);
      return {x,y,row:r};
    });
    const poly=svg.querySelector('polyline');
    if(poly)poly.setAttribute('points',pts.map(p=>p.x.toFixed(1)+','+p.y.toFixed(1)).join(' '));
    svg.querySelectorAll('.cfo-spark-point').forEach(n=>n.remove());
    pts.forEach(p=>{
      const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('class','cfo-spark-point');
      c.setAttribute('cx',p.x.toFixed(1));
      c.setAttribute('cy',p.y.toFixed(1));
      c.setAttribute('r','4.5');
      c.dataset.cfoPoint='1';
      c.dataset.cfoDate=String(p.row.date||'');
      c.dataset.cfoValue=String(p.row.value);
      c.dataset.cfoLabel=label;
      svg.appendChild(c);
    });
    svg.setAttribute('aria-label',label+' : survolez chaque point pour la valeur exacte');
  }

  function updateMarineCharts(root,series){
    if(!root||!series)return;
    const kpis=root.querySelectorAll('.cfo-synth-grid.kpis .kpi-card');
    chartSparkline(kpis[0]?.querySelector('.sparkline'),series.audience_spotify||[],'Auditeurs mensuels Spotify');
    chartHeightSeries(kpis[1]?.querySelector('.mini-bars'),series.streaming_daily||[],'Streams Spotify du jour');

    const channels=root.querySelectorAll('.cfo-synth-grid.channels .cfo-channel');
    chartHeightSeries(channels[0]?.querySelector('.mini-bars'),series.audience_spotify?.slice(-6)||[],'Auditeurs mensuels Spotify');
    chartHeightSeries(channels[1]?.querySelector('.mini-bars'),series.streaming_daily||[],'Streams Spotify du jour');
    chartHeightSeries(channels[2]?.querySelector('.mini-bars'),series.airplay_daily||[],'Passages radio du jour');
    chartHeightSeries(channels[3]?.querySelector('.mini-bars'),series.tiktok_followers||[],'Followers TikTok');
    chartHeightSeries(channels[4]?.querySelector('.mini-bars'),series.instagram_followers||[],'Followers Instagram');
  }

  function updateMarine(marine,series){
    const root=document.querySelector('#marine.cfo-synthese');
    if(!root||!marine)return;

    const audience=marine.audience||{};
    const streaming=marine.streaming||{};
    const airplay=marine.airplay||{};
    const social=marine.social||{};
    const tracks=Array.isArray(marine.tracks)?marine.tracks:[];

    const kpis=root.querySelectorAll('.cfo-synth-grid.kpis .kpi-card');
    const audienceCard=kpis[0], streamsCard=kpis[1], airplayCard=kpis[2], socialCard=kpis[3];

    if(audienceCard){
      const v=audienceCard.querySelector('.value');
      const d=audienceCard.querySelector('.delta');
      const meta=audienceCard.querySelector('.meta');
      if(v)v.textContent=fmt(audience.spotify_monthly_listeners);
      if(d)d.textContent=pct(audience.change_7d_pct);
      if(meta)meta.textContent='Donnée au '+datefr(audience.observation_date)+' · Spotify / Soundcharts';
    }

    if(streamsCard){
      const em=streamsCard.querySelector('.kpi-top em');
      const v=streamsCard.querySelector('.value');
      const d=streamsCard.querySelector('.delta');
      const meta=streamsCard.querySelector('.meta');
      if(em)em.textContent='Catalogue qualifié · semaine';
      if(v)v.textContent=fmt(streaming.weekly_current);
      if(d)d.textContent=pct(streaming.weekly_rate);
      if(meta)meta.textContent='S-1 : '+fmt(streaming.weekly_previous)+' · '+fmt(streaming.verified_titles)+' titres vérifiés · '+(streaming.source||'Soundcharts');
    }

    if(airplayCard){
      const em=airplayCard.querySelector('.kpi-top em');
      const v=airplayCard.querySelector('.value');
      const d=airplayCard.querySelector('.delta');
      const ul=airplayCard.querySelector('ul');
      if(em)em.textContent='Passages radios · 7 jours';
      if(v)v.textContent=fmt(airplay.spins_7d);
      if(d)d.textContent=pct(airplay.change_7d_pct);
      if(ul){
        const top=(airplay.top_30d||[]).slice(0,4);
        ul.innerHTML=top.map(x=>'<li><span>'+x.title+'</span><b>'+fmt(x.spins_30d)+'</b></li>').join('');
      }
    }

    if(socialCard){
      const v=socialCard.querySelector('.value');
      const d=socialCard.querySelector('.delta');
      const ul=socialCard.querySelector('ul');
      if(v)v.textContent=fmt(social.total);
      if(d)d.textContent=pct(social.change_7d_pct);
      if(ul)ul.innerHTML=
        '<li><span>Instagram</span><b>'+fmt(social.instagram)+'</b></li>'+
        '<li><span>TikTok</span><b>'+fmt(social.tiktok)+'</b></li>'+
        '<li><span>Facebook</span><b>'+fmt(social.facebook)+'</b></li>'+
        '<li><span>YouTube</span><b>'+fmt(social.youtube)+'</b></li>';
    }

    root.querySelectorAll('.cfo-synth-table tbody tr').forEach(tr=>{
      const titleCell=tr.querySelector('td.title');
      if(!titleCell)return;
      const t=trackByUiTitle(tracks,titleCell.textContent);
      if(!t)return;
      const td=tr.querySelectorAll('td');
      if(td[2])td[2].textContent=fmt(t.weekly_current);
      if(td[3]){
        td[3].textContent=pct(t.weekly_rate);
        td[3].className=Number(t.weekly_rate)>=0?'up':'down';
      }
      if(td[4])td[4].textContent=fmt(t.current_streams);
      if(td[5])td[5].textContent='—';
      if(td[6])td[6].textContent='—';
    });

    const channels=root.querySelectorAll('.cfo-synth-grid.channels .cfo-channel');
    if(channels[0]){
      channels[0].querySelector('.value').textContent=compact(audience.spotify_monthly_listeners);
      channels[0].querySelector('.delta').textContent=pct(audience.change_7d_pct);
    }
    if(channels[1]){
      channels[1].querySelector('.value').textContent=compact(streaming.weekly_current);
      channels[1].querySelector('.delta').textContent=pct(streaming.weekly_rate);
    }
    if(channels[2]){
      channels[2].querySelector('.value').textContent=fmt(airplay.spins_7d);
      channels[2].querySelector('.delta').textContent=pct(airplay.change_7d_pct);
    }
    if(channels[3]){
      channels[3].querySelector('.value').textContent=compact(social.tiktok);
      channels[3].querySelector('.delta').textContent=pct(social.tiktok_change_7d_pct);
    }
    if(channels[4]){
      channels[4].querySelector('.value').textContent=compact(social.instagram);
      channels[4].querySelector('.delta').textContent=pct(social.instagram_change_7d_pct);
    }

    updateMarineCharts(root,series||{});
    root.dataset.live='1';
  }

  async function rpc(name){
    const r=await fetch(RPC+name,{
      method:'POST',
      headers:{apikey:KEY,'Content-Type':'application/json'},
      body:'{}'
    });
    if(!r.ok)throw new Error(name+' HTTP '+r.status);
    return await r.json();
  }

  function projectionsFromMarine(marine){
    const tracks=Array.isArray(marine?.tracks)?marine.tracks:[];
    return tracks.filter(t=>t.canonical_for_total!==false&&t.verified).map(t=>{
      const mm7=t.mm7==null?(t.weekly_current==null?null:Math.round(Number(t.weekly_current)/7)):Number(t.mm7);
      return {
        track_id:t.track_id,
        title:t.display_label||t.title,
        raw_title:t.title,
        cfo_group:t.cfo_group,
        observation_date:t.observation_date,
        current_streams:t.current_streams,
        weekly_current:t.weekly_current,
        weekly_previous:t.weekly_previous,
        weekly_rate:t.weekly_rate,
        mm7:t.mm7,
        mm14:t.mm14,
        mm30:t.mm30,
        projection_30d:(t.current_streams!=null&&mm7!=null)?Number(t.current_streams)+mm7*30:null,
        counting_note:t.counting_note,
        source:t.source,
        verified:t.verified
      };
    });
  }

  function certificationFromMarine(marine){
    return marine?.certification||{};
  }

  async function run(){
    try{
      const [dashboard,panel]=await Promise.all([
        rpc('cfo_marine_dashboard_public_v1'),
        rpc('cfo_panel_snapshot_v1')
      ]);
      const marine=dashboard?.marine||null;
      const series=dashboard?.series||{};
      updatePanel(Array.isArray(panel)?panel:[]);
      updateProjections(projectionsFromMarine(marine),certificationFromMarine(marine));
      updateMarine(marine,series);
      document.documentElement.dataset.cfoObservatoryLive='1';
    }catch(err){
      console.warn('CFO Observatoire live indisponible',err);
      document.documentElement.dataset.cfoObservatoryLive='0';
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);
  else run();
})();
