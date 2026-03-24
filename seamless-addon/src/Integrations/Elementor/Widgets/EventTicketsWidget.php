<?php

namespace SeamlessAddon\Integrations\Elementor\Widgets;

use SeamlessAddon\Integrations\Elementor\Widgets\Base\BaseWidget;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Border;
use Elementor\Group_Control_Background;

/**
 * Event Tickets Widget
 * 
 * Displays event ticket information with register CTA.
 */
class EventTicketsWidget extends BaseWidget
{
    /**
     * Get widget name.
     */
    public function get_name()
    {
        return 'seamless-event-tickets';
    }

    /**
     * Get widget title.
     */
    public function get_title()
    {
        return __('Event Tickets', 'seamless-addon');
    }

    /**
     * Get widget icon.
     */
    public function get_icon()
    {
        return 'eicon-price-table';
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
            'section_title',
            [
                'label' => __('Section Title', 'seamless-addon'),
                'type' => Controls_Manager::TEXT,
                'default' => 'Tickets',
                'description' => __('Title for the tickets section', 'seamless-addon'),
            ]
        );

        $this->add_control(
            'register_button_text',
            [
                'label' => __('Register Button Text', 'seamless-addon'),
                'type' => Controls_Manager::TEXT,
                'default' => 'Register Now',
            ]
        );

        $this->end_controls_section();

        // Card Style Section
        $this->start_controls_section(
            'card_style_section',
            [
                'label' => __('Content Style', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name' => 'card_background',
                'types' => ['classic', 'gradient'],
                'selector' => '{{WRAPPER}} .event-info-card',
            ]
        );

        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name' => 'card_border',
                'selector' => '{{WRAPPER}} .event-info-card',
            ]
        );

        $this->add_responsive_control(
            'card_border_radius',
            [
                'label' => __('Border Radius', 'seamless-addon'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .event-info-card' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'card_padding',
            [
                'label' => __('Padding', 'seamless-addon'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .event-info-card' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Title Style Section
        $this->start_controls_section(
            'title_style_section',
            [
                'label' => __('Title Style', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'title_typography',
                'selector' => '{{WRAPPER}} .ticket-label',
            ]
        );

        $this->add_control(
            'title_color',
            [
                'label' => __('Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .ticket-label' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'title_margin',
            [
                'label' => __('Margin', 'seamless-addon'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .ticket-label' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'title_padding',
            [
                'label' => __('Padding', 'seamless-addon'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .ticket-label' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Ticket Item Style Section
        $this->start_controls_section(
            'ticket_style_section',
            [
                'label' => __('Ticket Item Style', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'ticket_title_typography',
                'label' => __('Ticket Title Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .ticket-title',
            ]
        );

        $this->add_control(
            'ticket_title_color',
            [
                'label' => __('Ticket Title Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .ticket-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'ticket_price_typography',
                'label' => __('Price Typography', 'seamless-addon'),
                'selector' => '{{WRAPPER}} .ticket-price',
            ]
        );

        $this->add_control(
            'ticket_price_color',
            [
                'label' => __('Price Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .ticket-price' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'ticket_item_spacing',
            [
                'label' => __('Item Spacing', 'seamless-addon'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', 'em'],
                'selectors' => [
                    '{{WRAPPER}} .ticket-item' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'ticket_item_padding',
            [
                'label' => __('Item Padding', 'seamless-addon'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .ticket-item' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Button Style Section (Register Button)
        $this->start_controls_section(
            'button_style_section',
            [
                'label' => __('Register Button Style', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'button_typography',
                'selector' => '{{WRAPPER}} .event-register-btn',
            ]
        );

        $this->add_control(
            'button_color',
            [
                'label' => __('Text Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-register-btn' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_bg',
            [
                'label' => __('Background Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-register-btn' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_hover_color',
            [
                'label' => __('Hover Text Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-register-btn:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_hover_bg',
            [
                'label' => __('Hover Background', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-register-btn:hover' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name' => 'button_border',
                'selector' => '{{WRAPPER}} .event-register-btn',
            ]
        );

        $this->add_responsive_control(
            'button_border_radius',
            [
                'label' => __('Border Radius', 'seamless-addon'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .event-register-btn' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'button_padding',
            [
                'label' => __('Padding', 'seamless-addon'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em'],
                'selectors' => [
                    '{{WRAPPER}} .event-register-btn' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'button_width',
            [
                'label' => __('Button Width', 'seamless-addon'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', '%', 'em', 'vw'],
                'range' => [
                    '%' => [
                        'min' => 10,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .event-register-btn' => 'width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'button_margin',
            [
                'label' => __('Button Margin', 'seamless-addon'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .event-register-btn' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Button Style Section (Past / Other Buttons)
        $this->start_controls_section(
            'status_button_style_section',
            [
                'label' => __('Other Button Style', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'status_button_typography',
                'selector' => '{{WRAPPER}} .event-past-btn, {{WRAPPER}} .event-coming-soon-btn',
            ]
        );

        $this->add_control(
            'status_button_color',
            [
                'label' => __('Text Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-past-btn, {{WRAPPER}} .event-coming-soon-btn' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'status_button_bg',
            [
                'label' => __('Background Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-past-btn, {{WRAPPER}} .event-coming-soon-btn' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'status_button_hover_color',
            [
                'label' => __('Hover Text Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-past-btn:hover, {{WRAPPER}} .event-coming-soon-btn:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'status_button_hover_bg',
            [
                'label' => __('Hover Background', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-past-btn:hover, {{WRAPPER}} .event-coming-soon-btn:hover' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name' => 'status_button_border',
                'selector' => '{{WRAPPER}} .event-past-btn, {{WRAPPER}} .event-coming-soon-btn',
            ]
        );

        $this->add_responsive_control(
            'status_button_border_radius',
            [
                'label' => __('Border Radius', 'seamless-addon'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .event-past-btn, {{WRAPPER}} .event-coming-soon-btn' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'status_button_padding',
            [
                'label' => __('Padding', 'seamless-addon'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em'],
                'selectors' => [
                    '{{WRAPPER}} .event-past-btn, {{WRAPPER}} .event-coming-soon-btn' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'status_button_width',
            [
                'label' => __('Button Width', 'seamless-addon'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', '%', 'em', 'vw'],
                'range' => [
                    '%' => [
                        'min' => 10,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .event-past-btn, {{WRAPPER}} .event-coming-soon-btn' => 'width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'status_button_margin',
            [
                'label' => __('Button Margin', 'seamless-addon'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .event-past-btn, {{WRAPPER}} .event-coming-soon-btn' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Message Style Section
        $this->start_controls_section(
            'message_style_section',
            [
                'label' => __('Message Style', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'message_typography',
                'selector' => '{{WRAPPER}} .event-registration-message',
            ]
        );

        $this->add_control(
            'message_color',
            [
                'label' => __('Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .event-registration-message' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'message_alignment',
            [
                'label' => __('Message Alignment', 'seamless-addon'),
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
                    '{{WRAPPER}} .event-registration-message' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'message_margin',
            [
                'label' => __('Message Margin', 'seamless-addon'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .event-registration-message' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
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

        $section_title = !empty($settings['section_title']) ? $settings['section_title'] : 'Tickets';
        $register_button_text = !empty($settings['register_button_text']) ? $settings['register_button_text'] : 'Register Now';

        // Get registration status
        $register_url = $event['registration_url'] ?? '';
        $event_type = $event['event_type'] ?? 'event';

        // Collect tickets from associated events for group events
        $tickets = [];
        if ($event_type === 'group_event' && !empty($event['associated_events'])) {
            foreach ($event['associated_events'] as $associated_event) {
                if (!empty($associated_event['tickets'])) {
                    foreach ($associated_event['tickets'] as $ticket) {
                        $tickets[] = $ticket;
                    }
                }
            }
        } else {
            $tickets = $event['tickets'] ?? [];
        }

        $has_tickets = !empty($tickets);

        // Construct registration URL for group events if missing and tickets exist
        if ($event_type === 'group_event' && empty($register_url) && $has_tickets) {
            $client_domain = get_option('seamless_client_domain', '');
            $slug = $event['slug'] ?? '';
            if ($client_domain && $slug) {
                // Use singular /event/ as requested
                $register_url = rtrim($client_domain, '/') . '/events/' . $slug . '/register';
            }
        }

        // Calculate total capacity
        $total_capacity = 0;
        if ($has_tickets) {
            foreach ($tickets as $ticket) {
                $total_capacity += intval($ticket['inventory'] ?? 0);
            }
        }

        // Check if event is past
        $is_past_event = false;
        $end_date = $event['end_date'] ?? '';
        if ($end_date) {
            $event_end = new \DateTime($end_date);
            $today = new \DateTime();
            $today->setTime(0, 0, 0);
            $is_past_event = $event_end < $today;
        }

        // Registration window logic
        $registration_start_raw = $event['registration_start_date'] ?? null;
        $registration_end_raw = $event['registration_end_date'] ?? null;

        if ((!$registration_start_raw || !$registration_end_raw) && !empty($tickets)) {
            $earliest_start = null;
            $latest_end = null;

            foreach ($tickets as $ticket) {
                $ticket_start = $ticket['registration_start_date'] ?? null;
                $ticket_end = $ticket['registration_end_date'] ?? null;

                if ($ticket_start) {
                    $ts = strtotime($ticket_start);
                    if ($ts !== false && ($earliest_start === null || $ts < $earliest_start)) {
                        $earliest_start = $ts;
                    }
                }

                if ($ticket_end) {
                    $te = strtotime($ticket_end);
                    if ($te !== false && ($latest_end === null || $te > $latest_end)) {
                        $latest_end = $te;
                    }
                }
            }

            if (!$registration_start_raw && $earliest_start !== null) {
                $registration_start_raw = date('Y-m-d H:i:s', $earliest_start);
            }
            if (!$registration_end_raw && $latest_end !== null) {
                $registration_end_raw = date('Y-m-d H:i:s', $latest_end);
            }
        }

        $registration_start_dt = null;
        $registration_end_dt = null;

        if ($registration_start_raw) {
            try {
                $registration_start_dt = new \DateTime($registration_start_raw);
            } catch (\Exception $e) {
                $registration_start_dt = null;
            }
        }

        if ($registration_end_raw) {
            try {
                $registration_end_dt = new \DateTime($registration_end_raw);
            } catch (\Exception $e) {
                $registration_end_dt = null;
            }
        }

        $now_dt = new \DateTime();
        $is_before_registration = $registration_start_dt ? ($now_dt < $registration_start_dt) : false;
        $is_after_registration = $registration_end_dt ? ($now_dt > $registration_end_dt) : false;

        // Check if tickets are sold out (capacity is 0 but registration is still open)
        $is_sold_out = ($has_tickets && $total_capacity === 0 && !$is_before_registration && !$is_after_registration);

        $registration_message = '';
        $registration_ends_text = '';

        if ($is_before_registration && $registration_start_dt && $registration_end_dt) {
            $registration_message = sprintf(
                'Registration starts on %s and ends on %s.',
                $registration_start_dt->format('M j, Y \a\t g:i A'),
                $registration_end_dt->format('M j, Y \a\t g:i A')
            );
        } elseif ($is_before_registration && $registration_start_dt) {
            $registration_message = sprintf(
                'Registration starts on %s.',
                $registration_start_dt->format('M j, Y \a\t g:i A')
            );
        } elseif ($is_after_registration && $registration_end_dt) {
            $registration_message = sprintf(
                'Registration closed at %s on %s.',
                $registration_end_dt->format('g:i A'),
                $registration_end_dt->format('m/d/y')
            );
        } elseif (!$is_before_registration && !$is_after_registration && $registration_end_dt) {
            $registration_ends_text = sprintf(
                'Registration ends on %s.',
                $registration_end_dt->format('M j, Y g:i A')
            );
        }

?>
        <div class="event-info-card">
            <div class="event-tickets-section">
                <h3 class="ticket-label"><?php echo esc_html($section_title); ?></h3>
                <?php if (!empty($tickets)) : ?>
                    <?php foreach ($tickets as $ticket) : ?>
                        <div class="ticket-item">
                            <div class="ticket-title"><?php echo esc_html($ticket['label']); ?></div>
                            <div class="ticket-details">
                                <span class="ticket-price">
                                    <?php
                                    $price = $ticket['price'];
                                    echo (is_numeric($price) && floatval($price) == 0) ? 'Free' : '$' . esc_html($price);
                                    ?>
                                </span>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php else : ?>
                    <div class="ticket-item">
                        <div class="ticket-title">No tickets available</div>
                    </div>
                <?php endif; ?>
            </div>

            <?php if ($is_past_event): ?>
                <button class="event-past-btn" type="button" disabled>
                    Event has passed!
                </button>
            <?php elseif ($registration_message && $is_before_registration): ?>
                <div class="event-registration-message">
                    <?php echo esc_html($registration_message); ?>
                </div>
            <?php elseif ($registration_message && $is_after_registration): ?>
                <div class="event-registration-message">
                    <?php echo esc_html($registration_message); ?>
                </div>
            <?php elseif (!$has_tickets): ?>
                <button class="event-coming-soon-btn">
                    Event ticket coming soon
                </button>
            <?php elseif ($is_sold_out): ?>
                <button class="event-past-btn" disabled>
                    Tickets Sold Out
                </button>
            <?php elseif ($register_url): ?>
                <?php if (!empty($registration_ends_text)): ?>
                    <div class="event-registration-message">
                        <?php echo esc_html($registration_ends_text); ?>
                    </div>
                <?php endif; ?>
                <a href="<?php echo esc_url($register_url); ?>" class="event-register-btn" target="_blank" rel="noopener">
                    <?php echo esc_html($register_button_text); ?>
                </a>
            <?php else: ?>
                <button class="event-register-btn">
                    Registration unavailable
                </button>
            <?php endif; ?>
        </div>
<?php
    }
}
