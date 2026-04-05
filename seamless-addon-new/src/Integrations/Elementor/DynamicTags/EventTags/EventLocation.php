<?php

namespace SeamlessAddon\Integrations\Elementor\DynamicTags\EventTags;

use Elementor\Controls_Manager;

class EventLocation extends BaseEventTag
{
    public function get_name()
    {
        return 'seamless-event-location';
    }

    public function get_title()
    {
        return __('Event Location', 'seamless-addon');
    }

    public function get_categories()
    {
        return [\Elementor\Modules\DynamicTags\Module::TEXT_CATEGORY];
    }

    protected function register_controls()
    {
        $this->add_control(
            'auto_detect_info',
            [
                'type' => Controls_Manager::RAW_HTML,
                'raw' => '<div style="padding: 10px; background: #0a1a3d; border-left: 3px solid #2563eb; color: #fff; font-style: italic; font-size: 12px; font-weight: 300;">' .
                    __('Automatically detects event data from URL on single event pages.', 'seamless-addon') .
                    '</div>',
                'content_classes' => 'elementor-panel-alert elementor-panel-alert-info',
            ]
        );

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
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_google_map_link',
            [
                'label' => __('Show Google Maps Link', 'seamless-addon'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
                'condition' => ['show_venue_name' => 'yes'],
            ]
        );

        $this->add_control(
            'show_address',
            [
                'label' => __('Show Address Line', 'seamless-addon'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_city',
            [
                'label' => __('Show City', 'seamless-addon'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_state',
            [
                'label' => __('Show State', 'seamless-addon'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_zip',
            [
                'label' => __('Show Zip Code', 'seamless-addon'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
            ]
        );
    }

    public function render()
    {
        $settings = $this->get_settings();
        $event = $this->get_event($settings);

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

        // Build location parts based on toggle settings
        $location_parts = [];

        // Venue name with optional link
        if ($settings['show_venue_name'] === 'yes' && !empty($venue_name)) {
            if ($settings['show_google_map_link'] === 'yes' && !empty($google_map_url)) {
                $location_parts[] = '<a href="' . esc_url($google_map_url) . '" target="_blank" rel="noopener noreferrer" class="venue-link" >' .
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
            echo implode('<br>', $location_parts);
        } elseif (!empty($virtual_link)) {
            echo esc_html('Online');
        }
    }
}
