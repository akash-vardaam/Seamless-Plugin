<?php

namespace SeamlessAddon\Integrations\Elementor\Widgets;

use SeamlessAddon\Integrations\Elementor\Widgets\Base\BaseWidget;
use Elementor\Controls_Manager;

/**
 * Event Additional Details Widget
 * 
 * Displays event additional details in accordion layout.
 */
class EventAdditionalDetailsWidget extends BaseWidget
{
    /**
     * Get widget name.
     */
    public function get_name()
    {
        return 'seamless-event-additional-details';
    }

    /**
     * Get widget title.
     */
    public function get_title()
    {
        return __('Event Additional Details', 'seamless-addon');
    }

    /**
     * Get widget icon.
     */
    public function get_icon()
    {
        return 'eicon-accordion';
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

        $this->add_accordion_style_controls();

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

        $additional_details = $event['additional_details'] ?? [];

        if (empty($additional_details)) {
            if (\Elementor\Plugin::$instance->editor->is_edit_mode()) {
                echo '<p>' . __('No additional details available for this event.', 'seamless-addon') . '</p>';
            }
            return;
        }

?>
        <div class="accordion-item-container">
            <?php foreach ($additional_details as $detail) : ?>
                <div class="accordion-item">
                    <button class="accordion-header">
                        <i class="fa fa-chevron-down"></i>
                        <?php echo esc_html($detail['name']); ?>
                    </button>
                    <div class="accordion-body">
                        <div class="additional-detail-value">
                            <?php echo wp_kses_post($detail['value']); ?>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
<?php
    }
}
