(function(){
  let tip;

  function ensureTip(){
    if(tip)return tip;
    tip=document.createElement('div');
    tip.className='cfo-chart-tooltip';
    tip.setAttribute('role','status');
    tip.setAttribute('aria-live','polite');
    document.body.appendChild(tip);
    return tip;
  }

  function fmt(n){
    return new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(Number(n));
  }

  function datefr(s){
    if(!s)return '';
    const p=String(s).split('-');
    return p.length===3 ? p[2]+'/'+p[1]+'/'+p[0] : s;
  }

  function renderPoint(el){
    const label=el.dataset.cfoLabel||'Donnée';
    const value=el.dataset.cfoValue;
    const date=el.dataset.cfoDate;
    return '<strong>'+label+'</strong>'
      +(date?'<em>'+datefr(date)+'</em>':'')
      +(value!=null&&value!==''?'<div class="cfo-chart-tooltip-value">'+fmt(value)+'</div>':'');
  }

  function show(el,x,y){
    const t=ensureTip();
    t.innerHTML=renderPoint(el);
    t.classList.add('is-visible');
    position(x,y);
  }

  function position(x,y){
    const t=ensureTip();
    const pad=14;
    let left=x+16,top=y+16;
    const r=t.getBoundingClientRect();
    if(left+r.width>window.innerWidth-pad)left=x-r.width-16;
    if(top+r.height>window.innerHeight-pad)top=y-r.height-16;
    t.style.left=Math.max(pad,left)+'px';
    t.style.top=Math.max(pad,top)+'px';
  }

  function hide(){
    if(tip)tip.classList.remove('is-visible');
  }

  document.addEventListener('mousemove',function(e){
    const el=e.target.closest('[data-cfo-point="1"]');
    if(!el){ hide(); return; }
    show(el,e.clientX,e.clientY);
  });

  document.addEventListener('mouseleave',hide);

  document.addEventListener('focusin',function(e){
    const el=e.target.closest('[data-cfo-point="1"]');
    if(!el)return;
    const r=el.getBoundingClientRect();
    show(el,r.left+r.width/2,r.top+r.height/2);
  });

  document.addEventListener('focusout',function(e){
    if(e.target.closest('[data-cfo-point="1"]'))hide();
  });

  function makeFocusable(){
    document.querySelectorAll('[data-cfo-point="1"]').forEach(el=>{
      if(!el.hasAttribute('tabindex'))el.setAttribute('tabindex','0');
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){
      makeFocusable();
      new MutationObserver(makeFocusable).observe(document.body,{subtree:true,childList:true});
    });
  }else{
    makeFocusable();
    new MutationObserver(makeFocusable).observe(document.body,{subtree:true,childList:true});
  }
})();
