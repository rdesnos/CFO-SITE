"""Prepare an overlay from the inspected WPVibe draft, never the stale local theme."""
from pathlib import Path
from inventory import ROOT

source = (ROOT/'baseline/theme/cfo-international.php').read_text(encoding='utf-8')
old = "if ( 'nl-BE' === $value && isset( $_GET['wpvibe_preview'] ) ) { return 'nl-BE'; }"
new = "if ( 'nl-BE' === $value && function_exists( 'cfo_translation_preview_active' ) && cfo_translation_preview_active() ) { return 'nl-BE'; }"
assert source.count(old) == 1
source = source.replace(old,new)
source = source.replace("wp_enqueue_script( 'cfo-nl-be-glossary', get_theme_file_uri( 'assets/js/cfo-nl-be-glossary.js' ), array(), '20261031-3', true );", "wp_enqueue_script( 'cfo-nl-be-glossary', get_theme_file_uri( 'assets/js/cfo-nl-be-glossary.js' ), array(), '20261031-4', true );\n\t\twp_enqueue_script( 'cfo-nl-be-runtime', get_theme_file_uri( 'assets/js/cfo-nl-be-runtime.js' ), array( 'cfo-nl-be-glossary', 'cfo-international' ), '20261031-4', true );")
old = "if ( ! isset( $editions[ $locale ] ) || ! $editions[ $locale ]['available'] ) { return $url; }"
new = "if ( ! isset( $editions[ $locale ] ) || ( ! $editions[ $locale ]['available'] && ! ( 'nl-BE' === $locale && function_exists( 'cfo_translation_preview_active' ) && cfo_translation_preview_active() ) ) ) { return $url; }"
assert source.count(old) == 1
source = source.replace(old,new)
old = "if ( ! $edition['available'] ) {"
new = "if ( ! $edition['available'] && ! ( 'nl-BE' === $locale && function_exists( 'cfo_translation_preview_active' ) && cfo_translation_preview_active() ) ) {"
assert source.count(old) == 1
source = source.replace(old,new)
source = source.replace("'en-GB' => array( 'choose' => 'Choose a language edition'", "'nl-BE' => array( 'choose' => 'Kies een taalversie', 'soon' => 'binnenkort' ),\n\t\t'en-GB' => array( 'choose' => 'Choose a language edition'",1)
# Delete the incomplete server-side Dutch word replacement. Article prose
# must come from complete versioned Supabase records, not string guesses.
start = source.index("\t\tif ( 'nl-BE' === cfo_international_locale() ) {", source.index('function cfo_international_render'))
end = source.index('\n\t\t}',start)+len('\n\t\t}')
source = source[:start]+source[end:]
anchor = "\tforeach ( $xpath->query( '//body//text()[not(' . $excluded . ')]' ) as $node ) {"
replacement = """\t$ui_labels = function_exists( 'cfo_interface_get' ) ? cfo_interface_get() : array();
\t$ui_normalize = function( $value ) { return str_replace( "’", "'", trim( $value ) ); };
\t$ui_map = array();
\tforeach ( $ui_labels as $source_label => $target_label ) { $ui_map[ $ui_normalize( $source_label ) ] = $target_label; }
\tforeach ( $xpath->query( '//*[@alt or @title or @aria-label or @placeholder]' ) as $element ) {
\t\tforeach ( array( 'alt', 'title', 'aria-label', 'placeholder' ) as $attribute ) {
\t\t\t$key = $ui_normalize( $element->getAttribute( $attribute ) );
\t\t\tif ( isset( $ui_map[ $key ] ) ) { $element->setAttribute( $attribute, $ui_map[ $key ] ); }
\t\t}
\t}
""" + anchor + """
\t\t$key = $ui_normalize( $node->nodeValue );
\t\tif ( isset( $ui_map[ $key ] ) ) { $node->nodeValue = str_replace( trim( $node->nodeValue ), $ui_map[ $key ], $node->nodeValue ); }
"""
assert source.count(anchor)==1
source = source.replace(anchor,replacement)
# Logged-in reviewers also need locale-aware links and no shared cache.
source = source.replace(" || is_user_logged_in() ) { return; }", " ) { return; }")
(ROOT/'theme/cfo-international.php').write_text(source,encoding='utf-8')
javascript=(ROOT/'baseline/theme/assets/js/cfo-international.js').read_text(encoding='utf-8')
start=javascript.index("  if (locale === 'nl-BE') {")
end=javascript.index("  if (locale !== 'fr-CA')",start)
javascript=javascript[:start]+"  if (locale === 'nl-BE') return;\n"+javascript[end:]
(ROOT/'theme/assets/js/cfo-international.js').write_text(javascript,encoding='utf-8')
print('Prepared draft international overlay; nl-BE remains unavailable publicly.')
