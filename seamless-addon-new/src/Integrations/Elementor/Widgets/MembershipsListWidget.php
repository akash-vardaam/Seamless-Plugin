<?php

namespace SeamlessAddon\Integrations\Elementor\Widgets;

use SeamlessAddon\Integrations\Elementor\Widgets\Base\BaseWidget;
use SeamlessAddon\Services\MembershipService;
use SeamlessAddon\Helpers\Helper;
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
        return \SeamlessAddon\Integrations\Elementor\ElementorIntegration::get_membership_service();
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
        return __('Memberships List', 'seamless-addon');
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
                'label' => __('Content', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'widget_info',
            [
                'type' => Controls_Manager::RAW_HTML,
                'raw' => __('<div style="padding: 10px; background: #0a1a3d; border-left: 3px solid #2563eb; color: #fff; font-style: italic; font-size: 12px; font-weight: 300;">This widget displays all available membership plans in a responsive grid layout.</div>', 'seamless-addon'),
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

        $this->add_responsive_control(
            'columns',
            [
                'label' => __('Columns', 'seamless-addon'),
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
                'label' => __('Typography', 'seamless-addon'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'title_typography',
                'label' => __('Title Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-card-title',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'description_typography',
                'label' => __('Description Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-card-description',
            ]
        );

        $this->add_control(
            'description_color',
            [
                'label' => __('Description Color', 'seamless-addon'),
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
                'label' => __('Price Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-card-price-bubble',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'button_typography',
                'label' => __('Button Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-card-button',
            ]
        );

        // Title Color
        $this->add_control(
            'title_color',
            [
                'label' => __('Title Color', 'seamless-addon'),
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
                'label' => __('Meta Info', 'seamless-addon'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'meta_badge_bg',
            [
                'label' => __('Badge Background', 'seamless-addon'),
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
                'label' => __('Badge Text Color', 'seamless-addon'),
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
                'label' => __('Renewal Text Color', 'seamless-addon'),
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
                'label' => __('Features', 'seamless-addon'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'features_typography',
                'label' => __('Features Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-feature-item',
            ]
        );

        $this->add_control(
            'feature_text_color',
            [
                'label' => __('Feature Text Color', 'seamless-addon'),
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
                'label' => __('Feature Icon Color', 'seamless-addon'),
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
                'label' => __('Price Badge', 'seamless-addon'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'price_bg_color',
            [
                'label' => __('Price Background', 'seamless-addon'),
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
                'label' => __('Price Text Color', 'seamless-addon'),
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
                'label' => __('Button', 'seamless-addon'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'button_bg_color',
            [
                'label' => __('Button Background', 'seamless-addon'),
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
                'label' => __('Button Text Color', 'seamless-addon'),
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
                'label' => __('Button Hover Background', 'seamless-addon'),
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
                'label' => __('Button Hover Text Color', 'seamless-addon'),
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
                'label' => __('Button Padding', 'seamless-addon'),
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
                'label' => __('Button Border Radius', 'seamless-addon'),
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
                'label' => __('Button Border', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-card-button',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'button_box_shadow',
                'label' => __('Button Shadow', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-card-button',
            ]
        );

        $this->add_control(
            'card_border_radius',
            [
                'label' => __('Card Border Radius', 'seamless-addon'),
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
                'label' => __('Card Shadow', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-membership-card',
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
        $columns = isset($settings['columns']) ? $settings['columns'] : '3';

        // Inline CSS for the widget
?>
        <style>
            .seamless-membership-grid {
                display: grid;
                grid-template-columns: repeat(<?php echo esc_attr($columns); ?>, 1fr);
                gap: 30px;
                font-family: 'Roboto', sans-serif;
                /* Fallback */
            }

            .seamless-membership-card {
                background: #fff;
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
                display: flex;
                flex-direction: column;
                position: relative;
                transition: transform 0.3s ease;
            }

            .seamless-card-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 20px;
            }

            .seamless-card-title {
                font-size: 24px;
                font-weight: 700;
                line-height: 1.2;
                max-width: 60%;
            }

            .seamless-card-price-bubble {
                padding: 8px 16px;
                border-radius: 16px;
                font-weight: 600;
                font-size: 24px;
            }

            .seamless-card-meta-wrapper {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 20px;
            }

            .seamless-card-meta {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 16px;
                margin-bottom: 20px;
            }

            .seamless-card-meta-badges {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                align-items: flex-start;
            }

            .seamless-meta-badge {
                display: inline-flex;
                align-items: center;
                background: #f5f5f5;
                color: #666;
                padding: 5px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
                margin-bottom: 0;
                line-height: 1.5;
            }

            .seamless-meta-badge i {
                margin-right: 5px;
            }

            .seamless-renewal-text {
                font-size: 11px;
                color: #999;
                text-align: right;
                margin-top: 5px;
                margin-left: auto;
                max-width: 110px;
            }

            .seamless-card-description {
                font-size: 14px;
                color: #666;
                margin-bottom: 25px;
                line-height: 1.5;
                min-height: 40px;
            }

            .seamless-features-list {
                list-style: none;
                padding: 0;
                margin: 0 0 30px 0;
                flex-grow: 1;
            }

            .seamless-feature-item {
                display: flex;
                align-items: flex-start;
                font-size: 14px;
                color: #555;
            }

            .seamless-feature-icon {
                color: #333;
                margin-right: 10px;
                font-size: 14px;
            }

            .seamless-card-button {
                border: none;
                width: 100%;
                padding: 15px;
                border-radius: 10px;
                font-weight: 600;
                font-size: 16px;
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
                text-decoration: none !important;
                transition: background 0.3s ease;
            }

            .seamless-card-button:hover,
            .seamless-card-button:focus,
            .seamless-card-button:active,
            .seamless-card-button:visited {
                text-decoration: none !important;
                outline: none;
            }

            .seamless-card-button i {
                margin-left: 8px;
                font-size: 12px;
            }

            .seamless-best-value {
                position: absolute;
                top: -12px;
                left: 50%;
                transform: translateX(-50%);
                background: #3d265f;
                color: #fff;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .seamless-loader,
            .seamless-no-memberships,
            .seamless-error {
                text-align: center;
                padding: 40px;
                color: #666;
                width: 100%;
                grid-column: 1 / -1;
            }

            .seamless-loader {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
            }

            @media (max-width: 768px) {
                .seamless-membership-grid {
                    grid-template-columns: 1fr;
                }

                .seamless-card-meta {
                    flex-direction: column;
                    align-items: flex-start;
                }

                .seamless-renewal-text {
                    margin-left: 0;
                    max-width: none;
                    text-align: left;
                }
            }
        </style>
<?php

        $settings = $this->get_settings_for_display();

        // Output wrapper for JS to target
        $columns = isset($settings['columns']) ? $settings['columns'] : '3';
        echo '<div class="seamless-memberships-list-wrapper" data-columns="' . esc_attr($columns) . '">';
        echo '</div>'; // Content will be injected by JS
    }
}
