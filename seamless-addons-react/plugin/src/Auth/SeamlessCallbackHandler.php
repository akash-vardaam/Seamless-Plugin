<?php

namespace SeamlessReact\Auth;

use WP_Error;
use WP_REST_Request;
use WP_User;

/**
 * Handles the OAuth token exchange and WP user provisioning after the
 * authorization-code callback arrives from the AMS server.
 */
class SeamlessCallbackHandler {

	const PREFIX       = 'seamless_react_sso';
	const NONCE_ACTION = 'seamless_sso_state';

	private string $client_domain;
	private string $sso_client_id;

	public function __construct() {
		$this->client_domain = $this->resolve_client_domain();
		$this->sso_client_id = $this->resolve_sso_client_id();
	}

	public function handle( WP_REST_Request $req ): WP_Error|WP_User {
		$state = (string) $req->get_param( 'state' );
		$code  = (string) $req->get_param( 'code' );

		if ( empty( $state ) || empty( $code ) ) {
			return new WP_Error( 'missing_params', 'Missing state or authorization code.' );
		}

		[ $nonce, $encoded_return_to ] = explode( '|', $state, 2 ) + [ null, null ];
		if ( ! $nonce || ! wp_verify_nonce( $nonce, self::NONCE_ACTION ) ) {
			return new WP_Error( 'invalid_state', 'Invalid or expired state.' );
		}

		$verifier = $this->resolve_pkce_verifier( $nonce );
		if ( ! $verifier ) {
			return new WP_Error( 'missing_verifier', 'Expired or missing PKCE verifier.' );
		}

		$return_to = $this->decode_return_url( $encoded_return_to );

		try {
			$tokens = $this->exchange_code( $code, $verifier );
			if ( is_wp_error( $tokens ) ) {
				return $tokens;
			}

			$user_data = $this->fetch_user_profile( $tokens['access_token'] );
			if ( is_wp_error( $user_data ) ) {
				return $user_data;
			}

			$wp_user = $this->provision_wp_user( $user_data, $tokens );
			if ( is_wp_error( $wp_user ) ) {
				return $wp_user;
			}

			wp_set_current_user( $wp_user->ID );
			wp_set_auth_cookie( $wp_user->ID, true );

			wp_safe_redirect( $return_to );
			exit;

		} catch ( \Throwable $e ) {
			Helper::log( 'CallbackHandler exception: ' . $e->getMessage() );
			return new WP_Error( 'sso_exception', 'Unexpected SSO error.', [ 'status' => 500 ] );
		}
	}

	// ─── Token exchange ───────────────────────────────────────────────────────

	private function exchange_code( string $code, string $verifier ): array|WP_Error {
		$redirect_uri = rest_url( SeamlessSSO::REST_NAMESPACE . '/callback' );

		$response = wp_remote_post( "{$this->client_domain}/oauth/token", [
			'body'    => [
				'grant_type'    => 'authorization_code',
				'client_id'     => $this->sso_client_id,
				'redirect_uri'  => $redirect_uri,
				'code'          => $code,
				'code_verifier' => $verifier,
			],
			'headers' => [ 'Accept' => 'application/json' ],
			'timeout' => 20,
		] );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( json_last_error() !== JSON_ERROR_NONE || empty( $data['access_token'] ) ) {
			$err = $data['error_description'] ?? ( $data['error'] ?? 'No access_token in response' );
			return new WP_Error( 'token_exchange_failed', 'Token exchange failed: ' . $err );
		}

		return $data;
	}

	// ─── User profile fetch ───────────────────────────────────────────────────

	private function fetch_user_profile( string $access_token ): array|WP_Error {
		$response = wp_remote_get( "{$this->client_domain}/api/user", [
			'headers' => [
				'Authorization' => 'Bearer ' . $access_token,
				'Accept'        => 'application/json',
			],
			'timeout' => 20,
		] );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return new WP_Error( 'json_decode_failed', 'Failed to parse user profile.' );
		}

		$user = $data['data']['user'] ?? null;
		if ( empty( $user['email'] ) ) {
			return new WP_Error( 'no_email', 'Profile response did not include an email.' );
		}

		return $data;
	}

	// ─── User provisioning ────────────────────────────────────────────────────

	private function provision_wp_user( array $user_data, array $tokens ): WP_User|WP_Error {
		$user  = $user_data['data']['user'] ?? [];
		$email = sanitize_email( $user['email'] ?? '' );

		$wp_user = get_user_by( 'email', $email );

		if ( ! $wp_user ) {
			$user_id = wp_create_user( sanitize_user( $email, true ), wp_generate_password(), $email );
			if ( is_wp_error( $user_id ) ) {
				return $user_id;
			}
			$wp_user = get_user_by( 'ID', $user_id );

			$display_name = trim( ( $user['first_name'] ?? '' ) . ' ' . ( $user['last_name'] ?? '' ) );
			wp_update_user( [ 'ID' => $wp_user->ID, 'display_name' => $display_name ?: $email ] );
		}

		// Sync role
		$role = ( ( $user['role'] ?? '' ) === 'admin' ) ? 'administrator' : 'subscriber';
		if ( ! in_array( $role, (array) $wp_user->roles, true ) ) {
			$wp_user->set_role( $role );
		}

		// Sync user meta
		$fields = [ 'first_name', 'last_name', 'phone', 'address_line_1', 'city', 'country' ];
		foreach ( $fields as $field ) {
			if ( ! empty( $user[ $field ] ) ) {
				update_user_meta( $wp_user->ID, 'seamless_react_' . $field, sanitize_text_field( $user[ $field ] ) );
			}
		}
		if ( ! empty( $user['first_name'] ) ) {
			update_user_meta( $wp_user->ID, 'first_name', sanitize_text_field( $user['first_name'] ) );
		}
		if ( ! empty( $user['last_name'] ) ) {
			update_user_meta( $wp_user->ID, 'last_name', sanitize_text_field( $user['last_name'] ) );
		}

		// Store tokens
		if ( ! empty( $tokens['access_token'] ) ) {
			update_user_meta( $wp_user->ID, 'seamless_react_access_token', sanitize_text_field( $tokens['access_token'] ) );
			update_user_meta( $wp_user->ID, 'seamless_access_token', sanitize_text_field( $tokens['access_token'] ) );
		}
		if ( ! empty( $tokens['refresh_token'] ) ) {
			update_user_meta( $wp_user->ID, 'seamless_react_refresh_token', sanitize_text_field( $tokens['refresh_token'] ) );
			update_user_meta( $wp_user->ID, 'seamless_refresh_token', sanitize_text_field( $tokens['refresh_token'] ) );
		}
		$expires_at = time() + (int) ( $tokens['expires_in'] ?? 3600 );
		update_user_meta( $wp_user->ID, 'seamless_react_token_expires', $expires_at );
		update_user_meta( $wp_user->ID, 'seamless_token_expires', $expires_at );

		// Cache memberships
		if ( ! empty( $user_data['data']['active_memberships'] ) ) {
			update_user_meta( $wp_user->ID, 'seamless_react_active_memberships', $user_data['data']['active_memberships'] );
			update_user_meta( $wp_user->ID, 'seamless_active_memberships', $user_data['data']['active_memberships'] );
		}

		return $wp_user;
	}

	// ─── Helpers ─────────────────────────────────────────────────────────────

	private function resolve_pkce_verifier( string $nonce ): string {
		$verifier = '';

		if ( ! empty( $_SESSION[ self::PREFIX ]['pkce'][ $nonce ]['verifier'] ) ) {
			$verifier = (string) $_SESSION[ self::PREFIX ]['pkce'][ $nonce ]['verifier'];
			unset( $_SESSION[ self::PREFIX ]['pkce'][ $nonce ] );
		}

		if ( ! $verifier ) {
			$transient = get_transient( SeamlessSSO::PKCE_TRANSIENT_PFX . md5( $nonce ) );
			if ( is_array( $transient ) && ! empty( $transient['verifier'] ) ) {
				$verifier = (string) $transient['verifier'];
			}
		}

		delete_transient( SeamlessSSO::PKCE_TRANSIENT_PFX . md5( $nonce ) );
		return $verifier;
	}

	private function decode_return_url( ?string $encoded ): string {
		if ( ! $encoded ) {
			return home_url( '/' );
		}
		$decoded = base64_decode( $encoded, true );
		if ( $decoded && wp_validate_redirect( esc_url_raw( $decoded ), false ) ) {
			return esc_url_raw( $decoded );
		}
		$configured = esc_url_raw( (string) get_option( 'seamless_react_redirect_url', '' ) );
		if ( $configured && wp_validate_redirect( $configured, false ) ) {
			return $configured;
		}
		return home_url( '/' );
	}

	private function resolve_client_domain(): string {
		$core_domain  = $this->normalize_client_domain( (string) get_option( 'seamless_client_domain', '' ) );
		$react_domain = $this->normalize_client_domain( (string) get_option( 'seamless_react_client_domain', '' ) );

		if ( $core_domain && ! $this->is_site_domain( $core_domain ) ) {
			return $core_domain;
		}

		if ( $react_domain && ! $this->is_site_domain( $react_domain ) ) {
			return $react_domain;
		}

		return $core_domain ?: $react_domain;
	}

	private function resolve_sso_client_id(): string {
		$core_client_id = (string) get_option( 'seamless_sso_client_id', '' );
		if ( $core_client_id !== '' ) {
			return $core_client_id;
		}

		return (string) get_option( 'seamless_react_sso_client_id', '' );
	}

	private function normalize_client_domain( string $domain ): string {
		$domain = trim( $domain );
		if ( $domain === '' ) {
			return '';
		}

		if ( strpos( $domain, '//' ) === 0 ) {
			$domain = 'https:' . $domain;
		} elseif ( strpos( $domain, 'http' ) !== 0 ) {
			$domain = 'https://' . $domain;
		}

		return untrailingslashit( $domain );
	}

	private function is_site_domain( string $url ): bool {
		$url_host  = wp_parse_url( $url, PHP_URL_HOST );
		$home_host = wp_parse_url( home_url( '/' ), PHP_URL_HOST );

		return $url_host && $home_host && strcasecmp( (string) $url_host, (string) $home_host ) === 0;
	}
}
