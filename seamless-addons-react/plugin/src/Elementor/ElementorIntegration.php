<?php
namespace SeamlessReact\Elementor;

class ElementorIntegration {
	private static ?self $instance = null;

	public static function get_instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	public function __construct() {
		// Elementor widget hooks
		add_action( 'elementor/elements/categories_registered', [ $this, 'register_category' ] );
		add_action( 'elementor/widgets/register', [ $this, 'register_widgets' ] );
	}

	public function register_category( $elements_manager ) {
		$elements_manager->add_category(
			'seamless-react',
			[
				'title' => esc_html__( 'Seamless React', 'seamless-react' ),
				'icon'  => 'fa fa-plug',
			]
		);
	}

	public function register_widgets( $widgets_manager ) {
		$widgets = [
			'CoursesListWidget',
			'EventAdditionalDetailsWidget',
			'EventBreadcrumbsWidget',
			'EventDescriptionWidget',
			'EventExcerptWidget',
			'EventFeaturedImageWidget',
			'EventLocationWidget',
			'EventRegisterURLWidget',
			'EventSchedulesWidget',
			'EventSidebarWidget',
			'EventTicketsWidget',
			'EventTitleWidget',
			'EventsListWidget',
			'LoginButtonWidget',
			'MembershipComparePlansWidget',
			'MembershipsListWidget',
			'SingleEventWidget',
			'UserDashboardWidget',
		];

		foreach ( $widgets as $widget ) {
			$class = '\\SeamlessReact\\Elementor\\Widgets\\' . $widget;
			if ( class_exists( $class ) ) {
				try {
					$widgets_manager->register( new $class() );
				} catch ( \Throwable $e ) {
					error_log( 'Seamless React: failed to register ' . $widget . ': ' . $e->getMessage() );
				}
			}
		}
	}
}
