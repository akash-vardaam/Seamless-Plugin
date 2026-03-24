<?php

namespace SeamlessAddon\Integrations\Elementor;

use SeamlessAddon\Services\MembershipService;
use function get_option;
use function sanitize_title;

/**
 * Elementor Integration Class
 * 
 * Manages Elementor widgets and dynamic tags registration.
 */
class ElementorIntegration
{
    /**
     * Membership service instance.
     *
     * @var MembershipService
     */
    private static $membership_service;

    /**
     * Constructor.
     *
     * @param MembershipService $membership_service Membership service instance.
     */
    public function __construct(MembershipService $membership_service)
    {
        self::$membership_service = $membership_service;

        $this->init_hooks();

        // Rewrite Rules support
        add_action('init', [$this, 'add_rewrite_rules']);
        add_filter('query_vars', [$this, 'add_query_vars']);
        add_action('template_redirect', [$this, 'setup_virtual_page_globals']);

        // Flush rewrite rules when template settings change
        add_action('update_option_seamless_addon_event_template_id', 'flush_rewrite_rules');
        add_action('update_option_seamless_addon_event_template_overrides', 'flush_rewrite_rules');
        add_action('update_option_seamless_addon_enable_single_event_template_override', 'flush_rewrite_rules');
    }

    /**
     * Initialize hooks.
     */
    private function init_hooks()
    {
        // Register widgets
        add_action('elementor/widgets/register', [$this, 'register_widgets']);

        // Register widget categories
        add_action('elementor/elements/categories_registered', [$this, 'register_widget_categories']);

        // Register dynamic tags
        add_action('elementor/dynamic_tags/register', [$this, 'register_dynamic_tags']);

        // Enqueue scripts
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_action('elementor/preview/enqueue_scripts', [$this, 'enqueue_scripts']);

        // Support Elementor templates for single event pages
        add_filter('template_include', [$this, 'elementor_template_override'], 999);

        add_filter('document_title_parts', [$this, 'filter_document_title_parts'], 20);
        add_filter('the_title', [$this, 'filter_the_title'], 20, 2);

        // AJAX handlers for User Dashboard
        add_action('wp_ajax_seamless_update_user_profile', [$this, 'ajax_update_user_profile']);
    }

    /**
     * Enqueue scripts and styles.
     */
    public function enqueue_scripts()
    {
        wp_enqueue_style(
            'seamless-addon-accordion',
            SEAMLESS_ADDON_PLUGIN_URL . 'assets/css/accordion.css',
            [],
            SEAMLESS_ADDON_VERSION
        );

        wp_enqueue_script(
            'seamless-addon-accordion',
            SEAMLESS_ADDON_PLUGIN_URL . 'assets/js/accordion.js',
            ['jquery'],
            SEAMLESS_ADDON_VERSION,
            true
        );

        // Enqueue User Dashboard widget assets from main plugin
        wp_enqueue_style(
            'seamless-user-dashboard',
            plugins_url('seamless-wordpress-plugin/src/Public/assets/css/user-dashboard.css'),
            [],
            SEAMLESS_ADDON_VERSION
        );

        wp_enqueue_script(
            'seamless-user-dashboard',
            plugins_url('seamless-wordpress-plugin/src/Public/assets/js/user-dashboard.js'),
            ['jquery'],
            SEAMLESS_ADDON_VERSION,
            true
        );

        // Localize script for AJAX
        wp_localize_script(
            'seamless-user-dashboard',
            'seamlessAddonData',
            [
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('seamless_user_dashboard_nonce'),
            ]
        );

        // Enqueue Memberships Widget Script
        wp_enqueue_script(
            'seamless-memberships-widget',
            SEAMLESS_ADDON_PLUGIN_URL . 'assets/js/memberships-widget.js',
            ['jquery'],
            SEAMLESS_ADDON_VERSION,
            true
        );

        // Enqueue Courses Widget Script
        wp_enqueue_script(
            'seamless-courses-widget',
            SEAMLESS_ADDON_PLUGIN_URL . 'assets/js/courses-widget.js',
            ['jquery'],
            SEAMLESS_ADDON_VERSION,
            true
        );
    }

    /**
     * Register widget categories.
     *
     * @param \Elementor\Elements_Manager $elements_manager Elements manager instance.
     */
    public function register_widget_categories($elements_manager)
    {
        $elements_manager->add_category(
            'seamless',
            [
                'title' => __('Seamless', 'seamless-addon'),
                'icon' => 'fa fa-plug',
            ]
        );
    }

    /**
     * Register widgets.
     *
     * @param \Elementor\Widgets_Manager $widgets_manager Widgets manager instance.
     */
    public function register_widgets($widgets_manager)
    {
        // Include existing widget files
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/Widgets/EventsListWidget.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/Widgets/MembershipsListWidget.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/Widgets/MembershipComparePlansWidget.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/Widgets/CoursesListWidget.php';

        // Include new event widget files
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/Widgets/EventTitleWidget.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/Widgets/EventExcerptWidget.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/Widgets/EventDescriptionWidget.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/Widgets/EventBreadcrumbsWidget.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/Widgets/EventAdditionalDetailsWidget.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/Widgets/EventLocationWidget.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/Widgets/EventSchedulesWidget.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/Widgets/EventTicketsWidget.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/Widgets/EventSidebarWidget.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/Widgets/EventFeaturedImageWidget.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/Widgets/EventRegisterURLWidget.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/Widgets/UserDashboardWidget.php';

        // Register existing widgets
        $widgets_manager->register(new \SeamlessAddon\Integrations\Elementor\Widgets\EventsListWidget());
        $widgets_manager->register(new \SeamlessAddon\Integrations\Elementor\Widgets\MembershipsListWidget());
        $widgets_manager->register(new \SeamlessAddon\Integrations\Elementor\Widgets\MembershipComparePlansWidget());
        $widgets_manager->register(new \SeamlessAddon\Integrations\Elementor\Widgets\CoursesListWidget());

        // Register new event widgets
        $widgets_manager->register(new \SeamlessAddon\Integrations\Elementor\Widgets\EventTitleWidget());
        $widgets_manager->register(new \SeamlessAddon\Integrations\Elementor\Widgets\EventExcerptWidget());
        $widgets_manager->register(new \SeamlessAddon\Integrations\Elementor\Widgets\EventDescriptionWidget());
        $widgets_manager->register(new \SeamlessAddon\Integrations\Elementor\Widgets\EventBreadcrumbsWidget());
        $widgets_manager->register(new \SeamlessAddon\Integrations\Elementor\Widgets\EventAdditionalDetailsWidget());
        $widgets_manager->register(new \SeamlessAddon\Integrations\Elementor\Widgets\EventLocationWidget());
        $widgets_manager->register(new \SeamlessAddon\Integrations\Elementor\Widgets\EventSchedulesWidget());
        $widgets_manager->register(new \SeamlessAddon\Integrations\Elementor\Widgets\EventTicketsWidget());
        $widgets_manager->register(new \SeamlessAddon\Integrations\Elementor\Widgets\EventSidebarWidget());
        $widgets_manager->register(new \SeamlessAddon\Integrations\Elementor\Widgets\EventFeaturedImageWidget());
        $widgets_manager->register(new \SeamlessAddon\Integrations\Elementor\Widgets\EventRegisterURLWidget());
        $widgets_manager->register(new \SeamlessAddon\Integrations\Elementor\Widgets\UserDashboardWidget());
    }

    /**
     * Register dynamic tags.
     *
     * @param \Elementor\Core\DynamicTags\Manager $dynamic_tags_manager Dynamic tags manager instance.
     */
    public function register_dynamic_tags($dynamic_tags_manager)
    {
        // Register Event Tags Group
        $dynamic_tags_manager->register_group(
            'seamless-events',
            [
                'title' => __('Seamless Events', 'seamless-addon')
            ]
        );

        // Register Membership Tags Group
        $dynamic_tags_manager->register_group(
            'seamless-memberships',
            [
                'title' => __('Seamless Memberships', 'seamless-addon')
            ]
        );

        // Register event dynamic tags
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/DynamicTags/EventTags/EventDataTrait.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/DynamicTags/EventTags/BaseEventTag.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/DynamicTags/EventTags/BaseEventDataTag.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/DynamicTags/EventTags/EventTitle.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/DynamicTags/EventTags/EventDescription.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/DynamicTags/EventTags/EventExcerpt.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/DynamicTags/EventTags/EventDates.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/DynamicTags/EventTags/EventLocation.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/DynamicTags/EventTags/EventImage.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/DynamicTags/EventTags/EventURL.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/DynamicTags/EventTags/EventRegisterURL.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/DynamicTags/EventTags/EventAdditionalImages.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/DynamicTags/EventTags/EventSponsors.php';

        $dynamic_tags_manager->register(new \SeamlessAddon\Integrations\Elementor\DynamicTags\EventTags\EventTitle());
        $dynamic_tags_manager->register(new \SeamlessAddon\Integrations\Elementor\DynamicTags\EventTags\EventDescription());
        $dynamic_tags_manager->register(new \SeamlessAddon\Integrations\Elementor\DynamicTags\EventTags\EventExcerpt());
        $dynamic_tags_manager->register(new \SeamlessAddon\Integrations\Elementor\DynamicTags\EventTags\EventDates());
        $dynamic_tags_manager->register(new \SeamlessAddon\Integrations\Elementor\DynamicTags\EventTags\EventLocation());
        $dynamic_tags_manager->register(new \SeamlessAddon\Integrations\Elementor\DynamicTags\EventTags\EventImage());
        $dynamic_tags_manager->register(new \SeamlessAddon\Integrations\Elementor\DynamicTags\EventTags\EventURL());
        $dynamic_tags_manager->register(new \SeamlessAddon\Integrations\Elementor\DynamicTags\EventTags\EventRegisterURL());
        $dynamic_tags_manager->register(new \SeamlessAddon\Integrations\Elementor\DynamicTags\EventTags\EventAdditionalImages());
        $dynamic_tags_manager->register(new \SeamlessAddon\Integrations\Elementor\DynamicTags\EventTags\EventSponsors());

        // Register membership dynamic tags
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/DynamicTags/MembershipTags/MembershipName.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/DynamicTags/MembershipTags/MembershipDescription.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/DynamicTags/MembershipTags/MembershipPrice.php';
        require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Integrations/Elementor/DynamicTags/MembershipTags/MembershipImage.php';

        $dynamic_tags_manager->register(new \SeamlessAddon\Integrations\Elementor\DynamicTags\MembershipTags\MembershipName());
        $dynamic_tags_manager->register(new \SeamlessAddon\Integrations\Elementor\DynamicTags\MembershipTags\MembershipDescription());
        $dynamic_tags_manager->register(new \SeamlessAddon\Integrations\Elementor\DynamicTags\MembershipTags\MembershipPrice());
        $dynamic_tags_manager->register(new \SeamlessAddon\Integrations\Elementor\DynamicTags\MembershipTags\MembershipImage());
    }

    /**
     * Get membership service instance.
     *
     * @return MembershipService
     */
    public static function get_membership_service()
    {
        return self::$membership_service;
    }


    /**
     * Add rewrite rules for events.
     * 
     * Note: This adds the seamless_event query var support alongside the main plugin's
     * seamless_page=single_event system. Both can coexist.
     */
    public function add_rewrite_rules()
    {
        if (!$this->is_single_event_template_override_enabled()) {
            return;
        }

        // Use the same endpoint as the main plugin
        $endpoint = get_option('seamless_single_event_endpoint', 'event');

        // Only add our rewrite rule if we have an Elementor template configured
        $has_template = absint(get_option('seamless_addon_event_template_id', 0)) > 0;
        $has_overrides = !empty(get_option('seamless_addon_event_template_overrides', []));

        if ($has_template || $has_overrides) {
            // Set both seamless_event (for our override) and seamless_page (for main plugin fallback)
            add_rewrite_rule(
                '^' . preg_quote($endpoint, '/') . '/([^/]+)/?$',
                'index.php?seamless_event=$matches[1]&seamless_page=single_event&event_uuid=$matches[1]',
                'top'
            );
        }
    }

    /**
     * Add query vars.
     */
    public function add_query_vars($vars)
    {
        $vars[] = 'seamless_event';
        $vars[] = 'seamless_page';
        $vars[] = 'event_uuid';
        return $vars;
    }

    /**
     * Setup global variables for virtual event pages.
     */
    public function setup_virtual_page_globals()
    {
        if (!$this->is_single_event_template_override_enabled()) {
            return;
        }

        if (!get_query_var('seamless_event')) {
            return;
        }

        $event_slug = sanitize_title(get_query_var('seamless_event'));
        $template_id = $this->resolve_event_template_id($event_slug);
        if (!$template_id) {
            return;
        }

        global $wp_query, $post;

        // Reset query flags to look like a single page
        $wp_query->is_404 = false;
        $wp_query->is_page = true;
        $wp_query->is_singular = true;
        $wp_query->is_home = false;
        $wp_query->is_archive = false;
        $wp_query->found_posts = 1;
        $wp_query->post_count = 1;
        $wp_query->max_num_pages = 1;

        $template_post = get_post($template_id);
        if ($template_post) {
            $wp_query->posts = [$template_post];
            $wp_query->post = $template_post;
            $wp_query->queried_object = $template_post;
            $wp_query->queried_object_id = $template_id;
            $post = $template_post;
        }
    }

    /**
     * Override template for single event pages when using Elementor.
     * 
     * Priority:
     * 1. Event-specific Elementor template (if configured)
     * 2. Base Elementor template (if configured)
     * 3. Returns template unchanged (main plugin handles it via seamless_page query var)
     *
     * @param string $template The path of the template to include.
     * @return string Modified template path.
     */
    public function elementor_template_override($template)
    {
        if (!$this->is_single_event_template_override_enabled()) {
            return $template;
        }

        // Check if this is a single event page (addon's query var)
        if (!get_query_var('seamless_event')) {
            return $template;
        }

        $event_slug = sanitize_title(get_query_var('seamless_event'));
        $template_id = $this->resolve_event_template_id($event_slug);

        // If no Elementor template is configured, return unchanged
        // The main plugin will have already set the template via seamless_page=single_event
        if (!$template_id) {
            return $template;
        }

        if (!did_action('elementor/loaded')) {
            return $template;
        }

        // Check the template's page template setting
        $page_template_slug = get_post_meta($template_id, '_wp_page_template', true);

        if ('elementor_canvas' === $page_template_slug) {
            return ELEMENTOR_PATH . 'modules/page-templates/templates/canvas.php';
        }

        if ('elementor_header_footer' === $page_template_slug) {
            return ELEMENTOR_PATH . 'modules/page-templates/templates/header-footer.php';
        }

        // Default to logic that mimics a standard page so headers/footers work
        $new_template = locate_template(['page.php', 'single.php', 'index.php']);
        if ($new_template) {
            return $new_template;
        }

        return $template;
    }

    public function filter_document_title_parts($title_parts)
    {
        if (is_admin() || !get_query_var('seamless_event')) {
            return $title_parts;
        }

        // Get event slug from query var
        $event_slug = sanitize_title(get_query_var('seamless_event'));
        if (empty($event_slug)) {
            return $title_parts;
        }

        // Fetch event data from API using WordPress HTTP API
        $client_domain = get_option('seamless_client_domain', '');
        if (empty($client_domain)) {
            return $title_parts;
        }

        $api_url = rtrim($client_domain, '/') . '/api/events/' . $event_slug;
        $response = wp_remote_get($api_url, [
            'timeout' => 10,
            'headers' => [
                'Accept' => 'application/json',
            ],
        ]);

        if (is_wp_error($response)) {
            return $title_parts;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (!empty($data['success']) && !empty($data['data']['title'])) {
            $title_parts['title'] = $data['data']['title'];
        }

        return $title_parts;
    }

    public function filter_the_title($title, $post_id)
    {
        if (is_admin() || !get_query_var('seamless_event')) {
            return $title;
        }

        if (get_post_type($post_id) !== 'elementor_library') {
            return $title;
        }

        if (!in_the_loop() || !is_main_query()) {
            return $title;
        }

        // Get event slug from query var
        $event_slug = sanitize_title(get_query_var('seamless_event'));
        if (empty($event_slug)) {
            return $title;
        }

        // Fetch event data from API
        $client_domain = get_option('seamless_client_domain', '');
        if (empty($client_domain)) {
            return $title;
        }

        $api_url = rtrim($client_domain, '/') . '/api/events/' . $event_slug;
        $response = wp_remote_get($api_url, [
            'timeout' => 10,
            'headers' => [
                'Accept' => 'application/json',
            ],
        ]);

        if (is_wp_error($response)) {
            return $title;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (!empty($data['success']) && !empty($data['data']['title'])) {
            return $data['data']['title'];
        }

        return $title;
    }

    /**
     * Resolve Elementor template ID for current event.
     *
     * Priority:
     * 1. Event-specific override (by event slug).
     * 2. Global/base event template.
     * 3. No template (fallback to theme behavior).
     *
     * @param string $event_slug Event slug.
     * @return int Template post ID or 0 when none resolved.
     */
    private function resolve_event_template_id($event_slug = '')
    {
        $event_slug = $event_slug ? sanitize_title($event_slug) : '';

        // 1) Event-level overrides
        if ($event_slug) {
            $overrides = get_option('seamless_addon_event_template_overrides', []);

            if (is_array($overrides) && !empty($overrides)) {
                foreach ($overrides as $row) {
                    if (!is_array($row)) {
                        continue;
                    }

                    if (empty($row['event_slug'])) {
                        continue;
                    }

                    $row_slug = sanitize_title($row['event_slug']);
                    if ($row_slug !== $event_slug) {
                        continue;
                    }

                    $template_id = isset($row['template_id']) ? absint($row['template_id']) : 0;

                    if ($template_id > 0 && 'elementor_library' === get_post_type($template_id)) {
                        return $template_id;
                    }
                }
            }
        }

        // 2) Global/base event template
        $template_id = absint(get_option('seamless_addon_event_template_id', 0));
        if ($template_id > 0 && 'elementor_library' === get_post_type($template_id)) {
            return $template_id;
        }

        // 3) No template resolved
        return 0;
    }

    /**
     * Enable/disable Elementor takeover for single-event pages.
     *
     * Default is disabled so main plugin React renderer is used.
     * Site owners can enable explicitly via option or filter.
     */
    private function is_single_event_template_override_enabled(): bool
    {
        $enabled = get_option('seamless_addon_enable_single_event_template_override', 'no') === 'yes';
        return (bool) apply_filters('seamless_addon_enable_single_event_template_override', $enabled);
    }

    /**
     * AJAX handler for updating user profile
     */
    public function ajax_update_user_profile()
    {
        // Verify nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'seamless_user_dashboard_nonce')) {
            wp_send_json_error('Invalid security token.');
            return;
        }

        // Check if user is logged in
        if (!is_user_logged_in()) {
            wp_send_json_error('You must be logged in to update your profile.');
            return;
        }

        // Get profile data
        $profile_data = isset($_POST['profile_data']) ? $_POST['profile_data'] : [];
        if (empty($profile_data) || !is_array($profile_data)) {
            wp_send_json_error('Invalid profile data.');
            return;
        }

        $email = isset($profile_data['email']) ? sanitize_email($profile_data['email']) : '';
        if (empty($email)) {
            wp_send_json_error('Email is required.');
            return;
        }

        // Use UserProfile operations class from main plugin
        $user_profile = new \Seamless\Operations\UserProfile();

        $result = $user_profile->update_user_profile($email, $profile_data);

        if ($result['success']) {
            wp_send_json_success([
                'message' => $result['message'] ?? 'Profile updated successfully!',
                'data' => $result['data'] ?? []
            ]);
        } else {
            wp_send_json_error($result['message'] ?? 'Failed to update profile.');
        }
    }
}
