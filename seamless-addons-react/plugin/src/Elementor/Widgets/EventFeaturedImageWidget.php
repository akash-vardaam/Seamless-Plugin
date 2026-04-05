<?php

namespace SeamlessReact\Elementor\Widgets;

if ( ! class_exists( 'Elementor\\Widget_Base' ) ) { return; }

use SeamlessReact\Elementor\Widgets\Base\BaseWidget;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Border;
use Elementor\Group_Control_Box_Shadow;
use Elementor\Group_Control_Css_Filter;
use function esc_attr;
use function esc_html;
use function esc_url;
use function site_url;
use function wp_kses_post;

/**
 * Event Featured Image Widget
 *
 * Displays the event's main/featured image.
 */
class EventFeaturedImageWidget extends BaseWidget
{
    /**
     * Get widget name.
     */
    public function get_name()
    {
        return 'seamless-event-featured-image';
    }

    /**
     * Get widget title.
     */
    public function get_title()
    {
        return __('Event Featured Image', 'seamless-react');
    }

    /**
     * Get widget icon.
     */
    public function get_icon()
    {
        return 'eicon-image';
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
            'link_to',
            [
                'label' => __('Link', 'seamless-react'),
                'type' => Controls_Manager::SELECT,
                'default' => 'none',
                'options' => [
                    'none' => __('None', 'seamless-react'),
                    'event' => __('Event Page', 'seamless-react'),
                    'custom' => __('Custom URL', 'seamless-react'),
                ],
            ]
        );

        $this->add_control(
            'custom_link',
            [
                'label' => __('Custom URL', 'seamless-react'),
                'type' => Controls_Manager::URL,
                'dynamic' => [
                    'active' => true,
                ],
                'condition' => [
                    'link_to' => 'custom',
                ],
                'show_external' => true,
            ]
        );

        $this->add_control(
            'caption_source',
            [
                'label' => __('Caption', 'seamless-react'),
                'type' => Controls_Manager::SELECT,
                'default' => 'none',
                'options' => [
                    'none' => __('None', 'seamless-react'),
                    'event_title' => __('Event Title', 'seamless-react'),
                    'custom' => __('Custom Caption', 'seamless-react'),
                ],
            ]
        );

        $this->add_control(
            'caption_text',
            [
                'label' => __('Custom Caption', 'seamless-react'),
                'type' => Controls_Manager::TEXT,
                'dynamic' => [
                    'active' => true,
                ],
                'condition' => [
                    'caption_source' => 'custom',
                ],
            ]
        );

        $this->add_control(
            'fallback_image',
            [
                'label' => __('Fallback Image', 'seamless-react'),
                'type' => Controls_Manager::MEDIA,
                'default' => [
                    'url' => SEAMLESS_REACT_URL . 'assets/images/placeholder-image.png',
                ],
                'description' => __('This image will be displayed if the event has no featured image.', 'seamless-react'),
            ]
        );

        $this->end_controls_section();

        // Style Section
        $this->start_controls_section(
            'style_section',
            [
                'label' => __('Image', 'seamless-react'),
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
                    '{{WRAPPER}} .seamless-event-featured-image' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'image_width',
            [
                'label' => __('Width', 'seamless-react'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', '%', 'em', 'rem', 'vw'],
                'range' => [
                    '%' => [
                        'min' => 1,
                        'max' => 100,
                    ],
                    'px' => [
                        'min' => 1,
                        'max' => 1000,
                    ],
                    'vw' => [
                        'min' => 1,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-featured-image img' => 'width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'image_max_width',
            [
                'label' => __('Max Width', 'seamless-react'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', '%', 'em', 'rem', 'vw'],
                'range' => [
                    '%' => [
                        'min' => 1,
                        'max' => 100,
                    ],
                    'px' => [
                        'min' => 1,
                        'max' => 1000,
                    ],
                    'vw' => [
                        'min' => 1,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-featured-image img' => 'max-width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'image_height',
            [
                'label' => __('Height', 'seamless-react'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', '%', 'vh', 'em', 'rem'],
                'range' => [
                    'px' => [
                        'min' => 1,
                        'max' => 800,
                    ],
                    'vh' => [
                        'min' => 1,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-featured-image img' => 'height: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'object_fit',
            [
                'label' => __('Object Fit', 'seamless-react'),
                'type' => Controls_Manager::SELECT,
                'default' => '',
                'options' => [
                    '' => __('Default', 'seamless-react'),
                    'fill' => __('Fill', 'seamless-react'),
                    'cover' => __('Cover', 'seamless-react'),
                    'contain' => __('Contain', 'seamless-react'),
                    'scale-down' => __('Scale Down', 'seamless-react'),
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-featured-image img' => 'object-fit: {{VALUE}};',
                ],
                'condition' => [
                    'image_height[size]!' => '',
                ],
            ]
        );

        $this->add_responsive_control(
            'object_position',
            [
                'label' => __('Object Position', 'seamless-react'),
                'type' => Controls_Manager::SELECT,
                'default' => 'center center',
                'options' => [
                    'center center' => __('Center Center', 'seamless-react'),
                    'center left' => __('Center Left', 'seamless-react'),
                    'center right' => __('Center Right', 'seamless-react'),
                    'top center' => __('Top Center', 'seamless-react'),
                    'top left' => __('Top Left', 'seamless-react'),
                    'top right' => __('Top Right', 'seamless-react'),
                    'bottom center' => __('Bottom Center', 'seamless-react'),
                    'bottom left' => __('Bottom Left', 'seamless-react'),
                    'bottom right' => __('Bottom Right', 'seamless-react'),
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-featured-image img' => 'object-position: {{VALUE}};',
                ],
                'condition' => [
                    'image_height[size]!' => '',
                ],
            ]
        );

        $this->add_responsive_control(
            'image_border_radius',
            [
                'label' => __('Border Radius', 'seamless-react'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-featured-image img' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name' => 'image_border',
                'selector' => '{{WRAPPER}} .seamless-event-featured-image img',
            ]
        );

        $this->add_group_control(
            Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'image_box_shadow',
                'selector' => '{{WRAPPER}} .seamless-event-featured-image img',
            ]
        );

        $this->add_group_control(
            Group_Control_Css_Filter::get_type(),
            [
                'name' => 'image_css_filters',
                'selector' => '{{WRAPPER}} .seamless-event-featured-image img',
            ]
        );

        $this->add_control(
            'image_opacity',
            [
                'label' => __('Opacity', 'seamless-react'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 1,
                        'step' => 0.1,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-featured-image img' => 'opacity: {{SIZE}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Caption Style
        $this->start_controls_section(
            'caption_style_section',
            [
                'label' => __('Caption', 'seamless-react'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'caption_typography',
                'selector' => '{{WRAPPER}} .seamless-event-featured-caption',
            ]
        );

        $this->add_control(
            'caption_color',
            [
                'label' => __('Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-featured-caption' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'caption_margin',
            [
                'label' => __('Margin', 'seamless-react'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-featured-caption' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
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



