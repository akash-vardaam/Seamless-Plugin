<?php

namespace SeamlessAddon\Core;

use SeamlessAddon\Services\MembershipService;
use SeamlessAddon\Services\CacheService;
use SeamlessAddon\Integrations\Elementor\ElementorIntegration;
use SeamlessAddon\Admin\SettingsPage;

/**
 * Main Plugin Class
 * 
 * Orchestrates all plugin components and manages plugin lifecycle.
 */
class Plugin
{
    /**
     * Plugin instance.
     *
     * @var Plugin
     */
    private static $instance = null;

    /**
     * Dependency checker instance.
     *
     * @var DependencyChecker
     */
    private $dependency_checker;

    /**
     * Membership service instance.
     *
     * @var MembershipService
     */
    private $membership_service;

    /**
     * Cache service instance.
     *
     * @var CacheService
     */
    private $cache_service;

    /**
     * Get plugin instance (Singleton pattern).
     *
     * @return Plugin
     */
    public static function get_instance()
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor.
     */
    private function __construct()
    {
        $this->dependency_checker = new DependencyChecker();

        // Check dependencies before initializing
        if (!$this->dependency_checker->check()) {
            add_action('admin_notices', [$this, 'show_dependency_notice']);
            return; // Stop initialization if dependencies not met
        }

        $this->init_services();
        $this->init_hooks();
    }

    /**
     * Show dependency notice in admin.
     */
    public function show_dependency_notice()
    {
        $message = $this->dependency_checker->get_error_message();

        printf(
            '<div class="notice notice-error"><p><strong>%s:</strong> %s</p></div>',
            esc_html__('Seamless Addon', 'seamless-addon'),
            wp_kses_post($message)
        );
    }

    /**
     * Initialize services.
     */
    private function init_services()
    {
        $this->cache_service = new CacheService();
        $this->membership_service = new MembershipService($this->cache_service);
    }

    /**
     * Initialize WordPress hooks.
     */
    private function init_hooks()
    {
        // Initialize Elementor integration
        add_action('elementor/init', [$this, 'init_elementor_integration']);

        // Initialize admin components
        if (is_admin()) {
            new SettingsPage($this->cache_service);
        }

        // Enqueue assets
        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);
        add_action('elementor/editor/before_enqueue_scripts', [$this, 'enqueue_editor_assets']);

        // Fix ES6 module script loading
        add_filter('script_loader_tag', [$this, 'add_module_type_to_scripts'], 10, 3);
    }

    /**
     * Initialize Elementor integration.
     */
    public function init_elementor_integration()
    {
        new ElementorIntegration($this->membership_service);
    }

    /**
     * Enqueue frontend assets.
     */
    public function enqueue_frontend_assets()
    {
        // Enqueue events widget styles
        wp_enqueue_style(
            'seamless-addon-events',
            SEAMLESS_ADDON_PLUGIN_URL . 'assets/css/events-widget.css',
            [],
            SEAMLESS_ADDON_VERSION
        );

        // Enqueue memberships widget styles
        wp_enqueue_style(
            'seamless-addon-memberships',
            SEAMLESS_ADDON_PLUGIN_URL . 'assets/css/memberships-widget.css',
            [],
            SEAMLESS_ADDON_VERSION
        );

        // Enqueue events widget scripts
        wp_enqueue_script(
            'seamless-addon-events',
            SEAMLESS_ADDON_PLUGIN_URL . 'assets/js/events-widget.js',
            ['jquery'],
            SEAMLESS_ADDON_VERSION,
            true
        );

        // Localize script for AJAX
        wp_localize_script('seamless-addon-events', 'seamlessAddonData', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('seamless_addon_nonce')
        ]);
    }

    /**
     * Enqueue editor assets.
     */
    public function enqueue_editor_assets()
    {
        // Add editor-specific styles if needed
    }

    /**
     * Add type="module" to scripts that use ES6 module syntax.
     * 
     * This fixes errors where scripts use import/export but aren't loaded as modules.
     *
     * @param string $tag    The script tag HTML.
     * @param string $handle The script handle.
     * @param string $src    The script source URL.
     * @return string Modified script tag.
     */
    public function add_module_type_to_scripts($tag, $handle, $src)
    {
        // List of script patterns that use ES6 modules
        // Check both handle and source URL for better detection
        $module_patterns = [
            'toastUICalendar',
            'toast-ui-calendar',
            'toastUICalendar.js',
            'seamless.js',
            'seamless-js',
        ];

        // Check if this script should be loaded as a module
        $should_be_module = false;
        foreach ($module_patterns as $pattern) {
            if (stripos($handle, $pattern) !== false || stripos($src, $pattern) !== false) {
                $should_be_module = true;
                break;
            }
        }

        if ($should_be_module) {
            // Add type="module" if not already present
            if (strpos($tag, 'type=') === false) {
                $tag = str_replace('<script ', '<script type="module" ', $tag);
            } elseif (strpos($tag, 'type="module"') === false && strpos($tag, "type='module'") === false) {
                // Replace existing type attribute with module
                $tag = preg_replace('/type=["\']text\/javascript["\']/', 'type="module"', $tag);
            }
        }

        return $tag;
    }



    /**
     * Get membership service.
     *
     * @return MembershipService
     */
    public function get_membership_service()
    {
        return $this->membership_service;
    }

    /**
     * Get cache service.
     *
     * @return CacheService
     */
    public function get_cache_service()
    {
        return $this->cache_service;
    }
}
