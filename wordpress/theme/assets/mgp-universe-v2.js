**assets/mgp-universe-v2.js**
411 lines
```
(function(){
	'use strict';

	var root=document.querySelector('[data-mgp3d]');
	if(!root||root.dataset.ready==='1')return;
	root.dataset.ready='1';

	var scene=root.querySelector('[data-mgp3d-scene]');
	var canvas=root.querySelector('[data-mgp3d-canvas]');
	var ctx=canvas.getContext('2d',{alpha:true});
	var labels=root.querySelector('[data-mgp3d-labels]');
	var panel=root.querySelector('[data-mgp3d-panel]');
	var closePanel=root.querySelector('[data-mgp3d-close]');
	var timeInput=root.querySelector('[data-mgp3d-time]');
	var timeLabel=root.querySelector('[data-mgp3d-time-label]');
	var playButton=root.querySelector('[data-mgp3d-play]');
	var dateLabel=root.querySelector('[data-mgp3d-date]');
	var modeButtons=[].slice.call(root.querySelectorAll('[data-mgp3d-mode]'));

	var endpoints=(window.CFO_MGP_3D||{}).endpoints||{};
	var dpr=Math.min(2,window.devicePixelRatio||1);
	var W=0,H=0,cx=0,cy=0;
	var state={snapshot:null,news:[],live:[],mode:'ecosysteme',time:100,playing:false};
	var camera={yaw:-0.28,pitch:0.52,zoom:1.0,targetYaw:-0.28,targetPitch:0.52,targetZoom:1.0};
	var pointer={down:false,x:0,y:0,lastX:0,lastY:0};
	var projected=[];
	var animationStart=performance.now();
	var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	var galaxyDefs=[
		{id:'music',name:'Musique',icon:'♪',color:'#1764a3',radius:3.25,angle:-1.83,tilt:.26,spin:.10},
		{id:'media',name:'Médias',icon:'▤',color:'#9a7659',radius:3.6,angle:-.76,tilt:-.18,spin:.075},
		{id:'live',name:'Live',icon:'♬',color:'#b63d33',radius:3.35,angle:.28,tilt:.16,spin:.105},
		{id:'cinema',name:'Cinéma',icon:'▰',color:'#7f756d',radius:3.95,angle:.98,tilt:-.25,spin:.064,dormant:true},
		{id:'social',name:'Réseaux',icon:'⌘',color:'#175b9b',radius:3.58,angle:1.93,tilt:.31,spin:.12},
		{id:'artists',name:'Artistes',icon:'♙',color:'#b18461',radius:3.9,angle:2.78,tilt:-.11,spin:.07}
	];

	function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
	function num(v){v=Number(v);return Number.isFinite(v)?v:null}
	function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]})}
	function dateOnly(v){return v?String(v).slice(0,10):''}
	function daysAgo(date){
		if(!date)return 999;
		var t=Date.parse(date);
		if(!Number.isFinite(t))return 999;
		return Math.max(0,(Date.now()-t)/86400000);
	}
	function freshness(date){return clamp(100-daysAgo(date)*3,18,100)}
	function massSize(v,min,max){var n=num(v);if(n==null)return min;return min+(max-min)*Math.sqrt(clamp(n,0,100)/100)}

	function resize(){
		var r=scene.getBoundingClientRect();
		W=Math.max(320,r.width);H=Math.max(620,r.height);cx=W*.52;cy=H*.51;
		canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
		canvas.style.width=W+'px';canvas.style.height=H+'px';
		ctx.setTransform(dpr,0,0,dpr,0,0);
	}
	window.addEventListener('resize',resize,{passive:true});
	resize();

	function rotX(p,a){var c=Math.cos(a),s=Math.sin(a);return{x:p.x,y:p.y*c-p.z*s,z:p.y*s+p.z*c}}
	function rotY(p,a){var c=Math.cos(a),s=Math.sin(a);return{x:p.x*c+p.z*s,y:p.y,z:-p.x*s+p.z*c}}
	function rotZ(p,a){var c=Math.cos(a),s=Math.sin(a);return{x:p.x*c-p.y*s,y:p.x*s+p.y*c,z:p.z}}

	function viewPoint(p){
		var q=rotY(p,camera.yaw);
		q=rotX(q,camera.pitch);
		var cameraZ=11/camera.zoom;
		var z=q.z+cameraZ;
		var f=Math.min(W,H)*1.03/z;
		return{x:cx+q.x*f,y:cy-q.y*f,scale:f/92,depth:z,world:q};
	}

	function galaxyMass(id){
		var s=state.snapshot||{},f=s.forces||{},panel=Array.isArray(s.panel)?s.panel:[];
		if(id==='music'){
			var vals=[num(f.streaming&&f.streaming.score),num(f.airplay&&f.airplay.score)].filter(function(v){return v!=null});
			return vals.length?vals.reduce(function(a,b){return a+b},0)/vals.length:null;
		}
		if(id==='media')return num(f.media&&f.media.score);
		if(id==='social')return num(f.social&&f.social.score);
		if(id==='live')return num(f.live&&f.live.score);
		if(id==='artists'){
			var vals2=panel.filter(function(x){return x.slug!=='marine'}).map(function(x){return num(x.mass)}).filter(function(v){return v!=null});
			return vals2.length?vals2.reduce(function(a,b){return a+b},0)/vals2.length:null;
		}
		return null;
	}

	function galaxyStars(id){
		var snap=state.snapshot||{},panel=Array.isArray(snap.panel)?snap.panel:[];
		if(id==='music'){
			return[
				{name:'Tricheur',mass:90},{name:'Cœur maladroit',mass:74},{name:'Ma faute',mass:82},{name:'Restes d’averses',mass:58},{name:'Escroc',mass:52},{name:'D’accord',mass:45}
			];
		}
		if(id==='media'){
			return state.news.slice(0,7).map(function(n,i){return{name:n.title||n.source_title||n.source_name||'Actualité',mass:num(n.priority_score)||num(n.relevance_score)||70,date:n.published_at,url:n.source_url||n.canonical_url,type:'media'}});
		}
		if(id==='live'){
			return state.live.slice(0,7).map(function(e){return{name:e.city||e.title||e.venue||'Date live',mass:num(e.importance_score)||68,date:e.event_date,url:e.ticket_url||e.official_url||e.source_url,type:'live'}});
		}
		if(id==='social')return[{name:'Instagram',mass:86},{name:'TikTok',mass:78},{name:'YouTube',mass:67},{name:'Spotify',mass:72},{name:'Facebook',mass:48}];
		if(id==='artists')return panel.filter(function(a){return a.slug!=='marine'}).slice(0,8).map(function(a){return{name:a.name,mass:num(a.mass)||30,trend:a.state}});
		if(id==='cinema')return[];
		return[];
	}

	function galaxyPosition(g,t){
		var baseAngle=g.angle+(reduced?0:t*g.spin*.10);
		var r=g.radius;
		var p={x:Math.cos(baseAngle)*r,y:0,z:Math.sin(baseAngle)*r};
		p=rotZ(p,g.tilt);
		p=rotX(p,g.tilt*.55);
		return p;
	}

	function rgba(hex,a){
		var h=hex.replace('#',''),n=parseInt(h,16);
		return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';
	}

	function drawOrb(x,y,r,color,glow){
		if(r<1)return;
		ctx.save();
		if(glow){
			ctx.shadowColor=color;ctx.shadowBlur=Math.min(40,r*1.6);
		}
		var grad=ctx.createRadialGradient(x-r*.32,y-r*.32,r*.08,x,y,r);
		grad.addColorStop(0,'rgba(255,255,255,.98)');
		grad.addColorStop(.18,rgba(color,.92));
		grad.addColorStop(.64,color);
		grad.addColorStop(1,'rgba(4,15,24,.92)');
		ctx.fillStyle=grad;
		ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
		ctx.strokeStyle='rgba(255,255,255,.42)';ctx.lineWidth=1;ctx.stroke();
		ctx.restore();
	}

	function drawOrbit(center3,radius,tilt,color,alpha,lineWidth,phase){
		ctx.beginPath();
		var started=false;
		for(var i=0;i<=96;i++){
			var a=(i/96)*Math.PI*2+(phase||0);
			var local={x:Math.cos(a)*radius,y:0,z:Math.sin(a)*radius};
			local=rotZ(local,tilt);
			local=rotX(local,tilt*.55);
			var p={x:center3.x+local.x,y:center3.y+local.y,z:center3.z+local.z};
			var s=viewPoint(p);
			if(!started){ctx.moveTo(s.x,s.y);started=true}else ctx.lineTo(s.x,s.y);
		}
		ctx.strokeStyle=rgba(color,alpha);ctx.lineWidth=lineWidth||1;ctx.stroke();
	}

	function drawTrail(from,to,color,intensity){
		ctx.save();
		var g=ctx.createLinearGradient(from.x,from.y,to.x,to.y);
		g.addColorStop(0,rgba(color,0));g.addColorStop(.52,rgba(color,.18*intensity));g.addColorStop(1,rgba(color,.92*intensity));
		ctx.strokeStyle=g;ctx.lineWidth=1.4+intensity*1.8;ctx.shadowColor=color;ctx.shadowBlur=12;
		ctx.beginPath();ctx.moveTo(from.x,from.y);
		var mx=(from.x+to.x)/2,my=Math.min(from.y,to.y)-40-35*intensity;
		ctx.quadraticCurveTo(mx,my,to.x,to.y);ctx.stroke();ctx.restore();
	}

	function render(timeMs){
		var t=(timeMs-animationStart)/1000;
		camera.yaw+=(camera.targetYaw-camera.yaw)*.08;
		camera.pitch+=(camera.targetPitch-camera.pitch)*.08;
		camera.zoom+=(camera.targetZoom-camera.zoom)*.08;

		ctx.clearRect(0,0,W,H);
		projected=[];

		// ambient stars / particles
		ctx.save();
		for(var i=0;i<70;i++){
			var sx=(Math.sin(i*91.7+1.2)*.5+.5)*W,sy=(Math.cos(i*47.3+2.7)*.5+.5)*H;
			var tw=.15+.2*(.5+.5*Math.sin(t*.7+i));
			ctx.fillStyle='rgba(255,235,207,'+tw+')';ctx.beginPath();ctx.arc(sx,sy,1+(i%5===0?1:0),0,Math.PI*2);ctx.fill();
		}
		ctx.restore();

		// macro orbital shells
		drawOrbit({x:0,y:0,z:0},4.0,.15,'#ffffff',.16,1,t*.002);
		drawOrbit({x:0,y:0,z:0},4.8,-.12,'#d6e3ed',.12,1,-t*.002);
		drawOrbit({x:0,y:0,z:0},5.5,.29,'#e9b18e',.10,1,t*.0015);

		var galaxies=[];
		galaxyDefs.forEach(function(g){
			var pos=galaxyPosition(g,t);
			var mass=galaxyMass(g.id);
			var screen=viewPoint(pos);
			galaxies.push({def:g,pos:pos,screen:screen,mass:mass,stars:galaxyStars(g.id)});
			drawOrbit(pos,.82+massSize(mass,.10,.32),g.tilt,g.color,.34,1.15,t*g.spin*.22);
			drawOrbit(pos,1.13+massSize(mass,.08,.26),-g.tilt*.72,g.color,.19,.8,-t*g.spin*.17);
		});

		// central orbital field
		drawOrbit({x:0,y:0,z:0},1.05,.12,'#ee9270',.48,1.3,t*.025);
		drawOrbit({x:0,y:0,z:0},1.36,-.18,'#f6c0a1',.27,1,t*.018);
		drawOrbit({x:0,y:0,z:0},1.72,.22,'#ffffff',.14,.8,-t*.013);

		// stars inside galaxies
		galaxies.forEach(function(gObj,gIndex){
			var count=Math.min(gObj.stars.length,8);
			for(var s=0;s<count;s++){
				var star=gObj.stars[s];
				var angle=(s/Math.max(1,count))*Math.PI*2+t*(.07+.012*s)+(gIndex*.66);
				var rr=.55+(s%3)*.18;
				var local={x:Math.cos(angle)*rr,y:0,z:Math.sin(angle)*rr};
				local=rotZ(local,gObj.def.tilt*.9);local=rotX(local,gObj.def.tilt*.45);
				var p={x:gObj.pos.x+local.x,y:gObj.pos.y+local.y,z:gObj.pos.z+local.z};
				var screen=viewPoint(p);
				var r=massSize(star.mass,5,13)*screen.scale*2.2;
				projected.push({kind:'star',depth:screen.depth,x:screen.x,y:screen.y,r:r,color:gObj.def.color,data:star,galaxy:gObj.def});
			}
		});

		// main galaxy suns
		galaxies.forEach(function(gObj){
			var r=massSize(gObj.mass,24,42)*gObj.screen.scale*2.25;
			if(gObj.def.dormant||gObj.mass==null)r*=.72;
			projected.push({kind:'galaxy',depth:gObj.screen.depth,x:gObj.screen.x,y:gObj.screen.y,r:r,color:gObj.def.color,data:gObj});
		});

		// Marine fixed center
		var marineMass=marineMassAtTime();
		var cs=viewPoint({x:0,y:0,z:0});
		var cr=massSize(marineMass,48,78)*cs.scale*2.4;
		projected.push({kind:'marine',depth:cs.depth-.5,x:cs.x,y:cs.y,r:cr,color:'#c43c31',data:{mass:marineMass}});

		projected.sort(function(a,b){return b.depth-a.depth});
		projected.forEach(function(o){
			if(o.kind==='star')drawOrb(o.x,o.y,o.r,o.color,false);
			else if(o.kind==='galaxy')drawOrb(o.x,o.y,o.r,o.color,true);
			else drawOrb(o.x,o.y,o.r,o.color,true);
		});

		// event trajectories
		var eventObjs=normalizedEvents();
		eventObjs.slice(0,6).forEach(function(ev,i){
			var gal=galaxies.find(function(g){return g.def.id===ev.galaxy})||galaxies[i%galaxies.length];
			if(!gal)return;
			var evtAngle=gal.def.angle+.42+(i*.47);
			var evt3={x:gal.pos.x+Math.cos(evtAngle)*1.45,y:gal.pos.y+.25*Math.sin(i),z:gal.pos.z+Math.sin(evtAngle)*1.45};
			var evt=viewPoint(evt3);
			var core=viewPoint(gal.pos);
			drawTrail(evt,core,gal.def.color,.8);
			drawOrb(evt.x,evt.y,5.5*evt.scale,gal.def.color,true);
			ev.screen=evt;
		});

		updateLabels(galaxies,eventObjs);
		requestAnimationFrame(render);
	}

	function marineMassAtTime(){
		var snap=state.snapshot||{},traj=Array.isArray(snap.trajectory)?snap.trajectory:[];
		if(!traj.length)return num(snap.snapshot&&snap.snapshot.mass)||45;
		var idx=Math.round((state.time/100)*(traj.length-1));
		return num(traj[clamp(idx,0,traj.length-1)].mass)||num(snap.snapshot&&snap.snapshot.mass)||45;
	}

	function normalizedEvents(){
		var out=[];
		state.news.forEach(function(n,i){
			out.push({type:'Média',name:n.title||n.source_title||n.source_name||'Actualité média',date:dateOnly(n.published_at||n.detected_at),url:n.source_url||n.canonical_url||'',galaxy:'media',fresh:freshness(n.published_at||n.detected_at),mass:num(n.priority_score)||num(n.relevance_score)||70});
		});
		state.live.forEach(function(e){
			out.push({type:'Live',name:e.title||e.city||e.venue||'Date live',date:dateOnly(e.event_date),url:e.ticket_url||e.official_url||e.source_url||'',galaxy:'live',fresh:freshness(e.event_date),mass:num(e.importance_score)||70,city:e.city,venue:e.venue});
		});
		var impulses=(state.snapshot&&Array.isArray(state.snapshot.impulses))?state.snapshot.impulses:[];
		impulses.slice(-4).forEach(function(e){
			out.push({type:'Signal MGP',name:e.title||'Impulsion MGP',date:e.date,url:e.source_url||'',galaxy:'music',fresh:freshness(e.date),mass:num(e.magnitude)||60,description:e.description||''});
		});
		return out.sort(function(a,b){return String(b.date).localeCompare(String(a.date))});
	}

	var labelNodes={};
	function ensureGalaxyLabel(g){
		var key='galaxy-'+g.id;
		if(labelNodes[key])return labelNodes[key];
		var b=document.createElement('button');
		b.type='button';b.className='mgp3d__label';b.dataset.key=key;
		b.innerHTML='<span class="mgp3d__label-core"></span><span class="mgp3d__label-name">'+esc(g.name)+'</span>';
		b.style.setProperty('--label-color',g.color);
		b.querySelector('.mgp3d__label-core').textContent=g.icon;
		b.addEventListener('click',function(){showGalaxy(g.id)});
		labels.appendChild(b);labelNodes[key]=b;return b;
	}
	function ensureEventCard(ev,index){
		var key='event-'+index;
		if(labelNodes[key])return labelNodes[key];
		var b=document.createElement('button');b.type='button';b.className='mgp3d__event-card';b.dataset.key=key;
		b.addEventListener('click',function(){showEvent(normalizedEvents()[index])});
		labels.appendChild(b);labelNodes[key]=b;return b;
	}
	function updateLabels(galaxies,events){
		galaxies.forEach(function(gObj){
			var node=ensureGalaxyLabel(gObj.def);
			var scale=clamp(gObj.screen.scale*1.35,.72,1.2);
			var base=massSize(gObj.mass,58,88)*(gObj.mass==null?.76:1);
			node.style.setProperty('--label-size',Math.round(base)+'px');
			node.style.transform='translate(-50%,-50%) translate('+gObj.screen.x+'px,'+gObj.screen.y+'px) scale('+scale+')';
			node.style.opacity=clamp(1-(gObj.screen.depth-10)*.12,.55,1);
			node.style.zIndex=String(Math.round(1000-gObj.screen.depth*10));
			node.classList.toggle('is-dormant',gObj.mass==null||gObj.def.dormant);
		});
		events.slice(0,6).forEach(function(ev,i){
			if(!ev.screen)return;
			var node=ensureEventCard(ev,i);
			node.innerHTML='<b>'+esc(ev.name)+'</b><small>'+esc(ev.date||ev.type)+'</small>';
			node.style.transform='translate(-50%,-50%) translate('+ev.screen.x+'px,'+ev.screen.y+'px)';
			node.style.zIndex='1200';
			node.style.opacity=state.mode==='ecosysteme'?.9:1;
		});
	}

	function setMetric(key,value,label){
		var bar=panel.querySelector('[data-metric-bar="'+key+'"]');
		var val=panel.querySelector('[data-metric-value="'+key+'"]');
		if(bar)bar.style.width=clamp(Number(value)||0,0,100)+'%';
		if(val)val.textContent=label;
	}
	function openPanel(){panel.classList.remove('is-hidden')}
	function showMarine(){
		var snap=state.snapshot||{},mass=marineMassAtTime(),date=(snap.snapshot&&snap.snapshot.date)||'';
		panel.querySelector('[data-mgp3d-panel-title]').textContent='Marine';
		panel.querySelector('[data-mgp3d-panel-subtitle]').textContent='Centre fixe · '+(date||'MGP');
		panel.querySelector('[data-mgp3d-panel-copy]').textContent='Point de référence de l’univers. Sa position reste fixe ; sa taille évolue avec son poids MGP dans le temps.';
		setMetric('mass',mass,mass.toFixed(1));
		setMetric('proximity',100,'Centre');
		setMetric('freshness',freshness(date),freshness(date)>70?'Récente':'À rafraîchir');
		var mom=num(snap.snapshot&&snap.snapshot.momentum)||0;
		setMetric('trend',clamp(50+mom*4,0,100),mom>1?'En hausse':mom<-1?'En baisse':'Stable');
		var link=panel.querySelector('[data-mgp3d-panel-link]');link.hidden=true;openPanel();
	}
	function showGalaxy(id){
		var def=galaxyDefs.find(function(g){return g.id===id});if(!def)return;
		var mass=galaxyMass(id),stars=galaxyStars(id);
		panel.querySelector('[data-mgp3d-panel-title]').textContent=def.name;
		panel.querySelector('[data-mgp3d-panel-subtitle]').textContent=mass==null?'Galaxie visible · poids non mesuré':'Galaxie MGP';
		panel.querySelector('[data-mgp3d-panel-copy]').textContent=mass==null?'Cette galaxie est présente dans l’univers mais son poids n’est pas encore alimenté de façon suffisamment fiable pour être quantifié.':'Cette galaxie agrège les signaux disponibles de son domaine. Ses astres sont les objets actuellement les plus visibles dans cette lecture.';
		setMetric('mass',mass||0,mass==null?'—':mass.toFixed(1));
		var prox=clamp(105-def.radius*16,18,88);setMetric('proximity',prox,prox>65?'Proche':prox>40?'Intermédiaire':'Périphérique');
		var dates=stars.map(function(s){return s.date}).filter(Boolean);var fresh=dates.length?Math.max.apply(null,dates.map(freshness)):55;setMetric('freshness',fresh,fresh>70?'Récente':'Moyenne');
		setMetric('trend',mass==null?35:58,mass==null?'À documenter':'Active');
		panel.querySelector('[data-mgp3d-panel-link]').hidden=true;openPanel();
	}
	function showEvent(ev){
		if(!ev)return;
		panel.querySelector('[data-mgp3d-panel-title]').textContent=ev.name;
		panel.querySelector('[data-mgp3d-panel-subtitle]').textContent=ev.type+(ev.date?' · '+ev.date:'');
		panel.querySelector('[data-mgp3d-panel-copy]').textContent=ev.description||(ev.city||ev.venue?[(ev.city||''),(ev.venue||'')].filter(Boolean).join(' · '):'Événement ou signal daté qui apparaît comme une impulsion dans l’univers MGP.');
		setMetric('mass',ev.mass||60,String(Math.round(ev.mass||60)));
		setMetric('proximity',76,'Proche');
		setMetric('freshness',ev.fresh||55,(ev.fresh||55)>70?'Récente':'Historique');
		setMetric('trend',68,'Impact visible');
		var link=panel.querySelector('[data-mgp3d-panel-link]');link.hidden=!ev.url;if(ev.url)link.href=ev.url;openPanel();
	}
	closePanel.addEventListener('click',function(){panel.classList.add('is-hidden')});

	canvas.addEventListener('pointerdown',function(e){pointer.down=true;pointer.lastX=e.clientX;pointer.lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
	canvas.addEventListener('pointermove',function(e){if(!pointer.down)return;var dx=e.clientX-pointer.lastX,dy=e.clientY-pointer.lastY;pointer.lastX=e.clientX;pointer.lastY=e.clientY;camera.targetYaw+=dx*.006;camera.targetPitch=clamp(camera.targetPitch+dy*.004,-.08,.95)});
	canvas.addEventListener('pointerup',function(){pointer.down=false});
	canvas.addEventListener('wheel',function(e){e.preventDefault();camera.targetZoom=clamp(camera.targetZoom*(e.deltaY>0?.92:1.08),.72,1.38)},{passive:false});
	canvas.addEventListener('dblclick',function(){camera.targetYaw=-.28;camera.targetPitch=.52;camera.targetZoom=1});

	modeButtons.forEach(function(btn){btn.addEventListener('click',function(){
		modeButtons.forEach(function(b){b.classList.remove('is-active')});btn.classList.add('is-active');state.mode=btn.dataset.mgp3dMode;
		root.dataset.mode=state.mode;
	})});

	function updateTimeUI(){
		state.time=Number(timeInput.value);
		var snap=state.snapshot||{},traj=Array.isArray(snap.trajectory)?snap.trajectory:[];
		if(traj.length){
			var idx=Math.round((state.time/100)*(traj.length-1)),row=traj[clamp(idx,0,traj.length-1)];
			timeLabel.textContent=state.time>98?'Aujourd’hui':(row&&row.date?row.date:'Historique');
			if(row&&row.date)dateLabel.textContent='MGP · '+row.date;
		}else timeLabel.textContent=state.time>98?'Aujourd’hui':'Historique';
		showMarine();
	}
	timeInput.addEventListener('input',updateTimeUI);
	var playTimer=null;
	playButton.addEventListener('click',function(){
		if(playTimer){clearInterval(playTimer);playTimer=null;playButton.textContent='▶';return}
		timeInput.value=0;updateTimeUI();playButton.textContent='❚❚';
		playTimer=setInterval(function(){timeInput.value=Math.min(100,Number(timeInput.value)+1);updateTimeUI();if(Number(timeInput.value)>=100){clearInterval(playTimer);playTimer=null;playButton.textContent='▶'}},120);
	});

	function loadJson(url,fallback){
		if(!url)return Promise.resolve(fallback);
		return fetch(url,{credentials:url.indexOf(location.origin)===0?'same-origin':'omit'}).then(function(r){if(!r.ok)throw new Error(String(r.status));return r.json()}).catch(function(){return fallback});
	}
	Promise.all([
		loadJson(endpoints.mgp,{}),
		loadJson(endpoints.news,{items:[]}),
		loadJson(endpoints.live,{items:[]})
	]).then(function(res){
		state.snapshot=res[0]||{};
		state.news=Array.isArray(res[1]&&res[1].items)?res[1].items:[];
		state.live=Array.isArray(res[2]&&res[2].items)?res[2].items:[];
		var date=state.snapshot&&state.snapshot.snapshot&&state.snapshot.snapshot.date;
		dateLabel.textContent=date?'MGP · '+date:'MGP · données partielles';
		updateTimeUI();
		showMarine();
	}).catch(function(){dateLabel.textContent='MGP · données indisponibles'});
	requestAnimationFrame(render);
})();
```