<?php

namespace SeamlessAddon\Integrations\Elementor\Widgets;

use SeamlessAddon\Integrations\Elementor\Widgets\Base\BaseWidget;
use SeamlessAddon\Services\MembershipService;
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

        $this->add_control(
            'compare_title',
            [
                'label' => __('Section Title', 'seamless-addon'),
                'type' => Controls_Manager::TEXT,
                'default' => __('Compare Plans', 'seamless-addon'),
                'label_block' => true,
            ]
        );

        $this->add_control(
            'compare_note',
            [
                'label' => __('Top Note', 'seamless-addon'),
                'type' => Controls_Manager::TEXT,
                'default' => __('See what\'s included before you decide.', 'seamless-addon'),
                'label_block' => true,
            ]
        );

        $this->add_control(
            'offering_label',
            [
                'label' => __('Offering Column Label', 'seamless-addon'),
                'type' => Controls_Manager::TEXT,
                'default' => __('Offering', 'seamless-addon'),
                'label_block' => true,
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
            'intro_heading',
            [
                'label' => __('Intro', 'seamless-addon'),
                'type' => Controls_Manager::HEADING,
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'compare_title_typography',
                'label' => __('Title Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-compare-title',
            ]
        );

        $this->add_control(
            'compare_title_color',
            [
                'label' => __('Title Color', 'seamless-addon'),
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
                'label' => __('Note Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-compare-note',
            ]
        );

        $this->add_control(
            'compare_note_text_color',
            [
                'label' => __('Note Text Color', 'seamless-addon'),
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
                'label' => __('Note Background', 'seamless-addon'),
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
                'label' => __('Note Border Color', 'seamless-addon'),
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
                'selector' => '{{WRAPPER}} .seamless-compare-row td:not(.seamless-compare-feature-title)',
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
                    '{{WRAPPER}} .seamless-compare-row td:not(.seamless-compare-feature-title)' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'feature_column_bg_color',
            [
                'label' => __('Feature Column Background', 'seamless-addon'),
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
                'label' => __('Feature Column Text Color', 'seamless-addon'),
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
                    '{{WRAPPER}} .seamless-compare-feature-title' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'border_color',
            [
                'label' => __('Border Color', 'seamless-addon'),
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
    protected function render()
    {
        $settings = $this->get_settings_for_display();

        // Inline CSS for the comparison table
?>
        <style>
            .seamless-compare-section {
                display: flex;
                flex-direction: column;
                gap: 22px;
            }

            .seamless-compare-section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 16px;
            }

            .seamless-compare-title {
                margin: 0;
                font-size: 40px;
                line-height: 1.1;
                font-weight: 700;
                color: #122f4a;
            }

            .seamless-compare-note {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 38px;
                padding: 8px 18px;
                border: 1px solid #e2e8f0;
                border-radius: 999px;
                background: #ffffff;
                color: #516579;
                font-size: 16px;
                line-height: 1.3;
                text-align: center;
                box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
            }

            .seamless-compare-table-shell {
                /* border: 1px solid #eee;
                border-radius: 18px;
                overflow: hidden; */
                background: #ffffff;
                box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
            }

            .seamless-compare-table {
                width: 100%;
                overflow-x: auto;
                display: block;
                font-family: 'Roboto', sans-serif;
            }

            .seamless-compare-table table {
                width: 100%;
                border-collapse: separate;
                margin: 0;
                table-layout: fixed;
            }

            .seamless-compare-header {
                padding: 18px 14px;
                text-align: center;
                font-weight: 700;
                font-size: 14px;
                border: none;
                background: #122f4a;
                color: #ffffff;
            }

            .seamless-compare-header:first-child {
                text-align: left;
                font-size: 18px;
                width: 30%;
                border-top-left-radius: 18px;
            }

            .seamless-compare-header:last-child {
                border-top-right-radius: 18px;
            }

            .seamless-compare-plan-name {
                font-size: 16px;
            }

            .seamless-compare-plan-price {
                display: inline-block;
                font-size: 14px;
                font-weight: 700;
                line-height: 1.2;
                opacity: 0.95;
            }

            .seamless-compare-row {
                border-bottom: 1px solid #eee;
            }

            .seamless-compare-row td {
                padding: 18px 14px;
                text-align: center;
                vertical-align: top;
                font-size: 14px;
                line-height: 1.45;
                color: #243b53;
                background: #ffffff;
                border-top: 1px solid #eee;
            }

            .seamless-compare-row td:first-child,
            .seamless-compare-feature-title {
                text-align: left;
                font-weight: 600;
                color: #122f4a;
                background: #f8fafc;
            }

            .seamless-compare-feature-title {
                width: 30%;
            }

            .seamless-compare-cell-empty {
                color: #c4ced8;
            }

            .seamless-compare-empty-state {
                text-align: center;
                padding: 30px;
            }

            .seamless-compare-row:last-child .seamless-compare-feature-title {
                border-bottom-left-radius: 18px;
            }

            .seamless-compare-row:last-child td:last-child {
                border-bottom-right-radius: 18px;
            }

            @media (max-width: 768px) {
                .seamless-compare-section-header {
                    flex-direction: column;
                    align-items: flex-start;
                }

                .seamless-compare-title {
                    font-size: 30px;
                }

                .seamless-compare-note {
                    width: 100%;
                    border-radius: 16px;
                }

                .seamless-compare-table {
                    font-size: 12px;
                }

                .seamless-compare-header {
                    padding: 15px 10px;
                    font-size: 12px;
                }

                .seamless-compare-plan-price {
                    font-size: 12px;
                }
            }

            .seamless-loader,
            .seamless-no-memberships,
            .seamless-error {
                text-align: center;
                padding: 40px;
                color: #666;
            }

            .seamless-loader {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
            }
        </style>
<?php

        // Output wrapper for JS to target
        echo '<div class="seamless-membership-compare-wrapper"';
        echo ' data-compare-title="' . esc_attr($settings['compare_title'] ?? __('Compare Plans', 'seamless-addon')) . '"';
        echo ' data-compare-note="' . esc_attr($settings['compare_note'] ?? __('See what\'s included before you decide.', 'seamless-addon')) . '"';
        echo ' data-offering-label="' . esc_attr($settings['offering_label'] ?? __('Offering', 'seamless-addon')) . '"';
        echo '>';
        echo '</div>'; // Content will be injected by JS
    }
}
