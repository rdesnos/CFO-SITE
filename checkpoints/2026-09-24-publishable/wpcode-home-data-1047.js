document.addEventListener('DOMContentLoaded', async () => {
  if (!document.querySelector('.cfo-weekly-front')) return;

  const endpoint = 'https://fjpcuxsezeuajhlotzij.supabase.co/rest/v1/cfo_home_snapshot?select=payload,period_end,generated_at&snapshot_key=eq.marine&limit=1';
  const apikey = 'sb_publishable_VTwtMvGk29IDrz__M99Yag_TYrLzTRG';

  const nf = new Intl.NumberFormat('fr-FR');
  const dateFmt = new Intl.DateTimeFormat('fr-FR', {day:'numeric', month:'short'});
  const signedPct = (v) => {
    if (v === null || v === undefined || Number.isNaN(Number(v))) return '—';
    const n = Number(v);
    return (n > 0 ? '+' : '') + n.toLocaleString('fr-FR', {maximumFractionDigits:1}) + ' %';
  };
  const compact = (v) => {
    const n = Number(v || 0);
    if (n >= 1000000) return (n / 1000000).toLocaleString('fr-FR', {maximumFractionDigits:2}) + ' M';
    if (n >= 1000) return (n / 1000).toLocaleString('fr-FR', {maximumFractionDigits:1}) + ' k';
    return nf.format(n);
  };
  const setTrendColor = (el, v) => {
    if (!el || v === null || v === undefined) return;
    el.style.color = Number(v) < 0 ? '#aa352f' : '#188051';
  };
  const setCompareBars = (pulse, current, previous, pct) => {
    if (!pulse || previous === null || previous === undefined) return;
    const rows = pulse.querySelectorAll('.cfo-weekly-mini-chart > div');
    const max = Math.max(Number(current || 0), Number(previous || 0), 1);
    if (rows[0]) {
      const b = rows[0].querySelector('b');
      if (b) b.style.width = ((Number(previous || 0) / max) * 100).toFixed(1) + '%';
    }
    if (rows[1]) {
      const b = rows[1].querySelector('b');
      if (b) b.style.width = ((Number(current || 0) / max) * 100).toFixed(1) + '%';
    }
    const chart = pulse.querySelector('.cfo-weekly-mini-chart');
    if (chart) chart.classList.toggle('is-down', Number(pct) < 0);
  };
  const setSparkBars = (container, series) => {
    if (!container || !Array.isArray(series) || !series.length) return;
    const vals = series.map(x => Number(x.value)).filter(Number.isFinite);
    if (!vals.length) return;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = Math.max(max - min, 1);
    const bars = container.querySelectorAll('i');
    bars.forEach((bar, i) => {
      const point = series[Math.min(i, series.length - 1)];
      const v = Number(point?.value);
      const pct = Number.isFinite(v) ? 22 + ((v - min) / range) * 70 : 22;
      bar.style.height = pct.toFixed(1) + '%';
      if (point?.date) bar.title = dateFmt.format(new Date(point.date + 'T12:00:00')) + ' · ' + nf.format(v);
    });
  };

  try {
    const res = await fetch(endpoint, {
      headers: { apikey },
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('CFO data HTTP ' + res.status);
    const rows = await res.json();
    if (!rows || !rows.length || !rows[0].payload) throw new Error('CFO data empty');

    const d = rows[0].payload;

    const period = document.querySelector('.cfo-weekly-period');
    if (period && d.period) {
      const start = new Date(d.period.start + 'T12:00:00');
      const end = new Date(d.period.end + 'T12:00:00');
      period.textContent = dateFmt.format(start) + ' → ' + dateFmt.format(end);
    }

    const pulses = document.querySelectorAll('.cfo-weekly-pulse .pulse');
    const pulseData = [d.spotify_monthly, d.streams_weekly, d.airplay_weekly];
    pulses.forEach((pulse, i) => {
      const x = pulseData[i];
      if (!x) return;
      const strong = pulse.querySelector('strong');
      const em = pulse.querySelector('em');
      if (strong) strong.textContent = nf.format(x.value);
      if (em) {
        em.textContent = signedPct(x.change_pct) + (i === 0 ? ' sur la semaine' : ' vs S-1');
        setTrendColor(em, x.change_pct);
      }
      setCompareBars(pulse, x.value, x.previous, x.change_pct);
    });

    const cards = document.querySelectorAll('.cfo-weekly-card');
    const tricheur = cards[0];
    if (tricheur && d.tricheur) {
      const metrics = tricheur.querySelectorAll('.cfo-weekly-metric');
      if (metrics[0]) {
        const s = metrics[0].querySelector('strong');
        const c = metrics[0].querySelector('small');
        if (s) s.textContent = nf.format(d.tricheur.streams);
        if (c) { c.textContent = signedPct(d.tricheur.streams_change_pct) + ' vs S-1'; setTrendColor(c, d.tricheur.streams_change_pct); }
      }
      if (metrics[1]) {
        const s = metrics[1].querySelector('strong');
        const c = metrics[1].querySelector('small');
        if (s) s.textContent = nf.format(d.tricheur.airplay);
        if (c) { c.textContent = signedPct(d.tricheur.airplay_change_pct) + ' vs S-1'; setTrendColor(c, d.tricheur.airplay_change_pct); }
      }
    }

    const catalogue = cards[1];
    if (catalogue && Array.isArray(d.catalogue)) {
      const bars = catalogue.querySelectorAll('.cfo-bars > div');
      const max = Math.max(...d.catalogue.map(x => Number(x.value || 0)), 1);
      d.catalogue.forEach((x, i) => {
        const row = bars[i];
        if (!row) return;
        const label = row.querySelector('span');
        const fill = row.querySelector('i b');
        const strong = row.querySelector('strong');
        const small = row.querySelector('small');
        if (label) label.textContent = x.title;
        if (strong) strong.textContent = nf.format(x.value);
        if (small) { small.textContent = signedPct(x.change_pct); setTrendColor(small, x.change_pct); }
        if (fill) fill.style.width = Math.max(8, Number(x.value || 0) / max * 100).toFixed(1) + '%';
      });
    }

    const audience = cards[2];
    if (audience) {
      const kpis = audience.querySelectorAll('.cfo-audience-kpi');
      if (kpis[0] && d.spotify_monthly) {
        const strong = kpis[0].querySelector('strong');
        const small = kpis[0].querySelector('small');
        if (strong) {
          strong.textContent = nf.format(d.spotify_monthly.value);
          if (d.spotify_monthly.date) strong.title = 'Donnée au ' + dateFmt.format(new Date(d.spotify_monthly.date + 'T12:00:00'));
        }
        if (small && d.spotify_monthly.comparison_valid !== false) {
          const delta = Number(d.spotify_monthly.value) - Number(d.spotify_monthly.previous);
          small.textContent = (delta >= 0 ? '+' : '') + nf.format(delta) + ' · ' + signedPct(d.spotify_monthly.change_pct);
          setTrendColor(small, d.spotify_monthly.change_pct);
        }
      }
      if (kpis[1] && d.youtube_daily) {
        const strong = kpis[1].querySelector('strong');
        const small = kpis[1].querySelector('small');
        if (strong) {
          strong.textContent = nf.format(d.youtube_daily.value);
          if (d.youtube_daily.date) strong.title = 'Donnée au ' + dateFmt.format(new Date(d.youtube_daily.date + 'T12:00:00'));
        }
        if (small && d.youtube_daily.comparison_valid !== false) {
          small.textContent = signedPct(d.youtube_daily.change_pct);
          setTrendColor(small, d.youtube_daily.change_pct);
        }
      }
      setSparkBars(audience.querySelector('.cfo-spark-bars.spotify'), d.spotify_series);
      setSparkBars(audience.querySelector('.cfo-spark-bars.youtube'), d.youtube_series);
    }

    const radio = cards[3];
    if (radio && d.airplay_weekly) {
      const total = radio.querySelector('.cfo-radio-total');
      if (total) {
        const strong = total.querySelector('strong');
        const small = total.querySelector('small');
        if (strong) strong.textContent = nf.format(d.airplay_weekly.value);
        if (small) { small.textContent = signedPct(d.airplay_weekly.change_pct); setTrendColor(small, d.airplay_weekly.change_pct); }
      }
      const rowsRadio = radio.querySelectorAll('.cfo-radio-chart > div:not(.cfo-radio-total)');
      if (Array.isArray(d.radio_top) && d.radio_top.length) {
        const max = Math.max(...d.radio_top.slice(0, rowsRadio.length).map(x => Number(x.spins || 0)), 1);
        d.radio_top.slice(0, rowsRadio.length).forEach((x, i) => {
          const row = rowsRadio[i];
          if (!row) return;
          const label = row.querySelector('span');
          const fill = row.querySelector('i b');
          const strong = row.querySelector('strong');
          if (label) label.textContent = x.title.replace(" (version 2025)", "");
          if (strong) strong.textContent = nf.format(x.spins);
          if (fill) fill.style.width = Math.max(7, Number(x.spins || 0) / max * 100).toFixed(1) + '%';
        });
      }
      const copy = radio.querySelector('p');
      if (copy) {
        copy.textContent = Number(d.airplay_weekly.change_pct) >= 0
          ? 'Le volume radio progresse cette semaine, porté notamment par la montée rapide de Tricheur dans les rotations.'
          : 'Le volume radio recule cette semaine, tandis que Tricheur poursuit son installation dans les rotations.';
      }
    }

    const reps = document.querySelectorAll('.cfo-weekly-reperes > div');
    const repData = [
      null,
      {value:d.spotify_monthly?.value, trend:signedPct(d.spotify_monthly?.change_pct), trendValue:d.spotify_monthly?.change_pct},
      {value:d.streams_weekly?.value, trend:signedPct(d.streams_weekly?.change_pct), trendValue:d.streams_weekly?.change_pct, compact:true},
      {value:d.youtube_daily?.value, trend:signedPct(d.youtube_daily?.change_pct), trendValue:d.youtube_daily?.change_pct},
      {value:d.instagram?.value, trend:d.instagram?.comparison_valid ? ((Number(d.instagram.change_abs) >= 0 ? '+' : '') + nf.format(d.instagram.change_abs)) : (d.instagram?.date ? 'au ' + dateFmt.format(new Date(d.instagram.date + 'T12:00:00')) : '—'), trendValue:null},
      {value:d.airplay_weekly?.value, trend:signedPct(d.airplay_weekly?.change_pct), trendValue:d.airplay_weekly?.change_pct}
    ];
    reps.forEach((rep, i) => {
      if (!repData[i]) return;
      const strong = rep.querySelector('strong');
      const em = rep.querySelector('em');
      if (strong) strong.textContent = repData[i].compact ? compact(repData[i].value) : nf.format(repData[i].value);
      if (em) {
        em.textContent = repData[i].trend;
        if (repData[i].trendValue !== null && repData[i].trendValue !== undefined) setTrendColor(em, repData[i].trendValue);
        else em.style.color = '#6b777b';
      }
    });

    const obsMetrics = document.querySelectorAll('.obs .metric strong');
    if (obsMetrics[0] && d.streams_weekly) obsMetrics[0].textContent = compact(d.streams_weekly.cumulative);
    if (obsMetrics[1] && d.streams_weekly) obsMetrics[1].textContent = '+' + compact(d.streams_weekly.value);
    if (obsMetrics[2] && d.streams_weekly) obsMetrics[2].textContent = signedPct(d.streams_weekly.change_pct);

    document.documentElement.dataset.cfoDataStatus = 'live';
  } catch (err) {
    console.warn('[CFO] Données dynamiques indisponibles, fallback éditorial conservé.', err);
    document.documentElement.dataset.cfoDataStatus = 'fallback';
  }
});