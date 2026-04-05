<?php

namespace SeamlessAddon\Integrations\Elementor\Widgets;

use SeamlessAddon\Integrations\Elementor\Widgets\Base\BaseWidget;
use SeamlessAddon\Helpers\Helper;
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
        return __('Events List', 'seamless-addon');
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
                'label' => __('Content', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'widget_description',
            [
                'type' => Controls_Manager::RAW_HTML,
                'raw' => __('<p>This widget displays events in list, grid, and calendar views.</p>', 'seamless-addon'),
                'content_classes' => 'elementor-panel-alert elementor-panel-alert-info',
            ]
        );

        $this->add_control(
            'default_view',
            [
                'label' => __('Default View', 'seamless-addon'),
                'type' => Controls_Manager::SELECT,
                'default' => 'all',
                'options' => [
                    'all' => __('All', 'seamless-addon'),
                    'grid' => __('Grid', 'seamless-addon'),
                    'list' => __('List', 'seamless-addon'),
                    'calendar' => __('Calendar', 'seamless-addon'),
                ],
                'description' => __('Select the default view to display. Users can change this using the view selector.', 'seamless-addon'),
            ]
        );

        $this->add_control(
            'events_per_page',
            [
                'label' => __('Events Per Page', 'seamless-addon'),
                'type' => Controls_Manager::NUMBER,
                'default' => 6,
                'min' => 1,
                'max' => 100,
                'step' => 1,
                'description' => __('Number of events to display per page in list and grid views. Calendar view will show all events.', 'seamless-addon'),
            ]
        );

        $this->add_control(
            'show_search_bar',
            [
                'label' => __('Show Search Bar', 'seamless-addon'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-addon'),
                'label_off' => __('No', 'seamless-addon'),
                'default' => 'yes',
                'description' => __('Show or hide the search bar for filtering events.', 'seamless-addon'),
            ]
        );

        $this->add_control(
            'filter_by_type',
            [
                'label' => __('Filter By Type', 'seamless-addon'),
                'type' => Controls_Manager::SELECT,
                'default' => 'none',
                'options' => [
                    'none' => __('None', 'seamless-addon'),
                    'all' => __('All', 'seamless-addon'),
                    'category' => __('Category', 'seamless-addon'),
                    'tag' => __('Tag', 'seamless-addon'),
                ],
                'condition' => [
                    'show_search_bar' => 'yes',
                ],
                'description' => __('Select the filter type to display. Set to "None" to hide the filter dropdown.', 'seamless-addon'),
            ]
        );

        $this->add_control(
            'exclude_category_slugs',
            [
                'label' => __('Exclude Category Slugs', 'seamless-addon'),
                'type' => Controls_Manager::TEXT,
                'placeholder' => __('e.g. training, webcasts', 'seamless-addon'),
                'condition' => [
                    'show_search_bar' => 'yes',
                    'filter_by_type' => ['category', 'all'],
                ],
                'description' => __('Comma-separated list of category slugs to exclude from the filter dropdown.', 'seamless-addon'),
            ]
        );

        $this->add_control(
            'exclude_tag_slugs',
            [
                'label' => __('Exclude Tag Slugs', 'seamless-addon'),
                'type' => Controls_Manager::TEXT,
                'placeholder' => __('e.g. internal, featured', 'seamless-addon'),
                'condition' => [
                    'show_search_bar' => 'yes',
                    'filter_by_type' => ['tag', 'all'],
                ],
                'description' => __('Comma-separated list of tag slugs to exclude from the filter dropdown.', 'seamless-addon'),
            ]
        );

        $this->end_controls_section();

        // Pagination Section
        $this->start_controls_section(
            'pagination_section',
            [
                'label' => __('Pagination', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'pagination_type',
            [
                'label' => __('Pagination Type', 'seamless-addon'),
                'type' => Controls_Manager::SELECT,
                'default' => 'numbers',
                'options' => [
                    'none' => __('None', 'seamless-addon'),
                    'numbers' => __('Numbers', 'seamless-addon'),
                    'load_more' => __('Load More Button', 'seamless-addon'),
                ],
                'description' => __('Select the pagination style for list and grid views.', 'seamless-addon'),
            ]
        );

        // Load More Button Controls
        $this->add_control(
            'load_more_heading',
            [
                'label' => __('Load More Button Settings', 'seamless-addon'),
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
                'label' => __('Button Text', 'seamless-addon'),
                'type' => Controls_Manager::TEXT,
                'default' => __('Load More', 'seamless-addon'),
                'condition' => [
                    'pagination_type' => 'load_more',
                ],
            ]
        );

        $this->add_control(
            'load_more_loading_text',
            [
                'label' => __('Loading Text', 'seamless-addon'),
                'type' => Controls_Manager::TEXT,
                'default' => __('Loading...', 'seamless-addon'),
                'condition' => [
                    'pagination_type' => 'load_more',
                ],
            ]
        );

        $this->add_control(
            'load_more_alignment',
            [
                'label' => __('Button Alignment', 'seamless-addon'),
                'type' => Controls_Manager::CHOOSE,
                'options' => [
                    'left' => [
                        'title' => __('Left', 'seamless-addon'),
                        'icon' => 'eicon-text-align-left',
                    ],
                    'center' => [
                        'title' => __('Center', 'seamless-addon'),
                        'icon' => 'eicon-text-align-center',
                    ],
                    'right' => [
                        'title' => __('Right', 'seamless-addon'),
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
                'label' => __('Show Loading Spinner', 'seamless-addon'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-addon'),
                'label_off' => __('No', 'seamless-addon'),
                'default' => 'yes',
                'condition' => [
                    'pagination_type' => 'load_more',
                ],
            ]
        );

        $this->add_control(
            'spinner_icon',
            [
                'label' => __('Spinner Icon', 'seamless-addon'),
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
                'label' => __('Spinner Spacing', 'seamless-addon'),
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
                'label' => __('Spinner Size', 'seamless-addon'),
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
                'label' => __('Pagination Style', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_STYLE,
                'condition' => [
                    'pagination_type!' => 'none',
                ],
            ]
        );

        $this->add_control(
            'pagination_spacing',
            [
                'label' => __('Top Spacing', 'seamless-addon'),
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
                'label' => __('Normal', 'seamless-addon'),
            ]
        );

        $this->add_control(
            'button_text_color',
            [
                'label' => __('Text Color', 'seamless-addon'),
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
                'label' => __('Background Color', 'seamless-addon'),
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
                'label' => __('Hover', 'seamless-addon'),
            ]
        );

        $this->add_control(
            'button_text_color_hover',
            [
                'label' => __('Text Color', 'seamless-addon'),
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
                'label' => __('Background Color', 'seamless-addon'),
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
                'label' => __('Active', 'seamless-addon'),
            ]
        );

        $this->add_control(
            'button_text_color_active',
            [
                'label' => __('Text Color', 'seamless-addon'),
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
                'label' => __('Background Color', 'seamless-addon'),
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
                'label' => __('Border Radius', 'seamless-addon'),
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
                'label' => __('Padding', 'seamless-addon'),
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
                'label' => __('Load More Button Style', 'seamless-addon'),
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
                'label' => __('Normal', 'seamless-addon'),
            ]
        );

        $this->add_control(
            'load_more_text_color',
            [
                'label' => __('Text Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-load-more-btn' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'load_more_bg_color',
            [
                'label' => __('Background Color', 'seamless-addon'),
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
                'label' => __('Hover', 'seamless-addon'),
            ]
        );

        $this->add_control(
            'load_more_text_color_hover',
            [
                'label' => __('Text Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-pagination-wrapper .seamless-load-more-btn:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'load_more_bg_color_hover',
            [
                'label' => __('Background Color', 'seamless-addon'),
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
                'label' => __('Border Radius', 'seamless-addon'),
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
                'label' => __('Padding', 'seamless-addon'),
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
    protected function render_preview($settings)
    {
        $default_view   = $settings['default_view'] ?? 'all';
        $view           = ($default_view === 'all') ? 'list' : $default_view;
        $filter_by_type = $settings['filter_by_type'] ?? 'none';
        $show_search    = ($settings['show_search_bar'] ?? 'yes') === 'yes';

        if ($view === 'calendar') {
            echo '<div class="seamless-elementor-preview seamless-calendar-preview" style="text-align:center;padding:40px;background:#f9f9f9;border:1px dashed #ccc;border-radius:4px;">';
            echo '<h3 style="margin:0;color:#666;">' . esc_html__('Calendar view will be shown here.', 'seamless-addon') . '</h3>';
            echo '</div>';
            return;
        }

        // Get preview events
        $events = $this->get_preview_events(3);
        $layout = get_option('seamless_list_view_layout', 'option_1');

        // Determine which filter groups to show based on filter_by_type
        $show_cat_group = in_array($filter_by_type, ['category', 'all']);
        $show_tag_group = in_array($filter_by_type, ['tag', 'all']);
        $show_filters   = $filter_by_type !== 'none';

        echo '<div id="eventWrapper" class="seamless-content-wrapper seamless-event-wrapper-without-dropdown seamless-event-wrapper seamless-elementor-wrapper seamless-preview-mode">';

        // ── ND Searchbar (matches tpl-event-wrapper-without-dropdown.php) ──
        if ($show_search) :
?>
            <section class="seamless-nd-searchbar-section">
                <div class="seamless-nd-searchbar-wrap">

                    <div class="seamless-nd-row">
                        <!-- Search Input -->
                        <div class="seamless-nd-search-field">
                            <svg class="seamless-nd-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input type="text" class="seamless-nd-search-input" placeholder="<?php esc_attr_e('Search events...', 'seamless-addon'); ?>" disabled aria-label="<?php esc_attr_e('Search events', 'seamless-addon'); ?>" />
                        </div>

                        <!-- Controls -->
                        <div class="seamless-nd-controls">

                            <?php if ($show_filters) : ?>
                                <!-- Filters button -->
                                <button type="button" class="seamless-nd-btn seamless-nd-filters-btn" disabled aria-expanded="false">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                        <line x1="4" y1="6" x2="20" y2="6"></line>
                                        <line x1="8" y1="12" x2="16" y2="12"></line>
                                        <line x1="11" y1="18" x2="13" y2="18"></line>
                                    </svg>
                                    <span><?php esc_html_e('Filters', 'seamless-addon'); ?></span>
                                    <svg class="seamless-nd-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                            <?php endif; ?>

                            <!-- Year -->
                            <div class="seamless-nd-dropdown-wrap">
                                <button type="button" class="seamless-nd-btn seamless-nd-year-btn" disabled aria-expanded="false">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    <span class="seamless-nd-year-label"><?php esc_html_e('All Years', 'seamless-addon'); ?></span>
                                    <svg class="seamless-nd-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                            </div>

                            <!-- Sort -->
                            <div class="seamless-nd-dropdown-wrap">
                                <button type="button" class="seamless-nd-btn seamless-nd-sort-btn" disabled aria-expanded="false">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <polyline points="5 12 12 5 19 12"></polyline>
                                    </svg>
                                    <span class="seamless-nd-sort-label"><?php esc_html_e('Upcoming', 'seamless-addon'); ?></span>
                                    <svg class="seamless-nd-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                            </div>

                            <!-- Reset -->
                            <button type="button" class="seamless-nd-btn seamless-nd-reset-btn" disabled aria-label="<?php esc_attr_e('Reset all filters', 'seamless-addon'); ?>">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <polyline points="1 4 1 10 7 10"></polyline>
                                    <path d="M3.51 15a9 9 0 1 0 -0.51-5"></path>
                                </svg>
                                <span><?php esc_html_e('Reset', 'seamless-addon'); ?></span>
                            </button>

                        </div><!-- /.seamless-nd-controls -->
                    </div><!-- /.seamless-nd-row -->

                    <?php if ($show_filters) : ?>
                        <!-- Filter panel preview (static / not interactive) -->
                        <div class="seamless-nd-filters-panel" style="display:none;" aria-hidden="true">
                            <div class="seamless-nd-filters-panel-inner">
                                <?php if ($show_cat_group) : ?>
                                    <div class="seamless-nd-filter-group" id="seamless-nd-category-group">
                                        <label class="seamless-nd-filter-group-label">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                            </svg>
                                            <?php esc_html_e('Category', 'seamless-addon'); ?>
                                        </label>
                                        <div class="seamless-nd-filter-options">
                                            <span class="seamless-nd-filter-placeholder"><?php esc_html_e('Categories load on the frontend.', 'seamless-addon'); ?></span>
                                        </div>
                                    </div>
                                <?php endif; ?>
                                <?php if ($show_tag_group) : ?>
                                    <div class="seamless-nd-filter-group" id="seamless-nd-tag-group">
                                        <label class="seamless-nd-filter-group-label">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                                                <line x1="7" y1="7" x2="7.01" y2="7"></line>
                                            </svg>
                                            <?php esc_html_e('Tag', 'seamless-addon'); ?>
                                        </label>
                                        <div class="seamless-nd-filter-options">
                                            <span class="seamless-nd-filter-placeholder"><?php esc_html_e('Tags load on the frontend.', 'seamless-addon'); ?></span>
                                        </div>
                                    </div>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php endif; ?>

                </div><!-- /.seamless-nd-searchbar-wrap -->
            </section>
        <?php
        endif; // show_search

        // ── Events Summary + View Toggle toolbar ──
        ?>
        <section class="seamless-events-toolbar-section">
            <div class="seamless-events-toolbar">
                <div class="seamless-events-summary">
                    <span class="seamless-events-summary-text"><?php esc_html_e('Showing preview events', 'seamless-addon'); ?></span>
                </div>
                <?php if ($default_view === 'all') : ?>
                    <div class="view-toggle-buttons seamless-view-toggle-icons">
                        <button class="view-toggle <?php echo $view === 'list' ? 'active' : ''; ?>" data-view="list" title="List View" aria-label="List View">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <line x1="9" y1="6.5" x2="21" y2="6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
                                <line x1="9" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
                                <line x1="9" y1="17.5" x2="21" y2="17.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
                                <circle cx="5.5" cy="6.5" r="1.4" fill="currentColor"></circle>
                                <circle cx="5.5" cy="12" r="1.4" fill="currentColor"></circle>
                                <circle cx="5.5" cy="17.5" r="1.4" fill="currentColor"></circle>
                            </svg>
                        </button>
                        <button class="view-toggle grid-view-toggle <?php echo $view === 'grid' ? 'active' : ''; ?>" data-view="grid" title="Grid View" aria-label="Grid View">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"></rect>
                                <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"></rect>
                                <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"></rect>
                                <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"></rect>
                            </svg>
                        </button>
                        <button class="view-toggle" data-view="calendar" title="Calendar View" aria-label="Calendar View">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" stroke-width="1.8"></rect>
                                <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.8"></line>
                                <line x1="8" y1="3" x2="8" y2="7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
                                <line x1="16" y1="3" x2="16" y2="7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
                                <rect x="7" y="12" width="3" height="3" rx="0.8" fill="currentColor"></rect>
                                <rect x="12" y="12" width="3" height="3" rx="0.8" fill="currentColor"></rect>
                            </svg>
                        </button>
                    </div>
                <?php endif; ?>
            </div>
        </section>

        <?php
        // ── Event list ──
        echo '<div class="details-section">';
        echo '<div class="seamless-event-list seamless-event-list-container" data-view="' . esc_attr($view) . '" data-layout="' . esc_attr($layout) . '">';

        if ($view === 'grid') {
            echo '<div class="event-grid">';
            foreach ($events as $event) {
                $this->render_preview_grid_item($event);
            }
            echo '</div>';
        } else {
            if ($layout === 'option_2') {
                $last_date_key = '';
                foreach ($events as $event) {
                    $current_key = $this->get_preview_date_key($event);
                    $is_same_day = ($current_key === $last_date_key);
                    $this->render_preview_list_item_option_2($event, $is_same_day);
                    $last_date_key = $current_key;
                }
            } else {
                foreach ($events as $event) {
                    $this->render_preview_list_item_option_1($event);
                }
            }
        }

        echo '</div>'; // .seamless-event-list
        echo '<div id="calendar_view" class="hidden"></div>';

        // Pagination preview
        if (($settings['pagination_type'] ?? 'numbers') !== 'none') {
            echo '<div id="pagination" class="seamless-pagination-wrapper">';
            if (($settings['pagination_type'] ?? 'numbers') === 'load_more') {
                echo '<button class="seamless-load-more-btn">' . esc_html($settings['load_more_text'] ?? 'Load More') . '</button>';
            } else {
                echo '<div class="seamless-pagination">';
                echo '<span class="seamless-page-link active">1</span>';
                echo '<span class="seamless-page-link">2</span>';
                echo '<span class="seamless-page-link">3</span>';
                echo '</div>';
            }
            echo '</div>';
        }

        echo '</div>'; // .details-section
        echo '</div>'; // #eventWrapper

        echo '<script>
            function imageLoaded(img) {
                if (!img) return;
                img.style.display = "block";
                if (img.previousElementSibling) {
                    img.previousElementSibling.style.display = "none";
                }
            }
        </script>';
    }


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
                <a href="#" class="event-link"><?php echo esc_html__('SEE DETAILS', 'seamless-addon'); ?></a>
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
                <a href="#" class="event-link"><?php echo esc_html__('SEE DETAILS', 'seamless-addon'); ?></a>
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
                            <a href="#" class="view-event-btn"><?php echo esc_html__('View Event', 'seamless-addon'); ?>
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
            return __('Online', 'seamless-addon');
        }

        if (!empty($venue['address'])) {
            return $venue['address'];
        }

        return __('TBD', 'seamless-addon');
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
    protected function render()
    {
        $settings = $this->get_settings_for_display();

        // Render preview in Elementor editor
        if (\Elementor\Plugin::$instance->editor->is_edit_mode()) {
            $this->render_preview($settings);
            return;
        }

        $default_view = $settings['default_view'] ?? 'all';
        $events_per_page = isset($settings['events_per_page']) ? intval($settings['events_per_page']) : 6;
        $show_search_bar = isset($settings['show_search_bar']) ? $settings['show_search_bar'] : 'yes';
        $show_search_bar_value = ($show_search_bar === 'yes' || $show_search_bar === true) ? 'true' : 'false';
        $filter_by_type = isset($settings['filter_by_type']) ? $settings['filter_by_type'] : 'none';

        // Excluded filter slugs
        $exclude_category_slugs = isset($settings['exclude_category_slugs']) ? $settings['exclude_category_slugs'] : '';
        $exclude_tag_slugs = isset($settings['exclude_tag_slugs']) ? $settings['exclude_tag_slugs'] : '';

        // Pagination settings
        $pagination_type = isset($settings['pagination_type']) ? $settings['pagination_type'] : 'numbers';
        $show_prev_next = isset($settings['show_prev_next']) ? ($settings['show_prev_next'] === 'yes' ? 'true' : 'false') : 'true';
        $prev_text = isset($settings['prev_text']) ? $settings['prev_text'] : '« Previous';
        $next_text = isset($settings['next_text']) ? $settings['next_text'] : 'Next »';
        $load_more_text = isset($settings['load_more_text']) ? $settings['load_more_text'] : 'Load More';
        $load_more_loading_text = isset($settings['load_more_loading_text']) ? $settings['load_more_loading_text'] : 'Loading...';
        $load_more_alignment = isset($settings['load_more_alignment']) ? $settings['load_more_alignment'] : 'center';
        $show_spinner = isset($settings['show_spinner']) ? ($settings['show_spinner'] === 'yes' ? 'true' : 'false') : 'true';

        // Add inline style to hide view toggle and search bar immediately if needed
        // This prevents flash before CSS/JS loads
        $inline_style = '';
        if ($default_view !== 'all') {
            $inline_style .= '<style>
                .seamless-elementor-wrapper[data-default-view="' . esc_attr($default_view) . '"] .view-toggle-button-container,
                .seamless-elementor-wrapper[data-default-view="' . esc_attr($default_view) . '"] .seamless-event-wrapper .view-toggle-button-container {
                    display: none !important;
                }
            </style>';
        }
        if ($show_search_bar_value === 'false') {
            $inline_style .= '<style>
                .seamless-elementor-wrapper[data-show-search="false"] .hero-section,
                .seamless-elementor-wrapper[data-show-search="false"] .filter-form,
                .seamless-elementor-wrapper[data-show-search="false"] .filter-controls,
                .seamless-elementor-wrapper[data-show-search="false"] .event-search-filter,
                .seamless-elementor-wrapper[data-show-search="false"] .seamless-nd-searchbar-section,
                .seamless-elementor-wrapper[data-show-search="false"] .seamless-event-wrapper .hero-section,
                .seamless-elementor-wrapper[data-show-search="false"] .seamless-event-wrapper .filter-form,
                .seamless-elementor-wrapper[data-show-search="false"] .seamless-event-wrapper .filter-controls,
                .seamless-elementor-wrapper[data-show-search="false"] .seamless-event-wrapper .event-search-filter,
                .seamless-elementor-wrapper[data-show-search="false"] .seamless-event-wrapper .seamless-nd-searchbar-section {
                    display: none !important;
                }
            </style>';
        }

        // Hide default pagination if using none type
        if ($pagination_type === 'none') {
            $inline_style .= '<style>
                .seamless-elementor-wrapper[data-pagination-type="none"] .seamless-event-wrapper .seamless-pagination-wrapper {
                    display: none !important;
                }
            </style>';
        }

        // Add spinner animation CSS
        if ($show_spinner === 'true') {
            $inline_style .= '<style>
                .seamless-load-more-btn .seamless-spinner {
                    display: inline-block;
                    vertical-align: middle;
                }
                .seamless-load-more-btn .seamless-spinner i,
                .seamless-load-more-btn .seamless-spinner svg {
                    animation: seamless-spin 1s linear infinite;
                }
                @keyframes seamless-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>';
        }

        // Get spinner icon HTML
        $spinner_icon_html = '';
        if ($show_spinner === 'true' && !empty($settings['spinner_icon'])) {
            ob_start();
            \Elementor\Icons_Manager::render_icon($settings['spinner_icon'], ['aria-hidden' => 'true']);
            $spinner_icon_html = ob_get_clean();
        }

        // Build data attributes
        $data_attrs = sprintf(
            'data-default-view="%s" data-events-per-page="%s" data-per-page="%s" data-show-search="%s" data-filter-by-type="%s" data-exclude-category-slugs="%s" data-exclude-tag-slugs="%s" data-pagination-type="%s" data-show-prev-next="%s" data-prev-text="%s" data-next-text="%s" data-load-more-text="%s" data-load-more-loading-text="%s" data-load-more-alignment="%s" data-show-spinner="%s" data-spinner-icon="%s"',
            esc_attr($default_view),
            esc_attr($events_per_page),
            esc_attr($events_per_page),
            esc_attr($show_search_bar_value),
            esc_attr($filter_by_type),
            esc_attr($exclude_category_slugs),
            esc_attr($exclude_tag_slugs),
            esc_attr($pagination_type),
            esc_attr($show_prev_next),
            esc_attr($prev_text),
            esc_attr($next_text),
            esc_attr($load_more_text),
            esc_attr($load_more_loading_text),
            esc_attr($load_more_alignment),
            esc_attr($show_spinner),
            esc_attr(base64_encode($spinner_icon_html))
        );

        // Simply render the seamless_event_list shortcode with data attributes
        echo $inline_style;
        echo '<div class="seamless-elementor-wrapper" ' . $data_attrs . '>';
        echo do_shortcode('[seamless_event_list template="without-dropdown"]');
        echo '</div>';
    }
}
