<?php

namespace SeamlessAddon\Integrations\Elementor\DynamicTags\EventTags;

use Elementor\Controls_Manager;
use function wp_kses_post;

/**
 * Event Excerpt Dynamic Tag
 */
class EventExcerpt extends BaseEventTag
{
    public function get_name()
    {
        return 'seamless-event-excerpt';
    }

    public function get_title()
    {
        return __('Event Excerpt', 'seamless-addon');
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
    }

    public function render()
    {
        $settings = $this->get_settings();
        $event = $this->get_event($settings);

        // Handle both field names: except_description (regular events) and excerpt_description (group events)
        $excerpt = $event['excerpt_description'] ?? $event['except_description'] ?? '';

        if (!$event || empty($excerpt)) {
            return;
        }

        echo wp_kses_post($excerpt);
    }
}
