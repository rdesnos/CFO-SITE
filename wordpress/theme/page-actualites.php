<?php
/** CFO Actualites - server-rendered Supabase feed. */
get_header();

function cfo_actualites_fetch_items() {
	$endpoint = 'https://fjpcuxsezeuajhlotzij.supabase.co/functions/v1/cfo-actu-feed?limit=50';
	$response = wp_remote_get( $endpoint, array(
		'timeout' => 8,
		'headers' => array( 'Accept' => 'application/json' ),
	) );
	if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
		return array();
	}
	$payload = json_decode( wp_remote_retrieve_body( $response ), true );
	return ( is_array( $payload ) && ! empty( $payload['items'] ) && is_array( $payload['items'] ) ) ? $payload['items'] : array();
}

function cfo_actualites_relevant( $item, $category = '' ) {
	$title = mb_strtolower( html_entity_decode( (string) ( $item['title'] ?? '' ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
	$excerpt = mb_strtolower( html_entity_decode( (string) ( $item['excerpt'] ?? '' ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
	$combined = $title . ' ' . $excerpt;

	if ( empty( $item['published_at'] ) ) {
		return false;
	}

	foreach ( array( 'marine le pen', 'marine nationale', 'ex-marine', 'marine corps' ) as $term ) {
		if ( false !== strpos( $combined, $term ) ) {
			return false;
		}
	}

	if ( preg_match( '/biographie|playlist|vidéos? des nrj music awards|lives? des nrj music awards|^star academy$/iu', $title ) ) {
		return false;
	}

	$relevant = false;
	foreach ( array( 'marine', 'tricheur', 'coeur maladroit', 'cœur maladroit', 'ma faute', "restes d'averses", 'princesse chaos', 'escroc', "on m'avait dit" ) as $term ) {
		if ( false !== strpos( $title, $term ) ) {
			$relevant = true;
			break;
		}
	}

	if ( ! $relevant ) {
		return false;
	}

	return ! $category || $category === ( $item['category'] ?? '' );
}

$cfo_category = isset( $_GET['cfo_cat'] ) ? sanitize_key( wp_unslash( $_GET['cfo_cat'] ) ) : '';
$cfo_items = array_values( array_filter(
	cfo_actualites_fetch_items(),
	function( $item ) use ( $cfo_category ) {
		return cfo_actualites_relevant( $item, $cfo_category );
	}
) );

usort( $cfo_items, function( $a, $b ) {
	return strtotime( $b['published_at'] ?? '' ) <=> strtotime( $a['published_at'] ?? '' );
} );
?>
<main id="main" class="cfo-page-shell">
	<article <?php post_class( 'cfo-page' ); ?>>
		<header class="cfo-page-header">
			<div class="cfo-page-header-inner">
				<span class="cfo-page-kicker">Chroniques d’une fille ordinaire</span>
				<h1><?php the_title(); ?></h1>
			</div>
		</header>

		<div class="cfo-page-content">
			<p class="cfo-intro">Les informations publiées et contextualisées par CFO, avec une distinction claire entre sources officielles, professionnelles et médias.</p>

			<div class="cfo-actu-toolbar" role="group" aria-label="Filtrer les actualités">
				<a class="cfo-actu-filter <?php echo '' === $cfo_category ? 'is-active' : ''; ?>" href="<?php echo esc_url( get_permalink() ); ?>">Toutes</a>
				<a class="cfo-actu-filter <?php echo 'musique' === $cfo_category ? 'is-active' : ''; ?>" href="<?php echo esc_url( add_query_arg( 'cfo_cat', 'musique', get_permalink() ) ); ?>">Musique</a>
				<a class="cfo-actu-filter <?php echo 'media' === $cfo_category ? 'is-active' : ''; ?>" href="<?php echo esc_url( add_query_arg( 'cfo_cat', 'media', get_permalink() ) ); ?>">Médias</a>
				<a class="cfo-actu-filter <?php echo 'live' === $cfo_category ? 'is-active' : ''; ?>" href="<?php echo esc_url( add_query_arg( 'cfo_cat', 'live', get_permalink() ) ); ?>">Live</a>
				<a class="cfo-actu-filter <?php echo 'interview' === $cfo_category ? 'is-active' : ''; ?>" href="<?php echo esc_url( add_query_arg( 'cfo_cat', 'interview', get_permalink() ) ); ?>">Interviews</a>
			</div>

			<div class="cfo-news-grid">
				<?php if ( $cfo_items ) : ?>
					<?php foreach ( array_slice( $cfo_items, 0, 30 ) as $item ) :
						$title = html_entity_decode( (string) ( $item['title'] ?? 'Actualité' ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
						$title = preg_replace( '/\s*\|\s*Sony Music Entertainment France\s*$/iu', '', $title );
						$url = (string) ( $item['source_url'] ?? '' );
						$visual = ( ( $item['thumbnail_status'] ?? '' ) === 'source_image' ) ? ( ( $item['thumbnail_url'] ?? '' ) ?: ( $item['original_image_url'] ?? '' ) ) : '';
						$tier = ( $item['source_tier'] ?? '' ) === 'platinum' ? 'Officiel' : ( ( $item['source_tier'] ?? '' ) === 'gold' ? 'Professionnel' : 'Média' );
					?>
						<article class="cfo-news-card">
							<a class="cfo-news-image" href="<?php echo esc_url( $url ); ?>" target="_blank" rel="noopener noreferrer">
								<?php if ( $visual ) : ?>
									<img src="<?php echo esc_url( $visual ); ?>" alt="" loading="lazy" decoding="async">
								<?php else : ?>
									<span>CFO</span>
								<?php endif; ?>
							</a>
							<div class="cfo-news-body">
								<div class="cfo-news-source">
									<span class="cfo-source-badge"><?php echo esc_html( $tier ); ?></span>
									<span><?php echo esc_html( $item['source_name'] ?? '' ); ?></span>
								</div>
								<time datetime="<?php echo esc_attr( $item['published_at'] ); ?>">Publié le <?php echo esc_html( wp_date( 'j F Y', strtotime( $item['published_at'] ) ) ); ?></time>
								<h2><a href="<?php echo esc_url( $url ); ?>" target="_blank" rel="noopener noreferrer"><?php echo esc_html( $title ); ?></a></h2>
								<?php if ( ! empty( $item['excerpt'] ) ) : ?>
									<p><?php echo esc_html( html_entity_decode( (string) $item['excerpt'], ENT_QUOTES | ENT_HTML5, 'UTF-8' ) ); ?></p>
								<?php endif; ?>
								<a class="cfo-arrow" href="<?php echo esc_url( $url ); ?>" target="_blank" rel="noopener noreferrer">Voir la source →</a>
							</div>
						</article>
					<?php endforeach; ?>
				<?php else : ?>
					<p class="cfo-actu-empty">Aucune actualité disponible pour le moment.</p>
				<?php endif; ?>
			</div>

			<div class="cfo-method-note">
				<strong>Notre engagement</strong>
				<p>CFO distingue les sources officielles, professionnelles et médias. Une rumeur ou un bruit de couloir n’est pas présenté comme une actualité.</p>
			</div>
		</div>
	</article>
</main>
<?php get_footer(); ?>

