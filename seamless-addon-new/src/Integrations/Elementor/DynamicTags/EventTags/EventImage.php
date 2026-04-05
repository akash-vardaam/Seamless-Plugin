<?php

namespace SeamlessAddon\Integrations\Elementor\DynamicTags\EventTags;

use Elementor\Controls_Manager;

class EventImage extends BaseEventDataTag
{
    public function get_name()
    {
        return 'seamless-event-image';
    }

    public function get_title()
    {
        return __('Event Featured Image', 'seamless-addon');
    }

    public function get_categories()
    {
        return [\Elementor\Modules\DynamicTags\Module::IMAGE_CATEGORY];
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
                'label' => __('Fallback Image', 'seamless-addon'),
                'type' => Controls_Manager::MEDIA,
            ]
        );
    }

    public function get_value(array $options = [])
    {
        $settings = $this->get_settings();
        $event = $this->get_event($settings);

        if ($event && !empty($event['image_url'])) {
            return [
                'id' => '',
                'url' => esc_url($event['image_url']),
            ];
        } elseif ($event && !empty($event['featured_image'])) {
            return [
                'id' => '',
                'url' => esc_url($event['featured_image']),
            ];
        } elseif (!empty($settings['fallback']['url'])) {
            return [
                'id' => $settings['fallback']['id'] ?? '',
                'url' => esc_url($settings['fallback']['url']),
            ];
        }

        return [
            'id' => '',
            'url' => '',
        ];
    }
}
