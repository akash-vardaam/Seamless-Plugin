<?php

namespace SeamlessReact;

/**
 * PSR-4-style autoloader for the SeamlessReact namespace.
 *
 * Maps SeamlessReact\Foo\Bar → src/Foo/Bar.php
 */
class Autoloader {

	private static ?self $instance = null;

	/** @var array<string, object> */
	private array $components = [];

	public static function get_instance(): static {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		spl_autoload_register( [ $this, 'load_class' ] );
		$this->boot();
	}

	private function load_class( string $class ): void {
		$prefix = 'SeamlessReact\\';
		if ( strncmp( $class, $prefix, strlen( $prefix ) ) !== 0 ) {
			return;
		}

		$relative = substr( $class, strlen( $prefix ) );
		$file = SEAMLESS_REACT_SRC_DIR . str_replace( '\\', DIRECTORY_SEPARATOR, $relative ) . '.php';

		if ( file_exists( $file ) ) {
			require_once $file;
		}
	}

	private function boot(): void {
		// Always-on components
		$this->components['endpoints']     = new Endpoints\Endpoints();
		$this->components['auth']          = new Auth\SeamlessAuth();
		$this->components['sso']           = new Auth\SeamlessSSO();
		$this->components['access']        = new Auth\AccessController();

		if ( is_admin() ) {
			$this->components['restriction']  = new Admin\ContentRestrictionMeta();
		}

		// Only load SeamlessRender on the true frontend (not admin, not AJAX).
		// Loading it during AJAX (including Elementor editor AJAX) enqueues the
		// React bundle into the editor and corrupts the widget sidebar.
		$is_elementor_ajax = isset( $_REQUEST['action'] ) && (
			$_REQUEST['action'] === 'elementor_ajax' ||
			str_starts_with( (string) $_REQUEST['action'], 'elementor' )
		);

		if ( ! is_admin() && ! ( defined( 'DOING_AJAX' ) && DOING_AJAX ) ) {
			$this->components['render'] = new Frontend\SeamlessRender();
		} elseif ( defined( 'DOING_AJAX' ) && DOING_AJAX && ! $is_elementor_ajax ) {
			// For our own AJAX actions (not Elementor), still register AJAX hooks
			// but don't enqueue scripts.
			$this->components['render'] = new Frontend\SeamlessRender();
		}

		$this->components['elementor'] = Elementor\ElementorIntegration::get_instance();
	}

	public function get_component( string $key ): ?object {
		return $this->components[ $key ] ?? null;
	}
}
