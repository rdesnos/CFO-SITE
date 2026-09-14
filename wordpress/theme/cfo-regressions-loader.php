<?php
/**
 * CFO — chargeur des composants restaurés après régression Hostinger.
 * À inclure depuis functions.php du thème live.
 */
$audio_tuner_file = get_theme_file_path( 'cfo-audio-tuner.php' );
if ( file_exists( $audio_tuner_file ) ) {
	require_once $audio_tuner_file;
}

add_action( 'wp_enqueue_scripts', function() {
	$dossier_css = get_theme_file_path( 'cfo-dossier.css' );
	$tuner_css   = get_theme_file_path( 'cfo-audio-tuner.css' );
	if ( file_exists( $dossier_css ) ) {
		wp_enqueue_style( 'cfo-dossier', get_theme_file_uri( 'cfo-dossier.css' ), array(), (string) filemtime( $dossier_css ) );
	}
	if ( file_exists( $tuner_css ) ) {
		wp_enqueue_style( 'cfo-audio-tuner', get_theme_file_uri( 'cfo-audio-tuner.css' ), array(), (string) filemtime( $tuner_css ) );
	}
}, 30 );
