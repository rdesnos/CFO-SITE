<?php
defined( 'ABSPATH' ) || exit;
/** Per-site FR/EN configuration, independent of the active theme's editorial layout. */
function rde_site_language_config() {
    static $config;
    if ( $config === null ) {
        $host = preg_replace( '/^www\./i', '', (string) wp_parse_url( home_url( '/' ), PHP_URL_HOST ) );
        $host = preg_replace( '/[^a-z0-9.-]/i', '', $host );
        $file = __DIR__ . '/assets/rde-bilingual/' . $host . '.json';
        $config = is_readable( $file ) ? ( json_decode( file_get_contents( $file ), true ) ?: array() ) : array();
        foreach ( $config['dictionary_files'] ?? array() as $dictionary_file ) {
            if ( ! is_string( $dictionary_file ) || ! preg_match( '/^[a-z0-9-]+\.json$/', $dictionary_file ) ) { continue; }
            $dictionary_path = __DIR__ . '/assets/rde-bilingual/' . $dictionary_file;
            if ( is_readable( $dictionary_path ) ) { $config['dictionary'] = array_merge( $config['dictionary'] ?? array(), json_decode( file_get_contents( $dictionary_path ), true ) ?: array() ); }
        }
        foreach ( $config['dynamic_dictionary_files'] ?? array() as $dictionary_file ) {
            if ( ! is_string( $dictionary_file ) || ! preg_match( '/^[a-z0-9-]+\.json$/', $dictionary_file ) ) { continue; }
            $dictionary_path = __DIR__ . '/assets/rde-bilingual/' . $dictionary_file;
            if ( is_readable( $dictionary_path ) ) { $config['dynamic_dictionary'] = array_merge( $config['dynamic_dictionary'] ?? array(), json_decode( file_get_contents( $dictionary_path ), true ) ?: array() ); }
        }
    }
    return $config;
}
function rde_site_language_pairs() { return rde_site_language_config()['pairs'] ?? array(); }
function rde_site_is_english_preview() { return str_ends_with( get_stylesheet(), '-wpvibe-draft' ) && ( ( $_GET['rde_language_preview'] ?? '' ) === 'en' || ( $_GET['lang'] ?? '' ) === 'en' ); }
function rde_site_language_pair() {
    global $wp_query;
    $path = (string) wp_parse_url( $_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH );
    foreach ( rde_site_language_pairs() as $pair ) {
        if ( ! empty( $pair['prefix'] ) && str_starts_with( $path, $pair['fr'] ) ) { $pair['fr'] = $path; $pair['en'] = add_query_arg( 'lang', 'en', $path ); return $pair; }
    }
    $id = $wp_query instanceof WP_Query && $wp_query->is_singular() ? (int) get_queried_object_id() : 0;
    foreach ( rde_site_language_pairs() as $pair ) {
        if ( $id > 0 && ( $id === $pair['fr_id'] || $id === $pair['en_id'] ) ) { return $pair; }
    }
    foreach ( rde_site_language_pairs() as $pair ) {
        if ( ! empty( $pair['virtual'] ) && $path === $pair['fr'] ) { return $pair; }
    }
    return $wp_query instanceof WP_Query && is_front_page() ? ( rde_site_language_pairs()[0] ?? null ) : null;
}
function rde_site_is_english() {
    if ( ( $_GET['lang'] ?? '' ) === 'en' ) { return true; }
    if ( defined( 'REST_REQUEST' ) && REST_REQUEST && ( $_GET['lang'] ?? '' ) === 'en' ) { return true; }
    if ( rde_site_is_english_preview() && rde_site_language_pair() ) { return true; }
    $path = (string) wp_parse_url( $_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH );
    if ( $path === '/en' || str_starts_with( $path, '/en/' ) ) { return true; }
    $pair = rde_site_language_pair(); return $pair && get_queried_object_id() === $pair['en_id'];
}
function rde_site_decode_text( $value ) {
    for ( $i = 0; $i < 3; $i++ ) { $value = html_entity_decode( $value, ENT_QUOTES | ENT_HTML5, 'UTF-8' ); } return $value;
}
function rde_site_text_key( $value ) { return trim( preg_replace( '/(*UCP)\s+/u', ' ', rde_site_decode_text( $value ) ) ); }
function rde_site_business_arguments() {
    $args = array();
    foreach ( rde_site_language_config()['query_args'] ?? array( 's' ) as $key ) {
        if ( isset( $_GET[ $key ] ) && is_string( $_GET[ $key ] ) ) { $args[ $key ] = sanitize_text_field( wp_unslash( $_GET[ $key ] ) ); }
    }
    return $args;
}
function rde_site_language_url( $path ) { return add_query_arg( rde_site_business_arguments(), home_url( $path ) ); }
function rde_site_english_link( $url ) {
    if ( $url === '' || $url[0] === '#' ) { return $url; }
    $parts = wp_parse_url( rde_site_decode_text( $url ) );
    if ( ! is_array( $parts ) || ( isset( $parts['scheme'] ) && ! in_array( $parts['scheme'], array( 'http', 'https' ), true ) ) ) { return $url; }
    $host = preg_replace( '/^www\./i', '', $parts['host'] ?? (string) wp_parse_url( home_url(), PHP_URL_HOST ) );
    $own = preg_replace( '/^www\./i', '', (string) wp_parse_url( home_url(), PHP_URL_HOST ) );
    $path = $parts['path'] ?? '/'; $destination = null;
    if ( $host === $own && ! empty( $parts['query'] ) ) {
        parse_str( $parts['query'], $query_args );
        if ( ! empty( $query_args['category_name'] ) && is_string( $query_args['category_name'] ) ) {
            $category = get_category_by_slug( sanitize_title( $query_args['category_name'] ) );
            if ( $category ) { unset( $query_args['category_name'] ); $query_args['lang'] = 'en'; return add_query_arg( $query_args, get_category_link( $category ) ) . ( isset( $parts['fragment'] ) ? '#' . $parts['fragment'] : '' ); }
        }
    }
    if ( $host === $own && rde_site_is_english_preview() ) {
        $args = array(); if ( isset( $parts['query'] ) ) { parse_str( $parts['query'], $args ); }
        foreach ( rde_site_language_pairs() as $pair ) {
            $draft_id = (int) ( $args['p'] ?? $args['page_id'] ?? 0 );
            if ( ( $draft_id > 0 && $draft_id === $pair['en_id'] ) || $path === $pair['fr'] || $path === wp_parse_url( $pair['en'], PHP_URL_PATH ) ) {
                unset( $args['p'], $args['page_id'] ); $args['rde_language_preview'] = 'en'; $args['lang'] = 'en';
                return add_query_arg( $args, home_url( $pair['fr'] ) ) . ( isset( $parts['fragment'] ) ? '#' . $parts['fragment'] : '' );
            }
        }
    }
    if ( $host === $own ) {
        foreach ( rde_site_language_pairs() as $pair ) { if ( $path === $pair['fr'] ) { $destination = $pair['en']; break; } }
        if ( $destination === null ) { foreach ( rde_site_language_config()['english_query_prefixes'] ?? array() as $prefix ) { if ( str_starts_with( $path, $prefix ) ) { $destination = add_query_arg( 'lang', 'en', $path ); break; } } }
    } elseif ( ( $path === '/' || $path === '' ) && isset( rde_site_language_config()['external_english'][ $host ] ) ) {
        $destination = rde_site_language_config()['external_english'][ $host ];
    }
    if ( $destination === null ) { return $url; }
    if ( isset( $parts['query'] ) ) { parse_str( $parts['query'], $arguments ); $destination = add_query_arg( $arguments, $destination ); }
    return $destination . ( isset( $parts['fragment'] ) ? '#' . $parts['fragment'] : '' );
}
function rde_site_language_selector() {
    $pair = rde_site_language_pair() ?: ( rde_site_language_pairs()[0] ?? null ); if ( ! $pair ) { return ''; }
    $en = rde_site_is_english();
    $english_url = str_ends_with( get_stylesheet(), '-wpvibe-draft' ) ? add_query_arg( array( 'rde_language_preview' => 'en', 'lang' => 'en' ), rde_site_language_url( $pair['fr'] ) ) : rde_site_language_url( $pair['en'] );
    return '<div class="rde-language-picker" role="group" aria-label="' . ( $en ? 'Language' : 'Langue' ) . '"><a data-rde-keep-language href="' . esc_url( rde_site_language_url( $pair['fr'] ) ) . '" lang="fr" hreflang="fr" aria-label="Français"' . ( ! $en ? ' aria-current="page"' : '' ) . '>FR</a><a data-rde-keep-language href="' . esc_url( $english_url ) . '" lang="en" hreflang="en" aria-label="English"' . ( $en ? ' aria-current="page"' : '' ) . '>EN</a></div>';
}
function rde_site_language_html( $html ) {
    $config = rde_site_language_config(); $picker = empty( $config['use_existing_language_picker'] ) ? rde_site_language_selector() : '';
    if ( $picker && strpos( $html, 'class="rde-language-picker"' ) === false ) {
        $marker = $config['header_marker'] ?? ''; $start = $marker !== '' ? strpos( $html, $marker ) : false;
        $end = $start !== false ? strpos( $html, $config['header_close'] ?? '</header>', $start + strlen( $marker ) ) : false;
        if ( $end !== false ) { $html = substr_replace( $html, $picker, $end, 0 ); }
    }
    if ( ! rde_site_is_english() ) { return $html; }
    $pair = rde_site_language_pair();
    if ( $pair ) {
        $html = preg_replace_callback( '~<link\b[^>]*\brel=["\']canonical["\'][^>]*>~i', function( $m ) use ( $pair ) { return preg_replace( '~href=["\'][^"\']*["\']~i', 'href="' . esc_url( rde_site_language_url( $pair['en'] ) ) . '"', $m[0] ); }, $html, -1, $canonical_count );
        if ( ! $canonical_count && ! empty( $config['ensure_english_canonical'] ) ) { $html = str_replace( '</head>', '<link rel="canonical" href="' . esc_url( rde_site_language_url( $pair['en'] ) ) . '"></head>', $html ); }
        $english_title = $config['english_titles'][ $pair['fr_id'] ] ?? '';
        if ( $english_title !== '' && stripos( $html, '</head>' ) !== false ) {
            if ( $pair['fr_id'] === ( rde_site_language_pairs()[0]['fr_id'] ?? 0 ) ) { $english_title = $config['english_title'] ?? $english_title; }
            else { $english_title .= $config['english_title_suffix'] ?? ''; }
            $html = preg_replace( '~<title>.*?</title>~is', '<title>' . esc_html( $english_title ) . '</title>', $html, 1 );
            $description = $config['english_descriptions'][ $pair['fr_id'] ] ?? '';
            $html = preg_replace_callback( '~<meta\b[^>]*>~i', function( $m ) use ( $english_title, $description ) {
                if ( ! preg_match( '~(?:name|property)=["\']([^"\']+)["\']~i', $m[0], $name ) ) { return $m[0]; }
                $value = in_array( $name[1], array( 'og:title', 'twitter:title' ), true ) ? $english_title : ( in_array( $name[1], array( 'description', 'og:description', 'twitter:description' ), true ) ? $description : '' );
                return $value !== '' ? preg_replace( '~content=["\'][^"\']*["\']~i', 'content="' . esc_attr( $value ) . '"', $m[0] ) : $m[0];
            }, $html );
        }
    }
    $dict = $config['dictionary'] ?? array();
    $request_path = (string) wp_parse_url( $_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH );
    $client_only = false;
    foreach ( $config['client_translation_only_paths'] ?? array() as $prefix ) { if ( str_starts_with( $request_path, $prefix ) ) { $dict = array(); $config['attribute_fragments'] = array(); $client_only = true; break; } }
    $parts = preg_split( '~(<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>|<[^>]*>)~is', $html, -1, PREG_SPLIT_DELIM_CAPTURE );
    if ( ! is_array( $parts ) ) { return $html; }
    foreach ( $parts as &$part ) {
        if ( $part === '' ) { continue; }
        if ( $part[0] === '<' ) {
            if ( preg_match( '~^<(?:script|style)\b~i', $part ) ) {
                if ( str_starts_with( strtolower( $part ), '<script' ) ) {
                    foreach ( $config['script_locale_markers'] ?? array() as $marker ) { if ( str_contains( $part, $marker ) ) { $part = str_replace( array( "'fr-FR'", '"fr-FR"' ), array( "'en-GB'", '"en-GB"' ), $part ); break; } }
                    foreach ( $config['script_replacements'] ?? array() as $replacement ) { if ( str_contains( $part, $replacement['marker'] ) ) { $part = str_replace( $replacement['old'], $replacement['new'], $part ); } }
                }
                continue;
            }
            if ( preg_match( '~^<(?:a|form)\b~i', $part ) && strpos( $part, 'data-rde-keep-language' ) === false ) {
                $part = preg_replace_callback( '~(href|action)="([^"]*)"~', function( $m ) { return $m[1] . '="' . esc_url( rde_site_english_link( $m[2] ) ) . '"'; }, $part );
            }
            if ( preg_match( '~^<input\b[^>]*type="(?:submit|button|reset)"~i', $part ) ) { $part = preg_replace_callback( '~\bvalue="([^"]*)"~i', function( $m ) use ( $dict ) { $key = rde_site_text_key( $m[1] ); return isset( $dict[ $key ] ) ? 'value="' . esc_attr( $dict[ $key ] ) . '"' : $m[0]; }, $part ); }
            $part = preg_replace_callback( '~(alt|aria-label|title|placeholder|content)="([^"]*)"~', function( $m ) use ( $dict, $config ) { $key = rde_site_text_key( $m[2] ); if ( isset( $dict[ $key ] ) ) { return $m[1] . '="' . esc_attr( $dict[ $key ] ) . '"'; } $value = rde_site_decode_text( $m[2] ); foreach ( $config['attribute_fragments'] ?? array() as $fragment ) { $value = str_replace( $fragment[0], $fragment[1], $value ); } return $value !== rde_site_decode_text( $m[2] ) ? $m[1] . '="' . esc_attr( $value ) . '"' : $m[0]; }, $part );
            continue;
        }
        if ( $client_only ) { continue; }
        $key = rde_site_text_key( $part );
        if ( isset( $dict[ $key ] ) ) { $part = str_replace( trim( $part ), esc_html( $dict[ $key ] ), $part ); continue; }
        $plain = rde_site_decode_text( $part ); $translated = $plain;
        foreach ( $config['fragments'] ?? array() as $fragment ) { $translated = str_replace( $fragment[0], $fragment[1], $translated ); }
        if ( ! empty( $config['numeric_locale'] ) ) {
            $translated = preg_replace( '~(?<![\d,])(\d+),(\d{1,2})(?![\d,])~u', '$1.$2', $translated );
            if ( preg_match( '~^[+−↗↘→\-\s]*\d[\d\s\x{00a0}\x{202f}]*(?:\.\d+)?\s*[%kKM]?$~u', $translated ) ) { $translated = preg_replace( '~(?<=\d)[\s\x{00a0}\x{202f}]+(?=\d{3}(?:\D|$))~u', ',', $translated ); }
        }
        if ( $plain !== $translated ) { $part = esc_html( $translated ); }
    }
    unset( $part ); $html = implode( '', $parts );
    return preg_replace_callback( '~<form\b[^>]*>.*?</form>~is', function( $m ) {
        $form = $m[0]; if ( preg_match( '~method=["\']([^"\']+)["\']~i', $form, $method ) && strtolower( $method[1] ) !== 'get' ) { return $form; }
        if ( preg_match( '~action=["\']([^"\']*)["\']~i', $form, $action ) ) { $host = wp_parse_url( rde_site_decode_text( $action[1] ), PHP_URL_HOST ); if ( $host && $host !== wp_parse_url( home_url(), PHP_URL_HOST ) ) { return $form; } }
        $hidden = strpos( $form, 'name="lang"' ) === false ? '<input type="hidden" name="lang" value="en">' : '';
        if ( rde_site_is_english_preview() ) {
            $hidden .= '<input type="hidden" name="rde_language_preview" value="en">';
            if ( ! empty( $_GET['wpvibe_preview'] ) && is_string( $_GET['wpvibe_preview'] ) ) { $hidden .= '<input type="hidden" name="wpvibe_preview" value="' . esc_attr( wp_unslash( $_GET['wpvibe_preview'] ) ) . '">'; }
        }
        return str_replace( '</form>', $hidden . '</form>', $form );
    }, $html );
}
if ( ! rde_site_language_config() ) { return; }
add_filter( 'the_content', function( $content ) {
    if ( ! rde_site_is_english_preview() || ! in_the_loop() || ! is_main_query() ) { return $content; }
    $pair = rde_site_language_pair();
    if ( ! $pair || get_queried_object_id() !== $pair['fr_id'] ) { return $content; }
    $english = get_post( $pair['en_id'] );
    return $english && in_array( $english->post_type, array( 'page', 'post' ), true ) && $english->post_status === 'draft' && trim( $english->post_content ) !== '' ? do_blocks( $english->post_content ) : $content;
}, 20 );
add_filter( 'language_attributes', function( $value ) { return rde_site_is_english() ? 'lang="en-GB"' : $value; } );
function rde_site_preview_english_post() {
    if ( ! rde_site_is_english_preview() ) { return null; }
    $pair = rde_site_language_pair(); if ( ! $pair || $pair['en_id'] <= 0 ) { return null; }
    $post = get_post( $pair['en_id'] ); return $post && $post->post_status === 'draft' ? $post : null;
}
add_filter( 'the_title', function( $title, $id ) { $post = rde_site_preview_english_post(); $pair = rde_site_language_pair(); return $post && $pair && $id === $pair['fr_id'] ? $post->post_title : $title; }, 100, 2 );
add_filter( 'document_title_parts', function( $parts ) {
    if ( rde_site_is_english() ) { $config = rde_site_language_config(); $dict = $config['dictionary'] ?? array(); foreach ( $parts as &$part ) { $part = $dict[ rde_site_text_key( $part ) ] ?? $part; foreach ( $config['title_fragments'] ?? array() as $fragment ) { $part = str_replace( $fragment[0], $fragment[1], $part ); } } unset( $part ); }
    if ( $post = rde_site_preview_english_post() ) { $parts['title'] = $post->post_title; }
    return $parts;
}, 100 );
add_filter( 'get_canonical_url', function( $url ) { $pair = rde_site_language_pair(); return $pair ? rde_site_language_url( rde_site_is_english() ? $pair['en'] : $pair['fr'] ) : $url; } );
add_action( 'wp', function() { if ( rde_site_is_english() ) { switch_to_locale( 'en_US' ); } } );
add_action( 'template_redirect', function() {
    if ( ! is_feed() && ! wp_doing_ajax() && ( rde_site_language_pair() || rde_site_is_english() ) ) { ob_start( 'rde_site_language_html' ); }
}, 0 );
add_filter( 'template_include', function( $template ) {
    $pair = rde_site_language_pair(); $root = rde_site_language_pairs()[0] ?? null;
    return ( rde_site_language_config()['classic_front'] ?? false ) && rde_site_is_english() && $pair && $root && $pair['fr_id'] === $root['fr_id'] ? __DIR__ . '/front-page.php' : $template;
}, 50 );
add_filter( 'pre_get_document_title', function( $title ) {
    $pair = rde_site_language_pair(); $root = rde_site_language_pairs()[0] ?? null;
    if ( rde_site_is_english() && $pair && $root && $pair['fr_id'] === $root['fr_id'] && ! rde_site_business_arguments() ) { return rde_site_language_config()['english_title'] ?? $title; }
    return $title;
}, 30 );
add_action( 'wp_head', function() {
    $pair = rde_site_language_pair(); if ( ! $pair ) { return; }
    foreach ( array( 'fr' => $pair['fr'], 'en' => $pair['en'], 'x-default' => $pair['fr'] ) as $lang => $path ) { echo '<link rel="alternate" hreflang="' . esc_attr( $lang ) . '" href="' . esc_url( rde_site_language_url( $path ) ) . '">' . "\n"; }
    if ( rde_site_is_english() && ! is_front_page() && $pair['fr_id'] === ( rde_site_language_pairs()[0]['fr_id'] ?? -1 ) && ! empty( rde_site_language_config()['english_description'] ) ) { echo '<meta name="description" content="' . esc_attr( rde_site_language_config()['english_description'] ) . '">'; }
} );
add_action( 'wp_enqueue_scripts', function() {
    $config = rde_site_language_config(); wp_enqueue_style( 'rde-bilingual', get_theme_file_uri( '/assets/rde-bilingual.css' ), $config['style_dependencies'] ?? array(), $config['version'] );
    if ( ! empty( $config['css'] ) ) { wp_add_inline_style( 'rde-bilingual', $config['css'] ); }
    if ( rde_site_is_english() && ! empty( $config['dynamic_translation'] ) ) {
        wp_enqueue_script( 'rde-bilingual-runtime', get_theme_file_uri( '/assets/rde-bilingual.js' ), array(), $config['version'], true );
        wp_localize_script( 'rde-bilingual-runtime', 'rdeLanguage', array( 'dictionary' => $config['dynamic_dictionary'] ?? $config['dictionary'], 'prefixes' => $config['english_query_prefixes'] ?? array(), 'fragments' => $config['dynamic_fragments'] ?? array(), 'patterns' => $config['dynamic_patterns'] ?? array(), 'numericLocale' => ! empty( $config['numeric_locale'] ) ) );
    }
}, 30 );
add_action( 'wp_footer', function() {
    if ( rde_site_is_english() ) { $pair = rde_site_language_pair() ?: rde_site_language_pairs()[0]; echo '<p class="rde-translation-note">AI-assisted English translation · <a data-rde-keep-language href="' . esc_url( rde_site_language_url( $pair['fr'] ) ) . '">French original</a></p>'; }
}, 5 );
add_action( 'pre_get_posts', function( $query ) {
    if ( is_admin() || $query->is_singular() || $query->get( 'rde_all_languages' ) || ! empty( rde_site_language_config()['preserve_native_queries'] ) ) { return; }
    $type = $query->get( 'post_type' ); if ( $type && ! in_array( $type, array( 'post', 'page', 'any' ), true ) ) { return; }
    $ids = array_column( rde_site_language_pairs(), 'en_id' );
    if ( rde_site_is_english() ) { $old = $query->get( 'post__in' ); $query->set( 'post__in', $old ? ( array_values( array_intersect( $old, $ids ) ) ?: array( 0 ) ) : $ids );
        if ( rde_site_is_english_preview() ) { $query->set( 'post_status', array( 'publish', 'draft' ) ); }
    }
    else { $query->set( 'post__not_in', array_values( array_unique( array_merge( (array) $query->get( 'post__not_in' ), $ids ) ) ) ); }
} );
add_filter( 'wp_sitemaps_posts_query_args', function( $args ) { $args['rde_all_languages'] = true; return $args; } );
function rde_site_adjacent_language_where( $where ) {
    $ids = array(); foreach ( rde_site_language_pairs() as $pair ) { if ( ( $pair['type'] ?? '' ) === 'post' && $pair['en_id'] > 0 ) { $ids[] = (int) $pair['en_id']; } }
    return $ids ? $where . ' AND p.ID ' . ( rde_site_is_english() ? 'IN' : 'NOT IN' ) . ' (' . implode( ',', $ids ) . ')' : $where;
}
add_filter( 'get_previous_post_where', 'rde_site_adjacent_language_where' );
add_filter( 'get_next_post_where', 'rde_site_adjacent_language_where' );
add_action( 'init', function() {
    $config = rde_site_language_config(); $version = $config['version'];
    if ( str_ends_with( get_stylesheet(), '-wpvibe-draft' ) || get_option( 'rde_site_bilingual_release' ) === $version ) { return; }
    $ids = array_merge( array_column( rde_site_language_pairs(), 'en_id' ), $config['new_french_ids'] ?? array() );
    foreach ( array_unique( $ids ) as $id ) { if ( $id > 0 && get_post_status( $id ) === 'draft' ) { wp_update_post( array( 'ID' => $id, 'post_status' => 'publish' ) ); } }
    if ( ! empty( $config['front_page_id'] ) && get_post_status( $config['front_page_id'] ) === 'publish' ) { update_option( 'show_on_front', 'page' ); update_option( 'page_on_front', (int) $config['front_page_id'] ); }
    update_option( 'rde_site_bilingual_release', $version, false );
} );
