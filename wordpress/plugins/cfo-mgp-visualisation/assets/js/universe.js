(function(){
	'use strict';

	var root = document.querySelector('[data-cfo-mgpu]');
	if (!root || root.dataset.ready === '1') return;
	root.dataset.ready = '1';

	var stage = root.querySelector('[data-mgpu-stage]');
	var inspector = root.querySelector('[data-mgpu-inspector]');
	var center = root.querySelector('[data-mgpu-center]');
	var centerMass = root.querySelector('[data-mgpu-center-mass]');
	var time = root.querySelector('[data-mgpu-time]');
	var timeLabel = root.querySelector('[data-mgpu-time-label]');
	var play = root.querySelector('[data-mgpu-play]');
	var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-mgpu-mode]'));

	var endpoints = (window.CFO_MGP_UNIVERSE || {}).endpoints || {};
	var state = { snapshot:null, news:[], live:[] };

	var layout = [
		{id:'music',label:'Musique',color:'#2c5d86',x:67,y:25,scale:1.00},
		{id:'media',label:'Médias',color:'#b64235',x:28,y:27,scale:.92},
		{id:'artists',label:'Artistes',color:'#355f78',x:24,y:66,scale:.90},
		{id:'live',label:'Live',color:'#bb4b36',x:72,y:67,scale:.88},
		{id:'social',label:'Réseaux',color:'#6b8295',x:51,y:81,scale:.76},
		{id:'cinema',label:'Cinéma',color:'#a58b72',x:84,y:44,scale:.66,unmeasured:true}
	];

	function esc(value){
		return String(value == null ? '' : value).replace(/[&<>"']/g,function(m){
			return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m];
		});
	}

	function size(value,min,max){
		if(value === null || value === undefined || !Number.isFinite(Number(value))) return min;
		var n = Math.max(0,Math.min(100,Number(value)));
		return Math.round(min + (max-min) * Math.sqrt(n/100));
	}

	function snapshotForce(key){
		var forces = (state.snapshot && state.snapshot.forces) || {};
		var v = forces[key] && forces[key].score;
		return Number.isFinite(v) ? Number(v) : null;
	}

	function buildModel(){
		var snap = state.snapshot || {};
		var panel = Array.isArray(snap.panel) ? snap.panel : [];
		var streaming = snapshotForce('streaming');
		var airplay = snapshotForce('airplay');
		var parts = [streaming,airplay].filter(function(v){return Number.isFinite(v);});
		var musicMass = parts.length ? parts.reduce(function(a,b){return a+b;},0)/parts.length : null;
		var artistMass = panel.length ? Math.max.apply(null,panel.filter(function(x){return x.slug !== 'marine';}).map(function(x){return Number(x.mass)||0;})) : null;

		return {
			music:{
				mass:musicMass,
				stars:['Tricheur','Cœur maladroit','Ma faute','Restes d’averses','Escroc'].map(function(label,i){return {label:label,value:100-i*11};})
			},
			media:{
				mass:snapshotForce('media'),
				stars:state.news.slice(0,6).map(function(n){return {label:n.title||'Actualité',value:Number(n.priority_score)||60,url:n.source_url,date:n.published_at};})
			},
			artists:{
				mass:artistMass,
				stars:panel.filter(function(x){return x.slug !== 'marine';}).sort(function(a,b){return (Number(b.mass)||0)-(Number(a.mass)||0);}).slice(0,6).map(function(a){return {label:a.name,value:Number(a.mass)||30,detail:a.state};})
			},
			live:{
				mass:snapshotForce('live'),
				stars:state.live.slice(0,6).map(function(e){return {label:e.city||e.title||'Date',value:60,url:e.ticket_url,date:e.event_date};})
			},
			social:{
				mass:snapshotForce('social'),
				stars:['Instagram','TikTok','YouTube','Spotify'].map(function(label,i){return {label:label,value:90-i*13};})
			},
			cinema:{mass:null,stars:[]}
		};
	}

	function clearStage(){
		stage.querySelectorAll('.cfo-mgpu__orbit,.cfo-mgpu__galaxy,.cfo-mgpu__event').forEach(function(node){node.remove();});
	}

	function addOrbits(){
		[[44,22],[61,31],[78,40],[96,50]].forEach(function(pair,index){
			var orbit = document.createElement('div');
			orbit.className = 'cfo-mgpu__orbit';
			orbit.style.width = pair[0] + '%';
			orbit.style.height = pair[1] + '%';
			orbit.style.transform = 'translate(-50%,-50%) rotate(' + (index%2 ? 8 : -7) + 'deg)';
			stage.appendChild(orbit);
		});
	}

	function render(){
		clearStage();
		addOrbits();

		var snap = state.snapshot || {};
		var marineMass = snap.snapshot && snap.snapshot.mass;
		center.style.setProperty('--center-size',size(marineMass,125,205)+'px');
		centerMass.textContent = marineMass != null ? 'Poids MGP ' + Number(marineMass).toFixed(1) : 'Poids MGP —';

		var galaxies = buildModel();

		layout.forEach(function(cfg,index){
			var galaxy = galaxies[cfg.id] || {mass:null,stars:[]};
			var el = document.createElement('div');
			el.className = 'cfo-mgpu__galaxy' + ((cfg.unmeasured || galaxy.mass == null) ? ' is-unmeasured' : '');
			el.style.setProperty('--x',cfg.x+'%');
			el.style.setProperty('--y',cfg.y+'%');
			el.style.setProperty('--size',(size(galaxy.mass,115,195)*cfg.scale)+'px');
			el.style.setProperty('--galaxy-color',cfg.color);

			var halo = document.createElement('div');
			halo.className = 'cfo-mgpu__galaxy-halo';
			el.appendChild(halo);

			var core = document.createElement('div');
			core.className = 'cfo-mgpu__galaxy-core';
			var label = document.createElement('span');
			label.className = 'cfo-mgpu__galaxy-label';
			label.textContent = cfg.label;
			core.appendChild(label);
			el.appendChild(core);

			var count = Math.min(6,galaxy.stars.length);
			galaxy.stars.slice(0,count).forEach(function(star,i){
				var angle = (Math.PI*2*i/Math.max(1,count)) + index*.55;
				var radius = 42 + (i%2)*15;
				var button = document.createElement('button');
				button.type = 'button';
				button.className = 'cfo-mgpu__star';
				button.style.setProperty('--galaxy-color',cfg.color);
				button.style.setProperty('--star-size',(14+Math.min(22,Math.sqrt(Number(star.value)||20)*2.2))+'px');
				button.style.setProperty('--sx',(50+Math.cos(angle)*radius)+'%');
				button.style.setProperty('--sy',(50+Math.sin(angle)*radius*.62)+'%');

				var starLabel = document.createElement('span');
				starLabel.className = 'cfo-mgpu__star-label';
				starLabel.textContent = String(star.label||'').slice(0,26);
				button.appendChild(starLabel);

				button.addEventListener('click',function(ev){
					ev.stopPropagation();
					showStar(cfg,star);
				});
				el.appendChild(button);
			});

			el.addEventListener('click',function(){showGalaxy(cfg,galaxy);});
			stage.appendChild(el);
		});

		var events = state.news.slice(0,4).concat(state.live.slice(0,4));
		events.slice(0,8).forEach(function(event,index){
			var impulse = document.createElement('button');
			impulse.type = 'button';
			impulse.className = 'cfo-mgpu__event';
			var angle = (index/8)*Math.PI*2 + .28;
			var rx = 31 + (index%3)*5;
			var ry = 20 + (index%2)*4;
			impulse.style.left = (50+Math.cos(angle)*rx)+'%';
			impulse.style.top = (50+Math.sin(angle)*ry)+'%';
			impulse.title = event.title || event.city || 'Événement';
			impulse.addEventListener('click',function(){showEvent(event);});
			stage.appendChild(impulse);
		});
	}

	function showGalaxy(cfg,galaxy){
		inspector.innerHTML =
			'<div class="cfo-mgpu__inspector-card">' +
			'<p class="cfo-mgpu__kicker">Galaxie</p>' +
			'<h2>'+esc(cfg.label)+'</h2>' +
			'<p>'+(galaxy.mass == null
				? 'Cette galaxie est visible mais son poids MGP n’est pas encore mesuré de façon suffisamment fiable.'
				: 'Sa taille est pilotée par la donnée MGP disponible.')+'</p>' +
			'<div class="cfo-mgpu__stat"><span>Poids représenté</span><strong>'+(galaxy.mass == null ? '—' : Number(galaxy.mass).toFixed(1))+'</strong></div>' +
			'<div class="cfo-mgpu__stat"><span>Astres visibles</span><strong>'+galaxy.stars.length+'</strong></div>' +
			'<div class="cfo-mgpu__stat"><span>Lecture</span><strong>'+(galaxy.mass == null ? 'Couverture à compléter' : 'Mesurée')+'</strong></div>' +
			'</div>';
	}

	function showStar(cfg,star){
		inspector.innerHTML =
			'<div class="cfo-mgpu__inspector-card">' +
			'<p class="cfo-mgpu__kicker">'+esc(cfg.label)+' · astre</p>' +
			'<h2>'+esc(star.label||'Élément')+'</h2>' +
			(star.date ? '<p>'+esc(String(star.date).slice(0,10))+'</p>' : '') +
			'<div class="cfo-mgpu__stat"><span>Intensité visuelle</span><strong>'+Math.round(Number(star.value)||0)+'</strong></div>' +
			(star.detail ? '<div class="cfo-mgpu__stat"><span>Dynamique</span><strong>'+esc(star.detail)+'</strong></div>' : '') +
			(star.url ? '<a class="cfo-mgpu__link" href="'+esc(star.url)+'" target="_blank" rel="noopener">Voir la source →</a>' : '') +
			'</div>';
	}

	function showEvent(event){
		var title = event.title || event.city || 'Événement';
		var date = event.published_at || event.event_date || '';
		var url = event.source_url || event.ticket_url || '';
		inspector.innerHTML =
			'<div class="cfo-mgpu__inspector-card">' +
			'<p class="cfo-mgpu__kicker">Impulsion temporelle</p>' +
			'<h2>'+esc(title)+'</h2>' +
			'<p>'+esc(date ? String(date).slice(0,10) : 'Date non disponible')+'</p>' +
			'<p>'+esc(event.excerpt || event.venue || 'Cet événement apparaît dans l’univers comme une perturbation datée.')+'</p>' +
			(url ? '<a class="cfo-mgpu__link" href="'+esc(url)+'" target="_blank" rel="noopener">Voir la source →</a>' : '') +
			'</div>';
	}

	function load(){
		Promise.all([
			fetch(endpoints.mgp,{credentials:'same-origin'}).then(function(r){if(!r.ok)throw new Error('MGP '+r.status);return r.json();}),
			fetch(endpoints.news).then(function(r){return r.ok?r.json():{items:[]};}).catch(function(){return {items:[]};}),
			fetch(endpoints.live).then(function(r){return r.ok?r.json():{items:[]};}).catch(function(){return {items:[]};})
		]).then(function(results){
			state.snapshot = results[0] || {};
			state.news = Array.isArray(results[1].items) ? results[1].items : [];
			state.live = Array.isArray(results[2].items) ? results[2].items : [];
			render();
		}).catch(function(){
			centerMass.textContent = 'Données indisponibles';
			render();
		});
	}

	tabs.forEach(function(button){
		button.addEventListener('click',function(){
			tabs.forEach(function(x){x.classList.remove('is-active');});
			button.classList.add('is-active');
			root.dataset.mode = button.dataset.mgpuMode;
		});
	});

	var timer = null;
	function updateTime(){
		var value = Number(time.value);
		timeLabel.textContent = value > 96 ? 'Aujourd’hui' : value < 10 ? 'Il y a 12 mois' : 'T − ' + Math.round((100-value)*3.65) + ' j';
	}
	time.addEventListener('input',updateTime);
	play.addEventListener('click',function(){
		if(timer){
			clearInterval(timer);
			timer=null;
			play.textContent='▶';
			return;
		}
		time.value=0;
		play.textContent='❚❚';
		timer=setInterval(function(){
			time.value=Math.min(100,Number(time.value)+2);
			updateTime();
			if(Number(time.value)>=100){
				clearInterval(timer);
				timer=null;
				play.textContent='▶';
			}
		},90);
	});

	load();
})();