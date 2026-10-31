<?php
define('ABSPATH', __DIR__);
$GLOBALS['options'] = ['wpvibe_draft_theme'=>'cfo-wpvibe-draft','stylesheet'=>'cfo'];
$GLOBALS['stylesheet'] = 'cfo';
$GLOBALS['locale'] = 'fr-FR';
$GLOBALS['requests'] = [];
$GLOBALS['remote_rows'] = [];
$GLOBALS['post'] = (object)['ID'=>1,'post_type'=>'post','post_status'=>'publish','post_title'=>'Titre français','post_excerpt'=>'Résumé','post_content'=>'<!-- wp:paragraph --><p>Français</p><!-- /wp:paragraph -->'];
class WPVibe_Preview {}
function get_option($key,$default=false){return $GLOBALS['options'][$key]??$default;}
function get_stylesheet(){return $GLOBALS['stylesheet'];}
function get_post($id=null){return $GLOBALS['post'];}
function wp_json_encode($value,$options=0){return json_encode($value,$options);}
function add_filter(...$args){}
function add_action(...$args){}
function cfo_international_locale(){return $GLOBALS['locale'];}
function absint($id){return abs((int)$id);}
function add_query_arg($params,$url){return $url.'?'.http_build_query($params);}
function wp_remote_get($url,$args){$GLOBALS['requests'][]=[$url,$args];return ['status'=>200,'body'=>json_encode($GLOBALS['remote_rows'])];}
function is_wp_error($value){return false;}
function wp_remote_retrieve_response_code($response){return $response['status'];}
function wp_remote_retrieve_body($response){return $response['body'];}
function is_admin(){return false;}
function is_singular(){return true;}
function in_the_loop(){return true;}
function is_main_query(){return true;}
require __DIR__.'/../theme/cfo-translations.php';
function check($result,$message){if(!$result){throw new Exception($message);}echo 'PASS '.$message."\n";}
check(!cfo_translation_preview_active(),'live theme has no preview access');
$_GET['wpvibe_preview']='forged';
check(!cfo_translation_preview_active(),'a forged query token grants no preview access');
$GLOBALS['stylesheet']='cfo-wpvibe-draft';
check(cfo_translation_preview_active(),'validated WPVibe theme swap enables preview');
$GLOBALS['options']['stylesheet']='cfo-wpvibe-draft';
check(!cfo_translation_preview_active(),'activating the draft as a live theme does not grant preview access');
$GLOBALS['options']['stylesheet']='cfo';
check(cfo_translation_content('Français')==='Français','French content is unchanged');
check(count($GLOBALS['requests'])===0,'French rendering makes no translation requests');
$GLOBALS['locale']='nl-BE';
check(cfo_translation_get(1,'post')===null,'unconfigured preview denies access');
check(str_contains(cfo_translation_content('Français'),'data-cfo-translation-error'),'missing Dutch content produces an explicit error');
$GLOBALS['post']->ID=2;
$GLOBALS['options']['cfo_supabase_sync_options']=['url'=>'https://fjpcuxsezeuajhlotzij.supabase.co','key'=>'test-public-key','secret'=>'test-only-not-a-real-secret'];
$GLOBALS['remote_rows']=[['source_hash'=>cfo_translation_source_hash($GLOBALS['post']),'translated_title'=>'Nederlandse titel','translated_excerpt'=>'Samenvatting','translated_content'=>'<!-- wp:paragraph --><p>Nederlands</p><!-- /wp:paragraph -->','status'=>'review']];
$row=cfo_translation_get(2,'post');
check($row['translated_title']==='Nederlandse titel','version-matched preview translation is read');
check(str_contains($GLOBALS['requests'][0][0],'in.%28review%2Capproved%2Cpublished%29'),'preview requests only allowed statuses');
check($GLOBALS['requests'][0][1]['redirection']===0,'credentials are not forwarded to redirects');
check(isset($GLOBALS['requests'][0][1]['headers']['X-WP-Sync-Secret']),'existing credential is attached server-side');
$GLOBALS['post']->ID=3;$GLOBALS['post']->post_content='Source modifiée';
check(cfo_translation_get(3,'post')===null,'stale source hash is rejected');
$GLOBALS['stylesheet']='cfo';$GLOBALS['post']->ID=4;
cfo_translation_get(4,'post');
$last=end($GLOBALS['requests']);
check(str_contains($last[0],'status=eq.published'),'public access requests published records only');
check(!isset($last[1]['headers']['X-WP-Sync-Secret']),'public access never uses a private credential');
check(cfo_translation_get(4,'sc_event')===null,'unsupported source types are rejected');
