<?php

namespace SeamlessReact\Elementor\Widgets;

if ( ! class_exists( 'Elementor\\Widget_Base' ) ) { return; }

use SeamlessReact\Elementor\Widgets\Base\BaseWidget;
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
        return __('Courses List', 'seamless-react');
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
                'label' => __('Content', 'seamless-react'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'widget_info',
            [
                'type' => Controls_Manager::RAW_HTML,
                'raw' => __('<div style="padding: 10px; background: #0a1a3d; border-left: 3px solid #2563eb; color: #fff; font-style: italic; font-size: 12px; font-weight: 300;">This widget displays all available courses in a grid layout.</div>', 'seamless-react'),
            ]
        );

        $this->add_control(
            'show_search_bar',
            [
                'label' => __('Show Search Bar', 'seamless-react'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-react'),
                'label_off' => __('No', 'seamless-react'),
                'default' => 'yes',
                'description' => __('Show or hide the course search and filter bar.', 'seamless-react'),
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
                    '{{WRAPPER}} .seamless-courses-grid' => 'grid-template-columns: repeat({{VALUE}}, 1fr);',
                ],
            ]
        );

        // Course Title
        $this->add_control(
            'Course_title_heading',
            [
                'label' => __('Course Title', 'seamless-react'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'title_typography',
                'label' => __('Title Typography', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-course-title',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'description_typography',
                'label' => __('Description Typography', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-course-excerpt',
            ]
        );

        // Title Color
        $this->add_control(
            'title_color',
            [
                'label' => __('Title Color', 'seamless-react'),
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
                'label' => __('Description Color', 'seamless-react'),
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
                'label' => __('Course Meta', 'seamless-react'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'meta_typography',
                'label' => __('Meta Typography', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-course-meta',
            ]
        );

        $this->add_control(
            'meta_icon_color',
            [
                'label' => __('Meta Icon Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-course-meta svg' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'meta_text_color',
            [
                'label' => __('Meta Text Color', 'seamless-react'),
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
                'label' => __('Course Price', 'seamless-react'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'price_typography',
                'label' => __('Price Typography', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-course-price',
            ]
        );

        $this->add_control(
            'price_color',
            [
                'label' => __('Price Color', 'seamless-react'),
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
                'label' => __('Course Badge', 'seamless-react'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'badge_bg_color',
            [
                'label' => __('Badge Background', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-course-badge' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'badge_text_color',
            [
                'label' => __('Badge Text Color', 'seamless-react'),
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
                'label' => __('Course Button', 'seamless-react'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'button_typography',
                'label' => __('Button Typography', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-course-button',
            ]
        );

        $this->add_control(
            'button_bg_color',
            [
                'label' => __('Button Background', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-course-button' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_text_color',
            [
                'label' => __('Button Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-course-button' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_hover_bg',
            [
                'label' => __('Button Hover Background', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-course-button:hover' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_hover_text_color',
            [
                'label' => __('Button Hover Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-course-button:hover' => 'color: {{VALUE}};',
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
                'label' => __('Button Border', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-course-button',
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
                'label' => __('Card', 'seamless-react'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
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
                'label' => __('Card Shadow', 'seamless-react'),
                'selector' => '{{WRAPPER}} .seamless-course-card',
            ]
        );

        $this->end_controls_section();
    }

    /**
     * Determine whether the search bar is enabled.
     *
     * @param array $settings Widget settings.
     * @return bool
     */
    private function is_search_bar_enabled($settings)
    {
        return ($settings['show_search_bar'] ?? 'yes') === 'yes';
    }

    /**
     * Render shared widget styles for frontend and Elementor preview.
     *
     * @param string $columns Grid column count.
     */
    private function render_widget_styles($columns)
    {
?>
        <style>
            .seamless-courses-list-shell .seamless-nd-searchbar-section {
                width: 100%;
                padding: 20px 0;
                position: relative;
            }

            .seamless-courses-list-shell .seamless-nd-searchbar-wrap {
                display: flex;
                flex-direction: column;
                width: 100%;
                gap: 0;
                border: 1px solid #dcdcdc;
                padding: 16px;
                border-radius: 16px;
                box-sizing: border-box;
                margin-bottom: 24px;
            }

            .seamless-courses-list-shell .seamless-nd-row {
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
                flex-wrap: nowrap;
            }

            .seamless-courses-list-shell .seamless-nd-search-field {
                position: relative;
                flex: 1 1 0;
                min-width: 0;
            }

            .seamless-courses-list-shell .seamless-nd-search-icon {
                position: absolute;
                left: 13px;
                top: 50%;
                transform: translateY(-50%);
                color: #9ca3af;
                pointer-events: none;
            }

            .seamless-courses-list-shell .seamless-nd-search-input {
                width: 100%;
                box-sizing: border-box;
                height: 40px;
                padding: 0 14px 0 38px;
                border: 1px solid #e0e2e8;
                border-radius: 16px;
                font-size: 14px;
                font-family: inherit;
                color: #1f2937;
                background: #f3f4f6;
                outline: none;
                line-height: 1;
                transition: border-color 0.18s ease, box-shadow 0.18s ease;
            }

            .seamless-courses-list-shell .seamless-nd-search-input::placeholder {
                color: #9ca3af;
            }

            .seamless-courses-list-shell .seamless-nd-search-input:focus {
                border-color: #f3f4f6;
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
            }

            .seamless-courses-list-shell .seamless-nd-controls {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-shrink: 0;
            }

            .seamless-courses-list-shell .seamless-nd-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
                height: 40px;
                padding: 0 13px;
                border: 1px solid #e0e2e8;
                border-radius: 16px;
                background: #fff;
                color: #374151;
                font-family: inherit;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                white-space: nowrap;
                line-height: 1;
                transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
            }

            .seamless-courses-list-shell .seamless-nd-btn:hover {
                border-color: #c7cad2;
                background: #f9fafb;
                color: #374151;
            }

            .seamless-courses-list-shell .seamless-nd-btn:focus,
            .seamless-courses-list-shell .seamless-nd-btn:focus-visible {
                outline: none;
                border-color: #c7cad2;
                background: #fff;
                color: #374151;
                box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.08);
            }

            .seamless-courses-list-shell .seamless-nd-dropdown-wrap {
                position: relative;
            }

            .seamless-courses-list-shell .seamless-nd-course-type-btn,
            .seamless-courses-list-shell .seamless-nd-year-btn,
            .seamless-courses-list-shell .seamless-nd-sort-btn {
                justify-content: space-between;
            }

            .seamless-courses-list-shell .seamless-nd-chevron {
                color: #6b7280;
                transition: transform 0.2s ease;
                flex-shrink: 0;
            }

            .seamless-courses-list-shell .seamless-nd-btn[aria-expanded="true"] .seamless-nd-chevron {
                transform: rotate(180deg);
            }

            .seamless-courses-list-shell .seamless-nd-menu {
                display: none;
                position: absolute;
                top: calc(100% + 6px);
                left: 0;
                min-width: 170px;
                width: max-content;
                max-width: min(260px, calc(100vw - 32px));
                background: #fff;
                border: 1px solid #e5e7eb;
                border-radius: 10px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.06);
                z-index: 200;
                list-style: none;
                margin: 0;
                padding: 6px;
                overflow: hidden;
                animation: seamlessCoursesFadeIn 0.14s ease;
                box-sizing: border-box;
            }

            .seamless-courses-list-shell .seamless-nd-menu.seamless-nd-menu-open {
                display: block;
            }

            .seamless-courses-list-shell .seamless-nd-menu li {
                display: flex;
                align-items: center;
                gap: 5px;
                padding: 10px;
                font-size: 13px;
                font-family: inherit;
                color: #374151;
                border-radius: 7px;
                cursor: pointer;
                transition: background 0.12s ease, color 0.12s ease;
                line-height: 1;
                list-style: none;
            }

            .seamless-courses-list-shell .seamless-nd-menu li:hover {
                background: #f3f4f6;
            }

            .seamless-courses-list-shell .seamless-nd-menu li.seamless-nd-menu-selected {
                color: var(--seamless-primary-color, #1d4ed8);
                font-weight: 600;
            }

            .seamless-courses-list-shell .seamless-nd-menu li svg {
                flex-shrink: 0;
                color: var(--seamless-primary-color, #1d4ed8);
            }

            .seamless-courses-list-shell .seamless-nd-active-filter {
                background: color-mix(in srgb, var(--seamless-primary-color, #1d4ed8), transparent 97%);
                border-color: color-mix(in srgb, var(--seamless-primary-color, #1d4ed8), transparent 80%);
                color: var(--seamless-primary-color, #1d4ed8);
            }

            .seamless-courses-list-shell .seamless-nd-active-filter .seamless-nd-chevron {
                color: var(--seamless-primary-color, #1d4ed8);
            }

            .seamless-courses-list-shell .seamless-nd-active-filter:hover {
                background: color-mix(in srgb, var(--seamless-primary-color, #1d4ed8), transparent 90%);
            }

            .seamless-courses-list-shell .seamless-nd-reset-btn {
                background: transparent;
                color: #6b7280;
                border: 1px solid #e0e2e8;
            }

            .seamless-courses-list-shell .seamless-nd-reset-badge {
                display: none;
                align-items: center;
                justify-content: center;
                min-width: 18px;
                height: 18px;
                padding: 0 4px;
                background: var(--seamless-primary-color, #1d4ed8);
                color: #fff;
                border-radius: 999px;
                font-size: 11px;
                font-weight: 700;
                line-height: 1;
            }

            .seamless-courses-list-shell .seamless-course-results-summary {
                margin: 0 0 18px;
                color: #6b7280;
                font-size: 14px;
            }

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
                min-width: 0;
            }

            .seamless-course-image-wrapper {
                position: relative;
                width: 100%;
                height: 270px;
                background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%);
                overflow: hidden;
                flex-shrink: 0;
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
                z-index: 2;
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
                max-width: 100%;
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
                flex-shrink: 0;
            }

            .seamless-course-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: auto;
                padding-top: 16px;
                border-top: 1px solid #f0f0f0;
                gap: 16px;
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

            @keyframes seamlessCoursesFadeIn {
                from {
                    opacity: 0;
                    transform: translateY(-4px);
                }

                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @media (max-width: 639px) {
                .seamless-courses-list-shell .seamless-nd-searchbar-wrap {
                    padding: 16px 12px;
                }

                .seamless-courses-list-shell .seamless-nd-row {
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .seamless-courses-list-shell .seamless-nd-search-field,
                .seamless-courses-list-shell .seamless-nd-controls {
                    flex: 1 1 100%;
                    width: 100%;
                }

                .seamless-courses-list-shell .seamless-nd-controls {
                    flex-wrap: wrap;
                }

                .seamless-courses-list-shell .seamless-nd-menu {
                    right: 0;
                    left: auto;
                    min-width: 100%;
                }

                .seamless-course-footer {
                    /* flex-direction: column; */
                    align-items: flex-start;
                }
            }

            @media (max-width: 768px) {
                .seamless-courses-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
        <?php
    }

    /**
     * Render Elementor editor preview.
     *
     * @param array $settings Widget settings.
     */
    

    /**
     * Get preview courses for the Elementor editor.
     *
     * @return array
     */
    private function get_preview_courses()
    {
        return [
            [
                'title' => __('Leadership Essentials', 'seamless-react'),
                'description' => __('A practical course preview for building leadership, communication, and strategic planning skills.', 'seamless-react'),
                'access_label' => __('Free', 'seamless-react'),
                'access_value' => 'free',
                'price' => __('Free', 'seamless-react'),
                'published_at' => '2026-02-12',
                'duration' => __('2 Hours', 'seamless-react'),
                'lessons' => 8,
            ],
            [
                'title' => __('Advanced Compliance Workshop', 'seamless-react'),
                'description' => __('Preview how paid courses appear with metadata, pricing, and the updated toolbar controls.', 'seamless-react'),
                'access_label' => __('Paid', 'seamless-react'),
                'access_value' => 'paid',
                'price' => '$149.00',
                'published_at' => '2025-08-03',
                'duration' => __('3 Hours', 'seamless-react'),
                'lessons' => 12,
            ],
            [
                'title' => __('Member Onboarding Foundations', 'seamless-react'),
                'description' => __('A sample course card used inside the Elementor editor preview so the layout is visible before publishing.', 'seamless-react'),
                'access_label' => __('Free', 'seamless-react'),
                'access_value' => 'free',
                'price' => __('Free', 'seamless-react'),
                'published_at' => '2024-11-18',
                'duration' => __('Self-paced', 'seamless-react'),
                'lessons' => 6,
            ],
        ];
    }

    /**
     * Render a preview course card.
     *
     * @param array $course Course data.
     */
    private function render_preview_course_card($course)
    {
        $title = $course['title'] ?? __('Untitled Course', 'seamless-react');
        $description = $course['description'] ?? '';
        $access_label = $course['access_label'] ?? __('Free', 'seamless-react');
        $access_value = $course['access_value'] ?? 'free';
        $badge_class = $access_value === 'paid' ? 'seamless-badge-paid' : 'seamless-badge-free';
        $price = $course['price'] ?? __('Free', 'seamless-react');
        $duration = $course['duration'] ?? __('Self-paced', 'seamless-react');
        $lessons = isset($course['lessons']) ? intval($course['lessons']) : 0;
        $published_date = $this->format_preview_course_date($course['published_at'] ?? '');
        ?>
        <div class="seamless-course-card">
            <div class="seamless-course-image-wrapper">
                <div class="seamless-course-icon">
                    <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="60" height="60" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                </div>
                <div class="seamless-course-badge <?php echo esc_attr($badge_class); ?>"><?php echo esc_html($access_label); ?></div>
            </div>
            <div class="seamless-course-content">
                <h3 class="seamless-course-title">
                    <a href="#"><?php echo esc_html($title); ?></a>
                </h3>
                <?php if (!empty($description)) : ?>
                    <p class="seamless-course-excerpt"><?php echo esc_html($description); ?></p>
                <?php endif; ?>
                <div class="seamless-course-meta-row">
                    <?php if (!empty($published_date)) : ?>
                        <div class="seamless-course-meta">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-calendar" aria-hidden="true">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <span><?php echo esc_html($published_date); ?></span>
                        </div>
                    <?php endif; ?>
                    <div class="seamless-course-meta">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-clock" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span><?php echo esc_html($duration); ?></span>
                    </div>
                    <?php if ($lessons > 0) : ?>
                        <div class="seamless-course-meta">
                            <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                            </svg>
                            <span><?php echo esc_html(sprintf(_n('%d Lesson', '%d Lessons', $lessons, 'seamless-react'), $lessons)); ?></span>
                        </div>
                    <?php endif; ?>
                </div>
                <div class="seamless-course-footer">
                    <div class="seamless-course-price"><?php echo esc_html($price); ?></div>
                    <a href="#" class="seamless-course-button"><?php esc_html_e('View Details', 'seamless-react'); ?></a>
                </div>
            </div>
        </div>
<?php
    }

    /**
     * Format preview course date.
     *
     * @param string $date_string Course date.
     * @return string
     */
    private function format_preview_course_date($date_string)
    {
        if (empty($date_string)) {
            return '';
        }

        $timestamp = strtotime($date_string);

        if (!$timestamp) {
            return $date_string;
        }

        return date_i18n('F j, Y', $timestamp);
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



