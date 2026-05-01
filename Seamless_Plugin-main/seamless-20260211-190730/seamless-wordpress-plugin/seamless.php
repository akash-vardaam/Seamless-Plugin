<?php

/**
 * Plugin Name:       Seamless
 * Plugin URI:        https://seamlessams.com
 * Description:       Editable endpoints and shortcodes for events/Memberships with authentication.
 * Version:           1.0.0
 * Author:            Actualize Studio
 * Author URI:        https://vardaam.com
 * License:           GPL2
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       seamless
 * Domain Path:       /languages
 * Requires at least: 6.0
 * Tested up to:      6.3
 * Requires PHP:      7.4
 */

// If this file is called directly, abort.
if (! defined('WPINC')) {
    die;
}

/**
 * Plugin version.
 */
define('SEAMLESS_VERSION', '1.0.0');

/**
 * Plugin file path.
 */
define('SEAMLESS_PLUGIN_FILE', __FILE__);

/**
 * Plugin directory path.
 */
define('SEAMLESS_PLUGIN_DIR', plugin_dir_path(__FILE__));

/**
 * Plugin directory URL.
 */
define('SEAMLESS_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Plugin basename.
 */
define('SEAMLESS_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Check plugin compatibility requirements.
 *
 * @return bool True if compatible, false otherwise.
 */
function seamless_check_compatibility()
{
    $php_min_version = '7.4';
    $wp_min_version  = '6.0';
    $is_compatible   = true;

    // Check PHP version.
    if (version_compare(PHP_VERSION, $php_min_version, '<')) {
        add_action('admin_notices', 'seamless_php_version_notice');
        $is_compatible = false;
    }

    // Check WordPress version.
    global $wp_version;
    if (version_compare($wp_version, $wp_min_version, '<')) {
        add_action('admin_notices', 'seamless_wp_version_notice');
        $is_compatible = false;
    }

    return $is_compatible;
}

/**
 * Display PHP version compatibility notice.
 */
function seamless_php_version_notice()
{
    $php_min_version = '7.4';
?>
    <div class="notice notice-error">
        <p>
            <?php
            printf(
                /* translators: 1: Required PHP version, 2: Current PHP version */
                esc_html__('Seamless plugin requires PHP %1$s or higher. Your current PHP version is %2$s. Please update PHP.', 'seamless'),
                esc_html($php_min_version),
                esc_html(PHP_VERSION)
            );
            ?>
        </p>
    </div>
<?php
}

/**
 * Display WordPress version compatibility notice.
 */
function seamless_wp_version_notice()
{
    $wp_min_version = '6.0';
    global $wp_version;
?>
    <div class="notice notice-error">
        <p>
            <?php
            printf(
                /* translators: 1: Required WordPress version, 2: Current WordPress version */
                esc_html__('Seamless plugin requires WordPress %1$s or higher. Your current WordPress version is %2$s. Please update WordPress.', 'seamless'),
                esc_html($wp_min_version),
                esc_html($wp_version)
            );
            ?>
        </p>
    </div>
<?php
}

// Early exit if compatibility check fails.
if (! seamless_check_compatibility()) {
    return;
}

/**
 * Hide all admin notices on the Seamless top-level admin page.
 * This is intentionally strict and suppresses both third-party and Seamless notices.
 */
function seamless_hide_all_admin_notices($screen = null)
{
    if (!is_admin()) {
        return;
    }

    $screen = $screen ?: get_current_screen();
    if (!$screen || empty($screen->id) || $screen->id !== 'toplevel_page_seamless') {
        return;
    }

    foreach (['admin_notices', 'all_admin_notices', 'network_admin_notices', 'user_admin_notices'] as $hook_name) {
        remove_all_actions($hook_name);
    }
}
add_action('current_screen', 'seamless_hide_all_admin_notices', 1);
add_action('in_admin_header', 'seamless_hide_all_admin_notices', 1);

/**
 * CSS fallback for notices rendered outside notice hooks.
 */
function seamless_hide_all_admin_notices_css()
{
    if (!is_admin()) {
        return;
    }

    $screen = get_current_screen();
    if (!$screen || empty($screen->id) || $screen->id !== 'toplevel_page_seamless') {
        return;
    }

    echo '<style id="seamless-hide-admin-notices">'
        . '#wpbody-content > .notice,'
        . '#wpbody-content > .update-nag,'
        . '#wpbody-content > .error,'
        . '#wpbody-content > .updated,'
        . '#wpbody-content > .is-dismissible{display:none !important;}'
        . '</style>';
}
add_action('admin_head', 'seamless_hide_all_admin_notices_css', 99);

// Autoload classes via Composer.
require_once SEAMLESS_PLUGIN_DIR . 'vendor/autoload.php';

use Seamless\SeamlessAutoLoader;

/**
 * Register React Event Shortcode
 *
 * Registers the [seamless_react_events] shortcode for displaying the React event calendar
 *
 * @since 1.0.0
 */
function seamless_register_react_event_shortcode()
{
    add_shortcode('seamless_react_events', 'seamless_react_event_render');
}
add_action('init', 'seamless_register_react_event_shortcode', 5);

/**
 * Render React Event Shortcode
 *
 * Outputs the container element where the React app will mount
 * Enqueues necessary scripts and styles
 *
 * @return string HTML container for React app
 * @since 1.0.0
 */
function seamless_react_event_render()
{
    $autoloader = \Seamless\SeamlessAutoLoader::getInstance();
    $render = $autoloader ? $autoloader->get_component('render') : null;

    if ($render && method_exists($render, 'shortcode_react_events_list')) {
        return $render->shortcode_react_events_list();
    }

    // Fallback: if SeamlessRender is not yet loaded, output the mount point
    seamless_enqueue_react_event_assets();
    return '<div id="seamless-react-root" class="seamless-react-root" data-seamless-view="events" data-site-url="' . esc_url(home_url()) . '"></div>';
}

/**
 * Enqueue React Event Assets
 *
 * Loads the React app JavaScript and CSS files
 * Only loads when shortcode is used
 *
 * @since 1.0.0
 */
function seamless_enqueue_react_event_assets()
{
    static $assets_enqueued = false;
    
    // Prevent double enqueuing
    if ($assets_enqueued) {
        return;
    }
    $assets_enqueued = true;
    
    $plugin_url = SEAMLESS_PLUGIN_URL;
    $plugin_dir = SEAMLESS_PLUGIN_DIR;
    
    // Define the path to the React app dist folder
    $dist_folder = $plugin_dir . 'src/Public/assets/react-build/dist/';
    $dist_url = $plugin_url . 'src/Public/assets/react-build/dist/';
    
    // Check if dist folder exists
    if (!is_dir($dist_folder)) {
        // Log error for debugging
        error_log('Seamless React Event: dist folder not found at ' . $dist_folder);
        return;
    }
    
    // Enqueue CSS file - dynamically find the asset file
    $assets_folder = $dist_folder . 'assets/';
    if (is_dir($assets_folder)) {
        $files = scandir($assets_folder);
        
        // Find CSS file
        foreach ($files as $file) {
            if (strpos($file, 'index-') === 0 && strpos($file, '.css') !== false) {
                $css_path = $assets_folder . $file;
                wp_enqueue_style(
                    'seamless-react-css',
                    $dist_url . 'assets/' . $file,
                    array(),
                    filemtime($css_path),
                    'all'
                );
                break;
            }
        }
        
        // Find JavaScript file
        foreach ($files as $file) {
            if (strpos($file, 'index-') === 0 && strpos($file, '.js') !== false) {
                $js_path = $assets_folder . $file;
                wp_enqueue_script(
                    'seamless-react-js',
                    $dist_url . 'assets/' . $file,
                    array(),
                    filemtime($js_path),
                    true
                );

                wp_localize_script('seamless-react-js', 'seamlessReactConfig', array(
                    'siteUrl' => esc_url(home_url()),
                    'restUrl' => esc_url(rest_url()),
                    'nonce' => wp_create_nonce('seamless'),
                    'ajaxUrl' => admin_url('admin-ajax.php'),
                    'ajaxNonce' => wp_create_nonce('seamless_nonce'),
                    'clientDomain' => rtrim(get_option('seamless_client_domain', ''), '/'),
                    'eventListEndpoint' => get_option('seamless_event_list_endpoint', 'events'),
                    'singleEventEndpoint' => get_option('seamless_single_event_endpoint', 'event'),
                    'amsContentEndpoint' => get_option('seamless_ams_content_endpoint', 'ams-content'),
                    'shopListEndpoint' => get_option('seamless_shop_list_endpoint', 'shop'),
                    'singleProductEndpoint' => get_option('seamless_single_product_endpoint', 'product'),
                    'shopCartEndpoint' => get_option('seamless_shop_cart_endpoint', 'shops/cart'),
                    'isLoggedIn' => is_user_logged_in(),
                ));

                wp_add_inline_script(
                    'seamless-react-js',
                    <<<'JS'
(function () {
    if (window.__seamlessCanonicalEventLinksPatched) {
        return;
    }
    window.__seamlessCanonicalEventLinksPatched = true;

    function normalizeEndpoint(value, fallback) {
        var endpoint = (value || fallback || 'event').toString().trim().replace(/^\/+|\/+$/g, '');
        return endpoint || fallback || 'event';
    }

    function getConfig() {
        return window.seamlessReactConfig || window.seamlessConfig || {};
    }

    function getSafeReturnPath(value) {
        if (!value) {
            return '';
        }

        try {
            var decoded = decodeURIComponent(value);
            if (decoded.indexOf('/') !== 0 || decoded.indexOf('//') === 0 || /[\r\n]/.test(decoded)) {
                return '';
            }

            var url = new URL(decoded, window.location.origin);
            if (url.origin !== window.location.origin) {
                return '';
            }

            return url.pathname + url.search + url.hash;
        } catch (error) {
            return '';
        }
    }

    function getCurrentReturnPath(endpoint) {
        try {
            var currentUrl = new URL(window.location.href);
            var pathParts = currentUrl.pathname.split('/').filter(Boolean);
            if (pathParts.indexOf(endpoint) !== -1) {
                return '';
            }

            return currentUrl.pathname || '/';
        } catch (error) {
            return '';
        }
    }

    function getReturnUrl() {
        try {
            var currentUrl = new URL(window.location.href);
            var returnPath = getSafeReturnPath(currentUrl.searchParams.get('return_to'));
            return returnPath ? new URL(returnPath, window.location.origin).toString() : '';
        } catch (error) {
            return '';
        }
    }

    function injectFilterIconFix(root) {
        if (!root || root.__seamlessFilterIconFixInjected) {
            return;
        }

        var target = root.nodeType === 9 ? document.head : root;
        if (!target || !target.appendChild) {
            return;
        }

        var style = document.createElement('style');
        style.setAttribute('data-seamless-filter-icon-fix', 'true');
        style.textContent = [
            ':host .seamless-filter-search-icon, .seamless-filter-search-icon {',
            'display: inline-flex !important;',
            'align-items: center !important;',
            'justify-content: center !important;',
            'width: 1rem !important;',
            'height: 1rem !important;',
            'line-height: 1 !important;',
            'overflow: hidden !important;',
            '}',
            ':host .seamless-filter-search-icon svg, .seamless-filter-search-icon svg {',
            'display: block !important;',
            'flex: 0 0 1rem !important;',
            'width: 1rem !important;',
            'height: 1rem !important;',
            'min-width: 1rem !important;',
            'min-height: 1rem !important;',
            'max-width: 1rem !important;',
            'max-height: 1rem !important;',
            '}',
        ].join('');
        target.appendChild(style);
        root.__seamlessFilterIconFixInjected = true;
    }

    function getEventUrl(slug, type) {
        if (!slug) {
            return '';
        }

        var config = getConfig();
        var siteUrl = (config.siteUrl || window.location.origin).toString().replace(/\/+$/g, '');
        var endpoint = normalizeEndpoint(config.singleEventEndpoint, 'event');
        var url = new URL(siteUrl + '/' + endpoint + '/' + encodeURIComponent(slug));

        if (type === 'group-event') {
            url.searchParams.set('type', 'group-event');
        }

        var returnPath = getCurrentReturnPath(endpoint);
        if (returnPath) {
            url.searchParams.set('return_to', returnPath);
        }

        return url.toString();
    }

    function canonicalizeHref(href) {
        if (!href) {
            return '';
        }

        try {
            var url = new URL(href, window.location.origin);
            var slug = url.searchParams.get('seamless_event');
            var config = getConfig();
            var endpoint = normalizeEndpoint(config.singleEventEndpoint, 'event');

            if (!slug) {
                var pathParts = url.pathname.split('/').filter(Boolean);
                var endpointIndex = pathParts.indexOf(endpoint);
                if (endpointIndex === -1 || !pathParts[endpointIndex + 1]) {
                    return '';
                }
                slug = decodeURIComponent(pathParts[endpointIndex + 1]);
            }

            var type = url.searchParams.get('type') === 'group-event' ? 'group-event' : '';
            return getEventUrl(slug, type);
        } catch (error) {
            return '';
        }
    }

    function normalizeAnchor(anchor) {
        if (!anchor || !anchor.getAttribute) {
            return;
        }

        var canonical = canonicalizeHref(anchor.getAttribute('href') || '');
        if (canonical && anchor.href !== canonical) {
            anchor.href = canonical;
        }
    }

    function normalizeEventLinks(root) {
        var scope = root && root.querySelectorAll ? root : document;
        scope.querySelectorAll('a[href*="seamless_event="]').forEach(normalizeAnchor);
    }

    function normalizeReturnLinks(root) {
        var returnUrl = getReturnUrl();
        if (!returnUrl) {
            return;
        }

        var scope = root && root.querySelectorAll ? root : document;
        scope.querySelectorAll('.seamless-single-evt-back-btn, .seamless-breadcrumb-link').forEach(function (anchor) {
            var label = (anchor.textContent || '').trim().toLowerCase();
            if (anchor.classList.contains('seamless-single-evt-back-btn') || label === 'events') {
                anchor.href = returnUrl;
            }
        });
    }

    function findAnchorFromEvent(event) {
        var path = event.composedPath ? event.composedPath() : [];
        for (var i = 0; i < path.length; i++) {
            if (path[i] && path[i].tagName === 'A' && path[i].getAttribute) {
                return path[i];
            }
        }

        return event.target && event.target.closest ? event.target.closest('a[href]') : null;
    }

    function observeRoot(root) {
        if (!root || root.__seamlessCanonicalEventLinksObserved) {
            return;
        }

        root.__seamlessCanonicalEventLinksObserved = true;
        injectFilterIconFix(root);
        normalizeEventLinks(root);
        normalizeReturnLinks(root);

        if (window.MutationObserver) {
            new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    mutation.addedNodes.forEach(function (node) {
                        if (node.nodeType !== 1) {
                            return;
                        }

                        if (node.matches && node.matches('a[href*="seamless_event="]')) {
                            normalizeAnchor(node);
                        }

                        normalizeEventLinks(node);
                        normalizeReturnLinks(node);

                        if (node.shadowRoot) {
                            observeRoot(node.shadowRoot);
                        }
                    });
                });
            }).observe(root, { childList: true, subtree: true });
        }
    }

    function observeOpenShadowRoots() {
        document.querySelectorAll('*').forEach(function (node) {
            if (node.shadowRoot) {
                observeRoot(node.shadowRoot);
            }
        });
    }

    if (window.Element && Element.prototype.attachShadow && !Element.prototype.__seamlessCanonicalAttachShadowPatched) {
        var originalAttachShadow = Element.prototype.attachShadow;
        Element.prototype.attachShadow = function () {
            var root = originalAttachShadow.apply(this, arguments);
            setTimeout(function () {
                observeRoot(root);
            }, 0);
            return root;
        };
        Element.prototype.__seamlessCanonicalAttachShadowPatched = true;
    }

    function init() {
        observeRoot(document);
        observeOpenShadowRoots();

        document.addEventListener('click', function (event) {
            var anchor = findAnchorFromEvent(event);
            if (!anchor) {
                return;
            }

            var canonical = canonicalizeHref(anchor.getAttribute('href') || '');
            if (!canonical) {
                return;
            }

            event.preventDefault();
            window.location.href = canonical;
        }, true);

        setTimeout(observeOpenShadowRoots, 0);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
JS,
                    'after'
                );
                break;
            }
        }
    } else {
        error_log('Seamless React Event: assets folder not found at ' . $assets_folder);
    }
}

/**
 * Initialize the plugin.
 *
 * Instantiates the main plugin class to bootstrap all functionality.
 * Uses plugins_loaded hook to ensure all WordPress core is available.
 */
function seamless_init()
{
    load_plugin_textdomain('seamless', false, dirname(SEAMLESS_PLUGIN_BASENAME) . '/languages');

    SeamlessAutoLoader::getInstance();
}
add_action('plugins_loaded', 'seamless_init');

/**
 * Register REST API Routes for React Events
 *
 * Creates WordPress REST API endpoints for the React app to fetch events data
 *
 * @since 1.0.0
 */
function seamless_register_react_events_api_routes()
{
    // Events list endpoint
    register_rest_route('seamless/v1', '/events', array(
        'methods' => 'GET',
        'callback' => 'seamless_api_get_events',
        'permission_callback' => '__return_true',
        'args' => array(
            'page' => array(
                'required' => false,
                'type' => 'integer',
                'default' => 1,
            ),
            'limit' => array(
                'required' => false,
                'type' => 'integer',
                'default' => 10,
            ),
            'category' => array(
                'required' => false,
                'type' => 'string',
            ),
            'search' => array(
                'required' => false,
                'type' => 'string',
            ),
        ),
    ));
    
    // Single event endpoint
    register_rest_route('seamless/v1', '/events/(?P<id>[a-zA-Z0-9\-]+)', array(
        'methods' => 'GET',
        'callback' => 'seamless_api_get_single_event',
        'permission_callback' => '__return_true',
    ));
}
add_action('rest_api_init', 'seamless_register_react_events_api_routes');

/**
 * API Handler: Get Events List
 *
 * Fetches events from the external API and returns them to React app
 *
 * @param WP_REST_Request $request The REST request object
 * @return WP_REST_Response
 * @since 1.0.0
 */
function seamless_api_get_events($request)
{
    $api_endpoint = 'https://saoa.seamlessams.com/api';
    
    // Build query parameters from request
    $params = array(
        'page' => $request->get_param('page') ?: 1,
        'limit' => $request->get_param('limit') ?: 10,
    );
    
    $category = $request->get_param('category');
    if ($category) {
        $params['category'] = $category;
    }
    
    $search = $request->get_param('search');
    if ($search) {
        $params['search'] = $search;
    }
    
    // Make request to third-party API
    $url = $api_endpoint . '/events/';
    
    $response = wp_remote_get(add_query_arg($params, $url), array(
        'timeout' => 10,
        'sslverify' => false,
    ));
    
    // Handle errors
    if (is_wp_error($response)) {
        return new WP_REST_Response(
            array('error' => $response->get_error_message()),
            500
        );
    }
    
    $http_code = wp_remote_retrieve_response_code($response);
    $body = wp_remote_retrieve_body($response);
    
    if (200 !== $http_code) {
        return new WP_REST_Response(
            array('error' => 'API Error', 'status' => $http_code),
            $http_code
        );
    }
    
    $data = json_decode($body, true);
    return new WP_REST_Response($data, 200);
}

/**
 * API Handler: Get Single Event
 *
 * Fetches a single event from the external API
 *
 * @param WP_REST_Request $request The REST request object
 * @return WP_REST_Response
 * @since 1.0.0
 */
function seamless_api_get_single_event($request)
{
    $api_endpoint = 'https://saoa.seamlessams.com/api';
    $event_id = $request->get_param('id');
    
    if (empty($event_id)) {
        return new WP_REST_Response(
            array('error' => 'Event ID is required'),
            400
        );
    }
    
    $url = $api_endpoint . '/events/' . $event_id;
    
    $response = wp_remote_get($url, array(
        'timeout' => 10,
        'sslverify' => false,
    ));
    
    // Handle errors
    if (is_wp_error($response)) {
        return new WP_REST_Response(
            array('error' => $response->get_error_message()),
            500
        );
    }
    
    $http_code = wp_remote_retrieve_response_code($response);
    $body = wp_remote_retrieve_body($response);
    
    if (200 !== $http_code) {
        return new WP_REST_Response(
            array('error' => 'API Error', 'status' => $http_code),
            $http_code
        );
    }
    
    $data = json_decode($body, true);
    return new WP_REST_Response($data, 200);
}

/**
 * Plugin activation hook.
 *
 * Registers custom rewrite rules and flushes permalinks.
 */
function seamless_activate()
{
    require_once SEAMLESS_PLUGIN_DIR . 'vendor/autoload.php';

    // Set default endpoint if not already set
    if (!get_option('seamless_ams_content_endpoint')) {
        add_option('seamless_ams_content_endpoint', 'ams-content');
    }

    $endpoints = new \Seamless\Endpoints\Endpoints();
    $endpoints->register_rewrite_rules();
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'seamless_activate');

/**
 * Plugin deactivation hook.
 *
 * Flushes permalinks to remove custom rewrite rules.
 */
function seamless_deactivate()
{
    // Flush rewrite rules to clean up custom endpoints.
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'seamless_deactivate');
