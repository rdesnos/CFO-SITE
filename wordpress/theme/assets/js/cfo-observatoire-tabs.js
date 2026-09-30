(function(){
  function init(){
    var root=document.querySelector('body.page-id-477 .mhs');
    if(!root) return;
    var nav=root.querySelector('.mhs-tabs');
    if(!nav) return;
    var links=[].slice.call(nav.querySelectorAll('a[href^="#"]'));
    var panels=[].slice.call(root.querySelectorAll(':scope > .mhs-tabpanel'));
    if(!links.length||!panels.length) return;

    function exists(id){
      return panels.some(function(p){return p.id===id;});
    }

    function activate(id,updateHash){
      if(!exists(id)) id='marine';

      panels.forEach(function(p){
        var active=p.id===id;
        p.classList.toggle('is-active',active);
        p.hidden=!active;
        p.setAttribute('aria-hidden',active?'false':'true');
      });

      links.forEach(function(a){
        var active=a.getAttribute('href')==='#'+id;
        a.classList.toggle('is-active',active);
        a.setAttribute('aria-selected',active?'true':'false');
      });

      if(updateHash){
        history.replaceState(null,'',location.pathname+location.search+'#'+id);
      }
    }

    root.classList.add('cfo-tabs-ready');

    links.forEach(function(a){
      a.addEventListener('click',function(e){
        e.preventDefault();
        activate(a.getAttribute('href').slice(1),true);
      });
    });

    window.addEventListener('hashchange',function(){
      activate(location.hash.slice(1),false);
    });

    activate(location.hash.slice(1)||'marine',false);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  }else{
    init();
  }
})();
