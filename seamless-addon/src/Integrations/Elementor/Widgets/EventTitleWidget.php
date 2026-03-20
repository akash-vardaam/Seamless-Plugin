<?php

namespace SeamlessAddon\Integrations\Elementor\Widgets;

use SeamlessAddon\Integrations\Elementor\Widgets\Base\BaseWidget;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use function esc_html;
use function esc_url;
use function site_url;

/**
 * Event Title Widget
 * 
 * Displays event title with optional link and customizable HTML tag.
 */
class EventTitleWidget extends BaseWidget
{
    /**
     * Get widget name.
     */
    public function get_name()
    {
        return 'seamless-event-title';
    }

    /**
     * Get widget title.
     */
    public function get_title()
    {
        return __('Event Title', 'seamless-addon');
    }

    /**
     * Get widget icon.
     */
    public function get_icon()
    {
        return 'eicon-post-title';
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

        $this->add_html_tag_control('html_tag', 'h2');

        $this->add_control(
            'link_to_event',
            [
                'label' => __('Link to Event', 'seamless-addon'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'seamless-addon'),
                'label_off' => __('No', 'seamless-addon'),
                'default' => '',
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
                    '{{WRAPPER}} .seamless-event-title' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'typography',
                'selector' => '{{WRAPPER}} .seamless-event-title',
            ]
        );

        $this->add_control(
            'title_color',
            [
                'label' => __('Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'link_heading',
            [
                'label' => __('Link', 'seamless-addon'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
                'condition' => [
                    'link_to_event' => 'yes',
                ],
            ]
        );

        $this->add_link_controls('link', '.seamless-event-title a');

        $this->add_responsive_control(
            'title_spacing',
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
                    '{{WRAPPER}} .seamless-event-title' => 'margin-bottom: {{SIZE}}{{UNIT}};',
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

        if (!$event || empty($event['title'])) {
            return;
        }

        $title = esc_html($event['title']);
        $tag = $settings['html_tag'];
        $link_to_event = $settings['link_to_event'] === 'yes';

        echo '<' . $tag . ' class="seamless-event-title">';

        if ($link_to_event && !empty($event['slug'])) {
            $event_url = site_url('/event/' . $event['slug']);
            echo '<a href="' . esc_url($event_url) . '">' . $title . '</a>';
        } else {
            echo $title;
        }

        echo '</' . $tag . '>';
    }
}
