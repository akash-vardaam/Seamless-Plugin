<?php

/**
 * Plugin Name:       Seamless React
 * Plugin URI:        https://seamlessams.com
 * Description:       React-powered addon for events, memberships, courses and user dashboard with SSO. Uses Shadow DOM for style isolation.
 * Version:           2.0.0
 * Author:            Actualize Studio
 * Author URI:        https://vardaam.com
 * License:           GPL2
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       seamless-react
 * Domain Path:       /languages
 * Requires at least: 6.0
 * Tested up to:      6.5
 * Requires PHP:      8.0
 */

// ─── Security: Abort direct access ───────────────────────────────────────────
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Suppress deprecation notices from other plugins (e.g. Gravity Forms) 
 * that corrupt JSON AJAX responses in the Elementor editor.
 */
if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
	error_reporting( E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED );
	ini_set( 'display_errors', '0' );
}

/**
 * Polyfill for str_starts_with and str_ends_with for PHP < 8.0
 */
if ( ! function_exists( 'str_starts_with' ) ) {
	function str_starts_with( $haystack, $needle ) {
		return (string) $needle !== '' && strncmp( $haystack, $needle, strlen( $needle ) ) === 0;
	}
}

if ( ! function_exists( 'str_ends_with' ) ) {
	function str_ends_with( $haystack, $needle ) {
		return $needle !== '' && substr( $haystack, -strlen( $needle ) ) === (string) $needle;
	}
}

// ─── Constants ───────────────────────────────────────────────────────────────
define( 'SEAMLESS_REACT_VERSION',   '2.0.0' );
define( 'SEAMLESS_REACT_FILE',      __FILE__ );
define( 'SEAMLESS_REACT_DIR',       plugin_dir_path( __FILE__ ) );
define( 'SEAMLESS_REACT_URL',       plugin_dir_url( __FILE__ ) );
define( 'SEAMLESS_REACT_BASENAME',  plugin_basename( __FILE__ ) );
define( 'SEAMLESS_REACT_SRC_DIR',   SEAMLESS_REACT_DIR . 'src/' );
define( 'SEAMLESS_REACT_BUILD_DIR', SEAMLESS_REACT_DIR . 'react-build/dist/' );
define( 'SEAMLESS_REACT_BUILD_URL', SEAMLESS_REACT_URL . 'react-build/dist/' );

// ─── Compatibility checks ─────────────────────────────────────────────────────
function seamless_react_check_compatibility(): bool {
	$ok = true;

	if ( version_compare( PHP_VERSION, '8.0', '<' ) ) {
		add_action( 'admin_notices', 'seamless_react_php_notice' );
		$ok = false;
	}

	global $wp_version;
	if ( version_compare( $wp_version, '6.0', '<' ) ) {
		add_action( 'admin_notices', 'seamless_react_wp_notice' );
		$ok = false;
	}

	return $ok;
}

function seamless_react_php_notice(): void {
	printf(
		'<div class="notice notice-error"><p>%s</p></div>',
		sprintf(
			esc_html__( 'Seamless React requires PHP 8.0 or higher. Current: %s', 'seamless-react' ),
			esc_html( PHP_VERSION )
		)
	);
}

function seamless_react_wp_notice(): void {
	global $wp_version;
	printf(
		'<div class="notice notice-error"><p>%s</p></div>',
		sprintf(
			esc_html__( 'Seamless React requires WordPress 6.0 or higher. Current: %s', 'seamless-react' ),
			esc_html( $wp_version )
		)
	);
}

if ( seamless_react_check_compatibility() ) {
	// ─── Autoloader ──────────────────────────────────────────────────────────────
	require_once SEAMLESS_REACT_SRC_DIR . 'Autoloader.php';

	function seamless_react_init(): void {
		// Stop execution if dependencies are missing
		$missing_seamless  = ! class_exists( 'Seamless\\SeamlessAutoLoader' );
		$missing_elementor = ! class_exists( '\\Elementor\\Plugin' ) && ! did_action( 'elementor/loaded' );
		
		if ( $missing_seamless || $missing_elementor ) {
			return;
		}

		load_plugin_textdomain( 'seamless-react', false, dirname( SEAMLESS_REACT_BASENAME ) . '/languages' );
		\SeamlessReact\Autoloader::get_instance();
	}
	add_action( 'plugins_loaded', 'seamless_react_init' );
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
add_action( 'admin_init', function() {
	if ( ! current_user_can( 'activate_plugins' ) ) {
		return;
	}

	// Show activation error if it exists
	$activation_error = get_transient( 'seamless_react_activation_error' );
	if ( $activation_error ) {
		add_action( 'admin_notices', function() use ( $activation_error ) {
			echo '<div class="notice notice-error"><p>';
			echo esc_html( 'Seamless React Addon Activation Error: ' . $activation_error );
			echo '</p></div>';
		} );
		delete_transient( 'seamless_react_activation_error' );
		return;
	}

	// Always check dependencies in admin to allow for deactivation/notices
	$missing_seamless  = ! class_exists( 'Seamless\\SeamlessAutoLoader' );
	$missing_elementor = ! class_exists( '\\Elementor\\Plugin' ) && ! did_action( 'elementor/loaded' );

	if ( $missing_seamless || $missing_elementor ) {
		// Only deactivate if we are actually active
		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		
		if ( is_plugin_active( SEAMLESS_REACT_BASENAME ) ) {
			deactivate_plugins( SEAMLESS_REACT_BASENAME );
			add_action( 'admin_notices', function() use ( $missing_seamless, $missing_elementor ) {
				echo '<div class="notice notice-error"><p>';
				if ( $missing_seamless && $missing_elementor ) {
					echo esc_html__( 'Seamless React Addon deactivated automatically. It requires BOTH the core Seamless plugin and Elementor to be installed and activated first.', 'seamless-react' );
				} elseif ( $missing_seamless ) {
					echo esc_html__( 'Seamless React Addon deactivated automatically. It requires the core Seamless plugin to be installed and activated first.', 'seamless-react' );
				} else {
					echo esc_html__( 'Seamless React Addon deactivated automatically. It requires the Elementor plugin to be installed and activated first.', 'seamless-react' );
				}
				echo '</p></div>';
			} );
		}
	}
} );

// ─── Activation / Deactivation ───────────────────────────────────────────────
function seamless_react_activate(): void {
	try {
		error_log( 'DEBUG: Seamless React activation started' );
		
		// Check dependencies first
		if ( ! class_exists( '\Seamless\SeamlessAutoLoader' ) ) {
			throw new \Exception( 'Main Seamless plugin is not active. Please activate the main Seamless plugin first.' );
		}
		if ( ! class_exists( '\Elementor\Plugin' ) && ! did_action( 'elementor/loaded' ) ) {
			throw new \Exception( 'Elementor is not active. Please activate Elementor first.' );
		}
		
		error_log( 'DEBUG: Dependencies checked' );
		
		// Set default options
		if ( ! get_option( 'seamless_react_ams_content_endpoint' ) ) {
			add_option( 'seamless_react_ams_content_endpoint', 'ams-content' );
		}
		if ( ! get_option( 'seamless_react_event_list_endpoint' ) ) {
			add_option( 'seamless_react_event_list_endpoint', 'events' );
		}
		if ( ! get_option( 'seamless_react_single_event_endpoint' ) ) {
			add_option( 'seamless_react_single_event_endpoint', 'event' );
		}

		error_log( 'DEBUG: Options set' );
		
		// Load Autoloader
		require_once SEAMLESS_REACT_SRC_DIR . 'Autoloader.php';
		error_log( 'DEBUG: Autoloader loaded' );
		
		// Register endpoints
		$endpoints = new \SeamlessReact\Endpoints\Endpoints();
		error_log( 'DEBUG: Endpoints instance created' );
		
		$endpoints->register_rewrite_rules();
		error_log( 'DEBUG: Rewrite rules registered' );
		
		flush_rewrite_rules();
		error_log( 'DEBUG: Rewrite rules flushed' );
		
	} catch ( \Throwable $e ) {
		error_log( 'ERROR: Seamless React activation failed: ' . $e->getMessage() . '\n' . $e->getTraceAsString() );
		// Store error for display in admin
		set_transient( 'seamless_react_activation_error', $e->getMessage(), 10 );
		throw new \Exception( 'Seamless React: ' . $e->getMessage() );
	}
}
register_activation_hook( __FILE__, 'seamless_react_activate' );

function seamless_react_deactivate(): void {
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'seamless_react_deactivate' );
