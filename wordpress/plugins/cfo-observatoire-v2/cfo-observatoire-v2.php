<?php
/**
 * Plugin Name: CFO Observatoire V2
 * Description: Backend REST minimal et robuste pour le cockpit CFO, alimente par la vue Supabase cfo_cockpit_overview_v1.
 * Version: 2.0.0-alpha.1
 */
if (!defined('ABSPATH')) exit;

add_action('rest_api_init', function () {
    register_rest_route('cfo-observatoire/v2', '/data', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => 'cfo_observatoire_v2_data',
    ]);
});

function cfo_observatoire_v2_data() {
    $settings = get_option('cfo_observatoire_settings', []);
    $base = isset($settings['supabase_url']) ? rtrim((string)$settings['supabase_url'], '/') : '';
    $key = isset($settings['supabase_key']) ? (string)$settings['supabase_key'] : '';
    if (!$base || !$key) {
        return new WP_REST_Response(['ok'=>false,'error'=>'configuration_missing'], 503);
    }
    $url = $base . '/rest/v1/cfo_cockpit_overview_v1?select=*&limit=1';
    $response = wp_remote_get($url, [
        'timeout' => 12,
        'headers' => ['apikey'=>$key, 'Authorization'=>'Bearer '.$key, 'Accept'=>'application/json'],
    ]);
    if (is_wp_error($response)) {
        return new WP_REST_Response(['ok'=>false,'error'=>'supabase_unreachable','detail'=>$response->get_error_message()], 502);
    }
    $status = wp_remote_retrieve_response_code($response);
    $body = json_decode(wp_remote_retrieve_body($response), true);
    if ($status < 200 || $status >= 300 || !is_array($body)) {
        return new WP_REST_Response(['ok'=>false,'error'=>'supabase_response','status'=>$status], 502);
    }
    return new WP_REST_Response(['ok'=>true,'source'=>'cfo_cockpit_overview_v1','data'=>isset($body[0])?$body[0]:null], 200);
}
