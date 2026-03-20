<?php

/**
 * User Dashboard Widget Template (Shell)
 * 
 * Variables available:
 * @var array $settings Widget settings
 * @var string $widget_id Widget ID
 */

if (!defined('ABSPATH')) {
  exit;
}

$show_membership = $settings['show_membership_tab'] === 'yes';
$show_orders = $settings['show_orders_tab'] === 'yes';
$show_courses = $settings['show_courses_tab'] === 'yes';
$show_profile = $settings['show_profile_tab'] === 'yes';
$show_organization = isset($settings['show_organization_tab']) ? $settings['show_organization_tab'] === 'yes' : true;

// Get current user basic info for the sidebar card (fast, no API call needed if possible)
$current_user = wp_get_current_user();
$pf_name = $current_user->first_name . ' ' . $current_user->last_name;
$pf_email = $current_user->user_email;

?>

<div class="seamless-user-dashboard" data-widget-id="<?php echo esc_attr($widget_id); ?>">
  <aside class="seamless-user-dashboard-sidebar">
    <div class="seamless-user-dashboard-profile-card">
      <div class="seamless-user-dashboard-profile-name"><?php echo esc_html($pf_name); ?></div>
      <div class="seamless-user-dashboard-profile-email">Email: <?php echo esc_html($pf_email); ?></div>
    </div>

    <nav class="seamless-user-dashboard-nav">
      <?php if ($show_profile): ?>
        <button class="seamless-user-dashboard-nav-item active" data-view="profile">
          <span><?php _e('Profile', 'seamless-addon'); ?></span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      <?php endif; ?>
      <?php if ($show_membership): ?>
        <button class="seamless-user-dashboard-nav-item" data-view="memberships">
          <span><?php _e('Memberships', 'seamless-addon'); ?></span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      <?php endif; ?>

      <?php if ($show_organization): ?>
        <button class="seamless-user-dashboard-nav-item" data-view="organization">
          <span><?php _e('Organizations', 'seamless-addon'); ?></span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      <?php endif; ?>

      <?php if ($show_courses): ?>
        <button class="seamless-user-dashboard-nav-item" data-view="courses">
          <span><?php _e('Courses', 'seamless-addon'); ?></span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      <?php endif; ?>

      <?php if ($show_orders): ?>
        <button class="seamless-user-dashboard-nav-item" data-view="orders">
          <span><?php _e('Orders', 'seamless-addon'); ?></span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      <?php endif; ?>

      <?php if (function_exists('wp_logout_url')): ?>
        <a href="<?php echo esc_url(wp_logout_url(get_permalink())); ?>" class="seamless-user-dashboard-nav-item seamless-user-dashboard-nav-logout">
          <span><?php _e('Logout', 'seamless-addon'); ?></span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </a>
      <?php endif; ?>
    </nav>
  </aside>

  <!-- Main Content -->
  <main class="seamless-user-dashboard-main">

    <!-- Profile View -->
    <?php if ($show_profile): ?>
      <div class="seamless-user-dashboard-view active" data-view="profile">
        <div id="seamless-dashboard-profile-container" class="seamless-dashboard-content-container">
          <div class="seamless-dashboard-loader">
            <div class="seamless-plugin-loader">
              <?php $lid_profile = substr(md5(uniqid('slp', true)), 0, 6); ?>
              <svg xmlns="http://www.w3.org/2000/svg" class="sync-wheel-svg" viewBox="62 64 282 282" aria-hidden="true">
                <defs>
                  <linearGradient id="swg1-<?php echo $lid_profile; ?>" x1="135.2" y1="221.8" x2="271.3" y2="221.8" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#0fd" />
                    <stop offset=".2" stop-color="#2ac9e4" />
                    <stop offset=".4" stop-color="#6383ed" />
                    <stop offset=".6" stop-color="#904bf5" />
                    <stop offset=".8" stop-color="#b022fa" />
                    <stop offset=".9" stop-color="#c40afd" />
                    <stop offset="1" stop-color="#cc01ff" />
                  </linearGradient>
                  <linearGradient id="swg2-<?php echo $lid_profile; ?>" x1="62.7" y1="214.6" x2="343.9" y2="214.6" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#0fd" />
                    <stop offset=".2" stop-color="#2ac9e4" />
                    <stop offset=".4" stop-color="#6383ed" />
                    <stop offset=".6" stop-color="#904bf5" />
                    <stop offset=".8" stop-color="#b022fa" />
                    <stop offset=".9" stop-color="#c40afd" />
                    <stop offset="1" stop-color="#cc01ff" />
                  </linearGradient>
                  <linearGradient id="swg3-<?php echo $lid_profile; ?>" x1="99.4" y1="214.7" x2="314.3" y2="214.7" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#0fd" />
                    <stop offset=".2" stop-color="#2ac9e4" />
                    <stop offset=".4" stop-color="#6383ed" />
                    <stop offset=".6" stop-color="#904bf5" />
                    <stop offset=".8" stop-color="#b022fa" />
                    <stop offset=".9" stop-color="#c40afd" />
                    <stop offset="1" stop-color="#cc01ff" />
                  </linearGradient>
                </defs>
                <g class="sl-ring-outer">
                  <path fill="url(#swg2-<?php echo $lid_profile; ?>)" d="M203,64.7c-77.5.2-140.5,63.4-140.3,140.9,0,34.4,12.6,65.9,33.2,90.3-1.6,3.2-2.6,6.8-2.6,10.6,0,12.6,10.3,22.9,23,22.9s9.6-1.6,13.3-4.3c21.5,13.3,46.9,21,74,20.9,77.5-.2,140.5-63.4,140.3-140.9-.2-77.5-63.4-140.5-140.9-140.3h0ZM116.3,316c-5.2,0-9.5-4.2-9.5-9.5s4.2-9.5,9.5-9.5,9.5,4.2,9.5,9.5-4.2,9.5-9.5,9.5ZM203.6,332.5c-24.1,0-46.6-6.6-65.8-18.2.9-2.5,1.4-5.1,1.4-7.9,0-12.6-10.3-22.9-23-22.9s-7.7,1-10.9,2.8c-18.2-21.9-29.1-50-29.2-80.7-.2-70.1,56.8-127.3,126.9-127.5s127.3,56.8,127.5,126.9-56.8,127.3-126.9,127.5Z" />
                </g>
                <g class="sl-ring-mid">
                  <path fill="url(#swg3-<?php echo $lid_profile; ?>)" d="M305.1,226.9c1.5-7,2.3-14.2,2.3-21.6,0-57.4-46.7-104-104-104s-104,46.7-104,104,46.7,104,104,104,64.3-16.4,83.3-41.7c1.5.3,3.1.5,4.7.5,12.6,0,22.9-10.3,22.9-22.9s-3.6-14.1-9.2-18.3h0ZM203.3,296c-50,0-90.6-40.7-90.6-90.6s40.7-90.6,90.6-90.6,90.6,40.7,90.6,90.6-.6,11.5-1.6,17h-1c-12.6,0-22.9,10.3-22.9,22.9s2.4,11.7,6.4,15.8c-16.6,21.2-42.4,34.9-71.4,34.9h0ZM291.4,254.7c-5.2,0-9.5-4.3-9.5-9.5s4.3-9.5,9.5-9.5,9.5,4.3,9.5,9.5-4.3,9.5-9.5,9.5Z" />
                </g>
                <g class="sl-ring-inner">
                  <path fill="url(#swg1-<?php echo $lid_profile; ?>)" d="M225.6,141.1c-2.2-10.4-11.5-18.2-22.5-18.1-11,0-20.2,7.9-22.4,18.3-26.5,9.4-45.5,34.7-45.5,64.3s30.7,68,68.2,67.9c37.5,0,68-30.7,67.9-68.2,0-29.7-19.2-54.9-45.8-64.1h0ZM203.2,136.3c5.2,0,9.5,4.2,9.5,9.5s-4.2,9.5-9.5,9.5-9.5-4.2-9.5-9.5,4.2-9.5,9.5-9.5ZM203.5,260c-30.1,0-54.7-24.4-54.8-54.5,0-22.7,13.8-42.2,33.5-50.5,3.5,8.1,11.7,13.8,21.1,13.8s17.5-5.7,21-13.9c19.7,8.2,33.7,27.7,33.7,50.3s-24.4,54.7-54.5,54.8Z" />
                </g>
              </svg>
            </div>
            <p><?php _e('Loading profile...', 'seamless-addon'); ?></p>
          </div>
        </div>
      </div>
    <?php endif; ?>

    <!-- Memberships View -->
    <?php if ($show_membership): ?>
      <div class="seamless-user-dashboard-view" data-view="memberships">
        <div id="seamless-dashboard-memberships-container" class="seamless-dashboard-content-container">
          <div class="seamless-dashboard-loader">
            <div class="seamless-plugin-loader">
              <?php $lid_mem = substr(md5(uniqid('slm', true)), 0, 6); ?>
              <svg xmlns="http://www.w3.org/2000/svg" class="sync-wheel-svg" viewBox="62 64 282 282" aria-hidden="true">
                <defs>
                  <linearGradient id="swg1-<?php echo $lid_mem; ?>" x1="135.2" y1="221.8" x2="271.3" y2="221.8" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#0fd" />
                    <stop offset=".2" stop-color="#2ac9e4" />
                    <stop offset=".4" stop-color="#6383ed" />
                    <stop offset=".6" stop-color="#904bf5" />
                    <stop offset=".8" stop-color="#b022fa" />
                    <stop offset=".9" stop-color="#c40afd" />
                    <stop offset="1" stop-color="#cc01ff" />
                  </linearGradient>
                  <linearGradient id="swg2-<?php echo $lid_mem; ?>" x1="62.7" y1="214.6" x2="343.9" y2="214.6" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#0fd" />
                    <stop offset=".2" stop-color="#2ac9e4" />
                    <stop offset=".4" stop-color="#6383ed" />
                    <stop offset=".6" stop-color="#904bf5" />
                    <stop offset=".8" stop-color="#b022fa" />
                    <stop offset=".9" stop-color="#c40afd" />
                    <stop offset="1" stop-color="#cc01ff" />
                  </linearGradient>
                  <linearGradient id="swg3-<?php echo $lid_mem; ?>" x1="99.4" y1="214.7" x2="314.3" y2="214.7" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#0fd" />
                    <stop offset=".2" stop-color="#2ac9e4" />
                    <stop offset=".4" stop-color="#6383ed" />
                    <stop offset=".6" stop-color="#904bf5" />
                    <stop offset=".8" stop-color="#b022fa" />
                    <stop offset=".9" stop-color="#c40afd" />
                    <stop offset="1" stop-color="#cc01ff" />
                  </linearGradient>
                </defs>
                <g class="sl-ring-outer">
                  <path fill="url(#swg2-<?php echo $lid_mem; ?>)" d="M203,64.7c-77.5.2-140.5,63.4-140.3,140.9,0,34.4,12.6,65.9,33.2,90.3-1.6,3.2-2.6,6.8-2.6,10.6,0,12.6,10.3,22.9,23,22.9s9.6-1.6,13.3-4.3c21.5,13.3,46.9,21,74,20.9,77.5-.2,140.5-63.4,140.3-140.9-.2-77.5-63.4-140.5-140.9-140.3h0ZM116.3,316c-5.2,0-9.5-4.2-9.5-9.5s4.2-9.5,9.5-9.5,9.5,4.2,9.5,9.5-4.2,9.5-9.5,9.5ZM203.6,332.5c-24.1,0-46.6-6.6-65.8-18.2.9-2.5,1.4-5.1,1.4-7.9,0-12.6-10.3-22.9-23-22.9s-7.7,1-10.9,2.8c-18.2-21.9-29.1-50-29.2-80.7-.2-70.1,56.8-127.3,126.9-127.5s127.3,56.8,127.5,126.9-56.8,127.3-126.9,127.5Z" />
                </g>
                <g class="sl-ring-mid">
                  <path fill="url(#swg3-<?php echo $lid_mem; ?>)" d="M305.1,226.9c1.5-7,2.3-14.2,2.3-21.6,0-57.4-46.7-104-104-104s-104,46.7-104,104,46.7,104,104,104,64.3-16.4,83.3-41.7c1.5.3,3.1.5,4.7.5,12.6,0,22.9-10.3,22.9-22.9s-3.6-14.1-9.2-18.3h0ZM203.3,296c-50,0-90.6-40.7-90.6-90.6s40.7-90.6,90.6-90.6,90.6,40.7,90.6,90.6-.6,11.5-1.6,17h-1c-12.6,0-22.9,10.3-22.9,22.9s2.4,11.7,6.4,15.8c-16.6,21.2-42.4,34.9-71.4,34.9h0ZM291.4,254.7c-5.2,0-9.5-4.3-9.5-9.5s4.3-9.5,9.5-9.5,9.5,4.3,9.5,9.5-4.3,9.5-9.5,9.5Z" />
                </g>
                <g class="sl-ring-inner">
                  <path fill="url(#swg1-<?php echo $lid_mem; ?>)" d="M225.6,141.1c-2.2-10.4-11.5-18.2-22.5-18.1-11,0-20.2,7.9-22.4,18.3-26.5,9.4-45.5,34.7-45.5,64.3s30.7,68,68.2,67.9c37.5,0,68-30.7,67.9-68.2,0-29.7-19.2-54.9-45.8-64.1h0ZM203.2,136.3c5.2,0,9.5,4.2,9.5,9.5s-4.2,9.5-9.5,9.5-9.5-4.2-9.5-9.5,4.2-9.5,9.5-9.5ZM203.5,260c-30.1,0-54.7-24.4-54.8-54.5,0-22.7,13.8-42.2,33.5-50.5,3.5,8.1,11.7,13.8,21.1,13.8s17.5-5.7,21-13.9c19.7,8.2,33.7,27.7,33.7,50.3s-24.4,54.7-54.5,54.8Z" />
                </g>
              </svg>
            </div>
            <p><?php _e('Loading memberships...', 'seamless-addon'); ?></p>
          </div>
        </div>
      </div>
    <?php endif; ?>

    <!-- Courses View -->
    <?php if ($show_courses): ?>
      <div class="seamless-user-dashboard-view" data-view="courses">
        <div id="seamless-dashboard-courses-container" class="seamless-dashboard-content-container">
          <div class="seamless-dashboard-loader">
            <div class="seamless-plugin-loader">
              <?php $lid_cor = substr(md5(uniqid('slc', true)), 0, 6); ?>
              <svg xmlns="http://www.w3.org/2000/svg" class="sync-wheel-svg" viewBox="62 64 282 282" aria-hidden="true">
                <defs>
                  <linearGradient id="swg1-<?php echo $lid_cor; ?>" x1="135.2" y1="221.8" x2="271.3" y2="221.8" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#0fd" />
                    <stop offset=".2" stop-color="#2ac9e4" />
                    <stop offset=".4" stop-color="#6383ed" />
                    <stop offset=".6" stop-color="#904bf5" />
                    <stop offset=".8" stop-color="#b022fa" />
                    <stop offset=".9" stop-color="#c40afd" />
                    <stop offset="1" stop-color="#cc01ff" />
                  </linearGradient>
                  <linearGradient id="swg2-<?php echo $lid_cor; ?>" x1="62.7" y1="214.6" x2="343.9" y2="214.6" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#0fd" />
                    <stop offset=".2" stop-color="#2ac9e4" />
                    <stop offset=".4" stop-color="#6383ed" />
                    <stop offset=".6" stop-color="#904bf5" />
                    <stop offset=".8" stop-color="#b022fa" />
                    <stop offset=".9" stop-color="#c40afd" />
                    <stop offset="1" stop-color="#cc01ff" />
                  </linearGradient>
                  <linearGradient id="swg3-<?php echo $lid_cor; ?>" x1="99.4" y1="214.7" x2="314.3" y2="214.7" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#0fd" />
                    <stop offset=".2" stop-color="#2ac9e4" />
                    <stop offset=".4" stop-color="#6383ed" />
                    <stop offset=".6" stop-color="#904bf5" />
                    <stop offset=".8" stop-color="#b022fa" />
                    <stop offset=".9" stop-color="#c40afd" />
                    <stop offset="1" stop-color="#cc01ff" />
                  </linearGradient>
                </defs>
                <g class="sl-ring-outer">
                  <path fill="url(#swg2-<?php echo $lid_cor; ?>)" d="M203,64.7c-77.5.2-140.5,63.4-140.3,140.9,0,34.4,12.6,65.9,33.2,90.3-1.6,3.2-2.6,6.8-2.6,10.6,0,12.6,10.3,22.9,23,22.9s9.6-1.6,13.3-4.3c21.5,13.3,46.9,21,74,20.9,77.5-.2,140.5-63.4,140.3-140.9-.2-77.5-63.4-140.5-140.9-140.3h0ZM116.3,316c-5.2,0-9.5-4.2-9.5-9.5s4.2-9.5,9.5-9.5,9.5,4.2,9.5,9.5-4.2,9.5-9.5,9.5ZM203.6,332.5c-24.1,0-46.6-6.6-65.8-18.2.9-2.5,1.4-5.1,1.4-7.9,0-12.6-10.3-22.9-23-22.9s-7.7,1-10.9,2.8c-18.2-21.9-29.1-50-29.2-80.7-.2-70.1,56.8-127.3,126.9-127.5s127.3,56.8,127.5,126.9-56.8,127.3-126.9,127.5Z" />
                </g>
                <g class="sl-ring-mid">
                  <path fill="url(#swg3-<?php echo $lid_cor; ?>)" d="M305.1,226.9c1.5-7,2.3-14.2,2.3-21.6,0-57.4-46.7-104-104-104s-104,46.7-104,104,46.7,104,104,104,64.3-16.4,83.3-41.7c1.5.3,3.1.5,4.7.5,12.6,0,22.9-10.3,22.9-22.9s-3.6-14.1-9.2-18.3h0ZM203.3,296c-50,0-90.6-40.7-90.6-90.6s40.7-90.6,90.6-90.6,90.6,40.7,90.6,90.6-.6,11.5-1.6,17h-1c-12.6,0-22.9,10.3-22.9,22.9s2.4,11.7,6.4,15.8c-16.6,21.2-42.4,34.9-71.4,34.9h0ZM291.4,254.7c-5.2,0-9.5-4.3-9.5-9.5s4.3-9.5,9.5-9.5,9.5,4.3,9.5,9.5-4.3,9.5-9.5,9.5Z" />
                </g>
                <g class="sl-ring-inner">
                  <path fill="url(#swg1-<?php echo $lid_cor; ?>)" d="M225.6,141.1c-2.2-10.4-11.5-18.2-22.5-18.1-11,0-20.2,7.9-22.4,18.3-26.5,9.4-45.5,34.7-45.5,64.3s30.7,68,68.2,67.9c37.5,0,68-30.7,67.9-68.2,0-29.7-19.2-54.9-45.8-64.1h0ZM203.2,136.3c5.2,0,9.5,4.2,9.5,9.5s-4.2,9.5-9.5,9.5-9.5-4.2-9.5-9.5,4.2-9.5,9.5-9.5ZM203.5,260c-30.1,0-54.7-24.4-54.8-54.5,0-22.7,13.8-42.2,33.5-50.5,3.5,8.1,11.7,13.8,21.1,13.8s17.5-5.7,21-13.9c19.7,8.2,33.7,27.7,33.7,50.3s-24.4,54.7-54.5,54.8Z" />
                </g>
              </svg>
            </div>
            <p><?php _e('Loading courses...', 'seamless-addon'); ?></p>
          </div>
        </div>
      </div>
    <?php endif; ?>

    <!-- Orders View -->
    <?php if ($show_orders): ?>
      <div class="seamless-user-dashboard-view" data-view="orders">
        <div id="seamless-dashboard-orders-container" class="seamless-dashboard-content-container">
          <div class="seamless-dashboard-loader">
            <div class="seamless-plugin-loader">
              <?php $lid_ord = substr(md5(uniqid('slo', true)), 0, 6); ?>
              <svg xmlns="http://www.w3.org/2000/svg" class="sync-wheel-svg" viewBox="62 64 282 282" aria-hidden="true">
                <defs>
                  <linearGradient id="swg1-<?php echo $lid_ord; ?>" x1="135.2" y1="221.8" x2="271.3" y2="221.8" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#0fd" />
                    <stop offset=".2" stop-color="#2ac9e4" />
                    <stop offset=".4" stop-color="#6383ed" />
                    <stop offset=".6" stop-color="#904bf5" />
                    <stop offset=".8" stop-color="#b022fa" />
                    <stop offset=".9" stop-color="#c40afd" />
                    <stop offset="1" stop-color="#cc01ff" />
                  </linearGradient>
                  <linearGradient id="swg2-<?php echo $lid_ord; ?>" x1="62.7" y1="214.6" x2="343.9" y2="214.6" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#0fd" />
                    <stop offset=".2" stop-color="#2ac9e4" />
                    <stop offset=".4" stop-color="#6383ed" />
                    <stop offset=".6" stop-color="#904bf5" />
                    <stop offset=".8" stop-color="#b022fa" />
                    <stop offset=".9" stop-color="#c40afd" />
                    <stop offset="1" stop-color="#cc01ff" />
                  </linearGradient>
                  <linearGradient id="swg3-<?php echo $lid_ord; ?>" x1="99.4" y1="214.7" x2="314.3" y2="214.7" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#0fd" />
                    <stop offset=".2" stop-color="#2ac9e4" />
                    <stop offset=".4" stop-color="#6383ed" />
                    <stop offset=".6" stop-color="#904bf5" />
                    <stop offset=".8" stop-color="#b022fa" />
                    <stop offset=".9" stop-color="#c40afd" />
                    <stop offset="1" stop-color="#cc01ff" />
                  </linearGradient>
                </defs>
                <g class="sl-ring-outer">
                  <path fill="url(#swg2-<?php echo $lid_ord; ?>)" d="M203,64.7c-77.5.2-140.5,63.4-140.3,140.9,0,34.4,12.6,65.9,33.2,90.3-1.6,3.2-2.6,6.8-2.6,10.6,0,12.6,10.3,22.9,23,22.9s9.6-1.6,13.3-4.3c21.5,13.3,46.9,21,74,20.9,77.5-.2,140.5-63.4,140.3-140.9-.2-77.5-63.4-140.5-140.9-140.3h0ZM116.3,316c-5.2,0-9.5-4.2-9.5-9.5s4.2-9.5,9.5-9.5,9.5,4.2,9.5,9.5-4.2,9.5-9.5,9.5ZM203.6,332.5c-24.1,0-46.6-6.6-65.8-18.2.9-2.5,1.4-5.1,1.4-7.9,0-12.6-10.3-22.9-23-22.9s-7.7,1-10.9,2.8c-18.2-21.9-29.1-50-29.2-80.7-.2-70.1,56.8-127.3,126.9-127.5s127.3,56.8,127.5,126.9-56.8,127.3-126.9,127.5Z" />
                </g>
                <g class="sl-ring-mid">
                  <path fill="url(#swg3-<?php echo $lid_ord; ?>)" d="M305.1,226.9c1.5-7,2.3-14.2,2.3-21.6,0-57.4-46.7-104-104-104s-104,46.7-104,104,46.7,104,104,104,64.3-16.4,83.3-41.7c1.5.3,3.1.5,4.7.5,12.6,0,22.9-10.3,22.9-22.9s-3.6-14.1-9.2-18.3h0ZM203.3,296c-50,0-90.6-40.7-90.6-90.6s40.7-90.6,90.6-90.6,90.6,40.7,90.6,90.6-.6,11.5-1.6,17h-1c-12.6,0-22.9,10.3-22.9,22.9s2.4,11.7,6.4,15.8c-16.6,21.2-42.4,34.9-71.4,34.9h0ZM291.4,254.7c-5.2,0-9.5-4.3-9.5-9.5s4.3-9.5,9.5-9.5,9.5,4.3,9.5,9.5-4.3,9.5-9.5,9.5Z" />
                </g>
                <g class="sl-ring-inner">
                  <path fill="url(#swg1-<?php echo $lid_ord; ?>)" d="M225.6,141.1c-2.2-10.4-11.5-18.2-22.5-18.1-11,0-20.2,7.9-22.4,18.3-26.5,9.4-45.5,34.7-45.5,64.3s30.7,68,68.2,67.9c37.5,0,68-30.7,67.9-68.2,0-29.7-19.2-54.9-45.8-64.1h0ZM203.2,136.3c5.2,0,9.5,4.2,9.5,9.5s-4.2,9.5-9.5,9.5-9.5-4.2-9.5-9.5,4.2-9.5,9.5-9.5ZM203.5,260c-30.1,0-54.7-24.4-54.8-54.5,0-22.7,13.8-42.2,33.5-50.5,3.5,8.1,11.7,13.8,21.1,13.8s17.5-5.7,21-13.9c19.7,8.2,33.7,27.7,33.7,50.3s-24.4,54.7-54.5,54.8Z" />
                </g>
              </svg>
            </div>
            <p><?php _e('Loading orders...', 'seamless-addon'); ?></p>
          </div>
        </div>
      </div>
    <?php endif; ?>

    <!-- Organization View -->
    <?php if ($show_organization): ?>
      <div class="seamless-user-dashboard-view" data-view="organization">
        <div id="seamless-dashboard-organization-container" class="seamless-dashboard-content-container">
          <div class="seamless-dashboard-loader">
            <div class="seamless-plugin-loader">
              <?php $lid_ord = substr(md5(uniqid('slo', true)), 0, 6); ?>
              <svg xmlns="http://www.w3.org/2000/svg" class="sync-wheel-svg" viewBox="62 64 282 282" aria-hidden="true">
                <defs>
                  <linearGradient id="swg1-<?php echo $lid_ord; ?>" x1="135.2" y1="221.8" x2="271.3" y2="221.8" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#0fd" />
                    <stop offset=".2" stop-color="#2ac9e4" />
                    <stop offset=".4" stop-color="#6383ed" />
                    <stop offset=".6" stop-color="#904bf5" />
                    <stop offset=".8" stop-color="#b022fa" />
                    <stop offset=".9" stop-color="#c40afd" />
                    <stop offset="1" stop-color="#cc01ff" />
                  </linearGradient>
                  <linearGradient id="swg2-<?php echo $lid_ord; ?>" x1="62.7" y1="214.6" x2="343.9" y2="214.6" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#0fd" />
                    <stop offset=".2" stop-color="#2ac9e4" />
                    <stop offset=".4" stop-color="#6383ed" />
                    <stop offset=".6" stop-color="#904bf5" />
                    <stop offset=".8" stop-color="#b022fa" />
                    <stop offset=".9" stop-color="#c40afd" />
                    <stop offset="1" stop-color="#cc01ff" />
                  </linearGradient>
                  <linearGradient id="swg3-<?php echo $lid_ord; ?>" x1="99.4" y1="214.7" x2="314.3" y2="214.7" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#0fd" />
                    <stop offset=".2" stop-color="#2ac9e4" />
                    <stop offset=".4" stop-color="#6383ed" />
                    <stop offset=".6" stop-color="#904bf5" />
                    <stop offset=".8" stop-color="#b022fa" />
                    <stop offset=".9" stop-color="#c40afd" />
                    <stop offset="1" stop-color="#cc01ff" />
                  </linearGradient>
                </defs>
                <g class="sl-ring-outer">
                  <path fill="url(#swg2-<?php echo $lid_ord; ?>)" d="M203,64.7c-77.5.2-140.5,63.4-140.3,140.9,0,34.4,12.6,65.9,33.2,90.3-1.6,3.2-2.6,6.8-2.6,10.6,0,12.6,10.3,22.9,23,22.9s9.6-1.6,13.3-4.3c21.5,13.3,46.9,21,74,20.9,77.5-.2,140.5-63.4,140.3-140.9-.2-77.5-63.4-140.5-140.9-140.3h0ZM116.3,316c-5.2,0-9.5-4.2-9.5-9.5s4.2-9.5,9.5-9.5,9.5,4.2,9.5,9.5-4.2,9.5-9.5,9.5ZM203.6,332.5c-24.1,0-46.6-6.6-65.8-18.2.9-2.5,1.4-5.1,1.4-7.9,0-12.6-10.3-22.9-23-22.9s-7.7,1-10.9,2.8c-18.2-21.9-29.1-50-29.2-80.7-.2-70.1,56.8-127.3,126.9-127.5s127.3,56.8,127.5,126.9-56.8,127.3-126.9,127.5Z" />
                </g>
                <g class="sl-ring-mid">
                  <path fill="url(#swg3-<?php echo $lid_ord; ?>)" d="M305.1,226.9c1.5-7,2.3-14.2,2.3-21.6,0-57.4-46.7-104-104-104s-104,46.7-104,104,46.7,104,104,104,64.3-16.4,83.3-41.7c1.5.3,3.1.5,4.7.5,12.6,0,22.9-10.3,22.9-22.9s-3.6-14.1-9.2-18.3h0ZM203.3,296c-50,0-90.6-40.7-90.6-90.6s40.7-90.6,90.6-90.6,90.6,40.7,90.6,90.6-.6,11.5-1.6,17h-1c-12.6,0-22.9,10.3-22.9,22.9s2.4,11.7,6.4,15.8c-16.6,21.2-42.4,34.9-71.4,34.9h0ZM291.4,254.7c-5.2,0-9.5-4.3-9.5-9.5s4.3-9.5,9.5-9.5,9.5,4.3,9.5,9.5-4.3,9.5-9.5,9.5Z" />
                </g>
                <g class="sl-ring-inner">
                  <path fill="url(#swg1-<?php echo $lid_ord; ?>)" d="M225.6,141.1c-2.2-10.4-11.5-18.2-22.5-18.1-11,0-20.2,7.9-22.4,18.3-26.5,9.4-45.5,34.7-45.5,64.3s30.7,68,68.2,67.9c37.5,0,68-30.7,67.9-68.2,0-29.7-19.2-54.9-45.8-64.1h0ZM203.2,136.3c5.2,0,9.5,4.2,9.5,9.5s-4.2,9.5-9.5,9.5-9.5-4.2-9.5-9.5,4.2-9.5,9.5-9.5ZM203.5,260c-30.1,0-54.7-24.4-54.8-54.5,0-22.7,13.8-42.2,33.5-50.5,3.5,8.1,11.7,13.8,21.1,13.8s17.5-5.7,21-13.9c19.7,8.2,33.7,27.7,33.7,50.3s-24.4,54.7-54.5,54.8Z" />
                </g>
              </svg>
            </div>
            <p><?php _e('Loading organization...', 'seamless-addon'); ?></p>
          </div>
        </div>
      </div>
    <?php endif; ?>

  </main>
</div>

<script type="text/javascript">
  var seamlessUserDashboard = {
    ajaxUrl: '<?php echo esc_url(admin_url('admin-ajax.php')); ?>',
    upgradeNonce: '<?php echo wp_create_nonce('seamless_upgrade_membership'); ?>',
    downgradeNonce: '<?php echo wp_create_nonce('seamless_downgrade_membership'); ?>',
    cancelNonce: '<?php echo wp_create_nonce('seamless_cancel_membership'); ?>',
    renewNonce: '<?php echo wp_create_nonce('seamless_renew_membership'); ?>',
    cancelScheduledNonce: '<?php echo wp_create_nonce('seamless_cancel_scheduled_change'); ?>',
    profileNonce: '<?php echo wp_create_nonce('seamless_update_profile'); ?>',
    userEmail: '<?php echo esc_js($pf_email); ?>',
    ordersPerPage: <?php echo (int)($settings['orders_per_page'] ?? 6); ?>,
    memberships: {
      current: []
    },
    resendInviteNonce: '<?php echo wp_create_nonce('seamless_resend_invite'); ?>',
    addGroupMembersNonce: '<?php echo wp_create_nonce('seamless_add_group_members'); ?>',
    removeGroupMemberNonce: '<?php echo wp_create_nonce('seamless_remove_group_member'); ?>',
    changeRoleNonce: '<?php echo wp_create_nonce('seamless_change_member_role'); ?>'
  };
</script>
<script type="text/javascript">
  (function() {
    try {
      // Immediate tab restoration to prevent flash of wrong tab
      var widgetId = document.querySelector('.seamless-user-dashboard') ? document.querySelector('.seamless-user-dashboard').getAttribute('data-widget-id') : '';
      var activeView = sessionStorage.getItem('seamless-user-dashboard-active-view-' + widgetId);

      if (activeView) {
        // Remove defaults
        var defaultActiveNav = document.querySelectorAll('.seamless-user-dashboard-nav-item.active');
        for (var i = 0; i < defaultActiveNav.length; i++) {
          defaultActiveNav[i].classList.remove('active');
        }
        var defaultActiveView = document.querySelectorAll('.seamless-user-dashboard-view.active');
        for (var i = 0; i < defaultActiveView.length; i++) {
          defaultActiveView[i].classList.remove('active');
        }

        // Activate saved
        var targetNav = document.querySelector('.seamless-user-dashboard-nav-item[data-view="' + activeView + '"]');
        if (targetNav) targetNav.classList.add('active');

        var targetView = document.querySelector('.seamless-user-dashboard-view[data-view="' + activeView + '"]');
        if (targetView) targetView.classList.add('active');
      }
    } catch (e) {
      console.error('Tab restore error:', e);
    }
  })();
</script>

<style>
  /* Simple Loader Styles */
  .seamless-dashboard-loader {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #666;
  }
</style>