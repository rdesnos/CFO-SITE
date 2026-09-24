<?php
/**
 * Plugin Name: CFO Agenda
 * Description: Agenda multi-vues CFO (année, trimestre, mois, semaine) alimenté par Supabase.
 * Version: 1.0.0
 * Author: CFO
 */

if (!defined('ABSPATH')) exit;

final class CFO_Agenda_Plugin {
    const VERSION = '1.0.0';
    const SUPABASE_URL = 'https://fjpcuxsezeuajhlotzij.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_VTwtMvGk29IDrz__M99Yag_TYrLzTRG';

    public function __construct() {
        add_shortcode('cfo_agenda', [$this, 'shortcode']);
        add_action('wp_enqueue_scripts', [$this, 'register_assets']);
    }

    public function register_assets() {
        wp_register_style(
            'cfo-agenda',
            plugins_url('assets/cfo-agenda.css', __FILE__),
            [],
            self::VERSION
        );
        wp_register_script(
            'cfo-agenda',
            plugins_url('assets/cfo-agenda.js', __FILE__),
            [],
            self::VERSION,
            true
        );
    }

    public function shortcode($atts = []) {
        $atts = shortcode_atts([
            'artist' => 'marine',
            'view' => 'year',
            'types' => '',
            'title' => 'Agenda',
        ], $atts, 'cfo_agenda');

        $artist = sanitize_key($atts['artist']);
        $view = in_array($atts['view'], ['year','quarter','month','week'], true) ? $atts['view'] : 'year';
        $types = array_values(array_filter(array_map('sanitize_key', explode(',', (string)$atts['types']))));
        $id = 'cfo-agenda-' . wp_generate_uuid4();

        wp_enqueue_style('cfo-agenda');
        wp_enqueue_script('cfo-agenda');

        wp_localize_script('cfo-agenda', 'CFOAgendaConfig', [
            'supabaseUrl' => self::SUPABASE_URL,
            'supabaseKey' => self::SUPABASE_KEY,
            'locale' => 'fr-FR',
        ]);

        ob_start(); ?>
        <section
            id="<?php echo esc_attr($id); ?>"
            class="cfo-agenda"
            data-cfo-agenda
            data-artist="<?php echo esc_attr($artist); ?>"
            data-view="<?php echo esc_attr($view); ?>"
            data-types="<?php echo esc_attr(implode(',', $types)); ?>"
        >
            <div class="cfo-agenda__head">
                <div>
                    <span class="cfo-agenda__eyebrow">CFO · Agenda</span>
                    <h2 class="cfo-agenda__title"><?php echo esc_html($atts['title']); ?></h2>
                </div>
                <div class="cfo-agenda__view-switch" role="group" aria-label="Vue agenda">
                    <button type="button" data-view="year">Année</button>
                    <button type="button" data-view="quarter">Trimestre</button>
                    <button type="button" data-view="month">Mois</button>
                    <button type="button" data-view="week">Semaine</button>
                </div>
            </div>

            <div class="cfo-agenda__toolbar">
                <div class="cfo-agenda__nav">
                    <button type="button" data-action="prev" aria-label="Période précédente">←</button>
                    <button type="button" data-action="today">Aujourd’hui</button>
                    <button type="button" data-action="next" aria-label="Période suivante">→</button>
                </div>
                <strong class="cfo-agenda__period" data-period>—</strong>
                <div class="cfo-agenda__filters">
                    <button type="button" data-filter="all" class="is-active">Tout</button>
                    <button type="button" data-filter="concert">Concert</button>
                    <button type="button" data-filter="media">Média</button>
                    <button type="button" data-filter="presse">Presse</button>
                    <button type="button" data-filter="tele">Télé</button>
                </div>
            </div>

            <div class="cfo-agenda__status" data-status>Chargement de l’agenda…</div>
            <div class="cfo-agenda__canvas" data-canvas aria-live="polite"></div>
            <div class="cfo-agenda__legend">
                <span><i class="type-concert"></i>Concert</span>
                <span><i class="type-media"></i>Média</span>
                <span><i class="type-presse"></i>Presse</span>
                <span><i class="type-tele"></i>Télé</span>
                <span class="cfo-agenda__verified">● Donnée CFO vérifiée</span>
            </div>
        </section>
        <?php
        return ob_get_clean();
    }
}

new CFO_Agenda_Plugin();
