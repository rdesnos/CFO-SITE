document.addEventListener('DOMContentLoaded', async () => {
  const root = document.querySelector('.mhs');
  if (!root) return;
  const nf = new Intl.NumberFormat('fr-FR');
  const pct = v => {
    if (v === null || v === undefined || Number.isNaN(Number(v))) return '—';
    const n = Number(v);
    return (n > 0 ? '+' : '') + n.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' %';
  };
  try {
    const res = await fetch('https://fjpcuxsezeuajhlotzij.supabase.co/rest/v1/rpc/cfo_cockpit_snapshot?p_artist_slug=marine', {
      headers: { apikey: 'sb_publishable_VTwtMvGk29IDrz__M99Yag_TYrLzTRG' },
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const d = await res.json();
    const h = d.home || {}, o = d.observatoire || {}, v = d.verified || {};
    const aud = Array.isArray(o.audience_metrics) ? o.audience_metrics : [];
    const tracks = Array.isArray(v.tracks) ? v.tracks : [];
    const m = (p,t) => aud.find(x => x.platform === p && x.metric_type === t);
    const t = name => tracks.find(x => (x.title || '').toLowerCase() === name.toLowerCase());

    if (h.period) {
      const f = x => new Date(x + 'T12:00:00').toLocaleDateString('fr-FR');
      const e = root.querySelector('.mhs-title span');
      if (e) e.textContent = 'du ' + f(h.period.start) + ' au ' + f(h.period.end);
    }

    const sm = h.spotify_monthly || m('spotify','monthly_listeners');
    const sf = m('spotify','followers');
    const ig = m('instagram','followers');
    const tk = m('tiktok','followers');
    const fb = m('facebook','followers');
    const yf = m('youtube','followers');
    const yv = m('youtube','views_total');
    const yd = h.youtube_daily || m('youtube','views_daily');
    const df = m('deezer','followers');

    const lg = root.querySelectorAll('.aud-mix .legend b');
    [[lg[0],sf],[lg[1],yf],[lg[2],df]].forEach(([e,x]) => { if (e && x) e.textContent = nf.format(x.value); });

    const sp = root.querySelector('.aud-spotify .metric-line');
    if (sp && sm) {
      const prev = sm.previous ?? sm.previous_value;
      const delta = prev == null ? null : Number(sm.value) - Number(prev);
      const a = sp.querySelector('b'), b = sp.querySelector('span'), c = sp.querySelector('em');
      if (a) a.textContent = nf.format(sm.value);
      if (b && prev != null) b.textContent = 'S-1 ' + nf.format(prev);
      if (c && delta != null) c.textContent = (delta >= 0 ? '+' : '') + nf.format(delta) + ' · ' + pct(sm.change_pct ?? sm.delta_pct);
    }

    const sr = root.querySelectorAll('.aud-social tbody tr');
    [ig,tk,fb,yf].forEach((x,i) => {
      const row = sr[i]; if (!row || !x) return;
      const c = row.querySelectorAll('td');
      if (c[0]) c[0].textContent = nf.format(x.value);
      if (c[1] && x.delta != null) c[1].textContent = (x.delta >= 0 ? '+' : '') + nf.format(x.delta);
    });

    const strip = root.querySelectorAll('.aud-strip>div');
    [yv,yd,m('tiktok','likes_total'),m('instagram','posts_total'),m('youtube','posts_total')].forEach((x,i) => {
      const e = strip[i]; if (!e || !x) return;
      const b = e.querySelector('b'); if (b) b.textContent = nf.format(x.value);
      if (i < 2) { const em = e.querySelector('em'); if (em) em.textContent = pct(x.change_pct ?? x.delta_pct); }
    });

    const aliases = {
      'TRICHEUR':'Tricheur',
      'CŒUR MALADROIT':'Coeur maladroit',
      'MA FAUTE':'Ma faute (version 2025)',
      'RESTES D’AVERSES':"Restes d'averses",
      'ESCROC':'Escroc',
      'ON M’AVAIT DIT':"On m'avait dit",
      'PRINCESSE CHAOS':"Princesse chaos (Marine's Version)"
    };
    root.querySelectorAll('.track-matrix tbody tr').forEach(row => {
      const k = (row.querySelector('td:first-child b')?.textContent || '').trim();
      const x = t(aliases[k]); if (!x) return;
      const c = row.querySelectorAll('td');
      const vals = [x.current_streams,x.weekly_previous,x.weekly_current,pct(x.weekly_rate),x.mm7,x.mm14,x.mm30];
      [1,2,3,4,5,6,7].forEach((idx,j) => { if (c[idx]) c[idx].textContent = typeof vals[j] === 'number' ? nf.format(vals[j]) : vals[j]; });
    });

    if (v.summary) {
      const g = root.querySelector('.global-box');
      if (g) {
        const big = g.querySelector('.big-number'), ks = g.querySelectorAll('.album-kpis b');
        if (big) big.textContent = nf.format(v.summary.current_streams);
        [v.summary.weekly_previous,v.summary.weekly_current,v.summary.mm7,pct(v.summary.weekly_rate)].forEach((x,i) => {
          if (ks[i]) ks[i].textContent = typeof x === 'number' ? nf.format(x) : x;
        });
      }
    }

    const at = h.airplay_weekly, tr = h.tricheur;
    const glob = root.querySelector('.air-card.global .air-total');
    if (glob && at) {
      const b = glob.querySelector('b'), s = glob.querySelector('span'), e = glob.querySelector('em');
      if (b) b.textContent = nf.format(at.value);
      if (s) s.textContent = 'S-1 ' + nf.format(at.previous);
      if (e) e.textContent = pct(at.change_pct);
    }
    const tc = root.querySelector('.air-card.tricheur .air-total');
    if (tc && tr) {
      const b = tc.querySelector('b'), s = tc.querySelector('span'), e = tc.querySelector('em');
      if (b) b.textContent = nf.format(tr.airplay);
      if (s) s.textContent = 'S-1 ' + nf.format(tr.airplay_previous);
      if (e) e.textContent = pct(tr.airplay_change_pct);
    }

    document.documentElement.dataset.cfoCockpitData = 'live';
  } catch (e) {
    console.warn('[CFO] Cockpit data fallback', e);
    document.documentElement.dataset.cfoCockpitData = 'fallback';
  }
});