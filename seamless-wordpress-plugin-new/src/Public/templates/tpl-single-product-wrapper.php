<?php get_header();
$product_slug = get_query_var('product_slug');
?>

<?php echo do_shortcode('[seamless_single_product slug="' . esc_attr($product_slug) . '"]'); ?>

<?php get_footer(); ?>
