<?php

namespace SeamlessReact\Frontend;

use SeamlessReact\Auth\SeamlessAuth as Auth;
use SeamlessReact\Auth\SeamlessSSO  as SSO;
use SeamlessReact\Operations\UserProfile;

/**
 * Front-end renderer:
 *  – Enqueues React build assets (loaded from react-build/dist/)
 *  – Passes config to window.seamlessReactConfig via wp_localize_script
 *  – Mounts React views inside Shadow-DOM host divs via shortcodes
 *  – All AJAX handlers verified with wp_verify_nonce()
 */
class SeamlessRender {

	private Auth $auth;
	private SSO  $sso;

	public function __construct() {
		$this->auth = new Auth();
		$this->sso  = new SSO();

		// Only enqueue on the frontend, never in admin or during AJAX.
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_assets' ] );
		add_filter( 'script_loader_tag',  [ $this, 'maybe_add_module_type' ], 10, 3 );

		add_action( 'wp_head', [ $this, 'inject_dynamic_styles' ] );

		// Register all shortcodes
		$this->register_shortcodes();

		// AJAX handlers
		$this->register_ajax_hooks();
	}

	// ─── Asset enqueueing ─────────────────────────────────────────────────────

	public function enqueue_assets(): void {
		// Fonts
		wp_enqueue_style( 'seamless-react-montserrat',
			'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap',
			[], null
		);

		// Main React bundle
		$this->enqueue_react_build();
	}

	private function enqueue_react_build(): void {
		static $enqueued = false;
		if ( $enqueued ) {
			return;
		}
		$enqueued = true;

		$dist_dir = SEAMLESS_REACT_BUILD_DIR;
		$dist_url = SEAMLESS_REACT_BUILD_URL;

		if ( ! is_dir( $dist_dir ) ) {
			return;
		}

		$assets_dir = $dist_dir . 'assets/';
		if ( ! is_dir( $assets_dir ) ) {
			return;
		}

		$files = scandir( $assets_dir ) ?: [];

		// CSS
		foreach ( $files as $file ) {
			if ( str_starts_with( $file, 'index-' ) && str_ends_with( $file, '.css' ) ) {
				wp_enqueue_style(
					'seamless-react-app',
					$dist_url . 'assets/' . $file,
					[],
					filemtime( $assets_dir . $file )
				);
				break;
			}
		}

		// JS
		foreach ( $files as $file ) {
			if ( str_starts_with( $file, 'index-' ) && str_ends_with( $file, '.js' ) ) {
				wp_enqueue_script(
					'seamless-react-app',
					$dist_url . 'assets/' . $file,
					[],
					filemtime( $assets_dir . $file ),
					true
				);
				break;
			}
		}

		// Config object – passed as window.seamlessReactConfig
		$client_domain = rtrim( (string) get_option( 'seamless_client_domain', '' ), '/' );
		if ( $client_domain && ! str_starts_with( $client_domain, 'http' ) ) {
			$client_domain = 'https://' . $client_domain;
		}

		$uid        = get_current_user_id();
		$has_token  = $uid && ! empty( get_user_meta( $uid, 'seamless_react_access_token', true ) );

		wp_localize_script( 'seamless-react-app', 'seamlessReactConfig', [
			'siteUrl'             => esc_url( home_url() ),
			'restUrl'             => esc_url( rest_url() ),
			'ajaxUrl'             => esc_url( admin_url( 'admin-ajax.php' ) ),
			'nonce'               => wp_create_nonce( 'seamless_react' ),
			'ajaxNonce'           => wp_create_nonce( 'seamless_react_nonce' ),
			'clientDomain'        => esc_js( $client_domain ),
			'singleEventEndpoint' => esc_js( get_option( 'seamless_single_event_endpoint', 'event' ) ),
			'eventListEndpoint'   => esc_js( get_option( 'seamless_event_list_endpoint', 'events' ) ),
			'amsContentEndpoint'  => esc_js( get_option( 'seamless_ams_content_endpoint', 'ams-content' ) ),
			'listViewLayout'      => esc_js( get_option( 'seamless_list_view_layout', 'option_1' ) ),
			'isLoggedIn'          => is_user_logged_in(),
			'userEmail'           => is_user_logged_in() ? esc_js( wp_get_current_user()->user_email ) : '',
			'logoutUrl'           => is_user_logged_in() ? esc_url( add_query_arg( 'sso_react_logout', '1', home_url( '/' ) ) ) : '',
			'hasSsoToken'         => $has_token,
			'version'             => SEAMLESS_REACT_VERSION,
		] );
	}

	public function maybe_add_module_type( string $tag, string $handle, string $src ): string {
		if ( 'seamless-react-app' === $handle ) {
			return str_replace( '<script ', '<script type="module" ', $tag );
		}
		return $tag;
	}

	// ─── Dynamic styles (theme colour inheritance) ────────────────────────────

	public function inject_dynamic_styles(): void {
		$scheme = (string) get_option( 'seamless_color_scheme', 'theme' );
		$styles = [];

		if ( $scheme === 'plugin' ) {
			$styles['--seamless-primary']   = sanitize_hex_color( (string) get_option( 'seamless_primary_color',   '#26337a' ) );
			$styles['--seamless-secondary'] = sanitize_hex_color( (string) get_option( 'seamless_secondary_color', '#06b6d4' ) );
			$styles['--seamless-accent']    = $styles['--seamless-secondary'];
		} else {
			// Pull from Elementor if available, otherwise fallback to theme mods
			if ( function_exists( 'did_action' ) && did_action( 'elementor/loaded' ) ) {
				$styles = $this->get_elementor_colors();
			}
			if ( empty( $styles ) ) {
				$styles = $this->get_theme_mod_colors();
			}
		}

		if ( empty( $styles ) ) {
			return;
		}

		echo "<style id=\"seamless-react-dynamic-styles\">\n:root {\n";
		foreach ( $styles as $prop => $value ) {
			if ( $value ) {
				echo "\t" . esc_attr( $prop ) . ': ' . esc_attr( $value ) . ";\n";
			}
		}
		echo "}\n</style>\n";
	}

	private function get_elementor_colors(): array {
		$styles = [];
		try {
			$kit = \Elementor\Plugin::$instance->kits_manager->get_active_kit_for_frontend();
			foreach ( $kit->get_settings()['system_colors'] ?? [] as $c ) {
				$map = [
					'primary'   => '--seamless-primary',
					'secondary' => '--seamless-secondary',
					'accent'    => '--seamless-accent',
					'text'      => '--seamless-text',
				];
				if ( isset( $map[ $c['_id'] ] ) ) {
					$styles[ $map[ $c['_id'] ] ] = $c['color'];
				}
			}
		} catch ( \Throwable $e ) { // phpcs:ignore
		}
		return $styles;
	}

	private function get_theme_mod_colors(): array {
		$styles = [];
		$primary = get_theme_mod( 'primary_color' ) ?: get_theme_mod( 'heading_color' );
		if ( $primary ) {
			$styles['--seamless-primary'] = $primary;
		}
		$link = get_theme_mod( 'link_color' );
		if ( $link ) {
			$styles['--seamless-secondary'] = $link;
		}
		return $styles;
	}

	// ─── Shortcode registration ───────────────────────────────────────────────

	public function sc_dynamic_widget( array $atts = [], string $content = '', string $tag = '' ): string {
		$view = str_replace( 'seamless_react_', '', $tag );
		return $this->mount( $view, is_array( $atts ) ? $atts : [] );
	}

	private function register_shortcodes(): void {
		$map = [
			'seamless_react_events_list'   => 'sc_events_list',
			'seamless_react_events'        => 'sc_custom_events',
			'seamless_react_single_event'  => 'sc_single_event',
			'seamless_react_memberships'   => 'sc_memberships',
			'seamless_react_courses'       => 'sc_courses',
			'seamless_react_dashboard'                => 'sc_dashboard',
			'seamless_react_user_dashboard'           => 'sc_dashboard',
			
			// New single-event pieces mapped to dynamic widget handler
			'seamless_react_event_additional_details' => 'sc_dynamic_widget',
			'seamless_react_event_breadcrumbs'        => 'sc_dynamic_widget',
			'seamless_react_event_description'        => 'sc_dynamic_widget',
			'seamless_react_event_excerpt'            => 'sc_dynamic_widget',
			'seamless_react_event_featured_image'     => 'sc_dynamic_widget',
			'seamless_react_event_location'           => 'sc_dynamic_widget',
			'seamless_react_event_register_url'       => 'sc_dynamic_widget',
			'seamless_react_event_schedules'          => 'sc_dynamic_widget',
			'seamless_react_event_sidebar'            => 'sc_dynamic_widget',
			'seamless_react_event_tickets'            => 'sc_dynamic_widget',
			'seamless_react_event_title'              => 'sc_dynamic_widget',
			'seamless_react_membership_compare'       => 'sc_dynamic_widget',
			'seamless_react_membership_compare_plans' => 'sc_dynamic_widget',
			'seamless_react_memberships_list'         => 'sc_dynamic_widget',
			'seamless_react_courses_list'             => 'sc_dynamic_widget',

			// Legacy aliases
			'seamless_event_list'                     => 'sc_events_list',
			'seamless_single_event'                   => 'sc_single_event',
			'seamless_user_dashboard'                 => 'sc_dashboard',
		];

		foreach ( $map as $tag => $method ) {
			add_shortcode( $tag, [ $this, $method ] );
		}
	}

	// ─── Shortcode handlers ───────────────────────────────────────────────────

	public function sc_events_list( array $atts = [] ): string {
		if ( ! class_exists( '\Seamless\Auth\SeamlessAuth' ) || ! \Seamless\Auth\SeamlessAuth::is_authenticated() ) {
			return $this->auth_required_msg();
		}
		
		// Ensure $atts is an array for safety when mapping Elementor props
		$atts = is_array($atts) ? $atts : [];

		return $this->mount( 'events', $atts );
	}

	public function sc_custom_events( array $atts = [] ): string {
		if ( ! $this->auth->is_authenticated() ) {
			return $this->auth_required_msg();
		}
		$atts = shortcode_atts( [
			'view'           => 'list',
			'category'       => '',
			'featured_image' => 'true',
			'limit'          => 0,
			'sort'           => 'all',
		], $atts, 'seamless_react_events' );

		return $this->mount( 'events', [
			'shortcode-view'           => sanitize_text_field( (string) $atts['view'] ),
			'shortcode-category'       => sanitize_text_field( (string) $atts['category'] ),
			'shortcode-featured-image' => sanitize_text_field( (string) $atts['featured_image'] ),
			'shortcode-limit'          => (int) $atts['limit'],
			'shortcode-sort'           => sanitize_text_field( (string) $atts['sort'] ),
		] );
	}

	public function sc_single_event( array $atts = [] ): string {
		$atts = shortcode_atts( [
			'slug' => '',
			'type' => 'event',
		], $atts, 'seamless_react_single_event' );

		$slug = sanitize_text_field( (string) $atts['slug'] )
			?: sanitize_text_field( (string) get_query_var( 'seamless_react_slug' ) )
			?: sanitize_text_field( wp_unslash( (string) ( $_GET['seamless_event'] ?? '' ) ) );

		$type = sanitize_text_field( (string) $atts['type'] )
			?: sanitize_text_field( wp_unslash( (string) ( $_GET['type'] ?? '' ) ) )
			?: 'event';

		return $this->mount( 'single-event', [
			'slug' => $slug,
			'type' => $type,
		] );
	}

	public function sc_memberships( array $atts = [] ): string {
		if ( ! class_exists( '\Seamless\Auth\SeamlessAuth' ) || ! \Seamless\Auth\SeamlessAuth::is_authenticated() ) {
			return $this->auth_required_msg();
		}
		
		// Ensure $atts is an array for safety when mapping Elementor props
		$atts = is_array($atts) ? $atts : [];
		return $this->mount( 'memberships', $atts );
	}

	public function sc_courses( array $atts = [] ): string {
		if ( ! class_exists( '\Seamless\Auth\SeamlessAuth' ) || ! \Seamless\Auth\SeamlessAuth::is_authenticated() ) {
			return $this->auth_required_msg();
		}
		
		// Ensure $atts is an array for safety when mapping Elementor props
		$atts = is_array($atts) ? $atts : [];
		return $this->mount( 'courses', $atts );
	}

	public function sc_dashboard( array $atts = [] ): string {
		if ( ! is_user_logged_in() ) {
			return do_shortcode( '[seamless_react_login_button text="Sign in to view your dashboard" class="seamless-react-btn seamless-react-login-btn"]' );
		}

		$uid       = get_current_user_id();
		$has_token = ! empty( get_user_meta( $uid, 'seamless_react_access_token', true ) );

		if ( ! $has_token ) {
			$connect_url = add_query_arg( 'sso_react_login', '1', home_url( '/' ) );
			return sprintf(
				'<div class="seamless-react-sso-connect">
					<h3>%s</h3>
					<p>%s</p>
					<a href="%s" class="seamless-react-btn">%s</a>
				</div>',
				esc_html__( 'Connect Your Seamless Account', 'seamless-react' ),
				esc_html__( 'Your account is not yet linked to a Seamless SSO session. Please sign in with Seamless to access your dashboard.', 'seamless-react' ),
				esc_url( $connect_url ),
				esc_html__( 'Sign in with Seamless', 'seamless-react' )
			);
		}

		return $this->mount( 'dashboard' );
	}

	// ─── Shadow-DOM mount helper ──────────────────────────────────────────────

	/**
	 * Renders a <div> that React will use as a Shadow DOM host.
	 * The React bootstrap code attaches a shadow root to this element and
	 * injects all styles + the component tree inside it.
	 *
	 * @param string $view   Vue identifier passed as data-seamless-view
	 * @param array  $extras Extra data-* attributes
	 */
	private function mount( string $view, array $extras = [] ): string {
		$this->enqueue_react_build();

		$uid = 'seamless-react-' . $view . '-' . wp_generate_uuid4();

		$attrs  = 'data-seamless-view="' . esc_attr( $view ) . '"';
		$attrs .= ' data-site-url="' . esc_url( home_url() ) . '"';
		$attrs .= ' data-shadow="true"'; // Signal to React: use Shadow DOM

		foreach ( $extras as $key => $value ) {
			$attrs .= ' data-' . esc_attr( $key ) . '="' . esc_attr( (string) $value ) . '"';
		}

		return sprintf( '<div id="%s" class="seamless-react-mount" %s></div>', esc_attr( $uid ), $attrs );
	}

	private function auth_required_msg(): string {
		return '<div class="seamless-react-auth-required"><p>'
			. esc_html__( 'Please authenticate to fetch data. Open the Seamless plugin settings, enter your domain, and connect.', 'seamless-react' )
			. '</p></div>';
	}

	// ─── AJAX hooks ───────────────────────────────────────────────────────────

	private function register_ajax_hooks(): void {
		$actions = [
			'seamless_react_upgrade_membership'        => 'ajax_upgrade_membership',
			'seamless_react_downgrade_membership'      => 'ajax_downgrade_membership',
			'seamless_react_cancel_membership'         => 'ajax_cancel_membership',
			'seamless_react_renew_membership'          => 'ajax_renew_membership',
			'seamless_react_cancel_scheduled_change'   => 'ajax_cancel_scheduled_change',
			'seamless_react_update_profile'            => 'ajax_update_profile',
			'seamless_react_api_proxy'                 => 'ajax_api_proxy',
			'seamless_react_get_dashboard_profile'     => 'ajax_get_dashboard_profile',
			'seamless_react_get_dashboard_memberships' => 'ajax_get_dashboard_memberships',
			'seamless_react_get_dashboard_courses'     => 'ajax_get_dashboard_courses',
			'seamless_react_get_dashboard_orders'      => 'ajax_get_dashboard_orders',
			'seamless_react_get_dashboard_organization'=> 'ajax_get_dashboard_organization',
			'seamless_react_resend_group_invite'       => 'ajax_resend_group_invite',
			'seamless_react_add_group_members'         => 'ajax_add_group_members',
			'seamless_react_remove_group_member'       => 'ajax_remove_group_member',
			'seamless_react_change_member_role'        => 'ajax_change_member_role',
			'seamless_react_public_api_proxy'          => 'ajax_public_api_proxy',
		];

		foreach ( $actions as $action => $method ) {
			add_action( 'wp_ajax_' . $action, [ $this, $method ] );
		}

		// Allow public API proxy for guests
		add_action( 'wp_ajax_nopriv_seamless_react_public_api_proxy', [ $this, 'ajax_public_api_proxy' ] );
	}

	// ─── AJAX: membership actions ─────────────────────────────────────────────

	public function ajax_upgrade_membership(): void {
		check_ajax_referer( 'seamless_react_nonce', 'nonce' );
		$this->require_login();

		$new_plan_id   = sanitize_text_field( $_POST['new_plan_id']   ?? '' );
		$membership_id = sanitize_text_field( $_POST['membership_id'] ?? '' );
		$email         = sanitize_email(      $_POST['email']         ?? '' );

		if ( ! $new_plan_id || ! $email ) {
			wp_send_json_error( [ 'message' => 'Missing required parameters.' ] );
		}

		$profile = new UserProfile();
		$result  = $profile->upgrade_membership( $new_plan_id, $membership_id, $email );
		$result['success'] ? wp_send_json_success( $result ) : wp_send_json_error( $result );
	}

	public function ajax_downgrade_membership(): void {
		check_ajax_referer( 'seamless_react_nonce', 'nonce' );
		$this->require_login();

		$new_plan_id   = sanitize_text_field( $_POST['new_plan_id']   ?? '' );
		$membership_id = sanitize_text_field( $_POST['membership_id'] ?? '' );
		$email         = sanitize_email(      $_POST['email']         ?? '' );

		$profile = new UserProfile();
		$result  = $profile->downgrade_membership( $new_plan_id, $membership_id, $email );
		$result['success'] ? wp_send_json_success( $result ) : wp_send_json_error( $result );
	}

	public function ajax_cancel_membership(): void {
		check_ajax_referer( 'seamless_react_nonce', 'nonce' );
		$this->require_login();

		$membership_id = sanitize_text_field( $_POST['membership_id'] ?? '' );
		$email         = sanitize_email(      $_POST['email']         ?? '' );

		if ( ! $membership_id || ! $email ) {
			wp_send_json_error( [ 'message' => 'Missing required parameters.' ] );
		}

		$profile = new UserProfile();
		$result  = $profile->cancel_membership( $membership_id, $email );
		$result['success'] ? wp_send_json_success( $result ) : wp_send_json_error( $result );
	}

	public function ajax_renew_membership(): void {
		check_ajax_referer( 'seamless_react_nonce', 'nonce' );
		$this->require_login();

		$plan_id = sanitize_text_field( $_POST['plan_id'] ?? '' );
		$email   = sanitize_email(      $_POST['email']   ?? '' );

		$profile = new UserProfile();
		$result  = $profile->renew_membership( $plan_id, $email );
		$result['success'] ? wp_send_json_success( $result ) : wp_send_json_error( $result );
	}

	public function ajax_cancel_scheduled_change(): void {
		check_ajax_referer( 'seamless_react_nonce', 'nonce' );
		$this->require_login();

		$membership_id = sanitize_text_field( $_POST['membership_id'] ?? '' );
		$email         = sanitize_email(      $_POST['email']         ?? '' );

		$profile = new UserProfile();
		$result  = $profile->cancel_scheduled_change( $membership_id, $email );
		$result['success'] ? wp_send_json_success( $result ) : wp_send_json_error( $result );
	}

	public function ajax_update_profile(): void {
		check_ajax_referer( 'seamless_react_nonce', 'nonce' );
		$this->require_login();

		$email        = sanitize_email( $_POST['email'] ?? '' );
		$profile_data = $_POST['profile_data'] ?? [];

		if ( ! $email || empty( $profile_data ) ) {
			wp_send_json_error( [ 'message' => 'Missing required parameters.' ] );
		}

		$profile = new UserProfile();
		$result  = $profile->update_user_profile( $email, (array) $profile_data );
		$result['success'] ? wp_send_json_success( $result ) : wp_send_json_error( $result );
	}

	// ─── AJAX: dashboard data ─────────────────────────────────────────────────

	public function ajax_get_dashboard_profile(): void {
		check_ajax_referer( 'seamless_react_nonce', 'nonce' );
		$this->require_login();

		$profile = new UserProfile();
		$result  = $profile->get_user_profile();
		$result['success'] ? wp_send_json_success( $result['data'] ) : wp_send_json_error( $result );
	}

	public function ajax_get_dashboard_memberships(): void {
		check_ajax_referer( 'seamless_react_nonce', 'nonce' );
		$this->require_login();

		$email   = wp_get_current_user()->user_email;
		$profile = new UserProfile();
		$result  = $profile->get_user_memberships( $email );
		$result['success'] ? wp_send_json_success( $result['data'] ) : wp_send_json_error( $result );
	}

	public function ajax_get_dashboard_courses(): void {
		check_ajax_referer( 'seamless_react_nonce', 'nonce' );
		$this->require_login();

		$profile  = new UserProfile();
		$enrolled = $profile->get_enrolled_courses();
		$included = $profile->get_included_courses();

		wp_send_json_success( [
			'enrolled' => $enrolled['success'] ? $enrolled['data'] : [],
			'included' => $included['success'] ? $included['data'] : [],
		] );
	}

	public function ajax_get_dashboard_orders(): void {
		check_ajax_referer( 'seamless_react_nonce', 'nonce' );
		$this->require_login();

		$email   = wp_get_current_user()->user_email;
		$profile = new UserProfile();
		$result  = $profile->get_user_orders( $email );
		$result['success'] ? wp_send_json_success( $result['data'] ) : wp_send_json_error( $result );
	}

	public function ajax_get_dashboard_organization(): void {
		check_ajax_referer( 'seamless_react_nonce', 'nonce' );
		$this->require_login();

		$email   = wp_get_current_user()->user_email;
		$profile = new UserProfile();
		$result  = $profile->get_user_organization( $email );
		$result['success'] ? wp_send_json_success( $result['data'] ) : wp_send_json_error( $result );
	}

	// ─── AJAX: group management ───────────────────────────────────────────────

	public function ajax_resend_group_invite(): void {
		check_ajax_referer( 'seamless_react_nonce', 'nonce' );
		$this->require_login();

		$membership_id = sanitize_text_field( $_POST['membership_id'] ?? '' );
		$member_id     = sanitize_text_field( $_POST['member_id']     ?? '' );

		$profile = new UserProfile();
		$result  = $profile->resend_group_invite( $membership_id, $member_id );
		$result['success'] ? wp_send_json_success( $result ) : wp_send_json_error( $result );
	}

	public function ajax_add_group_members(): void {
		check_ajax_referer( 'seamless_react_nonce', 'nonce' );
		$this->require_login();

		$membership_id = sanitize_text_field( $_POST['membership_id'] ?? '' );
		$members_json  = stripslashes( $_POST['members'] ?? '[]' );
		$members       = json_decode( $members_json, true );

		if ( ! $membership_id || ! is_array( $members ) || empty( $members ) ) {
			wp_send_json_error( [ 'message' => 'Missing data.' ] );
		}

		$sanitized = [];
		foreach ( $members as $m ) {
			$sanitized[] = [
				'email'      => sanitize_email( $m['email']      ?? '' ),
				'first_name' => sanitize_text_field( $m['first_name'] ?? '' ),
				'last_name'  => sanitize_text_field( $m['last_name']  ?? '' ),
				'role'       => sanitize_text_field( $m['role']       ?? 'member' ),
			];
		}

		$profile = new UserProfile();
		$result  = $profile->add_group_members( $membership_id, $sanitized );
		$result['success'] ? wp_send_json_success( $result ) : wp_send_json_error( $result );
	}

	public function ajax_remove_group_member(): void {
		check_ajax_referer( 'seamless_react_nonce', 'nonce' );
		$this->require_login();

		$membership_id = sanitize_text_field( $_POST['membership_id'] ?? '' );
		$member_id     = sanitize_text_field( $_POST['member_id']     ?? '' );

		$profile = new UserProfile();
		$result  = $profile->remove_group_member( $membership_id, $member_id );
		$result['success'] ? wp_send_json_success( $result ) : wp_send_json_error( $result );
	}

	public function ajax_change_member_role(): void {
		check_ajax_referer( 'seamless_react_nonce', 'nonce' );
		$this->require_login();

		$membership_id = sanitize_text_field( $_POST['membership_id'] ?? '' );
		$member_id     = sanitize_text_field( $_POST['member_id']     ?? '' );
		$role          = sanitize_text_field( $_POST['role']          ?? '' );

		$profile = new UserProfile();
		$result  = $profile->change_member_role( $membership_id, $member_id, $role );
		$result['success'] ? wp_send_json_success( $result ) : wp_send_json_error( $result );
	}

	// ─── AJAX: secure API proxy ───────────────────────────────────────────────

	public function ajax_public_api_proxy(): void {
		$endpoint = sanitize_text_field( $_REQUEST['endpoint'] ?? '' );
		$clean_path = ltrim( $endpoint, '/' );

		$allowed = [ 'events', 'event', 'courses', 'course', 'membership-plans', 'group-events' ];
		$is_allowed = false;
		foreach ( $allowed as $prefix ) {
			if ( str_starts_with( $clean_path, $prefix ) ) {
				$is_allowed = true;
				break;
			}
		}

		if ( ! $is_allowed ) {
			wp_send_json_error( [ 'message' => 'Forbidden public proxy target.' ], 403 );
			return;
		}

		$client_domain = rtrim( (string) get_option( 'seamless_client_domain', '' ), '/' );
		if ( empty( $client_domain ) ) {
			wp_send_json_error( [ 'message' => 'No client domain configured.' ], 400 );
			return;
		}

		$url = $client_domain . '/api/' . $clean_path;
		// Re-append query args provided in request
		$query = $_REQUEST;
		unset( $query['action'], $query['endpoint'], $query['nonce'] );
		$params_array = [];
		foreach ( $query as $key => $val ) {
			if ( is_string( $val ) ) {
				$params_array[ $key ] = sanitize_text_field( $val );
			}
		}
		if ( ! empty( $params_array ) ) {
			$url = add_query_arg( $params_array, $url );
		}

		$args = [
			'method'    => 'GET',
			'timeout'   => 30,
			'sslverify' => true,
			'headers'   => [
				'Accept' => 'application/json',
			],
		];

		$response = wp_remote_request( $url, $args );
		if ( is_wp_error( $response ) ) {
			wp_send_json_error( [ 'message' => 'Proxy failed: ' . $response->get_error_message() ], 502 );
			return;
		}

		$status = wp_remote_retrieve_response_code( $response );
		$data   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $status >= 400 ) {
			wp_send_json_error( $data ?: [], $status );
			return;
		}

		wp_send_json_success( $data, $status );
	}

	/**
	 * Proxy dashboard API calls through WordPress so the bearer token is
	 * never exposed to the browser. Only `dashboard/` paths are forwarded.
	 */
	public function ajax_api_proxy(): void {
		if ( ! check_ajax_referer( 'seamless_react_nonce', 'nonce', false ) ) {
			wp_send_json_error( [ 'message' => 'Security check failed.' ], 403 );
			return;
		}
		if ( ! is_user_logged_in() ) {
			wp_send_json_error( [ 'message' => 'Unauthenticated.' ], 401 );
			return;
		}

		$endpoint = sanitize_text_field( $_POST['endpoint'] ?? '' );
		$method   = strtoupper( sanitize_text_field( $_POST['method'] ?? 'GET' ) );
		$payload  = $_POST['payload'] ?? null;

		if ( empty( $endpoint ) ) {
			wp_send_json_error( [ 'message' => 'Missing endpoint.' ], 400 );
			return;
		}

		// Whitelist: only allow dashboard paths
		$clean_path = ltrim( $endpoint, '/' );
		if ( ! str_starts_with( $clean_path, 'dashboard' ) ) {
			wp_send_json_error( [ 'message' => 'Forbidden proxy target.' ], 403 );
			return;
		}

		$uid   = get_current_user_id();
		$token = $this->sso->refresh_token_if_needed( $uid )
			?: get_user_meta( $uid, 'seamless_react_access_token', true );

		if ( ! $token ) {
			wp_send_json_error( [ 'message' => 'No SSO session.', 'needs_sso_auth' => true ], 401 );
			return;
		}

		$client_domain = rtrim( (string) get_option( 'seamless_client_domain', '' ), '/' );
		$url           = $client_domain . '/api/' . $clean_path;

		$args = [
			'method'    => $method,
			'timeout'   => 30,
			'sslverify' => true,
			'headers'   => [
				'Authorization' => 'Bearer ' . $token,
				'Accept'        => 'application/json',
				'Content-Type'  => 'application/json',
			],
		];
		if ( $payload ) {
			$args['body'] = is_string( $payload ) ? wp_unslash( $payload ) : wp_json_encode( $payload );
		}

		$response = wp_remote_request( $url, $args );
		if ( is_wp_error( $response ) ) {
			wp_send_json_error( [ 'message' => 'Proxy failed: ' . $response->get_error_message() ], 502 );
			return;
		}

		$status = wp_remote_retrieve_response_code( $response );
		$data   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $status >= 400 ) {
			wp_send_json_error( $data ?: [], $status );
			return;
		}

		wp_send_json_success( $data, $status );
	}

	// ─── Utility ─────────────────────────────────────────────────────────────

	private function require_login(): void {
		if ( ! is_user_logged_in() ) {
			wp_send_json_error( [ 'message' => 'Authentication required.' ], 401 );
			exit;
		}
	}
}
