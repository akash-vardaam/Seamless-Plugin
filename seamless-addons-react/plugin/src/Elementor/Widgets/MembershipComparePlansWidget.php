<?php

namespace SeamlessReact\Elementor\Widgets;

if ( ! class_exists( 'Elementor\\Widget_Base' ) ) { return; }

use SeamlessReact\Elementor\Widgets\Base\BaseWidget;
use Elementor\Controls_Manager;
use function esc_attr;

/**
 * Membership Compare Plans Widget
 * 
 * Elementor widget for displaying membership plans in a comparison table.
 */
class MembershipComparePlansWidget extends BaseWidget
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
        return 'seamless-membership-compare';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title()
    {
        return __('Membership Compare Plans', 'seamless-react');
    }

    /**
     * Get widget icon.
     *
     * @return string Widget icon.
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
                'raw' => __('<div style="padding: 10px; background: #0a1a3d; border-left: 3px solid #2563eb; color: #fff; font-style: italic; font-size: 12px; font-weight: 300;">This widget displays a comparison table of all membership plans with their features.</div>', 'seamless-react'),
            ]
        );

        $this->add_control(
            'compare_title',
            [
                'label' => __('Section Title', 'seamless-react'),
                'type' => Controls_Manager::TEXT,
                'default' => __('Compare Plans', 'seamless-react'),
                'label_block' => true,
            ]
        );

        $this->add_control(
            'compare_note',
            [
                'label' => __('Top Note', 'seamless-react'),
                'type' => Controls_Manager::TEXT,
                'default' => __('See what\'s included before you decide.', 'seamless-react'),
                'label_block' => true,
            ]
        );

        $this->add_control(
            'offering_label',
            [
                'label' => __('Offering Column Label', 'seamless-react'),
                'type' => Controls_Manager::TEXT,
                'default' => __('Offering', 'seamless-react'),
                'label_block' => true,
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

        $this->add_control(
            'intro_heading',
            [
                'label' => __('Intro', 'seamless-react'),
                'type' => Controls_Manager::HEADING,
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'compare_title_typography',
                'label' => __('Title Typography', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-compare-title',
            ]
        );

        $this->add_control(
            'compare_title_color',
            [
                'label' => __('Title Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => '#122f4a',
                'selectors' => [
                    '{{WRAPPER}} .seamless-compare-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'compare_note_typography',
                'label' => __('Note Typography', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-compare-note',
            ]
        );

        $this->add_control(
            'compare_note_text_color',
            [
                'label' => __('Note Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => '#516579',
                'selectors' => [
                    '{{WRAPPER}} .seamless-compare-note' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'compare_note_bg_color',
            [
                'label' => __('Note Background', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => '#ffffff',
                'selectors' => [
                    '{{WRAPPER}} .seamless-compare-note' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'compare_note_border_color',
            [
                'label' => __('Note Border Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => '#e2e8f0',
                'selectors' => [
                    '{{WRAPPER}} .seamless-compare-note' => 'border-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'header_bg_color',
            [
                'label' => __('Header Background', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => 'var(--seamless-primary-color)',
                'selectors' => [
                    '{{WRAPPER}} .seamless-compare-header' => 'background-color: {{VALUE}} !important;',
                ],
            ]
        );

        $this->add_control(
            'header_text_color',
            [
                'label' => __('Header Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => '#ffffff',
                'selectors' => [
                    '{{WRAPPER}} .seamless-compare-header' => 'color: {{VALUE}} !important;',
                    '{{WRAPPER}} .seamless-compare-plan-name' => 'color: {{VALUE}} !important;',
                    '{{WRAPPER}} .seamless-compare-plan-price' => 'color: {{VALUE}} !important;',
                    '{{WRAPPER}} .seamless-compare-plan-renewal' => 'color: {{VALUE}} !important;',
                ],
            ]
        );

        $this->add_responsive_control(
            'header_padding',
            [
                'label' => __('Header Padding', 'seamless-react'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em'],
                'default' => [
                    'top' => 20,
                    'right' => 15,
                    'bottom' => 20,
                    'left' => 15,
                    'unit' => 'px',
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-compare-header' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
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
                'name' => 'header_typography',
                'label' => __('Header Typography', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-compare-header',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'plan_name_typography',
                'label' => __('Plan Name Typography', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-compare-plan-name',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'plan_price_typography',
                'label' => __('Plan Price Typography', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-compare-plan-price',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'row_typography',
                'label' => __('Row Typography', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-compare-row td:not(.seamless-compare-feature-title)',
            ]
        );

        // Row Styling
        $this->add_control(
            'row_styling_heading',
            [
                'label' => __('Row Styling', 'seamless-react'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'row_bg_color',
            [
                'label' => __('Row Background', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => '#ffffff',
                'selectors' => [
                    '{{WRAPPER}} .seamless-compare-row td:not(.seamless-compare-feature-title)' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'feature_column_bg_color',
            [
                'label' => __('Feature Column Background', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => '#f8fafc',
                'selectors' => [
                    '{{WRAPPER}} .seamless-compare-feature-title' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'feature_column_text_color',
            [
                'label' => __('Feature Column Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => '#122f4a',
                'selectors' => [
                    '{{WRAPPER}} .seamless-compare-feature-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'row_padding',
            [
                'label' => __('Row Padding', 'seamless-react'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em'],
                'default' => [
                    'top' => 15,
                    'right' => 15,
                    'bottom' => 15,
                    'left' => 15,
                    'unit' => 'px',
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-compare-row td' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                    '{{WRAPPER}} .seamless-compare-feature-title' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'border_color',
            [
                'label' => __('Border Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'default' => '#eee',
                'selectors' => [
                    '{{WRAPPER}} .seamless-compare-row' => 'border-bottom-color: {{VALUE}};',
                    '{{WRAPPER}} .seamless-compare-row td' => 'border-color: {{VALUE}};',
                    '{{WRAPPER}} .seamless-compare-header' => 'border-color: {{VALUE}};',
                    '{{WRAPPER}} .seamless-compare-table-shell' => 'border-color: {{VALUE}};',
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



