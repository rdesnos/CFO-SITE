<?php
/**
 * CFO standard and editorial pages.
 */
get_header();
?>
<main id="main" class="cfo-page-shell">
	<?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
		<article <?php post_class( 'cfo-page' ); ?>>
			<header class="cfo-page-header">
				<div class="cfo-page-header-inner">
					<span class="cfo-page-kicker">Chroniques d’une fille ordinaire</span>
					<h1><?php the_title(); ?></h1>
				</div>
			</header>
			<?php if ( is_page( 'actualites' ) ) : ?>
				<div class="cfo-page-content">
					<p class="cfo-intro">Les informations publiées et contextualisées par CFO, avec une distinction claire entre faits établis, signaux et hypothèses.</p>
					<div class="cfo-news-grid">
					<?php $cfo_news = new WP_Query( array( 'post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => 18, 'orderby' => 'date', 'order' => 'DESC' ) ); while ( $cfo_news->have_posts() ) : $cfo_news->the_post(); ?>
						<article class="cfo-news-card"><a class="cfo-news-image" href="<?php the_permalink(); ?>"><?php if ( has_post_thumbnail() ) { the_post_thumbnail( 'medium_large' ); } else { echo '<span>CFO</span>'; } ?></a><div class="cfo-news-body"><time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date( 'j F Y' ) ); ?></time><h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2><p><?php echo esc_html( wp_trim_words( get_the_excerpt(), 24 ) ); ?></p><a class="cfo-arrow" href="<?php the_permalink(); ?>">Lire l’actualité →</a></div></article>
					<?php endwhile; wp_reset_postdata(); ?>
					</div><div class="cfo-method-note"><strong>Notre engagement</strong><p>CFO distingue les sources officielles, professionnelles et médias. Une rumeur ou un bruit de couloir n’est pas présenté comme une actualité.</p></div>
				</div>
			<?php elseif ( is_page( 'agenda' ) ) : ?>
				<div class="cfo-page-content"><p class="cfo-intro">Concerts, festivals, médias et apparitions documentés de Marine. Chaque date est présentée avec son contexte et sa source lorsqu’elle est disponible.</p><?php the_content(); ?></div>
			<?php else : ?>
				<?php if ( is_page( 769 ) ) : ?>
					<?php $author_blocks = parse_blocks( get_the_content() ); $author_lead = array_slice( $author_blocks, 0, 5 ); $author_rest = array_slice( $author_blocks, 5 ); ?>
					<div class="cfo-page-content cfo-author-content"><div class="cfo-author-lead"><?php if ( has_post_thumbnail() ) : ?><figure class="cfo-author-portrait"><?php the_post_thumbnail( 'medium_large' ); ?></figure><?php endif; ?><div class="cfo-author-intro"><?php foreach ( $author_lead as $block ) { echo render_block( $block ); } ?></div></div><div class="cfo-author-rest"><?php foreach ( $author_rest as $block ) { echo render_block( $block ); } ?></div></div>
				<?php else : ?>
					<?php if ( has_post_thumbnail() ) : ?><figure class="cfo-page-visual"><?php the_post_thumbnail( 'large' ); ?></figure><?php endif; ?><div class="cfo-page-content"><?php the_content(); ?></div>
				<?php endif; ?>
			<?php endif; ?>
		</article>
	<?php endwhile; endif; ?>
</main>
<?php get_footer(); ?>
