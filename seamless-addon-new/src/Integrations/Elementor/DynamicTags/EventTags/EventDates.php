<?php

namespace SeamlessAddon\Integrations\Elementor\DynamicTags\EventTags;

use Elementor\Controls_Manager;

class EventDates extends BaseEventTag
{
    public function get_name()
    {
        return 'seamless-event-dates';
    }

    public function get_title()
    {
        return __('Event Dates', 'seamless-addon');
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

        $this->add_control(
            'date_type',
            [
                'label' => __('Date Type', 'seamless-addon'),
                'type' => Controls_Manager::SELECT,
                'options' => [
                    'range' => __('Date Range', 'seamless-addon'),
                    'start' => __('Start Date Only', 'seamless-addon'),
                    'end' => __('End Date Only', 'seamless-addon'),
                ],
                'default' => 'range',
            ]
        );

        $this->add_control(
            'date_format',
            [
                'label' => __('Date Format', 'seamless-addon'),
                'type' => Controls_Manager::SELECT,
                'options' => [
                    'F j, Y' => __('January 1, 2024', 'seamless-addon'),
                    'M j, Y' => __('Jan 1, 2024', 'seamless-addon'),
                    'Y-m-d' => __('2024-01-01', 'seamless-addon'),
                    'd/m/Y' => __('01/01/2024', 'seamless-addon'),
                    'm/d/Y' => __('01/01/2024 (US)', 'seamless-addon'),
                    'custom' => __('Custom', 'seamless-addon'),
                ],
                'default' => 'M j, Y',
            ]
        );

        $this->add_control(
            'custom_format',
            [
                'label' => __('Custom Format', 'seamless-addon'),
                'type' => Controls_Manager::TEXT,
                'default' => 'F j, Y',
                'condition' => ['date_format' => 'custom'],
            ]
        );

        $this->add_control(
            'show_time',
            [
                'label' => __('Show Time', 'seamless-addon'),
                'type' => Controls_Manager::SWITCHER,
                'default' => '',
            ]
        );
    }

    public function render()
    {
        $settings = $this->get_settings();
        $event = $this->get_event($settings);

        if (!$event) {
            return;
        }

        $format = $settings['date_format'] === 'custom'
            ? $settings['custom_format']
            : $settings['date_format'];

        if ($settings['show_time'] === 'yes') {
            $format .= ' g:i A';
        }

        $start_date = $event['formatted_start_date'] ?? $event['start_date'] ?? '';
        $end_date = $event['formatted_end_date'] ?? $event['end_date'] ?? '';

        // Get WordPress timezone for proper date parsing
        $timezone_obj = function_exists('wp_timezone') ? wp_timezone() : new \DateTimeZone(wp_timezone_string());

        $output = '';

        if ($settings['date_type'] === 'start' && $start_date) {
            try {
                $dt = new \DateTime($start_date, $timezone_obj);
                $output = $dt->format($format);
            } catch (\Exception $e) {
                $output = $start_date;
            }
        } elseif ($settings['date_type'] === 'end' && $end_date) {
            try {
                $dt = new \DateTime($end_date, $timezone_obj);
                $output = $dt->format($format);
            } catch (\Exception $e) {
                $output = $end_date;
            }
        } elseif ($settings['date_type'] === 'range') {
            if ($start_date && $end_date) {
                try {
                    $start_dt = new \DateTime($start_date, $timezone_obj);
                    $end_dt = new \DateTime($end_date, $timezone_obj);
                    $output = $start_dt->format($format) . ' - ' . $end_dt->format($format);
                } catch (\Exception $e) {
                    $output = $start_date . ' - ' . $end_date;
                }
            } elseif ($start_date) {
                try {
                    $dt = new \DateTime($start_date, $timezone_obj);
                    $output = $dt->format($format);
                } catch (\Exception $e) {
                    $output = $start_date;
                }
            }
        }

        echo esc_html($output);
    }
}
