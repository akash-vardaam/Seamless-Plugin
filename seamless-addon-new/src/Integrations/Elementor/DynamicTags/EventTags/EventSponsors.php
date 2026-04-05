<?php

namespace SeamlessAddon\Integrations\Elementor\DynamicTags\EventTags;

use Elementor\Core\DynamicTags\Data_Tag;
use Elementor\Controls_Manager;

class EventSponsors extends BaseEventDataTag
{
    public function get_name()
    {
        return 'seamless-event-sponsors';
    }

    public function get_title()
    {
        return __('Event Sponsors', 'seamless-addon');
    }

    public function get_categories()
    {
        return [\Elementor\Modules\DynamicTags\Module::GALLERY_CATEGORY];
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

        $this->add_control(
            'fallback',
            [
                'label' => __('Fallback Images', 'seamless-addon'),
                'type' => Controls_Manager::GALLERY,
                'description' => __('These images will be displayed if the event has no sponsors.', 'seamless-addon'),
            ]
        );
    }

    public function get_value(array $options = [])
    {
        $settings = $this->get_settings();
        $event = $this->get_event($settings);

        // Try to get event sponsors first
        if ($event && !empty($event['sponsors']) && is_array($event['sponsors'])) {
            $gallery = [];
            foreach ($event['sponsors'] as $sponsor_url) {
                if (!empty($sponsor_url)) {
                    $gallery[] = [
                        'id' => 0,  // Use 0 instead of empty string for better compatibility
                        'url' => esc_url($sponsor_url),
                    ];
                }
            }

            // Return gallery if we have images
            if (!empty($gallery)) {
                return $gallery;
            }
        }

        // If no event sponsors, use fallback
        if (!empty($settings['fallback'])) {
            return $settings['fallback'];
        }

        // Return empty array if nothing found
        return [];
    }
}
