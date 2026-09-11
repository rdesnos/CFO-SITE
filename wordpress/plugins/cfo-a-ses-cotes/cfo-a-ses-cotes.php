<?php
/**
 * Plugin Name: CFO — À ses côtés
 * Description: Annuaire éditorial et agrégateur social des passionnés qui accompagnent Marine.
 * Version: 0.1.0
 * Author: CFO
 */

if (!defined('ABSPATH')) exit;

final class CFO_A_Ses_Cotes {
    const VERSION = '0.1.0';
    const POST_TYPE = 'cfo_aux_cotes';

    public function __construct() {
        add_action('init', [$this, 'register_post_type']);
        add_action('add_meta_boxes', [$this, 'add_meta_boxes']);
        add_action('save_post_' . self::POST_TYPE, [$this, 'save_meta']);
        add_shortcode('cfo_a_ses_cotes', [$this, 'shortcode']);
    }

    public function register_post_type() {
        register_post_type(self::POST_TYPE, [
            'labels' => [
                'name' => 'À ses côtés',
                'singular_name' => 'À ses côtés',
                'add_new_item' => 'Ajouter une présence',
                'edit_item' => 'Modifier la présence',
            ],
            'public' => true,
            'show_in_rest' => true,
            'menu_icon' => 'dashicons-groups',
            'supports' => ['title', 'editor', 'thumbnail', 'excerpt'],
            'rewrite' => ['slug' => 'a-ses-cotes'],
        ]);
    }

    public function add_meta_boxes() {
        add_meta_box('cfo_asc_identity', 'À ses côtés — identité & réseaux', [$this, 'meta_box'], self::POST_TYPE, 'normal', 'high');
    }

    public function meta_box($post) {
        wp_nonce_field('cfo_asc_save', 'cfo_asc_nonce');
        $people = get_post_meta($post->ID, '_cfo_asc_people', true);
        $instagram = get_post_meta($post->ID, '_cfo_asc_instagram', true);
        $tiktok = get_post_meta($post->ID, '_cfo_asc_tiktok', true);
        $youtube = get_post_meta($post->ID, '_cfo_asc_youtube', true);
        $x = get_post_meta($post->ID, '_cfo_asc_x', true);
        echo '<p><label><strong>Personnes / signature</strong></label><br><input style="width:100%" name="cfo_asc_people" value="'.esc_attr($people).'" placeholder="Cynthia & Géraldine"></p>';
        foreach (['instagram'=>$instagram,'tiktok'=>$tiktok,'youtube'=>$youtube,'x'=>$x] as $network=>$value) {
            echo '<p><label><strong>'.esc_html(ucfirst($network)).'</strong></label><br><input type="url" style="width:100%" name="cfo_asc_'.$network.'" value="'.esc_attr($value).'" placeholder="https://"></p>';
        }
        echo '<p>Le texte principal de la fiche se rédige dans l’éditeur WordPress. L’agrégateur affiche au maximum les 10 publications les plus récentes disponibles pour cette présence.</p>';
    }

    public function save_meta($post_id) {
        if (!isset($_POST['cfo_asc_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['cfo_asc_nonce'])), 'cfo_asc_save')) return;
        if (!current_user_can('edit_post', $post_id)) return;
        $map = ['people'=>'sanitize_text_field','instagram'=>'esc_url_raw','tiktok'=>'esc_url_raw','youtube'=>'esc_url_raw','x'=>'esc_url_raw'];
        foreach ($map as $key=>$sanitize) {
            if (isset($_POST['cfo_asc_'.$key])) update_post_meta($post_id, '_cfo_asc_'.$key, call_user_func($sanitize, wp_unslash($_POST['cfo_asc_'.$key])));
        }
    }

    private function social_links($post_id) {
        $labels = ['instagram'=>'Instagram','tiktok'=>'TikTok','youtube'=>'YouTube','x'=>'X'];
        $out = [];
        foreach ($labels as $key=>$label) {
            $url = get_post_meta($post_id, '_cfo_asc_'.$key, true);
            if ($url) $out[] = '<a class="cfo-asc-social" target="_blank" rel="noopener noreferrer" href="'.esc_url($url).'">'.esc_html($label).'</a>';
        }
        return implode(' ', $out);
    }

    private function posts_for($post_id) {
        // Data contract: cfo_a_ses_cotes_posts can be fed by Supabase sync.
        // Each item: network, url, published_at, text, media_url.
        $items = apply_filters('cfo_a_ses_cotes_posts', [], $post_id, 10);
        if (!is_array($items)) return [];
        usort($items, fn($a,$b) => strcmp($b['published_at'] ?? '', $a['published_at'] ?? ''));
        return array_slice($items, 0, 10);
    }

    private function render_entry($post) {
        $people = get_post_meta($post->ID, '_cfo_asc_people', true);
        $items = $this->posts_for($post->ID);
        ob_start(); ?>
        <article class="cfo-asc-entry">
            <header class="cfo-asc-header">
                <p class="cfo-asc-kicker">À ses côtés</p>
                <h2><?php echo esc_html(get_the_title($post)); ?></h2>
                <?php if ($people): ?><p class="cfo-asc-people"><?php echo esc_html($people); ?></p><?php endif; ?>
                <div class="cfo-asc-intro"><?php echo apply_filters('the_content', $post->post_content); ?></div>
                <nav class="cfo-asc-socials"><?php echo $this->social_links($post->ID); ?></nav>
            </header>
            <section class="cfo-asc-feed" aria-label="10 dernières publications">
                <h3>Leurs 10 dernières publications</h3>
                <?php if (!$items): ?>
                    <p class="cfo-asc-empty">Les publications seront affichées ici dès que les réseaux de cette présence seront connectés à l’agrégateur.</p>
                <?php else: foreach ($items as $item): ?>
                    <a class="cfo-asc-post" href="<?php echo esc_url($item['url'] ?? '#'); ?>" target="_blank" rel="noopener noreferrer">
                        <?php if (!empty($item['media_url'])): ?><img loading="lazy" src="<?php echo esc_url($item['media_url']); ?>" alt=""><?php endif; ?>
                        <div><span><?php echo esc_html($item['network'] ?? 'Réseau social'); ?></span>
                        <p><?php echo esc_html(wp_trim_words($item['text'] ?? '', 28)); ?></p>
                        <?php if (!empty($item['published_at'])): ?><time><?php echo esc_html(wp_date('j F Y', strtotime($item['published_at']))); ?></time><?php endif; ?></div>
                    </a>
                <?php endforeach; endif; ?>
            </section>
        </article><?php
        return ob_get_clean();
    }

    public function shortcode($atts) {
        $atts = shortcode_atts(['slug'=>''], $atts, 'cfo_a_ses_cotes');
        if ($atts['slug']) {
            $post = get_page_by_path(sanitize_title($atts['slug']), OBJECT, self::POST_TYPE);
            return $post ? $this->render_entry($post) : '';
        }
        $posts = get_posts(['post_type'=>self::POST_TYPE,'post_status'=>'publish','numberposts'=>-1,'orderby'=>'menu_order date','order'=>'ASC']);
        return implode('', array_map([$this,'render_entry'], $posts));
    }
}

new CFO_A_Ses_Cotes();
