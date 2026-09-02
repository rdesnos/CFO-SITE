<?php
/**
 * CFO front page.
 */
get_header();
?>
<main id="main" class="site-main">
	<?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
		<?php
			$content = apply_filters( 'the_content', get_the_content() );
			$portrait = '<img class="cfo-hero-portrait" src="https://mediumturquoise-gnat-385231.hostingersite.com/wp-content/uploads/2026/09/CFO_Portrait.png" alt="Portrait de Marine">';
			$content = preg_replace( '/(<section class="hero">)/', '$1' . $portrait, $content, 1 );
			echo $content;
			?>
	<?php endwhile; endif; ?>
</main>
<?php get_footer(); ?>
