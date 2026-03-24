<?php

/**
 * React endpoint template for Seamless plugin routes.
 */

get_header();

$seamless_page = get_query_var('seamless_page');
$shortcode = '';

if ($seamless_page === 'single_event') {
    $event_slug = get_query_var('event_uuid');
    $event_type = isset($_GET['type']) ? sanitize_text_field(wp_unslash($_GET['type'])) : 'event';
    $shortcode = sprintf(
        '[seamless_react_single_event slug="%s" type="%s"]',
        esc_attr((string) $event_slug),
        esc_attr((string) $event_type)
    );
} elseif ($seamless_page === 'seamless-event-list') {
    $shortcode = '[seamless_events_list]';
} elseif ($seamless_page === 'ams_content') {
    $shortcode = '[seamless_events_list]';
}
?>

<div class="seamless-react-endpoint-template">
    <?php echo do_shortcode($shortcode); ?>
</div>

<?php get_footer();
