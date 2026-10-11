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
                // Weekly editorial snapshot, rendered server-side in the draft template.
                $cfo_weekly_html = '<aside class="cfo-weekly-pulse cfo-pulse-timeline" data-cfo-editorial="1">'
                    . '<h3>Ce que disent les chiffres</h3><p class="cfo-weekly-period">4 oct. &rarr; 10 oct. 2026</p>'
                    . '<div class="cfo-editorial-pulse"><span>Auditeurs mensuels Spotify</span><div class="cfo-pulse-value-row"><strong>871 477</strong><span class="cfo-pulse-change is-down-moderate" aria-label="Baisse modérée de 3,7 pour cent"><span class="cfo-pulse-arrow" aria-hidden="true">&#8600;</span><span>&minus;3,7 %</span></span></div><p class="cfo-pulse-insight">Le recul des auditeurs se renforce depuis la fin septembre.</p></div>'
                    . '<div class="cfo-editorial-pulse"><span>Streams Spotify - 7 jours</span><div class="cfo-pulse-value-row"><strong>954 610</strong><span class="cfo-pulse-change is-stable" aria-label="Stable, hausse de 0,5 pour cent"><span class="cfo-pulse-arrow" aria-hidden="true">&rarr;</span><span>+0,5 %</span></span></div><p class="cfo-pulse-insight">Les &eacute;coutes restent globalement stables, malgr&eacute; le recul de l&rsquo;audience mensuelle.</p></div>'
                    . '<div class="cfo-editorial-pulse"><span>Passages radio - 7 jours</span><div class="cfo-pulse-value-row"><strong>2 164</strong><span class="cfo-pulse-change is-up-moderate" aria-label="Hausse modérée de 3,9 pour cent"><span class="cfo-pulse-arrow" aria-hidden="true">&#8599;</span><span>+3,9 %</span></span></div><p class="cfo-pulse-insight">La pr&eacute;sence radio progresse l&eacute;g&egrave;rement sur la semaine, malgr&eacute; les fluctuations quotidiennes.</p></div>'
                    . '<a class="cfo-weekly-observatory-link" href="/observatoire-cfo/">Ouvrir l&rsquo;Observatoire &rarr;</a></aside>';
                $content = preg_replace( '~<aside class="cfo-weekly-pulse"[^>]*>.*?</aside>~s', $cfo_weekly_html, $content, 1 );
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


