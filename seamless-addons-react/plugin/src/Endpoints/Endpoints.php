<?php

namespace SeamlessReact\Endpoints;

/**
 * Registers custom WP rewrite rules for the event list, single event,
 * and AMS content pages and handles template redirection.
 */
class Endpoints {

	public function __construct() {
		add_action( 'init',          [ $this, 'register_rewrite_rules' ] );
		add_filter( 'query_vars',    [ $this, 'add_query_vars' ] );
		add_filter( 'template_include', [ $this, 'handle_redirect' ], 100 );

		// Flush rules whenever the endpoints change
		add_action( 'update_option_seamless_react_event_list_endpoint',   'flush_rewrite_rules' );
		add_action( 'update_option_seamless_react_single_event_endpoint', 'flush_rewrite_rules' );
		add_action( 'update_option_seamless_react_ams_content_endpoint',  'flush_rewrite_rules' );

		// SEO: inject event title into <title>
		add_filter( 'document_title_parts', [ $this, 'filter_event_title' ], 10 );
	}

	public function register_rewrite_rules(): void {
		$list_slug   = $this->opt( 'seamless_react_event_list_endpoint',   'events' );
		$single_slug = $this->opt( 'seamless_react_single_event_endpoint', 'event' );
		$ams_slug    = $this->opt( 'seamless_react_ams_content_endpoint',  'ams-content' );

		add_rewrite_rule(
			'^' . preg_quote( $list_slug, '/' ) . '/?$',
			'index.php?seamless_react_page=event-list',
			'top'
		);

		add_rewrite_rule(
			'^' . preg_quote( $single_slug, '/' ) . '/([^/]+)/?$',
			'index.php?seamless_react_page=single-event&seamless_react_slug=$matches[1]',
			'top'
		);

		add_rewrite_rule(
			'^' . preg_quote( $ams_slug, '/' ) . '/?$',
			'index.php?seamless_react_page=ams-content',
			'top'
		);
	}

	public function add_query_vars( array $vars ): array {
		$vars[] = 'seamless_react_page';
		$vars[] = 'seamless_react_slug';
		return $vars;
	}

	public function handle_redirect( string $template ): string {
		$page = (string) get_query_var( 'seamless_react_page' );
		if ( in_array( $page, [ 'event-list', 'single-event', 'ams-content' ], true ) ) {
			$tpl = SEAMLESS_REACT_SRC_DIR . 'Frontend/templates/tpl-endpoint.php';
			if ( file_exists( $tpl ) ) {
				return $tpl;
			}
		}
		return $template;
	}

	public function filter_event_title( array $parts ): array {
		if ( get_query_var( 'seamless_react_page' ) !== 'single-event' ) {
			return $parts;
		}
		$slug  = get_query_var( 'seamless_react_slug' );
		$title = $slug ? $this->fetch_event_title( $slug ) : null;
		if ( $title ) {
			$parts['title'] = $title;
		}
		return $parts;
	}

	// ─── Helpers ─────────────────────────────────────────────────────────────

	private function fetch_event_title( string $slug ): ?string {
		$cache_key = 'seamless_react_evt_title_' . md5( $slug );
		$cached    = get_transient( $cache_key );
		if ( $cached !== false ) {
			return $cached ?: null;
		}

		$domain = rtrim( (string) get_option( 'seamless_react_client_domain', '' ), '/' );
		if ( ! $domain ) {
			return null;
		}

		foreach ( [ '/api/events/', '/api/group-events/' ] as $path ) {
			$resp = wp_remote_get( $domain . $path . rawurlencode( $slug ), [
				'timeout'   => 5,
				'sslverify' => true,
			] );
			if ( ! is_wp_error( $resp ) && wp_remote_retrieve_response_code( $resp ) === 200 ) {
				$body = json_decode( wp_remote_retrieve_body( $resp ), true );
				if ( ! empty( $body['data']['title'] ) ) {
					$title = sanitize_text_field( $body['data']['title'] );
					set_transient( $cache_key, $title, 5 * MINUTE_IN_SECONDS );
					return $title;
				}
			}
		}

		set_transient( $cache_key, '', 2 * MINUTE_IN_SECONDS );
		return null;
	}

	private function opt( string $key, string $default ): string {
		return (string) get_option( $key, $default );
	}
}
