<?php
defined( 'ABSPATH' ) || exit;
require_once __DIR__ . '/rde-bilingual.php';
add_filter( 'wpcf7_form_elements', function( $html ) {
    return rde_site_is_english() ? preg_replace( '~(?<=>)(\s*)Objet(\s*)(?=<)~u', '$1Subject$2', $html ) : $html;
} );
add_filter( 'do_shortcode_tag', function( $html, $tag ) {
    return $tag === 'contact-form-7' && rde_site_is_english() ? preg_replace( '~\blang="fr(?:-FR)?"~', 'lang="en-GB"', $html ) : $html;
}, 1000, 2 );
// Keep native page IDs, shortcodes, data widgets and existing regional editions.
add_filter( 'the_content', function( $content ) {
    return rde_site_is_english() ? rde_site_language_html( $content ) : $content;
}, 1000 );
add_filter( 'the_title', function( $title ) {
    if ( ! rde_site_is_english() ) { return $title; }
    return rde_site_language_config()['dictionary'][ rde_site_text_key( $title ) ] ?? $title;
}, 1000 );
add_filter( 'get_the_excerpt', function( $excerpt, $post ) {
    if ( ! rde_site_is_english() || ! $post ) { return $excerpt; }
    return rde_site_language_config()['english_excerpts'][ $post->ID ] ?? $excerpt;
}, 1000, 2 );
add_filter( 'language_attributes', function( $value ) {
    return rde_site_is_english() ? 'lang="en-GB"' : $value;
}, 200 );
