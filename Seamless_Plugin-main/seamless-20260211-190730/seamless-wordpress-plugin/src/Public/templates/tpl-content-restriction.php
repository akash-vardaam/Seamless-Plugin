<?php

/**
 * Modern Overlay Template for Restricted Content
 * 
 * This template is loaded through WordPress template hierarchy,
 * ensuring all theme styles and scripts are properly loaded.
 */

// Get restriction context from query vars
$is_logged_in = get_query_var('seamless_is_logged_in', false);
$custom_message = get_option('seamless_restriction_message', 'You must have an active membership to view this content.');
$purchase_url = get_option('seamless_membership_purchase_url', home_url('/memberships'));

if (empty($purchase_url)) {
    $purchase_url = get_option('seamless_sso_endpoint', home_url('/memberships'));
}
$purchase_url = set_url_scheme((string) $purchase_url, 'https');

// Load header with all theme styles
get_header();
?>

<style>
    .seamless-restriction-actions {
        width: 100%;
    }

    .seamless-restriction-actions .seamless-login-btn {
        display: inline-flex !important;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
        background: #0f172a !important;
        color: #ffffff !important;
        border: 1px solid #0f172a !important;
        border-radius: 14px !important;
        padding: 0.7rem 1rem !important;
        font-weight: 600;
        text-decoration: none !important;
        box-sizing: border-box;
        word-break: keep-all;
        overflow-wrap: normal;
        padding: 7px 40px !important;
    }

    .seamless-restriction-actions .seamless-login-btn:hover {
        transform: translateY(-2px);
    }
</style>

<div id="primary" class="content-area">
    <main id="main" class="site-main">
        <!-- Restriction Container -->
        <div class="seamless-restriction-container">
            <div class="seamless-restriction-modal">
                <div class="seamless-restriction-content" style="display: flex;flex-direction: column;justify-content: center;border: 1px solid #e5e7eb;background: #F9FAFB;padding: 40px 0px;text-align: center;border-radius: 8px;">
                    <div class="seamless-restriction-header" style="text-align: center;">
                        <div class="seamless-restriction-icon">
                            <?php if ($is_logged_in): ?>
                            <?php else: ?>
                            <?php endif; ?>
                        </div>
                        <h2 class="seamless-restriction-title">
                            <?php if ($is_logged_in): ?>
                                Upgraded Membership Required
                            <?php else: ?>
                                Access Restricted
                            <?php endif; ?>
                        </h2>
                        <p class="seamless-restriction-subtitle">
                            <?php if ($is_logged_in): ?>
                                Upgrade your membership to access this exclusive content
                            <?php else: ?>
                                Please sign in to access this premium content
                            <?php endif; ?>
                        </p>
                    </div>

                    <?php if ($is_logged_in): ?>
                        <div class="seamless-restriction-message">
                            <p><?php echo wp_kses_post($custom_message); ?></p>
                        </div>
                    <?php endif; ?>

                    <?php if ($is_logged_in): ?>
                        <!-- Membership upgrade section -->
                        <div class="seamless-restriction-plans">
                            <a href="<?php echo esc_url($purchase_url); ?>"
                                class="seamless-premium-btn seamless-upgrade-btn">
                                Upgrade Your Membership Now
                            </a>
                        </div>
                    <?php else: ?>
                        <!-- Login section -->
                        <div class="seamless-restriction-actions">
                            <?php
                            $sso_client_id = get_option('seamless_sso_client_id');
                            if (!empty($sso_client_id)):
                                echo do_shortcode('[seamless_login_button text="Sign In to Continue" class="seamless-premium-btn seamless-login-btn"]');
                            else:
                                $fallback_login_url = set_url_scheme(wp_login_url(get_permalink()), 'https');
                                ?>
                                <a href="<?php echo esc_url($fallback_login_url); ?>"
                                    class="seamless-premium-btn seamless-login-btn"
                                    style="width: 100%; display: block; background: #fafafa; border: 1px solid black; border-radius: 8px; padding: 5px 15px; text-align: center;">
                                    Sign In to Continue
                                </a>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>

                    <div class="seamless-restriction-info" style="margin-top: 20px;">
                        <p>
                            <?php if ($is_logged_in): ?>
                                Choose the plan that works best for you and unlock all premium features.
                            <?php else: ?>
                                New to our platform? You can create an account through the sign-in process.
                            <?php endif; ?>
                        </p>
                    </div>
                </div>

                <div class="seamless-restriction-decoration">
                    <div class="seamless-decoration-circle seamless-circle-1"></div>
                    <div class="seamless-decoration-circle seamless-circle-2"></div>
                    <div class="seamless-decoration-circle seamless-circle-3"></div>
                </div>
            </div>
        </div>
    </main>
</div>

<?php
get_footer();
