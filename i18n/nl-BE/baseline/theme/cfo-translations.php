<?php
/**
 * CFO Marine — published WordPress translations held in Supabase.
 * No private credentials in public theme files. Draft/review data never leaves Supabase.
 */
function cfo_translation_get( $id, $type ) {
    if ( ! function_exists( 'cfo_international_locale' ) ) { return null; }
    $locale = cfo_international_locale();
    if ( 'fr-FR' === $locale || ! in_array( $type, array( 'page', 'post' ), true ) ) { return null; }
    $cache_key = 'cfo_trans_' . $type . '_' . absint( $id ) . '_' . str_replace( '-', '_', $locale );
    $cached = get_transient( $cache_key );
    if ( false !== $cached ) { return is_array( $cached ) ? $cached : null; }
    $base = 'https://fjpcuxsezeuajhlotzij.supabase.co/rest/v1/cfo_content_translations';
    $params = array(
        'select' => 'translated_title,translated_content,translated_excerpt',
        'source_type' => 'eq.' . $type,
        'source_id' => 'eq.' . absint( $id ),
        'locale' => 'eq.' . $locale,
        'status' => 'eq.published',
        'limit' => '1',
    );
    $response = wp_remote_get( add_query_arg( $params, $base ), array(
        'timeout' => 4,
        'headers' => array( 'apikey' => 'sb_publishable_VTwtMvGk29IDrz__M99Yag_TYrLzTRG' ),
    ) );
    if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) { return null; }
    $rows = json_decode( wp_remote_retrieve_body( $response ), true );
    $value = is_array( $rows ) && isset( $rows[0] ) && is_array( $rows[0] ) ? $rows[0] : null;
    set_transient( $cache_key, $value ?: '__missing__', $value ? 5 * MINUTE_IN_SECONDS : MINUTE_IN_SECONDS );
    return $value;
}
function cfo_translation_content( $content ) {
    if ( is_admin() || ! is_singular() || ! in_the_loop() || ! is_main_query() ) { return $content; }
    $post = get_post();
    if ( ! $post ) { return $content; }
    $translated = cfo_translation_get( $post->ID, $post->post_type );
    return $translated && ! empty( $translated['translated_content'] ) ? $translated['translated_content'] : $content;
}
add_filter( 'the_content', 'cfo_translation_content', 20 );
function cfo_translation_title( $title, $id = 0 ) {
    if ( is_admin() || ! is_singular() || ! in_the_loop() || ! $id || absint( $id ) !== get_queried_object_id() ) { return $title; }
    $post = get_post( $id );
    if ( ! $post ) { return $title; }
    $translated = cfo_translation_get( $id, $post->post_type );
    return $translated && ! empty( $translated['translated_title'] ) ? $translated['translated_title'] : $title;
}
add_filter( 'the_title', 'cfo_translation_title', 20, 2 );

