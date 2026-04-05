<?php

namespace SeamlessReact\Elementor\Widgets;

if ( ! class_exists( 'Elementor\\Widget_Base' ) ) { return; }

use SeamlessReact\Elementor\Widgets\Base\BaseWidget;
use Elementor\Controls_Manager;
use function esc_html;
use function esc_url;
use function get_option;

/**
 * Memberships List Widget
 * 
 * Elementor widget for displaying memberships in card layout.
 */
class MembershipsListWidget extends BaseWidget
{
    /**
     * Get membership service instance.
     *
     * @return MembershipService
     */
    private function get_membership_service()
    {
        return null;
    }

    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name()
    {
        return 'seamless-memberships-list';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title()
    {
        return __('Memberships List', 'seamless-react');
    }

    /**
     * Get widget icon.
     *
     * @return string Widget icon.
     */
    public function get_icon()
    {
        return 'eicon-person';
    }

    /**
     * Register widget controls.
     */
    protected function register_controls()
    {
        // Content Tab
        $this->start_controls_section(
            'content_section',
            [
                'label' => __('Content', 'seamless-react'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'widget_info',
            [
                'type' => Controls_Manager::RAW_HTML,
                'raw' => __('<div style="padding: 10px; background: #0a1a3d; border-left: 3px solid #2563eb; color: #fff; font-style: italic; font-size: 12px; font-weight: 300;">This widget displays all available membership plans in a responsive grid layout.</div>', 'seamless-react'),
            ]
        );

        $this->end_controls_section();

        // Style Tab
        $this->start_controls_section(
            'style_section',
            [
                'label' => __('Style', 'seamless-react'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
            'columns',
            [
                'label' => __('Columns', 'seamless-react'),
                'type' => Controls_Manager::SELECT,
                'options' => [
                    '1' => '1',
                    '2' => '2',
                    '3' => '3',
                    '4' => '4',
                ],
                'default' => '3',
                'tablet_default' => '2',
                'mobile_default' => '1',
                'selectors' => [
                    '{{WRAPPER}} .seamless-membership-grid' => 'grid-template-columns: repeat({{VALUE}}, 1fr);',
                ],
            ]
        );

        // Typography
        $this->add_control(
            'typography_heading',
            [
                'label' => __('Typography', 'seamless-react'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'title_typography',
                'label' => __('Title Typography', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-card-title',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'description_typography',
                'label' => __('Description Typography', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-card-description',
            ]
        );

        $this->add_control(
            'description_color',
            [
                'label' => __('Description Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => '#666',
                'selectors' => [
                    '{{WRAPPER}} .seamless-card-description' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'price_typography',
                'label' => __('Price Typography', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-card-price-bubble',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'button_typography',
                'label' => __('Button Typography', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-card-button',
            ]
        );

        // Title Color
        $this->add_control(
            'title_color',
            [
                'label' => __('Title Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => 'var(--seamless-button-text-color)',
                'selectors' => [
                    '{{WRAPPER}} .seamless-card-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        // Meta Info Styling
        $this->add_control(
            'meta_info_heading',
            [
                'label' => __('Meta Info', 'seamless-react'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'meta_badge_bg',
            [
                'label' => __('Badge Background', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => '#f5f5f5',
                'selectors' => [
                    '{{WRAPPER}} .seamless-meta-badge' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'meta_badge_color',
            [
                'label' => __('Badge Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => '#666',
                'selectors' => [
                    '{{WRAPPER}} .seamless-meta-badge' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'renewal_text_color',
            [
                'label' => __('Renewal Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => '#999',
                'selectors' => [
                    '{{WRAPPER}} .seamless-renewal-text' => 'color: {{VALUE}};',
                ],
            ]
        );

        // Features Styling
        $this->add_control(
            'features_heading',
            [
                'label' => __('Features', 'seamless-react'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'features_typography',
                'label' => __('Features Typography', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-feature-item',
            ]
        );

        $this->add_control(
            'feature_text_color',
            [
                'label' => __('Feature Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => '#555',
                'selectors' => [
                    '{{WRAPPER}} .seamless-feature-item' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'feature_icon_color',
            [
                'label' => __('Feature Icon Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => '#333',
                'selectors' => [
                    '{{WRAPPER}} .seamless-feature-icon' => 'color: {{VALUE}};',
                ],
            ]
        );

        // Price Styling
        $this->add_control(
            'price_heading',
            [
                'label' => __('Price Badge', 'seamless-react'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'price_bg_color',
            [
                'label' => __('Price Background', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => 'var(--seamless-secondary-color)',
                'selectors' => [
                    '{{WRAPPER}} .seamless-card-price-bubble' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'price_text_color',
            [
                'label' => __('Price Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => 'var(--seamless-background-color)',
                'selectors' => [
                    '{{WRAPPER}} .seamless-card-price-bubble' => 'color: {{VALUE}};',
                ],
            ]
        );

        // Button Styling
        $this->add_control(
            'button_heading',
            [
                'label' => __('Button', 'seamless-react'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'button_bg_color',
            [
                'label' => __('Button Background', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => 'var(--seamless-secondary-color)',
                'selectors' => [
                    '{{WRAPPER}} .seamless-card-button' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_text_color',
            [
                'label' => __('Button Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => 'var(--seamless-background-color)',
                'selectors' => [
                    '{{WRAPPER}} .seamless-card-button' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_hover_bg',
            [
                'label' => __('Button Hover Background', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => 'var(--seamless-secondary-color)',
                'selectors' => [
                    '{{WRAPPER}} .seamless-card-button:hover' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_hover_text_color',
            [
                'label' => __('Button Hover Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => 'var(--seamless-background-color)',
                'selectors' => [
                    '{{WRAPPER}} .seamless-card-button:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'button_padding',
            [
                'label' => __('Button Padding', 'seamless-react'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'default' => [
                    'top' => 15,
                    'right' => 15,
                    'bottom' => 15,
                    'left' => 15,
                    'unit' => 'px',
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-card-button' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'button_border_radius',
            [
                'label' => __('Button Border Radius', 'seamless-react'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', '%'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                    ],
                ],
                'default' => [
                    'size' => 10,
                    'unit' => 'px',
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-card-button' => 'border-radius: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name' => 'button_border',
                'label' => __('Button Border', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-card-button',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'button_box_shadow',
                'label' => __('Button Shadow', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-card-button',
            ]
        );

        $this->add_control(
            'card_border_radius',
            [
                'label' => __('Card Border Radius', 'seamless-react'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                    ],
                ],
                'default' => [
                    'size' => 8,
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-membership-card' => 'border-radius: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'card_box_shadow',
                'label' => __('Card Shadow', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-membership-card',
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



