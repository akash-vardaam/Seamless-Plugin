<?php

namespace SeamlessAddon\Integrations\Elementor\DynamicTags\EventTags;

trait EventDataTrait
{
    /**
     * Request-level cache for event data.
     * Prevents multiple API calls during the same page load.
     *
     * @var array
     */
    private static $event_cache = [];

    /**
     * Get event by context (auto-detect from URL).
     * Fetches from API using WordPress HTTP API.
     * @return array|null Event data or null.
     */
    protected function get_event_by_context()
    {
        $event_slug = get_query_var('seamless_event');

        if (empty($event_slug)) {
            global $wp;
            $current_url = home_url($wp->request);
            $event_slug = $this->extract_event_slug_from_url($current_url);
        }

        if (empty($event_slug)) {
            if (defined('ELEMENTOR_PATH') && \Elementor\Plugin::$instance->editor->is_edit_mode()) {
                return $this->get_preview_event();
            }
            return null;
        }

        $cache_key = 'event_' . $event_slug;
        if (isset(self::$event_cache[$cache_key])) {
            return self::$event_cache[$cache_key];
        }

        $client_domain = get_option('seamless_client_domain', '');
        if (empty($client_domain)) {
            if (defined('ELEMENTOR_PATH') && \Elementor\Plugin::$instance->editor->is_edit_mode()) {
                return $this->get_preview_event();
            }
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

        // If no data found but in editor, return preview
        if (defined('ELEMENTOR_PATH') && \Elementor\Plugin::$instance->editor->is_edit_mode()) {
            return $this->get_preview_event();
        }

        return null;
    }

    /**
     * Get preview event data for Elementor editor.
     *
     * @return array Sample event data.
     */
    private function get_preview_event()
    {
        return [
            'title' => 'Event Title',
            'slug' => 'sample-event',
            'description' => '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>',
            'except_description' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec neque nunc. In a congue est. Curabitur rhoncus, erat vel mollis vestibulum, sapien dolor luctus velit, eu tincidunt quam lorem ac turpis.',
            'featured_image' => SEAMLESS_ADDON_PLUGIN_URL . 'assets/images/placeholder-image.png',
            'image_url' => SEAMLESS_ADDON_PLUGIN_URL . 'assets/images/placeholder-image.png',
            'start_date' => date('Y-m-d 15:00:00'),
            'end_date' => date('Y-m-d 17:00:00'),
            'formatted_start_date' => date('Y-m-d 15:00:00'),
            'formatted_end_date' => date('Y-m-d 17:00:00'),
            'event_type' => 'event',
            'registration_url' => '#',
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
                ],
                [
                    'label' => 'VIP Pass',
                    'price' => '199.00',
                    'inventory' => 50,
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
            ],
            'additional_images' => [
                SEAMLESS_ADDON_PLUGIN_URL . 'assets/images/placeholder-image.png',
                SEAMLESS_ADDON_PLUGIN_URL . 'assets/images/placeholder-image.png',
                SEAMLESS_ADDON_PLUGIN_URL . 'assets/images/placeholder-image.png',
            ],
            'sponsors' => [
                SEAMLESS_ADDON_PLUGIN_URL . 'assets/images/placeholder-image.png',
                SEAMLESS_ADDON_PLUGIN_URL . 'assets/images/placeholder-image.png',
                SEAMLESS_ADDON_PLUGIN_URL . 'assets/images/placeholder-image.png',
            ],
        ];
    }

    /**
     * Extract event slug from URL.
     *
     * @param string $url URL to parse.
     * @return string|null Event slug or null.
     */
    private function extract_event_slug_from_url($url)
    {
        $events_endpoint = get_option('seamless_single_event_endpoint', 'event');

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
     * Always auto-detects from context.
     *
     * @param array $settings Tag settings.
     * @return array|null Event data or null.
     */
    protected function get_event($settings = [])
    {
        return $this->get_event_by_context();
    }

    /**
     * Get event group.
     * All event tags belong to the seamless-events group.
     *
     * @return string
     */
    public function get_group()
    {
        return 'seamless-events';
    }
}
