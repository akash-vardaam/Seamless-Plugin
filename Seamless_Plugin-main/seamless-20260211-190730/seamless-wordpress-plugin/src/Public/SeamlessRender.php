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
		add_action('wp_ajax_seamless_upgrade_membership', [$this, 'ajax_upgrade_membership']);
		add_action('wp_ajax_seamless_downgrade_membership', [$this, 'ajax_downgrade_membership']);
		add_action('wp_ajax_seamless_cancel_membership', [$this, 'ajax_cancel_membership']);
		add_action('wp_ajax_seamless_renew_membership', [$this, 'ajax_renew_membership']);
		add_action('wp_ajax_seamless_cancel_scheduled_change', [$this, 'ajax_cancel_scheduled_change']);
		add_action('wp_ajax_seamless_update_profile', [$this, 'ajax_update_profile']);

		// Dashboard Async Loading Hooks
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
						$styles['--seamless-primary-color'] = $palette[0]['color'] ?? '#26337a';
						$styles['--seamless-secondary-color'] = $palette[1]['color'] ?? $styles['--seamless-primary-color'];
						$styles['--seamless-accent-color'] = $palette[2]['color'] ?? $styles['--seamless-secondary-color'];
						$styles['--seamless-text-color'] = $palette[3]['color'] ?? '#222';

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

	private function normalize_css_dimension($value): ?string
	{
		if (is_array($value)) {
			$size = $value['size'] ?? null;
			$unit = $value['unit'] ?? 'px';

			if ($size === null || $size === '') {
				return null;
			}

			return $this->normalize_css_dimension($size . $unit);
		}

		if (is_numeric($value)) {
			$size = (float) $value;
			return $size > 0 ? rtrim(rtrim((string) $size, '0'), '.') . 'px' : null;
		}

		if (!is_string($value)) {
			return null;
		}

		$value = trim($value);
		if ($value === '') {
			return null;
		}

		return preg_match('/^-?\d+(?:\.\d+)?(?:px|rem|em|vw|vh|%)$/i', $value) ? $value : null;
	}

	private function get_elementor_container_max_width(): ?string
	{
		if (!class_exists('\Elementor\Plugin') || !isset(Plugin::$instance->kits_manager)) {
			return null;
		}

		try {
			$kit_manager = Plugin::$instance->kits_manager;
			$kit = null;

			if (method_exists($kit_manager, 'get_active_kit_for_frontend')) {
				$kit = $kit_manager->get_active_kit_for_frontend();
			}

			if (!$kit && method_exists($kit_manager, 'get_active_kit')) {
				$kit = $kit_manager->get_active_kit();
			}

			if (!$kit) {
				return null;
			}

			$candidates = [];

			if (method_exists($kit, 'get_settings_for_display')) {
				$candidates[] = $kit->get_settings_for_display('container_width');
			}

			if (method_exists($kit, 'get_frontend_settings')) {
				$frontend_settings = $kit->get_frontend_settings();
				$candidates[] = $frontend_settings['container_width'] ?? null;
			}

			if (method_exists($kit, 'get_settings')) {
				$settings = $kit->get_settings();
				$candidates[] = $settings['container_width'] ?? null;
			}

			foreach ($candidates as $candidate) {
				$normalized = $this->normalize_css_dimension($candidate);
				if ($normalized) {
					return $normalized;
				}
			}
		} catch (\Throwable $e) {
			return null;
		}

		return null;
	}

	private function get_react_container_max_width(): string
	{
		$fallback = '80rem';
		$elementor_width = $this->get_elementor_container_max_width();
		if ($elementor_width) {
			return $elementor_width;
		}

		$has_elementor = class_exists('\Elementor\Plugin');
		if ($has_elementor) {
			// Elementor's own default content width is 1140px.
			// Avoid falling back to WordPress theme.json contentSize, which is often 800px
			// and does not match Elementor layouts.
			return '1140px';
		}

		if (function_exists('wp_get_global_settings')) {
			$global_content_width = wp_get_global_settings(['layout', 'contentSize']);
			$normalized = $this->normalize_css_dimension($global_content_width);
			if ($normalized) {
				return $normalized;
			}
		}

		global $content_width;
		$normalized = $this->normalize_css_dimension($content_width ?? null);
		if ($normalized) {
			return $normalized;
		}

		$normalized = $this->normalize_css_dimension(get_theme_mod('content_width'));
		if ($normalized) {
			return $normalized;
		}

		return $fallback;
	}

	public function enqueue_seamless_assets()
	{
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
	}

	public function add_module_type_attribute($tag, $handle, $src)
	{
		if (!wp_script_is($handle, 'registered') && !wp_script_is($handle, 'enqueued')) {
			return $tag;
		}

		// Add your bundled script handle if you need module type
		if (in_array($handle, ['seamless-toast-ui-calendar-js', 'seamless-vite-main-js', 'seamless-react-js'])) {
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
		$container_max_width = $this->get_react_container_max_width();
		$list_view_layout = get_option('seamless_list_view_layout', 'option_1');
		?>
		<meta name="wordpress-site-url" content="<?php echo esc_url(home_url()); ?>" />
		<meta name="rest-api-base-url" content="<?php echo esc_url(rest_url()); ?>" />
		<script>
			window.seamlessReactConfig = {
				siteUrl: '<?php echo esc_url(home_url()); ?>',
				restUrl: '<?php echo esc_url(rest_url()); ?>',
				nonce: '<?php echo wp_create_nonce('seamless'); ?>',
				ajaxUrl: '<?php echo esc_url(admin_url('admin-ajax.php')); ?>',
				ajaxNonce: '<?php echo wp_create_nonce('seamless_nonce'); ?>',
				clientDomain: '<?php echo esc_js(rtrim(get_option('seamless_client_domain', ''), '/')); ?>',
				listViewLayout: '<?php echo esc_js($list_view_layout); ?>',
				containerMaxWidth: '<?php echo esc_js($container_max_width); ?>',
				isLoggedIn: <?php echo is_user_logged_in() ? 'true' : 'false'; ?>,
				userEmail: '<?php echo is_user_logged_in() ? esc_js(wp_get_current_user()->user_email) : ''; ?>',
				logoutUrl: '<?php echo is_user_logged_in() ? esc_js(wp_logout_url(home_url())) : ''; ?>'
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

		// Backward-compatible aliases now point to React implementations.
		add_shortcode('seamless_event_list', [$this, 'shortcode_react_events_list']);
		add_shortcode('seamless_single_event', [$this, 'shortcode_react_single_event']);
		add_shortcode('seamless_user_dashboard', [$this, 'shortcode_react_dashboard']);
		add_shortcode('seamless_events', [$this, 'shortcode_react_events_list']);
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// React Shortcode Renderers
	// Each shortcode mounts one independent React root on the page.
	// The React app detects `data-seamless-view` and renders the correct component.
	// ─────────────────────────────────────────────────────────────────────────────

	/**
	 * Helper: enqueue the React build assets once per page load.
	 * Called by every React shortcode renderer to ensure the JS/CSS are loaded.
	 */
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
			error_log('Seamless React: build folder not found at ' . $dist_folder);
			return;
		}

		$assets_folder = $dist_folder . 'assets/';
		if (!is_dir($assets_folder)) {
			error_log('Seamless React: assets sub-folder not found at ' . $assets_folder);
			return;
		}

		$files = scandir($assets_folder);

		// Enqueue CSS
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

		// Enqueue JS (loaded as module so React 19 ESM bundles work)
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
		$container_max_width = $this->get_react_container_max_width();
		$list_view_layout = get_option('seamless_list_view_layout', 'option_1');

		// Pass WordPress config to the React app
		wp_localize_script('seamless-react-js', 'seamlessReactConfig', [
			'siteUrl' => esc_url(home_url()),
			'restUrl' => esc_url(rest_url()),
			'nonce' => wp_create_nonce('seamless'),
			'ajaxUrl' => admin_url('admin-ajax.php'),
			'ajaxNonce' => wp_create_nonce('seamless_nonce'),
			'clientDomain' => $client_domain,
			'listViewLayout' => $list_view_layout,
			'containerMaxWidth' => $container_max_width,
			'isLoggedIn' => is_user_logged_in(),
			'userEmail' => is_user_logged_in() ? wp_get_current_user()->user_email : '',
			// Query-param logout: works without needing rewrite rules flushed.
			'logoutUrl' => is_user_logged_in()
				? add_query_arg('sso_logout_redirect', '1', home_url('/'))
				: '',
			// Whether the current WP user has a valid SSO token stored.
			// React uses this to decide whether to show a "Connect SSO" prompt.
			'hasSsoToken' => is_user_logged_in()
				? !empty(get_user_meta(get_current_user_id(), 'seamless_access_token', true))
				: false,
		]);

		wp_add_inline_script(
			'seamless-react-js',
			<<<'JS'
window.addEventListener('DOMContentLoaded', () => {
	const calendarProto = window.SeamlessCalendar?.prototype;
	if (!calendarProto || typeof calendarProto.loadEvents !== 'function' || calendarProto.__seamlessAllSortPatched) {
		return;
	}

	const originalLoadEvents = calendarProto.loadEvents;
	calendarProto.loadEvents = async function (...args) {
		const filterElements = this.getFilterElements?.();
		if (filterElements?.$sortBy?.length) {
			const rawSort = filterElements.$sortBy.val();
			if (rawSort === null || rawSort === undefined || String(rawSort).trim() === '') {
				this.currentFilters = {
					...this.currentFilters,
					sort: 'all',
				};
			}
		}

		return await originalLoadEvents.apply(this, args);
	};

	calendarProto.__seamlessAllSortPatched = true;
});
JS,
			'after'
		);
	}

	/**
	 * Helper: generate the mount-point HTML for a React shortcode.
	 *
	 * @param string $view   The value of data-seamless-view (matches App.tsx VIEW_ROUTES keys).
	 * @param array  $extras Extra data attributes to pass to the React app.
	 * @return string
	 */
	private function react_mount_html(string $view, array $extras = []): string
	{
		$this->enqueue_react_assets();

		$data_attrs = 'data-seamless-view="' . esc_attr($view) . '"';
		$data_attrs .= ' data-site-url="' . esc_url(home_url()) . '"';
		$data_attrs .= ' data-container-max-width="' . esc_attr($this->get_react_container_max_width()) . '"';

		if ($view === 'single-event') {
			if (isset($extras['seamless-slug'])) {
				$data_attrs .= ' data-event-slug="' . esc_attr((string) $extras['seamless-slug']) . '"';
			}
			if (isset($extras['seamless-type'])) {
				$data_attrs .= ' data-event-type="' . esc_attr((string) $extras['seamless-type']) . '"';
			}
		}

		foreach ($extras as $key => $value) {
			$data_attrs .= ' data-' . esc_attr($key) . '="' . esc_attr($value) . '"';
		}

		// Each shortcode gets a unique ID so multiple can coexist on one page.
		$uid = 'seamless-react-' . $view . '-' . uniqid();

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

	// ── Shortcode: Events Listing ────────────────────────────────────────────

	/**
	 * [seamless_events_list] / [seamless_event_list] / [seamless_events]
	 * Renders the React-powered Events Listing page.
	 */
	public function shortcode_react_events_list($atts = []): string
	{
		if (!$this->auth->is_authenticated()) {
			return $this->get_authentication_required_message();
		}
		return $this->react_mount_html('events');
	}

	// ── Shortcode: Single Event ──────────────────────────────────────────────

	/**
	 * [seamless_single_event slug="my-event-slug" type="event|group_event"]
	 * Renders the React-powered Single Event page.
	 *
	 */
	public function shortcode_react_single_event($atts = []): string
	{
		if (!$this->auth->is_authenticated()) {
			return $this->get_authentication_required_message();
		}

		$atts = shortcode_atts([
			'slug' => '',
			'type' => 'event',
		], $atts, 'seamless_single_event');

		$slug = sanitize_text_field($atts['slug']);
		$type = sanitize_text_field($atts['type']);

		return $this->react_mount_html('single-event', [
			'seamless-slug' => $slug,
			'seamless-type' => $type,
		]);
	}

	// ── Shortcode: Memberships ───────────────────────────────────────────────

	/**
	 * [seamless_memberships]
	 * Renders the React-powered Membership plans page.
	 */
	public function shortcode_react_memberships($atts = []): string
	{
		if (!$this->auth->is_authenticated()) {
			return $this->get_authentication_required_message();
		}
		return $this->react_mount_html('memberships');
	}

	// ── Shortcode: Courses ───────────────────────────────────────────────────

	/**
	 * [seamless_courses]
	 * Renders the React-powered Courses page.
	 */
	public function shortcode_react_courses($atts = []): string
	{
		if (!$this->auth->is_authenticated()) {
			return $this->get_authentication_required_message();
		}
		return $this->react_mount_html('courses');
	}

	// ── Shortcode: Dashboard ─────────────────────────────────────────────────

	/**
	 * [seamless_dashboard] / [seamless_user_dashboard]
	 * Renders the React-powered User Dashboard.
	 * Requires the user to be logged in; shows a login prompt otherwise.
	 */
	public function shortcode_react_dashboard($atts = []): string
	{
		if (!is_user_logged_in()) {
			$login_button = do_shortcode('[seamless_login_button text="Sign in to view your dashboard" class="seamless-premium-btn seamless-login-btn"]');
			return sprintf(
				'<div class="seamless-dashboard-login-state"><div class="seamless-dashboard-login-panel"><p class="seamless-dashboard-login-copy">%s</p>%s</div></div>',
				esc_html__('Please log in to view your dashboard.', 'seamless-addon'),
				$login_button
			);
		}

		// Dashboard API calls require a valid Seamless OAuth token (Bearer auth).
		// WP users who are logged in natively (e.g. administrators who never completed
		// the SSO OAuth flow) have no token stored, so every dashboard API call
		// would return 401.  Show a clear "Connect SSO Account" prompt instead of
		// mounting a blank/broken dashboard.
		$uid = get_current_user_id();
		$has_sso_token = !empty(get_user_meta($uid, 'seamless_access_token', true));

		if (!$has_sso_token) {
			$connect_url = add_query_arg('sso_login_redirect', '1', home_url('/'));
			return sprintf(
				'<div class="seamless-sso-connect-wrapper">
					<div class="seamless-sso-connect-icon" style="display: inline;">
						<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
							<polyline points="10 17 15 12 10 7"/>
							<line x1="15" y1="12" x2="3" y2="12"/>
						</svg>
					</div>
					<h3 class="seamless-sso-connect-title" style="display: inline;">Connect Your Seamless Account</h3>
					<p class="seamless-sso-connect-text">Your WordPress account is not yet linked to a Seamless SSO session. Please sign in with Seamless to access your dashboard.</p>
					<a href="%s" class="seamless-sso-connect-btn">Sign in with Seamless</a>
				</div>',
				esc_url($connect_url)
			);
		}

		return $this->react_mount_html('dashboard');
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

	public function ajax_change_member_role()
	{
		check_ajax_referer('seamless_change_member_role', 'nonce');

		if (!is_user_logged_in()) {
			wp_send_json_error(['message' => 'User not logged in']);
		}

		$membership_id = sanitize_text_field($_POST['membership_id'] ?? '');
		$member_id = sanitize_text_field($_POST['member_id'] ?? '');
		$role = sanitize_text_field($_POST['role'] ?? '');

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

	/**
	 * Secure API Proxy for Sensitive Dashboard Requests
	 * 
	 * This method acts as a bridge between the React frontend and the AMS API.
	 * It forwards requests using a backend-stored token, ensuring no sensitive
	 * credentials ever touch the browser for dashboard operations.
	 *
	 * Admin-user handling:
	 * - WordPress admins are logged in via WP natively (no SSO OAuth flow).
	 * - They have no seamless_access_token in user meta.
	 * - For them we fall back to a service-level lookup using X-User-Email +
	 *   X-Portal-Secret so the dashboard still works without forcing them
	 *   through the OAuth login flow.
	 */
	public function ajax_api_proxy(): void
	{
		// Nonce check — non-fatal for admins.
		// In the WP admin context the nonce can be invalidated between page loads
		// (e.g. after Elementor saves, after settings pages, etc.) causing every
		// AJAX call to return 403 even though the user IS authenticated.
		// Admins are privileged users, so we allow them through regardless.
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

		// Security Check: Only allow dashboard-prefixed endpoints
		$check_path = ltrim($endpoint, '/');
		if (0 !== strpos($check_path, 'dashboard')) {
			wp_send_json_error(['message' => 'Unauthorized proxy target. Only dashboard endpoints are allowed via middleware.'], 403);
			return;
		}

		$uid = get_current_user_id();
		$sso = new \Seamless\Auth\SeamlessSSO();
		$token = $sso->seamless_refresh_token_if_needed($uid);
		$client_domain = rtrim(get_option('seamless_client_domain', ''), '/');

		// AMS /api/dashboard/* endpoints require a valid OAuth Bearer token.
		// The shortcode intercepts users without a token, but guard here too.
		if (!$token) {
			wp_send_json_error([
				'message' => 'No valid SSO session. Please sign in with Seamless.',
				'needs_sso_auth' => true,
			], 401);
			return;
		}

		$headers = [
			'Authorization' => 'Bearer ' . $token,
			'Accept' => 'application/json',
			'Content-Type' => 'application/json',
		];

		$url = $client_domain . '/api/' . $check_path;

		$args = [
			'method' => $method,
			'timeout' => 30,
			'sslverify' => false,
			'headers' => $headers,
		];

		if ($payload) {
			// Ensure it's valid JSON if it's already a string, or encode it
			$args['body'] = is_string($payload) ? $payload : json_encode($payload);
		}

		$response = wp_remote_request($url, $args);

		if (is_wp_error($response)) {
			wp_send_json_error(['message' => 'Proxy request failed: ' . $response->get_error_message()], 502);
			return;
		}

		$status = wp_remote_retrieve_response_code($response);
		$body = wp_remote_retrieve_body($response);
		$data = json_decode($body, true);

		// If the response from AMS is an error, pass it through so the UI can react
		if ($status >= 400) {
			wp_send_json_error($data ?: ['message' => $body], $status);
			return;
		}

		wp_send_json_success($data ?: $body, $status);
	}
}
