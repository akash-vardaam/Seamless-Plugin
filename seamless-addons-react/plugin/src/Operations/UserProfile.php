<?php

namespace SeamlessReact\Operations;

/**
 * All user-related API calls proxied through WordPress server-side so that
 * the bearer token is never exposed to the browser.
 */
class UserProfile {

	private string $domain;

	public function __construct() {
		$this->domain = rtrim( (string) get_option( 'seamless_react_client_domain', '' ), '/' );
	}

	// ─── Token helper ─────────────────────────────────────────────────────────

	private function get_access_token(): string|null {
		if ( ! is_user_logged_in() ) {
			return null;
		}
		$uid   = get_current_user_id();
		$token = (string) get_user_meta( $uid, 'seamless_react_access_token', true );

		if ( ! $token && class_exists( '\\SeamlessReact\\Auth\\SeamlessSSO' ) ) {
			$sso   = new \SeamlessReact\Auth\SeamlessSSO();
			$token = (string) $sso->refresh_token_if_needed( $uid );
		}

		return $token ?: null;
	}

	// ─── HTTP helpers ─────────────────────────────────────────────────────────

	private function get( string $endpoint, array $params = [] ): array {
		try {
			$token = $this->get_access_token();
			if ( ! $token ) {
				throw new \Exception( 'No access token.' );
			}

			$url = $this->domain . '/api/' . $endpoint;
			if ( $params ) {
				$url .= '?' . http_build_query( $params );
			}

			$response = wp_remote_get( $url, [
				'sslverify' => true,
				'timeout'   => 15,
				'headers'   => [
					'Authorization' => 'Bearer ' . $token,
					'Accept'        => 'application/json',
				],
			] );

			return $this->parse_response( $response, $endpoint );
		} catch ( \Throwable $e ) {
			return [ 'success' => false, 'message' => $e->getMessage(), 'data' => [] ];
		}
	}

	private function post( string $endpoint, array $data, string $method = 'POST' ): array {
		try {
			$token = $this->get_access_token();
			if ( ! $token ) {
				throw new \Exception( 'No access token.' );
			}

			$response = wp_remote_request( $this->domain . '/api/' . $endpoint, [
				'method'    => $method,
				'sslverify' => true,
				'timeout'   => 15,
				'headers'   => [
					'Authorization' => 'Bearer ' . $token,
					'Accept'        => 'application/json',
					'Content-Type'  => 'application/json',
				],
				'body' => wp_json_encode( $data ),
			] );

			return $this->parse_response( $response, $endpoint );
		} catch ( \Throwable $e ) {
			return [ 'success' => false, 'message' => $e->getMessage(), 'data' => [] ];
		}
	}

	private function parse_response( mixed $response, string $endpoint ): array {
		if ( is_wp_error( $response ) ) {
			throw new \Exception( $response->get_error_message() );
		}

		$http = wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( ! in_array( $http, [ 200, 201 ], true ) || ! is_array( $body ) ) {
			throw new \Exception( $body['message'] ?? "API error $http on $endpoint" );
		}

		return [ 'success' => true, 'data' => $body['data'] ?? $body, 'message' => $body['message'] ?? 'OK' ];
	}

	// ─── Profile ──────────────────────────────────────────────────────────────

	public function get_user_profile(): array {
		$result = $this->get( 'user' );
		if ( $result['success'] && isset( $result['data']['user'] ) ) {
			return [ 'success' => true, 'data' => $result['data']['user'] ];
		}
		return $result;
	}

	public function update_user_profile( string $email, array $data ): array {
		if ( ! $email ) {
			return [ 'success' => false, 'message' => 'Email required.' ];
		}
		$user = wp_get_current_user();
		if ( $user->user_email !== $email && ! current_user_can( 'administrator' ) ) {
			return [ 'success' => false, 'message' => 'Unauthorized.' ];
		}

		$allowed = [ 'first_name', 'last_name', 'email', 'phone', 'address_line_1', 'city', 'state', 'country', 'zip_code' ];
		$payload = [];
		foreach ( $allowed as $f ) {
			if ( isset( $data[ $f ] ) ) {
				$payload[ $f ] = sanitize_text_field( $data[ $f ] );
			}
		}

		return empty( $payload )
			? [ 'success' => false, 'message' => 'No valid fields.' ]
			: $this->post( 'dashboard/profile/edit', $payload, 'PUT' );
	}

	// ─── Memberships ─────────────────────────────────────────────────────────

	public function get_user_memberships( string $email ): array {
		if ( ! $email ) {
			return [ 'success' => false, 'message' => 'Email required.', 'data' => [] ];
		}

		$result = $this->get( 'dashboard/memberships', [ 'email' => $email ] );
		if ( ! $result['success'] ) {
			return $result;
		}

		$mem_data = $result['data'];
		$current  = $mem_data['current'] ?? $mem_data['active_memberships'] ?? [];
		$history  = $mem_data['history']  ?? $mem_data['membership_history'] ?? [];

		// Active-filtering: exclude truly expired, keep cancelled-non-refundable until expiry
		$now             = time();
		$active_filtered = [];
		foreach ( (array) $current as $m ) {
			$status   = strtolower( $m['status'] ?? '' );
			$expiry   = $m['expiry_date'] ?? $m['expires_at'] ?? null;
			$expired  = $expiry && strtotime( (string) $expiry ) < $now;

			$plan          = $m['plan'] ?? [];
			$refundable    = ! empty( $plan['refundable'] );
			$has_proration = ! empty( $plan['prorate_on_refund'] );
			$non_refund    = ! $refundable && ! $has_proration;

			if ( ! $expired && ( $status === 'active' || ( $status === 'cancelled' && $non_refund ) ) ) {
				$active_filtered[] = $m;
			} else {
				$history[] = $m;
			}
		}

		return [ 'success' => true, 'data' => [ 'current' => $active_filtered, 'history' => $history ] ];
	}

	public function upgrade_membership( string $new_plan_id, string $membership_id, string $email ): array {
		$this->guard_ownership( $email );
		$data = [ 'email' => $email ];
		if ( $membership_id ) {
			$data['membership_id'] = $membership_id;
		}
		return $this->post( 'dashboard/memberships/upgrade/' . $new_plan_id, $data );
	}

	public function downgrade_membership( string $new_plan_id, string $membership_id, string $email ): array {
		$this->guard_ownership( $email );
		$data = [ 'email' => $email ];
		if ( $membership_id ) {
			$data['membership_id'] = $membership_id;
		}
		return $this->post( 'dashboard/memberships/downgrade/' . $new_plan_id, $data );
	}

	public function cancel_membership( string $membership_id, string $email ): array {
		$this->guard_ownership( $email );
		return $this->post( 'dashboard/memberships/cancel/' . $membership_id, [ 'email' => $email ] );
	}

	public function renew_membership( string $plan_id, string $email ): array {
		$this->guard_ownership( $email );
		return $this->post( 'dashboard/memberships/renew/' . $plan_id, [ 'email' => $email, 'plan_id' => $plan_id ] );
	}

	public function cancel_scheduled_change( string $membership_id, string $email ): array {
		$this->guard_ownership( $email );
		return $this->post( 'dashboard/memberships/cancel-scheduled-change', [
			'email'         => $email,
			'membership_id' => $membership_id,
		] );
	}

	// ─── Orders ───────────────────────────────────────────────────────────────

	public function get_user_orders( string $email ): array {
		$result = $this->get( 'dashboard/orders', [ 'email' => $email ] );
		if ( $result['success'] && isset( $result['data']['data'] ) ) {
			$result['data'] = $result['data']['data'];
		}
		return $result;
	}

	// ─── Courses ─────────────────────────────────────────────────────────────

	public function get_enrolled_courses(): array {
		return $this->get( 'dashboard/courses/enrolled' );
	}

	public function get_included_courses(): array {
		return $this->get( 'dashboard/courses/included' );
	}

	// ─── Organization / Group ─────────────────────────────────────────────────

	public function get_user_organization( string $email ): array {
		return $this->get( 'dashboard/organization', [ 'email' => $email ] );
	}

	public function resend_group_invite( string $membership_id, string $member_id ): array {
		return $this->post( "dashboard/organization/members/{$member_id}/resend-invite", [
			'membership_id' => $membership_id,
		] );
	}

	public function add_group_members( string $membership_id, array $members ): array {
		return $this->post( 'dashboard/organization/members', [
			'membership_id' => $membership_id,
			'members'       => $members,
		] );
	}

	public function remove_group_member( string $membership_id, string $member_id ): array {
		return $this->post( "dashboard/organization/members/{$member_id}/remove", [
			'membership_id' => $membership_id,
		] );
	}

	public function change_member_role( string $membership_id, string $member_id, string $role ): array {
		return $this->post( "dashboard/organization/members/{$member_id}/role", [
			'membership_id' => $membership_id,
			'role'          => $role,
		] );
	}

	// ─── Helper ───────────────────────────────────────────────────────────────

	private function guard_ownership( string $email ): void {
		$user = wp_get_current_user();
		if ( $user->user_email !== $email && ! current_user_can( 'administrator' ) ) {
			wp_send_json_error( [ 'message' => 'Unauthorized.' ], 403 );
			exit;
		}
	}
}
