<?php
/**
 * Plugin Name: CFO Observatoire V2
 * Description: Cockpit CFO_Marine — V1 testable figée, alimentée par Supabase et sans métriques fictives.
 * Version: 2.0.0-beta.1
 * Author: CFO
 */

if (!defined('ABSPATH')) exit;

define('CFO_OBSERVATOIRE_V2_VERSION', '2.0.0-beta.1');

add_action('rest_api_init', function () {
    register_rest_route('cfo-observatoire/v2', '/data', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => 'cfo_observatoire_v2_rest_data',
    ]);
});

add_shortcode('cfo_cockpit', 'cfo_observatoire_v2_shortcode');

add_action('admin_menu', function () {
    add_menu_page(
        'Cockpit CFO',
        'Cockpit CFO',
        'manage_options',
        'cfo-cockpit-v1',
        'cfo_observatoire_v2_admin_page',
        'dashicons-chart-area',
        58
    );
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
    if (!$cfg['url'] || !$cfg['key']) {
        return new WP_Error('configuration_missing', 'Configuration Supabase absente.');
    }

    $headers = [
        'apikey' => $cfg['key'],
        'Authorization' => 'Bearer ' . $cfg['key'],
        'Accept' => 'application/json',
    ];
    if ($profile !== 'public') {
        $headers['Accept-Profile'] = $profile;
    }

    $response = wp_remote_get($cfg['url'] . '/rest/v1/' . ltrim($path, '/'), [
        'timeout' => 15,
        'headers' => $headers,
    ]);

    if (is_wp_error($response)) return $response;

    $status = wp_remote_retrieve_response_code($response);
    $body = json_decode(wp_remote_retrieve_body($response), true);

    if ($status < 200 || $status >= 300 || !is_array($body)) {
        return new WP_Error('supabase_response', 'Réponse Supabase invalide (' . intval($status) . ').');
    }
    return $body;
}

function cfo_observatoire_v2_get_data() {
    $overview = cfo_observatoire_v2_supabase_get('cfo_cockpit_overview_v1?select=*&limit=100');
    $certifications = cfo_observatoire_v2_supabase_get('cockpit_certification_status?select=*&artist_name=eq.Marine&limit=20', 'cfo');

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

function cfo_observatoire_v2_rest_data() {
    return new WP_REST_Response(cfo_observatoire_v2_get_data(), 200);
}

function cfo_observatoire_v2_shortcode() {
    return cfo_observatoire_v2_render(false);
}

function cfo_observatoire_v2_admin_page() {
    if (!current_user_can('manage_options')) return;
    echo '<div class="wrap"><h1 style="display:none">Cockpit CFO</h1>';
    echo cfo_observatoire_v2_render(true);
    echo '</div>';
}

function cfo_observatoire_v2_pick_metric($rows, $keys) {
    foreach ($rows as $row) {
        if (!is_array($row)) continue;
        foreach ($keys as $key) {
            if (array_key_exists($key, $row) && $row[$key] !== null && $row[$key] !== '') {
                return $row[$key];
            }
        }
    }
    return null;
}

function cfo_observatoire_v2_fmt($value) {
    if ($value === null || $value === '') return 'Indisponible';
    if (is_numeric($value)) return number_format_i18n((float)$value, 0);
    return esc_html((string)$value);
}

function cfo_observatoire_v2_level_label($level) {
    $map = [
        'gold' => 'Or',
        'platinum' => 'Platine',
        'double_platinum' => 'Double platine',
        'triple_platinum' => 'Triple platine',
        'diamond' => 'Diamant',
        'double_diamond' => 'Double diamant',
        'triple_diamond' => 'Triple diamant',
    ];
    return isset($map[$level]) ? $map[$level] : ucfirst((string)$level);
}

function cfo_observatoire_v2_render($admin_preview = false) {
    $data = cfo_observatoire_v2_get_data();
    $overview = $data['overview'];
    $certs = $data['certifications'];

    $spotify_listeners = cfo_observatoire_v2_pick_metric($overview, ['spotify_monthly_listeners','monthly_listeners_spotify','spotify_audience']);
    $spotify_followers = cfo_observatoire_v2_pick_metric($overview, ['spotify_followers','followers_spotify']);
    $youtube = cfo_observatoire_v2_pick_metric($overview, ['youtube_monthly_audience','youtube_views_monthly','youtube_audience']);
    $tiktok = cfo_observatoire_v2_pick_metric($overview, ['tiktok_followers','followers_tiktok']);
    $instagram = cfo_observatoire_v2_pick_metric($overview, ['instagram_followers','followers_instagram']);

    $verified = null;
    foreach ($certs as $cert) {
        if (!empty($cert['title']) && mb_strtolower($cert['title']) === 'ma faute') {
            $verified = $cert;
            break;
        }
    }
    if (!$verified && !empty($certs)) $verified = $certs[0];

    ob_start();
    ?>
    <style>
    .cfo-cockpit{--b:#7b2d36;--o:#b6813c;--ink:#2b2928;--muted:#77716d;--line:#e7ded4;--paper:#fbf8f3;--white:#fff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);max-width:1500px;margin:18px auto;background:var(--paper);border:1px solid var(--line);border-radius:20px;overflow:hidden;box-shadow:0 18px 45px rgba(65,46,31,.08)}
    .cfo-head{padding:26px 30px 20px;background:linear-gradient(135deg,#fff 0%,#f6efe6 100%);border-bottom:1px solid var(--line)}
    .cfo-kicker{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--b);font-weight:800}.cfo-title{font-family:Georgia,"Times New Roman",serif;font-size:34px;line-height:1.05;margin:7px 0 8px}.cfo-sub{color:var(--muted);font-size:14px;display:flex;gap:14px;flex-wrap:wrap}.cfo-badge{display:inline-flex;align-items:center;gap:7px;border:1px solid #d8c8b9;border-radius:999px;padding:6px 10px;background:#fff;font-size:12px;font-weight:700}.cfo-dot{width:8px;height:8px;border-radius:50%;background:#6c9b65}.cfo-nav{display:flex;gap:8px;overflow:auto;padding:14px 22px;border-bottom:1px solid var(--line);background:#fff}.cfo-nav span{white-space:nowrap;border:1px solid var(--line);border-radius:999px;padding:8px 12px;font-size:12px;font-weight:700}.cfo-nav span:first-child{background:var(--b);border-color:var(--b);color:#fff}
    .cfo-body{padding:24px}.cfo-section{margin:0 0 22px}.cfo-section h2{font-family:Georgia,"Times New Roman",serif;font-size:23px;margin:0 0 13px}.cfo-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:14px}.cfo-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;min-height:112px}.cfo-card h3{font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin:0 0 9px;color:var(--muted)}.cfo-value{font-family:Georgia,"Times New Roman",serif;font-size:27px;font-weight:700}.cfo-note{font-size:12px;color:var(--muted);margin-top:7px}.cfo-span-3{grid-column:span 3}.cfo-span-4{grid-column:span 4}.cfo-span-6{grid-column:span 6}.cfo-span-8{grid-column:span 8}.cfo-span-12{grid-column:span 12}.cfo-primary{border-top:4px solid var(--b)}.cfo-gold{border-top:4px solid var(--o)}.cfo-progress{height:8px;background:#eee6dd;border-radius:999px;overflow:hidden;margin-top:12px}.cfo-progress > i{display:block;height:100%;background:var(--o);width:0}.cfo-state{display:inline-block;margin-top:8px;padding:5px 8px;border-radius:999px;background:#f1ebe4;color:#6e5d51;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.cfo-row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.cfo-table{width:100%;border-collapse:collapse;font-size:13px}.cfo-table th,.cfo-table td{text-align:left;border-bottom:1px solid var(--line);padding:10px 8px}.cfo-table th{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em}.cfo-empty{padding:18px;border:1px dashed #ccbba8;border-radius:14px;color:var(--muted);background:#fff}.cfo-foot{padding:13px 24px;border-top:1px solid var(--line);background:#fff;color:var(--muted);font-size:11px}.cfo-alert{margin-bottom:16px;padding:12px 14px;border-radius:12px;background:#fff4e8;border:1px solid #e8cda9;color:#6d4f2b;font-size:13px}
    @media(max-width:900px){.cfo-span-3,.cfo-span-4,.cfo-span-6,.cfo-span-8{grid-column:span 12}.cfo-body{padding:16px}.cfo-head{padding:22px 18px}.cfo-title{font-size:28px}}
    </style>
    <div class="cfo-cockpit">
      <div class="cfo-head">
        <div class="cfo-kicker">L’Observatoire · CFO_Marine</div>
        <div class="cfo-title">Cockpit CFO</div>
        <div class="cfo-sub">
          <span class="cfo-badge"><span class="cfo-dot"></span> V1 figée · <?php echo esc_html(CFO_OBSERVATOIRE_V2_VERSION); ?></span>
          <span>Mise à jour : <?php echo esc_html(wp_date('d/m/Y H:i')); ?></span>
          <span>Supabase → WordPress</span>
        </div>
      </div>
      <div class="cfo-nav"><span>Vue d’ensemble</span><span>Audiences</span><span>Écoutes &amp; Titres</span><span>Classements</span><span>Certifications</span><span>Airplay</span><span>Comparaisons</span></div>
      <div class="cfo-body">
        <?php if (!$data['ok']): ?><div class="cfo-alert">Connexion aux données indisponible. Le cockpit reste affiché mais aucune valeur n’est inventée.</div><?php endif; ?>

        <section class="cfo-section">
          <h2>Prochaines certifications</h2>
          <div class="cfo-grid">
            <div class="cfo-card cfo-span-6 cfo-primary">
              <div class="cfo-row"><div><h3>Single en cours</h3><div class="cfo-value">TRICHEUR</div></div><span class="cfo-state">En cours</span></div>
              <div class="cfo-note">Projection de certification : en attente d’un périmètre et d’une cible calibrés. Aucun pourcentage fictif affiché.</div>
              <div class="cfo-progress"><i></i></div>
            </div>
            <div class="cfo-card cfo-span-6 cfo-gold">
              <h3>Dernière certification vérifiée</h3>
              <?php if ($verified): ?>
                <div class="cfo-value"><?php echo esc_html($verified['title'] ?? '—'); ?></div>
                <div class="cfo-note"><?php echo esc_html(cfo_observatoire_v2_level_label($verified['current_level'] ?? '')); ?> · <?php echo esc_html($verified['certified_on'] ?? 'date indisponible'); ?> · <?php echo esc_html($verified['cockpit_readiness'] ?? ''); ?></div>
              <?php else: ?><div class="cfo-value">Indisponible</div><div class="cfo-note">Aucune certification exploitable reçue.</div><?php endif; ?>
            </div>
          </div>
        </section>

        <section class="cfo-section">
          <h2>Audiences · Mix · Followers</h2>
          <div class="cfo-grid">
            <div class="cfo-card cfo-span-3"><h3>Spotify · auditeurs mensuels</h3><div class="cfo-value"><?php echo cfo_observatoire_v2_fmt($spotify_listeners); ?></div></div>
            <div class="cfo-card cfo-span-3"><h3>Spotify · followers</h3><div class="cfo-value"><?php echo cfo_observatoire_v2_fmt($spotify_followers); ?></div></div>
            <div class="cfo-card cfo-span-3"><h3>YouTube · audience</h3><div class="cfo-value"><?php echo cfo_observatoire_v2_fmt($youtube); ?></div></div>
            <div class="cfo-card cfo-span-3"><h3>Instagram · followers</h3><div class="cfo-value"><?php echo cfo_observatoire_v2_fmt($instagram); ?></div><div class="cfo-note">TikTok : <?php echo cfo_observatoire_v2_fmt($tiktok); ?></div></div>
          </div>
        </section>

        <section class="cfo-section">
          <h2>Écoutes · Classements · Certifications</h2>
          <div class="cfo-grid">
            <div class="cfo-card cfo-span-8"><h3>Écoutes &amp; titres</h3><div class="cfo-empty">Les séries de titres et variations seront affichées ici dès qu’elles sont exposées par la vue cockpit. La structure est figée ; les valeurs restent indisponibles plutôt qu’estimées sans base.</div></div>
            <div class="cfo-card cfo-span-4"><h3>Classements</h3><div class="cfo-value">Indisponible</div><div class="cfo-note">SNEP / UTOP : connexion à la restitution détaillée à compléter.</div></div>
          </div>
        </section>

        <section class="cfo-section">
          <h2>Certifications vérifiées</h2>
          <div class="cfo-card cfo-span-12">
            <?php if ($certs): ?>
            <table class="cfo-table"><thead><tr><th>Titre</th><th>Format</th><th>Niveau</th><th>Date</th><th>Périmètre</th><th>Qualité</th></tr></thead><tbody>
            <?php foreach ($certs as $c): ?><tr><td><?php echo esc_html($c['title'] ?? '—'); ?></td><td><?php echo esc_html($c['format'] ?? '—'); ?></td><td><?php echo esc_html(cfo_observatoire_v2_level_label($c['current_level'] ?? '')); ?></td><td><?php echo esc_html($c['certified_on'] ?? '—'); ?></td><td><?php echo esc_html(($c['verified_recordings'] ?? 0) . ' enregistrement(s) vérifié(s)'); ?></td><td><?php echo esc_html($c['cockpit_readiness'] ?? '—'); ?></td></tr><?php endforeach; ?>
            </tbody></table>
            <?php else: ?><div class="cfo-empty">Aucune certification reçue depuis Supabase.</div><?php endif; ?>
          </div>
        </section>

        <section class="cfo-section">
          <h2>Écoutes globales Spotify · Airplay</h2>
          <div class="cfo-grid">
            <div class="cfo-card cfo-span-6"><h3>Spotify global</h3><div class="cfo-value">Indisponible</div><div class="cfo-note">Emplacement V1 figé pour la série temporelle Marine globale.</div></div>
            <div class="cfo-card cfo-span-6"><h3>Airplay</h3><div class="cfo-value">Indisponible</div><div class="cfo-note">Emplacement V1 figé pour plays, S-1, variation et marchés.</div></div>
          </div>
        </section>

        <section class="cfo-section">
          <h2>En cours</h2>
          <div class="cfo-grid">
            <div class="cfo-card cfo-span-6 cfo-primary"><h3>Single</h3><div class="cfo-value">TRICHEUR</div><div class="cfo-note">Suivi actif. Les indicateurs s’affichent uniquement lorsqu’ils sont qualifiés.</div></div>
            <div class="cfo-card cfo-span-6 cfo-gold"><h3>Album</h3><div class="cfo-value">DEMAIN</div><div class="cfo-note">Préparation. Le cockpit intégrera les données disponibles après sortie.</div></div>
          </div>
        </section>
      </div>
      <div class="cfo-foot">CFO Cockpit V1 · référence figée 13/09/2026 · données Supabase · aucune valeur fictive · shortcode public : <strong>[cfo_cockpit]</strong><?php echo $admin_preview ? ' · aperçu administrateur' : ''; ?></div>
    </div>
    <?php
    return ob_get_clean();
}
