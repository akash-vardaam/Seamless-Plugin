<?php

namespace SeamlessAddon\Integrations\Elementor\Widgets;

use SeamlessAddon\Integrations\Elementor\Widgets\Base\BaseWidget;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;

/**
 * Event Location Widget
 * 
 * Displays event location with granular toggle controls for each part.
 */
class EventLocationWidget extends BaseWidget
{
    /**
     * Get widget name.
     */
    public function get_name()
    {
        return 'seamless-event-location';
    }

    /**
     * Get widget title.
     */
    public function get_title()
    {
        return __('Event Location', 'seamless-addon');
    }

    /**
     * Get widget icon.
     */
    public function get_icon()
    {
        return 'eicon-map-pin';
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

        // Location Parts Toggles
        $this->add_control(
            'location_parts_heading',
            [
                'label' => __('Location Parts', 'seamless-addon'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'show_venue_name',
            [
                'label' => __('Show Venue Name', 'seamless-addon'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-addon'),
                'label_off' => __('No', 'seamless-addon'),
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_google_map_link',
            [
                'label' => __('Show Google Maps Link', 'seamless-addon'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-addon'),
                'label_off' => __('No', 'seamless-addon'),
                'default' => 'yes',
                'condition' => [
                    'show_venue_name' => 'yes',
                ],
            ]
        );

        $this->add_control(
            'show_address',
            [
                'label' => __('Show Address Line', 'seamless-addon'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-addon'),
                'label_off' => __('No', 'seamless-addon'),
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_city',
            [
                'label' => __('Show City', 'seamless-addon'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-addon'),
                'label_off' => __('No', 'seamless-addon'),
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_state',
            [
                'label' => __('Show State', 'seamless-addon'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-addon'),
                'label_off' => __('No', 'seamless-addon'),
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_zip',
            [
                'label' => __('Show Zip Code', 'seamless-addon'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-addon'),
                'label_off' => __('No', 'seamless-addon'),
                'default' => 'yes',
            ]
        );

        $this->end_controls_section();

        // Style Section
        $this->start_controls_section(
            'style_section',
            [
                'label' => __('Style', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'typography',
                'selector' => '{{WRAPPER}} .event-info-value',
            ]
        );

        $this->add_control(
            'text_color',
            [
                'label' => __('Text Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-info-value' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'link_color',
            [
                'label' => __('Link Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .venue-link' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'link_hover_color',
            [
                'label' => __('Link Hover Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .venue-link:hover' => 'color: {{VALUE}};',
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

        // Get venue information
        $venue = $event['venue'] ?? [];
        $venue_name = $venue['name'] ?? '';
        $address = $venue['address_line_1'] ?? '';
        $city = $venue['city'] ?? '';
        $state = $venue['state'] ?? '';
        $zip = $venue['zip_code'] ?? '';
        $google_map_url = $venue['google_map_url'] ?? '';
        $virtual_link = $event['virtual_meeting_link'] ?? '';

        // Build location parts
        $location_parts = [];

        // Venue name with optional link
        if ($settings['show_venue_name'] === 'yes' && !empty($venue_name)) {
            if ($settings['show_google_map_link'] === 'yes' && !empty($google_map_url)) {
                $location_parts[] = '<a href="' . esc_url($google_map_url) . '" target="_blank" rel="noopener noreferrer" class="venue-link" style="text-decoration: none;">' .
                    esc_html($venue_name) .
                    ' <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.8em;margin-left: 5px"></i></a>';
            } else {
                $location_parts[] = esc_html($venue_name);
            }
        }

        // Address
        if ($settings['show_address'] === 'yes' && !empty($address)) {
            $location_parts[] = esc_html($address);
        }

        // City, State, Zip
        $city_state_zip = [];
        if ($settings['show_city'] === 'yes' && !empty($city)) {
            $city_state_zip[] = esc_html($city);
        }
        if ($settings['show_state'] === 'yes' && !empty($state)) {
            $city_state_zip[] = esc_html($state);
        }
        if (!empty($city_state_zip)) {
            $city_state_str = '(' . implode(', ', $city_state_zip) . ')';
            if ($settings['show_zip'] === 'yes' && !empty($zip)) {
                $city_state_str .= ' ' . esc_html($zip);
            }
            $location_parts[] = $city_state_str;
        } elseif ($settings['show_zip'] === 'yes' && !empty($zip)) {
            $location_parts[] = esc_html($zip);
        }

        // Output
        if (!empty($location_parts)) {
            echo '<div class="event-info-value">';
            echo implode('<br>', $location_parts);
            echo '</div>';
        } elseif (!empty($virtual_link)) {
            echo '<div class="event-info-value">' . esc_html__('Online', 'seamless-addon') . '</div>';
        } else {
            if (\Elementor\Plugin::$instance->editor->is_edit_mode()) {
                echo '<p>' . __('No location information available.', 'seamless-addon') . '</p>';
            }
        }
    }
}
