<?php
/**
 * CFO functions.
 */

function cfo_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption' ) );
	register_nav_menus( array(
		'primary' => __( 'Primary Menu', 'cfo' ),
	) );
}
add_action( 'after_setup_theme', 'cfo_setup' );

function cfo_scripts() {
	wp_enqueue_style( 'cfo-style', get_stylesheet_uri(), array(), wp_get_theme()->get( 'Version' ) );
	wp_enqueue_style( 'cfo-tuner-fonts', 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=DotGothic16&display=swap', array(), null );
	wp_enqueue_style( 'cfo-timeline', get_theme_file_uri( 'assets/cfo-timeline.css' ), array( 'cfo-style' ), '1.0.0' );
	wp_enqueue_style( 'cfo-certifications', get_theme_file_uri( 'assets/cfo-certifications.css' ), array( 'cfo-style' ), '1.0.0' );
	wp_enqueue_style( 'cfo-audio-tuner', get_theme_file_uri( 'cfo-audio-tuner.css' ), array( 'cfo-style' ), '20260914-master11' );
	wp_enqueue_script( 'cfo-audio-tuner', get_theme_file_uri( 'cfo-audio-tuner.js' ), array(), '20260914-master9', true );
	if ( is_page( 582 ) ) {
		wp_enqueue_script( 'cfo-mgp-math', get_theme_file_uri( 'assets/js/mgp-math.js' ), array(), '20260915-1', true );
	}
	if ( is_page( 'actualites' ) ) {
		wp_enqueue_style( 'cfo-actualites', get_theme_file_uri( 'assets/cfo-actualites.css' ), array( 'cfo-style' ), '20260925-3' );
		wp_enqueue_script( 'cfo-actualites', get_theme_file_uri( 'assets/js/cfo-actualites.js' ), array(), '20260925-4', array( 'strategy' => 'defer', 'in_footer' => true ) );
	}
	wp_enqueue_style( 'cfo-narration-player', get_theme_file_uri( 'assets/cfo-narration-player.css' ), array( 'cfo-style' ), '20260914-1' );
	wp_enqueue_script(
		'alpinejs',
		get_theme_file_uri( 'assets/js/alpine.min.js' ),
		array(),
		'3.15.12',
		array( 'strategy' => 'defer' )
	);

	// Compiled Tailwind output. Present only after publish; skip in draft
	// mode so the browser CDN can take over. filemtime() doubles as cache-bust.
	$dist     = get_stylesheet_directory() . '/dist/styles.css';
	$is_draft = get_option( 'wpvibe_draft_theme' ) === get_stylesheet();
	if ( ! $is_draft && file_exists( $dist ) ) {
		wp_enqueue_style(
			'cfo-compiled',
			get_theme_file_uri( 'dist/styles.css' ),
			array(),
			filemtime( $dist )
		);
	}
}
add_action( 'wp_enqueue_scripts', 'cfo_scripts' );
require_once get_theme_file_path( 'cfo-audio-tuner.php' );

/** CFO narration player — Entre les lignes. Audio is generated once and cached in Supabase. */
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

/* ───────────────────────────────────────────────────────────────────────────
   Gutenberg integration — sync design tokens from theme.css.

   theme.css's @theme block is the single source of truth. Tailwind reads it
   on the frontend (inlined into a <style type="text/tailwindcss"> block by
   template-parts/head.php). This function parses the same file and registers
   the palette + font sizes with Gutenberg via add_theme_support(), so the
   block editor's color picker / font selector show the same tokens.

   No theme.json — single source of truth, zero drift.
   ─────────────────────────────────────────────────────────────────────────── */

function cfo_editor_tokens() {
	$css_path = get_stylesheet_directory() . '/theme.css';
	if ( ! file_exists( $css_path ) ) {
		return;
	}
	$css = file_get_contents( $css_path );
	if ( false === $css || ! preg_match( '/@theme\s*\{([\s\S]+?)\}/', $css, $m ) ) {
		return;
	}
	$body = $m[1];

	// --color-{slug}: {value};   (skip numeric shades like primary-50, primary-500)
	$palette = array();
	if ( preg_match_all( '/--color-([a-z0-9_-]+?)\s*:\s*([^;]+);/i', $body, $matches, PREG_SET_ORDER ) ) {
		foreach ( $matches as $match ) {
			if ( preg_match( '/-\d+$/', $match[1] ) ) {
				continue;
			}
			$palette[] = array(
				'slug'  => $match[1],
				'name'  => ucwords( str_replace( '-', ' ', $match[1] ) ),
				'color' => trim( $match[2] ),
			);
		}
	}
	if ( $palette ) {
		add_theme_support( 'editor-color-palette', $palette );
	}

	// --text-{slug}: {value};
	$sizes = array();
	if ( preg_match_all( '/--text-([a-z0-9_-]+)\s*:\s*([^;]+);/i', $body, $matches, PREG_SET_ORDER ) ) {
		foreach ( $matches as $match ) {
			$sizes[] = array(
				'slug' => $match[1],
				'name' => strtoupper( $match[1] ),
				'size' => trim( $match[2] ),
			);
		}
	}
	if ( $sizes ) {
		add_theme_support( 'editor-font-sizes', $sizes );
	}

	// Editor stylesheet for prose styling inside the Gutenberg iframe.
	add_editor_style( 'editor.css' );

	// Lock users to the palette in the block editor color picker.
	add_theme_support( 'disable-custom-colors' );
}
add_action( 'after_setup_theme', 'cfo_editor_tokens', 20 );

/* ───────────────────────────────────────────────────────────────────────────
   Auto-create Home + Blog pages on first activation.

   WordPress defaults to blog-mode (homepage = latest posts). For ~80% of
   AI-built sites the user wants a static homepage with a separate blog
   page. On first activation we create the two pages (if they don't exist)
   and point the static-front-page settings at them. Skipped entirely if
   the user has already configured a static front page.
   ─────────────────────────────────────────────────────────────────────────── */

function cfo_setup_pages() {
	if ( 'page' === get_option( 'show_on_front' ) && get_option( 'page_on_front' ) ) {
		return;
	}

	$home = get_page_by_path( 'home' );
	$home_id = $home ? (int) $home->ID : wp_insert_post( array(
		'post_title'  => 'Home',
		'post_name'   => 'home',
		'post_status' => 'publish',
		'post_type'   => 'page',
	) );

	$blog = get_page_by_path( 'blog' );
	$blog_id = $blog ? (int) $blog->ID : wp_insert_post( array(
		'post_title'  => 'Blog',
		'post_name'   => 'blog',
		'post_status' => 'publish',
		'post_type'   => 'page',
	) );

	if ( $home_id && ! is_wp_error( $home_id ) && $blog_id && ! is_wp_error( $blog_id ) ) {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $home_id );
		update_option( 'page_for_posts', $blog_id );
	}
}
add_action( 'after_switch_theme', 'cfo_setup_pages' );

/* ───────────────────────────────────────────────────────────────────────────
   Editable surfaces (Settings -> WPVibe + per-page meta).

   Wrapped in function_exists so the theme degrades gracefully if the
   WPVibe plugin is deactivated. Read with get_option / get_post_meta
   anywhere in templates.
   ─────────────────────────────────────────────────────────────────────────── */

if ( function_exists( 'wpvibe_setting_register' ) ) {
	wpvibe_setting_register( 'cfo_tagline', array(
		'type'        => 'text',
		'label'       => 'Site tagline',
		'description' => 'Appears in the site header next to the brand name.',
		'default'     => '',
	) );
}

if ( function_exists( 'wpvibe_field_register' ) ) {
	wpvibe_field_register( 'page', 'hero_heading', array(
		'type'        => 'text',
		'label'       => 'Hero heading',
		'description' => 'Large headline at the top of the page. Shown on front-page.php.',
	) );
	wpvibe_field_register( 'page', 'hero_subheading', array(
		'type'        => 'textarea',
		'label'       => 'Hero subheading',
		'description' => 'Supporting text below the hero heading.',
	) );
}

