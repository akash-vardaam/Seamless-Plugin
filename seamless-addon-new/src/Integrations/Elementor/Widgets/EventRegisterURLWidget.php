<?php

namespace SeamlessAddon\Integrations\Elementor\Widgets;

use SeamlessAddon\Integrations\Elementor\Widgets\Base\BaseWidget;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;

/**
 * Event Register URL Widget
 *
 * Outputs the event registration URL as text or link.
 */
class EventRegisterURLWidget extends BaseWidget
{
    /**
     * Get widget name.
     */
    public function get_name()
    {
        return 'seamless-event-register-url';
    }

    /**
     * Get widget title.
     */
    public function get_title()
    {
        return __('Event Register URL', 'seamless-addon');
    }

    /**
     * Get widget icon.
     */
    public function get_icon()
    {
        return 'eicon-link';
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
            'display_mode',
            [
                'label' => __('Display As', 'seamless-addon'),
                'type' => Controls_Manager::SELECT,
                'default' => 'link',
                'options' => [
                    'link' => __('Link', 'seamless-addon'),
                    'url'  => __('Plain URL', 'seamless-addon'),
                ],
            ]
        );

        $this->add_control(
            'link_text',
            [
                'label' => __('Link Text', 'seamless-addon'),
                'type' => Controls_Manager::TEXT,
                'default' => __('Register Now', 'seamless-addon'),
                'condition' => [
                    'display_mode' => 'link',
                ],
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
                'selector' => '{{WRAPPER}} .seamless-event-register-link, {{WRAPPER}} .seamless-event-register-url',
            ]
        );

        $this->add_control(
            'link_color',
            [
                'label' => __('Link Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-register-link' => 'color: {{VALUE}};',
                ],
                'condition' => [
                    'display_mode' => 'link',
                ],
            ]
        );

        $this->add_control(
            'link_hover_color',
            [
                'label' => __('Link Hover Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-register-link:hover' => 'color: {{VALUE}};',
                ],
                'condition' => [
                    'display_mode' => 'link',
                ],
            ]
        );

        $this->add_control(
            'background_color',
            [
                'label' => __('Background Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-register-link, {{WRAPPER}} .seamless-event-register-url' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'background_hover_color',
            [
                'label' => __('Hover Background Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-register-link:hover' => 'background-color: {{VALUE}};',
                ],
                'condition' => [
                    'display_mode' => 'link',
                ],
            ]
        );

        $this->add_responsive_control(
            'width',
            [
                'label' => __('Width', 'seamless-addon'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', '%', 'em', 'vw'],
                'range' => [
                    '%' => [
                        'min' => 1,
                        'max' => 100,
                    ],
                    'px' => [
                        'min' => 1,
                        'max' => 1000,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-register-link, {{WRAPPER}} .seamless-event-register-url' => 'display: inline-block; width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'padding',
            [
                'label' => __('Padding', 'seamless-addon'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-register-link, {{WRAPPER}} .seamless-event-register-url' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'margin',
            [
                'label' => __('Margin', 'seamless-addon'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-register-link, {{WRAPPER}} .seamless-event-register-url' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
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

        $register_url = $event['registration_url'] ?? '';
        if (empty($register_url)) {
            if (\Elementor\Plugin::$instance->editor->is_edit_mode()) {
                echo '<p>' . __('This event has no registration URL.', 'seamless-addon') . '</p>';
            }
            return;
        }

        $display_mode = $settings['display_mode'];

        if ($display_mode === 'url') {
            echo '<span class="seamless-event-register-url">' . esc_url($register_url) . '</span>';
            return;
        }

        $text = !empty($settings['link_text']) ? $settings['link_text'] : __('Register Now', 'seamless-addon');
?>
        <a href="<?php echo esc_url($register_url); ?>" class="seamless-event-register-link" target="_blank" rel="noopener">
            <?php echo esc_html($text); ?>
        </a>
<?php
    }
}
