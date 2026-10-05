<?php
/**
 * Restore TSF metadata on the WordPress page embedding the forum.
 * Native wpForo routes retain wpForo's own SEO output.
 */
function cfo_forum_landing_seo() {
	if ( is_admin() || ! is_page( 138 ) ) {
		return;
	}
	$request_path = wp_parse_url( wp_unslash( $_SERVER['REQUEST_URI'] ?? '' ), PHP_URL_PATH );
	$landing_path = wp_parse_url( get_permalink( 138 ), PHP_URL_PATH );
	if ( ! $request_path || ! $landing_path || untrailingslashit( $request_path ) !== untrailingslashit( $landing_path ) ) {
		return;
	}
	$head = '\\The_SEO_Framework\\Front\\Meta\\Head';
	if ( ! is_callable( array( $head, 'print_wrap_and_tags' ) ) ) {
		return;
	}
	remove_filter( 'the_seo_framework_title_from_generation', 'The_SEO_Framework\\_wpforo_filter_pre_title', 10 );
	remove_filter( 'document_title_parts', 'wpforo_meta_title', 100 );
	remove_filter( 'wp_title', 'wpforo_meta_wp_title', 100 );
	add_action( 'wp_head', array( $head, 'print_wrap_and_tags' ), 1 );
}
add_action( 'wp_head', 'cfo_forum_landing_seo', 0 );
