(function(){
  function trendState(value){
    if(value==null||value===''||!Number.isFinite(Number(value)))return 'missing';
    const n=Number(value);
    return Math.abs(n)<1?'neutral':n>0?'up':'down';
  }
  function trendMessage(value,subject){
    const state=trendState(value);
    if(state==='missing')return subject+' : comparaison indisponible';
    if(state==='neutral')return subject+' : stabilité globale';
    const strength=Math.abs(Number(value))>=5?'marquée':'modérée';
    return subject+' : '+(state==='up'?'hausse':'baisse')+' '+strength;
  }
  function validSeries(rows){
    return (Array.isArray(rows)?rows:[]).filter(r=>r&&r.value!=null&&r.value!==''&&Number.isFinite(Number(r.value)));
  }
  // Pure helpers are also exercised by Node without a browser or network.
  if(typeof module==='object'&&module.exports){module.exports={trendState,trendMessage,validSeries};return;}

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
      const stamp=Date.parse(String(r.latest_data_date||'')+'T12:00:00Z');
      const old=!Number.isFinite(stamp)||Date.now()-stamp>7*86400000;
      card.dataset.freshness=old?'stale':'current';
      if(fresh)fresh.textContent='Relevé '+(r.latest_data_date||'sans date')+' · Soundcharts / CFO'+(old?' · Donnée ancienne':'')+' · Airplay '+pct(r.airplay_change_pct);
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
    rows=validSeries(rows);
    if(!container||!rows.length)return;
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
    rows=validSeries(rows);
    if(!svg||rows.length<2)return;
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
    // The server-rendered overlay belongs to the old snapshot. Current points
    // carry their own dated tooltips and must not expose that stale series.
    svg.parentElement?.querySelector('.cfo-spark-hit')?.remove();
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
      c.setAttribute('aria-label',datefr(p.row.date)+' — '+fmt(p.row.value));
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
    const setTrend=(card,value)=>{
      if(!card)return;
      const state=trendState(value);
      card.classList.remove('up','down','neutral');
      card.classList.add(state==='missing'?'neutral':state);
      card.dataset.trend=state;
    };

    const kpis=root.querySelectorAll('.cfo-synth-grid.kpis .kpi-card');
    const audienceCard=kpis[0], streamsCard=kpis[1], airplayCard=kpis[2], socialCard=kpis[3];
    [audience.change_7d_pct,streaming.weekly_rate,airplay.change_7d_pct,social.change_7d_pct].forEach((value,i)=>setTrend(kpis[i],value));

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
      if(meta)meta.textContent=datefr(streaming.period_start)+'–'+datefr(streaming.period_end||streaming.observation_date)+' · S-1 : '+fmt(streaming.weekly_previous)+' · '+fmt(streaming.verified_titles)+' titres vérifiés · '+(streaming.source||'Soundcharts');
    }

    if(airplayCard){
      const em=airplayCard.querySelector('.kpi-top em');
      const v=airplayCard.querySelector('.value');
      const d=airplayCard.querySelector('.delta');
      const ul=airplayCard.querySelector('ul');
      if(em)em.textContent='Passages radios · '+datefr(airplay.period_start)+'–'+datefr(airplay.period_end);
      if(v)v.textContent=fmt(airplay.spins_7d);
      if(d)d.textContent=pct(airplay.change_7d_pct);
      if(ul){
        const top=(airplay.top_7d||[]).slice(0,4);
        ul.replaceChildren();
        top.forEach(x=>{const li=document.createElement('li'),label=document.createElement('span'),value=document.createElement('b');label.textContent=x.title;value.textContent=fmt(x.spins_7d);li.append(label,value);ul.append(li);});
      }
    }

    if(socialCard){
      const v=socialCard.querySelector('.value');
      const d=socialCard.querySelector('.delta');
      const ul=socialCard.querySelector('ul');
      if(v)v.textContent=fmt(social.total);
      if(d)d.textContent=pct(social.change_7d_pct)+' · dates propres à chaque réseau';
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
        td[3].className=trendState(t.weekly_rate)==='missing'?'neutral':trendState(t.weekly_rate);
      }
      if(td[4])td[4].textContent=fmt(t.current_streams);
      if(td[5])td[5].textContent='—';
      if(td[6])td[6].textContent='—';
      if(td[7])td[7].textContent=streaming.weekly_current>0&&t.weekly_current!=null?pct(100*t.weekly_current/streaming.weekly_current):'—';
    });

    const channels=root.querySelectorAll('.cfo-synth-grid.channels .cfo-channel');
    [audience.change_7d_pct,streaming.weekly_rate,airplay.change_7d_pct,social.tiktok_change_7d_pct,social.instagram_change_7d_pct].forEach((value,i)=>setTrend(channels[i],value));
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

    updateMarineNarrative(root,marine,series||{});
    updateMarineCharts(root,series||{});
    root.dataset.live='1';
  }

  async function rpc(name){
    const r=await fetch(RPC+name,{
      method:'POST',
      headers:{apikey:KEY,'Content-Type':'application/json'},
      body:'{}',
      signal:AbortSignal.timeout(15000)
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

  function updateMarineNarrative(root,marine,series){
    const streaming=marine.streaming||{}, audience=marine.audience||{}, social=marine.social||{}, airplay=marine.airplay||{};
    let reading=root.querySelector('.cfo-reading-summary');
    if(!reading){reading=document.createElement('section');reading.className='cfo-synth-section cfo-synth-card cfo-reading-summary';reading.setAttribute('aria-label','Lecture de la semaine');root.prepend(reading);}
    reading.replaceChildren();
    const heading=document.createElement('h2');heading.textContent='Ce que montrent les relevés';
    const message=document.createElement('p');message.className='cfo-reading-message';
    message.style.cssText='font-size:20px;line-height:1.5;font-weight:600;margin:0 0 12px';
    message.textContent=trendMessage(streaming.weekly_rate,'Écoutes Spotify')+' ; '+trendMessage(airplay.change_7d_pct,'présence radio')+'.';
    const evidence=document.createElement('p');evidence.textContent=fmt(streaming.weekly_current)+' écoutes, '+pct(streaming.weekly_rate)+' ; '+fmt(airplay.spins_7d)+' passages radio, '+pct(airplay.change_7d_pct)+'. Du '+datefr(streaming.period_start)+' au '+datefr(streaming.period_end)+', comparé aux sept jours précédents. Source : Soundcharts / CFO.';
    const detail=document.createElement('p');detail.textContent=trendMessage(audience.change_7d_pct,'Audience mensuelle Spotify')+' sur sept jours, relevé au '+datefr(audience.observation_date)+'. Ces mouvements ne prouvent pas un lien de causalité.';
    evidence.style.cssText='font-size:16px;line-height:1.6;margin:0 0 10px;max-width:75ch';
    detail.style.cssText='display:block;font-size:14px;line-height:1.6;max-width:85ch';
    reading.append(heading,message,evidence,detail);
    const motors=root.querySelectorAll('.cfo-motor');
    const cards=[
      {title:'Dynamique du catalogue',signal:trendMessage(streaming.weekly_rate,'Les écoutes'),rate:streaming.weekly_rate,a:'Streams sur 7 jours',av:fmt(streaming.weekly_current),b:'Variation S/S-1',bv:pct(streaming.weekly_rate),date:streaming.observation_date,rows:series.streaming_daily},
      {title:'Dynamique de l’audience',signal:trendMessage(audience.change_7d_pct,'L’audience Spotify'),rate:audience.change_7d_pct,a:'Auditeurs mensuels',av:fmt(audience.spotify_monthly_listeners),b:'Variation sur 7 jours',bv:pct(audience.change_7d_pct),date:audience.observation_date,rows:series.audience_spotify?.slice(-7)},
      {title:'Lecture croisée',signal:'Des périodes distinctes à comparer avec précaution',rate:null,a:'Abonnements sociaux · 7 j',av:pct(social.change_7d_pct),b:'Auditeurs Spotify · 7 j',bv:pct(audience.change_7d_pct),date:audience.observation_date,rows:[]}
    ];
    motors.forEach((card,i)=>{
      const data=cards[i];if(!data)return;
      const state=trendState(data.rate);
      card.classList.remove('up','down','neutral','watchtone');card.classList.add(state==='missing'?'neutral':state);
      const arrow=card.querySelector('.motor-title span');if(arrow)arrow.textContent=state==='up'?'↗':state==='down'?'↘':state==='neutral'?'→':'—';
      const title=card.querySelector('.motor-title b'),signal=card.querySelector('.signal'),pill=card.querySelector('.pill');
      if(title)title.textContent=data.title;if(signal)signal.textContent=data.signal;
      const pairs=card.querySelectorAll('.pair');
      [[data.a,data.av],[data.b,data.bv]].forEach((pair,j)=>{const label=pairs[j]?.querySelector('span'),value=pairs[j]?.querySelector('b');if(label)label.textContent=pair[0];if(value)value.textContent=pair[1];});
      if(pill)pill.textContent='Relevé au '+datefr(data.date)+' · Soundcharts';
      const bars=card.querySelector('.motor-bars');if(bars){bars.replaceChildren();chartHeightSeries(bars,data.rows||[],data.signal);}
    });
    const watches=root.querySelectorAll('.cfo-watch');
    const socialNote=watches[1]?.querySelector('p'),streamNote=watches[2]?.querySelector('p');
    if(socialNote)socialNote.textContent='Abonnements sociaux : '+pct(social.change_7d_pct)+' · audience Spotify : '+pct(audience.change_7d_pct)+' sur 7 jours. Dates propres à chaque canal.';
    if(streamNote)streamNote.textContent='Catalogue qualifié : '+pct(streaming.weekly_rate)+' vs S-1 · période du '+datefr(streaming.period_start)+' au '+datefr(streaming.period_end)+'.';
    const streamTitle=watches[2]?.querySelector('strong');if(streamTitle)streamTitle.textContent='Dynamique du catalogue';
    const periodHeading=document.querySelector('.mhs-title span');if(periodHeading)periodHeading.textContent='du '+datefr(streaming.period_start)+' au '+datefr(streaming.period_end);
  }

  function updateHealth(health,changes=[],shazam=[]){
    const root=document.querySelector('#marine.cfo-synthese');
    if(!root)return;
    let details=root.querySelector('.cfo-data-health');
    if(!details){details=document.createElement('details');details.className='cfo-data-health';root.append(details);}
    details.replaceChildren();
    const summary=document.createElement('summary');summary.textContent='Dates des relevés et état des sources';details.append(summary);
    const note=document.createElement('p');note.textContent='Les abonnements des réseaux sont cumulés : ils ne représentent pas des personnes uniques. Chaque canal peut avoir une date de relevé différente.';details.append(note);
    if(!health||!Array.isArray(health.items)){const p=document.createElement('p');p.textContent='Le contrôle de fraîcheur est temporairement indisponible.';details.append(p);return;}
    const labels={fresh:'À jour',lagging:'Relevé en retard',stale:'Donnée ancienne',missing:'Relevé absent'};
    const list=document.createElement('dl');
    health.items.forEach(item=>{
      const row=document.createElement('div');const dt=document.createElement('dt');const dd=document.createElement('dd');
      dt.textContent=(item.platform||'Source')+' · '+(item.metric_type||item.metric_key);
      dd.textContent=(labels[item.freshness_status]||'État inconnu')+' · '+(item.latest_observation_date||'Sans date')+' · '+(item.source_code||'CFO');
      if(item.details?.fresh_tracks!=null)dd.textContent+=' · '+fmt(item.details.fresh_tracks)+'/'+fmt(item.details.expected_tracks)+' titres avec relevé récent';
      row.dataset.state=item.freshness_status;row.append(dt,dd);list.append(row);
    });details.append(list);
    const addRow=(parent,label,value)=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;row.append(dt,dd);parent.append(row);};
    if(changes.length){
      const heading=document.createElement('h3');heading.textContent='Variations sur 30 jours · dates exactes';details.append(heading);
      const changesList=document.createElement('dl');
      changes.filter(x=>['followers','monthly_listeners','views_daily','views_total'].includes(x.metric_type)).forEach(x=>{
        addRow(changesList,x.platform+' · '+x.metric_type,fmt(x.value)+' au '+x.date+' · '+(x.comparison_valid?pct(x.change_30d_pct)+' depuis le '+x.previous_date:'Comparaison indisponible')+(x.lag_days>3?' · Donnée ancienne':''));
      });details.append(changesList);
    }
    if(shazam.length){
      const heading=document.createElement('h3');heading.textContent='Comptages Shazam · titres qualifiés';details.append(heading);
      const counts=document.createElement('dl');
      shazam.forEach(x=>addRow(counts,x.title,fmt(x.value)+' · '+(x.date||'Sans relevé')+' · '+(labels[x.freshness_status]||'État inconnu')+' · Soundcharts'));
      details.append(counts);
    }
  }

  async function run(){
    const [dashboardResult,panelResult,healthResult]=await Promise.allSettled([
      rpc('cfo_marine_dashboard_public_v1'),rpc('cfo_panel_snapshot_v1'),rpc('cfo_marine_data_health')
    ]);
    if(panelResult.status==='fulfilled')updatePanel(Array.isArray(panelResult.value)?panelResult.value:[]);
    if(dashboardResult.status==='fulfilled'){
      const marine=dashboardResult.value?.marine||null;
      updateProjections(projectionsFromMarine(marine),certificationFromMarine(marine));
      updateMarine(marine,dashboardResult.value?.series||{});
    }
    updateHealth(healthResult.status==='fulfilled'?healthResult.value:null,dashboardResult.value?.metrics_30d||[],dashboardResult.value?.shazam||[]);
    const complete=dashboardResult.status==='fulfilled'&&panelResult.status==='fulfilled';
    document.documentElement.dataset.cfoObservatoryLive=complete?'1':'partial';
    if(!complete){
      const notice=document.createElement('p');notice.setAttribute('role','status');notice.className='cfo-data-health';
      notice.textContent='Une partie des relevés ne peut pas être actualisée. Les valeurs non actualisées correspondent à la dernière version enregistrée sur le site.';
      document.querySelector('#marine.cfo-synthese')?.append(notice);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);
  else run();
})();

