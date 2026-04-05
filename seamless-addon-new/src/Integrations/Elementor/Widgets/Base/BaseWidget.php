<?php

namespace SeamlessAddon\Integrations\Elementor\Widgets\Base;

use Elementor\Widget_Base;

/**
 * Base Widget Class
 * 
 * Base class for all Seamless Addon widgets with common functionality.
 */
abstract class BaseWidget extends \Elementor\Widget_Base
{
    /**
     * Request-level cache for event data.
     * Prevents multiple API calls during the same page load.
     *
     * @var array
     */
    private static $event_cache = [];

    /**
     * Get widget categories.
     *
     * @return array Widget categories.
     */
    public function get_categories()
    {
        return ['seamless'];
    }

    /**
     * Get widget keywords.
     *
     * @return array Widget keywords.
     */
    public function get_keywords()
    {
        return ['seamless', 'events', 'memberships'];
    }

    /**
     * Add common style controls.
     */
    protected function add_common_style_controls()
    {
        // Typography
        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'title_typography',
                'label' => __('Title Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-item-title',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'content_typography',
                'label' => __('Content Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-item-content',
            ]
        );

        // Colors
        $this->add_control(
            'title_color',
            [
                'label' => __('Title Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-item-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'content_color',
            [
                'label' => __('Content Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-item-content' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'background_color',
            [
                'label' => __('Background Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-item' => 'background-color: {{VALUE}};',
                ],
            ]
        );
    }

    /**
     * Add spacing controls.
     */
    protected function add_spacing_controls()
    {
        $this->add_responsive_control(
            'item_spacing',
            [
                'label' => __('Item Spacing', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'default' => [
                    'size' => 20,
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-item' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'item_padding',
            [
                'label' => __('Item Padding', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%', 'em'],
                'selectors' => [
                    '{{WRAPPER}} .seamless-item' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );
    }

    /**
     * Get event by context (auto-detect from URL).
     * Fetches from API using WordPress HTTP API.
     *
     * @return array|null Event data or null.
     */
    protected function get_event_by_context()
    {
        // Try query var first (set by rewrite rules)
        $event_slug = get_query_var('seamless_event');

        // If not found, try to extract from URL
        if (empty($event_slug)) {
            global $wp;
            $current_url = home_url($wp->request);
            $event_slug = $this->extract_event_slug_from_url($current_url);
        }

        if (empty($event_slug)) {
            return null;
        }

        // Check cache first
        $cache_key = 'event_' . $event_slug;
        if (isset(self::$event_cache[$cache_key])) {
            return self::$event_cache[$cache_key];
        }

        // Get API domain
        $client_domain = get_option('seamless_client_domain', '');
        if (empty($client_domain)) {
            return null;
        }

        // Fetch from API - Try Regular Event First
        $api_url = rtrim($client_domain, '/') . '/api/events/' . sanitize_title($event_slug);
        $response = wp_remote_get($api_url, [
            'timeout' => 10,
            'headers' => [
                'Accept' => 'application/json',
            ],
        ]);

        $event_found = false;
        $data = null;

        // Check if regular event request was successful
        if (!is_wp_error($response)) {
            $code = wp_remote_retrieve_response_code($response);
            if ($code === 200) {
                $body = wp_remote_retrieve_body($response);
                $json = json_decode($body, true);
                if (!empty($json['success']) && !empty($json['data'])) {
                    $data = $json['data'];
                    // Ensure event_type is set
                    $data['event_type'] = 'event';
                    $event_found = true;
                }
            }
        }

        // If not found, try Group Event
        if (!$event_found) {
            $group_api_url = rtrim($client_domain, '/') . '/api/group-events/' . sanitize_title($event_slug);
            $group_response = wp_remote_get($group_api_url, [
                'timeout' => 10,
                'headers' => [
                    'Accept' => 'application/json',
                ],
            ]);

            if (!is_wp_error($group_response)) {
                $code = wp_remote_retrieve_response_code($group_response);
                if ($code === 200) {
                    $body = wp_remote_retrieve_body($group_response);
                    $json = json_decode($body, true);
                    if (!empty($json['success']) && !empty($json['data'])) {
                        $data = $json['data'];
                        // Explicitly set type as group_event
                        $data['event_type'] = 'group_event';

                        // Fetch full data for associated events (schedules and tickets)
                        if (!empty($data['associated_events']) && is_array($data['associated_events'])) {
                            $enriched_associated_events = [];
                            foreach ($data['associated_events'] as $associated_event) {
                                if (!empty($associated_event['slug'])) {
                                    // Fetch full event data for this associated event
                                    $assoc_api_url = rtrim($client_domain, '/') . '/api/events/' . sanitize_title($associated_event['slug']);
                                    $assoc_response = wp_remote_get($assoc_api_url, [
                                        'timeout' => 10,
                                        'headers' => [
                                            'Accept' => 'application/json',
                                        ],
                                    ]);

                                    if (!is_wp_error($assoc_response)) {
                                        $assoc_code = wp_remote_retrieve_response_code($assoc_response);
                                        if ($assoc_code === 200) {
                                            $assoc_body = wp_remote_retrieve_body($assoc_response);
                                            $assoc_json = json_decode($assoc_body, true);
                                            if (!empty($assoc_json['success']) && !empty($assoc_json['data'])) {
                                                // Merge the full event data with the associated event
                                                $enriched_associated_events[] = array_merge(
                                                    $associated_event,
                                                    $assoc_json['data']
                                                );
                                                continue;
                                            }
                                        }
                                    }
                                }
                                // If we couldn't fetch full data, use the original associated event
                                $enriched_associated_events[] = $associated_event;
                            }
                            $data['associated_events'] = $enriched_associated_events;
                        }

                        $event_found = true;
                    }
                }
            }
        }

        if ($event_found && $data) {
            // Store in cache for this request
            self::$event_cache[$cache_key] = $data;
            return $data;
        }

        return null; // Widgets usually handle fallback/preview data via get_preview_event_data logic elsewhere if needed, or we check usage.
    }

    /**
     * Extract event slug from URL.
     *
     * @param string $url URL to parse.
     * @return string|null Event slug or null.
     */
    private function extract_event_slug_from_url($url)
    {
        // Get the events endpoint from settings
        $events_endpoint = get_option('seamless_single_event_endpoint', 'event');

        // Parse URL and extract slug after events endpoint
        $path = parse_url($url, PHP_URL_PATH);
        $path_parts = explode('/', trim((string) $path, '/'));

        $key = array_search($events_endpoint, $path_parts);
        if (false !== $key && isset($path_parts[$key + 1])) {
            return sanitize_title($path_parts[$key + 1]);
        }

        return null;
    }

    /**
     * Get event data based on settings.
     * For now, always auto-detect from context.
     *
     * @param array $settings Widget settings.
     * @return array|null Event data or null.
     */
    protected function get_event_data($settings)
    {
        // Always auto-detect from context based on current URL
        return $this->get_event_by_context();
    }

    /**
     * Get event options for dropdown (not used anymore since we removed manual selection).
     * Returns empty array as widgets now use auto-detection only.
     *
     * @return array Event options.
     */
    protected function get_event_options()
    {
        return [];
    }

    /**
     * Add event selection controls.
     */
    protected function add_event_selection_controls()
    {
        $this->add_control(
            'auto_detect_info',
            [
                'type' => \Elementor\Controls_Manager::RAW_HTML,
                'raw' => '<div>' .
                    __('Automatically detects event data from URL on single event pages.', 'seamless-addon') .
                    '</div>',
                'content_classes' => 'elementor-panel-alert elementor-panel-alert-info',
            ]
        );
    }

    /**
     * Add link controls.
     *
     * @param string $prefix Control prefix.
     * @param string $selector CSS selector.
     */
    protected function add_link_controls($prefix = 'link', $selector = 'a')
    {
        $this->add_control(
            $prefix . '_color',
            [
                'label' => __('Link Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} ' . $selector => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            $prefix . '_hover_color',
            [
                'label' => __('Link Hover Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} ' . $selector . ':hover' => 'color: {{VALUE}};',
                ],
            ]
        );
    }

    /**
     * Add HTML tag control.
     *
     * @param string $name Control name.
     * @param string $default Default tag.
     */
    protected function add_html_tag_control($name = 'html_tag', $default = 'h2')
    {
        $this->add_control(
            $name,
            [
                'label' => __('HTML Tag', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'options' => [
                    'h1' => 'H1',
                    'h2' => 'H2',
                    'h3' => 'H3',
                    'h4' => 'H4',
                    'h5' => 'H5',
                    'h6' => 'H6',
                    'div' => 'div',
                    'span' => 'span',
                    'p' => 'p',
                ],
                'default' => $default,
            ]
        );
    }

    /**
     * Get preview event data for Elementor editor.
     * Returns sample data so designers can see what widgets will look like.
     *
     * @return array Sample event data.
     */
    protected function get_preview_event_data()
    {
        return [
            'title' => 'Event Title',
            'slug' => 'sample-event',
            'excerpt_description' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec neque nunc. In a congue est. Curabitur rhoncus, erat vel mollis vestibulum, sapien dolor luctus velit, eu tincidunt quam lorem ac turpis.',
            'description' => '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>',
            'featured_image' => SEAMLESS_ADDON_PLUGIN_URL . 'assets/images/placeholder-image.png',
            'image_url' => SEAMLESS_ADDON_PLUGIN_URL . 'assets/images/placeholder-image.png',
            'start_date' => date('Y-m-d 15:00:00'),
            'end_date' => date('Y-m-d 17:00:00'),
            'formatted_start_date' => date('Y-m-d 15:00:00'),
            'formatted_end_date' => date('Y-m-d 17:00:00'),
            'event_type' => 'event',
            'registration_url' => '#',
            // 'registration_start_date' => '2026-02-01 00:00:00',
            // 'registration_end_date' => '2026-03-14 23:59:59',
            'virtual_meeting_link' => '',
            'venue' => [
                'name' => 'Convention Center',
                'address_line_1' => '123 Main Street',
                'address' => '123 Main Street',
                'city' => 'Minneapolis',
                'state' => 'MN',
                'zip_code' => '55401',
                'google_map_url' => 'https://maps.google.com',
            ],
            'tickets' => [
                [
                    'label' => 'General Admission',
                    'price' => '99.00',
                    'inventory' => 100,
                    // 'registration_start_date' => '2026-02-01 00:00:00',
                    // 'registration_end_date' => '2026-03-14 23:59:59',
                ],
                [
                    'label' => 'VIP Pass',
                    'price' => '199.00',
                    'inventory' => 50,
                    // 'registration_start_date' => '2026-02-01 00:00:00',
                    // 'registration_end_date' => '2026-03-14 23:59:59',
                ],
                [
                    'label' => 'Student Ticket',
                    'price' => '0',
                    // 'inventory' => 25,
                    // 'registration_start_date' => '2026-02-01 00:00:00',
                    // 'registration_end_date' => '2026-03-14 23:59:59',
                ],
            ],
            'additional_details' => [
                [
                    'name' => 'Additional Details',
                    'value' => 'Additional information will be displayed here.',
                ],
            ],
            'schedules' => [
                [
                    'title' => 'Lunch Break',
                    'start_time' => '12:00 PM',
                    'end_time' => '01:00 PM',
                    'start_date_display' => '2026-03-15 12:00:00',
                    'end_date_display' => '2026-03-15 13:00:00',
                    'description' => 'Enjoy lunch and continue networking.',
                ],
                [
                    'title' => 'Afternoon Workshops',
                    'start_time' => '01:00 PM',
                    'end_time' => '04:00 PM',
                    'start_date_display' => '2026-03-15 13:00:00',
                    'end_date_display' => '2026-03-15 16:00:00',
                    'description' => 'Choose from multiple hands-on workshop sessions.',
                ],
            ],
        ];
    }

    /**
     * Add accordion style controls.
     */
    protected function  add_accordion_style_controls()
    {
        // Accordion Header Styles
        $this->add_control(
            'accordion_header_heading',
            [
                'label' => __('Accordion Header', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'accordion_header_typography',
                'selector' => '{{WRAPPER}} .accordion-header',
            ]
        );

        $this->add_control(
            'accordion_header_color',
            [
                'label' => __('Text Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .accordion-header' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'accordion_header_bg',
            [
                'label' => __('Background Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .accordion-header' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'accordion_header_hover_color',
            [
                'label' => __('Hover Text Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .accordion-header:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'accordion_header_hover_bg',
            [
                'label' => __('Hover Background', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .accordion-header:hover' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'accordion_header_padding',
            [
                'label' => __('Padding', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .accordion-header' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        // Accordion Icon Styles
        $this->add_control(
            'accordion_icon_heading',
            [
                'label' => __('Accordion Icon', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_responsive_control(
            'accordion_icon_spacing',
            [
                'label' => __('Icon Spacing', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .accordion-header' => 'gap: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'accordion_icon_color',
            [
                'label' => __('Icon Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .accordion-header i' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'accordion_icon_size',
            [
                'label' => __('Icon Size', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px', 'em', 'rem'],
                'range' => [
                    'px' => [
                        'min' => 10,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .accordion-header i' => 'font-size: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'accordion_icon_rotation',
            [
                'label' => __('Icon Rotation (Active)', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['deg'],
                'range' => [
                    'deg' => [
                        'min' => 0,
                        'max' => 360,
                    ],
                ],
                'default' => [
                    'size' => 180,
                    'unit' => 'deg',
                ],
                'selectors' => [
                    '{{WRAPPER}} .accordion-item.active .accordion-header i' => 'transform: rotate({{SIZE}}{{UNIT}});',
                ],
            ]
        );

        // Accordion Body Styles
        $this->add_control(
            'accordion_body_heading',
            [
                'label' => __('Accordion Body', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'accordion_body_typography',
                'selector' => '{{WRAPPER}} .accordion-body',
            ]
        );

        $this->add_control(
            'accordion_body_color',
            [
                'label' => __('Text Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .accordion-body' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'accordion_body_bg',
            [
                'label' => __('Background Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .accordion-body' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'accordion_body_padding',
            [
                'label' => __('Padding', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .accordion-item.active .accordion-body' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        // Accordion Item Styles
        $this->add_control(
            'accordion_item_heading',
            [
                'label' => __('Accordion Item', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name' => 'accordion_item_border',
                'selector' => '{{WRAPPER}} .accordion-item',
            ]
        );

        $this->add_responsive_control(
            'accordion_item_spacing',
            [
                'label' => __('Item Spacing', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .accordion-item' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );
    }
}
