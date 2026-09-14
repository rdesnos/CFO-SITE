<?php
/** CFO Music Player — multi-ISRC / Supabase. Master visuel 14/09/2026. */
function cfo_get_dossier_audio_links( $post_id ) {
	$cache_key = 'cfo_audio_' . absint( $post_id );
	$cached = get_transient( $cache_key );
	if ( false !== $cached ) return is_array( $cached ) ? $cached : array();
	$endpoint = 'https://fjpcuxsezeuajhlotzij.supabase.co/rest/v1/cfo_dossier_audio_recordings?select=track_title,version_label,isrc,duration_seconds,spotify_url,youtube_url,deezer_url,is_primary,sort_order&wp_post_id=eq.' . absint( $post_id ) . '&is_active=eq.true&order=is_primary.desc,sort_order.asc';
	$anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqcGN1eHNlemV1YWpobG90emlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMDY4NjAsImV4cCI6MjA5NzU4Mjg2MH0.K8COlpSt544LkRRLkXFBAfwtTEH0MzNKGgY-1H_uDoY';
	$response = wp_remote_get( $endpoint, array( 'timeout'=>4, 'headers'=>array( 'apikey'=>$anon_key, 'Authorization'=>'Bearer '.$anon_key ) ) );
	if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) { set_transient( $cache_key, '__none__', 5 * MINUTE_IN_SECONDS ); return array(); }
	$rows = json_decode( wp_remote_retrieve_body( $response ), true );
	$data = is_array( $rows ) ? array_values( array_filter( $rows, 'is_array' ) ) : array();
	set_transient( $cache_key, $data ? $data : '__none__', HOUR_IN_SECONDS ); return $data;
}
function cfo_audio_duration( $seconds ) { $seconds=(int)$seconds; return sprintf('%d:%02d', floor($seconds/60), $seconds%60); }
function cfo_audio_platform_icon( $platform ) {
	if ( 'spotify' === $platform ) return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.1c5.2-1.5 10.8-.9 15.1 1.5M5.2 13c4.4-1.2 9.1-.7 12.8 1.3M6.2 16.5c3.6-.9 7.4-.5 10.5 1"/></svg>';
	if ( 'youtube' === $platform ) return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="4"/><path class="cfo-svg-cut" d="M10 9l6 3-6 3z"/></svg>';
	return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15h3v4H3zm4-3h3v7H7zm4 1h3v6h-3zm4-5h3v11h-3zm4 2h2v9h-2z"/></svg>';
}
function cfo_audio_platform_button( $platform, $label, $url ) {
	$icon=cfo_audio_platform_icon($platform);
	if ( empty($url) ) return '<span class="cfo-player-platform cfo-player-platform--off" aria-label="'.esc_attr($label).' indisponible"><i class="cfo-platform-icon cfo-platform-icon--'.esc_attr($platform).'">'.$icon.'</i><b>'.esc_html($label).'</b></span>';
	return '<a class="cfo-player-platform" href="'.esc_url($url).'" target="_blank" rel="noopener noreferrer"><i class="cfo-platform-icon cfo-platform-icon--'.esc_attr($platform).'">'.$icon.'</i><b>'.esc_html($label).'</b></a>';
}
function cfo_dossier_audio_tuner( $content ) {
	if ( ! is_page() || false !== strpos($content,'cfo-music-player') ) return $content;
	$recordings=cfo_get_dossier_audio_links(get_queried_object_id()); if(empty($recordings)) return $content;
	$figure_end=strpos($content,'</figure>'); if(false===$figure_end) return $content; $figure_end+=strlen('</figure>');
	$primary=$recordings[0]; foreach($recordings as $r){if(!empty($r['is_primary'])){$primary=$r;break;}}
	$platforms=array('spotify'=>'Spotify','youtube'=>'YouTube','deezer'=>'Deezer');
	$primary_buttons=''; foreach($platforms as $p=>$label){$primary_buttons.=cfo_audio_platform_button($p,$label,$primary[$p.'_url']??'');}
	$rows=''; foreach($recordings as $index=>$r){
		$links=''; foreach($platforms as $p=>$label){$url=$r[$p.'_url']??'';$links.=$url?'<a class="cfo-version-link cfo-version-link--'.$p.'" href="'.esc_url($url).'" target="_blank" rel="noopener noreferrer" aria-label="'.esc_attr($label).'">'.cfo_audio_platform_icon($p).'</a>':'<span class="cfo-version-link cfo-version-link--off">—</span>'; }
		$rows.='<div class="cfo-version-row'.(!empty($r['is_primary'])?' is-active':'').'" data-title="'.esc_attr($r['track_title']??'').'" data-version="'.esc_attr($r['version_label']??'').'" data-isrc="'.esc_attr($r['isrc']??'').'" data-duration="'.esc_attr(cfo_audio_duration($r['duration_seconds']??0)).'" data-spotify="'.esc_url($r['spotify_url']??'').'" data-youtube="'.esc_url($r['youtube_url']??'').'" data-deezer="'.esc_url($r['deezer_url']??'').'">'
		.'<span class="cfo-version-no">'.str_pad((string)($index+1),2,'0',STR_PAD_LEFT).'</span><span class="cfo-version-copy"><strong>'.esc_html($r['version_label']??'Version').'</strong><small>'.(!empty($r['is_primary'])?'Version principale':'Enregistrement alternatif').'</small></span><code>ISRC&nbsp; '.esc_html($r['isrc']??'—').'</code><nav>'.$links.'</nav></div>';
	}
	$title=$primary['track_title']??'Morceau'; $version=$primary['version_label']??'Version principale'; $duration=cfo_audio_duration($primary['duration_seconds']??0);
	$player='<section class="cfo-music-player"><header class="cfo-player-heading"><span>Écouter le morceau</span></header><div class="cfo-player-console"><div class="cfo-player-knob"><i></i><strong>CFO</strong><small>MUSIC PLAYER</small></div><div class="cfo-player-display"><div class="cfo-player-brand">CHRONIQUES D’UNE FILLE ORDINAIRE</div><div class="cfo-player-screen"><div class="cfo-player-track"><span class="cfo-play">▶</span><div><strong>'.esc_html(strtoupper($title)).'</strong><em>'.esc_html(strtoupper($version)).'</em></div><div class="cfo-eq">'.str_repeat('<i></i>',26).'</div><time>00:00 / '.esc_html($duration).'</time></div><div class="cfo-player-services"><span>ÉCOUTER SUR</span><div>'.$primary_buttons.'</div></div></div></div></div>';
	if(count($recordings)>1){$player.='<div class="cfo-version-panel"><header><strong>Autres versions du morceau</strong><span>Sélectionnez une version pour l’écouter ci-dessus</span></header><div class="cfo-version-list">'.$rows.'</div></div>';}
	$player.='<footer class="cfo-player-note"><strong>ⓘ &nbsp; À propos des versions</strong><p>Un même morceau peut exister en plusieurs enregistrements (version studio, live, acoustique, etc.).<br>Chaque version possède son propre code ISRC et peut être disponible sur certaines plateformes uniquement.</p><em>Les mêmes mots,<br>d’autres frissons</em></footer></section>';
	return substr($content,0,$figure_end).$player.substr($content,$figure_end);
}
add_filter('the_content','cfo_dossier_audio_tuner',20);
