<?php

namespace SeamlessReact\Elementor\Widgets;

if ( ! class_exists( 'Elementor\\Widget_Base' ) ) { return; }

use SeamlessReact\Elementor\Widgets\Base\BaseWidget;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use function esc_html;
use function esc_url;
use function site_url;

/**
 * Event Breadcrumbs Widget
 * 
 * Displays breadcrumb navigation trail for events.
 */
class EventBreadcrumbsWidget extends BaseWidget
{
    /**
     * Get widget name.
     */
    public function get_name()
    {
        return 'seamless-event-breadcrumbs';
    }

    /**
     * Get widget title.
     */
    public function get_title()
    {
        return __('Event Breadcrumbs', 'seamless-react');
    }

    /**
     * Get widget icon.
     */
    public function get_icon()
    {
        return 'eicon-navigation-horizontal';
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
            'separator',
            [
                'label' => __('Separator', 'seamless-react'),
                'type' => Controls_Manager::TEXT,
                'default' => '»',
                'description' => __('Separator between breadcrumb items', 'seamless-react'),
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

        $this->add_responsive_control(
            'align',
            [
                'label' => __('Alignment', 'seamless-react'),
                'type' => Controls_Manager::CHOOSE,
                'options' => [
                    'left' => [
                        'title' => __('Left', 'seamless-react'),
                        'icon' => 'eicon-text-align-left',
                    ],
                    'center' => [
                        'title' => __('Center', 'seamless-react'),
                        'icon' => 'eicon-text-align-center',
                    ],
                    'right' => [
                        'title' => __('Right', 'seamless-react'),
                        'icon' => 'eicon-text-align-right',
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-breadcrumbs' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'typography',
                'selector' => '{{WRAPPER}} .seamless-breadcrumbs',
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'link_typography',
                'label' => __('Link Typography', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-breadcrumbs a',
            ]
        );

        $this->add_control(
            'link_color',
            [
                'label' => __('Link Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-breadcrumbs a' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'link_hover_color',
            [
                'label' => __('Link Hover Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-breadcrumbs a:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'current_color',
            [
                'label' => __('Current Page Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-breadcrumbs .current' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'separator_color',
            [
                'label' => __('Separator Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-breadcrumb-separator' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'separator_spacing',
            [
                'label' => __('Separator Horizontal Spacing', 'seamless-react'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-breadcrumb-separator' => 'margin: 0 {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'spacing',
            [
                'label' => __('Separator Vertical Spacing', 'seamless-react'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-breadcrumbs' => 'margin-bottom: {{SIZE}}{{UNIT}};',
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



