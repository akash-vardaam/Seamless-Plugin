<?php

namespace SeamlessReact\Elementor\Widgets;

if ( ! class_exists( 'Elementor\\Widget_Base' ) ) { return; }

use SeamlessReact\Elementor\Widgets\Base\BaseWidget;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Border;

/**
 * Event Schedules Widget
 * 
 * Displays event schedules in accordion with table layout.
 */
class EventSchedulesWidget extends BaseWidget
{
    /**
     * Get widget name.
     */
    public function get_name()
    {
        return 'seamless-event-schedules';
    }

    /**
     * Get widget title.
     */
    public function get_title()
    {
        return __('Event Schedules', 'seamless-react');
    }

    /**
     * Get widget icon.
     */
    public function get_icon()
    {
        return 'eicon-table';
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

        $this->add_control(
            'accordion_title',
            [
                'label' => __('Accordion Title', 'seamless-react'),
                'type' => Controls_Manager::TEXT,
                'default' => 'Schedule',
                'description' => __('Title for the accordion header', 'seamless-react'),
            ]
        );

        $this->end_controls_section();

        // Accordion Style Section
        $this->start_controls_section(
            'accordion_style_section',
            [
                'label' => __('Accordion Style', 'seamless-react'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_accordion_style_controls();

        $this->end_controls_section();

        // Table Style Section
        $this->start_controls_section(
            'table_style_section',
            [
                'label' => __('Table Style', 'seamless-react'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'table_header_heading',
            [
                'label' => __('Table Header', 'seamless-react'),
                'type' => Controls_Manager::HEADING,
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'table_header_typography',
                'selector' => '{{WRAPPER}} .event-schedule-table thead th',
            ]
        );

        $this->add_control(
            'table_header_color',
            [
                'label' => __('Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-schedule-table thead th' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'table_header_bg',
            [
                'label' => __('Background Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-schedule-table thead th' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'table_body_heading',
            [
                'label' => __('Table Body', 'seamless-react'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'table_body_typography',
                'selector' => '{{WRAPPER}} .event-schedule-table tbody td',
            ]
        );

        $this->add_control(
            'table_body_color',
            [
                'label' => __('Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-schedule-table tbody td' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'table_row_bg',
            [
                'label' => __('Row Background', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-schedule-table tbody tr' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'table_row_alternate_bg',
            [
                'label' => __('Alternate Row Background', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-schedule-table tbody tr:nth-child(even)' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name' => 'table_border',
                'selector' => '{{WRAPPER}} .event-schedule-table, {{WRAPPER}} .event-schedule-table th, {{WRAPPER}} .event-schedule-table td',
            ]
        );

        $this->add_responsive_control(
            'table_cell_padding',
            [
                'label' => __('Cell Padding', 'seamless-react'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em'],
                'selectors' => [
                    '{{WRAPPER}} .event-schedule-table th, {{WRAPPER}} .event-schedule-table td' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
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



