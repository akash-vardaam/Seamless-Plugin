<?php

namespace SeamlessReact\Admin;

/**
 * Meta box for selecting required membership plans per post/page.
 */
class ContentRestrictionMeta {

	public function __construct() {
		add_action( 'add_meta_boxes', [ $this, 'add_meta_box' ] );
		add_action( 'save_post',      [ $this, 'save_meta' ], 10, 2 );
	}

	public function add_meta_box(): void {
		$protected_types_str = (string) get_option( 'seamless_react_protected_post_types', '' );
		$post_types = array_filter( array_map( 'trim', explode( ',', $protected_types_str ) ) );

		foreach ( $post_types as $type ) {
			add_meta_box(
				'seamless-react-restriction',
				__( 'Seamless Membership Restriction', 'seamless-react' ),
				[ $this, 'render_meta_box' ],
				$type,
				'side',
				'default'
			);
		}
	}

	public function render_meta_box( \WP_Post $post ): void {
		$selected_plans = (array) get_post_meta( $post->ID, 'seamless_react_required_plans', true );
		$domain         = rtrim( (string) get_option( 'seamless_react_client_domain', '' ), '/' );

		wp_nonce_field( 'seamless_react_restriction_meta', 'seamless_react_restriction_nonce' );

		echo '<p style="font-size:12px;color:#666">' . esc_html__( 'Restrict to users with one of these membership plans:', 'seamless-react' ) . '</p>';

		if ( ! $domain ) {
			echo '<p>' . esc_html__( 'Connect to Seamless first to see available plans.', 'seamless-react' ) . '</p>';
			return;
		}

		// Fetch plans from API (cached 30 min)
		$plans = $this->get_membership_plans( $domain );

		if ( empty( $plans ) ) {
			echo '<p>' . esc_html__( 'No membership plans found, or API unreachable.', 'seamless-react' ) . '</p>';
			return;
		}

		foreach ( $plans as $plan ) {
			$id    = $plan['id']    ?? '';
			$label = $plan['label'] ?? $plan['name'] ?? $id;
			printf(
				'<label><input type="checkbox" name="seamless_react_required_plans[]" value="%s" %s> %s</label><br>',
				esc_attr( (string) $id ),
				in_array( (string) $id, array_map( 'strval', $selected_plans ), true ) ? 'checked' : '',
				esc_html( (string) $label )
			);
		}

		if ( ! empty( $selected_plans ) ) {
			echo '<hr><p style="font-size:11px">';
			printf(
				esc_html__( 'Leave all unchecked to grant public access to this %s.', 'seamless-react' ),
				esc_html( get_post_type_object( $post->post_type )->labels->singular_name ?? 'post' )
			);
			echo '</p>';
		}
	}

	public function save_meta( int $post_id, \WP_Post $post ): void {
		if ( ! isset( $_POST['seamless_react_restriction_nonce'] )
			|| ! wp_verify_nonce( $_POST['seamless_react_restriction_nonce'], 'seamless_react_restriction_meta' )
		) {
			return;
		}

		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$plans = isset( $_POST['seamless_react_required_plans'] )
			? array_map( 'sanitize_text_field', (array) $_POST['seamless_react_required_plans'] )
			: [];

		if ( empty( $plans ) ) {
			delete_post_meta( $post_id, 'seamless_react_required_plans' );
		} else {
			update_post_meta( $post_id, 'seamless_react_required_plans', $plans );
		}
	}

	private function get_membership_plans( string $domain ): array {
		$cache_key = 'seamless_react_membership_plans_' . md5( $domain );
		$cached    = get_transient( $cache_key );
		if ( $cached !== false ) {
			return (array) $cached;
		}

		$response = wp_remote_get( $domain . '/api/membership-plans', [
			'timeout'   => 5,
			'sslverify' => true,
			'headers'   => [ 'Accept' => 'application/json' ],
		] );

		if ( is_wp_error( $response ) || wp_remote_retrieve_response_code( $response ) !== 200 ) {
			set_transient( $cache_key, [], 5 * MINUTE_IN_SECONDS );
			return [];
		}

		$body  = json_decode( wp_remote_retrieve_body( $response ), true );
		$plans = $body['data'] ?? [];
		set_transient( $cache_key, $plans, 30 * MINUTE_IN_SECONDS );

		return (array) $plans;
	}
}
