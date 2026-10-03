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
			$portrait = wp_get_attachment_image( 811, 'full', false, array( 'class' => 'cfo-hero-portrait', 'alt' => 'Portrait de Marine', 'style' => 'position:absolute;z-index:1;right:25%;top:50%;width:36%;max-width:630px;height:auto;display:block;opacity:1;visibility:visible;object-fit:contain;object-position:center center;transform:translateY(-50%);pointer-events:none;' ) );
			$visual_delivery = get_option( 'cfo_visual_delivery', array() );
			$hero_asset = isset( $visual_delivery['hero'] ) && is_array( $visual_delivery['hero'] ) ? $visual_delivery['hero'] : array();
			if ( ! empty( $hero_asset['url'] ) && ! empty( $hero_asset['srcset'] ) ) {
				$portrait = '<img class="cfo-hero-portrait" src="' . esc_url( $hero_asset['url'] ) . '" srcset="' . esc_attr( $hero_asset['srcset'] ) . '" sizes="(max-width: 780px) 340px, (max-width: 1100px) 45vw, 36vw" width="673" height="736" alt="Portrait de Marine" decoding="async" fetchpriority="high" style="position:absolute;z-index:1;right:25%;top:50%;width:36%;max-width:630px;height:auto;display:block;opacity:1;visibility:visible;object-fit:contain;object-position:center center;transform:translateY(-50%);pointer-events:none;">';
			}
			$content = preg_replace( '/(<section class="hero">)/', '$1' . $portrait, $content, 1 );
			echo $content;
			?>
	<?php endwhile; endif; ?>
</main>
<?php get_footer(); ?>
