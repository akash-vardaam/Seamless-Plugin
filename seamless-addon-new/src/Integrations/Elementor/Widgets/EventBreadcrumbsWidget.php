<?php

namespace SeamlessAddon\Integrations\Elementor\Widgets;

use SeamlessAddon\Integrations\Elementor\Widgets\Base\BaseWidget;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use function esc_html;
use function esc_url;
use function site_url;

/**
 * Event Breadcrumbs Widget
 * 
 * Displays breadcrumb navigation trail for events.
 */
class EventBreadcrumbsWidget extends BaseWidget
{
    /**
     * Get widget name.
     */
    public function get_name()
    {
        return 'seamless-event-breadcrumbs';
    }

    /**
     * Get widget title.
     */
    public function get_title()
    {
        return __('Event Breadcrumbs', 'seamless-addon');
    }

    /**
     * Get widget icon.
     */
    public function get_icon()
    {
        return 'eicon-navigation-horizontal';
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
            'separator',
            [
                'label' => __('Separator', 'seamless-addon'),
                'type' => Controls_Manager::TEXT,
                'default' => '»',
                'description' => __('Separator between breadcrumb items', 'seamless-addon'),
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
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-breadcrumbs' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'typography',
                'selector' => '{{WRAPPER}} .seamless-breadcrumbs',
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'link_typography',
                'label' => __('Link Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .seamless-breadcrumbs a',
            ]
        );

        $this->add_control(
            'link_color',
            [
                'label' => __('Link Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-breadcrumbs a' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'link_hover_color',
            [
                'label' => __('Link Hover Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-breadcrumbs a:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'current_color',
            [
                'label' => __('Current Page Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-breadcrumbs .current' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'separator_color',
            [
                'label' => __('Separator Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-breadcrumb-separator' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'separator_spacing',
            [
                'label' => __('Separator Horizontal Spacing', 'seamless-addon'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-breadcrumb-separator' => 'margin: 0 {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'spacing',
            [
                'label' => __('Separator Vertical Spacing', 'seamless-addon'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-breadcrumbs' => 'margin-bottom: {{SIZE}}{{UNIT}};',
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

        $separator = !empty($settings['separator']) ? $settings['separator'] : '»';
        $events_page_url = site_url('/' . get_option('seamless_event_list_endpoint', 'events') . '/');
        $title = esc_html($event['title']);

?>
        <div class="seamless-breadcrumbs-container">
            <div class="seamless-breadcrumbs">
                <a href="<?php echo esc_url(site_url()); ?>">Home</a>
                <span class="seamless-breadcrumb-separator"><?php echo esc_html($separator); ?></span>
                <a href="<?php echo esc_url($events_page_url); ?>">Events</a>
                <span class="seamless-breadcrumb-separator"><?php echo esc_html($separator); ?></span>
                <span class="current"><?php echo $title; ?></span>
            </div>
        </div>
<?php
    }
}
