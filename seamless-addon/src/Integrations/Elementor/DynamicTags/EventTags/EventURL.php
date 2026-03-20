<?php

namespace SeamlessAddon\Integrations\Elementor\DynamicTags\EventTags;

use Elementor\Controls_Manager;

class EventURL extends BaseEventTag
{
    public function get_name()
    {
        return 'seamless-event-url';
    }

    public function get_title()
    {
        return __('Event URL', 'seamless-addon');
    }

    public function get_categories()
    {
        return [\Elementor\Modules\DynamicTags\Module::URL_CATEGORY];
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
    }

    public function render()
    {
        $settings = $this->get_settings();
        $event = $this->get_event($settings);

        if (!$event || empty($event['slug'])) {
            return;
        }

        $event_url = site_url('/event/' . $event['slug']);
        echo esc_url($event_url);
    }
}
