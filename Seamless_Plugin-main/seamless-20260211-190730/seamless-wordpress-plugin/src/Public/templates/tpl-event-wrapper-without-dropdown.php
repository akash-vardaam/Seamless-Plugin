<?php
$instance_id = isset($instance_id) && $instance_id ? $instance_id : '';
$id_suffix = $instance_id;
?>
<div id="eventWrapper" class="seamless-content-wrapper seamless-event-wrapper-without-dropdown seamless-event-wrapper <?php echo esc_attr($id_suffix); ?>" data-seamless-instance="<?php echo esc_attr($instance_id); ?>">
    <div class="loader-container">
        <div id="Seamlessloader" class="seamless-plugin-loader" role="status" aria-label="Loading">
            <?php $lid = substr(md5(uniqid('sl', true)), 0, 6); ?>
            <svg xmlns="http://www.w3.org/2000/svg" class="sync-wheel-svg" viewBox="62 64 282 282" aria-hidden="true">
                <defs>
                    <linearGradient id="swg1-<?php echo $lid; ?>" x1="135.2" y1="221.8" x2="271.3" y2="221.8" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stop-color="#0fd" />
                        <stop offset=".2" stop-color="#2ac9e4" />
                        <stop offset=".4" stop-color="#6383ed" />
                        <stop offset=".6" stop-color="#904bf5" />
                        <stop offset=".8" stop-color="#b022fa" />
                        <stop offset=".9" stop-color="#c40afd" />
                        <stop offset="1" stop-color="#cc01ff" />
                    </linearGradient>
                    <linearGradient id="swg2-<?php echo $lid; ?>" x1="62.7" y1="214.6" x2="343.9" y2="214.6" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stop-color="#0fd" />
                        <stop offset=".2" stop-color="#2ac9e4" />
                        <stop offset=".4" stop-color="#6383ed" />
                        <stop offset=".6" stop-color="#904bf5" />
                        <stop offset=".8" stop-color="#b022fa" />
                        <stop offset=".9" stop-color="#c40afd" />
                        <stop offset="1" stop-color="#cc01ff" />
                    </linearGradient>
                    <linearGradient id="swg3-<?php echo $lid; ?>" x1="99.4" y1="214.7" x2="314.3" y2="214.7" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
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
                    <path fill="url(#swg2-<?php echo $lid; ?>)" d="M203,64.7c-77.5.2-140.5,63.4-140.3,140.9,0,34.4,12.6,65.9,33.2,90.3-1.6,3.2-2.6,6.8-2.6,10.6,0,12.6,10.3,22.9,23,22.9s9.6-1.6,13.3-4.3c21.5,13.3,46.9,21,74,20.9,77.5-.2,140.5-63.4,140.3-140.9-.2-77.5-63.4-140.5-140.9-140.3h0ZM116.3,316c-5.2,0-9.5-4.2-9.5-9.5s4.2-9.5,9.5-9.5,9.5,4.2,9.5,9.5-4.2,9.5-9.5,9.5ZM203.6,332.5c-24.1,0-46.6-6.6-65.8-18.2.9-2.5,1.4-5.1,1.4-7.9,0-12.6-10.3-22.9-23-22.9s-7.7,1-10.9,2.8c-18.2-21.9-29.1-50-29.2-80.7-.2-70.1,56.8-127.3,126.9-127.5s127.3,56.8,127.5,126.9-56.8,127.3-126.9,127.5Z" />
                </g>
                <g class="sl-ring-mid">
                    <path fill="url(#swg3-<?php echo $lid; ?>)" d="M305.1,226.9c1.5-7,2.3-14.2,2.3-21.6,0-57.4-46.7-104-104-104s-104,46.7-104,104,46.7,104,104,104,64.3-16.4,83.3-41.7c1.5.3,3.1.5,4.7.5,12.6,0,22.9-10.3,22.9-22.9s-3.6-14.1-9.2-18.3h0ZM203.3,296c-50,0-90.6-40.7-90.6-90.6s40.7-90.6,90.6-90.6,90.6,40.7,90.6,90.6-.6,11.5-1.6,17h-1c-12.6,0-22.9,10.3-22.9,22.9s2.4,11.7,6.4,15.8c-16.6,21.2-42.4,34.9-71.4,34.9h0ZM291.4,254.7c-5.2,0-9.5-4.3-9.5-9.5s4.3-9.5,9.5-9.5,9.5,4.3,9.5,9.5-4.3,9.5-9.5,9.5Z" />
                </g>
                <g class="sl-ring-inner">
                    <path fill="url(#swg1-<?php echo $lid; ?>)" d="M225.6,141.1c-2.2-10.4-11.5-18.2-22.5-18.1-11,0-20.2,7.9-22.4,18.3-26.5,9.4-45.5,34.7-45.5,64.3s30.7,68,68.2,67.9c37.5,0,68-30.7,67.9-68.2,0-29.7-19.2-54.9-45.8-64.1h0ZM203.2,136.3c5.2,0,9.5,4.2,9.5,9.5s-4.2,9.5-9.5,9.5-9.5-4.2-9.5-9.5,4.2-9.5,9.5-9.5ZM203.5,260c-30.1,0-54.7-24.4-54.8-54.5,0-22.7,13.8-42.2,33.5-50.5,3.5,8.1,11.7,13.8,21.1,13.8s17.5-5.7,21-13.9c19.7,8.2,33.7,27.7,33.7,50.3s-24.4,54.7-54.5,54.8Z" />
                </g>
            </svg>
        </div>
    </div>

    <div class="seamless-main-content" style="display: none;">
        <section class="seamless-nd-searchbar-section">
            <div class="seamless-nd-searchbar-wrap">

                <div class="seamless-nd-row">
                    <div class="seamless-nd-search-field">
                        <svg class="seamless-nd-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            id="seamless-nd-search"
                            class="seamless-nd-search-input"
                            placeholder="Search events..."
                            autocomplete="off"
                            aria-label="Search events" />
                    </div>

                    <div class="seamless-nd-controls">
                        <button
                            type="button"
                            id="seamless-nd-filters-btn"
                            class="seamless-nd-btn seamless-nd-filters-btn"
                            aria-expanded="false"
                            aria-controls="seamless-nd-filters-panel">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <line x1="4" y1="6" x2="20" y2="6"></line>
                                <line x1="8" y1="12" x2="16" y2="12"></line>
                                <line x1="11" y1="18" x2="13" y2="18"></line>
                            </svg>
                            <span>Filters</span>
                            <span class="seamless-nd-filter-count" aria-label="active filters" style="display:none;">0</span>
                            <svg class="seamless-nd-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>

                        <div class="seamless-nd-dropdown-wrap" id="seamless-nd-year-wrap">
                            <button
                                type="button"
                                class="seamless-nd-btn seamless-nd-year-btn"
                                id="seamless-nd-year-btn"
                                aria-expanded="false"
                                aria-controls="seamless-nd-year-menu">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <span class="seamless-nd-year-label">All Years</span>
                                <svg class="seamless-nd-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <ul class="seamless-nd-menu" id="seamless-nd-year-menu" role="listbox" aria-label="Year filter"></ul>
                        </div>

                        <div class="seamless-nd-dropdown-wrap" id="seamless-nd-sort-wrap">
                            <button
                                type="button"
                                class="seamless-nd-btn seamless-nd-sort-btn"
                                id="seamless-nd-sort-btn"
                                aria-expanded="false"
                                aria-controls="seamless-nd-sort-menu">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <polyline points="5 12 12 5 19 12"></polyline>
                                </svg>
                                <span class="seamless-nd-sort-label">Upcoming</span>
                                <svg class="seamless-nd-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <ul class="seamless-nd-menu" id="seamless-nd-sort-menu" role="listbox" aria-label="Sort events">
                                <li role="option" data-value="all">All</li>
                                <li role="option" data-value="upcoming">Upcoming</li>
                                <li role="option" data-value="current">Current</li>
                                <li role="option" data-value="past">Past</li>
                            </ul>
                        </div>

                        <button
                            type="button"
                            id="seamless-nd-reset-btn"
                            class="seamless-nd-btn seamless-nd-reset-btn"
                            aria-label="Reset all filters">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <polyline points="1 4 1 10 7 10"></polyline>
                                <path d="M3.51 15a9 9 0 1 0 -0.51-5"></path>
                            </svg>
                            <span>Reset</span>
                            <span class="seamless-nd-reset-badge" style="display:none;">0</span>
                        </button>

                    </div><!-- /.seamless-nd-controls -->
                </div><!-- /.seamless-nd-row -->

                <div class="seamless-nd-filters-panel" id="seamless-nd-filters-panel" aria-hidden="true">
                    <div class="seamless-nd-filters-panel-inner">
                        <div class="seamless-nd-filter-group" id="seamless-nd-category-group">
                            <label class="seamless-nd-filter-group-label">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                </svg>
                                Category
                            </label>
                            <div class="seamless-nd-filter-options" id="seamless-nd-category-options">
                                <span class="seamless-nd-filter-placeholder">Loading categories...</span>
                            </div>
                        </div>

                        <div class="seamless-nd-filter-group" id="seamless-nd-tag-group">
                            <label class="seamless-nd-filter-group-label">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                                </svg>
                                Tag
                            </label>
                            <div class="seamless-nd-filter-options" id="seamless-nd-tag-options">
                                <span class="seamless-nd-filter-placeholder">Loading tags...</span>
                            </div>
                        </div>

                    </div><!-- /.seamless-nd-filters-panel-inner -->
                </div><!-- /.seamless-nd-filters-panel -->

                <div class="seamless-nd-chips-row" id="seamless-nd-chips-row" aria-live="polite"></div>

                <div class="seamless-nd-mobile-filters" id="seamless-nd-mobile-filters"></div>

            </div><!-- /.seamless-nd-searchbar-wrap -->
        </section>

        <input type="hidden" id="search" class="seamless-search-input <?php echo esc_attr($id_suffix); ?>" value="" />
        <input type="hidden" id="year_filter" class="seamless-year-select <?php echo esc_attr($id_suffix); ?>" value="" />
        <input type="hidden" id="sort_by" class="seamless-sort-select <?php echo esc_attr($id_suffix); ?>" value="upcoming" />
        <input type="hidden" id="current_view" class="seamless-current-view <?php echo esc_attr($id_suffix); ?>" value="list" />
        <button id="reset_btn" class="reset-button seamless-reset-button <?php echo esc_attr($id_suffix); ?>" style="display:none;" aria-hidden="true" tabindex="-1">Reset</button>

        <section class="seamless-events-toolbar-section">
            <div class="seamless-events-toolbar">
                <div class="seamless-events-summary" aria-live="polite">
                    <span class="seamless-events-summary-text">Showing events 0 of 0 - page 1</span>
                </div>
                <div class="view-toggle-buttons seamless-view-toggle-icons">
                    <button class="view-toggle active" data-view="list" title="List View" aria-label="List View">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <line x1="9" y1="6.5" x2="21" y2="6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
                            <line x1="9" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
                            <line x1="9" y1="17.5" x2="21" y2="17.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
                            <circle cx="5.5" cy="6.5" r="1.4" fill="currentColor"></circle>
                            <circle cx="5.5" cy="12" r="1.4" fill="currentColor"></circle>
                            <circle cx="5.5" cy="17.5" r="1.4" fill="currentColor"></circle>
                        </svg>
                    </button>
                    <button class="view-toggle grid-view-toggle" data-view="grid" title="Grid View" aria-label="Grid View">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"></rect>
                            <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"></rect>
                            <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"></rect>
                            <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"></rect>
                        </svg>
                    </button>
                    <button class="view-toggle" data-view="calendar" title="Calendar View" aria-label="Calendar View">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" stroke-width="1.8"></rect>
                            <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.8"></line>
                            <line x1="8" y1="3" x2="8" y2="7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
                            <line x1="16" y1="3" x2="16" y2="7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
                            <rect x="7" y="12" width="3" height="3" rx="0.8" fill="currentColor"></rect>
                            <rect x="12" y="12" width="3" height="3" rx="0.8" fill="currentColor"></rect>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Legacy hidden category dropdowns container (populated by seamless.js) -->
            <div id="category_dropdowns" class="seamless-category-dropdowns <?php echo esc_attr($id_suffix); ?>" style="display:none;"></div>
            <!-- Hidden tag dropdowns container for tag filter sync -->
            <div id="tag_dropdowns" class="seamless-tag-dropdowns <?php echo esc_attr($id_suffix); ?>" style="display:none;"></div>
        </section>

        <div class="details-section">
            <div id="Seamlessloader" class="seamless-plugin-loader" style="display:none;" role="status" aria-label="Loading">
                <?php $lid2 = substr(md5(uniqid('sl2', true)), 0, 6); ?>
                <svg xmlns="http://www.w3.org/2000/svg" class="sync-wheel-svg" viewBox="62 64 282 282" aria-hidden="true">
                    <defs>
                        <linearGradient id="swg1-<?php echo $lid2; ?>" x1="135.2" y1="221.8" x2="271.3" y2="221.8" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
                            <stop offset="0" stop-color="#0fd" />
                            <stop offset=".2" stop-color="#2ac9e4" />
                            <stop offset=".4" stop-color="#6383ed" />
                            <stop offset=".6" stop-color="#904bf5" />
                            <stop offset=".8" stop-color="#b022fa" />
                            <stop offset=".9" stop-color="#c40afd" />
                            <stop offset="1" stop-color="#cc01ff" />
                        </linearGradient>
                        <linearGradient id="swg2-<?php echo $lid2; ?>" x1="62.7" y1="214.6" x2="343.9" y2="214.6" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
                            <stop offset="0" stop-color="#0fd" />
                            <stop offset=".2" stop-color="#2ac9e4" />
                            <stop offset=".4" stop-color="#6383ed" />
                            <stop offset=".6" stop-color="#904bf5" />
                            <stop offset=".8" stop-color="#b022fa" />
                            <stop offset=".9" stop-color="#c40afd" />
                            <stop offset="1" stop-color="#cc01ff" />
                        </linearGradient>
                        <linearGradient id="swg3-<?php echo $lid2; ?>" x1="99.4" y1="214.7" x2="314.3" y2="214.7" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
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
                        <path fill="url(#swg2-<?php echo $lid2; ?>)" d="M203,64.7c-77.5.2-140.5,63.4-140.3,140.9,0,34.4,12.6,65.9,33.2,90.3-1.6,3.2-2.6,6.8-2.6,10.6,0,12.6,10.3,22.9,23,22.9s9.6-1.6,13.3-4.3c21.5,13.3,46.9,21,74,20.9,77.5-.2,140.5-63.4,140.3-140.9-.2-77.5-63.4-140.5-140.9-140.3h0ZM116.3,316c-5.2,0-9.5-4.2-9.5-9.5s4.2-9.5,9.5-9.5,9.5,4.2,9.5,9.5-4.2,9.5-9.5,9.5ZM203.6,332.5c-24.1,0-46.6-6.6-65.8-18.2.9-2.5,1.4-5.1,1.4-7.9,0-12.6-10.3-22.9-23-22.9s-7.7,1-10.9,2.8c-18.2-21.9-29.1-50-29.2-80.7-.2-70.1,56.8-127.3,126.9-127.5s127.3,56.8,127.5,126.9-56.8,127.3-126.9,127.5Z" />
                    </g>
                    <g class="sl-ring-mid">
                        <path fill="url(#swg3-<?php echo $lid2; ?>)" d="M305.1,226.9c1.5-7,2.3-14.2,2.3-21.6,0-57.4-46.7-104-104-104s-104,46.7-104,104,46.7,104,104,104,64.3-16.4,83.3-41.7c1.5.3,3.1.5,4.7.5,12.6,0,22.9-10.3,22.9-22.9s-3.6-14.1-9.2-18.3h0ZM203.3,296c-50,0-90.6-40.7-90.6-90.6s40.7-90.6,90.6-90.6,90.6,40.7,90.6,90.6-.6,11.5-1.6,17h-1c-12.6,0-22.9,10.3-22.9,22.9s2.4,11.7,6.4,15.8c-16.6,21.2-42.4,34.9-71.4,34.9h0ZM291.4,254.7c-5.2,0-9.5-4.3-9.5-9.5s4.3-9.5,9.5-9.5,9.5,4.3,9.5,9.5-4.3,9.5-9.5,9.5Z" />
                    </g>
                    <g class="sl-ring-inner">
                        <path fill="url(#swg1-<?php echo $lid2; ?>)" d="M225.6,141.1c-2.2-10.4-11.5-18.2-22.5-18.1-11,0-20.2,7.9-22.4,18.3-26.5,9.4-45.5,34.7-45.5,64.3s30.7,68,68.2,67.9c37.5,0,68-30.7,67.9-68.2,0-29.7-19.2-54.9-45.8-64.1h0ZM203.2,136.3c5.2,0,9.5,4.2,9.5,9.5s-4.2,9.5-9.5,9.5-9.5-4.2-9.5-9.5,4.2-9.5,9.5-9.5ZM203.5,260c-30.1,0-54.7-24.4-54.8-54.5,0-22.7,13.8-42.2,33.5-50.5,3.5,8.1,11.7,13.8,21.1,13.8s17.5-5.7,21-13.9c19.7,8.2,33.7,27.7,33.7,50.3s-24.4,54.7-54.5,54.8Z" />
                    </g>
                </svg>
            </div>
            <div class="seamless-event-list <?php echo esc_attr($id_suffix); ?>"></div>
            <div id="calendar_view" class="hidden seamless-calendar-view <?php echo esc_attr($id_suffix); ?>"></div>
            <div id="pagination" class="seamless-pagination-wrapper <?php echo esc_attr($id_suffix); ?>"></div>
        </div>
    </div>
</div>