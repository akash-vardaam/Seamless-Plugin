<?php
namespace SeamlessReact\Elementor\Widgets;

if ( ! class_exists( 'Elementor\\Widget_Base' ) ) { return; }

if ( ! defined( 'ABSPATH' ) ) exit;

class SingleEventWidget extends \Elementor\Widget_Base {

	public function get_name() { return 'seamless-react-single_event'; }
	public function get_title() { return esc_html__( 'Single Event', 'seamless-react' ); }
	public function get_icon() { return 'eicon-single-post'; }
	public function get_categories() { return [ 'seamless-react' ]; }

	protected function register_controls() {
		$this->start_controls_section(
			'content_section',
			[
				'label' => esc_html__( 'Event Selection', 'seamless-react' ),
				'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
			]
		);

		$this->add_control(
			'event_slug',
			[
				'label' => esc_html__( 'Event Slug', 'seamless-react' ),
				'type' => \Elementor\Controls_Manager::TEXT,
				'placeholder' => esc_html__( 'my-awesome-event', 'seamless-react' ),
				'description' => esc_html__( 'Enter the exact slug of the event from the AMS.', 'seamless-react' ),
			]
		);

		$this->end_controls_section();
	}

	
    /**
     * Render widget output.
     */
    protected function render() {
        $settings = $this->get_settings_for_display();

        // Derive the view name: "seamless-events-list" -> "events-list"
        $view = preg_replace('/^seamless[-_](react[-_])?/', '', $this->get_name());
        $view = str_replace('_', '-', $view);

        // Build data-* attributes from widget-specific settings only (skip Elementor internals)
        $skip_prefixes = ['_', 'eael_'];
        $data_attrs = 'data-seamless-view="' . esc_attr( $view ) . '"';
        foreach ( $settings as $key => $val ) {
            $skip = false;
            foreach ( $skip_prefixes as $pfx ) {
                if ( strncmp( $key, $pfx, strlen( $pfx ) ) === 0 ) {
                    $skip = true;
                    break;
                }
            }
            if ( $skip ) continue;
            if ( is_array( $val ) ) {
                $val = implode( ',', array_filter( array_map( 'strval', $val ) ) );
            }
            $data_attrs .= ' data-' . esc_attr( str_replace( '_', '-', $key ) ) . '="' . esc_attr( (string) $val ) . '"';
        }

        printf(
            '<div id="seamless-react-%s-%s" class="seamless-react-mount" %s></div>',
            esc_attr( $view ),
            esc_attr( wp_generate_uuid4() ),
            $data_attrs
        );
    }
}



