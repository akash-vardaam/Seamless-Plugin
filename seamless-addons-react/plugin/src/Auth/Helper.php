<?php

namespace SeamlessReact\Auth;

/**
 * Small logging helper used across the SSO flow.
 */
class Helper {
	public static function log( string $message ): void {
		if ( defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
			error_log( '[SeamlessReact] ' . $message );
		}
	}
}
