<?php

namespace SeamlessAddon\Integrations\Elementor\Widgets;

use SeamlessAddon\Integrations\Elementor\Widgets\Base\BaseWidget;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Border;

/**
 * Event Schedules Widget
 * 
 * Displays event schedules in accordion with table layout.
 */
class EventSchedulesWidget extends BaseWidget
{
    /**
     * Get widget name.
     */
    public function get_name()
    {
        return 'seamless-event-schedules';
    }

    /**
     * Get widget title.
     */
    public function get_title()
    {
        return __('Event Schedules', 'seamless-addon');
    }

    /**
     * Get widget icon.
     */
    public function get_icon()
    {
        return 'eicon-table';
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
            'accordion_title',
            [
                'label' => __('Accordion Title', 'seamless-addon'),
                'type' => Controls_Manager::TEXT,
                'default' => 'Schedule',
                'description' => __('Title for the accordion header', 'seamless-addon'),
            ]
        );

        $this->end_controls_section();

        // Accordion Style Section
        $this->start_controls_section(
            'accordion_style_section',
            [
                'label' => __('Accordion Style', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_accordion_style_controls();

        $this->end_controls_section();

        // Table Style Section
        $this->start_controls_section(
            'table_style_section',
            [
                'label' => __('Table Style', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'table_header_heading',
            [
                'label' => __('Table Header', 'seamless-addon'),
                'type' => Controls_Manager::HEADING,
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'table_header_typography',
                'selector' => '{{WRAPPER}} .event-schedule-table thead th',
            ]
        );

        $this->add_control(
            'table_header_color',
            [
                'label' => __('Text Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-schedule-table thead th' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'table_header_bg',
            [
                'label' => __('Background Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-schedule-table thead th' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'table_body_heading',
            [
                'label' => __('Table Body', 'seamless-addon'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'table_body_typography',
                'selector' => '{{WRAPPER}} .event-schedule-table tbody td',
            ]
        );

        $this->add_control(
            'table_body_color',
            [
                'label' => __('Text Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-schedule-table tbody td' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'table_row_bg',
            [
                'label' => __('Row Background', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-schedule-table tbody tr' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'table_row_alternate_bg',
            [
                'label' => __('Alternate Row Background', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-schedule-table tbody tr:nth-child(even)' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name' => 'table_border',
                'selector' => '{{WRAPPER}} .event-schedule-table, {{WRAPPER}} .event-schedule-table th, {{WRAPPER}} .event-schedule-table td',
            ]
        );

        $this->add_responsive_control(
            'table_cell_padding',
            [
                'label' => __('Cell Padding', 'seamless-addon'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em'],
                'selectors' => [
                    '{{WRAPPER}} .event-schedule-table th, {{WRAPPER}} .event-schedule-table td' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
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

        $event_type = $event['event_type'] ?? 'event';

        // Collect schedules from associated events for group events
        $schedules = [];
        if ($event_type === 'group_event' && !empty($event['associated_events'])) {
            foreach ($event['associated_events'] as $associated_event) {
                if (!empty($associated_event['schedules'])) {
                    foreach ($associated_event['schedules'] as $schedule) {
                        $schedules[] = $schedule;
                    }
                }
            }
            // Sort schedules by start date
            usort($schedules, function ($a, $b) {
                return strtotime($a['start_date_display']) - strtotime($b['start_date_display']);
            });
        } else {
            $schedules = $event['schedules'] ?? [];
        }

        if (empty($schedules)) {
            if (\Elementor\Plugin::$instance->editor->is_edit_mode()) {
                echo '<p>' . __('No schedules available for this event.', 'seamless-addon') . '</p>';
            }
            return;
        }

        $accordion_title = !empty($settings['accordion_title']) ? $settings['accordion_title'] : 'Schedule';

?>
        <div class="accordion-item-container">
            <div class="accordion-item">
                <button class="accordion-header">
                    <i class="fa fa-chevron-down"></i>
                    <?php echo esc_html($accordion_title); ?>
                </button>
                <div class="accordion-body">
                    <table class="event-schedule-table">
                        <thead>
                            <tr>
                                <th><?php echo $event_type === 'group_event' ? 'Date & Time' : 'Time'; ?></th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($schedules as $schedule) : ?>
                                <tr>
                                    <td>
                                        <?php if ($event_type === 'group_event') : ?>
                                            <?php echo esc_html(date('M j, Y', strtotime($schedule['start_date_display']))); ?><br>
                                            <strong>
                                                <?php
                                                $start_time = date('g:i A', strtotime($schedule['start_date_display']));
                                                $end_time = !empty($schedule['end_date_display']) ? date('g:i A', strtotime($schedule['end_date_display'])) : '';
                                                echo esc_html($start_time . ($end_time ? ' - ' . $end_time : ''));
                                                ?>
                                            </strong>
                                        <?php else : ?>
                                            <strong>
                                                <?php
                                                $start_time = date('g:i A', strtotime($schedule['start_date_display']));
                                                $end_time = !empty($schedule['end_date_display']) ? date('g:i A', strtotime($schedule['end_date_display'])) : '';
                                                echo esc_html($start_time . ($end_time ? ' - ' . $end_time : ''));
                                                ?>
                                            </strong>
                                        <?php endif; ?>
                                    </td>
                                    <td><?php echo wp_kses_post($schedule['description']); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <script type="text/javascript">
            (function() {
                function initAccordion() {
                    const accordionHeaders = document.querySelectorAll(".accordion-header");

                    accordionHeaders.forEach(header => {
                        const newHeader = header.cloneNode(true);
                        header.parentNode.replaceChild(newHeader, header);

                        newHeader.addEventListener("click", function(e) {
                            e.preventDefault();
                            const item = this.parentElement;
                            item.classList.toggle("active");
                        });
                    });
                }

                if (document.readyState === "loading") {
                    document.addEventListener("DOMContentLoaded", initAccordion);
                } else {
                    initAccordion();
                }
            })();
        </script>
<?php
    }
}
