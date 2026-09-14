<?php
/**
 * CFO narration integration — production reference 2026-09-14.
 * NOTE: this tracked fragment documents the production hook to be merged with the full theme source.
 */

function cfo_narration_player( $content ) {
	if ( ! is_page() || ! in_the_loop() || ! is_main_query() || false === strpos( $content, 'cfo-dossier-illustration' ) ) {
		return $content;
	}
	$slug = get_post_field( 'post_name', get_the_ID() );
	$audio_url = 'https://fjpcuxsezeuajhlotzij.supabase.co/storage/v1/object/public/cfo-media/audio/entre-les-lignes/' . rawurlencode( $slug ) . '.mp3';
	$response = wp_remote_head( $audio_url, array( 'timeout' => 2 ) );
	if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
		return $content;
	}
	$title = get_the_title();
	$player = '<div class="cfo-narration-player"><p class="cfo-narration-kicker">CFO · L&rsquo;article à écouter</p><p class="cfo-narration-title">' . esc_html( $title ) . '</p><audio controls preload="metadata" src="' . esc_url( $audio_url ) . '">Votre navigateur ne prend pas en charge la lecture audio.</audio><p class="cfo-narration-note">Narration CFO · version audio de l&rsquo;article</p></div>';
	$marker = '<!-- cfo-dossier-illustration -->';
	return str_replace( $marker, $marker . $player, $content );
}
add_filter( 'the_content', 'cfo_narration_player', 8 );
