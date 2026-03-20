<?php

namespace SeamlessAddon\Core;

/**
 * Class DependencyChecker
 * 
 * Validates that all required dependencies are met before plugin initialization.
 */
class DependencyChecker
{
    /**
     * Minimum required PHP version.
     */
    const MIN_PHP_VERSION = '7.4';

    /**
     * Minimum required WordPress version.
     */
    const MIN_WP_VERSION = '6.0';

    /**
     * Error message if dependencies are not met.
     *
     * @var string
     */
    private $error_message = '';

    /**
     * Check all dependencies.
     *
     * @return bool True if all dependencies are met, false otherwise.
     */
    public function check()
    {
        // Check PHP version
        if (!$this->check_php_version()) {
            return false;
        }

        // Check WordPress version
        if (!$this->check_wp_version()) {
            return false;
        }

        // Check if Seamless plugin is active
        if (!$this->check_seamless_plugin()) {
            return false;
        }

        // Check if Elementor plugin is active
        if (!$this->check_elementor_plugin()) {
            return false;
        }

        return true;
    }

    /**
     * Get the error message if dependencies are not met.
     *
     * @return string
     */
    public function get_error_message()
    {
        return $this->error_message;
    }

    /**
     * Check PHP version.
     *
     * @return bool
     */
    private function check_php_version()
    {
        if (version_compare(PHP_VERSION, self::MIN_PHP_VERSION, '<')) {
            $this->error_message = sprintf(
                /* translators: 1: Required PHP version, 2: Current PHP version */
                __('Seamless Addon requires PHP %1$s or higher. Your current PHP version is %2$s. Please update PHP.', 'seamless-addon'),
                self::MIN_PHP_VERSION,
                PHP_VERSION
            );
            return false;
        }
        return true;
    }

    /**
     * Check WordPress version.
     *
     * @return bool
     */
    private function check_wp_version()
    {
        global $wp_version;

        if (version_compare($wp_version, self::MIN_WP_VERSION, '<')) {
            $this->error_message = sprintf(
                /* translators: 1: Required WordPress version, 2: Current WordPress version */
                __('Seamless Addon requires WordPress %1$s or higher. Your current WordPress version is %2$s. Please update WordPress.', 'seamless-addon'),
                self::MIN_WP_VERSION,
                $wp_version
            );
            return false;
        }
        return true;
    }

    /**
     * Check if Seamless plugin is active.
     *
     * @return bool
     */
    private function check_seamless_plugin()
    {
        // Include plugin.php if not already loaded
        if (!function_exists('is_plugin_active')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        // Check if Seamless plugin is active
        if (!is_plugin_active('seamless-wordpress-plugin/seamless.php')) {
            $this->error_message = __(
                'Seamless Addon requires the Seamless plugin to be installed and activated.',
                'seamless-addon'
            ) . ' <a href="' . admin_url('plugins.php') . '">' . __('Go to Plugins', 'seamless-addon') . '</a>';
            return false;
        }

        // Check if Seamless is authenticated
        if (!$this->check_seamless_authentication()) {
            return false;
        }

        return true;
    }

    /**
     * Check if Seamless plugin is authenticated.
     *
     * @return bool
     */
    private function check_seamless_authentication()
    {
        // Check if Seamless Auth class exists
        if (!class_exists('Seamless\\Auth\\SeamlessAuth')) {
            $this->error_message = __(
                'Seamless Addon requires the Seamless plugin to be properly configured.',
                'seamless-addon'
            );
            return false;
        }

        // Check authentication status
        $auth = new \Seamless\Auth\SeamlessAuth();
        if (!$auth->is_authenticated()) {
            $this->error_message = __(
                'Seamless Addon requires the Seamless plugin to be authenticated. Please authenticate your Seamless plugin.',
                'seamless-addon'
            ) . ' <a href="' . admin_url('admin.php?page=seamless&view=settings&tab=authentication') . '">' . __('Authenticate Now', 'seamless-addon') . '</a>';
            return false;
        }

        return true;
    }

    /**
     * Check if Elementor plugin is active.
     *
     * @return bool
     */
    private function check_elementor_plugin()
    {
        // Include plugin.php if not already loaded
        if (!function_exists('is_plugin_active')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        // Check if Elementor is installed and active
        if (!is_plugin_active('elementor/elementor.php')) {
            $this->error_message = __(
                'Seamless Addon requires Elementor to be installed and activated.',
                'seamless-addon'
            ) . ' <a href="' . admin_url('plugin-install.php?s=elementor&tab=search') . '">' . __('Install Elementor', 'seamless-addon') . '</a>';
            return false;
        }
        return true;
    }
}
