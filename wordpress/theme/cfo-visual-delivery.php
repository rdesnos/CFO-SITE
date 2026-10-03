<?php
/**
 * Serve responsive CFO images from the verified media delivery projection.
 * The asset records and original files remain in the Supabase media library.
 */
function cfo_visual_delivery_image( $image, $context, $attachment_id ) {
	if ( ! class_exists( 'WP_HTML_Tag_Processor' ) ) {
		return $image;
	}
	$config = get_option( 'cfo_visual_delivery', array() );
	if ( ! is_array( $config ) || empty( $config['images'] ) ) {
		return $image;
	}
	$tag = new WP_HTML_Tag_Processor( $image );
	if ( ! $tag->next_tag( 'IMG' ) ) {
		return $image;
	}
	$src = $tag->get_attribute( 'src' );
	if ( ! is_string( $src ) || empty( $config['images'][ $src ] ) ) {
		return $image;
	}
	$asset = $config['images'][ $src ];
	if ( empty( $asset['url'] ) || empty( $asset['srcset'] ) ) {
		return $image;
	}
	$tag->set_attribute( 'src', esc_url_raw( $asset['url'] ) );
	$tag->set_attribute( 'srcset', $asset['srcset'] );
	$tag->set_attribute( 'sizes', is_front_page() ? '(max-width: 780px) 100vw, 380px' : '(max-width: 960px) 100vw, 960px' );
	$tag->set_attribute( 'decoding', 'async' );
	return $tag->get_updated_html();
}
add_filter( 'wp_content_img_tag', 'cfo_visual_delivery_image', 20, 3 );
