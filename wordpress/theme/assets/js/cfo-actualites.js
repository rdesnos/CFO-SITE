(() => {
  const root = document.querySelector('[data-cfo-actu-live]');
  if (!root || root.dataset.ready === '1') return;
  root.dataset.ready = '1';

  const grid = root.querySelector('[data-cfo-actu-grid]');
  const buttons = [...root.querySelectorAll('[data-category]')];
  const endpoint = 'https://fjpcuxsezeuajhlotzij.supabase.co/functions/v1/cfo-actu-feed?limit=50';
  let items = [];

  const keepTerms = ['marine','tricheur','coeur maladroit','cœur maladroit','ma faute',"restes d'averses",'princesse chaos','escroc',"on m'avait dit"];
  const blockedTerms = ['marine le pen','marine nationale','ex-marine','marine corps'];

  const relevant = (item) => {
    const title = decodeHtml(item.title || '').toLowerCase();
    const excerpt = decodeHtml(item.excerpt || '').toLowerCase();
    const combined = title + ' ' + excerpt;

    if (!item.published_at) return false;
    if (blockedTerms.some(term => combined.includes(term))) return false;
    if (/(biographie|playlist|vidéos? des nrj music awards|lives? des nrj music awards|^star academy$)/i.test(title)) return false;

    return keepTerms.some(term => title.includes(term));
  };

  const tierLabel = (tier) => tier === 'platinum' ? 'Officiel' : tier === 'gold' ? 'Professionnel' : 'Média';
  const decodeHtml = (value) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = String(value || '');
    return textarea.value;
  };

  const dateLabel = (item) => {
    const raw = item.published_at || item.detected_at;
    if (!raw) return '';
    try {
      return new Intl.DateTimeFormat('fr-FR', {day:'numeric',month:'long',year:'numeric'}).format(new Date(raw));
    } catch (_) {
      return '';
    }
  };

  const render = (category = '') => {
    grid.replaceChildren();
    const filtered = (category ? items.filter(item => item.category === category) : items);

    if (!filtered.length) {
      const p = document.createElement('p');
      p.className = 'cfo-actu-empty';
      p.textContent = 'Aucune actualité dans cette catégorie pour le moment.';
      grid.appendChild(p);
      return;
    }

    filtered.forEach(item => {
      const article = document.createElement('article');
      article.className = 'cfo-news-card';

      const imageLink = document.createElement('a');
      imageLink.className = 'cfo-news-image';
      imageLink.href = item.source_url;
      imageLink.target = '_blank';
      imageLink.rel = 'noopener noreferrer';

      const visual = item.thumbnail_status === 'source_image' ? (item.thumbnail_url || item.original_image_url) : (item.source_fallback_visual_url || null);
      if (visual) {
        const img = document.createElement('img');
        img.src = visual;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.addEventListener('error', () => {
          img.remove();
          const span = document.createElement('span');
          span.textContent = 'CFO';
          imageLink.appendChild(span);
        }, {once:true});
        imageLink.appendChild(img);
      } else {
        const span = document.createElement('span');
        span.textContent = 'CFO';
        imageLink.appendChild(span);
      }

      const body = document.createElement('div');
      body.className = 'cfo-news-body';

      const source = document.createElement('div');
      source.className = 'cfo-news-source';
      const badge = document.createElement('span');
      badge.className = 'cfo-source-badge';
      badge.textContent = tierLabel(item.source_tier);
      const sourceName = document.createElement('span');
      sourceName.textContent = item.source_name || '';
      source.append(badge, sourceName);

      const time = document.createElement('time');
      time.textContent = (item.published_at ? 'Publié le ' : 'Repéré le ') + dateLabel(item);
      if (item.published_at) time.dateTime = item.published_at;

      const h2 = document.createElement('h2');
      const titleLink = document.createElement('a');
      titleLink.href = item.source_url;
      titleLink.target = '_blank';
      titleLink.rel = 'noopener noreferrer';
      titleLink.textContent = decodeHtml(item.title || 'Actualité').replace(/\s*\|\s*Sony Music Entertainment France\s*$/i, '');
      h2.appendChild(titleLink);

      body.append(source, time, h2);

      if (item.excerpt) {
        const p = document.createElement('p');
        p.textContent = decodeHtml(item.excerpt);
        body.appendChild(p);
      }

      const more = document.createElement('a');
      more.className = 'cfo-arrow';
      more.href = item.source_url;
      more.target = '_blank';
      more.rel = 'noopener noreferrer';
      more.textContent = 'Voir la source →';
      body.appendChild(more);

      article.append(imageLink, body);
      grid.appendChild(article);
    });
  };

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      render(btn.dataset.category || '');
    });
  });

  fetch(endpoint, {headers:{'Accept':'application/json'}})
    .then(response => {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .then(data => {
      items = (Array.isArray(data.items) ? data.items : [])
        .filter(relevant)
        .sort((a, b) => new Date(b.published_at || b.detected_at || 0) - new Date(a.published_at || a.detected_at || 0));
      render('');
    })
    .catch(() => {
      grid.replaceChildren();
      const p = document.createElement('p');
      p.className = 'cfo-actu-empty';
      p.textContent = 'Le fil d’actualités est temporairement indisponible.';
      grid.appendChild(p);
    });
})();
