<?php

namespace SeamlessAddon\Integrations\Elementor\Widgets;

use SeamlessAddon\Integrations\Elementor\Widgets\Base\BaseWidget;
use Elementor\Controls_Manager;
use function esc_html;
use function esc_attr;

/**
 * Courses List Widget
 * 
 * Elementor widget for displaying courses in a modern card layout.
 */
class CoursesListWidget extends BaseWidget
{
    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name()
    {
        return 'seamless-courses-list';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title()
    {
        return __('Courses List', 'seamless-addon');
    }

    /**
     * Get widget icon.
     *
     * @return string Widget icon.
     */
    public function get_icon()
    {
        return 'eicon-posts-grid';
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
                'raw' => __('<div style="padding: 10px; background: #0a1a3d; border-left: 3px solid #2563eb; color: #fff; font-style: italic; font-size: 12px; font-weight: 300;">This widget displays all available courses in a grid layout.</div>', 'seamless-addon'),
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
                    '{{WRAPPER}} .seamless-courses-grid' => 'grid-template-columns: repeat({{VALUE}}, 1fr);',
                ],
            ]
        );

        // Course Title
        $this->add_control(
            'Course_title_heading',
            [
                'label' => __('Course Title', 'seamless-addon'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'title_typography',
                'label' => __('Title Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-course-title',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'description_typography',
                'label' => __('Description Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-course-excerpt',
            ]
        );

        // Title Color
        $this->add_control(
            'title_color',
            [
                'label' => __('Title Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'default' => 'var(--seamless-primary-color)',
                'selectors' => [
                    '{{WRAPPER}} .seamless-course-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        // Description Color
        $this->add_control(
            'description_color',
            [
                'label' => __('Description Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-course-excerpt' => 'color: {{VALUE}};',
                ],
            ]
        );

        // Course Meta Styling
        $this->add_control(
            'Course_meta_heading',
            [
                'label' => __('Course Meta', 'seamless-addon'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'meta_typography',
                'label' => __('Meta Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-course-meta',
            ]
        );

        $this->add_control(
            'meta_icon_color',
            [
                'label' => __('Meta Icon Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-course-meta svg' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'meta_text_color',
            [
                'label' => __('Meta Text Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-course-meta' => 'color: {{VALUE}};',
                ],
            ]
        );

        // Course Price Styling
        $this->add_control(
            'Course_price_heading',
            [
                'label' => __('Course Price', 'seamless-addon'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'price_typography',
                'label' => __('Price Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-course-price',
            ]
        );

        $this->add_control(
            'price_color',
            [
                'label' => __('Price Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-course-price' => 'color: {{VALUE}};',
                ],
            ]
        );

        // Course Badge Styling
        $this->add_control(
            'Course_badge_heading',
            [
                'label' => __('Course Badge', 'seamless-addon'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'badge_bg_color',
            [
                'label' => __('Badge Background', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-course-badge' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'badge_text_color',
            [
                'label' => __('Badge Text Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-course-badge' => 'color: {{VALUE}};',
                ],
            ]
        );

        // Course Button Styling
        $this->add_control(
            'Course_button_heading',
            [
                'label' => __('Course Button', 'seamless-addon'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'button_typography',
                'label' => __('Button Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-course-button',
            ]
        );

        $this->add_control(
            'button_bg_color',
            [
                'label' => __('Button Background', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-course-button' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_text_color',
            [
                'label' => __('Button Text Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-course-button' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_hover_bg',
            [
                'label' => __('Button Hover Background', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-course-button:hover' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_hover_text_color',
            [
                'label' => __('Button Hover Text Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-course-button:hover' => 'color: {{VALUE}};',
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
                    'top' => 12,
                    'right' => 24,
                    'bottom' => 12,
                    'left' => 24,
                    'unit' => 'px',
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-course-button' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name' => 'button_border',
                'label' => __('Button Border', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-course-button',
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
                    'size' => 8,
                    'unit' => 'px',
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-course-button' => 'border-radius: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        // Card Styling
        $this->add_control(
            'card_heading',
            [
                'label' => __('Card', 'seamless-addon'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
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
                    'size' => 16,
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-course-card' => 'border-radius: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .seamless-course-image' => 'border-radius: {{SIZE}}{{UNIT}} {{SIZE}}{{UNIT}} 0 0;',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'card_box_shadow',
                'label' => __('Card Shadow', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-course-card',
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
            .seamless-courses-grid {
                display: grid;
                grid-template-columns: repeat(<?php echo esc_attr($columns); ?>, 1fr);
                gap: 24px;
                font-family: 'Inter', 'Roboto', sans-serif;
            }

            .seamless-course-card {
                background: #fff;
                border-radius: 16px;
                overflow: hidden;
                border: 1px solid #e5e5e5;
                box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
                display: flex;
                flex-direction: column;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                position: relative;
            }

            /* .seamless-course-card:hover {
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
            } */

            .seamless-course-image-wrapper {
                position: relative;
                width: 100%;
                height: 270px;
                background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%);
                overflow: hidden;
            }

            .seamless-course-image-wrapper img {
                width: 100%;
                height: 100%;
            }

            .seamless-course-image {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .seamless-course-badge {
                position: absolute;
                top: 12px;
                right: 12px;
                background: var(--seamless-secondary-color, #06b6d4);
                color: #fff;
                padding: 3px 12px;
                border-radius: 16px;
                font-size: 11px;
                line-height: 2;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            }

            .seamless-badge-free {
                color: #10b981 !important;
            }

            .seamless-badge-paid {
                color: #ef4444 !important;
            }

            .seamless-course-icon {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 64px;
                height: 64px;
                background: rgba(255, 255, 255, 0.25);
                backdrop-filter: blur(10px);
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .seamless-course-icon svg {
                width: 32px;
                height: 32px;
                fill: #fff;
                color: #8b5cf6;
                opacity: 0.6;
            }

            .seamless-course-content {
                padding: 20px;
                display: flex;
                flex-direction: column;
                flex-grow: 1;
            }

            .seamless-course-title {
                font-size: 20px;
                font-weight: 700;
                line-height: 1.3;
                margin: 0 0 8px 0;
                color: #1a1a1a;
            }

            .seamless-course-title a {
                color: inherit;
                text-decoration: none;
                transition: color 0.2s ease;
            }

            .seamless-course-title a:hover {
                color: var(--seamless-secondary-color, #06b6d4);
            }

            .seamless-course-excerpt {
                font-size: 14px;
                color: #666;
                line-height: 1.6;
                margin: 0 0 16px 0;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .seamless-course-meta-row {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 16px;
                flex-wrap: wrap;
            }

            .seamless-course-meta {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 14px;
                color: #666;
            }

            .seamless-course-meta svg {
                width: 16px;
                height: 16px;
            }

            .seamless-course-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: auto;
                padding-top: 16px;
                border-top: 1px solid #f0f0f0;
            }

            .seamless-course-price {
                font-size: 24px;
                font-weight: 700;
                color: #1a1a1a;
            }

            .seamless-course-button {
                background: var(--seamless-secondary-color, #06b6d4);
                color: #fff;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                text-decoration: none !important;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }

            .seamless-course-button:hover {
                background: var(--seamless-primary-color, #26337a);
            }

            .seamless-course-button i {
                font-size: 12px;
            }

            .seamless-loader,
            .seamless-no-courses,
            .seamless-error {
                text-align: center;
                padding: 60px 20px;
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

            .seamless-spinners {
                width: 40px;
                height: 40px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #6c5ce7;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% {
                    transform: rotate(0deg);
                }

                100% {
                    transform: rotate(360deg);
                }
            }

            @media (max-width: 768px) {
                .seamless-courses-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
<?php

        $settings = $this->get_settings_for_display();

        // Output wrapper for JS to target
        $columns = isset($settings['columns']) ? $settings['columns'] : '3';
        echo '<div class="seamless-courses-list-wrapper" data-columns="' . esc_attr($columns) . '">';
        echo '</div>'; // Content will be injected by JS
    }
}
