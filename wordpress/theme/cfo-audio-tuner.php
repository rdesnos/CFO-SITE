<?php
/**
 * CFO — bloc d'écoute piloté par Supabase.
 * État validé le 2026-09-13.
 * À intégrer au functions.php du thème CFO.
 */
function cfo_get_dossier_audio_links( $post_id ) {
    $cache_key = 'cfo_audio_' . absint( $post_id );
    $cached = get_transient( $cache_key );
    if ( false !== $cached ) {
        return is_array( $cached ) ? $cached : array();
    }

    $endpoint = 'https://fjpcuxsezeuajhlotzij.supabase.co/rest/v1/cfo_dossier_audio_links?select=track_title,duration_seconds,spotify_url,youtube_url,deezer_url&wp_post_id=eq.' . absint( $post_id ) . '&is_active=eq.true&limit=1';
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
    $data = ( is_array( $rows ) && ! empty( $rows[0] ) && is_array( $rows[0] ) ) ? $rows[0] : array();
    set_transient( $cache_key, $data ? $data : '__none__', HOUR_IN_SECONDS );
    return $data;
}

function cfo_dossier_audio_tuner( $content ) {
    if ( ! is_page() || false !== strpos( $content, 'cfo-audio-tuner' ) ) {
        return $content;
    }

    $post_id = get_queried_object_id();
    $audio = cfo_get_dossier_audio_links( $post_id );
    if ( empty( $audio ) ) {
        return $content;
    }

    $figure_end = strpos( $content, '</figure>' );
    if ( false === $figure_end ) {
        return $content;
    }
    $figure_end += strlen( '</figure>' );

    $links = array(
        'spotify' => array( 'label' => 'Spotify', 'url' => $audio['spotify_url'] ?? '' ),
        'youtube' => array( 'label' => 'YouTube', 'url' => $audio['youtube_url'] ?? '' ),
        'deezer'  => array( 'label' => 'Deezer',  'url' => $audio['deezer_url'] ?? '' ),
    );
    $link_html = '';
    foreach ( $links as $platform => $link ) {
        if ( empty( $link['url'] ) ) continue;
        $link_html .= '<a href="' . esc_url( $link['url'] ) . '" target="_blank" rel="noopener noreferrer"><span class="cfo-audio-tuner__brand"><span class="cfo-audio-tuner__dot cfo-audio-tuner__dot--' . esc_attr( $platform ) . '"></span>' . esc_html( $link['label'] ) . '</span></a>';
    }
    if ( '' === $link_html ) return $content;

    $track_title = ! empty( $audio['track_title'] ) ? $audio['track_title'] : 'ce morceau';
    $bars = str_repeat( '<span></span>', 28 );
    $tuner = '<div class="cfo-audio-tuner" role="group" aria-label="Écouter ' . esc_attr( $track_title ) . ' sur les plateformes musicales">'
        . '<div class="cfo-audio-tuner__label"><strong>Écouter le morceau</strong><em>Sur vos plateformes préférées</em></div>'
        . '<div class="cfo-audio-tuner__screen"><div class="cfo-audio-tuner__wave" aria-hidden="true">' . $bars . '</div>'
        . '<div class="cfo-audio-tuner__links">' . $link_html . '</div></div>'
        . '<div class="cfo-audio-tuner__right">Musique<br>Émotions<br>Histoires</div>'
        . '</div>';

    return substr( $content, 0, $figure_end ) . $tuner . substr( $content, $figure_end );
}
add_filter( 'the_content', 'cfo_dossier_audio_tuner', 20 );
