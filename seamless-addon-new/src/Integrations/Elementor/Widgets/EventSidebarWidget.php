<?php

namespace SeamlessAddon\Integrations\Elementor\Widgets;

use SeamlessAddon\Integrations\Elementor\Widgets\Base\BaseWidget;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Border;
use Elementor\Group_Control_Background;
use function esc_attr;
use function esc_html;
use function esc_url;
use function wp_strip_all_tags;
use function wp_timezone;
use function wp_timezone_string;

/**
 * Event Sidebar Widget
 * 
 * Displays event metadata in sidebar card with toggles for each field.
 */
class EventSidebarWidget extends BaseWidget
{
    /**
     * Get widget name.
     */
    public function get_name()
    {
        return 'seamless-event-sidebar';
    }

    /**
     * Get widget title.
     */
    public function get_title()
    {
        return __('Event Sidebar', 'seamless-addon');
    }

    /**
     * Get widget icon.
     */
    public function get_icon()
    {
        return 'eicon-info-box';
    }

    /**
     * Register widget controls.
     */
    protected function register_controls()
    {
        // Content Section
        $this->start_controls_section(
            'content_section',
            [
                'label' => __('Content', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_event_selection_controls();

        $this->add_control(
            'show_date',
            [
                'label' => __('Show Date', 'seamless-addon'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-addon'),
                'label_off' => __('No', 'seamless-addon'),
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_time',
            [
                'label' => __('Show Time', 'seamless-addon'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-addon'),
                'label_off' => __('No', 'seamless-addon'),
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_location',
            [
                'label' => __('Show Location', 'seamless-addon'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-addon'),
                'label_off' => __('No', 'seamless-addon'),
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_capacity',
            [
                'label' => __('Show Capacity', 'seamless-addon'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-addon'),
                'label_off' => __('No', 'seamless-addon'),
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_add_to_calendar',
            [
                'label' => __('Show Add to Calendar', 'seamless-addon'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-addon'),
                'label_off' => __('No', 'seamless-addon'),
                'default' => 'yes',
            ]
        );

        $this->end_controls_section();

        // Card Style Section
        $this->start_controls_section(
            'card_style_section',
            [
                'label' => __('Card Style', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name' => 'card_background',
                'types' => ['classic', 'gradient'],
                'selector' => '{{WRAPPER}} .event-info-card',
            ]
        );

        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name' => 'card_border',
                'selector' => '{{WRAPPER}} .event-info-card',
            ]
        );

        $this->add_responsive_control(
            'card_border_radius',
            [
                'label' => __('Border Radius', 'seamless-addon'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .event-info-card' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'card_padding',
            [
                'label' => __('Padding', 'seamless-addon'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .event-info-card' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Icon Style Section
        $this->start_controls_section(
            'icon_style_section',
            [
                'label' => __('Icon Style', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'icon_color',
            [
                'label' => __('Icon Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-info-item i' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .event-icon' => 'stroke: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'icon_size',
            [
                'label' => __('Icon Size', 'seamless-addon'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => [
                        'min' => 10,
                        'max' => 50,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .event-info-item i' => 'font-size: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .event-icon' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'icon_spacing',
            [
                'label' => __('Icon Horizontal Spacing', 'seamless-addon'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .event-info-item i' => 'margin-right: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .event-icon' => 'margin-right: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'icon_vertical_spacing',
            [
                'label' => __('Icon Vertical Spacing', 'seamless-addon'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .event-info-item i' => 'margin-top: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .event-icon' => 'margin-top: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Label Style Section
        $this->start_controls_section(
            'label_style_section',
            [
                'label' => __('Label Style', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'label_typography',
                'selector' => '{{WRAPPER}} .event-info-label',
            ]
        );

        $this->add_control(
            'label_color',
            [
                'label' => __('Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-info-label' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Value Style Section
        $this->start_controls_section(
            'value_style_section',
            [
                'label' => __('Value Style', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'value_typography',
                'selector' => '{{WRAPPER}} .event-info-value',
            ]
        );

        $this->add_control(
            'value_color',
            [
                'label' => __('Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-info-value' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Item Spacing Section
        $this->start_controls_section(
            'spacing_style_section',
            [
                'label' => __('Spacing', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
            'item_spacing',
            [
                'label' => __('Item Spacing', 'seamless-addon'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .event-info-item' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'last_item_spacing',
            [
                'label' => __('Last Item Spacing', 'seamless-addon'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .event-info-item:last-child' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Add to Calendar Button Style
        $this->start_controls_section(
            'calendar_button_style_section',
            [
                'label' => __('Add to Calendar Button', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_STYLE,
                'condition' => [
                    'show_add_to_calendar' => 'yes',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'calendar_button_typography',
                'selector' => '{{WRAPPER}} add-to-calendar-button',
            ]
        );

        $this->add_control(
            'calendar_button_color',
            [
                'label' => __('Text Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} add-to-calendar-button' => '--btn-text: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'calendar_button_bg',
            [
                'label' => __('Background Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} add-to-calendar-button' => '--btn-background: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'calendar_button_border_color',
            [
                'label' => __('Border Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} add-to-calendar-button' => '--btn-border: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'calendar_button_hover_color',
            [
                'label' => __('Hover Text Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} add-to-calendar-button' => '--btn-hover-text: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'calendar_button_hover_bg',
            [
                'label' => __('Hover Background', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} add-to-calendar-button' => '--btn-hover-background: {{VALUE}};',
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
        $event = $this->get_event_data($settings);

        // Use preview data in Elementor editor
        if (!$event && \Elementor\Plugin::$instance->editor->is_edit_mode()) {
            $event = $this->get_preview_event_data();
        }

        if (!$event) {
            return;
        }

        // Process date/time data
        $event_type = $event['event_type'] ?? 'event';
        $timezone_obj = null;

        // Both event types use formatted dates which are in local time
        $startDate = $event['formatted_start_date'] ?? $event['start_date'] ?? '';
        $endDate = $event['formatted_end_date'] ?? $event['end_date'] ?? '';
        $timezone_obj = function_exists('wp_timezone') ? wp_timezone() : new \DateTimeZone(wp_timezone_string());

        $dateDisplay = '';
        $timeDisplay = '';
        $timezoneAbbr = '';

        if ($startDate) {
            try {
                // Both event types now use formatted dates which are in local time
                $startDt = new \DateTime($startDate, $timezone_obj);
            } catch (\Exception $e) {
                $startDt = new \DateTime($startDate);
                $startDt->setTimezone($timezone_obj);
            }

            $endDt = null;
            if ($endDate) {
                try {
                    // Both event types now use formatted dates which are in local time
                    $endDt = new \DateTime($endDate, $timezone_obj);
                } catch (\Exception $e) {
                    $endDt = new \DateTime($endDate);
                    $endDt->setTimezone($timezone_obj);
                }
            }

            $timezoneAbbr = $startDt->format('T');

            if ($endDt) {
                $sameDay = $startDt->format('Y-m-d') === $endDt->format('Y-m-d');
                $sameMonthYear = $startDt->format('Y-m') === $endDt->format('Y-m');
                $sameYear = $startDt->format('Y') === $endDt->format('Y');

                if ($sameDay) {
                    $dateDisplay = $startDt->format('l, F j, Y');
                } elseif ($sameMonthYear) {
                    $dateDisplay = sprintf(
                        '%s - %s, %s %d - %d, %s',
                        $startDt->format('l'),
                        $endDt->format('l'),
                        $startDt->format('F'),
                        (int) $startDt->format('j'),
                        (int) $endDt->format('j'),
                        $startDt->format('Y')
                    );
                } else {
                    if ($sameYear) {
                        $dateDisplay = sprintf(
                            '%s - %s, %s %d - %s %d, %s',
                            $startDt->format('l'),
                            $endDt->format('l'),
                            $startDt->format('F'),
                            (int) $startDt->format('j'),
                            $endDt->format('F'),
                            (int) $endDt->format('j'),
                            $startDt->format('Y')
                        );
                    } else {
                        $dateDisplay = sprintf(
                            '%s, %s %d, %s - %s, %s %d, %s',
                            $startDt->format('l'),
                            $startDt->format('F'),
                            (int) $startDt->format('j'),
                            $startDt->format('Y'),
                            $endDt->format('l'),
                            $endDt->format('F'),
                            (int) $endDt->format('j'),
                            $endDt->format('Y')
                        );
                    }
                }

                $startTime = $startDt->format('g:i A');
                $endTime = $endDt->format('g:i A');
                $timeDisplay = sprintf('%s – %s', $startTime, $endTime);
            } else {
                $dateDisplay = $startDt->format('D, M j, Y');
                $startTime = $startDt->format('g:i A');
                $timeDisplay = $startTime;
            }
        }

        // Venue details
        $venue = $event['venue'] ?? [];
        $venue_name = $venue['name'] ?? '';
        $google_map_url = $venue['google_map_url'] ?? '';
        $virtual_link = $event['virtual_meeting_link'] ?? '';

        $location_html = '';
        if (!empty($venue_name)) {
            if (!empty($google_map_url)) {
                $location_html .= '<a href="' . esc_url($google_map_url) . '" target="_blank" rel="noopener noreferrer" class="venue-link" style="text-decoration: none; color: inherit;">' . esc_html($venue_name) . ' <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.8em; margin-left: 5px;"></i></a>';
            } else {
                $location_html .= esc_html($venue_name);
            }

            if (!empty($virtual_link)) {
                $location_html .= ' + Online';
            }
            $location_html .= '<br>';
        } elseif (!empty($virtual_link)) {
            $location_html .= 'Online<br>';
        } else {
            $location_html .= 'Online<br>';
        }

        $venue_address_1 = $venue['address_line_1'] ?? ($venue['address'] ?? '');
        if (!empty($venue_address_1)) {
            $location_html .= esc_html($venue_address_1) . ',<br>';
        }

        $city = $venue['city'] ?? '';
        $state = $venue['state'] ?? '';
        $zip = $venue['zip_code'] ?? '';

        $city_state_parts = [];
        if (!empty($city)) $city_state_parts[] = $city;
        if (!empty($state)) $city_state_parts[] = $state;

        if (!empty($city_state_parts)) {
            $location_html .= esc_html('(' . implode(', ', $city_state_parts) . ')');
        }

        if (!empty($zip)) {
            $location_html .= ' ' . esc_html($zip);
        }

        if (empty($location_html)) {
            $location_html = 'TBA';
        }

        // Calculate capacity
        $total_capacity = 0;
        $tickets = $event['tickets'] ?? [];
        if (!empty($tickets)) {
            foreach ($tickets as $ticket) {
                $total_capacity += intval($ticket['inventory'] ?? 0);
            }
        }

        // Prepare calendar data
        $calendar_name = $event['title'] ?? '';
        $calendar_description = !empty($event['except_description'])
            ? wp_strip_all_tags($event['except_description'])
            : wp_strip_all_tags($event['description'] ?? '');

        if (strlen($calendar_description) > 200) {
            $calendar_description = substr($calendar_description, 0, 197) . '...';
        }

        $calendar_start_date = '';
        $calendar_start_time = '';
        $calendar_end_date = '';
        $calendar_end_time = '';
        $calendar_timezone = 'America/Chicago';

        if ($startDate) {
            try {
                // Both event types now use formatted dates which are in local time
                $calStartDt = new \DateTime($startDate, $timezone_obj);

                $calendar_start_date = $calStartDt->format('Y-m-d');
                $calendar_start_time = $calStartDt->format('H:i');
                $calendar_timezone = $calStartDt->getTimezone()->getName();

                if ($endDate) {
                    $calEndDt = new \DateTime($endDate, $timezone_obj);
                    $calendar_end_date = $calEndDt->format('Y-m-d');
                    $calendar_end_time = $calEndDt->format('H:i');
                } else {
                    $calEndDt = clone $calStartDt;
                    $calEndDt->modify('+2 hours');
                    $calendar_end_date = $calEndDt->format('Y-m-d');
                    $calendar_end_time = $calEndDt->format('H:i');
                }
            } catch (\Exception $e) {
                $calendar_start_date = '';
            }
        }

        $calendar_location = '';
        if (!empty($venue_name)) {
            $calendar_location = $venue_name;
            if (!empty($venue_address_1)) {
                $calendar_location .= ', ' . $venue_address_1;
            }
            if (!empty($city)) {
                $calendar_location .= ', ' . $city;
            }
            if (!empty($state)) {
                $calendar_location .= ', ' . $state;
            }
            if (!empty($zip)) {
                $calendar_location .= ' ' . $zip;
            }
        } elseif (!empty($virtual_link)) {
            $calendar_location = 'Online Event';
        }

?>
        <div class="event-info-card">
            <?php if ($settings['show_date'] === 'yes') : ?>
                <div class="event-info-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="event-icon">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <div class="event-info-content">
                        <div class="event-info-label">Date</div>
                        <div class="event-info-value">
                            <?php echo $dateDisplay ? esc_html($dateDisplay) : '-'; ?>
                        </div>
                    </div>
                </div>
            <?php endif; ?>

            <?php if ($settings['show_time'] === 'yes') : ?>
                <div class="event-info-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="event-icon">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <div class="event-info-content">
                        <div class="event-info-label">Time</div>
                        <div class="event-info-value">
                            <?php if ($timeDisplay): ?>
                                <?php echo esc_html($timeDisplay . ($timezoneAbbr ? ' ' . $timezoneAbbr : '')); ?>
                            <?php else: ?>
                                -
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            <?php endif; ?>

            <?php if ($settings['show_capacity'] === 'yes' && $total_capacity > 0) : ?>
                <div class="event-info-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="event-icon">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <div class="event-info-content">
                        <div class="event-info-label">Capacity</div>
                        <div class="event-info-value"><?php echo esc_html($total_capacity); ?> capacity</div>
                    </div>
                </div>
            <?php endif; ?>

            <?php if ($settings['show_location'] === 'yes') : ?>
                <div class="event-info-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="event-icon">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <div class="event-info-content">
                        <div class="event-info-label">Location</div>
                        <div class="event-info-value">
                            <?php echo wp_kses_post($location_html); ?>
                        </div>
                    </div>
                </div>
            <?php endif; ?>

            <?php if ($settings['show_add_to_calendar'] === 'yes' && !empty($calendar_start_date)) : ?>
                <div class="event-info-item event-calendar-button-wrapper">
                    <div class="event-info-content">
                        <add-to-calendar-button
                            name="<?php echo esc_attr($calendar_name); ?>"
                            description="<?php echo esc_attr($calendar_description); ?>"
                            startDate="<?php echo esc_attr($calendar_start_date); ?>"
                            startTime="<?php echo esc_attr($calendar_start_time); ?>"
                            endDate="<?php echo esc_attr($calendar_end_date); ?>"
                            endTime="<?php echo esc_attr($calendar_end_time); ?>"
                            timeZone="<?php echo esc_attr($calendar_timezone); ?>"
                            location="<?php echo esc_attr($calendar_location); ?>"
                            options="'Apple','Google','iCal','Microsoft365','Outlook.com','Yahoo'"
                            lightMode="bodyScheme"
                            size="3"
                            buttonStyle="round"
                            hideIconButton
                            hideBackground
                            hidebranding
                            styleLight="--btn-background: transparent; --btn-text: var(--seamless-secondary-color); --font: inherit; --btn-border-radius: 8px; --btn-border: var(--seamless-secondary-color); --btn-shadow: none; --btn-hover-background: var(--seamless-secondary-color); --btn-hover-text: #ffffff; --btn-hover-border: none; --btn-hover-shadow: none; padding: var(--btn-padding-y) var(--btn-padding-x) !important; --btn-active-shadow: none;"></add-to-calendar-button>
                    </div>
                </div>
            <?php endif; ?>
        </div>
<?php
    }
}
