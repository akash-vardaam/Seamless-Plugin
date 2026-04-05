<?php

namespace SeamlessReact\Elementor\Widgets;

if ( ! class_exists( 'Elementor\\Widget_Base' ) ) { return; }

use SeamlessReact\Elementor\Widgets\Base\BaseWidget;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Border;
use Elementor\Group_Control_Background;
use function esc_attr;
use function esc_html;
use function esc_url;
use function wp_strip_all_tags;
use function wp_timezone;
use function wp_timezone_string;

/**
 * Event Sidebar Widget
 * 
 * Displays event metadata in sidebar card with toggles for each field.
 */
class EventSidebarWidget extends BaseWidget
{
    /**
     * Get widget name.
     */
    public function get_name()
    {
        return 'seamless-event-sidebar';
    }

    /**
     * Get widget title.
     */
    public function get_title()
    {
        return __('Event Sidebar', 'seamless-react');
    }

    /**
     * Get widget icon.
     */
    public function get_icon()
    {
        return 'eicon-info-box';
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
            'show_date',
            [
                'label' => __('Show Date', 'seamless-react'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-react'),
                'label_off' => __('No', 'seamless-react'),
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_time',
            [
                'label' => __('Show Time', 'seamless-react'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-react'),
                'label_off' => __('No', 'seamless-react'),
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_location',
            [
                'label' => __('Show Location', 'seamless-react'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-react'),
                'label_off' => __('No', 'seamless-react'),
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_capacity',
            [
                'label' => __('Show Capacity', 'seamless-react'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-react'),
                'label_off' => __('No', 'seamless-react'),
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_add_to_calendar',
            [
                'label' => __('Show Add to Calendar', 'seamless-react'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-react'),
                'label_off' => __('No', 'seamless-react'),
                'default' => 'yes',
            ]
        );

        $this->end_controls_section();

        // Card Style Section
        $this->start_controls_section(
            'card_style_section',
            [
                'label' => __('Card Style', 'seamless-react'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name' => 'card_background',
                'types' => ['classic', 'gradient'],
                'selector' => '{{WRAPPER}} .event-info-card',
            ]
        );

        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name' => 'card_border',
                'selector' => '{{WRAPPER}} .event-info-card',
            ]
        );

        $this->add_responsive_control(
            'card_border_radius',
            [
                'label' => __('Border Radius', 'seamless-react'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .event-info-card' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'card_padding',
            [
                'label' => __('Padding', 'seamless-react'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .event-info-card' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Icon Style Section
        $this->start_controls_section(
            'icon_style_section',
            [
                'label' => __('Icon Style', 'seamless-react'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'icon_color',
            [
                'label' => __('Icon Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-info-item i' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .event-icon' => 'stroke: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'icon_size',
            [
                'label' => __('Icon Size', 'seamless-react'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => [
                        'min' => 10,
                        'max' => 50,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .event-info-item i' => 'font-size: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .event-icon' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'icon_spacing',
            [
                'label' => __('Icon Horizontal Spacing', 'seamless-react'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .event-info-item i' => 'margin-right: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .event-icon' => 'margin-right: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'icon_vertical_spacing',
            [
                'label' => __('Icon Vertical Spacing', 'seamless-react'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .event-info-item i' => 'margin-top: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .event-icon' => 'margin-top: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Label Style Section
        $this->start_controls_section(
            'label_style_section',
            [
                'label' => __('Label Style', 'seamless-react'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'label_typography',
                'selector' => '{{WRAPPER}} .event-info-label',
            ]
        );

        $this->add_control(
            'label_color',
            [
                'label' => __('Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-info-label' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Value Style Section
        $this->start_controls_section(
            'value_style_section',
            [
                'label' => __('Value Style', 'seamless-react'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'value_typography',
                'selector' => '{{WRAPPER}} .event-info-value',
            ]
        );

        $this->add_control(
            'value_color',
            [
                'label' => __('Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-info-value' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Item Spacing Section
        $this->start_controls_section(
            'spacing_style_section',
            [
                'label' => __('Spacing', 'seamless-react'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
            'item_spacing',
            [
                'label' => __('Item Spacing', 'seamless-react'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .event-info-item' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'last_item_spacing',
            [
                'label' => __('Last Item Spacing', 'seamless-react'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .event-info-item:last-child' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Add to Calendar Button Style
        $this->start_controls_section(
            'calendar_button_style_section',
            [
                'label' => __('Add to Calendar Button', 'seamless-react'),
                'tab' => Controls_Manager::TAB_STYLE,
                'condition' => [
                    'show_add_to_calendar' => 'yes',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'calendar_button_typography',
                'selector' => '{{WRAPPER}} add-to-calendar-button',
            ]
        );

        $this->add_control(
            'calendar_button_color',
            [
                'label' => __('Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} add-to-calendar-button' => '--btn-text: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'calendar_button_bg',
            [
                'label' => __('Background Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} add-to-calendar-button' => '--btn-background: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'calendar_button_border_color',
            [
                'label' => __('Border Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} add-to-calendar-button' => '--btn-border: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'calendar_button_hover_color',
            [
                'label' => __('Hover Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} add-to-calendar-button' => '--btn-hover-text: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'calendar_button_hover_bg',
            [
                'label' => __('Hover Background', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} add-to-calendar-button' => '--btn-hover-background: {{VALUE}};',
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



