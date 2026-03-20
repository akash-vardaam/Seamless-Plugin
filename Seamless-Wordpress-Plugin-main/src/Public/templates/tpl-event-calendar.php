<?php

/**
 * Template for Calendar View
 * File: templates/tpl-calendar-event.php
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

$monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
$currentYear = (int)date('Y');
?>

<div class="seamless-calendar-container">
    <div class="calendar-header">
        <div class="calendar-title">
            <div class="date-info">
                <div class="month-abbr" id="currentMonth"><?php echo strtoupper(date('M')); ?></div>
                <div class="day-number" id="currentDay"><?php echo date('j'); ?></div>
            </div>
            <div>
                <div class="calendar-title-dropdowns" id="calendarTitleDropdowns">
                    <div class="cal-month-drop-wrap" id="calMonthDropWrap">
                        <button class="cal-month-trigger" id="calMonthTrigger" type="button"
                            aria-haspopup="listbox" aria-expanded="false" aria-controls="calMonthMenu">
                            <span id="calMonthLabel"><?php echo $monthNames[(int)date('n') - 1]; ?></span>
                            <svg class="cal-month-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                        <ul class="cal-month-menu" id="calMonthMenu" role="listbox" aria-label="Select month">
                            <?php
                            $currentMonth0 = (int)date('n') - 1;
                            foreach ($monthNames as $i => $name):
                            ?>
                                <li class="cal-month-item<?php echo ($i === $currentMonth0) ? ' active' : ''; ?>"
                                    data-month="<?php echo $i; ?>"
                                    role="option"
                                    aria-selected="<?php echo ($i === $currentMonth0) ? 'true' : 'false'; ?>">
                                    <span><?php echo $name; ?></span>
                                    <svg class="cal-month-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                    <div class="cal-year-spinner" id="calendarYearSpinner" aria-label="Year">
                        <button class="cys-btn" id="calYearDown" aria-label="Previous year">&#8744;</button>
                        <span class="cys-year" id="calendarYearLabel"><?php echo $currentYear; ?></span>
                        <button class="cys-btn" id="calYearUp" aria-label="Next year">&#8743;</button>
                    </div>
                </div>
                <div class="date-range" id="dateRange"><?php echo date('M j, Y') . ' — ' . date('M t, Y'); ?></div>
            </div>
        </div>

        <div class="calendar-controls">
            <div class="calendar-navigation">
                <button class="nav-button" id="prevBtn" title="Previous" aria-label="Previous">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="nav-button today-button" id="todayBtn"><?php esc_html_e('Today', 'seamless'); ?></button>
                <button class="nav-button" id="nextBtn" title="Next" aria-label="Next">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <div class="view-selector">
                <button class="view-button" data-view="month" title="Month View" aria-label="Month View"><svg width="25" height="25" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="8" y="12" width="48" height="44" rx="4"></rect>
                        <line x1="8" y1="22" x2="56" y2="22"></line>
                        <circle cx="18" cy="32" r="2"></circle>
                        <circle cx="32" cy="32" r="2"></circle>
                        <circle cx="46" cy="32" r="2"></circle>
                        <circle cx="18" cy="44" r="2"></circle>
                        <circle cx="32" cy="44" r="2"></circle>
                        <circle cx="46" cy="44" r="2"></circle>
                        <line x1="20" y1="8" x2="20" y2="16"></line>
                    </svg></button>
                <button class="view-button" data-view="week" title="Week View" aria-label="Week View"><svg width="25" height="25" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="8" y="12" width="48" height="44" rx="4" />
                        <line x1="8" y1="22" x2="56" y2="22" />
                        <line x1="16" y1="32" x2="48" y2="32" />
                        <line x1="16" y1="40" x2="48" y2="40" />
                        <line x1="16" y1="48" x2="40" y2="48" />
                        <line x1="20" y1="8" x2="20" y2="16" />
                        <line x1="44" y1="8" x2="44" y2="16" />
                    </svg>
                </button>
                <button class="view-button" data-view="day" title="Day View" aria-label="Day View"><svg width="25" height="25" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="8" y="12" width="48" height="44" rx="4" />
                        <line x1="8" y1="22" x2="56" y2="22" />
                        <text x="32" y="45" text-anchor="middle" font-size="14" font-family="Arial, sans-serif" fill="currentColor">DAY</text>
                        <line x1="20" y1="8" x2="20" y2="16" />
                        <line x1="44" y1="8" x2="44" y2="16" />
                    </svg>
                </button>
                <button class="view-button year-view" data-view="year" title="Year View" aria-label="Year View"><svg width="25" height="25" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="4" y="4" width="24" height="24" rx="3" />
                        <rect x="36" y="4" width="24" height="24" rx="3" />
                        <rect x="4" y="36" width="24" height="24" rx="3" />
                        <rect x="36" y="36" width="24" height="24" rx="3" />
                    </svg>
                </button>
                <button class="view-button display-list-btn" id="displayListBtn" title="Display List" aria-label="Toggle list view">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    <span>List</span>
                </button>
            </div>
        </div>
    </div>

    <div id="seamlessCalendar"></div>
    <div id="seamlessYearView" class="seamless-year-view" style="display:none;"></div>
    <div id="seamlessListView" class="seamless-list-view" style="display:none;"></div>
</div>
<script type="text/javascript">
    jQuery(document).ready(function($) {
        window.seamlessCalendar = new SeamlessCalendar({
            ajaxUrl: '<?php echo admin_url('admin-ajax.php'); ?>',
            nonce: '<?php echo wp_create_nonce('seamless_nonce'); ?>',
            events: <?php echo json_encode($events); ?>,
            slug: '<?php echo get_option('seamless_single_event_endpoint', 'event'); ?>'
        });
    });
</script>