<?php

/**
 * Template loaded by Endpoints::handle_redirect() for custom URL routes.
 * Renders the correct shortcode for the requested Seamless page.
 */

get_header();

$page = (string) get_query_var( 'seamless_react_page' );
$shortcode = '';

switch ( $page ) {
	case 'single-event':
		$slug = sanitize_text_field( (string) get_query_var( 'seamless_react_slug' ) );
		$type = sanitize_text_field( wp_unslash( (string) ( $_GET['type'] ?? 'event' ) ) );
		$shortcode = sprintf( '[seamless_react_single_event slug="%s" type="%s"]', esc_attr( $slug ), esc_attr( $type ) );
		break;

	case 'event-list':
		$shortcode = '[seamless_react_events_list]';
		break;

	case 'ams-content':
		$shortcode = '[seamless_react_events_list]';
		break;
}

?>
<div class="seamless-react-endpoint-wrapper">
	<?php echo do_shortcode( $shortcode ); ?>
</div>
<?php get_footer();
