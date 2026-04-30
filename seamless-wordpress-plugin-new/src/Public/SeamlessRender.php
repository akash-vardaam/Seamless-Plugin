<?php

namespace Seamless\Public;

use Carbon_Fields\Carbon_Fields;
use Seamless\Auth\SeamlessAuth as Auth;
use Seamless\Auth\SeamlessSSO as SSO;
use Seamless\Operations\Events;
use Seamless\Operations\Membership;
use Elementor\Plugin;

class SeamlessRender
{
	private Auth $auth;
	private SSO $sso;

	public function __construct()
	{
		$this->auth = new Auth();
		$this->sso = new SSO();

		add_action('wp_enqueue_scripts', [$this, 'enqueue_seamless_assets']);
		add_action('admin_enqueue_scripts', [$this, 'enqueue_seamless_assets']);
		add_filter('script_loader_tag', [$this, 'add_module_type_attribute'], 10, 3);

		// AJAX hooks
		// Event rendering hook (API data is fetched client-side, then rendered server-side)
		add_action('wp_ajax_render_event_template', [$this, 'ajax_render_event_template']);
		add_action('wp_ajax_nopriv_render_event_template', [$this, 'ajax_render_event_template']);
		add_action('wp_ajax_seamless_upgrade_membership', [$this, 'ajax_upgrade_membership']);
		add_action('wp_ajax_seamless_downgrade_membership', [$this, 'ajax_downgrade_membership']);
		add_action('wp_ajax_seamless_cancel_membership', [$this, 'ajax_cancel_membership']);
		add_action('wp_ajax_seamless_request_group_removal', [$this, 'ajax_request_group_removal']);
		add_action('wp_ajax_seamless_renew_membership', [$this, 'ajax_renew_membership']);
		add_action('wp_ajax_seamless_cancel_scheduled_change', [$this, 'ajax_cancel_scheduled_change']);
		add_action('wp_ajax_seamless_update_profile', [$this, 'ajax_update_profile']);

		// Dashboard Async Loading Hooks
		add_action('wp_ajax_seamless_get_dashboard_profile', [$this, 'ajax_get_dashboard_profile']);
		add_action('wp_ajax_seamless_get_dashboard_memberships', [$this, 'ajax_get_dashboard_memberships']);
		add_action('wp_ajax_seamless_get_dashboard_courses', [$this, 'ajax_get_dashboard_courses']);
		add_action('wp_ajax_seamless_get_dashboard_orders', [$this, 'ajax_get_dashboard_orders']);
		add_action('wp_ajax_seamless_get_dashboard_organization', [$this, 'ajax_get_dashboard_organization']);
		add_action('wp_ajax_seamless_resend_group_invite', [$this, 'ajax_resend_group_invite']);
		add_action('wp_ajax_seamless_add_group_members', [$this, 'ajax_add_group_members']);
		add_action('wp_ajax_seamless_remove_group_member', [$this, 'ajax_remove_group_member']);
		add_action('wp_ajax_seamless_change_member_role', [$this, 'ajax_change_member_role']);

		add_action('wp_head', [$this, 'enqueue_dynamic_styles']);

		add_action('rest_api_init', [$this->sso, 'register_rest_routes']);
		// add_filter('the_content', [$this, 'apply_content_restrictions']);
		// add_action('pre_get_posts', [$this, 'override_plugin_pages']);
		add_action('after_setup_theme', function () {
			Carbon_Fields::boot();
		});

		$this->register_shortcodes();
	}

	public function enqueue_dynamic_styles()
	{
		$color_scheme = get_option('seamless_color_scheme', 'theme');
		$styles = [];

		if ($color_scheme === 'plugin') {
			$styles['--seamless-primary-color'] = get_option('seamless_primary_color');
			$styles['--seamless-secondary-color'] = get_option('seamless_secondary_color');
			$styles['--seamless-link-color'] = get_option('seamless_secondary_color');
			$styles['--seamless-secondary-hover-color'] = $this->adjust_brightness(get_option('seamless_secondary_color'), -20);
		} else {
			// Elementor theme support
			if (did_action('elementor/loaded')) {
				$kit = \Elementor\Plugin::$instance->kits_manager->get_active_kit_for_frontend();
				$kit_settings = $kit->get_settings();

				if (!empty($kit_settings['system_colors'])) {
					$system_colors = $kit_settings['system_colors'];
					$color_map = [
						'primary' => '--seamless-primary-color',
						'secondary' => '--seamless-secondary-color',
						'accent' => '--seamless-accent-color',
						'text' => '--seamless-text-color',
					];

					foreach ($system_colors as $color) {
						if (isset($color_map[$color['_id']])) {
							$styles[$color_map[$color['_id']]] = $color['color'];
						}
					}

					// Set link and hover colors based on Elementor globals
					if (isset($styles['--seamless-primary-color'])) {
						$styles['--seamless-link-color'] = $styles['--seamless-primary-color'];
					}
					if (isset($styles['--seamless-secondary-color'])) {
						$styles['--seamless-secondary-hover-color'] = $this->adjust_brightness($styles['--seamless-secondary-color'], -20);
					}
				}
			}

			// General theme support (fallback)
			if (empty($styles)) {
				$font_family = get_theme_mod('body_font_family', get_theme_mod('body_font'));
				if ($font_family) {
					$styles['--seamless-font-family'] = $font_family;
				}

				$heading_color = get_theme_mod('heading_color');
				$primary_color = get_theme_mod('primary_color');
				$theme_primary_color = $heading_color ?: $primary_color;
				if ($theme_primary_color) {
					$styles['--seamless-primary-color'] = $theme_primary_color;
				}

				$link_color = get_theme_mod('link_color');
				if ($link_color) {
					$styles['--seamless-link-color'] = $link_color;
					$styles['--seamless-secondary-hover-color'] = $this->adjust_brightness($link_color, -20);
				} else if ($theme_primary_color) {
					$styles['--seamless-link-color'] = $theme_primary_color;
				}

				$accent_color = get_theme_mod('accent_color');
				if ($accent_color) {
					$styles['--seamless-secondary-color'] = $accent_color;
				} else if ($theme_primary_color) {
					$styles['--seamless-secondary-color'] = $theme_primary_color;
				}

				$text_color = get_theme_mod('text_color');
				if ($text_color) {
					$styles['--seamless-text-color'] = $text_color;
				}

				if (empty($theme_primary_color) && function_exists('get_theme_support') && current_theme_supports('editor-color-palette')) {
					$palette = get_theme_support('editor-color-palette')[0];
					if (!empty($palette)) {
						$styles['--seamless-primary-color']   = $palette[0]['color'] ?? '#26337a';
						$styles['--seamless-secondary-color'] = $palette[1]['color'] ?? $styles['--seamless-primary-color'];
						$styles['--seamless-accent-color']    = $palette[2]['color'] ?? $styles['--seamless-secondary-color'];
						$styles['--seamless-text-color']      = $palette[3]['color'] ?? '#222';

						// Optionally set link color and hover color
						$styles['--seamless-link-color'] = $styles['--seamless-primary-color'];
						$styles['--seamless-secondary-hover-color'] = $this->adjust_brightness($styles['--seamless-secondary-color'], -20);
					}
				}
			}
		}


		if (!empty($styles)) {
			echo "\n" . '<style id="seamless-dynamic-styles">' . "\n";
			echo ":root {\n";
			foreach ($styles as $key => $value) {
				$key = esc_attr(trim($key));
				$value = esc_attr(trim($value));
				echo "\t{$key}: {$value};\n";
			}
			echo "}\n";
			echo "</style>\n";
		}
	}

	private function adjust_brightness($hex, $steps)
	{
		$steps = max(-255, min(255, $steps));
		$hex = str_replace('#', '', $hex);
		if (strlen($hex) == 3) {
			$hex = str_repeat(substr($hex, 0, 1), 2) . str_repeat(substr($hex, 1, 1), 2) . str_repeat(substr($hex, 2, 1), 2);
		}
		$r = max(0, min(255, hexdec(substr($hex, 0, 2)) + $steps));
		$g = max(0, min(255, hexdec(substr($hex, 2, 2)) + $steps));
		$b = max(0, min(255, hexdec(substr($hex, 4, 2)) + $steps));
		return '#' . str_pad(dechex($r), 2, '0', STR_PAD_LEFT) . str_pad(dechex($g), 2, '0', STR_PAD_LEFT) . str_pad(dechex($b), 2, '0', STR_PAD_LEFT);
	}

	public function enqueue_seamless_assets()
	{
		$plugin_url = plugin_dir_url(__FILE__);
		$plugin_path = plugin_dir_path(__DIR__);
		$dist_path = plugin_dir_path(__FILE__) . 'dist/';

		wp_enqueue_style(
			'seamless-montserrat',
			'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap',
			[],
			null
		);

		wp_enqueue_style(
			'seamless-font-awesome-cdn',
			'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
			[],
			null
		);

		$toast_css_file = 'css/toastUICalendar.css';
		if (file_exists($dist_path . $toast_css_file)) {
			wp_enqueue_style(
				'seamless-toast-ui-calendar-css',
				$plugin_url . 'dist/' . $toast_css_file,
				[],
				filemtime($dist_path . $toast_css_file)
			);
		}

		$seamless_css_file = 'css/seamless.css';
		if (file_exists($dist_path . $seamless_css_file)) {
			wp_enqueue_style(
				'seamless-main-style',
				$plugin_url . 'dist/' . $seamless_css_file,
				[],
				filemtime($dist_path . $seamless_css_file)
			);
		}

		$shop_css_path = plugin_dir_path(__FILE__) . 'assets/css/seamless-shop.css';
		if (file_exists($shop_css_path)) {
			wp_enqueue_style(
				'seamless-shop-style',
				$plugin_url . 'assets/css/seamless-shop.css',
				['seamless-main-style'],
				filemtime($shop_css_path)
			);
		}

		// Enqueue restriction template CSS
		$general_css_path = plugin_dir_path(__FILE__) . 'assets/css/general.css';
		if (file_exists($general_css_path)) {
			wp_enqueue_style(
				'seamless-restriction-style',
				$plugin_url . 'assets/css/general.css',
				['seamless-main-style'],
				filemtime($general_css_path)
			);
		}

		// Enqueue toast notification CSS
		$toast_css_path = plugin_dir_path(__FILE__) . 'assets/css/toast.css';
		if (file_exists($toast_css_path)) {
			wp_enqueue_style(
				'seamless-toast-style',
				$plugin_url . 'assets/css/toast.css',
				[],
				filemtime($toast_css_path)
			);
		}

		// Enqueue API Client JavaScript
		$api_client_js_path = plugin_dir_path(__FILE__) . 'assets/js/seamless-api-client.js';
		if (file_exists($api_client_js_path)) {
			wp_enqueue_script(
				'seamless-api-client-js',
				$plugin_url . 'assets/js/seamless-api-client.js',
				[],
				filemtime($api_client_js_path),
				true // Load in footer
			);

			$current_user_access_token = '';
			$current_user_ams_id = '';
			if (is_user_logged_in()) {
				$uid = get_current_user_id();
				$current_user_access_token = get_user_meta($uid, 'seamless_access_token', true);
				if (method_exists($this->sso, 'seamless_refresh_token_if_needed')) {
					$refreshed_token = $this->sso->seamless_refresh_token_if_needed($uid);
					if (!empty($refreshed_token)) {
						$current_user_access_token = $refreshed_token;
					}
				}
				$current_user_ams_id = (string) get_user_meta($uid, 'seamless_ams_user_id', true);
			}

			wp_localize_script('seamless-api-client-js', 'seamless_ajax', [
				'ajax_url' => admin_url('admin-ajax.php'),
				'nonce'    => wp_create_nonce('seamless_nonce'),
				'is_logged_in' => is_user_logged_in(),
				'access_token' => $current_user_access_token,
				'ams_user_id' => $current_user_ams_id,
				'list_view_layout' => get_option('seamless_list_view_layout', 'option_1'),
				'api_domain' => rtrim(get_option('seamless_client_domain', ''), '/'),
				'single_event_endpoint' => get_option('seamless_single_event_endpoint', 'event'),
				'single_product_endpoint' => get_option('seamless_single_product_endpoint', 'product'),
				'shop_list_endpoint' => get_option('seamless_product_list_endpoint', 'shop'),
				'shop_cart_endpoint' => get_option('seamless_shop_cart_endpoint', 'shops/cart'),
				'site_url' => rtrim(home_url('/'), '/'),
				'shop_product_type_label' => 'Physical',
				'shop_availability_label' => 'Available',
			]);
		}

		$seamless_js_file = 'js/seamless.js';
		if (file_exists($dist_path . $seamless_js_file)) {
			wp_enqueue_script(
				'seamless-vite-main-js',
				$plugin_url . 'dist/' . $seamless_js_file,
				['jquery', 'seamless-api-client-js'],
				filemtime($dist_path . $seamless_js_file),
				true // Load in footer
			);
		}

		$shop_module_path = dirname(__DIR__) . '/js/shop.js';
		if (file_exists($shop_module_path)) {
			wp_enqueue_script(
				'seamless-shop-module-js',
				plugins_url('src/js/shop.js', SEAMLESS_PLUGIN_FILE),
				['seamless-api-client-js'],
				filemtime($shop_module_path),
				true
			);
		}
	}

	public function add_module_type_attribute($tag, $handle, $src): mixed
	{
		if (!wp_script_is($handle, 'registered') && !wp_script_is($handle, 'enqueued')) {
			return $tag;
		}

		// Add your bundled script handle if you need module type
		if (in_array($handle, ['seamless-toast-ui-calendar-js', 'seamless-vite-main-js', 'seamless-shop-module-js'])) {
			return str_replace('<script ', '<script type="module" ', $tag);
		}

		return $tag;
	}

	// {
	// 	// Add type="module" to your specific scripts
	// 	if (in_array($handle, ['seamless-toast-ui-calendar-js', 'seamless-vite-main-js'])) {
	// 		$tag = str_replace('<script ', '<script type="module" ', $tag);
	// 	}
	// 	return $tag;
	// }

	private function get_authentication_required_message(): string
	{
		return '<div class="seamless-authentication-required"><p>' . esc_html__('Please authenticate to fetch data. Open the Seamless Plugin Authentication tab, enter your credentials, and connect to continue.', 'seamless') . '</p></div>';
	}

	private function register_shortcodes(): void
	{
		add_shortcode('seamless_event_list', [$this, 'shortcode_event_list']);
		add_shortcode('seamless_single_event', [$this, 'shortcode_single_event']);
		add_shortcode('seamless_product_list', [$this, 'shortcode_shop_list']);
		add_shortcode('seamless_single_product', [$this, 'shortcode_single_product']);
		add_shortcode('seamless_user_dashboard', [$this, 'shortcode_user_dashboard']);
		add_shortcode('seamless_events', [$this, 'shortcode_custom_events']);
		add_shortcode('seamless_cart', [$this, 'shortcode_cart']);
	}

	private function seamless_get_template($template_name): string
	{
		return locate_template($template_name) ?: plugin_dir_path(__FILE__) . 'templates/' . $template_name;
	}

	public function shortcode_event_list($atts = []): string
	{
		if (!$this->auth->is_authenticated()) {
			return $this->get_authentication_required_message();
		}

		$atts = shortcode_atts([
			'template' => 'default',
		], $atts, 'seamless_event_list');

		$template = strtolower((string) $atts['template']);
		$template_file = 'tpl-event-wrapper.php';
		if ($template === 'without-dropdown') {
			$template_file = 'tpl-event-wrapper-without-dropdown.php';
		}

		$instance_id = uniqid('seamless-events-', false);

		ob_start();
		include $this->seamless_get_template($template_file);
		return ob_get_clean();
	}

	public function shortcode_single_event($atts): string
	{
		if (!$this->auth->is_authenticated()) {
			return $this->get_authentication_required_message();
		}
		$atts = shortcode_atts([
			'slug' => '',
			'type' => 'event', // Default to 'event'
		], $atts, 'seamless_single_event');

		$slug = $atts['slug'];
		$type = $atts['type'];

		$lid = substr(md5(uniqid('sl', true)), 0, 6);
		$loader_html = '<div class="loader-container"><div id="Seamlessloader" class="seamless-plugin-loader hidden" role="status" aria-label="Loading"><svg xmlns="http://www.w3.org/2000/svg"  class="sync-wheel-svg" viewBox="62 64 282 282" aria-hidden="true"><defs><linearGradient id="swg1-' . $lid . '" x1="135.2" y1="221.8" x2="271.3" y2="221.8" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0fd"/><stop offset=".2" stop-color="#2ac9e4"/><stop offset=".4" stop-color="#6383ed"/><stop offset=".6" stop-color="#904bf5"/><stop offset=".8" stop-color="#b022fa"/><stop offset=".9" stop-color="#c40afd"/><stop offset="1" stop-color="#cc01ff"/></linearGradient><linearGradient id="swg2-' . $lid . '" x1="62.7" y1="214.6" x2="343.9" y2="214.6" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0fd"/><stop offset=".2" stop-color="#2ac9e4"/><stop offset=".4" stop-color="#6383ed"/><stop offset=".6" stop-color="#904bf5"/><stop offset=".8" stop-color="#b022fa"/><stop offset=".9" stop-color="#c40afd"/><stop offset="1" stop-color="#cc01ff"/></linearGradient><linearGradient id="swg3-' . $lid . '" x1="99.4" y1="214.7" x2="314.3" y2="214.7" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0fd"/><stop offset=".2" stop-color="#2ac9e4"/><stop offset=".4" stop-color="#6383ed"/><stop offset=".6" stop-color="#904bf5"/><stop offset=".8" stop-color="#b022fa"/><stop offset=".9" stop-color="#c40afd"/><stop offset="1" stop-color="#cc01ff"/></linearGradient></defs><g class="sl-ring-outer"><path fill="url(#swg2-' . $lid . ')" d="M203,64.7c-77.5.2-140.5,63.4-140.3,140.9,0,34.4,12.6,65.9,33.2,90.3-1.6,3.2-2.6,6.8-2.6,10.6,0,12.6,10.3,22.9,23,22.9s9.6-1.6,13.3-4.3c21.5,13.3,46.9,21,74,20.9,77.5-.2,140.5-63.4,140.3-140.9-.2-77.5-63.4-140.5-140.9-140.3h0ZM116.3,316c-5.2,0-9.5-4.2-9.5-9.5s4.2-9.5,9.5-9.5,9.5,4.2,9.5,9.5-4.2,9.5-9.5,9.5ZM203.6,332.5c-24.1,0-46.6-6.6-65.8-18.2.9-2.5,1.4-5.1,1.4-7.9,0-12.6-10.3-22.9-23-22.9s-7.7,1-10.9,2.8c-18.2-21.9-29.1-50-29.2-80.7-.2-70.1,56.8-127.3,126.9-127.5s127.3,56.8,127.5,126.9-56.8,127.3-126.9,127.5Z"/></g><g class="sl-ring-mid"><path fill="url(#swg3-' . $lid . ')" d="M305.1,226.9c1.5-7,2.3-14.2,2.3-21.6,0-57.4-46.7-104-104-104s-104,46.7-104,104,46.7,104,104,104,64.3-16.4,83.3-41.7c1.5.3,3.1.5,4.7.5,12.6,0,22.9-10.3,22.9-22.9s-3.6-14.1-9.2-18.3h0ZM203.3,296c-50,0-90.6-40.7-90.6-90.6s40.7-90.6,90.6-90.6,90.6,40.7,90.6,90.6-.6,11.5-1.6,17h-1c-12.6,0-22.9,10.3-22.9,22.9s2.4,11.7,6.4,15.8c-16.6,21.2-42.4,34.9-71.4,34.9h0ZM291.4,254.7c-5.2,0-9.5-4.3-9.5-9.5s4.3-9.5,9.5-9.5,9.5,4.3,9.5,9.5-4.3,9.5-9.5,9.5Z"/></g><g class="sl-ring-inner"><path fill="url(#swg1-' . $lid . ')" d="M225.6,141.1c-2.2-10.4-11.5-18.2-22.5-18.1-11,0-20.2,7.9-22.4,18.3-26.5,9.4-45.5,34.7-45.5,64.3s30.7,68,68.2,67.9c37.5,0,68-30.7,67.9-68.2,0-29.7-19.2-54.9-45.8-64.1h0ZM203.2,136.3c5.2,0,9.5,4.2,9.5,9.5s-4.2,9.5-9.5,9.5-9.5-4.2-9.5-9.5,4.2-9.5,9.5-9.5ZM203.5,260c-30.1,0-54.7-24.4-54.8-54.5,0-22.7,13.8-42.2,33.5-50.5,3.5,8.1,11.7,13.8,21.1,13.8s17.5-5.7,21-13.9c19.7,8.2,33.7,27.7,33.7,50.3s-24.4,54.7-54.5,54.8Z"/></g></svg></div></div>';

		return '<div id="singleEventWrapper" class="single_event_container">' . $loader_html . '<div id="event_detail" data-event-slug="' . esc_attr($slug) . '" data-event-type="' . esc_attr($type) . '"></div></div>';
	}

	public function shortcode_shop_list($atts = []): string
	{
		if (!$this->auth->is_authenticated()) {
			return $this->get_authentication_required_message();
		}

		$instance_id = uniqid('seamless-shop-', false);

		ob_start();
		include $this->seamless_get_template('tpl-shop-wrapper.php');
		return ob_get_clean();
	}

	public function shortcode_single_product($atts = []): string
	{
		if (!$this->auth->is_authenticated()) {
			return $this->get_authentication_required_message();
		}

		$atts = shortcode_atts([
			'slug' => '',
		], $atts, 'seamless_single_product');

		$product_slug = trim((string) $atts['slug']);
		if ($product_slug === '') {
			$product_slug = (string) get_query_var('product_slug', '');
		}

		if ($product_slug === '') {
			return '<div class="seamless-shop-detail seamless-shop-detail-empty"><p class="event-message">' . esc_html__('No product slug was provided.', 'seamless') . '</p></div>';
		}

		ob_start();
		include $this->seamless_get_template('tpl-single-product-detail.php');
		return ob_get_clean();
	}

	public function shortcode_cart($atts = []): string
	{
		// if (!$this->auth->is_authenticated()) {
		// 	return $this->get_authentication_required_message();
		// }

		ob_start();
		include $this->seamless_get_template('tpl-cart.php');
		return ob_get_clean();
	}

	// Retired server-side fetching methods and pagination helpers



	/**
	 * Shortcode: [seamless_events]
	 * Displays events with customizable view types and filtering options.
	 * @param array $atts Shortcode attributes
	 * @return string HTML output
	 */
	public function shortcode_custom_events($atts = []): string
	{
		if (!$this->auth->is_authenticated()) {
			return $this->get_authentication_required_message();
		}

		$atts = shortcode_atts([
			'view' => 'list',
			'category' => '',
			'featured_image' => 'true',
			'limit' => 0,
			'sort' => 'all',
		], $atts, 'seamless_events');

		$view = in_array($atts['view'], ['list', 'grid']) ? $atts['view'] : 'list';
		$show_featured_image = filter_var($atts['featured_image'], FILTER_VALIDATE_BOOLEAN);
		$shortcode_atts = $atts;

		// Build API URL for events
		$client_domain = rtrim(get_option('seamless_client_domain', ''), '/');
		$api_url = $client_domain . '/api/events';

		$query_params = [
			'per_page' => 1000, // Get all events
		];

		// Add query params to URL
		$api_url = add_query_arg($query_params, $api_url);

		// Fetch events from API
		$response = wp_remote_get($api_url, [
			'timeout' => 30,
			'sslverify' => false,
		]);

		$events = [];
		if (!is_wp_error($response)) {
			$body = json_decode(wp_remote_retrieve_body($response), true);

			if (is_array($body)) {
				if (isset($body['data']['events']) && is_array($body['data']['events'])) {
					$events = $body['data']['events'];
				} elseif (isset($body['data']) && is_array($body['data'])) {
					$events = $body['data'];
				}
			}
		}

		// Filter by status (published only)
		$events = array_filter($events, function ($event) {
			$status = strtolower($event['status'] ?? '');
			return $status === 'published';
		});

		// Filter by category if specified
		if (!empty($atts['category'])) {
			$category_slug = $atts['category'];
			$events = array_filter($events, function ($event) use ($category_slug) {
				if (empty($event['categories']) || !is_array($event['categories'])) {
					return false;
				}
				// Check if any event category matches the slug
				foreach ($event['categories'] as $cat) {
					if (isset($cat['slug']) && $cat['slug'] === $category_slug) {
						return true;
					}
				}
				return false;
			});
		}

		// Filter by sort (upcoming/current/past)
		if (!empty($atts['sort']) && $atts['sort'] !== 'all') {
			$today = strtotime('today midnight');

			$events = array_filter($events, function ($event) use ($atts, $today) {
				$event_type = $event['event_type'] ?? 'event';

				// Get start and end dates
				if ($event_type === 'group_event') {
					$start_str = $event['formatted_start_date'] ?? '';
					$end_str = $event['formatted_end_date'] ?? '';
				} else {
					$start_str = $event['start_date'] ?? '';
					$end_str = $event['end_date'] ?? '';
				}

				if (empty($start_str)) {
					return false;
				}

				$event_start = strtotime($start_str);
				$event_end = !empty($end_str) ? strtotime($end_str) : $event_start;

				// Set to start of day for comparison
				$event_start_day = strtotime(date('Y-m-d', $event_start) . ' midnight');
				$event_end_day = strtotime(date('Y-m-d', $event_end) . ' 23:59:59');

				switch ($atts['sort']) {
					case 'upcoming':
						return $event_start_day > $today;
					case 'current':
						return $event_start_day <= $today && $event_end_day >= $today;
					case 'past':
						return $event_end_day < $today;
				}

				return false;
			});

			// Sort the results
			if ($atts['sort'] === 'upcoming') {
				// Ascending by start date (soonest first)
				usort($events, function ($a, $b) {
					$a_type = $a['event_type'] ?? 'event';
					$b_type = $b['event_type'] ?? 'event';

					$a_start = $a_type === 'group_event'
						? ($a['formatted_start_date'] ?? '')
						: ($a['start_date'] ?? '');
					$b_start = $b_type === 'group_event'
						? ($b['formatted_start_date'] ?? '')
						: ($b['start_date'] ?? '');

					$a_time = !empty($a_start) ? strtotime($a_start) : PHP_INT_MAX;
					$b_time = !empty($b_start) ? strtotime($b_start) : PHP_INT_MAX;

					return $a_time - $b_time;
				});
			} elseif ($atts['sort'] === 'past') {
				// Descending by end date (most recent first)
				usort($events, function ($a, $b) {
					$a_type = $a['event_type'] ?? 'event';
					$b_type = $b['event_type'] ?? 'event';

					$a_end = $a_type === 'group_event'
						? ($a['formatted_end_date'] ?? $a['formatted_start_date'] ?? '')
						: ($a['end_date'] ?? $a['start_date'] ?? '');
					$b_end = $b_type === 'group_event'
						? ($b['formatted_end_date'] ?? $b['formatted_start_date'] ?? '')
						: ($b['end_date'] ?? $b['start_date'] ?? '');

					$a_time = !empty($a_end) ? strtotime($a_end) : 0;
					$b_time = !empty($b_end) ? strtotime($b_end) : 0;

					return $b_time - $a_time;
				});
			}
		}

		// Apply limit after filtering
		if ($atts['limit'] > 0) {
			$events = array_slice($events, 0, (int)$atts['limit']);
		}

		// Re-index array
		$events = array_values($events);

		// Check if theme has override hook
		$template_override_hook = 'seamless_events_shortcode_' . $view . '_template_override';

		if (has_action($template_override_hook)) {
			ob_start();
			do_action($template_override_hook, $events, $atts);
			return ob_get_clean();
		}

		// No override - use default template
		$template_file = 'tpl-events-shortcode-' . $view . '.php';
		$template_path = $this->seamless_get_template($template_file);

		if (!file_exists($template_path)) {
			return '<p class="seamless-error">Template file not found: ' . esc_html($template_file) . '</p>';
		}

		ob_start();
		include $template_path;
		return ob_get_clean();
	}

	/**
	 * Shortcode: [seamless_user_dashboard]
	 * Displays a logged-in user's dashboard with Membership, Membership History,
	 * Order History and Profile tabs.
	 */
	public function shortcode_user_dashboard($atts = []): string
	{
		// Require login
		if (!is_user_logged_in()) {
			return do_shortcode('[seamless_login_button text="Sign in to view your dashboard" class="seamless-premium-btn seamless-login-btn"]');
		}

		$uid = get_current_user_id();
		$access_token = get_user_meta($uid, 'seamless_access_token', true);
		if (empty($access_token) && method_exists($this->sso, 'seamless_refresh_token_if_needed')) {
			$access_token = $this->sso->seamless_refresh_token_if_needed($uid) ?: '';
		}

		$client_domain = rtrim(get_option('seamless_client_domain', ''), '/');
		if (empty($client_domain)) {
			return '<div class="seamless-user-dashboard-error">Client domain is not configured.</div>';
		}

		$headers = [
			'headers' => [
				'Accept'        => 'application/json',
			],
			'timeout' => 20,
			'sslverify' => false,
		];
		if (!empty($access_token)) {
			$headers['headers']['Authorization'] = 'Bearer ' . $access_token;
		}

		$user = wp_get_current_user();
		$email = $user && !empty($user->user_email) ? $user->user_email : '';

		// Prepare default containers
		$profile = [
			'name'  => wp_get_current_user()->display_name,
			'email' => wp_get_current_user()->user_email,
		];
		$current_memberships = [];
		$membership_history = [];
		$orders = [];

		// Profile/basic user info (only if we have an access token)
		if (!empty($access_token)) {
			$response = wp_remote_get($client_domain . '/api/user', $headers);
			if (!is_wp_error($response)) {
				$body = json_decode(wp_remote_retrieve_body($response), true);
				if (is_array($body)) {
					$profile = $body['data']['user'] ?? ($body['data'] ?? $body);
				}
			}


			// Membership plans (current and historical if available) — prefer email filtered API
			$memUrl = $client_domain . '/api/users/membership-plans' . ($email ? ('?email=' . rawurlencode($email)) : '');
			$memRes = wp_remote_get($memUrl, $headers);
			if (is_wp_error($memRes) && $email) {
				// retry with alternate param key if server expects user_email
				$memUrlAlt = $client_domain . '/api/users/membership-plans?user_email=' . rawurlencode($email);
				$memRes = wp_remote_get($memUrlAlt, $headers);
			}
			if (!is_wp_error($memRes)) {
				$memBody = json_decode(wp_remote_retrieve_body($memRes), true);
				$memData = is_array($memBody) ? ($memBody['data'] ?? $memBody) : [];
				// If API returned collection of users -> pick the matching email row
				if (is_array($memData) && isset($memData[0]['user'])) {
					foreach ($memData as $row) {
						if (!empty($row['user']['email']) && $row['user']['email'] === $email) {
							$memData = $row['memberships'] ?? [];
							break;
						}
					}
				}
				// Try to detect common shapes
				if (isset($memData['current'])) {
					$current_memberships = $memData['current'];
					$membership_history = $memData['history'] ?? [];
				} elseif (isset($memData['active_memberships'])) {
					$current_memberships = $memData['active_memberships'] ?? [];
					$membership_history = $memData['membership_history'] ?? [];
				} elseif (is_array($memData)) {
					foreach ($memData as $m) {
						if (!empty($m['status']) && $m['status'] === 'active') {
							$current_memberships[] = $m;
						} else {
							$membership_history[] = $m;
						}
					}
				}
			}

			$orderUrl = $client_domain . '/api/users/order-history' . ($email ? ('?email=' . rawurlencode($email)) : '');
			$ordRes = wp_remote_get($orderUrl, $headers);
			if (is_wp_error($ordRes) && $email) {
				$orderUrlAlt = $client_domain . '/api/users/order-history?user_email=' . rawurlencode($email);
				$ordRes = wp_remote_get($orderUrlAlt, $headers);
			}
			if (!is_wp_error($ordRes)) {
				$data = wp_remote_retrieve_body($ordRes);
				$ordBody = json_decode(wp_remote_retrieve_body($ordRes), true);
				$ordersData = is_array($ordBody) ? ($ordBody['data'] ?? $ordBody) : [];
				if (isset($ordersData[0]['user'])) {
					foreach ($ordersData as $row) {
						if (!empty($row['user']['email']) && $row['user']['email'] === $email) {
							$orders = $row['orders'] ?? [];
							break;
						}
					}
				} else {
					$orders = $ordersData;
				}
			}
		}

		$active_filtered = [];
		$history_combined = is_array($membership_history) ? $membership_history : [];
		$now = time();
		foreach ((array) $current_memberships as $m) {
			$status = $m['status'] ?? '';
			$expiry = $m['expiry_date'] ?? ($m['expires_at'] ?? null);
			$is_expired = false;
			if (!empty($expiry)) {
				$ts = strtotime((string)$expiry);
				if ($ts !== false && $ts < $now) {
					$is_expired = true;
				}
			}
			if (strtolower((string)$status) === 'active' && !$is_expired) {
				$active_filtered[] = $m;
			} else {
				$history_combined[] = $m;
			}
		}

		// Render via template
		ob_start();
		$__seamless_client_domain = $client_domain;
		$__seamless_profile = $profile;
		$__seamless_current_memberships = $active_filtered;
		$__seamless_membership_history = $history_combined;
		$__seamless_orders = $orders;
		include $this->seamless_get_template('tpl-user-dashboard.php');
		return ob_get_clean();
		// }
	}

	/**
	 * AJAX handler for membership upgrade
	 */
	public function ajax_upgrade_membership()
	{
		// Verify nonce
		check_ajax_referer('seamless_upgrade_membership', 'nonce');

		// Check if user is logged in
		if (!is_user_logged_in()) {
			wp_send_json_error(['message' => 'User not logged in']);
			return;
		}

		// Get parameters
		$new_plan_id = sanitize_text_field($_POST['new_plan_id'] ?? '');
		$membership_id = sanitize_text_field($_POST['membership_id'] ?? '');
		$email = sanitize_email($_POST['email'] ?? '');

		if (empty($new_plan_id) || empty($email)) {
			wp_send_json_error(['message' => 'Missing required parameters']);
			return;
		}

		// Call UserProfile operation
		$user_profile = new \Seamless\Operations\UserProfile();
		$result = $user_profile->upgrade_membership($new_plan_id, $membership_id, $email);

		if ($result['success']) {
			wp_send_json_success($result);
		} else {
			wp_send_json_error($result);
		}
	}

	/**
	 * AJAX handler for membership downgrade
	 */
	public function ajax_downgrade_membership()
	{
		// Verify nonce
		check_ajax_referer('seamless_downgrade_membership', 'nonce');

		// Check if user is logged in
		if (!is_user_logged_in()) {
			wp_send_json_error(['message' => 'User not logged in']);
			return;
		}

		// Get parameters
		$new_plan_id = sanitize_text_field($_POST['new_plan_id'] ?? '');
		$membership_id = sanitize_text_field($_POST['membership_id'] ?? '');
		$email = sanitize_email($_POST['email'] ?? '');

		if (empty($new_plan_id) || empty($email)) {
			wp_send_json_error(['message' => 'Missing required parameters']);
			return;
		}

		// Call UserProfile operation
		$user_profile = new \Seamless\Operations\UserProfile();
		$result = $user_profile->downgrade_membership($new_plan_id, $membership_id, $email);

		if ($result['success']) {
			wp_send_json_success($result);
		} else {
			wp_send_json_error($result);
		}
	}

	/**
	 * AJAX handler for membership cancellation
	 */
	public function ajax_cancel_membership()
	{
		// Verify nonce
		check_ajax_referer('seamless_cancel_membership', 'nonce');

		// Check if user is logged in
		if (!is_user_logged_in()) {
			wp_send_json_error(['message' => 'User not logged in']);
			return;
		}

		// Get parameters
		$membership_id = sanitize_text_field($_POST['membership_id'] ?? '');
		$email = sanitize_email($_POST['email'] ?? '');

		if (empty($membership_id) || empty($email)) {
			wp_send_json_error(['message' => 'Missing required parameters']);
			return;
		}

		// Call UserProfile operation
		$user_profile = new \Seamless\Operations\UserProfile();
		$result = $user_profile->cancel_membership($membership_id, $email);

		if ($result['success']) {
			wp_send_json_success($result);
		} else {
			wp_send_json_error($result);
		}
	}

	/**
	 * AJAX handler for group membership removal requests
	 */
	public function ajax_request_group_removal()
	{
		check_ajax_referer('seamless_request_group_removal', 'nonce');

		if (!is_user_logged_in()) {
			wp_send_json_error(['message' => 'User not logged in']);
			return;
		}

		$membership_id = sanitize_text_field($_POST['membership_id'] ?? '');
		$email = sanitize_email($_POST['email'] ?? '');

		if (empty($membership_id) || empty($email)) {
			wp_send_json_error(['message' => 'Missing required parameters']);
			return;
		}

		$user_profile = new \Seamless\Operations\UserProfile();
		$result = $user_profile->request_group_removal($membership_id, $email);

		if ($result['success']) {
			wp_send_json_success($result);
		} else {
			wp_send_json_error($result);
		}
	}

	/**
	 * AJAX handler for membership renewal
	 */
	public function ajax_renew_membership()
	{
		// Verify nonce
		check_ajax_referer('seamless_renew_membership', 'nonce');

		// Check if user is logged in
		if (!is_user_logged_in()) {
			wp_send_json_error(['message' => 'User not logged in']);
			return;
		}

		// Get parameters
		$plan_id = sanitize_text_field($_POST['plan_id'] ?? '');
		$email = sanitize_email($_POST['email'] ?? '');

		if (empty($plan_id) || empty($email)) {
			wp_send_json_error(['message' => 'Missing required parameters']);
			return;
		}

		// Call UserProfile operation
		$user_profile = new \Seamless\Operations\UserProfile();
		$result = $user_profile->renew_membership($plan_id, $email);

		if ($result['success']) {
			wp_send_json_success($result);
		} else {
			wp_send_json_error($result);
		}
	}

	/**
	 * AJAX handler for cancelling scheduled membership changes
	 */
	public function ajax_cancel_scheduled_change()
	{
		// Verify nonce
		check_ajax_referer('seamless_cancel_scheduled_change', 'nonce');

		// Check if user is logged in
		if (!is_user_logged_in()) {
			wp_send_json_error(['message' => 'User not logged in']);
			return;
		}

		// Get parameters
		$membership_id = sanitize_text_field($_POST['membership_id'] ?? '');
		$email = sanitize_email($_POST['email'] ?? '');

		if (empty($membership_id) || empty($email)) {
			wp_send_json_error(['message' => 'Missing required parameters']);
			return;
		}

		// Call UserProfile operation
		$user_profile = new \Seamless\Operations\UserProfile();
		$result = $user_profile->cancel_scheduled_change($membership_id, $email);

		if ($result['success']) {
			wp_send_json_success($result);
		} else {
			wp_send_json_error($result);
		}
	}

	/**
	 * AJAX handler for profile update
	 */
	public function ajax_update_profile()
	{
		// Verify nonce
		check_ajax_referer('seamless_update_profile', 'nonce');

		// Check if user is logged in
		if (!is_user_logged_in()) {
			wp_send_json_error(['message' => 'User not logged in']);
			return;
		}

		// Get parameters
		$email = sanitize_email($_POST['email'] ?? '');
		$profile_data = $_POST['profile_data'] ?? [];

		if (empty($email) || empty($profile_data)) {
			wp_send_json_error(['message' => 'Missing required parameters']);
			return;
		}

		// Call UserProfile operation
		$user_profile = new \Seamless\Operations\UserProfile();
		$result = $user_profile->update_user_profile($email, $profile_data);

		if ($result['success']) {
			wp_send_json_success($result);
		} else {
			wp_send_json_error($result);
		}
	}

	/**
	 * AJAX handler for rendering event template with API-fetched data
	 */
	public function ajax_render_event_template()
	{
		// Verify nonce
		if (!check_ajax_referer('seamless_nonce', 'nonce', false)) {
			wp_send_json_error(['message' => 'Invalid nonce']);
			return;
		}

		// Get event data from POST
		$event_data_json = isset($_POST['event_data']) ? wp_unslash($_POST['event_data']) : '';
		$event_type = isset($_POST['event_type']) ? sanitize_text_field($_POST['event_type']) : 'event';

		if (empty($event_data_json)) {
			wp_send_json_error(['message' => 'No event data provided']);
			return;
		}

		// Decode event data
		$event = json_decode($event_data_json, true);
		if (json_last_error() !== JSON_ERROR_NONE) {
			wp_send_json_error(['message' => 'Invalid event data format']);
			return;
		}

		// Add event_type to event data
		$event['event_type'] = $event_type;

		// Render the template
		ob_start();
		include $this->seamless_get_template('tpl-single-event-detail.php');
		$html = ob_get_clean();

		wp_send_json_success($html);
	}

	/**
	 * Async Dashboard: Get Profile HTML
	 */
	public function ajax_get_dashboard_profile()
	{
		check_ajax_referer('seamless_nonce', 'nonce');

		if (!is_user_logged_in()) {
			wp_send_json_error(['message' => 'User not logged in']);
		}

		$user_profile = new \Seamless\Operations\UserProfile();
		$profileResult = $user_profile->get_user_profile();

		$profile = [];
		if ($profileResult['success']) {
			$profile = $profileResult['data'];
		} else {
			// Fallback to WP user data if API fails to minimal display
			$user = wp_get_current_user();
			$profile = [
				'first_name' => $user->first_name,
				'last_name' => $user->last_name,
				'email' => $user->user_email,
				'name' => $user->display_name
			];
		}

		$widget_id = sanitize_text_field($_POST['widget_id'] ?? 'default');

		ob_start();
		include $this->seamless_get_template('tpl-dashboard-profile.php');
		$html = ob_get_clean();

		wp_send_json_success(['html' => $html]);
	}

	/**
	 * Async Dashboard: Get Memberships HTML
	 */
	public function ajax_get_dashboard_memberships()
	{
		check_ajax_referer('seamless_nonce', 'nonce');

		if (!is_user_logged_in()) {
			wp_send_json_error(['message' => 'User not logged in']);
		}

		$user = wp_get_current_user();
		$email = $user->user_email;

		$user_profile = new \Seamless\Operations\UserProfile();
		$membershipResult = $user_profile->get_user_memberships($email);
		$organizationResult = $user_profile->get_user_organization($email);

		$current_memberships = [];
		$membership_history = [];
		$my_membership_meta = [];

		if ($membershipResult['success']) {
			$current_memberships = $membershipResult['data']['current'] ?? [];
			$membership_history = $membershipResult['data']['history'] ?? [];
		}

		if (!empty($organizationResult['success']) && !empty($organizationResult['data']['my_memberships'])) {
			foreach ((array) $organizationResult['data']['my_memberships'] as $my_membership) {
				$linked_membership_id = (string) ($my_membership['membership']['id'] ?? '');
				if (empty($linked_membership_id)) {
					continue;
				}

				$my_membership_meta[$linked_membership_id] = [
					'has_requested_removal' => !empty($my_membership['has_requested_removal']),
					'removal_requested_at' => $my_membership['removal_requested_at'] ?? '',
					'group_membership_record_id' => $my_membership['id'] ?? '',
				];
			}
		}

		if (!empty($my_membership_meta)) {
			foreach ($current_memberships as &$membership) {
				$membership_id = (string) ($membership['id'] ?? '');
				if (empty($membership_id) || empty($my_membership_meta[$membership_id])) {
					continue;
				}

				$membership = array_merge($membership, $my_membership_meta[$membership_id]);
			}
			unset($membership);
		}

		ob_start();
		include $this->seamless_get_template('tpl-dashboard-memberships.php');
		$html = ob_get_clean();

		wp_send_json_success(['html' => $html]);
	}

	/**
	 * Async Dashboard: Get Courses HTML
	 */
	public function ajax_get_dashboard_courses()
	{
		check_ajax_referer('seamless_nonce', 'nonce');

		if (!is_user_logged_in()) {
			wp_send_json_error(['message' => 'User not logged in']);
		}

		$user_profile = new \Seamless\Operations\UserProfile();

		// Fetch both concurrently? No, standard PHP blocking. But separate from other dashboard parts.
		$enrolled_result = $user_profile->get_enrolled_courses();
		$included_result = $user_profile->get_included_courses();

		$enrolled_courses = $enrolled_result['success'] ? ($enrolled_result['data'] ?? []) : [];
		$included_courses = $included_result['success'] ? ($included_result['data'] ?? []) : [];

		// Need profile email for progress fetching inside template
		$user = wp_get_current_user();
		$profile = ['email' => $user->user_email];
		$client_domain = rtrim(get_option('seamless_client_domain', ''), '/');

		ob_start();
		include $this->seamless_get_template('tpl-dashboard-courses.php');
		$html = ob_get_clean();

		wp_send_json_success(['html' => $html]);
	}

	/**
	 * Async Dashboard: Get Orders HTML
	 */
	public function ajax_get_dashboard_orders()
	{
		check_ajax_referer('seamless_nonce', 'nonce');

		if (!is_user_logged_in()) {
			wp_send_json_error(['message' => 'User not logged in']);
		}

		$user = wp_get_current_user();
		$email = $user->user_email;

		$user_profile = new \Seamless\Operations\UserProfile();
		$ordersResult = $user_profile->get_user_orders($email);

		$orders = $ordersResult['success'] ? ($ordersResult['data'] ?? []) : [];
		$client_domain = rtrim(get_option('seamless_client_domain', ''), '/');

		// Get orders_per_page from POST request (sent by JS), default to 6
		$orders_per_page = isset($_POST['orders_per_page']) ? (int)$_POST['orders_per_page'] : 6;

		ob_start();
		include $this->seamless_get_template('tpl-dashboard-orders.php');
		$html = ob_get_clean();

		wp_send_json_success(['html' => $html]);
	}

	/**
	 * Async Dashboard: Get Organization HTML
	 */
	public function ajax_get_dashboard_organization()
	{
		check_ajax_referer('seamless_nonce', 'nonce');

		if (!is_user_logged_in()) {
			wp_send_json_error(['message' => 'User not logged in']);
		}

		$user = wp_get_current_user();
		$email = $user->user_email;

		$user_profile = new \Seamless\Operations\UserProfile();
		$orgResult = $user_profile->get_user_organization($email);

		$organization = [];
		$group_memberships = [];
		$my_memberships = [];

		if ($orgResult['success'] && !empty($orgResult['data'])) {
			$organization = $orgResult['data']['organization'] ?? [];
			$group_memberships = $orgResult['data']['group_memberships'] ?? [];
			$my_memberships = $orgResult['data']['my_memberships'] ?? [];
		}

		ob_start();
		include $this->seamless_get_template('tpl-dashboard-organization.php');
		$html = ob_get_clean();

		wp_send_json_success(['html' => $html]);
	}

	/**
	 * AJAX: Resend group membership invite
	 */
	public function ajax_resend_group_invite()
	{
		check_ajax_referer('seamless_resend_invite', 'nonce');

		if (!is_user_logged_in()) {
			wp_send_json_error(['message' => 'User not logged in']);
		}

		$membership_id = sanitize_text_field($_POST['membership_id'] ?? '');
		$member_id = sanitize_text_field($_POST['member_id'] ?? '');

		if (empty($membership_id) || empty($member_id)) {
			wp_send_json_error(['message' => 'Missing membership or member ID']);
		}

		$user_profile = new \Seamless\Operations\UserProfile();
		$result = $user_profile->resend_group_invite($membership_id, $member_id);

		if ($result['success']) {
			wp_send_json_success(['message' => $result['message'], 'data' => $result['data']]);
		} else {
			wp_send_json_error(['message' => $result['message']]);
		}
	}

	/**
	 * AJAX: Add group members
	 */
	public function ajax_add_group_members()
	{
		check_ajax_referer('seamless_add_group_members', 'nonce');

		if (!is_user_logged_in()) {
			wp_send_json_error(['message' => 'User not logged in']);
		}

		$membership_id = sanitize_text_field($_POST['membership_id'] ?? '');
		$members_json = stripslashes($_POST['members'] ?? '[]');
		$members = json_decode($members_json, true);

		if (empty($membership_id) || !is_array($members) || empty($members)) {
			wp_send_json_error(['message' => 'Missing data or invalid members format']);
		}

		// Sanitize member data
		$sanitized_members = [];
		foreach ($members as $member) {
			$sanitized_members[] = [
				'email' => sanitize_email($member['email'] ?? ''),
				'first_name' => sanitize_text_field($member['first_name'] ?? ''),
				'last_name' => sanitize_text_field($member['last_name'] ?? ''),
				'role' => sanitize_text_field($member['role'] ?? 'member'),
			];
		}

		$user_profile = new \Seamless\Operations\UserProfile();
		$result = $user_profile->add_group_members($membership_id, $sanitized_members);

		if ($result['success']) {
			wp_send_json_success(['message' => $result['message'], 'data' => $result['data']]);
		} else {
			wp_send_json_error(['message' => $result['message']]);
		}
	}

	/**
	 * AJAX: Remove group member
	 */
	public function ajax_remove_group_member()
	{
		check_ajax_referer('seamless_remove_group_member', 'nonce');

		if (!is_user_logged_in()) {
			wp_send_json_error(['message' => 'User not logged in']);
		}

		$membership_id = sanitize_text_field($_POST['membership_id'] ?? '');
		$member_id = sanitize_text_field($_POST['member_id'] ?? '');

		if (empty($membership_id) || empty($member_id)) {
			wp_send_json_error(['message' => 'Missing membership or member ID']);
		}

		$user_profile = new \Seamless\Operations\UserProfile();
		$result = $user_profile->remove_group_member($membership_id, $member_id);

		if ($result['success']) {
			wp_send_json_success(['message' => $result['message'], 'data' => $result['data']]);
		} else {
			wp_send_json_error(['message' => $result['message']]);
		}
	}

	/**
	 * AJAX: Change group member role
	 */
	public function ajax_change_member_role()
	{
		check_ajax_referer('seamless_change_member_role', 'nonce');

		if (!is_user_logged_in()) {
			wp_send_json_error(['message' => 'User not logged in']);
		}

		$membership_id = sanitize_text_field($_POST['membership_id'] ?? '');
		$member_id     = sanitize_text_field($_POST['member_id'] ?? '');
		$role          = sanitize_text_field($_POST['role'] ?? '');

		if (empty($membership_id) || empty($member_id) || empty($role)) {
			wp_send_json_error(['message' => 'Missing required fields']);
		}

		$user_profile = new \Seamless\Operations\UserProfile();
		$result = $user_profile->change_member_role($membership_id, $member_id, $role);

		if ($result['success']) {
			wp_send_json_success(['message' => $result['message']]);
		} else {
			wp_send_json_error(['message' => $result['message']]);
		}
	}
}
