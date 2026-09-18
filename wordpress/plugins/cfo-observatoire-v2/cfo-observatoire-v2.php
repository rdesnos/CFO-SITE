<?php
/**
 * Plugin Name: CFO Observatoire V2
 * Description: Cockpit CFO — vue d’ensemble de l’Observatoire, alimentée par Supabase, sans métriques fictives.
 * Version: 2.0.0-beta.2
 * Author: CFO
 */

if (!defined('ABSPATH')) exit;

define('CFO_OBSERVATOIRE_V2_VERSION', '2.0.0-beta.2');

add_shortcode('cfo_cockpit', 'cfo_observatoire_v2_shortcode');

add_action('rest_api_init', function () {
    register_rest_route('cfo-observatoire/v2', '/data', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => function () {
            return new WP_REST_Response(cfo_observatoire_v2_get_data(), 200);
        },
    ]);
});

add_action('admin_menu', function () {
    add_menu_page('CFO','CFO','manage_options','cfo-admin','cfo_admin_v1_page','dashicons-chart-area',58);
    add_submenu_page('cfo-admin','Administration CFO','Administration','manage_options','cfo-admin','cfo_admin_v1_page');
    add_submenu_page('cfo-admin','Cockpit CFO','Cockpit','manage_options','cfo-cockpit-v1','cfo_observatoire_v2_admin_page');
});

function cfo_observatoire_v2_settings() {
    $settings = get_option('cfo_observatoire_settings', []);
    return [
        'url' => isset($settings['supabase_url']) ? rtrim((string)$settings['supabase_url'], '/') : '',
        'key' => isset($settings['supabase_key']) ? (string)$settings['supabase_key'] : '',
    ];
}

function cfo_observatoire_v2_supabase_get($path, $profile = 'public') {
    $cfg = cfo_observatoire_v2_settings();
    if (!$cfg['url'] || !$cfg['key']) return new WP_Error('configuration_missing', 'Configuration Supabase absente.');

    $headers = [
        'apikey' => $cfg['key'],
        'Authorization' => 'Bearer ' . $cfg['key'],
        'Accept' => 'application/json',
    ];
    if ($profile !== 'public') $headers['Accept-Profile'] = $profile;

    $response = wp_remote_get($cfg['url'] . '/rest/v1/' . ltrim($path, '/'), [
        'timeout' => 15,
        'headers' => $headers,
    ]);
    if (is_wp_error($response)) return $response;

    $status = wp_remote_retrieve_response_code($response);
    $body = json_decode(wp_remote_retrieve_body($response), true);
    if ($status < 200 || $status >= 300 || !is_array($body)) return new WP_Error('supabase_response', 'Réponse Supabase invalide (' . intval($status) . ').');
    return $body;
}

function cfo_observatoire_v2_get_data() {
    $overview = cfo_observatoire_v2_supabase_get('cfo_cockpit_overview_v1?select=*&limit=500');
    $certifications = cfo_observatoire_v2_supabase_get('cockpit_certification_status?select=*&artist_name=eq.Marine&limit=50', 'cfo');
    return [
        'ok' => !is_wp_error($overview) || !is_wp_error($certifications),
        'version' => CFO_OBSERVATOIRE_V2_VERSION,
        'generated_at' => current_time('c'),
        'overview' => is_wp_error($overview) ? [] : $overview,
        'certifications' => is_wp_error($certifications) ? [] : $certifications,
        'errors' => [
            'overview' => is_wp_error($overview) ? $overview->get_error_message() : null,
            'certifications' => is_wp_error($certifications) ? $certifications->get_error_message() : null,
        ],
    ];
}

function cfo_observatoire_v2_pick($rows, $keys, $default = null) {
    foreach ((array)$rows as $row) {
        if (!is_array($row)) continue;
        foreach ($keys as $key) {
            if (array_key_exists($key, $row) && $row[$key] !== null && $row[$key] !== '') return $row[$key];
        }
    }
    return $default;
}

function cfo_observatoire_v2_first($row, $keys, $default = null) {
    if (!is_array($row)) return $default;
    foreach ($keys as $key) if (array_key_exists($key, $row) && $row[$key] !== null && $row[$key] !== '') return $row[$key];
    return $default;
}

function cfo_observatoire_v2_number($value, $compact = true) {
    if ($value === null || $value === '' || !is_numeric($value)) return '—';
    $v = (float)$value;
    if (!$compact) return number_format_i18n($v, 0);
    if (abs($v) >= 1000000000) return number_format_i18n($v / 1000000000, 1) . ' Md';
    if (abs($v) >= 1000000) return number_format_i18n($v / 1000000, 1) . ' M';
    if (abs($v) >= 1000) return number_format_i18n($v / 1000, 0) . ' k';
    return number_format_i18n($v, 0);
}

function cfo_observatoire_v2_pct($value) {
    if ($value === null || $value === '' || !is_numeric($value)) return '—';
    $v = (float)$value;
    return ($v > 0 ? '+' : '') . number_format_i18n($v, 1) . ' %';
}

function cfo_observatoire_v2_level_label($level) {
    $map = ['gold'=>'Or','platinum'=>'Platine','double_platinum'=>'Double platine','triple_platinum'=>'Triple platine','diamond'=>'Diamant','double_diamond'=>'Double diamant','triple_diamond'=>'Triple diamant'];
    return isset($map[$level]) ? $map[$level] : ($level ? ucfirst(str_replace('_',' ',(string)$level)) : '—');
}

function cfo_observatoire_v2_percent_from_cert($cert) {
    foreach (['progress_pct','progress_percent','progress','completion_pct','completion_percent'] as $key) {
        if (isset($cert[$key]) && is_numeric($cert[$key])) {
            $v = (float)$cert[$key];
            if ($v <= 1) $v *= 100;
            return max(0, min(100, $v));
        }
    }
    $current = cfo_observatoire_v2_first($cert, ['current_value','streams','stream_count','current_streams']);
    $target = cfo_observatoire_v2_first($cert, ['next_threshold','target_value','threshold','target_streams']);
    if (is_numeric($current) && is_numeric($target) && (float)$target > 0) return max(0, min(100, ((float)$current / (float)$target) * 100));
    return null;
}

function cfo_observatoire_v2_cert_cards($certs) {
    $cards = [];
    foreach ((array)$certs as $cert) {
        if (!is_array($cert)) continue;
        $title = cfo_observatoire_v2_first($cert, ['title','track_title','release_title','name']);
        if (!$title) continue;
        $cards[] = $cert;
        if (count($cards) === 3) break;
    }
    return $cards;
}

function cfo_observatoire_v2_title_rows($rows) {
    $out = [];
    foreach ((array)$rows as $row) {
        if (!is_array($row)) continue;
        $title = cfo_observatoire_v2_first($row, ['title','track_title','release_title','name']);
        if (!$title) continue;
        $out[] = $row;
        if (count($out) === 5) break;
    }
    return $out;
}

function cfo_observatoire_v2_shortcode() { return cfo_observatoire_v2_render(false); }
function cfo_observatoire_v2_admin_page() { if (current_user_can('manage_options')) echo '<div class="wrap">' . cfo_observatoire_v2_render(true) . '</div>'; }

function cfo_observatoire_v2_render($admin_preview = false) {
    $data = cfo_observatoire_v2_get_data();
    $overview = $data['overview'];
    $certs = $data['certifications'];

    $metrics = [
        ['icon'=>'▥','label'=>'Streams','sub'=>'toutes plateformes','value'=>cfo_observatoire_v2_pick($overview,['streams_total','total_streams','stream_count','streams']),'delta'=>cfo_observatoire_v2_pick($overview,['streams_delta_30d','streams_growth_30d','delta_30d'])],
        ['icon'=>'●','label'=>'Auditeurs mensuels','sub'=>'Spotify','value'=>cfo_observatoire_v2_pick($overview,['spotify_monthly_listeners','monthly_listeners_spotify','spotify_audience']),'delta'=>cfo_observatoire_v2_pick($overview,['spotify_monthly_listeners_delta_30d','spotify_growth_30d'])],
        ['icon'=>'▶','label'=>'Vues YouTube','sub'=>'','value'=>cfo_observatoire_v2_pick($overview,['youtube_views','youtube_views_total','youtube_audience','youtube_monthly_audience']),'delta'=>cfo_observatoire_v2_pick($overview,['youtube_delta_30d','youtube_growth_30d'])],
        ['icon'=>'◎','label'=>'Followers Instagram','sub'=>'','value'=>cfo_observatoire_v2_pick($overview,['instagram_followers','followers_instagram']),'delta'=>cfo_observatoire_v2_pick($overview,['instagram_delta_30d','instagram_growth_30d'])],
        ['icon'=>'♪','label'=>'Followers TikTok','sub'=>'','value'=>cfo_observatoire_v2_pick($overview,['tiktok_followers','followers_tiktok']),'delta'=>cfo_observatoire_v2_pick($overview,['tiktok_delta_30d','tiktok_growth_30d'])],
        ['icon'=>'◉','label'=>'Audience radio','sub'=>'airplay','value'=>cfo_observatoire_v2_pick($overview,['airplay_audience','radio_audience','airplay_total']),'delta'=>cfo_observatoire_v2_pick($overview,['airplay_delta_30d','radio_growth_30d'])],
    ];
    $cert_cards = cfo_observatoire_v2_cert_cards($certs);
    $title_rows = cfo_observatoire_v2_title_rows($overview);

    ob_start(); ?>
<style>
.cfo-cockpit-v0{--paper:#fbf8f2;--white:#fffdfa;--ink:#123744;--rust:#a53c2e;--rust2:#c76550;--teal:#174959;--muted:#64757a;--line:#e7e0d7;--green:#17855c;font-family:Arial,Helvetica,sans-serif;color:var(--ink);max-width:1280px;margin:0 auto;background:var(--paper);padding:0 0 30px}
.cfo-cockpit-v0 *{box-sizing:border-box}.cfo-cockpit-v0 h2,.cfo-cockpit-v0 h3,.cfo-cockpit-v0 .serif{font-family:Georgia,'Times New Roman',serif;font-weight:500}.cfo-tabs{display:flex;gap:36px;align-items:end;border-bottom:1px solid #d9d4cd;padding:0 8px 0;margin:0 0 18px;overflow:auto}.cfo-tabs span{white-space:nowrap;padding:15px 4px 13px;font-family:Georgia,'Times New Roman',serif;font-size:16px}.cfo-tabs span:first-child{color:var(--rust);border-bottom:4px solid var(--rust);font-weight:700}.cfo-meta{margin-left:auto;font-size:11px;color:var(--muted);text-align:right;line-height:1.35;padding-bottom:10px}.cfo-section{padding:0 14px;margin:0 0 20px}.cfo-heading{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:10px}.cfo-heading-left{border-left:3px solid var(--rust);padding-left:10px}.cfo-heading h2{font-size:25px;line-height:1.05;margin:0 0 4px}.cfo-heading p{margin:0;color:#68808a;font-family:Georgia,'Times New Roman',serif;font-size:14px}.cfo-link{color:var(--rust);font-family:Georgia,'Times New Roman',serif;font-size:13px;text-decoration:none;padding-top:7px}.cfo-range{border:1px solid var(--line);background:#fff;padding:9px 12px;border-radius:7px;color:var(--ink);font-size:12px}.cfo-grid6{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.cfo-kpi{background:var(--white);border:1px solid var(--line);padding:14px 13px 12px;min-height:120px;display:flex;gap:10px;align-items:flex-start}.cfo-kpi-icon{font-size:25px;color:var(--rust);width:32px;text-align:center;margin-top:8px}.cfo-kpi-value{font-family:Georgia,'Times New Roman',serif;color:var(--rust);font-weight:700;font-size:22px}.cfo-kpi-label{font-size:11px;color:#4f6670;line-height:1.25}.cfo-delta{margin-top:12px;color:var(--green);font-weight:700;font-size:13px}.cfo-delta small{display:block;color:var(--muted);font-weight:400;margin-top:2px}.cfo-cert-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.cfo-cert{background:var(--white);border:1px solid var(--line);padding:14px;min-height:205px}.cfo-cert-top{display:flex;gap:14px}.cfo-cover{width:88px;height:88px;background:linear-gradient(135deg,#d4c1b2,#8d6657);flex:0 0 auto}.cfo-cert-title{font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;margin:2px 0 6px}.cfo-cert-meta{font-family:Georgia,'Times New Roman',serif;color:#526d78;font-size:13px}.cfo-disc{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:50%;background:radial-gradient(circle,#233 0 13%,#d7b470 14% 55%,#111 56%);margin-right:7px;vertical-align:middle}.cfo-level{margin-top:13px;font-family:Georgia,'Times New Roman',serif;font-weight:700}.cfo-cert-bottom{display:grid;grid-template-columns:1.3fr .8fr;gap:16px;align-items:end;margin-top:13px}.cfo-percent{font-family:Georgia,'Times New Roman',serif;font-size:32px;color:var(--rust);line-height:1}.cfo-progress{height:9px;background:#d9d9d9;margin-top:7px;border-radius:2px;overflow:hidden}.cfo-progress i{display:block;height:100%;background:var(--rust);width:0}.cfo-remain{font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700}.cfo-small{font-size:11px;color:var(--muted);line-height:1.3}.cfo-two{display:grid;grid-template-columns:2.1fr .9fr;gap:12px}.cfo-card{background:var(--white);border:1px solid var(--line);padding:14px}.cfo-chart{height:210px;position:relative;background:linear-gradient(#eee8e1 1px,transparent 1px),linear-gradient(90deg,#eee8e1 1px,transparent 1px);background-size:100% 42px,10% 100%;overflow:hidden;margin-top:10px}.cfo-chart:before{content:'';position:absolute;left:0;right:0;bottom:35px;height:74px;background:linear-gradient(180deg,rgba(190,82,59,.08),rgba(190,82,59,.25));clip-path:polygon(0 82%,7% 70%,13% 73%,20% 65%,29% 70%,36% 42%,44% 58%,50% 49%,58% 54%,63% 30%,69% 62%,75% 46%,81% 58%,87% 40%,91% 57%,95% 18%,100% 43%,100% 100%,0 100%)}.cfo-chart:after{content:'Données temporelles : branchement en cours';position:absolute;left:14px;bottom:10px;color:var(--muted);font-size:11px}.cfo-donut-wrap{display:flex;gap:18px;align-items:center;margin-top:18px}.cfo-donut{width:150px;height:150px;border-radius:50%;background:conic-gradient(var(--teal) 0 62%,#c96f58 62% 80%,#758990 80% 88%,#9aa9ad 88% 94%,#d6d7d4 94%);position:relative;flex:0 0 auto}.cfo-donut:after{content:'Mix';position:absolute;inset:34px;background:var(--white);border-radius:50%;display:grid;place-items:center;font-family:Georgia,'Times New Roman',serif;font-size:18px}.cfo-legend{font-size:12px;line-height:1.9}.cfo-table{width:100%;border-collapse:collapse;font-size:12px}.cfo-table th{font-family:Georgia,'Times New Roman',serif;font-weight:400;color:#536a73;text-align:left;padding:7px 8px;border-bottom:1px solid var(--line)}.cfo-table td{padding:8px;border-bottom:1px solid #ece7df}.cfo-table tr:last-child td{border-bottom:0}.cfo-up{color:var(--green);font-weight:700}.cfo-empty{padding:28px 12px;color:var(--muted);font-size:12px;text-align:center}.cfo-bottom{display:grid;grid-template-columns:1.5fr .8fr .85fr;gap:12px}.cfo-projects{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.cfo-project{border:1px solid var(--line);padding:10px;min-height:145px;background:#fff}.cfo-project-head{display:flex;gap:9px}.cfo-project-cover{width:54px;height:54px;background:#d7c0b0}.cfo-project strong{font-family:Georgia,'Times New Roman',serif}.cfo-project-value{font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:700;margin-top:18px}.cfo-audience-row{display:flex;justify-content:space-between;gap:10px;padding:8px 3px;border-bottom:1px solid var(--line);font-size:13px}.cfo-audience-row:last-child{border-bottom:0}.cfo-retain{margin:0;padding:0;list-style:none}.cfo-retain li{position:relative;padding:10px 0 10px 19px;border-bottom:1px solid var(--line);font-family:Georgia,'Times New Roman',serif;font-size:13px}.cfo-retain li:before{content:'▪';position:absolute;left:0;color:var(--rust)}.cfo-status{margin:0 14px 15px;padding:10px 12px;border:1px solid #ead5ba;background:#fff8ed;color:#795b37;font-size:12px}.cfo-version{padding:5px 14px 0;color:#8a8a84;font-size:10px;text-align:right}
@media(max-width:1000px){.cfo-grid6{grid-template-columns:repeat(3,1fr)}.cfo-cert-grid,.cfo-bottom{grid-template-columns:1fr}.cfo-two{grid-template-columns:1fr}.cfo-projects{grid-template-columns:repeat(3,1fr)}}
@media(max-width:650px){.cfo-grid6{grid-template-columns:repeat(2,1fr)}.cfo-cert-grid,.cfo-projects{grid-template-columns:1fr}.cfo-tabs{gap:18px}.cfo-heading h2{font-size:22px}.cfo-donut-wrap{align-items:flex-start}.cfo-table{font-size:10px}.cfo-table th,.cfo-table td{padding:6px 4px}}
</style>
<div class="cfo-cockpit-v0">
  <div class="cfo-tabs">
    <span>Vue d’ensemble</span><span>Certifications</span><span>Titres</span><span>Projets</span><span>Plateformes</span><span>Audience</span><span>Chronologie</span><span>Analyses</span>
    <div class="cfo-meta">Dernière mise à jour : <?php echo esc_html(wp_date('d M Y')); ?><br>Données Supabase</div>
  </div>
  <?php if (!$data['ok']): ?><div class="cfo-status">Connexion aux données indisponible : le rendu est affiché, aucune valeur n’est inventée.</div><?php endif; ?>

  <section class="cfo-section">
    <div class="cfo-heading"><div class="cfo-heading-left"><h2>Les chiffres essentiels</h2><p>Une vue globale de la performance de Marine sur l’ensemble des plateformes.</p></div><div class="cfo-range">12 derniers mois⌄</div></div>
    <div class="cfo-grid6">
      <?php foreach ($metrics as $m): ?>
      <div class="cfo-kpi"><div class="cfo-kpi-icon"><?php echo esc_html($m['icon']); ?></div><div><div class="cfo-kpi-value"><?php echo esc_html(cfo_observatoire_v2_number($m['value'])); ?></div><div class="cfo-kpi-label"><?php echo esc_html($m['label']); ?><br><span><?php echo esc_html($m['sub']); ?></span></div><div class="cfo-delta"><?php echo esc_html(cfo_observatoire_v2_pct($m['delta'])); ?><small>sur 30 jours</small></div></div></div>
      <?php endforeach; ?>
    </div>
  </section>

  <section class="cfo-section">
    <div class="cfo-heading"><div class="cfo-heading-left"><h2>Certifications : où en est-on ?</h2><p>Les prochaines étapes de Marine, tous supports confondus.</p></div><a class="cfo-link" href="#">Voir toutes les certifications →</a></div>
    <div class="cfo-cert-grid">
      <?php if ($cert_cards): foreach ($cert_cards as $cert):
        $title = cfo_observatoire_v2_first($cert,['title','track_title','release_title','name'],'—');
        $level = cfo_observatoire_v2_level_label(cfo_observatoire_v2_first($cert,['next_level','target_level','current_level']));
        $pct = cfo_observatoire_v2_percent_from_cert($cert);
        $remain = cfo_observatoire_v2_first($cert,['remaining','remaining_value','streams_remaining']);
        $projection = cfo_observatoire_v2_first($cert,['projected_date','projection_date','eta','estimated_date']);
        $threshold = cfo_observatoire_v2_first($cert,['next_threshold','target_value','threshold']); ?>
      <div class="cfo-cert">
        <div class="cfo-cert-top"><div class="cfo-cover"></div><div><div class="cfo-cert-title"><?php echo esc_html($title); ?></div><div class="cfo-cert-meta"><?php echo esc_html(cfo_observatoire_v2_first($cert,['release_type','type'],'Titre')); ?></div><div class="cfo-level"><span class="cfo-disc"></span><?php echo esc_html($level); ?></div><div class="cfo-small"><?php echo $threshold ? esc_html('(' . cfo_observatoire_v2_number($threshold,false) . ')') : ''; ?></div></div></div>
        <div class="cfo-cert-bottom"><div><div class="cfo-percent"><?php echo $pct !== null ? esc_html(number_format_i18n($pct,0) . ' %') : '—'; ?></div><div class="cfo-progress"><i style="width:<?php echo $pct !== null ? esc_attr($pct) : 0; ?>%"></i></div></div><div><div class="cfo-remain"><?php echo esc_html(cfo_observatoire_v2_number($remain)); ?></div><div class="cfo-small">restants<br>Projection<br><strong><?php echo esc_html($projection ?: '—'); ?></strong></div></div></div>
      </div>
      <?php endforeach; else: ?>
      <div class="cfo-cert"><div class="cfo-empty">Certifications : données en cours de branchement.</div></div><div class="cfo-cert"><div class="cfo-empty">Aucune projection fictive.</div></div><div class="cfo-cert"><div class="cfo-empty">Le bloc est prêt à recevoir les données calculées.</div></div>
      <?php endif; ?>
    </div>
  </section>

  <section class="cfo-section">
    <div class="cfo-two">
      <div class="cfo-card"><div class="cfo-heading-left"><h2>Évolution globale</h2><p>Streams quotidiens (toutes plateformes) – 12 derniers mois.</p></div><div class="cfo-chart"></div></div>
      <div class="cfo-card"><div class="cfo-heading-left"><h2>Répartition par plateforme</h2></div><div class="cfo-donut-wrap"><div class="cfo-donut"></div><div class="cfo-legend">● Spotify<br>● YouTube<br>● Deezer<br>● Apple Music<br>● Autres</div></div></div>
    </div>
  </section>

  <section class="cfo-section">
    <div class="cfo-heading"><div class="cfo-heading-left"><h2>Les titres</h2><p>Performance des principaux titres (cumul et dynamique).</p></div><a class="cfo-link" href="#">Voir tous les titres →</a></div>
    <div class="cfo-card" style="padding:8px 10px">
      <?php if ($title_rows): ?><div style="overflow:auto"><table class="cfo-table"><thead><tr><th>#</th><th>Titre</th><th>Sortie</th><th>Streams</th><th>7 j</th><th>30 j</th><th>Δ</th><th>Certification</th><th>Prochain seuil</th></tr></thead><tbody>
      <?php $i=1; foreach ($title_rows as $row): ?><tr><td><?php echo $i++; ?></td><td><strong><?php echo esc_html(cfo_observatoire_v2_first($row,['title','track_title','release_title','name'],'—')); ?></strong></td><td><?php echo esc_html(cfo_observatoire_v2_first($row,['release_date','released_at','date'],'—')); ?></td><td><?php echo esc_html(cfo_observatoire_v2_number(cfo_observatoire_v2_first($row,['streams','total_streams','stream_count']))); ?></td><td><?php echo esc_html(cfo_observatoire_v2_number(cfo_observatoire_v2_first($row,['streams_7d','seven_day_streams']))); ?></td><td><?php echo esc_html(cfo_observatoire_v2_number(cfo_observatoire_v2_first($row,['streams_30d','thirty_day_streams']))); ?></td><td class="cfo-up"><?php echo esc_html(cfo_observatoire_v2_pct(cfo_observatoire_v2_first($row,['delta_30d','growth_30d']))); ?></td><td><?php echo esc_html(cfo_observatoire_v2_level_label(cfo_observatoire_v2_first($row,['certification','current_level']))); ?></td><td><?php echo esc_html(cfo_observatoire_v2_number(cfo_observatoire_v2_first($row,['remaining','next_threshold_remaining']))); ?></td></tr><?php endforeach; ?>
      </tbody></table></div><?php else: ?><div class="cfo-empty">La table des titres est prête. Les lignes s’afficheront dès que la vue Supabase expose le niveau titre.</div><?php endif; ?>
    </div>
  </section>

  <section class="cfo-section">
    <div class="cfo-bottom">
      <div class="cfo-card"><div class="cfo-heading"><div class="cfo-heading-left"><h2>Projets</h2><p>Vue par projet (album, EP, single).</p></div><a class="cfo-link" href="#">Voir tous les projets →</a></div><div class="cfo-projects"><div class="cfo-project"><div class="cfo-project-head"><div class="cfo-project-cover"></div><div><strong>Projet 1</strong><div class="cfo-small">Agrégation des titres</div></div></div><div class="cfo-project-value">—</div><div class="cfo-small">streams équivalents</div></div><div class="cfo-project"><div class="cfo-project-head"><div class="cfo-project-cover"></div><div><strong>Projet 2</strong><div class="cfo-small">Agrégation des titres</div></div></div><div class="cfo-project-value">—</div><div class="cfo-small">streams équivalents</div></div><div class="cfo-project"><div class="cfo-project-head"><div class="cfo-project-cover"></div><div><strong>Projet 3</strong><div class="cfo-small">Agrégation des titres</div></div></div><div class="cfo-project-value">—</div><div class="cfo-small">streams équivalents</div></div></div></div>
      <div class="cfo-card"><div class="cfo-heading-left"><h2>Audience</h2><p>Communautés et évolution.</p></div><div class="cfo-audience-row"><span>Instagram</span><strong><?php echo esc_html(cfo_observatoire_v2_number(cfo_observatoire_v2_pick($overview,['instagram_followers','followers_instagram']))); ?></strong></div><div class="cfo-audience-row"><span>TikTok</span><strong><?php echo esc_html(cfo_observatoire_v2_number(cfo_observatoire_v2_pick($overview,['tiktok_followers','followers_tiktok']))); ?></strong></div><div class="cfo-audience-row"><span>YouTube</span><strong><?php echo esc_html(cfo_observatoire_v2_number(cfo_observatoire_v2_pick($overview,['youtube_subscribers','youtube_followers']))); ?></strong></div><div class="cfo-audience-row"><span>Spotify</span><strong><?php echo esc_html(cfo_observatoire_v2_number(cfo_observatoire_v2_pick($overview,['spotify_monthly_listeners','monthly_listeners_spotify']))); ?></strong></div><div class="cfo-audience-row"><span>X</span><strong><?php echo esc_html(cfo_observatoire_v2_number(cfo_observatoire_v2_pick($overview,['x_followers','twitter_followers']))); ?></strong></div><div class="cfo-audience-row"><span>Facebook</span><strong><?php echo esc_html(cfo_observatoire_v2_number(cfo_observatoire_v2_pick($overview,['facebook_followers']))); ?></strong></div></div>
      <div class="cfo-card"><div class="cfo-heading-left"><h2>À retenir</h2></div><ul class="cfo-retain"><li>Dynamique globale de la période</li><li>Contribution du catalogue et des nouveautés</li><li>Trajectoires de certifications</li><li>Évolution des audiences</li></ul></div>
    </div>
  </section>
  <div class="cfo-version">Cockpit CFO · <?php echo esc_html(CFO_OBSERVATOIRE_V2_VERSION); ?></div>
</div>
<?php return ob_get_clean();
}


function cfo_admin_v1_get_status() {
    $cfg = cfo_observatoire_v2_settings();
    if (!$cfg['url'] || !$cfg['key']) return new WP_Error('configuration_missing', 'Configuration Supabase absente.');
    $response = wp_remote_post($cfg['url'] . '/rest/v1/rpc/cfo_admin_data_status', [
        'timeout' => 15,
        'headers' => [
            'apikey' => $cfg['key'],
            'Authorization' => 'Bearer ' . $cfg['key'],
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ],
        'body' => '{}',
    ]);
    if (is_wp_error($response)) return $response;
    $status = wp_remote_retrieve_response_code($response);
    $body = json_decode(wp_remote_retrieve_body($response), true);
    if ($status < 200 || $status >= 300 || !is_array($body)) return new WP_Error('supabase_response', 'Réponse Supabase invalide (' . intval($status) . ').');
    return $body;
}

function cfo_admin_v1_page() {
    if (!current_user_can('manage_options')) return;
    $data = cfo_admin_v1_get_status();
    $ok = !is_wp_error($data);
    $summary = $ok ? ($data['summary'] ?? []) : [];
    $artists = $ok ? ($data['artists'] ?? []) : [];
    $completed = 0; $running = 0; $pending = 0; $failed = 0;
    foreach ($artists as $a) {
        $s = $a['init_status'] ?? 'pending';
        if ($s === 'completed') $completed++;
        elseif ($s === 'dispatched') $running++;
        elseif ($s === 'failed') $failed++;
        else $pending++;
    }
    ?>
    <style>
    .cfo-admin{--ink:#123744;--rust:#a53c2e;--green:#17855c;--amber:#b87918;--red:#b42318;--line:#e5ddd3;--paper:#fbf8f2;color:var(--ink);max-width:1500px;margin:18px 20px 30px 0}
    .cfo-admin *{box-sizing:border-box}.cfo-admin h1{font-family:Georgia,serif;font-size:32px;margin:0}.cfo-admin .lead{color:#66777d;margin:6px 0 20px}
    .cfo-admin-tabs{display:flex;gap:8px;margin:0 0 18px;flex-wrap:wrap}.cfo-admin-tab{padding:8px 13px;border:1px solid var(--line);border-radius:999px;background:#fff;font-weight:700}.cfo-admin-tab.on{background:var(--ink);color:#fff;border-color:var(--ink)}
    .cfo-admin-kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:18px}.cfo-admin-card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px}.cfo-admin-card b{display:block;font:700 26px Georgia,serif;margin-top:5px}.cfo-admin-card small{color:#718087}
    .cfo-admin-status{display:inline-flex;align-items:center;gap:6px;font-weight:700}.cfo-admin-dot{width:9px;height:9px;border-radius:50%;background:#999}.done .cfo-admin-dot{background:var(--green)}.run .cfo-admin-dot{background:var(--amber)}.fail .cfo-admin-dot{background:var(--red)}
    .cfo-admin-table-wrap{background:#fff;border:1px solid var(--line);border-radius:14px;overflow:auto}.cfo-admin-table{width:100%;border-collapse:collapse}.cfo-admin-table th,.cfo-admin-table td{padding:10px 12px;border-bottom:1px solid #eee8e0;text-align:left;white-space:nowrap}.cfo-admin-table th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#687b82;background:#faf8f5}.cfo-admin-table tr:last-child td{border-bottom:0}.cfo-admin-alert{padding:13px;border:1px solid #e8cda9;background:#fff4e8;border-radius:10px}
    @media(max-width:1000px){.cfo-admin-kpis{grid-template-columns:repeat(3,1fr)}}@media(max-width:650px){.cfo-admin-kpis{grid-template-columns:repeat(2,1fr)}}
    </style>
    <div class="cfo-admin">
      <h1>Administration CFO</h1>
      <div class="lead">Pilotage opérationnel du référentiel, de l’acquisition Soundcharts et de l’Observatoire.</div>
      <div class="cfo-admin-tabs"><span class="cfo-admin-tab on">Data</span><span class="cfo-admin-tab">Catalogue</span><span class="cfo-admin-tab">MGP / Observatoire</span><span class="cfo-admin-tab">Éditorial</span><span class="cfo-admin-tab">Système</span></div>
      <?php if (!$ok): ?><div class="cfo-admin-alert"><?php echo esc_html($data->get_error_message()); ?></div><?php else: ?>
      <div class="cfo-admin-kpis">
        <div class="cfo-admin-card"><small>Artistes panel</small><b><?php echo intval($summary['artists'] ?? 0); ?></b></div>
        <div class="cfo-admin-card"><small>Objets catalogue</small><b><?php echo intval($summary['tracks'] ?? 0); ?></b></div>
        <div class="cfo-admin-card"><small>À arbitrer</small><b><?php echo intval($summary['review'] ?? 0); ?></b></div>
        <div class="cfo-admin-card"><small>Init terminées</small><b><?php echo intval($completed); ?>/<?php echo intval(count($artists)); ?></b></div>
        <div class="cfo-admin-card"><small>En cours</small><b><?php echo intval($running); ?></b></div>
        <div class="cfo-admin-card"><small>RAW Soundcharts</small><b><?php echo number_format_i18n(intval($summary['raw_responses'] ?? 0)); ?></b></div>
      </div>
      <div class="cfo-admin-table-wrap"><table class="cfo-admin-table"><thead><tr><th>Artiste</th><th>Init</th><th>Catalogue</th><th>ISRC</th><th>Inclus</th><th>Exclus</th><th>Review</th><th>RAW</th><th>Dernière collecte</th></tr></thead><tbody>
      <?php foreach ($artists as $a):
        $s=$a['init_status'] ?? 'pending'; $cls=$s==='completed'?'done':($s==='dispatched'?'run':($s==='failed'?'fail':''));
        $label=$s==='completed'?'Terminé':($s==='dispatched'?'En cours':($s==='failed'?'Erreur':'En attente')); ?>
        <tr><td><strong><?php echo esc_html($a['name'] ?? '—'); ?></strong></td><td><span class="cfo-admin-status <?php echo esc_attr($cls); ?>"><i class="cfo-admin-dot"></i><?php echo esc_html($label); ?></span></td><td><?php echo intval($a['tracks'] ?? 0); ?></td><td><?php echo intval($a['with_isrc'] ?? 0); ?></td><td><?php echo intval($a['included'] ?? 0); ?></td><td><?php echo intval($a['excluded'] ?? 0); ?></td><td><?php echo intval($a['review'] ?? 0); ?></td><td><?php echo number_format_i18n(intval($a['raw_count'] ?? 0)); ?></td><td><?php echo !empty($a['last_raw_at']) ? esc_html(wp_date('d/m/Y H:i', strtotime($a['last_raw_at']))) : '—'; ?></td></tr>
      <?php endforeach; ?></tbody></table></div>
      <?php endif; ?>
    </div>
    <?php
}