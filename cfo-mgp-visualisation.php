<?php
/**
 * Plugin Name: CFO MGP Visualisation
 * Description: Visualisation interactive de l'Univers MGP : Marine au centre, galaxies thématiques, astres et événements.
 * Version: 0.1.0
 * Author: CFO
 * Text Domain: cfo-mgp-visualisation
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CFO_MGP_VIS_VERSION', '0.1.0' );
define( 'CFO_MGP_VIS_URL', plugin_dir_url( __FILE__ ) );
define( 'CFO_MGP_VIS_PATH', plugin_dir_path( __FILE__ ) );

function cfo_mgp_vis_enqueue_assets() {
	wp_enqueue_style(
		'cfo-mgp-visualisation',
		CFO_MGP_VIS_URL . 'assets/css/universe.css',
		array(),
		CFO_MGP_VIS_VERSION
	);

	wp_enqueue_script(
		'cfo-mgp-visualisation',
		CFO_MGP_VIS_URL . 'assets/js/universe.js',
		array(),
		CFO_MGP_VIS_VERSION,
		true
	);

	wp_localize_script(
		'cfo-mgp-visualisation',
		'CFO_MGP_UNIVERSE',
		array(
			'endpoints' => array(
				'mgp'  => rest_url( 'cfo-mgp/v1/snapshot?artist=marine&days=365' ),
				'news' => 'https://fjpcuxsezeuajhlotzij.supabase.co/functions/v1/cfo-actu-feed?limit=12',
				'live' => 'https://fjpcuxsezeuajhlotzij.supabase.co/functions/v1/cfo-salles-feed',
			),
			'labels' => array(
				'loading'      => 'Chargement de l’univers MGP…',
				'unavailable'  => 'Donnée non disponible',
				'unmeasured'   => 'Poids non mesuré',
				'today'        => 'Aujourd’hui',
			),
		)
	);
}

function cfo_mgp_vis_shortcode( $atts = array() ) {
	cfo_mgp_vis_enqueue_assets();

	$atts = shortcode_atts(
		array(
			'artist' => 'marine',
			'mode'   => 'ecosysteme',
		),
		$atts,
		'cfo_mgp_visualisation'
	);

	ob_start();
	?>
	<section class="cfo-mgpu" data-cfo-mgpu data-mode="<?php echo esc_attr( $atts['mode'] ); ?>">
		<header class="cfo-mgpu__head">
			<div>
				<p class="cfo-mgpu__kicker">Observatoire CFO · MGP</p>
				<h1 class="cfo-mgpu__title">L’Univers de Marine</h1>
				<p class="cfo-mgpu__lead">
					Marine reste le point fixe. Sa taille varie avec son poids MGP. Autour d’elle gravitent les galaxies
					de son écosystème, puis les astres qui composent chacune d’elles.
				</p>
			</div>

			<nav class="cfo-mgpu__tabs" aria-label="Modes de lecture">
				<button type="button" class="is-active" data-mgpu-mode="ecosysteme">Écosystème</button>
				<button type="button" data-mgpu-mode="temps">Temps</button>
				<button type="button" data-mgpu-mode="evenements">Événements</button>
			</nav>
		</header>

		<div class="cfo-mgpu__layout">
			<div class="cfo-mgpu__stage-card">
				<div class="cfo-mgpu__stage" data-mgpu-stage aria-label="Univers MGP de Marine">
					<div class="cfo-mgpu__center" data-mgpu-center>
						<strong>Marine</strong>
						<span data-mgpu-center-mass>Poids MGP —</span>
					</div>
				</div>

				<div class="cfo-mgpu__legend">
					<span><i class="is-proximity"></i><b>Proximité</b> distance à Marine</span>
					<span><i class="is-gravity"></i><b>Gravité</b> taille de l’astre</span>
					<span><i class="is-freshness"></i><b>Fraîcheur</b> luminosité</span>
					<span><i class="is-trend"></i><b>Tendance</b> mouvement</span>
				</div>
			</div>

			<aside class="cfo-mgpu__inspector" data-mgpu-inspector>
				<p class="cfo-mgpu__kicker">Comment lire cet univers ?</p>
				<h2>Cliquez sur une galaxie ou un astre</h2>
				<p>
					Marine ne bouge jamais. Les galaxies tournent autour d’elle, leurs astres autour de leur soleil,
					et les événements apparaissent comme des impulsions datées.
				</p>
				<ol>
					<li><b>Marine</b> : centre fixe, taille = poids MGP global.</li>
					<li><b>Galaxies</b> : grands domaines de l’écosystème.</li>
					<li><b>Astres</b> : œuvres, médias, artistes, plateformes ou dates.</li>
					<li><b>Événements</b> : impulsions temporelles qui perturbent le système.</li>
				</ol>
			</aside>
		</div>

		<section class="cfo-mgpu__timeline">
			<div>
				<p class="cfo-mgpu__kicker">Dynamique temporelle</p>
				<h2>Voir l’univers se transformer</h2>
			</div>
			<div class="cfo-mgpu__timeline-control">
				<button type="button" data-mgpu-play aria-label="Lire l'évolution">▶</button>
				<input type="range" min="0" max="100" value="100" data-mgpu-time aria-label="Position dans le temps">
				<span data-mgpu-time-label>Aujourd’hui</span>
			</div>
		</section>
	</section>
	<?php
	return ob_get_clean();
}
add_shortcode( 'cfo_mgp_visualisation', 'cfo_mgp_vis_shortcode' );
