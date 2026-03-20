<?php

/**
 * Template: Event Grid Item
 * 
 * @var array $event Event data
 */

if (!defined('ABSPATH')) {
    exit;
}

use SeamlessAddon\Helpers\Helper;
?>

<div class="seamless-item seamless-event-item">
    <?php if (!empty($event['image_url']) || !empty($event['featured_image'])): ?>
        <div class="seamless-item-image">
            <img src="<?php echo esc_url($event['image_url'] ?? $event['featured_image']); ?>"
                alt="<?php echo esc_attr($event['title'] ?? ''); ?>">
        </div>
    <?php endif; ?>

    <div class="seamless-item-content">
        <h3 class="seamless-item-title">
            <?php echo esc_html($event['title'] ?? ''); ?>
        </h3>

        <?php if (!empty($event['event_date']) || !empty($event['date'])): ?>
            <div class="seamless-item-date">
                <span class="seamless-icon dashicons dashicons-calendar"></span>
                <?php echo esc_html(Helper::format_event_date($event['event_date'] ?? $event['date'])); ?>
            </div>
        <?php endif; ?>

        <?php if (!empty($event['location'])): ?>
            <div class="seamless-item-location">
                <span class="seamless-icon dashicons dashicons-location"></span>
                <?php echo esc_html($event['location']); ?>
            </div>
        <?php endif; ?>

        <?php if (!empty($event['description'])): ?>
            <div class="seamless-item-excerpt">
                <?php echo esc_html(Helper::truncate(wp_strip_all_tags($event['description']), 150)); ?>
            </div>
        <?php endif; ?>

        <?php if (!empty($event['slug'])): ?>
            <div class="seamless-item-footer">
                <a href="<?php echo esc_url(home_url('/events/' . $event['slug'])); ?>"
                    class="seamless-btn">
                    <?php _e('View Event', 'seamless-addon'); ?>
                </a>
            </div>
        <?php endif; ?>
    </div>
</div>