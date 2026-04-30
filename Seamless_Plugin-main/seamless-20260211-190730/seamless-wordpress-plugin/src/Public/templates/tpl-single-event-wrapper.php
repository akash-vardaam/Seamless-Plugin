<?php get_header(); ?>

<div class="seamless-single-event-container">
	<?php
	$event_slug = get_query_var('event_uuid');
	$event_type = get_query_var('event_type') ?: 'event';

	echo do_shortcode('[seamless_single_event slug="' . esc_attr($event_slug) . '" type="' . esc_attr($event_type) . '"]');
	?>
</div>

<?php get_footer(); ?>
