<?php
/**
 * CFO — bloc d'écoute multi-ISRC piloté par Supabase.
 * État publié et validé le 2026-09-13.
 */
function cfo_get_dossier_audio_links( $post_id ) {
	$cache_key = 'cfo_audio_' . absint( $post_id );
	$cached = get_transient( $cache_key );
	if ( false !== $cached ) {
		return is_array( $cached ) ? $cached : array();
	}

	$endpoint = 'https://fjpcuxsezeuajhlotzij.supabase.co/rest/v1/cfo_dossier_audio_recordings?select=track_title,version_label,isrc,duration_seconds,spotify_url,youtube_url,deezer_url,is_primary,sort_order&wp_post_id=eq.' . absint( $post_id ) . '&is_active=eq.true&order=is_primary.desc,sort_order.asc';
	$anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqcGN1eHNlemV1YWpobG90emlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMDY4NjAsImV4cCI6MjA5NzU4Mjg2MH0.K8COlpSt544LkRRLkXFBAfwtTEH0MzNKGgY-1H_uDoY';
	$response = wp_remote_get( $endpoint, array(
		'timeout' => 4,
		'headers' => array(
			'apikey' => $anon_key,
			'Authorization' => 'Bearer ' . $anon_key,
		),
	) );

	if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
		set_transient( $cache_key, '__none__', 5 * MINUTE_IN_SECONDS );
		return array();
	}

	$rows = json_decode( wp_remote_retrieve_body( $response ), true );
	$data = is_array( $rows ) ? array_values( array_filter( $rows, 'is_array' ) ) : array();
	set_transient( $cache_key, $data ? $data : '__none__', HOUR_IN_SECONDS );
	return $data;
}

function cfo_dossier_audio_tuner( $content ) {
	if ( ! is_page() || false !== strpos( $content, 'cfo-audio-tuner' ) ) return $content;
	$post_id = get_queried_object_id();
	$recordings = cfo_get_dossier_audio_links( $post_id );
	if ( empty( $recordings ) ) return $content;
	$figure_end = strpos( $content, '</figure>' );
	if ( false === $figure_end ) return $content;
	$figure_end += strlen( '</figure>' );

	$primary = $recordings[0];
	foreach ( $recordings as $recording ) {
		if ( ! empty( $recording['is_primary'] ) ) { $primary = $recording; break; }
	}
	$platforms = array( 'spotify' => 'Spotify', 'youtube' => 'YouTube', 'deezer' => 'Deezer' );
	$link_html = '';
	foreach ( $platforms as $platform => $label ) {
		$url_key = $platform . '_url';
		if ( empty( $primary[ $url_key ] ) ) continue;
		$link_html .= '<a href="' . esc_url( $primary[ $url_key ] ) . '" target="_blank" rel="noopener noreferrer"><span class="cfo-audio-tuner__brand"><span class="cfo-audio-tuner__dot cfo-audio-tuner__dot--' . esc_attr( $platform ) . '"></span>' . esc_html( $label ) . '</span></a>';
	}
	if ( '' === $link_html ) return $content;

	$version_html = '';
	if ( count( $recordings ) > 1 ) {
		$version_html .= '<div class="cfo-audio-tuner__versions"><span>Autres versions</span>';
		foreach ( $recordings as $recording ) {
			if ( ! empty( $recording['is_primary'] ) ) continue;
			$version_links = '';
			foreach ( $platforms as $platform => $label ) {
				$url_key = $platform . '_url';
				if ( ! empty( $recording[ $url_key ] ) ) $version_links .= '<a href="' . esc_url( $recording[ $url_key ] ) . '" target="_blank" rel="noopener noreferrer">' . esc_html( $label ) . '</a>';
			}
			if ( '' !== $version_links ) $version_html .= '<div><strong>' . esc_html( $recording['version_label'] ?? 'Version alternative' ) . '</strong><small>ISRC ' . esc_html( $recording['isrc'] ?? '' ) . '</small><nav>' . $version_links . '</nav></div>';
		}
		$version_html .= '</div>';
	}

	$track_title = ! empty( $primary['track_title'] ) ? $primary['track_title'] : 'ce morceau';
	$version_label = ! empty( $primary['version_label'] ) ? $primary['version_label'] : 'Version principale';
	$isrc = ! empty( $primary['isrc'] ) ? $primary['isrc'] : '';
	$bars = str_repeat( '<span></span>', 28 );
	$tuner = '<div class="cfo-audio-tuner" role="group" aria-label="Écouter ' . esc_attr( $track_title ) . ' sur les plateformes musicales">'
		. '<div class="cfo-audio-tuner__label"><strong>Écouter le morceau</strong><em>' . esc_html( $track_title ) . '</em><small>' . esc_html( $version_label ) . ( $isrc ? ' · ISRC ' . esc_html( $isrc ) : '' ) . '</small></div>'
		. '<div class="cfo-audio-tuner__screen"><div class="cfo-audio-tuner__wave" aria-hidden="true">' . $bars . '</div>'
		. '<div class="cfo-audio-tuner__links">' . $link_html . '</div>' . $version_html . '</div>'
		. '<div class="cfo-audio-tuner__right">Musique<br>Émotions<br>Histoires</div></div>';
	return substr( $content, 0, $figure_end ) . $tuner . substr( $content, $figure_end );
}
add_filter( 'the_content', 'cfo_dossier_audio_tuner', 20 );
