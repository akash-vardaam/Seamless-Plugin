<?php

namespace SeamlessReact\Auth;

/**
 * Enforces content restrictions based on post meta + user SSO membership.
 * Reads seamless_react_required_plans post meta set by the ContentRestrictionMeta meta box.
 */
class AccessController {

	public function __construct() {
		add_action( 'template_redirect',  [ $this, 'enforce_access' ] );
		add_filter( 'template_include',   [ $this, 'maybe_load_restriction_template' ], 99 );
	}

	public function enforce_access(): void {
		if ( ! is_singular() ) {
			return;
		}

		global $post;

		// Which post types are protected?
		$protected_types_str = (string) get_option( 'seamless_react_protected_post_types', '' );
		$protected_types     = array_filter( array_map( 'trim', explode( ',', $protected_types_str ) ) );

		if ( ! in_array( $post->post_type, $protected_types, true ) ) {
			return;
		}

		// Admins always get through
		if ( current_user_can( 'administrator' ) ) {
			return;
		}

		$required_plans = (array) get_post_meta( $post->ID, 'seamless_react_required_plans', true );

		// No plan restriction on this specific post → allow
		if ( empty( $required_plans ) ) {
			return;
		}

		$is_logged_in = is_user_logged_in();

		if ( $is_logged_in ) {
			$uid              = get_current_user_id();
			$active_plans     = (array) get_user_meta( $uid, 'seamless_react_active_memberships', true );
			$user_plan_ids    = array_column( array_column( $active_plans, 'plan' ), 'id' );

			if ( array_intersect( $required_plans, $user_plan_ids ) ) {
				return; // Has a matching plan → allow
			}
		}

		// Restrict
		set_query_var( 'seamless_react_restrict', true );
		set_query_var( 'seamless_react_is_logged_in', $is_logged_in );
		status_header( 403 );
	}

	public function maybe_load_restriction_template( string $template ): string {
		if ( get_query_var( 'seamless_react_restrict' ) ) {
			$tpl = SEAMLESS_REACT_SRC_DIR . 'Frontend/templates/tpl-content-restriction.php';
			if ( file_exists( $tpl ) ) {
				return $tpl;
			}
		}
		return $template;
	}
}
