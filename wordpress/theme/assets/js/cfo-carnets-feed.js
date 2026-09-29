document.addEventListener('DOMContentLoaded', function () {
  var host = document.querySelector('.cfo-carnets-facebook-feed');
  if (!host) return;

  var src = 'https://www.facebook.com/plugins/page.php?href=' + encodeURIComponent('https://www.facebook.com/profile.php?id=61582419478190') + '&tabs=timeline&width=500&height=700&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false';
  var frame = document.createElement('iframe');
  frame.src = src;
  frame.width = '500';
  frame.height = '700';
  frame.style.border = '0';
  frame.style.overflow = 'hidden';
  frame.style.width = '100%';
  frame.style.maxWidth = '500px';
  frame.style.display = 'block';
  frame.scrolling = 'no';
  frame.frameBorder = '0';
  frame.allowFullscreen = true;
  frame.loading = 'lazy';
  frame.title = 'Dernières publications Facebook de Carnets de bord Marine';
  frame.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share');
  host.replaceChildren(frame);
});

