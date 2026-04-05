<?php

namespace SeamlessReact\Auth;

use WP_Error;
use WP_REST_Request;
use WP_Session_Tokens;
use WP_User;

/**
 * OAuth 2.0 + PKCE SSO integration.
 *
 * Manages login / logout redirects, the OAuth callback, and shortcodes.
 */
class SeamlessSSO {

	const PREFIX              = 'seamless_react_sso';
	const REST_NAMESPACE      = 'seamless-react/v1';
	const NONCE_ACTION        = 'seamless_react_sso_state';
	const LOGIN_ROUTE         = 'auth/login';
	const LOGOUT_ROUTE        = 'logout';
	const PKCE_TRANSIENT_PFX  = 'sr_sso_pkce_';
	const PKCE_TTL            = 900; // 15 minutes

	private string $client_domain;
	private string $sso_client_id;

	public function __construct() {
		$this->client_domain = rtrim( (string) get_option( 'seamless_react_client_domain', '' ), '/' );
		$this->sso_client_id = (string) get_option( 'seamless_react_sso_client_id', '' );

		add_action( 'init',              [ $this, 'register_rewrite_rules' ] );
		add_filter( 'query_vars',        [ $this, 'add_query_vars' ] );
		add_action( 'template_redirect', [ $this, 'handle_login_redirect' ] );
		add_action( 'rest_api_init',     [ $this, 'register_rest_routes' ] );
		add_shortcode( 'seamless_react_login_button', [ $this, 'render_login_button' ] );
	}

	// ─── Rewrite rules ───────────────────────────────────────────────────────

	public function register_rewrite_rules(): void {
		add_rewrite_rule( '^' . self::LOGIN_ROUTE  . '/?$', 'index.php?sso_react_login=1',  'top' );
		add_rewrite_rule( '^' . self::LOGOUT_ROUTE . '/?$', 'index.php?sso_react_logout=1', 'top' );
	}

	public function add_query_vars( array $vars ): array {
		$vars[] = 'sso_react_login';
		$vars[] = 'sso_react_logout';
		return $vars;
	}

	public function handle_login_redirect(): void {
		if ( get_query_var( 'sso_react_login' ) ) {
			$this->ensure_session();
			wp_redirect( $this->build_login_url( $this->resolve_return_url() ) );
			exit;
		}

		if ( get_query_var( 'sso_react_logout' ) ) {
			$this->ensure_session();
			$this->do_logout_redirect();
		}
	}

	// ─── REST endpoints ──────────────────────────────────────────────────────

	public function register_rest_routes(): void {
		register_rest_route( self::REST_NAMESPACE, '/callback', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'handle_oauth_callback' ],
			'permission_callback' => '__return_true',
		] );

		register_rest_route( self::REST_NAMESPACE, '/logout-user', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'remote_logout_user' ],
			'permission_callback' => '__return_true',
		] );
	}

	// ─── OAuth callback ──────────────────────────────────────────────────────

	public function handle_oauth_callback( WP_REST_Request $req ): void {
		$this->ensure_session();
		$handler = new SeamlessCallbackHandler();
		$result  = $handler->handle( $req );

		if ( is_wp_error( $result ) ) {
			Helper::log( 'OAuth callback error: ' . $result->get_error_message() );
			wp_die( esc_html( $result->get_error_message() ), 'SSO Error', [ 'response' => 400 ] );
		}
	}

	// ─── Remote logout (called by the AMS server) ────────────────────────────

	public function remote_logout_user( WP_REST_Request $req ): array|WP_Error {
		$email = sanitize_email( (string) $req->get_param( 'email' ) );
		if ( ! $email ) {
			return new WP_Error( 'invalid_user', 'Invalid or missing email', [ 'status' => 400 ] );
		}

		$user = get_user_by( 'email', $email );
		if ( ! $user ) {
			return new WP_Error( 'no_user', 'User not found', [ 'status' => 404 ] );
		}

		WP_Session_Tokens::get_instance( $user->ID )->destroy_all();
		delete_user_meta( $user->ID, 'seamless_react_access_token' );
		delete_user_meta( $user->ID, 'seamless_react_refresh_token' );
		delete_user_meta( $user->ID, 'seamless_react_token_expires' );

		return [ 'success' => true ];
	}

	// ─── Login URL builder ───────────────────────────────────────────────────

	public function build_login_url( string $return_to = '' ): string {
		if ( empty( $return_to ) ) {
			$return_to = home_url( '/' );
		}

		$code_verifier  = bin2hex( random_bytes( 64 ) );
		$code_challenge = rtrim( strtr( base64_encode( hash( 'sha256', $code_verifier, true ) ), '+/', '-_' ), '=' );

		$nonce = wp_create_nonce( self::NONCE_ACTION );
		$state = $nonce . '|' . base64_encode( esc_url_raw( $return_to ) );

		$_SESSION[ self::PREFIX ]['pkce'][ $nonce ] = [
			'verifier'   => $code_verifier,
			'created_at' => time(),
		];

		set_transient( self::PKCE_TRANSIENT_PFX . md5( $nonce ), [
			'verifier'   => $code_verifier,
			'created_at' => time(),
		], self::PKCE_TTL );

		$redirect_uri = rest_url( self::REST_NAMESPACE . '/callback' );
		$query = http_build_query( [
			'client_id'             => $this->sso_client_id,
			'redirect_uri'          => $redirect_uri,
			'response_type'         => 'code',
			'scope'                 => '',
			'state'                 => $state,
			'code_challenge'        => $code_challenge,
			'code_challenge_method' => 'S256',
		] );

		return "{$this->client_domain}/oauth/authorize?{$query}";
	}

	// ─── Token refresh ───────────────────────────────────────────────────────

	public function refresh_token_if_needed( int $user_id ): string|false {
		$access_token = (string) get_user_meta( $user_id, 'seamless_react_access_token',  true );
		$expires_at   = (int)   get_user_meta( $user_id, 'seamless_react_token_expires', true );

		if ( $access_token && $expires_at > time() + 30 ) {
			return $access_token;
		}

		$refresh_token = (string) get_user_meta( $user_id, 'seamless_react_refresh_token', true );
		if ( ! $refresh_token ) {
			return false;
		}

		$response = wp_remote_post( "{$this->client_domain}/oauth/token", [
			'body'    => [
				'grant_type'    => 'refresh_token',
				'client_id'     => $this->sso_client_id,
				'refresh_token' => $refresh_token,
			],
			'headers' => [ 'Accept' => 'application/json' ],
			'timeout' => 20,
		] );

		if ( is_wp_error( $response ) ) {
			return false;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( empty( $data['access_token'] ) ) {
			return false;
		}

		update_user_meta( $user_id, 'seamless_react_access_token',  sanitize_text_field( $data['access_token'] ) );
		update_user_meta( $user_id, 'seamless_react_token_expires', time() + (int) ( $data['expires_in'] ?? 3600 ) );
		if ( ! empty( $data['refresh_token'] ) ) {
			update_user_meta( $user_id, 'seamless_react_refresh_token', sanitize_text_field( $data['refresh_token'] ) );
		}

		return $data['access_token'];
	}

	// ─── Login button shortcode ──────────────────────────────────────────────

	public function render_login_button( array $atts ): string {
		$atts = shortcode_atts( [
			'text'         => esc_html__( 'Login', 'seamless-react' ),
			'class'        => 'seamless-react-login-btn',
			'logout_text'  => esc_html__( 'Logout', 'seamless-react' ),
			'logout_class' => 'seamless-react-logout-btn',
		], $atts );

		if ( empty( $this->sso_client_id ) || empty( $this->client_domain ) ) {
			return '<p>' . esc_html__( 'Seamless SSO is not configured.', 'seamless-react' ) . '</p>';
		}

		if ( is_user_logged_in() ) {
			return sprintf(
				'<a class="%s" href="%s">%s</a>',
				esc_attr( $atts['logout_class'] ),
				esc_url( home_url( self::LOGOUT_ROUTE ) ),
				esc_html( $atts['logout_text'] )
			);
		}

		$url = add_query_arg( 'return_to', $this->get_post_login_redirect_url(), home_url( self::LOGIN_ROUTE ) );

		return sprintf(
			'<a class="%s" href="%s">%s</a>',
			esc_attr( $atts['class'] ),
			esc_url( $url ),
			esc_html( $atts['text'] )
		);
	}

	// ─── Internals ───────────────────────────────────────────────────────────

	private function ensure_session(): void {
		if ( PHP_SESSION_NONE === session_status() ) {
			session_start();
		}
	}

	private function resolve_return_url(): string {
		$requested = $this->sanitize_internal_url( $_GET['return_to'] ?? null );
		if ( $requested ) {
			return $requested;
		}

		$referer = $this->sanitize_internal_url( $_SERVER['HTTP_REFERER'] ?? null );
		if ( $referer && ! $this->is_auth_url( $referer ) ) {
			return $referer;
		}

		return $this->get_post_login_redirect_url();
	}

	private function sanitize_internal_url( mixed $url ): string {
		if ( ! is_string( $url ) || trim( $url ) === '' ) {
			return '';
		}
		$url        = esc_url_raw( wp_unslash( $url ) );
		$home_host  = wp_parse_url( home_url( '/' ), PHP_URL_HOST );
		$target_host = wp_parse_url( $url, PHP_URL_HOST );

		if ( $target_host && $home_host && strcasecmp( (string) $target_host, (string) $home_host ) !== 0 ) {
			return '';
		}
		return $url;
	}

	private function is_auth_url( string $url ): bool {
		$normalized = untrailingslashit( $url );
		return in_array( $normalized, [
			untrailingslashit( home_url( self::LOGIN_ROUTE ) ),
			untrailingslashit( home_url( self::LOGOUT_ROUTE ) ),
			untrailingslashit( rest_url( self::REST_NAMESPACE . '/callback' ) ),
		], true );
	}

	public function get_post_login_redirect_url(): string {
		$configured = $this->sanitize_internal_url( get_option( 'seamless_react_redirect_url', '' ) );
		if ( $configured ) {
			return $configured;
		}

		$page = get_page_by_path( 'dashboard' );
		if ( $page instanceof WP_User ) { // Wrong type – using WP_Post below
		}
		if ( $page instanceof \WP_Post && $page->post_status === 'publish' ) {
			return (string) get_permalink( $page );
		}

		return home_url( '/' );
	}

	private function do_logout_redirect(): void {
		$user = wp_get_current_user();
		if ( ! $user || empty( $user->user_email ) ) {
			wp_redirect( home_url( '/' ) );
			exit;
		}

		$api_url = $this->client_domain . '/api/oauth/portal/terminate-session';
		wp_remote_post( $api_url, [
			'headers' => [
				'Content-Type' => 'application/json',
				'Accept'       => 'application/json',
			],
			'body'    => wp_json_encode( [ 'user_email' => $user->user_email ] ),
			'timeout' => 10,
		] );

		WP_Session_Tokens::get_instance( $user->ID )->destroy_all();
		delete_user_meta( $user->ID, 'seamless_react_access_token' );

		if ( PHP_SESSION_ACTIVE === session_status() ) {
			session_destroy();
		}

		wp_redirect( home_url( '/' ) );
		exit;
	}
}
