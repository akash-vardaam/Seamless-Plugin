<?php

namespace SeamlessAddon\Admin;

use SeamlessAddon\Services\CacheService;
use SeamlessAddon\Services\EventService;

/**
 * Settings Page Class
 * 
 * Admin settings page for the plugin.
 */
class SettingsPage
{
    /**
     * Cache service instance.
     *
     * @var CacheService
     */
    private $cache_service;

    /**
     * Constructor.
     *
     * @param CacheService $cache_service Cache service instance.
     */
    public function __construct(CacheService $cache_service)
    {
        $this->cache_service = $cache_service;

        // Hook into Seamless plugin settings
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_post_seamless_addon_clear_cache', [$this, 'handle_clear_cache']);

        // Add addon tab to Seamless settings
        add_filter('seamless_settings_tabs', [$this, 'add_addon_tab'], 20);
        add_action('seamless_settings_tab_content_addon', [$this, 'render_addon_tab_content']);
    }

    /**
     * Add addon tab to Seamless settings.
     *
     * @param array $tabs Existing tabs.
     * @return array Modified tabs.
     */
    public function add_addon_tab($tabs)
    {
        $tabs['addon'] = [
            'label' => __('Addon Settings', 'seamless-addon'),
            'icon' => 'dashicons-admin-plugins'
        ];
        return $tabs;
    }

    /**
     * Render addon tab content.
     */
    public function render_addon_tab_content()
    {
?>
        <?php $this->render_settings_page(); ?>
    <?php
    }

    /**
     * Register settings.
     */
    public function register_settings()
    {
        register_setting('seamless_addon_settings', 'seamless_addon_cache_duration', [
            'type' => 'integer',
            'default' => 1800,
            'sanitize_callback' => 'absint'
        ]);

        register_setting('seamless_addon_settings', 'seamless_addon_debug_mode', [
            'type' => 'boolean',
            'default' => false,
            'sanitize_callback' => 'rest_sanitize_boolean'
        ]);

        register_setting('seamless_addon_settings', 'seamless_addon_event_template_id', [
            'type' => 'integer',
            'default' => 0,
            'sanitize_callback' => 'absint'
        ]);

        register_setting('seamless_addon_settings', 'seamless_addon_event_template_overrides', [
            'type' => 'array',
            'default' => [],
            'sanitize_callback' => [$this, 'sanitize_event_template_overrides']
        ]);

        // General Settings Section
        add_settings_section(
            'seamless_addon_general',
            __('', 'seamless-addon'),
            [$this, 'render_general_section'],
            'seamless-addon-settings'
        );

        // Cache Duration Field
        // add_settings_field(
        //     'seamless_addon_cache_duration',
        //     __('Cache Duration (seconds)', 'seamless-addon'),
        //     [$this, 'render_cache_duration_field'],
        //     'seamless-addon-settings',
        //     'seamless_addon_general'
        // );

        // Debug Mode Field
        add_settings_field(
            'seamless_addon_debug_mode',
            __('Debug Mode', 'seamless-addon'),
            [$this, 'render_debug_mode_field'],
            'seamless-addon-settings',
            'seamless_addon_general'
        );

        // Event Template Field
        add_settings_field(
            'seamless_addon_event_template_id',
            __('Single Event Template', 'seamless-addon'),
            [$this, 'render_event_template_field'],
            'seamless-addon-settings',
            'seamless_addon_general'
        );

        add_settings_field(
            'seamless_addon_event_template_overrides',
            __('Event-specific Templates', 'seamless-addon'),
            [$this, 'render_event_template_overrides_field'],
            'seamless-addon-settings',
            'seamless_addon_general'
        );
    }

    /**
     * Render settings page.
     */
    public function render_settings_page()
    {
        if (!current_user_can('manage_options')) {
            return;
        }

        // Enqueue Addon Admin JS
        wp_enqueue_script(
            'seamless-addon-admin-js',
            plugin_dir_url(dirname(__DIR__)) . 'assets/js/seamless-addon-admin.js',
            ['jquery', 'seamless-api-client-js'],
            filemtime(dirname(dirname(__DIR__)) . '/assets/js/seamless-addon-admin.js'),
            true
        );
    ?>
        <div class="wrap">
            <form action="options.php" method="post">
                <input type="hidden" name="_seamless_return_tab" value="addon">
                <?php
                settings_fields('seamless_addon_settings');
                do_settings_sections('seamless-addon-settings');
                submit_button(__('Save Addon Settings', 'seamless-addon'));
                ?>
            </form>
        </div>
    <?php
    }

    /**
     * Render general section description.
     */
    public function render_general_section()
    {
        echo '<p>' . __('Configure Addon settings.', 'seamless-addon') . '</p>';
    }

    /**
     * Render cache duration field.
     */
    public function render_cache_duration_field()
    {
        $value = get_option('seamless_addon_cache_duration', 1800);
    ?>
        <input type="number"
            name="seamless_addon_cache_duration"
            value="<?php echo esc_attr($value); ?>"
            min="0"
            step="60"
            class="regular-text">
        <p class="description">
            <?php _e('Default: 1800 seconds (30 minutes). Set to 0 to disable caching.', 'seamless-addon'); ?>
        </p>
    <?php
    }

    /**
     * Render debug mode field.
     */
    public function render_debug_mode_field()
    {
        $value = get_option('seamless_addon_debug_mode', false);
    ?>
        <label>
            <input type="checkbox"
                name="seamless_addon_debug_mode"
                value="1"
                <?php checked($value, true); ?>>
            <?php _e('Enable debug logging', 'seamless-addon'); ?>
        </label>
        <p class="description">
            <?php _e('Enable detailed logging for troubleshooting. Requires WP_DEBUG to be enabled.', 'seamless-addon'); ?>
        </p>
    <?php
    }

    /**
     * Render event template field.
     */
    public function render_event_template_field()
    {
        $value = get_option('seamless_addon_event_template_id', 0);

        // Get all Elementor library templates
        $elementor_templates = get_posts([
            'post_type' => 'elementor_library',
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC'
        ]);
    ?>
        <select name="seamless_addon_event_template_id" class="regular-text">
            <option value="0"><?php _e('None (Use default template)', 'seamless-addon'); ?></option>
            <?php foreach ($elementor_templates as $template): ?>
                <option value="<?php echo esc_attr($template->ID); ?>" <?php selected($value, $template->ID); ?>>
                    <?php echo esc_html($template->post_title); ?>
                </option>
            <?php endforeach; ?>
        </select>
        <p class="description">
            <?php _e('Select an Elementor template (from Templates → Saved Templates) to use for all single event pages. The template should be built with Elementor and contain event widgets.', 'seamless-addon'); ?>
            <br>
            <strong><?php _e('How it works:', 'seamless-addon'); ?></strong> <?php _e('Go to Settings → Permalinks → Save Changes. When someone visits a single event URL, this template will be used to display the event.', 'seamless-addon'); ?>
        </p>
    <?php
    }

    public function render_event_template_overrides_field()
    {
        $overrides = get_option('seamless_addon_event_template_overrides', []);
        if (!is_array($overrides)) {
            $overrides = [];
        }

        // Build event options from Seamless Events API
        // Fetching moved to client-side (seamless-addon-admin.js)
        $event_options = [];

        $elementor_templates = get_posts([
            'post_type' => 'elementor_library',
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC'
        ]);

        // Only add one empty row if there are no overrides
        $rows = $overrides;
        if (empty($rows)) {
            $rows[] = [
                'event_slug' => '',
                'template_id' => 0,
            ];
        }
    ?>
        <div class="seamless-addon-event-templates-wrapper">
            <table class="widefat striped seamless-addon-event-templates-table">
                <thead>
                    <tr>
                        <th><?php _e('Event', 'seamless-addon'); ?></th>
                        <th><?php _e('Elementor Template', 'seamless-addon'); ?></th>
                        <th style="width: 60px;"><?php _e('Actions', 'seamless-addon'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($rows as $index => $row):
                        $event_slug = isset($row['event_slug']) ? $row['event_slug'] : '';
                        $template_id = isset($row['template_id']) ? (int) $row['template_id'] : 0;
                    ?>
                        <tr class="seamless-addon-template-row">
                            <td>
                                <select name="seamless_addon_event_template_overrides[<?php echo esc_attr($index); ?>][event_slug]" class="regular-text seamless-event-select">
                                    <option value=""><?php _e('Select event', 'seamless-addon'); ?></option>
                                    <?php if ($event_slug): ?>
                                        <option value="<?php echo esc_attr($event_slug); ?>" selected>
                                            <?php echo esc_html($event_slug); ?> (Saved)
                                        </option>
                                    <?php endif; ?>
                                </select>
                            </td>
                            <td>
                                <select name="seamless_addon_event_template_overrides[<?php echo esc_attr($index); ?>][template_id]" class="regular-text">
                                    <option value="0"><?php _e('None', 'seamless-addon'); ?></option>
                                    <?php foreach ($elementor_templates as $template): ?>
                                        <option value="<?php echo esc_attr($template->ID); ?>" <?php selected($template_id, $template->ID); ?>>
                                            <?php echo esc_html($template->post_title); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </td>
                            <td class="seamless-addon-template-actions">
                                <button type="button" class="button seamless-addon-add-row" title="<?php esc_attr_e('Add row', 'seamless-addon'); ?>">
                                    <span class="dashicons dashicons-plus-alt2"></span>
                                </button>
                                <button type="button" class="button seamless-addon-remove-row" title="<?php esc_attr_e('Remove row', 'seamless-addon'); ?>">
                                    <span class="dashicons dashicons-minus"></span>
                                </button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <p class="description">
            <?php _e('Assign specific Elementor templates to individual events. If an event has a matching slug here, its template will override the base event template.', 'seamless-addon'); ?>
        </p>

        <!-- Hidden template row for cloning -->
        <table style="display: none;">
            <tbody>
                <tr class="seamless-addon-template-row-template">
                    <td>
                        <select name="seamless_addon_event_template_overrides[__INDEX__][event_slug]" class="regular-text seamless-event-select">
                            <option value=""><?php _e('Select event', 'seamless-addon'); ?></option>
                        </select>
                    </td>
                    <td>
                        <select name="seamless_addon_event_template_overrides[__INDEX__][template_id]" class="regular-text">
                            <option value="0"><?php _e('None', 'seamless-addon'); ?></option>
                            <?php foreach ($elementor_templates as $template): ?>
                                <option value="<?php echo esc_attr($template->ID); ?>">
                                    <?php echo esc_html($template->post_title); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </td>
                    <td class="seamless-addon-template-actions">
                        <button type="button" class="button seamless-addon-add-row" title="<?php esc_attr_e('Add row', 'seamless-addon'); ?>">
                            <span class="dashicons dashicons-plus-alt2"></span>
                        </button>
                        <button type="button" class="button seamless-addon-remove-row" title="<?php esc_attr_e('Remove row', 'seamless-addon'); ?>">
                            <span class="dashicons dashicons-minus"></span>
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>

        <style>
            .seamless-addon-event-templates-wrapper {
                max-width: 800px;
            }

            .seamless-addon-event-templates-table {
                margin-top: 8px;
                border-radius: 12px;
                border-color: var(--seamless-medium-border-color, #e5e5e5);
                overflow: hidden;
            }

            .seamless-addon-event-templates-table thead tr {
                background-color: var(--seamless-light-background-color, #f8fafc);
            }

            .seamless-addon-event-templates-table th {
                padding: 10px 12px;
                font-weight: 600;
                color: var(--seamless-dark-text-color, #111);
                border-bottom: 1px solid var(--seamless-medium-border-color, #e5e5e5);
            }

            .seamless-addon-event-templates-table td {
                padding: 10px 12px;
                vertical-align: middle;
            }

            .seamless-addon-event-templates-table select.regular-text,
            .form-table select.regular-text {
                /* width: 100%; */
                max-width: 100%;
                border-radius: 8px;
            }

            .seamless-addon-template-actions {
                text-align: center;
            }

            .seamless-addon-remove-row {
                padding: 4px 8px;
                min-width: auto;
                height: auto;
                line-height: 1;
            }

            .seamless-addon-remove-row .dashicons {
                font-size: 16px;
                width: 16px;
                height: 16px;
            }

            .seamless-addon-add-row {
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }

            td.seamless-addon-template-actions {
                display: flex;
                align-items: center;
                margin: 0;
                justify-content: flex-start;
                gap: 15px;
            }

            .seamless-addon-template-row .seamless-addon-template-actions button {
                font-size: 10px !important;
                padding: 6px !important;
                border-radius: 50% !important;
                color: #6c757d;
            }

            .seamless-addon-template-row .seamless-addon-template-actions button:focus {
                outline: none;
                box-shadow: none;
            }

            .seamless-addon-template-row .seamless-addon-template-actions button.seamless-addon-add-row:hover,
            .seamless-addon-template-row .seamless-addon-template-actions button.seamless-addon-add-row:focus {
                color: #6c5ce7;
            }

            .seamless-addon-template-row .seamless-addon-template-actions button.seamless-addon-remove-row:hover {
                color: #ff4757;
            }
        </style>
<?php
    }

    public function sanitize_event_template_overrides($input)
    {
        if (!is_array($input)) {
            return [];
        }

        $sanitized = [];

        foreach ($input as $row) {
            if (!is_array($row)) {
                continue;
            }

            $event_slug = isset($row['event_slug']) ? sanitize_title($row['event_slug']) : '';
            $template_id = isset($row['template_id']) ? absint($row['template_id']) : 0;

            if ('' === $event_slug || $template_id <= 0) {
                continue;
            }

            $sanitized[] = [
                'event_slug' => $event_slug,
                'template_id' => $template_id,
            ];
        }

        return $sanitized;
    }

    /**
     * Handle clear cache action.
     */
    public function handle_clear_cache()
    {
        if (!current_user_can('manage_options')) {
            wp_die(__('Unauthorized access', 'seamless-addon'));
        }

        check_admin_referer('seamless_addon_clear_cache', 'seamless_addon_nonce');

        $this->cache_service->clear_all();

        wp_redirect(admin_url('admin.php?page=seamless&tab=addon&seamless_addon_cache_cleared=1'));
        exit;
    }
}
