<?php

namespace SeamlessAddon\Helpers;

/**
 * Helper Class
 * 
 * Utility functions for the plugin.
 */
class Helper
{
    /**
     * Log message to debug.log if WP_DEBUG is enabled.
     *
     * @param string $message Message to log.
     * @param string $context Context or function name.
     */
    public static function log($message, $context = '')
    {
        if (defined('WP_DEBUG') && WP_DEBUG === true) {
            $log_message = '[Seamless Addon]';

            if (!empty($context)) {
                $log_message .= ' [' . $context . ']';
            }

            $log_message .= ' ' . $message;

            error_log($log_message);
        }
    }

    /**
     * Format event date for display.
     *
     * @param string $date Date string.
     * @param string $format Date format.
     * @return string Formatted date.
     */
    public static function format_event_date($date, $format = 'F j, Y')
    {
        if (empty($date)) {
            return '';
        }

        $timestamp = strtotime($date);
        return date_i18n($format, $timestamp);
    }

    /**
     * Format event date range.
     *
     * @param string $start_date Start date.
     * @param string $end_date End date.
     * @return string Formatted date range.
     */
    public static function format_event_date_range($start_date, $end_date)
    {
        if (empty($start_date)) {
            return '';
        }

        $start = strtotime($start_date);
        $end = !empty($end_date) ? strtotime($end_date) : $start;

        // Same day
        if (date('Y-m-d', $start) === date('Y-m-d', $end)) {
            return date_i18n('F j, Y', $start);
        }

        // Same month and year
        if (date('Y-m', $start) === date('Y-m', $end)) {
            return date_i18n('F j', $start) . ' - ' . date_i18n('j, Y', $end);
        }

        // Same year
        if (date('Y', $start) === date('Y', $end)) {
            return date_i18n('F j', $start) . ' - ' . date_i18n('F j, Y', $end);
        }

        // Different years
        return date_i18n('F j, Y', $start) . ' - ' . date_i18n('F j, Y', $end);
    }

    /**
     * Truncate text to specified length.
     *
     * @param string $text Text to truncate.
     * @param int $length Maximum length.
     * @param string $suffix Suffix to append.
     * @return string Truncated text.
     */
    public static function truncate($text, $length = 150, $suffix = '...')
    {
        if (empty($text) || strlen($text) <= $length) {
            return $text;
        }

        return substr($text, 0, $length) . $suffix;
    }

    /**
     * Sanitize layout value.
     *
     * @param string $layout Layout value to sanitize.
     * @param array $allowed Allowed layouts.
     * @param string $default Default layout.
     * @return string Sanitized layout.
     */
    public static function sanitize_layout($layout, $allowed = [], $default = 'grid')
    {
        if (empty($allowed)) {
            return $default;
        }

        return in_array($layout, $allowed, true) ? $layout : $default;
    }

    /**
     * Get template part.
     *
     * @param string $slug Template slug.
     * @param string $name Template name.
     * @param array $args Arguments to pass to template.
     */
    public static function get_template_part($slug, $name = null, $args = [])
    {
        $templates = [];
        $name = (string) $name;

        if ('' !== $name) {
            $templates[] = "{$slug}-{$name}.php";
        }

        $templates[] = "{$slug}.php";

        // Allow theme override
        $located = locate_template($templates, false);

        if (!$located) {
            foreach ($templates as $template) {
                $file = SEAMLESS_ADDON_PLUGIN_DIR . 'templates/' . $template;
                if (file_exists($file)) {
                    $located = $file;
                    break;
                }
            }
        }

        if ($located && is_array($args) && !empty($args)) {
            extract($args, EXTR_SKIP);
        }

        if ($located) {
            include $located;
        }
    }
}
