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
				<?php
				$cfo_news = new WP_Query( array( 'post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => 18, 'orderby' => 'date', 'order' => 'DESC' ) );
				while ( $cfo_news->have_posts() ) : $cfo_news->the_post();
				?>
					<article class="cfo-news-card">
						<a class="cfo-news-image" href="<?php the_permalink(); ?>">
							<?php if ( has_post_thumbnail() ) { the_post_thumbnail( 'medium_large' ); } else { echo '<span>CFO</span>'; } ?>
						</a>
						<div class="cfo-news-body">
							<time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date( 'j F Y' ) ); ?></time>
							<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
							<p><?php echo esc_html( wp_trim_words( get_the_excerpt(), 24 ) ); ?></p>
							<a class="cfo-arrow" href="<?php the_permalink(); ?>">Lire l’actualité →</a>
						</div>
					</article>
				<?php endwhile; wp_reset_postdata(); ?>
				</div>
				<div class="cfo-method-note"><strong>Notre engagement</strong><p>CFO distingue les sources officielles, professionnelles et médias. Une rumeur ou un bruit de couloir n’est pas présenté comme une actualité.</p></div>
			</div>

		<?php elseif ( is_page( 'agenda' ) ) : ?>
			<div class="cfo-page-content">
				<p class="cfo-intro">Concerts, festivals, médias et apparitions documentés de Marine. Chaque date est présentée avec son contexte et sa source lorsqu’elle est disponible.</p>
				<?php
				$cfo_events = new WP_Query( array(
					'post_type' => 'sc_event',
					'post_status' => 'publish',
					'posts_per_page' => 50,
					'meta_key' => 'sc_event_date',
					'orderby' => 'meta_value_num',
					'order' => 'ASC',
					'meta_query' => array( array( 'key' => 'sc_event_date', 'value' => strtotime( '-6 months' ), 'compare' => '>=', 'type' => 'NUMERIC' ) ),
				) );
				$current_year = '';
				if ( $cfo_events->have_posts() ) :
				?>
				<div class="cfo-agenda-list">
					<?php while ( $cfo_events->have_posts() ) : $cfo_events->the_post();
						$timestamp = (int) get_post_meta( get_the_ID(), 'sc_event_date', true );
						if ( ! $timestamp ) { $timestamp = get_post_time( 'U', true ); }
						$year = wp_date( 'Y', $timestamp );
						if ( $year !== $current_year ) { $current_year = $year; echo '<h2 class="cfo-agenda-year">' . esc_html( $year ) . '</h2>'; }
						$plain = wp_strip_all_tags( get_the_content() );
					?>
					<article class="cfo-event-card <?php echo $timestamp < time() ? 'is-past' : 'is-upcoming'; ?>">
						<div class="cfo-event-date"><span><?php echo esc_html( wp_date( 'M', $timestamp ) ); ?></span><strong><?php echo esc_html( wp_date( 'd', $timestamp ) ); ?></strong></div>
						<div class="cfo-event-copy">
							<small><?php echo $timestamp < time() ? 'Événement passé' : 'À venir'; ?></small>
							<h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
							<?php if ( $plain ) : ?><p><?php echo esc_html( wp_trim_words( $plain, 28 ) ); ?></p><?php endif; ?>
						</div>
						<a class="cfo-event-link" href="<?php the_permalink(); ?>">Détails →</a>
					</article>
					<?php endwhile; wp_reset_postdata(); ?>
				</div>
				<?php else : ?><p>Aucun événement documenté pour le moment.</p><?php endif; ?>
				<p class="cfo-source-note">Les informations sont vérifiées auprès des sources disponibles. Consultez toujours la billetterie ou l’organisateur avant tout déplacement.</p>
			</div>

		<?php elseif ( in_array( get_the_ID(), array( 235, 317, 322, 329, 332, 335, 338, 341, 344 ), true ) ) : ?>
			<div class="cfo-ell-meta">
				<span><?php echo esc_html( get_the_date( 'j F Y' ) ); ?></span>
				<span>Entre les lignes</span>
				<span><?php $words = str_word_count( wp_strip_all_tags( get_the_content() ) ); echo esc_html( max( 1, (int) ceil( $words / 220 ) ) ); ?> min de lecture</span>
			</div>
			<div class="cfo-page-content cfo-ell-content"><?php the_content(); ?>
<?php if ( 235 === get_the_ID() ) : ?>
<section class="cfo-further" aria-labelledby="cfo-further-title">
<p class="cfo-further-kicker">RESSOURCES SÉLECTIONNÉES PAR CFO</p><h2 id="cfo-further-title">Aller plus loin</h2>
<p class="cfo-further-intro">Parce qu'une chanson peut aussi ouvrir vers la compréhension, l'accompagnement et l'action. Des ressources institutionnelles et pratiques pour prolonger le dossier.</p>
<div class="cfo-further-grid">
<article class="cfo-further-card"><small>COMPRENDRE</small><h3>La maladie d'Alzheimer</h3><strong>Inserm</strong><p>Comprendre la maladie, ses mécanismes, son diagnostic, sa prise en charge et l'état de la recherche.</p><a href="https://www.inserm.fr/dossier/alzheimer-maladie/" target="_blank" rel="noopener">Consulter le dossier de référence →</a></article>
<article class="cfo-further-card"><small>ACCOMPAGNER</small><h3>Aider sans s'épuiser</h3><strong>France Alzheimer</strong><p>Des ressources et formations pour accompagner le quotidien et préserver aussi le proche aidant.</p><a href="https://www.francealzheimer.org/nos-actions-nos-missions/actions-adaptees-aidants/la-formation-des-aidants/" target="_blank" rel="noopener">Ressources pour les aidants →</a></article>
<article class="cfo-further-card"><small>SOUFFLER</small><h3>Trouver une solution de répit</h3><strong>Service public de l'autonomie</strong><p>Information, soutien et solutions concrètes proposées par les plateformes d'accompagnement et de répit.</p><a href="https://www.pour-les-personnes-agees.gouv.fr/preserver-son-autonomie/a-qui-s-adresser/les-plateformes-d-accompagnement-et-de-repit" target="_blank" rel="noopener">Trouver une plateforme de répit →</a></article>
<article class="cfo-further-card"><small>S'ORIENTER</small><h3>Aides, droits et interlocuteurs</h3><strong>Portail national de l'autonomie</strong><p>Annuaire officiel pour identifier les points d'information, plateformes de répit et solutions disponibles localement.</p><a href="https://www.pour-les-personnes-agees.gouv.fr/annuaire-points-dinformation-et-plateformes-de-repit" target="_blank" rel="noopener">Accéder aux annuaires officiels →</a></article>
</div>
<aside class="cfo-practical"><strong>Besoin d'aide concrète ?</strong><p>France Alzheimer dispose d'associations départementales qui informent et accompagnent les personnes malades et leurs proches.</p><a href="https://www.francealzheimer.org/" target="_blank" rel="noopener">Trouver France Alzheimer près de chez vous →</a></aside>
</section>
<?php endif; ?>
<?php if ( 235 !== get_the_ID() ) { get_template_part( 'template-parts/ell-further' ); } ?>
</div>

		<?php else : ?>
			<?php if ( has_post_thumbnail() ) : ?><figure class="cfo-page-visual"><?php the_post_thumbnail( 'large' ); ?></figure><?php endif; ?>
			<div class="cfo-page-content"><?php the_content(); ?></div>
		<?php endif; ?>
	</article>
	<?php endwhile; endif; ?>
</main>
<?php get_footer(); ?>
