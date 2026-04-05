<?php

namespace SeamlessReact\Elementor\Widgets;

if ( ! class_exists( 'Elementor\\Widget_Base' ) ) { return; }

use SeamlessReact\Elementor\Widgets\Base\BaseWidget;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;

/**
 * Event Location Widget
 * 
 * Displays event location with granular toggle controls for each part.
 */
class EventLocationWidget extends BaseWidget
{
    /**
     * Get widget name.
     */
    public function get_name()
    {
        return 'seamless-event-location';
    }

    /**
     * Get widget title.
     */
    public function get_title()
    {
        return __('Event Location', 'seamless-react');
    }

    /**
     * Get widget icon.
     */
    public function get_icon()
    {
        return 'eicon-map-pin';
    }

    /**
     * Register widget controls.
     */
    protected function register_controls()
    {
        // Content Section
        $this->start_controls_section(
            'content_section',
            [
                'label' => __('Content', 'seamless-react'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_event_selection_controls();

        // Location Parts Toggles
        $this->add_control(
            'location_parts_heading',
            [
                'label' => __('Location Parts', 'seamless-react'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'show_venue_name',
            [
                'label' => __('Show Venue Name', 'seamless-react'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-react'),
                'label_off' => __('No', 'seamless-react'),
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_google_map_link',
            [
                'label' => __('Show Google Maps Link', 'seamless-react'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-react'),
                'label_off' => __('No', 'seamless-react'),
                'default' => 'yes',
                'condition' => [
                    'show_venue_name' => 'yes',
                ],
            ]
        );

        $this->add_control(
            'show_address',
            [
                'label' => __('Show Address Line', 'seamless-react'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-react'),
                'label_off' => __('No', 'seamless-react'),
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_city',
            [
                'label' => __('Show City', 'seamless-react'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-react'),
                'label_off' => __('No', 'seamless-react'),
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_state',
            [
                'label' => __('Show State', 'seamless-react'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-react'),
                'label_off' => __('No', 'seamless-react'),
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_zip',
            [
                'label' => __('Show Zip Code', 'seamless-react'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-react'),
                'label_off' => __('No', 'seamless-react'),
                'default' => 'yes',
            ]
        );

        $this->end_controls_section();

        // Style Section
        $this->start_controls_section(
            'style_section',
            [
                'label' => __('Style', 'seamless-react'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'typography',
                'selector' => '{{WRAPPER}} .event-info-value',
            ]
        );

        $this->add_control(
            'text_color',
            [
                'label' => __('Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-info-value' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'link_color',
            [
                'label' => __('Link Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .venue-link' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'link_hover_color',
            [
                'label' => __('Link Hover Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .venue-link:hover' => 'color: {{VALUE}};',
                ],
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



