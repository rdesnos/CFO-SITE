<?php
/** CFO regional editions. Only reviewed, available editions are exposed. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function cfo_international_editions() {
	return array(
		'en-GB' => array( 'label' => 'English', 'flags' => array(), 'available' => true ),
		'fr-FR' => array( 'label' => 'Français — France', 'flags' => array( 'fr' ), 'available' => true ),
		'fr-CA' => array( 'label' => 'Français — Québec', 'flags' => array( 'qc' ), 'available' => true ),
		'en-CA' => array( 'label' => 'English — Canada', 'flags' => array( 'ca' ), 'available' => false ),
		'fr-BE' => array( 'label' => 'Français — Belgique', 'flags' => array( 'be' ), 'available' => true ),
		'nl-BE' => array( 'label' => 'Nederlands — België', 'flags' => array( 'be' ), 'available' => false ),
		'de-BE' => array( 'label' => 'Deutsch — Belgien', 'flags' => array( 'be' ), 'available' => false ),
		'fr-CH' => array( 'label' => 'Français — Suisse', 'flags' => array( 'ch' ), 'available' => true ),
		'de-CH' => array( 'label' => 'Deutsch — Schweiz', 'flags' => array( 'ch' ), 'available' => false ),
		'it-CH' => array( 'label' => 'Italiano — Svizzera', 'flags' => array( 'ch' ), 'available' => false ),
		'rm-CH' => array( 'label' => 'Rumantsch — Svizra', 'flags' => array( 'ch' ), 'available' => false ),
		'lb-LU' => array( 'label' => 'Lëtzebuergesch', 'flags' => array( 'lu' ), 'available' => false ),
	);
}

function cfo_international_locale() {
	if ( function_exists( 'rde_site_is_english' ) && rde_site_is_english() ) { return 'en-GB'; }
	$value = isset( $_GET['cfo_lang'] ) && is_string( $_GET['cfo_lang'] ) ? wp_unslash( $_GET['cfo_lang'] ) : 'fr-FR';
	$editions = cfo_international_editions();
	if ( 'nl-BE' === $value && isset( $_GET['wpvibe_preview'] ) ) { return 'nl-BE'; }
	return isset( $editions[ $value ] ) && $editions[ $value ]['available'] ? $value : 'fr-FR';
}

/** Query parameter URLs keep the existing routing and draft preview intact. */
function cfo_international_url( $url, $locale ) {
	$editions = cfo_international_editions();
	if ( ! isset( $editions[ $locale ] ) || ! $editions[ $locale ]['available'] ) { return $url; }
	$home = wp_parse_url( home_url( '/' ) );
	$parts = wp_parse_url( $url );
	if ( false === $parts || ( isset( $parts['scheme'] ) && ! in_array( $parts['scheme'], array( 'http', 'https' ), true ) ) ) { return $url; }
	if ( isset( $parts['host'] ) && strcasecmp( $parts['host'], $home['host'] ) !== 0 ) { return $url; }
	if ( strpos( $url, '//' ) === 0 && ! isset( $parts['host'] ) ) { return $url; }
	$path = isset( $parts['path'] ) ? $parts['path'] : '';
	if ( preg_match( '~(?:^|/)(?:wp-admin|wp-json|wp-content|wp-includes|feed)(?:/|$)|\.[a-z0-9]{2,6}$~i', $path ) ) { return $url; }
	if ( isset( $parts['query'] ) ) {
		parse_str( $parts['query'], $query );
		if ( isset( $query['rest_route'] ) || isset( $query['action'] ) || isset( $query['_wpnonce'] ) ) { return $url; }
	}
	$url = remove_query_arg( array( 'cfo_lang', 'lang', 'rde_language_preview' ), $url );
	if ( 'en-GB' === $locale ) { return add_query_arg( 'lang', 'en', $url ); }
	return 'fr-FR' === $locale ? $url : add_query_arg( 'cfo_lang', $locale, $url );
}

function cfo_international_language_attributes( $attributes ) {
	return preg_replace( '/\blang=([\"\x27]).*?\1/', 'lang="' . esc_attr( cfo_international_locale() ) . '"', $attributes );
}
add_filter( 'language_attributes', 'cfo_international_language_attributes', 99 );

function cfo_international_assets() {
	wp_enqueue_style( 'cfo-international', get_theme_file_uri( 'assets/cfo-international.css' ), array(), '20261031-1' );
	if ( 'nl-BE' === cfo_international_locale() ) {
		wp_enqueue_script( 'cfo-nl-be-glossary', get_theme_file_uri( 'assets/js/cfo-nl-be-glossary.js' ), array(), '20261031-3', true );
	}
	wp_enqueue_script( 'cfo-international', get_theme_file_uri( 'assets/js/cfo-international.js' ), array(), '20261031-3', true );
	wp_add_inline_script( 'cfo-international', 'window.cfoEdition=' . wp_json_encode( array( 'locale' => cfo_international_locale() ) ) . ';', 'before' );
}
add_action( 'wp_enqueue_scripts', 'cfo_international_assets', 99 );

/** Decorative country icons accompany the explicit language/region labels. */
function cfo_international_flags( $locale ) {
	$editions = cfo_international_editions();
	if ( ! isset( $editions[ $locale ]['flags'] ) ) { return ''; }
	$html = '<span class="cfo-edition-flags" aria-hidden="true">';
	foreach ( $editions[ $locale ]['flags'] as $country ) {
		$html .= '<img class="cfo-edition-flag" src="' . esc_url( get_theme_file_uri( 'assets/flags/' . $country . '.svg' ) ) . '" width="28" height="20" alt="" decoding="async">';
	}
	return $html . '</span>';
}

function cfo_international_switcher( $items, $args ) {
	if ( ! isset( $args->theme_location ) || 'primary' !== $args->theme_location ) { return $items; }
	$current = cfo_international_locale();
	$request = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '/';
	// Never take a host from the request URI.
	$request = '/' . ltrim( $request, '/' );
	$ui = array(
		'en-GB' => array( 'choose' => 'Choose a language edition', 'soon' => 'coming soon' ),
		'fr-FR' => array( 'choose' => 'Choisir une version linguistique', 'soon' => 'à venir' ),
		'fr-CA' => array( 'choose' => 'Choisir une version linguistique', 'soon' => 'à venir' ),
		'fr-BE' => array( 'choose' => 'Choisir une version linguistique', 'soon' => 'à venir' ),
		'fr-CH' => array( 'choose' => 'Choisir une version linguistique', 'soon' => 'à venir' ),
	);
	$labels = isset( $ui[ $current ] ) ? $ui[ $current ] : $ui['fr-FR'];
	$items .= '<li class="menu-item cfo-editions"><details><summary>' . cfo_international_flags( $current ) . '<span>' . esc_html( cfo_international_editions()[ $current ]['label'] ) . '</span></summary><ul class="cfo-editions-list" aria-label="' . esc_attr( $labels['choose'] ) . '">';
	foreach ( cfo_international_editions() as $locale => $edition ) {
		if ( ! $edition['available'] ) {
			// Incomplete editions do not appear in the public language switcher.
			continue;
		}
		$items .= '<li><a data-rde-keep-language href="' . esc_url( cfo_international_url( $request, $locale ) ) . '" lang="' . esc_attr( $locale ) . '" hreflang="' . esc_attr( $locale ) . '"' . ( $current === $locale ? ' aria-current="true"' : '' ) . '>' . cfo_international_flags( $locale ) . '<span>' . esc_html( $edition['label'] ) . '</span></a></li>';
	}
	return $items . '</ul></details></li>';
}
add_filter( 'wp_nav_menu_items', 'cfo_international_switcher', 99, 2 );

/** Keep regional variants out of the index until the editorial review is complete. */
function cfo_international_robots( $robots ) {
	if ( ! in_array( cfo_international_locale(), array( 'fr-FR', 'en-GB' ), true ) ) { $robots['noindex'] = true; unset( $robots['index'] ); }
	return $robots;
}
add_filter( 'wp_robots', 'cfo_international_robots', 99 );

/** Shared factual source, limited editorial vocabulary adaptation, never script/code. */
function cfo_international_render( $html ) {
	if ( ! in_array( cfo_international_locale(), array( 'fr-CA', 'fr-BE', 'fr-CH', 'nl-BE' ), true ) || ! class_exists( 'DOMDocument' ) || stripos( $html, '<html' ) === false ) { return $html; }
	$previous = libxml_use_internal_errors( true );
	$doc = new DOMDocument();
	$loaded = $doc->loadHTML( '<?xml encoding="utf-8" ?>' . $html, LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING );
	libxml_clear_errors();
	libxml_use_internal_errors( $previous );
	if ( ! $loaded ) { return $html; }
	$xpath = new DOMXPath( $doc );
	$excluded = 'ancestor::script or ancestor::style or ancestor::code or ancestor::pre or ancestor::textarea or ancestor::blockquote or ancestor::q or ancestor::cite or ancestor::*[@translate="no"] or ancestor::*[contains(concat(" ",normalize-space(@class)," ")," notranslate ")]';
	$rules = array(
		'/\bnewsletter\b/iu' => 'infolettre',
		'/\bnewsletters\b/iu' => 'infolettres',
		'/\bpodcasts\b/iu' => 'balados',
		'/\bpodcast\b/iu' => 'balado',
		'/\bstreaming\b/iu' => 'écoute en continu',
		'/\bStreams Spotify\b/u' => 'Écoutes Spotify',
		'/\bstreams\b/u' => 'écoutes',
	);
	foreach ( $xpath->query( '//body//text()[not(' . $excluded . ')]' ) as $node ) {
		if ( 'fr-CA' === cfo_international_locale() ) { $node->nodeValue = preg_replace( array_keys( $rules ), array_values( $rules ), $node->nodeValue ); }
		if ( 'nl-BE' === cfo_international_locale() ) {
			$translations = array(
			"À l'affiche" => "In de kijker",
			"Entre les lignes" => "Tussen de regels",
			"À ses côtés" => "Aan haar zijde",
			"La Grand-Place" => "De Grote Markt",
			"L'Observatoire" => "Het observatorium",
			"En coulisses" => "Achter de schermen",
			"Média libre, indépendant et non officiel" => "Vrij, onafhankelijk en niet-officieel medium",
			"La musique de Marine," => "De muziek van Marine,",
			"et tout ce qu'elle raconte" => "en alles wat ze vertelt",
			"Actualités, dossiers, données et coulisses pour écouter autrement l'œuvre de Marine Delplace — entre émotions, société et histoires humaines." => "Nieuws, dossiers, gegevens en verhalen achter de schermen om het werk van Marine Delplace anders te beleven — over emoties, maatschappij en menselijke verhalen.",
			"Voir l'actualité" => "Bekijk het nieuws",
			"Explorer les dossiers" => "Ontdek de dossiers",
			"La une de la semaine" => "In de kijker deze week",
			"Les sujets clés de l'actualité de Marine, éclairés par les données de l'Observatoire." => "De belangrijkste nieuwsfeiten over Marine, toegelicht met gegevens uit het observatorium.",
			"Voir tous les sujets" => "Bekijk alle onderwerpen",
			"Ce que disent les chiffres" => "Wat de cijfers vertellen",
			"Auditeurs mensuels Spotify" => "Maandelijkse Spotify-luisteraars",
			);
			$decoded = html_entity_decode( $node->nodeValue, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
				if ( $decoded !== $node->nodeValue ) { $node->nodeValue = $decoded; }
				$source = trim( $node->nodeValue );
				$source = str_replace( "\u{2019}", "'", $source );
			if ( isset( $translations[ $source ] ) ) { $node->nodeValue = str_replace( $source, $translations[ $source ], $node->nodeValue ); }
		}
	}
	foreach ( $xpath->query( '//a[@href and not(ancestor::*[@translate="no"])]' ) as $link ) {
		$href = $link->getAttribute( 'href' );
		// The switcher explicitly chooses a locale; never rewrite its links.
		if ( $href !== '' && $href[0] !== '#' && ! $link->hasAttribute( 'hreflang' ) ) { $link->setAttribute( 'href', cfo_international_url( $href, cfo_international_locale() ) ); }
	}
	$output = $doc->saveHTML();
	return preg_replace( '/<\?xml encoding="utf-8"\s*\?>\s*/', '', $output, 1 );
}

function cfo_international_start() {
	if ( is_admin() || is_feed() || is_404() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) || is_user_logged_in() ) { return; }
	if ( in_array( cfo_international_locale(), array( 'fr-CA', 'fr-BE', 'fr-CH', 'nl-BE' ), true ) ) {
		// Edition-specific cache keys are not configured yet. Prevent cache mixing.
		nocache_headers();
		if ( ! defined( 'DONOTCACHEPAGE' ) ) { define( 'DONOTCACHEPAGE', true ); }
		ob_start( 'cfo_international_render' );
	}
}
add_action( 'template_redirect', 'cfo_international_start', 1 );
