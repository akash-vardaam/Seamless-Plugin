<?php

namespace SeamlessReact\Elementor\Widgets;

if ( ! class_exists( 'Elementor\\Widget_Base' ) ) { return; }

use SeamlessReact\Elementor\Widgets\Base\BaseWidget;
use Elementor\Controls_Manager;

/**
 * Events List Widget
 * 
 * Elementor widget for displaying events with various layouts.
 */
class EventsListWidget extends BaseWidget
{
    /**
     * Get widget name.
     *
     * @return string Widget name.
     */
    public function get_name()
    {
        return 'seamless-events-list';
    }

    /**
     * Get widget title.
     *
     * @return string Widget title.
     */
    public function get_title()
    {
        return __('Events List', 'seamless-react');
    }

    /**
     * Get widget icon.
     *
     * @return string Widget icon.
     */
    public function get_icon()
    {
        return 'eicon-post-list';
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
            'widget_description',
            [
                'type' => Controls_Manager::RAW_HTML,
                'raw' => __('<p>This widget displays events in list, grid, and calendar views.</p>', 'seamless-react'),
                'content_classes' => 'elementor-panel-alert elementor-panel-alert-info',
            ]
        );

        $this->add_control(
            'default_view',
            [
                'label' => __('Default View', 'seamless-react'),
                'type' => Controls_Manager::SELECT,
                'default' => 'all',
                'options' => [
                    'all' => __('All', 'seamless-react'),
                    'grid' => __('Grid', 'seamless-react'),
                    'list' => __('List', 'seamless-react'),
                    'calendar' => __('Calendar', 'seamless-react'),
                ],
                'description' => __('Select the default view to display. Users can change this using the view selector.', 'seamless-react'),
            ]
        );

        $this->add_control(
            'events_per_page',
            [
                'label' => __('Events Per Page', 'seamless-react'),
                'type' => Controls_Manager::NUMBER,
                'default' => 6,
                'min' => 1,
                'max' => 100,
                'step' => 1,
                'description' => __('Number of events to display per page in list and grid views. Calendar view will show all events.', 'seamless-react'),
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
                'description' => __('Show or hide the search bar for filtering events.', 'seamless-react'),
            ]
        );

        $this->add_control(
            'filter_by_type',
            [
                'label' => __('Filter By Type', 'seamless-react'),
                'type' => Controls_Manager::SELECT,
                'default' => 'none',
                'options' => [
                    'none' => __('None', 'seamless-react'),
                    'all' => __('All', 'seamless-react'),
                    'category' => __('Category', 'seamless-react'),
                    'tag' => __('Tag', 'seamless-react'),
                ],
                'condition' => [
                    'show_search_bar' => 'yes',
                ],
                'description' => __('Select the filter type to display. Set to "None" to hide the filter dropdown.', 'seamless-react'),
            ]
        );

        $this->add_control(
            'exclude_category_slugs',
            [
                'label' => __('Exclude Category Slugs', 'seamless-react'),
                'type' => Controls_Manager::TEXT,
                'placeholder' => __('e.g. training, webcasts', 'seamless-react'),
                'condition' => [
                    'show_search_bar' => 'yes',
                    'filter_by_type' => ['category', 'all'],
                ],
                'description' => __('Comma-separated list of category slugs to exclude from the filter dropdown.', 'seamless-react'),
            ]
        );

        $this->add_control(
            'exclude_tag_slugs',
            [
                'label' => __('Exclude Tag Slugs', 'seamless-react'),
                'type' => Controls_Manager::TEXT,
                'placeholder' => __('e.g. internal, featured', 'seamless-react'),
                'condition' => [
                    'show_search_bar' => 'yes',
                    'filter_by_type' => ['tag', 'all'],
                ],
                'description' => __('Comma-separated list of tag slugs to exclude from the filter dropdown.', 'seamless-react'),
            ]
        );

        $this->end_controls_section();

        // Pagination Section
        $this->start_controls_section(
            'pagination_section',
            [
                'label' => __('Pagination', 'seamless-react'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'pagination_type',
            [
                'label' => __('Pagination Type', 'seamless-react'),
                'type' => Controls_Manager::SELECT,
                'default' => 'numbers',
                'options' => [
                    'none' => __('None', 'seamless-react'),
                    'numbers' => __('Numbers', 'seamless-react'),
                    'load_more' => __('Load More Button', 'seamless-react'),
                ],
                'description' => __('Select the pagination style for list and grid views.', 'seamless-react'),
            ]
        );

        // Load More Button Controls
        $this->add_control(
            'load_more_heading',
            [
                'label' => __('Load More Button Settings', 'seamless-react'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
                'condition' => [
                    'pagination_type' => 'load_more',
                ],
            ]
        );

        $this->add_control(
            'load_more_text',
            [
                'label' => __('Button Text', 'seamless-react'),
                'type' => Controls_Manager::TEXT,
                'default' => __('Load More', 'seamless-react'),
                'condition' => [
                    'pagination_type' => 'load_more',
                ],
            ]
        );

        $this->add_control(
            'load_more_loading_text',
            [
                'label' => __('Loading Text', 'seamless-react'),
                'type' => Controls_Manager::TEXT,
                'default' => __('Loading...', 'seamless-react'),
                'condition' => [
                    'pagination_type' => 'load_more',
                ],
            ]
        );

        $this->add_control(
            'load_more_alignment',
            [
                'label' => __('Button Alignment', 'seamless-react'),
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
                'default' => 'center',
                'condition' => [
                    'pagination_type' => 'load_more',
                ],
            ]
        );

        $this->add_control(
            'show_spinner',
            [
                'label' => __('Show Loading Spinner', 'seamless-react'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-react'),
                'label_off' => __('No', 'seamless-react'),
                'default' => 'yes',
                'condition' => [
                    'pagination_type' => 'load_more',
                ],
            ]
        );

        $this->add_control(
            'spinner_icon',
            [
                'label' => __('Spinner Icon', 'seamless-react'),
                'type' => Controls_Manager::ICONS,
                'default' => [
                    'value' => 'fas fa-spinner',
                    'library' => 'fa-solid',
                ],
                'recommended' => [
                    'fa-solid' => [
                        'spinner',
                        'circle-notch',
                        'sync',
                        'cog',
                        'sync-alt',
                    ],
                ],
                'condition' => [
                    'pagination_type' => 'load_more',
                    'show_spinner' => 'yes',
                ],
            ]
        );

        $this->add_responsive_control(
            'spinner_spacing',
            [
                'label' => __('Spinner Spacing', 'seamless-react'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                    ],
                    'em' => [
                        'min' => 0,
                        'max' => 5,
                    ],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => 8,
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-load-more-btn .seamless-spinner' => 'margin-right: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'pagination_type' => 'load_more',
                    'show_spinner' => 'yes',
                ],
            ]
        );

        $this->add_responsive_control(
            'spinner_size',
            [
                'label' => __('Spinner Size', 'seamless-react'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => [
                        'min' => 10,
                        'max' => 50,
                    ],
                    'em' => [
                        'min' => 0.5,
                        'max' => 3,
                    ],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => 16,
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-load-more-btn .seamless-spinner' => 'font-size: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .seamless-load-more-btn .seamless-spinner svg' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'pagination_type' => 'load_more',
                    'show_spinner' => 'yes',
                ],
            ]
        );

        $this->end_controls_section();

        // Pagination Style Section
        $this->start_controls_section(
            'pagination_style_section',
            [
                'label' => __('Pagination Style', 'seamless-react'),
                'tab' => Controls_Manager::TAB_STYLE,
                'condition' => [
                    'pagination_type!' => 'none',
                ],
            ]
        );

        $this->add_control(
            'pagination_spacing',
            [
                'label' => __('Top Spacing', 'seamless-react'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => 30,
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-pagination-wrapper' => 'margin-top: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        // Button Colors - Normal
        $this->start_controls_tabs('pagination_button_tabs');

        $this->start_controls_tab(
            'pagination_button_normal',
            [
                'label' => __('Normal', 'seamless-react'),
            ]
        );

        $this->add_control(
            'button_text_color',
            [
                'label' => __('Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-page-link' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-load-more-btn' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_background_color',
            [
                'label' => __('Background Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-page-link' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-load-more-btn' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->start_controls_tab(
            'pagination_button_hover',
            [
                'label' => __('Hover', 'seamless-react'),
            ]
        );

        $this->add_control(
            'button_text_color_hover',
            [
                'label' => __('Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-page-link:hover' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-load-more-btn:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_background_color_hover',
            [
                'label' => __('Background Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-page-link:hover' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-load-more-btn:hover' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->start_controls_tab(
            'pagination_button_active',
            [
                'label' => __('Active', 'seamless-react'),
            ]
        );

        $this->add_control(
            'button_text_color_active',
            [
                'label' => __('Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-page-link.active' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-page-link.seamless-active' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_background_color_active',
            [
                'label' => __('Background Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-page-link.active' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-page-link.seamless-active' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->end_controls_tabs();

        $this->add_control(
            'button_border_radius',
            [
                'label' => __('Border Radius', 'seamless-react'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'separator' => 'before',
                'selectors' => [
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-page-link' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-load-more-btn' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'button_padding',
            [
                'label' => __('Padding', 'seamless-react'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em'],
                'selectors' => [
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-page-link' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-load-more-btn' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Load More Button Style Section
        $this->start_controls_section(
            'load_more_style_section',
            [
                'label' => __('Load More Button Style', 'seamless-react'),
                'tab' => Controls_Manager::TAB_STYLE,
                'condition' => [
                    'pagination_type' => 'load_more',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'load_more_typography',
                'selector' => '{{WRAPPER}} .seamless-pagination-wrapper .seamless-load-more-btn',
            ]
        );

        $this->start_controls_tabs('load_more_tabs');

        $this->start_controls_tab(
            'load_more_normal',
            [
                'label' => __('Normal', 'seamless-react'),
            ]
        );

        $this->add_control(
            'load_more_text_color',
            [
                'label' => __('Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-load-more-btn' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'load_more_bg_color',
            [
                'label' => __('Background Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-load-more-btn' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->start_controls_tab(
            'load_more_hover',
            [
                'label' => __('Hover', 'seamless-react'),
            ]
        );

        $this->add_control(
            'load_more_text_color_hover',
            [
                'label' => __('Text Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-load-more-btn:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'load_more_bg_color_hover',
            [
                'label' => __('Background Color', 'seamless-react'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-load-more-btn:hover' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->end_controls_tabs();

        $this->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name' => 'load_more_border',
                'selector' => '{{WRAPPER}} .seamless-pagination-wrapper .seamless-load-more-btn',
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'load_more_border_radius',
            [
                'label' => __('Border Radius', 'seamless-react'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-load-more-btn' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'load_more_box_shadow',
                'selector' => '{{WRAPPER}} .seamless-pagination-wrapper .seamless-load-more-btn',
            ]
        );

        $this->add_control(
            'load_more_padding',
            [
                'label' => __('Padding', 'seamless-react'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em'],
                'selectors' => [
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-load-more-btn' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();
    }

    /**
     * Render preview for Elementor editor.
     *
     * @param array $settings Widget settings.
     */
    


    /**
     * Get preview events list.
     *
     * @param int $count Number of events to generate.
     * @return array
     */
    private function get_preview_events($count = 3)
    {
        $base_event = $this->get_preview_event_data();
        $events = [];

        for ($i = 0; $i < $count; $i++) {
            $event = $base_event;
            $event['title'] .= ' ' . ($i + 1);
            $event['start_date'] = date('Y-m-d H:i:s', strtotime("+$i days"));
            $event['end_date'] = date('Y-m-d H:i:s', strtotime("+$i days +2 hours"));
            $event['formatted_start_date'] = $event['start_date'];
            $event['formatted_end_date'] = $event['end_date'];
            $events[] = $event;
        }

        return $events;
    }

    /**
     * Render a single grid item for preview.
     *
     * @param array $event Event data.
     */
    private function render_preview_grid_item($event)
    {
        $image = $event['featured_image'] ?? $event['image_url'] ?? '';
        $title = $event['title'] ?? '';
        [$date, $time, $timezone_abbr] = $this->get_preview_date_time_display($event);
        $time_display = $time ? $time . ($timezone_abbr ? ' ' . $timezone_abbr : '') : '-';

        ?>
        <div class="event-card">
            <a href="#" class="event-link">
                <div class="image-container">
                    <div class="loader"></div>
                    <img src="<?php echo esc_url($image); ?>" alt="<?php echo esc_attr($title); ?>" class="event-image" style="display:none;" onload="imageLoaded(this)">
                </div>
            </a>
            <div class="event-details">
                <h3 class="event-title"><a href="#" class="event-title-link"><?php echo esc_html($title); ?></a></h3>
                <div class="event-time-details">
                    <div class="event-time-loc">
                        <p class="event-date"><?php echo $date ? esc_html($date) : '-'; ?></p>
                    </div>
                    <div class="event-time-loc">
                        <p class="event-time-range"><?php echo $time_display ? esc_html($time_display) : '-'; ?></p>
                    </div>
                </div>
                <a href="#" class="event-link"><?php echo esc_html__('SEE DETAILS', 'seamless-react'); ?></a>
            </div>
        </div>
    <?php
    }

    /**
     * Render a single list item for preview (layout option 1).
     *
     * @param array $event Event data.
     */
    private function render_preview_list_item_option_1($event)
    {
        $image = $event['featured_image'] ?? $event['image_url'] ?? '';
        $title = $event['title'] ?? '';
        $excerpt = $event['excerpt_description'] ?? $event['except_description'] ?? 'Event description preview...';
        [$date, $time, $timezone_abbr] = $this->get_preview_date_time_display($event);
        $time_display = $time ? $time . ($timezone_abbr ? ' ' . $timezone_abbr : '') : '-';
        $location = $this->get_preview_location_display($event);

    ?>
        <div class="event-item">
            <div class="image-container">
                <div class="loader"></div>
                <img src="<?php echo esc_url($image); ?>" alt="<?php echo esc_attr($title); ?>" class="event-image" style="display:none;" onload="imageLoaded(this)" />
            </div>
            <div class="event-details">
                <h3 class="event-title"><a href="#" class="event-title-link"><?php echo esc_html($title); ?></a></h3>
                <div class="event-time">
                    <div class="event-time-loc">
                        <p class="event-date"><?php echo $date ? esc_html($date) : '-'; ?></p>
                    </div>
                    <div class="event-time-loc">
                        <p class="event-time-range"><?php echo $time_display ? esc_html($time_display) : '-'; ?></p>
                    </div>
                    <div class="event-time-loc">
                        <p class="event-location"><?php echo esc_html($location); ?></p>
                    </div>
                </div>
                <?php if (!empty($excerpt)) : ?>
                    <div class="event-description"><?php echo esc_html($excerpt); ?></div>
                <?php endif; ?>
                <a href="#" class="event-link"><?php echo esc_html__('SEE DETAILS', 'seamless-react'); ?></a>
            </div>
        </div>
    <?php
    }

    /**
     * Render a single list item for preview (layout option 2).
     *
     * @param array $event Event data.
     * @param bool  $is_same_day Whether the event shares the same day as previous.
     */
    private function render_preview_list_item_option_2($event, $is_same_day)
    {
        $image = $event['featured_image'] ?? $event['image_url'] ?? '';
        $title = $event['title'] ?? '';
        $excerpt = $event['excerpt_description'] ?? $event['except_description'] ?? '';

        $start_date = $event['formatted_start_date'] ?? $event['start_date'] ?? '';
        $end_date = $event['formatted_end_date'] ?? $event['end_date'] ?? '';

        $date_obj = $start_date ? new \DateTime($start_date) : null;
        $month_short = $date_obj ? $date_obj->format('M') : '';
        $day_numeric = $date_obj ? $date_obj->format('j') : '';
        $year_numeric = $date_obj ? $date_obj->format('Y') : '';
        $weekday = $date_obj ? $date_obj->format('l') : '';

        [$date_display, $time_display, $timezone_abbr] = $this->get_preview_date_time_display($event);
        $time_display = $time_display ? $time_display . ($timezone_abbr ? ' ' . $timezone_abbr : '') : 'All Day';

        $multi_day = '';
        if ($start_date && $end_date) {
            $start_dt = new \DateTime($start_date);
            $end_dt = new \DateTime($end_date);
            if ($start_dt->format('Y-m-d') !== $end_dt->format('Y-m-d')) {
                $multi_day = $start_dt->format('M j') . ' – ' . $end_dt->format('M j, Y');
            }
        }

        $location = $this->get_preview_location_display($event);
        $same_day_class = $is_same_day ? ' is-same-day' : '';

        $clock_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-clock"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
        $loc_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-map-pin"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
        $calendar_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-calendar"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>';

    ?>
        <div class="event-item-modern<?php echo esc_attr($same_day_class); ?>">
            <div class="event-timeline">
                <div class="timeline-date-group">
                    <span class="timeline-date-main"><?php echo esc_html(trim($month_short . ' ' . $day_numeric . ', ' . $year_numeric)); ?></span>
                    <span class="timeline-weekday"><?php echo esc_html($weekday); ?></span>
                </div>
                <div class="timeline-dot"></div>
            </div>
            <div class="event-card-modern">
                <div class="event-card-body">
                    <div class="event-info-section">
                        <h3 class="event-title"><a href="#"><?php echo esc_html($title); ?></a></h3>
                        <div class="event-meta-data">
                            <?php if (!empty($multi_day)) : ?>
                                <div class="event-meta-multi-date"><?php echo $calendar_icon; ?> <span><?php echo esc_html($multi_day); ?></span></div>
                            <?php endif; ?>
                            <div class="event-meta-time"><?php echo $clock_icon; ?> <span><?php echo esc_html($time_display); ?></span></div>
                            <div class="event-location-row"><?php echo $loc_icon; ?> <span><?php echo esc_html($location); ?></span></div>
                        </div>
                        <?php if (!empty($excerpt)) : ?>
                            <div class="event-excerpt"><?php echo esc_html($excerpt); ?></div>
                        <?php endif; ?>
                        <div class="event-action-row">
                            <a href="#" class="view-event-btn"><?php echo esc_html__('View Event', 'seamless-react'); ?>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                </svg>
                            </a>
                        </div>
                    </div>
                    <div class="event-image-section">
                        <img src="<?php echo esc_url($image); ?>" alt="<?php echo esc_attr($title); ?>" onload="imageLoaded(this)" />
                    </div>
                </div>
            </div>
        </div>
<?php
    }

    /**
     * Build preview date/time display strings.
     *
     * @param array $event Event data.
     * @return array [dateDisplay, timeDisplay, timezoneAbbr]
     */
    private function get_preview_date_time_display($event)
    {
        $start_date = $event['formatted_start_date'] ?? $event['start_date'] ?? '';
        $end_date = $event['formatted_end_date'] ?? $event['end_date'] ?? '';

        $date_display = '';
        $time_display = '';
        $timezone_abbr = '';

        if (!$start_date) {
            return [$date_display, $time_display, $timezone_abbr];
        }

        $timezone_obj = function_exists('wp_timezone') ? wp_timezone() : new \DateTimeZone(wp_timezone_string());

        try {
            $start_dt = new \DateTime($start_date, $timezone_obj);
        } catch (\Exception $e) {
            $start_dt = new \DateTime($start_date);
            $start_dt->setTimezone($timezone_obj);
        }

        $end_dt = null;
        if (!empty($end_date)) {
            try {
                $end_dt = new \DateTime($end_date, $timezone_obj);
            } catch (\Exception $e) {
                $end_dt = new \DateTime($end_date);
                $end_dt->setTimezone($timezone_obj);
            }
        }

        $timezone_abbr = $start_dt->format('T');

        if ($end_dt) {
            $same_day = $start_dt->format('Y-m-d') === $end_dt->format('Y-m-d');
            $same_month_year = $start_dt->format('Y-m') === $end_dt->format('Y-m');
            $same_year = $start_dt->format('Y') === $end_dt->format('Y');

            if ($same_day) {
                $date_display = $start_dt->format('l, F j, Y');
            } elseif ($same_month_year) {
                $date_display = sprintf(
                    '%s - %s, %s %d - %d, %s',
                    $start_dt->format('l'),
                    $end_dt->format('l'),
                    $start_dt->format('F'),
                    (int) $start_dt->format('j'),
                    (int) $end_dt->format('j'),
                    $start_dt->format('Y')
                );
            } else {
                if ($same_year) {
                    $date_display = sprintf(
                        '%s - %s, %s %d - %s %d, %s',
                        $start_dt->format('l'),
                        $end_dt->format('l'),
                        $start_dt->format('F'),
                        (int) $start_dt->format('j'),
                        $end_dt->format('F'),
                        (int) $end_dt->format('j'),
                        $start_dt->format('Y')
                    );
                } else {
                    $date_display = sprintf(
                        '%s, %s %d, %s - %s, %s %d, %s',
                        $start_dt->format('l'),
                        $start_dt->format('F'),
                        (int) $start_dt->format('j'),
                        $start_dt->format('Y'),
                        $end_dt->format('l'),
                        $end_dt->format('F'),
                        (int) $end_dt->format('j'),
                        $end_dt->format('Y')
                    );
                }
            }

            $time_display = sprintf('%s – %s', $start_dt->format('g:i A'), $end_dt->format('g:i A'));
        } else {
            $date_display = $start_dt->format('l, F j, Y');
            $time_display = $start_dt->format('g:i A');
        }

        return [$date_display, $time_display, $timezone_abbr];
    }

    /**
     * Build preview location display string.
     *
     * @param array $event Event data.
     * @return string
     */
    private function get_preview_location_display($event)
    {
        $location_parts = [];
        $venue = $event['venue'] ?? [];

        if (!empty($venue['city'])) {
            $location_parts[] = $venue['city'];
        }
        if (!empty($venue['state'])) {
            $location_parts[] = $venue['state'];
        }
        if (!empty($venue['country']) && $venue['country'] !== 'US') {
            $location_parts[] = $venue['country'];
        }

        if (!empty($location_parts)) {
            return implode(', ', $location_parts);
        }

        if (!empty($event['virtual_meeting_link'])) {
            return __('Online', 'seamless-react');
        }

        if (!empty($venue['address'])) {
            return $venue['address'];
        }

        return __('TBD', 'seamless-react');
    }

    /**
     * Get date key for grouping (YYYY-MM-DD).
     *
     * @param array $event Event data.
     * @return string
     */
    private function get_preview_date_key($event)
    {
        $start_date = $event['formatted_start_date'] ?? $event['start_date'] ?? '';
        if (empty($start_date)) {
            return '';
        }

        try {
            $date_obj = new \DateTime($start_date);
        } catch (\Exception $e) {
            return '';
        }

        return $date_obj->format('Y-m-d');
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



