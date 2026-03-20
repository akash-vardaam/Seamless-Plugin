<?php

/**
 * Template: Event Calendar View
 * 
 * @var array $events Events array
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="seamless-calendar-view">
    <p class="seamless-info"><?php _e('Calendar view implementation coming soon. For now, displaying events in list format.', 'seamless-addon'); ?></p>

    <?php foreach ($events as $event): ?>
        <?php include 'grid-item.php'; ?>
    <?php endforeach; ?>
</div>