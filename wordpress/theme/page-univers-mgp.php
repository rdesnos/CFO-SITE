**page-univers-mgp.php**
127 lines
```
<?php
/**
 * Univers MGP — visualisation 3D interactive.
 * Template auto-selected for the page slug: univers-mgp
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$css_path = get_theme_file_path( 'assets/mgp-universe-v2.css' );
$js_path  = get_theme_file_path( 'assets/mgp-universe-v2.js' );

wp_enqueue_style(
	'cfo-mgp-universe-v2',
	get_theme_file_uri( 'assets/mgp-universe-v2.css' ),
	array(),
	file_exists( $css_path ) ? (string) filemtime( $css_path ) : '20260925-1'
);

wp_enqueue_script(
	'cfo-mgp-universe-v2',
	get_theme_file_uri( 'assets/mgp-universe-v2.js' ),
	array(),
	file_exists( $js_path ) ? (string) filemtime( $js_path ) : '20260925-1',
	true
);

wp_localize_script(
	'cfo-mgp-universe-v2',
	'CFO_MGP_3D',
	array(
		'endpoints' => array(
			'mgp'  => rest_url( 'cfo-mgp/v1/snapshot?artist=marine&days=365' ),
			'news' => 'https://fjpcuxsezeuajhlotzij.supabase.co/functions/v1/cfo-actu-feed?limit=18',
			'live' => 'https://fjpcuxsezeuajhlotzij.supabase.co/functions/v1/cfo-salles-feed',
		),
		'page' => array(
			'title' => 'L’Univers de Marine',
		),
	)
);

get_header();
?>
<main class="mgp3d" data-mgp3d>
	<section class="mgp3d__shell">
		<div class="mgp3d__scene" data-mgp3d-scene>
			<canvas class="mgp3d__canvas" data-mgp3d-canvas aria-label="Univers 3D MGP de Marine"></canvas>
			<div class="mgp3d__vignette" aria-hidden="true"></div>
			<div class="mgp3d__grain" aria-hidden="true"></div>

			<header class="mgp3d__intro">
				<p class="mgp3d__kicker">Observatoire CFO · MGP</p>
				<h1>L’Univers de Marine</h1>
				<p class="mgp3d__intro-copy">Marine est le centre fixe de cet écosystème. Autour d’elle gravitent des galaxies qui représentent ses univers, leurs acteurs, leurs projets et leurs dynamiques dans le temps.</p>
			</header>

			<nav class="mgp3d__modes" aria-label="Modes de lecture">
				<button type="button" class="is-active" data-mgp3d-mode="ecosysteme">Écosystème</button>
				<button type="button" data-mgp3d-mode="tendances">Tendances</button>
				<button type="button" data-mgp3d-mode="projections">Projections</button>
			</nav>

			<div class="mgp3d__status">
				<span class="mgp3d__status-dot"></span>
				<span data-mgp3d-date>Chargement du modèle…</span>
			</div>

			<div class="mgp3d__labels" data-mgp3d-labels aria-live="polite"></div>

			<aside class="mgp3d__panel" data-mgp3d-panel>
				<button type="button" class="mgp3d__panel-close" data-mgp3d-close aria-label="Fermer">×</button>
				<p class="mgp3d__panel-type">UNIVERS MGP</p>
				<div class="mgp3d__panel-visual" data-mgp3d-panel-visual>
					<div class="mgp3d__panel-orb"></div>
				</div>
				<h2 data-mgp3d-panel-title>Marine</h2>
				<p class="mgp3d__panel-subtitle" data-mgp3d-panel-subtitle>Centre fixe</p>
				<p class="mgp3d__panel-copy" data-mgp3d-panel-copy>Le point de référence de toute la visualisation. Sa position reste fixe ; sa taille évolue avec son poids MGP.</p>

				<div class="mgp3d__metrics">
					<div class="mgp3d__metric">
						<span>Poids (MGP)</span><div><i data-metric-bar="mass"></i></div><strong data-metric-value="mass">—</strong>
					</div>
					<div class="mgp3d__metric">
						<span>Proximité</span><div><i data-metric-bar="proximity"></i></div><strong data-metric-value="proximity">Centre</strong>
					</div>
					<div class="mgp3d__metric">
						<span>Fraîcheur</span><div><i data-metric-bar="freshness"></i></div><strong data-metric-value="freshness">—</strong>
					</div>
					<div class="mgp3d__metric">
						<span>Tendance</span><div><i data-metric-bar="trend"></i></div><strong data-metric-value="trend">—</strong>
					</div>
				</div>

				<a class="mgp3d__panel-link" data-mgp3d-panel-link href="#" target="_blank" rel="noopener" hidden>Voir la source <span>→</span></a>
			</aside>

			<div class="mgp3d__timeline">
				<button type="button" data-mgp3d-play aria-label="Lire l’évolution">▶</button>
				<div class="mgp3d__timeline-track">
					<input type="range" min="0" max="100" value="100" data-mgp3d-time aria-label="Navigation temporelle">
					<div class="mgp3d__timeline-labels"><span>Historique</span><span data-mgp3d-time-label>Aujourd’hui</span></div>
				</div>
			</div>

			<div class="mgp3d__legend">
				<div><span class="mgp3d__legend-icon is-distance"></span><p><b>Distance = proximité</b><small>Plus une galaxie est proche de Marine, plus son lien est fort.</small></p></div>
				<div><span class="mgp3d__legend-icon is-size"></span><p><b>Taille = gravité</b><small>Le volume traduit le poids MGP disponible.</small></p></div>
				<div><span class="mgp3d__legend-icon is-light"></span><p><b>Lumière = fraîcheur</b><small>La brillance augmente avec la récence du signal.</small></p></div>
				<div><span class="mgp3d__legend-icon is-path"></span><p><b>Trajectoire = tendance</b><small>Le mouvement rend visible la dynamique d’évolution.</small></p></div>
			</div>

			<div class="mgp3d__minimap" data-mgp3d-minimap aria-hidden="true">
				<span class="is-center"></span>
				<span class="is-orbit one"></span><span class="is-orbit two"></span>
				<i class="one"></i><i class="two"></i><i class="three"></i><i class="four"></i><i class="five"></i>
			</div>

			<p class="mgp3d__hint">Glisser pour changer le point de vue · Molette pour zoomer · Cliquer pour explorer</p>
		</div>
	</section>
</main>
<?php
get_footer();

```