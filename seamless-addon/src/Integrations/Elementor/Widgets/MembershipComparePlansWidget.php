<?php

namespace SeamlessAddon\Integrations\Elementor\Widgets;

use SeamlessAddon\Integrations\Elementor\Widgets\Base\BaseWidget;
use SeamlessAddon\Services\MembershipService;
use Elementor\Controls_Manager;

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
        return \SeamlessAddon\Integrations\Elementor\ElementorIntegration::get_membership_service();
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
        return __('Membership Compare Plans', 'seamless-addon');
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
                'label' => __('Content', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'widget_info',
            [
                'type' => Controls_Manager::RAW_HTML,
                'raw' => __('<div style="padding: 10px; background: #0a1a3d; border-left: 3px solid #2563eb; color: #fff; font-style: italic; font-size: 12px; font-weight: 300;">This widget displays a comparison table of all membership plans with their features.</div>', 'seamless-addon'),
            ]
        );

        $this->end_controls_section();

        // Style Tab
        $this->start_controls_section(
            'style_section',
            [
                'label' => __('Style', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'header_bg_color',
            [
                'label' => __('Header Background', 'seamless-addon'),
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
                'label' => __('Header Text Color', 'seamless-addon'),
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
                'label' => __('Header Padding', 'seamless-addon'),
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
                'label' => __('Typography', 'seamless-addon'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'header_typography',
                'label' => __('Header Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-compare-header',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'plan_name_typography',
                'label' => __('Plan Name Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-compare-plan-name',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'plan_price_typography',
                'label' => __('Plan Price Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-compare-plan-price',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'row_typography',
                'label' => __('Row Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-compare-row td',
            ]
        );

        // Row Styling
        $this->add_control(
            'row_styling_heading',
            [
                'label' => __('Row Styling', 'seamless-addon'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'row_bg_color',
            [
                'label' => __('Row Background', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'default' => '#ffffff',
                'selectors' => [
                    '{{WRAPPER}} .seamless-compare-row' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'row_padding',
            [
                'label' => __('Row Padding', 'seamless-addon'),
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
                ],
            ]
        );

        $this->add_control(
            'border_color',
            [
                'label' => __('Border Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'default' => '#e0e0e0',
                'selectors' => [
                    '{{WRAPPER}} .seamless-compare-row' => 'border-bottom-color: {{VALUE}};',
                    '{{WRAPPER}} .seamless-compare-row td' => 'border-right-color: {{VALUE}};',
                    '{{WRAPPER}} .seamless-compare-header' => 'border-right-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'table_border_radius',
            [
                'label' => __('Table Border Radius', 'seamless-addon'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 30,
                    ],
                ],
                'default' => [
                    'size' => 10,
                    'unit' => 'px',
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-compare-table' => 'border-radius: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();
    }

    /**
     * Render widget output.
     */
    protected function render()
    {
        $settings = $this->get_settings_for_display();

        // Inline CSS for the comparison table
?>
        <style>
            .seamless-compare-table {
                width: 100%;
                border-collapse: collapse;
                overflow-x: auto;
                display: block;
                font-family: 'Roboto', sans-serif;
                border-radius: 18px;
            }

            .seamless-compare-table table {
                width: 100%;
                border-collapse: collapse;
                margin: 0;
            }

            .seamless-compare-header {
                padding: 20px 15px;
                text-align: center;
                font-weight: 700;
                font-size: 14px;
                border: none;
            }

            .seamless-compare-header:first-child {
                text-align: left;
                font-size: 18px;
            }

            .seamless-compare-plan-name {
                font-size: 16px;
                margin-bottom: 5px;
            }

            .seamless-compare-plan-price {
                font-size: 20px;
                font-weight: 800;
                margin-bottom: 3px;
            }

            .seamless-compare-plan-renewal {
                font-size: 11px;
                opacity: 0.8;
            }

            .seamless-compare-row {
                border-bottom: 1px solid #e0e0e0;
            }

            .seamless-compare-row td {
                padding: 15px;
                text-align: center;
                font-size: 13px;
                color: #666;
            }

            .seamless-compare-row td:first-child {
                text-align: left;
                font-weight: 600;
                color: #333;
            }

            @media (max-width: 768px) {
                .seamless-compare-table {
                    font-size: 12px;
                }

                .seamless-compare-header {
                    padding: 15px 10px;
                    font-size: 12px;
                }

                .seamless-compare-plan-price {
                    font-size: 16px;
                }
            }

            .seamless-loader,
            .seamless-no-memberships,
            .seamless-error {
                text-align: center;
                padding: 40px;
                color: #666;
            }
        </style>
<?php

        // Output wrapper for JS to target
        echo '<div class="seamless-membership-compare-wrapper">';
        echo '</div>'; // Content will be injected by JS
    }
}
