<?php

namespace SeamlessReact\Auth;

/**
 * Handles domain-verification-based authentication.
 * Stores a dummy "verified" token in wp_options after confirming the API domain is reachable.
 */
class SeamlessAuth {

	private const OPTION_TOKEN = 'seamless_react_api_token';

	private string $domain;

	public function __construct() {
		$this->domain = rtrim( (string) get_option( 'seamless_react_client_domain', '' ), '/' );

		add_action( 'wp_ajax_seamless_react_disconnect',       [ $this, 'handle_disconnect' ] );
		add_action( 'wp_ajax_seamless_react_test_connection',  [ $this, 'handle_test_connection' ] );
	}

	// ─── Public API ───────────────────────────────────────────────────────────

	public function is_authenticated(): bool {
		if ( class_exists( '\Seamless\Auth\SeamlessAuth' ) ) {
			return \Seamless\Auth\SeamlessAuth::is_authenticated();
		}
		return false;
	}

	public function disconnect(): void {
		delete_option( self::OPTION_TOKEN );
		delete_option( 'seamless_react_last_auth_error' );
		update_option( 'seamless_react_manual_disconnect', 1 );
	}

	public function get_auth_status(): array {
		$token      = get_option( self::OPTION_TOKEN );
		$last_error = get_option( 'seamless_react_last_auth_error' );

		return [
			'is_authenticated' => $this->is_authenticated(),
			'token_exists'     => ! empty( $token ),
			'token_expired'    => is_array( $token ) && isset( $token['expires_at'] ) && time() >= $token['expires_at'],
			'expires_at'       => $token['expires_at'] ?? null,
			'last_error'       => $last_error,
			'credentials_set'  => ! empty( $this->domain ),
		];
	}

	// ─── AJAX handlers ────────────────────────────────────────────────────────

	public function handle_disconnect(): void {
		check_ajax_referer( 'seamless_react_disconnect', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( 'Insufficient permissions', 403 );
		}
		$this->disconnect();
		wp_send_json_success( 'Disconnected' );
	}

	public function handle_test_connection(): void {
		check_ajax_referer( 'seamless_react_test_connection', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( 'Insufficient permissions', 403 );
		}

		$token = $this->fetch_token();
		if ( $token ) {
			wp_send_json_success( 'Connection successful' );
		} else {
			wp_send_json_error( get_option( 'seamless_react_last_auth_error', 'Unknown error' ) );
		}
	}

	// ─── Internal helpers ─────────────────────────────────────────────────────

	public function fetch_token(): array|false {
		if ( empty( $this->domain ) || ! filter_var( $this->domain, FILTER_VALIDATE_URL ) ) {
			update_option( 'seamless_react_last_auth_error', 'Invalid or missing domain.' );
			return false;
		}

		$verify_url = $this->domain . '/api/events?per_page=1';

		$response = wp_remote_get( $verify_url, [
			'timeout'   => 10,
			'sslverify' => true,
			'headers'   => [ 'Accept' => 'application/json' ],
		] );

		if ( is_wp_error( $response ) ) {
			update_option( 'seamless_react_last_auth_error', 'Connection failed: ' . $response->get_error_message() );
			return false;
		}

		$status = wp_remote_retrieve_response_code( $response );
		if ( $status < 200 || $status >= 300 ) {
			update_option( 'seamless_react_last_auth_error', 'API returned HTTP ' . $status );
			return false;
		}

		$body = wp_remote_retrieve_body( $response );
		json_decode( $body );
		if ( json_last_error() !== JSON_ERROR_NONE ) {
			update_option( 'seamless_react_last_auth_error', 'Invalid JSON from API endpoint.' );
			return false;
		}

		$token_data = [
			'access_token' => 'verified_domain_connection',
			'expires_at'   => time() + YEAR_IN_SECONDS,
			'created_at'   => time(),
		];

		update_option( self::OPTION_TOKEN, $token_data );
		delete_option( 'seamless_react_last_auth_error' );
		delete_option( 'seamless_react_manual_disconnect' );

		return $token_data;
	}

	private function token_valid( mixed $token ): bool {
		return is_array( $token )
			&& ! empty( $token['access_token'] )
			&& isset( $token['expires_at'] )
			&& time() < (int) $token['expires_at'];
	}
}
