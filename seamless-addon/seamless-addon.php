<?php

/**
 * Plugin Name:       Seamless Addon
 * Plugin URI:        https://seamlessams.com
 * Description:       Elementor widgets and dynamic tags for Seamless events and memberships
 * Version:           1.0.0
 * Author:            Actualize Studio
 * Author URI:        https://vardaam.com
 * License:           GPL2
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       seamless-addon
 * Domain Path:       /languages
 * Requires at least: 6.0
 * Tested up to:      6.3
 * Requires PHP:      7.4
 * 
 * Requires Plugins: elementor, seamless-wordpress-plugin
 * Elementor tested up to: 3.21.0
 */

// If this file is called directly, abort.
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Plugin version.
 */
define('SEAMLESS_ADDON_VERSION', '1.0.0');

/**
 * Plugin file path.
 */
define('SEAMLESS_ADDON_PLUGIN_FILE', __FILE__);

/**
 * Plugin directory path.
 */
define('SEAMLESS_ADDON_PLUGIN_DIR', plugin_dir_path(__FILE__));

/**
 * Plugin directory URL.
 */
define('SEAMLESS_ADDON_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Plugin basename.
 */
define('SEAMLESS_ADDON_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Autoload classes via Composer if available, otherwise use custom autoloader.
 */
if (file_exists(SEAMLESS_ADDON_PLUGIN_DIR . 'vendor/autoload.php')) {
    require_once SEAMLESS_ADDON_PLUGIN_DIR . 'vendor/autoload.php';
}

// Require custom autoloader
require_once SEAMLESS_ADDON_PLUGIN_DIR . 'src/Core/Autoloader.php';

use SeamlessAddon\Core\Autoloader;
use SeamlessAddon\Core\Plugin;

// Initialize autoloader
Autoloader::register();

/**
 * Plugin activation hook.
 */
function seamless_addon_activate()
{
    // Set default options
    if (!get_option('seamless_addon_cache_duration')) {
        add_option('seamless_addon_cache_duration', 1800); // 30 minutes default
    }

    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'seamless_addon_activate');

/**
 * Plugin deactivation hook.
 */
function seamless_addon_deactivate()
{
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'seamless_addon_deactivate');

/**
 * Initialize the plugin.
 */
function seamless_addon_init()
{
    // Check if Seamless plugin is active
    if (!class_exists('Seamless\SeamlessAutoLoader')) {
        add_action('admin_notices', function () {
            echo '<div class="notice notice-error"><p>';
            echo esc_html__('Seamless Addon requires the Seamless plugin to be installed and activated.', 'seamless-addon');
            echo '</p></div>';
        });
        return;
    }

    // Load text domain
    load_plugin_textdomain(
        'seamless-addon',
        false,
        dirname(SEAMLESS_ADDON_PLUGIN_BASENAME) . '/languages'
    );

    // Initialize the main plugin class
    Plugin::get_instance();
}
add_action('plugins_loaded', 'seamless_addon_init');
