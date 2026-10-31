<?php
/** CFO translations. Supabase remains authoritative; French posts are never modified. */
defined( 'ABSPATH' ) || exit;

/** WPVibe has already authenticated and swapped the theme before this code runs.
 * A query parameter, cookie, or theme suffix on its own never grants access.
 */
function cfo_translation_preview_active() {
    if ( ! class_exists( 'WPVibe_Preview' ) ) { return false; }
    $draft = get_option( 'wpvibe_draft_theme', '' );
    return 'cfo-wpvibe-draft' === $draft
        && $draft === get_stylesheet()
        && $draft !== get_option( 'stylesheet' );
}

function cfo_translation_source_hash( $post ) {
    return hash( 'sha256', wp_json_encode(
        array( $post->post_title, $post->post_excerpt, $post->post_content ),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    ) );
}

function cfo_translation_is_dutch() {
    return function_exists( 'cfo_international_locale' ) && 'nl-BE' === cfo_international_locale();
}

function cfo_translation_request_headers() {
    $headers = array( 'apikey' => 'sb_publishable_VTwtMvGk29IDrz__M99Yag_TYrLzTRG', 'Accept' => 'application/json' );
    if ( ! cfo_translation_preview_active() ) { return $headers; }
    $sync = get_option( 'cfo_supabase_sync_options', array() );
    if ( ! is_array( $sync ) || empty( $sync['secret'] ) || empty( $sync['key'] )
        || rtrim( $sync['url'] ?? '', '/' ) !== 'https://fjpcuxsezeuajhlotzij.supabase.co' ) { return null; }
    $headers['apikey'] = $sync['key'];
    $headers['X-WP-Sync-Secret'] = $sync['secret'];
    return $headers;
}

function cfo_interface_get() {
    static $labels = null;
    if ( ! cfo_translation_is_dutch() ) { return array(); }
    if ( null !== $labels ) { return $labels; }
    $labels = array();
    $headers = cfo_translation_request_headers();
    if ( ! $headers ) { return $labels; }
    $url = add_query_arg( array( 'source_key'=>'eq.cfo:ui','locale'=>'eq.nl-BE',
        'status'=>cfo_translation_preview_active() ? 'in.(review,approved,published)' : 'eq.published',
        'select'=>'translated_labels','limit'=>1 ), 'https://fjpcuxsezeuajhlotzij.supabase.co/rest/v1/cfo_interface_translations' );
    $response = wp_remote_get( $url, array( 'timeout'=>8, 'redirection'=>0, 'headers'=>$headers ) );
    if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) { return $labels; }
    $rows = json_decode( wp_remote_retrieve_body( $response ), true );
    if ( is_array( $rows ) && isset( $rows[0]['translated_labels'] ) && is_array( $rows[0]['translated_labels'] ) ) {
        foreach ( $rows[0]['translated_labels'] as $key => $value ) {
            if ( is_string( $key ) && is_string( $value ) ) { $labels[$key] = $value; }
        }
    }
    return $labels;
}

add_action( 'wp_enqueue_scripts', function() {
    if ( cfo_translation_is_dutch() ) {
        wp_add_inline_script( 'cfo-nl-be-glossary', 'window.cfoNlBeLabels=' . wp_json_encode( cfo_interface_get() ) . ';', 'before' );
    }
}, 100 );

function cfo_translation_get( $id, $type ) {
    static $memo = array();
    if ( ! cfo_translation_is_dutch() || ! in_array( $type, array( 'page', 'post' ), true ) ) { return null; }
    $post = get_post( $id );
    if ( ! $post || $type !== $post->post_type || 'publish' !== $post->post_status ) { return null; }
    $preview = cfo_translation_preview_active();
    $hash = cfo_translation_source_hash( $post );
    $key = implode( ':', array( 'nl-BE', $type, (int) $id, $hash, $preview ? 'preview' : 'public' ) );
    if ( array_key_exists( $key, $memo ) ) { return $memo[ $key ]; }
    $memo[ $key ] = null;
    // Credentials stay in the server request; they never enter scripts/URLs.
    $headers = cfo_translation_request_headers();
    if ( ! $headers ) { return null; }
    $params = array(
        'select' => 'translated_title,translated_content,translated_excerpt,source_hash,source_revision,status',
        'source_system' => 'eq.wordpress', 'source_type' => 'eq.' . $type,
        'source_id' => 'eq.' . absint( $id ), 'locale' => 'eq.nl-BE',
        'status' => $preview ? 'in.(review,approved,published)' : 'eq.published', 'limit' => 1,
    );
    $response = wp_remote_get( add_query_arg( $params, 'https://fjpcuxsezeuajhlotzij.supabase.co/rest/v1/cfo_content_translations' ), array(
        'timeout' => 8, 'redirection' => 0, 'headers' => $headers,
    ) );
    if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) { return null; }
    $rows = json_decode( wp_remote_retrieve_body( $response ), true );
    if ( ! is_array( $rows ) || count( $rows ) !== 1 || ! is_array( $rows[0] ) ) { return null; }
    $row = $rows[0];
    if ( ! isset( $row['source_hash'], $row['translated_title'], $row['translated_content'], $row['translated_excerpt'] )
        || ! hash_equals( $hash, $row['source_hash'] ) ) { return null; }
    // Request-local caching avoids preview leakage and stale shared caches.
    $memo[ $key ] = $row;
    return $row;
}

function cfo_translation_missing( $kind = 'content' ) {
    if ( 'title' === $kind ) { return 'Nederlandse vertaling niet beschikbaar'; }
    return '<div class="cfo-translation-missing" role="status" data-cfo-translation-error="missing-or-stale"><p>Deze inhoud is nog niet beschikbaar in het Nederlands (België).</p></div>';
}

function cfo_translation_content( $content ) {
    if ( is_admin() || ! cfo_translation_is_dutch() || ! is_singular() || ! in_the_loop() || ! is_main_query() ) { return $content; }
    $post = get_post();
    if ( ! $post ) { return cfo_translation_missing(); }
    $row = cfo_translation_get( $post->ID, $post->post_type );
    return $row ? $row['translated_content'] : cfo_translation_missing();
}
// Before do_blocks (9), wpautop (10) and do_shortcode (11): translated
// WordPress content retains its normal block/shortcode rendering lifecycle.
add_filter( 'the_content', 'cfo_translation_content', 8 );

function cfo_translation_title( $title, $id = 0 ) {
    if ( is_admin() || ! cfo_translation_is_dutch() || ! $id ) { return $title; }
    $post = get_post( $id );
    if ( ! $post || ! in_array( $post->post_type, array( 'page', 'post' ), true ) ) { return $title; }
    $row = cfo_translation_get( $id, $post->post_type );
    return $row ? $row['translated_title'] : cfo_translation_missing( 'title' );
}
add_filter( 'the_title', 'cfo_translation_title', 100, 2 );

add_filter( 'get_the_excerpt', function( $excerpt, $post ) {
    if ( is_admin() || ! cfo_translation_is_dutch() || ! $post ) { return $excerpt; }
    $row = cfo_translation_get( $post->ID, $post->post_type );
    return $row ? $row['translated_excerpt'] : cfo_translation_missing( 'title' );
}, 100, 2 );

add_filter( 'document_title_parts', function( $parts ) {
    if ( cfo_translation_is_dutch() && is_singular() ) {
        $post = get_post( get_queried_object_id() );
        $row = $post ? cfo_translation_get( $post->ID, $post->post_type ) : null;
        $parts['title'] = $row ? $row['translated_title'] : cfo_translation_missing( 'title' );
    }
    return $parts;
}, 100 );

add_action( 'template_redirect', function() {
    if ( ! cfo_translation_is_dutch() ) { return; }
    if ( ! defined( 'DONOTCACHEPAGE' ) ) { define( 'DONOTCACHEPAGE', true ); }
    nocache_headers();
    header( 'Cache-Control: private, no-store, max-age=0', true );
    header( 'X-Robots-Tag: noindex, nofollow', true );
    if ( is_singular() ) {
        $post = get_post( get_queried_object_id() );
        if ( ! $post || ! cfo_translation_get( $post->ID, $post->post_type ) ) { status_header( 503 ); }
    }
}, 0 );
