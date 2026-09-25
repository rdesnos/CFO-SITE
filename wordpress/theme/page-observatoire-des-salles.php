<?php
/** CFO Observatoire des salles — server-rendered Supabase feed. */
get_header();

function cfo_salles_fetch_snapshot() {
	$endpoint = 'https://fjpcuxsezeuajhlotzij.supabase.co/functions/v1/cfo-salles-feed';
	$response = wp_remote_get( $endpoint, array(
		'timeout' => 8,
		'headers' => array( 'Accept' => 'application/json' ),
	) );
	if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
		return array();
	}
	$payload = json_decode( wp_remote_retrieve_body( $response ), true );
	return is_array( $payload ) ? $payload : array();
}

function cfo_salles_status_label( $status ) {
	switch ( $status ) {
		case 'on_sale': return array( 'EN VENTE', 'is-sale' );
		case 'sold_out': return array( 'COMPLET', 'is-soldout' );
		case 'coming_soon': return array( 'BIENTÔT', 'is-coming' );
		case 'unavailable': return array( 'INDISPONIBLE', 'is-unavailable' );
		default: return array( 'À VÉRIFIER', 'is-unknown' );
	}
}

$snapshot = cfo_salles_fetch_snapshot();
$stats = isset( $snapshot['stats'] ) && is_array( $snapshot['stats'] ) ? $snapshot['stats'] : array();
$items = isset( $snapshot['items'] ) && is_array( $snapshot['items'] ) ? $snapshot['items'] : array();
$last_checked = ! empty( $stats['last_checked_at'] ) ? strtotime( $stats['last_checked_at'] ) : null;
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
			<section class="cfo-salles-kpis">
				<div class="cfo-salles-kpi"><span>Dates suivies</span><strong><?php echo esc_html( $stats['dates_count'] ?? count( $items ) ); ?></strong><em>octobre 2026 → mars 2027</em></div>
				<div class="cfo-salles-kpi"><span>Jauges documentées</span><strong><?php echo esc_html( $stats['capacities_documented'] ?? 0 ); ?> / <?php echo esc_html( $stats['dates_count'] ?? count( $items ) ); ?></strong><em>capacité ou configuration connue</em></div>
				<div class="cfo-salles-kpi"><span>En vente</span><strong><?php echo esc_html( $stats['on_sale_count'] ?? 0 ); ?></strong><em>liens d’achat disponibles</em></div>
				<div class="cfo-salles-kpi <?php echo ! empty( $stats['fresh_count'] ) && (int) $stats['fresh_count'] === (int) ( $stats['dates_count'] ?? 0 ) ? 'is-ok' : 'is-alert'; ?>">
					<span>Fraîcheur billetterie</span>
					<strong><?php echo $last_checked ? esc_html( wp_date( 'j M', $last_checked ) ) : '—'; ?></strong>
					<em><?php echo $last_checked ? 'dernier contrôle : ' . esc_html( wp_date( 'd/m/Y H:i', $last_checked ) ) : 'contrôle indisponible'; ?></em>
				</div>
			</section>
			<div class="cfo-salles-intro">
				<h2>Tableau de bord des dates</h2>
				<span class="cfo-salles-freshness">Billetterie contrôlée et liens actualisés</span>
			</div>
			<p><em>Les statuts ci-dessous correspondent au dernier contrôle disponible. Quand une billetterie officielle ou reconnue propose des places, le bouton mène directement à l’achat. Une absence de disponibilité n’est jamais assimilée automatiquement à un concert complet.</em></p>
			<div class="cfo-salles-legend">
				<span><i class="sale"></i><b>En vente</b> : places disponibles au dernier contrôle</span>
				<span><i class="doc"></i><b>Jauge</b> : capacité documentée quand une source fiable est disponible</span>
				<span><i class="fresh"></i><b>Fraîcheur</b> : date du dernier contrôle de billetterie</span>
			</div>
			<div class="cfo-salles-table-wrap">
				<table class="cfo-salles-table">
					<thead><tr>
						<th>Date</th><th>Ville</th><th>Salle</th><th>Capacité / jauge connue</th>
						<th>Billetterie</th><th>Statut CFO</th><th>Prix indicatif</th><th>Dernier contrôle</th>
					</tr></thead>
					<tbody>
					<?php foreach ( $items as $index => $item ) :
						$status = (string) ( $item['ticket_status'] ?? 'unknown' );
						list( $status_label, $status_class ) = cfo_salles_status_label( $status );
						$ticket_url = (string) ( $item['ticket_url'] ?? '' );
						$price_min = isset( $item['price_min'] ) && '' !== $item['price_min'] ? (float) $item['price_min'] : null;
						$price_max = isset( $item['price_max'] ) && '' !== $item['price_max'] ? (float) $item['price_max'] : null;
						$checked_at = ! empty( $item['checked_at'] ) ? strtotime( $item['checked_at'] ) : null;
						$freshness = (string) ( $item['freshness_status'] ?? 'missing' );
						$classes = array();
						if ( 0 === $index ) $classes[] = 'is-next';
						if ( $index > 0 && wp_date( 'm', strtotime( $item['event_date'] ) ) !== wp_date( 'm', strtotime( $items[$index-1]['event_date'] ) ) ) $classes[] = 'month-start';
					?>
						<tr class="<?php echo esc_attr( implode( ' ', $classes ) ); ?>">
							<td><?php echo esc_html( wp_date( 'd/m/Y', strtotime( $item['event_date'] ) ) ); ?><?php if ( 0 === $index ) : ?> <span class="cfo-salles-next">prochaine</span><?php endif; ?></td>
							<td><?php echo esc_html( $item['city'] ?? '—' ); ?></td>
							<td><?php echo esc_html( $item['venue'] ?? '—' ); ?></td>
							<td><?php echo esc_html( $item['capacity_label'] ?? 'À documenter' ); ?></td>
							<td>
								<?php if ( 'on_sale' === $status && $ticket_url ) : ?>
									<a class="cfo-ticket-btn" href="<?php echo esc_url( $ticket_url ); ?>" target="_blank" rel="noopener noreferrer">Acheter les places →</a>
									<?php if ( ! empty( $item['ticket_source_name'] ) ) : ?><small><?php echo esc_html( $item['ticket_source_name'] ); ?></small><?php endif; ?>
								<?php elseif ( 'sold_out' === $status ) : ?>
									<span>Plus de places constatées</span>
								<?php elseif ( 'coming_soon' === $status ) : ?>
									<span>Mise en vente annoncée</span>
								<?php else : ?>
									<span>À recontrôler</span>
								<?php endif; ?>
							</td>
							<td><strong class="cfo-status-pill <?php echo esc_attr( $status_class ); ?>"><?php echo esc_html( $status_label ); ?></strong></td>
							<td><?php
								if ( null !== $price_min && null !== $price_max && $price_max > $price_min ) {
									echo esc_html( number_format_i18n( $price_min, 0 ) . '–' . number_format_i18n( $price_max, 0 ) . ' €' );
								} elseif ( null !== $price_min ) {
									echo esc_html( 'dès ' . number_format_i18n( $price_min, 0 ) . ' €' );
								} else {
									echo '—';
								}
							?></td>
							<td><span class="cfo-freshness-dot is-<?php echo esc_attr( $freshness ); ?>"></span><?php echo $checked_at ? esc_html( wp_date( 'd/m/Y', $checked_at ) ) : '—'; ?></td>
						</tr>
					<?php endforeach; ?>
					</tbody>
				</table>
			</div>
			<h2>Comment lire ce tableau</h2>
			<ul>
				<li><strong>COMPLET</strong> — une source de billetterie indique explicitement que la date est complète.</li>
				<li><strong>BIENTÔT</strong> — date confirmée, vente annoncée mais pas encore ouverte au moment du contrôle.</li>
				<li><strong>EN VENTE</strong> — des places sont disponibles au moment du contrôle ; le bouton mène à la billetterie.</li>
				<li><strong>À VÉRIFIER</strong> — la donnée n’est pas assez fraîche ou suffisamment documentée pour conclure.</li>
			</ul>
			<h2>Capacité d’une salle ≠ jauge du concert</h2>
			<p>Une salle peut accueillir plusieurs configurations. La capacité affichée décrit donc la salle ou une configuration connue, pas nécessairement le nombre exact de billets commercialisés pour le concert de Marine.</p>
			<h2>Sources</h2>
			<p>Les statuts et liens d’achat sont recoupés avec les billetteries, les salles et les producteurs. CFO conserve la date du dernier contrôle pour éviter de présenter un ancien statut comme actuel.</p>
		</div>
	</article>
</main>
<?php get_footer(); ?>
