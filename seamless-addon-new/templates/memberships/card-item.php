<?php

/**
 * Template: Membership Card Item
 * 
 * @var array $membership Membership data
 */

if (!defined('ABSPATH')) {
    exit;
}

use SeamlessAddon\Helpers\Helper;
?>

<div class="seamless-item seamless-membership-card">
    <?php if (!empty($membership['image_url']) || !empty($membership['featured_image'])): ?>
        <div class="seamless-membership-image">
            <img src="<?php echo esc_url($membership['image_url'] ?? $membership['featured_image']); ?>"
                alt="<?php echo esc_attr($membership['name'] ?? $membership['title'] ?? ''); ?>">
        </div>
    <?php endif; ?>

    <div class="seamless-membership-content">
        <h3 class="seamless-item-title">
            <?php echo esc_html($membership['name'] ?? $membership['title'] ?? ''); ?>
        </h3>

        <?php if (!empty($membership['description'])): ?>
            <div class="seamless-item-content">
                <?php echo esc_html(Helper::truncate(wp_strip_all_tags($membership['description']), 120)); ?>
            </div>
        <?php endif; ?>

        <?php if (!empty($membership['price'])): ?>
            <div class="seamless-membership-price">
                <?php echo esc_html($membership['price']); ?>
            </div>
        <?php endif; ?>

        <?php if (!empty($membership['id'])): ?>
            <div class="seamless-membership-footer">
                <a href="<?php echo esc_url(home_url('/memberships/' . $membership['id'])); ?>"
                    class="seamless-btn">
                    <?php _e('Learn More', 'seamless-addon'); ?>
                </a>
            </div>
        <?php endif; ?>
    </div>
</div>