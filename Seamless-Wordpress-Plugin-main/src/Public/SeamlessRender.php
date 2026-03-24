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
		add_action('wp_ajax_seamless_upgrade_membership', [$this, 'ajax_upgrade_membership']);
		add_action('wp_ajax_seamless_downgrade_membership', [$this, 'ajax_downgrade_membership']);
		add_action('wp_ajax_seamless_cancel_membership', [$this, 'ajax_cancel_membership']);
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
		add_action('wp_ajax_seamless_api_proxy', [$this, 'ajax_api_proxy']);

		add_action('wp_head', [$this, 'enqueue_dynamic_styles']);
		add_action('wp_head', [$this, 'add_wordpress_config_meta_tags']);

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

			wp_localize_script('seamless-api-client-js', 'seamless_ajax', [
				'ajax_url' => admin_url('admin-ajax.php'),
				'nonce'    => wp_create_nonce('seamless_nonce'),
				'list_view_layout' => get_option('seamless_list_view_layout', 'option_1'),
				'api_domain' => rtrim(get_option('seamless_client_domain', ''), '/'),
				'single_event_endpoint' => get_option('seamless_single_event_endpoint', 'event'),
			]);
		}

	}

	public function add_module_type_attribute($tag, $handle, $src): mixed
	{
		if (!wp_script_is($handle, 'registered') && !wp_script_is($handle, 'enqueued')) {
			return $tag;
		}

		// Add your bundled script handle if you need module type
		if (in_array($handle, ['seamless-toast-ui-calendar-js', 'seamless-vite-main-js', 'seamless-react-js'], true)) {
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

	public function add_wordpress_config_meta_tags(): void
	{
		?>
		<meta name="wordpress-site-url" content="<?php echo esc_url(home_url()); ?>" />
		<meta name="rest-api-base-url" content="<?php echo esc_url(rest_url()); ?>" />
		<script>
			window.seamlessReactConfig = {
				siteUrl: '<?php echo esc_url(home_url()); ?>',
				restUrl: '<?php echo esc_url(rest_url()); ?>',
				singleEventEndpoint: '<?php echo esc_js(get_option('seamless_single_event_endpoint', 'event')); ?>',
				eventListEndpoint: '<?php echo esc_js(get_option('seamless_event_list_endpoint', 'events')); ?>',
				amsContentEndpoint: '<?php echo esc_js(get_option('seamless_ams_content_endpoint', 'ams-content')); ?>',
				nonce: '<?php echo wp_create_nonce('seamless'); ?>',
				ajaxUrl: '<?php echo esc_url(admin_url('admin-ajax.php')); ?>',
				ajaxNonce: '<?php echo wp_create_nonce('seamless_nonce'); ?>',
				clientDomain: '<?php echo esc_js(rtrim(get_option('seamless_client_domain', ''), '/')); ?>',
				isLoggedIn: <?php echo is_user_logged_in() ? 'true' : 'false'; ?>,
				userEmail: '<?php echo is_user_logged_in() ? esc_js(wp_get_current_user()->user_email) : ''; ?>',
				logoutUrl: '<?php echo is_user_logged_in() ? esc_js(add_query_arg('sso_logout_redirect', '1', home_url('/'))) : ''; ?>',
				hasSsoToken: <?php echo is_user_logged_in() && !empty(get_user_meta(get_current_user_id(), 'seamless_access_token', true)) ? 'true' : 'false'; ?>
			};
		</script>
		<?php
	}

	private function register_shortcodes(): void
	{
		add_shortcode('seamless_events_list', [$this, 'shortcode_react_events_list']);
		add_shortcode('seamless_memberships', [$this, 'shortcode_react_memberships']);
		add_shortcode('seamless_courses', [$this, 'shortcode_react_courses']);
		add_shortcode('seamless_dashboard', [$this, 'shortcode_react_dashboard']);
		add_shortcode('seamless_react_single_event', [$this, 'shortcode_react_single_event']);
		add_shortcode('seamless_event_list', [$this, 'shortcode_event_list']);
		add_shortcode('seamless_single_event', [$this, 'shortcode_single_event']);
		add_shortcode('seamless_user_dashboard', [$this, 'shortcode_user_dashboard']);
		add_shortcode('seamless_events', [$this, 'shortcode_custom_events']);
	}

	private function seamless_get_template($template_name): string
	{
		return locate_template($template_name) ?: plugin_dir_path(__FILE__) . 'templates/' . $template_name;
	}

	private function enqueue_react_assets(): void
	{
		static $react_assets_enqueued = false;
		if ($react_assets_enqueued) {
			return;
		}
		$react_assets_enqueued = true;

		$plugin_dir = plugin_dir_path(dirname(__DIR__));
		$plugin_url = plugin_dir_url(dirname(__DIR__));
		$dist_folder = $plugin_dir . 'src/Public/assets/react-build/dist/';
		$dist_url = $plugin_url . 'src/Public/assets/react-build/dist/';

		if (!is_dir($dist_folder)) {
			return;
		}

		$assets_folder = $dist_folder . 'assets/';
		if (!is_dir($assets_folder)) {
			return;
		}

		$files = scandir($assets_folder);
		if ($files === false) {
			return;
		}

		foreach ($files as $file) {
			if (strpos($file, 'index-') === 0 && $this->ends_with($file, '.css')) {
				$css_path = $assets_folder . $file;
				wp_enqueue_style(
					'seamless-react-css',
					$dist_url . 'assets/' . $file,
					[],
					filemtime($css_path)
				);
				break;
			}
		}

		foreach ($files as $file) {
			if (strpos($file, 'index-') === 0 && $this->ends_with($file, '.js')) {
				$js_path = $assets_folder . $file;
				wp_enqueue_script(
					'seamless-react-js',
					$dist_url . 'assets/' . $file,
					[],
					filemtime($js_path),
					true
				);
				break;
			}
		}

		$client_domain = rtrim(get_option('seamless_client_domain', ''), '/');
		if ($client_domain && strpos($client_domain, 'http') !== 0) {
			$client_domain = 'https://' . $client_domain;
		}

		wp_localize_script('seamless-react-js', 'seamlessReactConfig', [
			'siteUrl' => esc_url(home_url()),
			'restUrl' => esc_url(rest_url()),
			'singleEventEndpoint' => get_option('seamless_single_event_endpoint', 'event'),
			'eventListEndpoint' => get_option('seamless_event_list_endpoint', 'events'),
			'amsContentEndpoint' => get_option('seamless_ams_content_endpoint', 'ams-content'),
			'nonce' => wp_create_nonce('seamless'),
			'ajaxUrl' => admin_url('admin-ajax.php'),
			'ajaxNonce' => wp_create_nonce('seamless_nonce'),
			'clientDomain' => $client_domain,
			'isLoggedIn' => is_user_logged_in(),
			'userEmail' => is_user_logged_in() ? wp_get_current_user()->user_email : '',
			'logoutUrl' => is_user_logged_in() ? add_query_arg('sso_logout_redirect', '1', home_url('/')) : '',
			'hasSsoToken' => is_user_logged_in() ? !empty(get_user_meta(get_current_user_id(), 'seamless_access_token', true)) : false,
		]);
	}

	private function react_mount_html(string $view, array $extras = []): string
	{
		$this->enqueue_react_assets();

		$data_attrs = 'data-seamless-view="' . esc_attr($view) . '"';
		$data_attrs .= ' data-site-url="' . esc_url(home_url()) . '"';

		foreach ($extras as $key => $value) {
			$data_attrs .= ' data-' . esc_attr($key) . '="' . esc_attr($value) . '"';
		}

		$uid = 'seamless-react-' . $view . '-' . uniqid('', true);

		return sprintf(
			'<div id="%s" class="seamless-react-root" %s></div>',
			esc_attr($uid),
			$data_attrs
		);
	}

	private function ends_with($value, $suffix): bool
	{
		$suffix_length = strlen($suffix);
		if ($suffix_length === 0) {
			return true;
		}

		return substr($value, -$suffix_length) === $suffix;
	}

	public function shortcode_react_events_list($atts = []): string
	{
		if (!$this->auth->is_authenticated()) {
			return $this->get_authentication_required_message();
		}

		return $this->react_mount_html('events');
	}

	public function shortcode_react_single_event($atts = []): string
	{
		$atts = shortcode_atts([
			'slug' => '',
			'type' => 'event',
		], $atts, 'seamless_single_event');

		$slug = sanitize_text_field((string) $atts['slug']);
		if ($slug === '') {
			$slug = sanitize_text_field((string) get_query_var('event_uuid'));
		}
		if ($slug === '' && isset($_GET['seamless_event'])) {
			$slug = sanitize_text_field(wp_unslash((string) $_GET['seamless_event']));
		}

		$type = sanitize_text_field((string) $atts['type']);
		if ($type === '' && isset($_GET['type'])) {
			$type = sanitize_text_field(wp_unslash((string) $_GET['type']));
		}
		if ($type === '') {
			$type = 'event';
		}

		return $this->react_mount_html('single-event', [
			'seamless-slug' => $slug,
			'seamless-type' => $type,
		]);
	}

	public function shortcode_react_memberships($atts = []): string
	{
		if (!$this->auth->is_authenticated()) {
			return $this->get_authentication_required_message();
		}

		return $this->react_mount_html('memberships');
	}

	public function shortcode_react_courses($atts = []): string
	{
		if (!$this->auth->is_authenticated()) {
			return $this->get_authentication_required_message();
		}

		return $this->react_mount_html('courses');
	}

	public function shortcode_react_dashboard($atts = []): string
	{
		if (!is_user_logged_in()) {
			return do_shortcode('[seamless_login_button text="Sign in to view your dashboard" class="seamless-premium-btn seamless-login-btn"]');
		}

		$uid = get_current_user_id();
		$has_sso_token = !empty(get_user_meta($uid, 'seamless_access_token', true));
		if (!$has_sso_token) {
			$connect_url = add_query_arg('sso_login_redirect', '1', home_url('/'));
			return sprintf(
				'<div class="seamless-sso-connect-wrapper"><div class="seamless-sso-connect-icon" style="display: inline;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg></div><h3 class="seamless-sso-connect-title" style="display: inline;">Connect Your Seamless Account</h3><p class="seamless-sso-connect-text">Your WordPress account is not yet linked to a Seamless SSO session. Please sign in with Seamless to access your dashboard.</p><a href="%s" class="seamless-sso-connect-btn">Sign in with Seamless</a></div>',
				esc_url($connect_url)
			);
		}

		return $this->react_mount_html('dashboard');
	}

	public function shortcode_event_list($atts = []): string
	{
		return $this->shortcode_react_events_list($atts);
	}

	public function shortcode_single_event($atts): string
	{
		return $this->shortcode_react_single_event($atts);
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

		return $this->react_mount_html('events', [
			'seamless-shortcode-view' => sanitize_text_field((string) $atts['view']),
			'seamless-shortcode-category' => sanitize_text_field((string) $atts['category']),
			'seamless-shortcode-featured-image' => sanitize_text_field((string) $atts['featured_image']),
			'seamless-shortcode-limit' => (int) $atts['limit'],
			'seamless-shortcode-sort' => sanitize_text_field((string) $atts['sort']),
		]);
	}

	/**
	 * Shortcode: [seamless_user_dashboard]
	 * Displays a logged-in user's dashboard with Membership, Membership History,
	 * Order History and Profile tabs.
	 */
	public function shortcode_user_dashboard($atts = []): string
	{
		return $this->shortcode_react_dashboard($atts);
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
		wp_send_json_error([
			'message' => 'Legacy single event renderer has been removed. Use the React single event shortcode renderer instead.',
		], 410);
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

		$current_memberships = [];
		$membership_history = [];

		if ($membershipResult['success']) {
			$current_memberships = $membershipResult['data']['current'] ?? [];
			$membership_history = $membershipResult['data']['history'] ?? [];
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

	public function ajax_api_proxy(): void
	{
		$nonce_valid = check_ajax_referer('seamless_nonce', 'nonce', false);
		if (!$nonce_valid && !current_user_can('administrator')) {
			wp_send_json_error(['message' => 'Security check failed. Please refresh the page.'], 403);
			return;
		}

		if (!is_user_logged_in()) {
			wp_send_json_error(['message' => 'Unauthenticated access to dashboard API.'], 401);
			return;
		}

		$endpoint = isset($_POST['endpoint']) ? sanitize_text_field($_POST['endpoint']) : '';
		$method = isset($_POST['method']) ? strtoupper(sanitize_text_field($_POST['method'])) : 'GET';
		$payload = isset($_POST['payload']) ? wp_unslash($_POST['payload']) : null;

		if (empty($endpoint)) {
			wp_send_json_error(['message' => 'Missing proxy endpoint.'], 400);
			return;
		}

		$check_path = ltrim($endpoint, '/');
		if (strpos($check_path, 'dashboard') !== 0) {
			wp_send_json_error(['message' => 'Unauthorized proxy target. Only dashboard endpoints are allowed via middleware.'], 403);
			return;
		}

		$uid = get_current_user_id();
		$token = method_exists($this->sso, 'seamless_refresh_token_if_needed')
			? $this->sso->seamless_refresh_token_if_needed($uid)
			: get_user_meta($uid, 'seamless_access_token', true);
		$client_domain = rtrim(get_option('seamless_client_domain', ''), '/');

		if (!$token) {
			wp_send_json_error([
				'message' => 'No valid SSO session. Please sign in with Seamless.',
				'needs_sso_auth' => true,
			], 401);
			return;
		}

		$url = $client_domain . '/api/' . $check_path;
		$args = [
			'method' => $method,
			'timeout' => 30,
			'sslverify' => false,
			'headers' => [
				'Authorization' => 'Bearer ' . $token,
				'Accept' => 'application/json',
				'Content-Type' => 'application/json',
			],
		];

		if ($payload) {
			$args['body'] = is_string($payload) ? $payload : wp_json_encode($payload);
		}

		$response = wp_remote_request($url, $args);
		if (is_wp_error($response)) {
			wp_send_json_error(['message' => 'Proxy request failed: ' . $response->get_error_message()], 502);
			return;
		}

		$status = wp_remote_retrieve_response_code($response);
		$body = wp_remote_retrieve_body($response);
		$data = json_decode($body, true);

		if ($status >= 400) {
			wp_send_json_error($data ?: ['message' => $body], $status);
			return;
		}

		wp_send_json_success($data ?: $body, $status);
	}
}

