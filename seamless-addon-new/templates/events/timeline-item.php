<?php

/**
 * Template: Event Timeline Item
 * 
 * @var array $event Event data
 */

if (!defined('ABSPATH')) {
    exit;
}

use SeamlessAddon\Helpers\Helper;
?>

<div class="seamless-item seamless-timeline-item">
    <div class="seamless-timeline-date">
        <?php if (!empty($event['event_date']) || !empty($event['date'])): ?>
            <?php
            $date = strtotime($event['event_date'] ?? $event['date']);
            ?>
            <div class="seamless-timeline-month"><?php echo date_i18n('M', $date); ?></div>
            <div class="seamless-timeline-day"><?php echo date_i18n('j', $date); ?></div>
        <?php endif; ?>
    </div>

    <div class="seamless-timeline-connector">
        <div class="seamless-timeline-dot"></div>
        <div class="seamless-timeline-line"></div>
    </div>

    <div class="seamless-timeline-content">
        <div class="seamless-item-content">
            <h3 class="seamless-item-title">
                <?php echo esc_html($event['title'] ?? ''); ?>
            </h3>

            <?php if (!empty($event['time'])): ?>
                <div class="seamless-item-time">
                    <span class="seamless-icon dashicons dashicons-clock"></span>
                    <?php echo esc_html($event['time']); ?>
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
                    <?php echo esc_html(Helper::truncate(wp_strip_all_tags($event['description']), 200)); ?>
                </div>
            <?php endif; ?>

            <?php if (!empty($event['slug'])): ?>
                <a href="<?php echo esc_url(home_url('/events/' . $event['slug'])); ?>"
                    class="seamless-btn-link">
                    <?php _e('View Event', 'seamless-addon'); ?> →
                </a>
            <?php endif; ?>
        </div>
    </div>
</div>