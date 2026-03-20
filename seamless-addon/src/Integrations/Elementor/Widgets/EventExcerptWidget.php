<?php

namespace SeamlessAddon\Integrations\Elementor\Widgets;

use SeamlessAddon\Integrations\Elementor\Widgets\Base\BaseWidget;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;

/**
 * Event Excerpt Widget
 * 
 * Displays event excerpt/short description.
 */
class EventExcerptWidget extends BaseWidget
{
    /**
     * Get widget name.
     */
    public function get_name()
    {
        return 'seamless-event-excerpt';
    }

    /**
     * Get widget title.
     */
    public function get_title()
    {
        return __('Event Excerpt', 'seamless-addon');
    }

    /**
     * Get widget icon.
     */
    public function get_icon()
    {
        return 'eicon-post-excerpt';
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

        $this->end_controls_section();

        // Style Section
        $this->start_controls_section(
            'style_section',
            [
                'label' => __('Style', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
            'align',
            [
                'label' => __('Alignment', 'seamless-addon'),
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
                    'justify' => [
                        'title' => __('Justified', 'seamless-addon'),
                        'icon' => 'eicon-text-align-justify',
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-excerpt' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'typography',
                'selector' => '{{WRAPPER}} .seamless-event-excerpt',
            ]
        );

        $this->add_control(
            'text_color',
            [
                'label' => __('Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-excerpt' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'spacing',
            [
                'label' => __('Spacing', 'seamless-addon'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-excerpt' => 'margin-bottom: {{SIZE}}{{UNIT}};',
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

        // Handle both field names: except_description (regular events) and excerpt_description (group events)
        $excerpt = $event['excerpt_description'] ?? $event['except_description'] ?? '';

        if (empty($excerpt)) {
            if (\Elementor\Plugin::$instance->editor->is_edit_mode()) {
                echo '<p>' . __('No excerpt available for this event.', 'seamless-addon') . '</p>';
            }
            return;
        }

        echo '<div class="seamless-event-excerpt">';
        echo wp_kses_post($excerpt);
        echo '</div>';
    }
}
