<?php

/**
 * Template Part: Dashboard Profile
 */

$pf_first = $profile['first_name'] ?? '';
$pf_last = $profile['last_name'] ?? '';
$pf_email = $profile['email'] ?? '';
$pf_phone = $profile['phone'] ?? '';
$pf_phone_type = $profile['phone_type'] ?? '';
$pf_address_1 = $profile['address_line_1'] ?? '';
$pf_address_2 = $profile['address_line_2'] ?? '';
$pf_city = $profile['city'] ?? '';
$pf_state = $profile['state'] ?? '';
$pf_country = $profile['country'] ?? '';
$pf_zip = $profile['zip_code'] ?? '';

$location_data_file = dirname(__DIR__) . '/data/countries-states.php';
$location_data = file_exists($location_data_file) ? require $location_data_file : [];

$country_options = is_array($location_data['countries'] ?? null) ? $location_data['countries'] : [];
$country_states = is_array($location_data['states'] ?? null) ? $location_data['states'] : [];

$country_code_by_name = [];
foreach ($country_options as $country_code => $country_name) {
    $country_code_by_name[strtoupper((string) $country_name)] = (string) $country_code;
}

$pf_country_code = '';
$raw_country = strtoupper(trim((string) $pf_country));
if (!empty($raw_country) && isset($country_options[$raw_country])) {
    $pf_country_code = $raw_country;
} elseif (!empty($raw_country) && isset($country_code_by_name[$raw_country])) {
    $pf_country_code = $country_code_by_name[$raw_country];
}

$selected_country_states = [];
if (!empty($pf_country_code) && !empty($country_states[$pf_country_code]) && is_array($country_states[$pf_country_code])) {
    $selected_country_states = $country_states[$pf_country_code];
}

// Strip the country prefix to look up in the data file which uses plain codes (e.g. IL).
$pf_state_raw = strtoupper(trim((string) $pf_state)); // e.g. US_IL
$pf_state_lookup = $pf_state_raw;
if (!empty($pf_country_code) && strpos($pf_state_raw, $pf_country_code . '_') === 0) {
    $pf_state_lookup = substr($pf_state_raw, strlen($pf_country_code) + 1); // e.g. IL
}

$pf_state_display_name = '';
if (!empty($selected_country_states) && isset($selected_country_states[$pf_state_lookup])) {
    $pf_state_display_name = (string) $selected_country_states[$pf_state_lookup];
}

$pf_country_display = $pf_country ?: '—';
if (!empty($pf_country_code) && isset($country_options[$pf_country_code])) {
    $pf_country_display = (string) $country_options[$pf_country_code];
}

$pf_state_display = $pf_state ?: '—';
if (!empty($pf_state_display_name)) {
    $pf_state_display = $pf_state_display_name;
}

$profile_form_id = 'seamless-user-dashboard-form-' . esc_attr($widget_id ?? 'default');
?>

<div class="seamless-user-dashboard-profile-container">
    <div class="seamless-user-dashboard-profile-section">
        <div class="seamless-user-dashboard-profile-header">
            <h4 class="seamless-user-dashboard-section-title"><?php _e('Personal Information', 'seamless-addon'); ?></h4>
            <button class="seamless-user-dashboard-btn seamless-user-dashboard-btn-edit" data-email="<?php echo esc_attr($pf_email); ?>">
                <?php _e('EDIT', 'seamless-addon'); ?>
            </button>
        </div>

        <div class="seamless-user-dashboard-profile-view-mode">
            <div class="seamless-user-dashboard-profile-grid">
                <div class="seamless-user-dashboard-profile-field">
                    <label><?php _e('First Name', 'seamless-addon'); ?></label>
                    <div class="seamless-user-dashboard-profile-value"><?php echo esc_html($pf_first ?: '—'); ?></div>
                </div>
                <div class="seamless-user-dashboard-profile-field">
                    <label><?php _e('Last Name', 'seamless-addon'); ?></label>
                    <div class="seamless-user-dashboard-profile-value"><?php echo esc_html($pf_last ?: '—'); ?></div>
                </div>
                <div class="seamless-user-dashboard-profile-field">
                    <label><?php _e('Email Address', 'seamless-addon'); ?></label>
                    <div class="seamless-user-dashboard-profile-value"><?php echo esc_html($pf_email ?: '—'); ?></div>
                </div>
            </div>
            <div class="seamless-user-dashboard-profile-grid">
                <div class="seamless-user-dashboard-profile-field">
                    <label><?php _e('Phone Number', 'seamless-addon'); ?></label>
                    <div class="seamless-user-dashboard-profile-value">
                        <?php
                        $phone_display = '—';
                        if ($pf_phone) {
                            $numeric_phone = preg_replace('/[^0-9]/', '', $pf_phone);
                            if (strlen($numeric_phone) === 11 && strpos($numeric_phone, '1') === 0) {
                                $numeric_phone = substr($numeric_phone, 1);
                            }
                            if (strlen($numeric_phone) === 10) {
                                $phone_display = sprintf('(%s) %s-%s',
                                    substr($numeric_phone, 0, 3),
                                    substr($numeric_phone, 3, 3),
                                    substr($numeric_phone, 6, 4)
                                );
                            } else {
                                $phone_display = $pf_phone;
                            }
                            if ($pf_phone_type) {
                                $phone_display .= ' (' . ucfirst($pf_phone_type) . ')';
                            }
                        }
                        echo esc_html($phone_display);
                        ?>
                    </div>
                </div>
            </div>

            <div class="seamless-user-dashboard-profile-separator">
                <h4 class="seamless-user-dashboard-subsection-title"><?php _e('Address Information', 'seamless-addon'); ?></h4>
            </div>

            <div class="seamless-user-dashboard-profile-grid address-grid">
                <div class="seamless-user-dashboard-profile-field">
                    <label><?php _e('Address Line 1', 'seamless-addon'); ?></label>
                    <div class="seamless-user-dashboard-profile-value"><?php echo esc_html($pf_address_1 ?: '—'); ?></div>
                </div>
                <div class="seamless-user-dashboard-profile-field">
                    <label><?php _e('Address Line 2', 'seamless-addon'); ?></label>
                    <div class="seamless-user-dashboard-profile-value"><?php echo esc_html($pf_address_2 ?: '—'); ?></div>
                </div>
            </div>
            <div class="seamless-user-dashboard-profile-grid country-state-grid">
                <div class="seamless-user-dashboard-profile-field">
                    <label><?php _e('Country', 'seamless-addon'); ?></label>
                    <div class="seamless-user-dashboard-profile-value"><?php echo esc_html($pf_country_display); ?></div>
                </div>
                <div class="seamless-user-dashboard-profile-field">
                    <label><?php _e('State', 'seamless-addon'); ?></label>
                    <div class="seamless-user-dashboard-profile-value"><?php echo esc_html($pf_state_display); ?></div>
                </div>
                <div class="seamless-user-dashboard-profile-field">
                    <label><?php _e('City', 'seamless-addon'); ?></label>
                    <div class="seamless-user-dashboard-profile-value"><?php echo esc_html($pf_city ?: '—'); ?></div>
                </div>
                <div class="seamless-user-dashboard-profile-field">
                    <label><?php _e('Zip Code', 'seamless-addon'); ?></label>
                    <div class="seamless-user-dashboard-profile-value"><?php echo esc_html($pf_zip ?: '—'); ?></div>
                </div>
            </div>
        </div>

        <div class="seamless-user-dashboard-profile-edit-mode" style="display: none;">
            <form id="<?php echo $profile_form_id; ?>" class="seamless-user-dashboard-edit-profile-form">
                <div class="seamless-user-dashboard-profile-grid">
                    <div class="seamless-user-dashboard-form-group">
                        <label for="seamless-user-dashboard-first-name-<?php echo esc_attr($widget_id ?? 'default'); ?>">
                            <?php _e('First Name', 'seamless-addon'); ?> <span class="required">*</span>
                        </label>
                        <input type="text" id="seamless-user-dashboard-first-name-<?php echo esc_attr($widget_id ?? 'default'); ?>" name="first_name" value="<?php echo esc_attr($pf_first); ?>" required>
                    </div>
                    <div class="seamless-user-dashboard-form-group">
                        <label for="seamless-user-dashboard-last-name-<?php echo esc_attr($widget_id ?? 'default'); ?>">
                            <?php _e('Last Name', 'seamless-addon'); ?> <span class="required">*</span>
                        </label>
                        <input type="text" id="seamless-user-dashboard-last-name-<?php echo esc_attr($widget_id ?? 'default'); ?>" name="last_name" value="<?php echo esc_attr($pf_last); ?>" required>
                    </div>
                    <div class="seamless-user-dashboard-form-group">
                        <label for="seamless-user-dashboard-email-<?php echo esc_attr($widget_id ?? 'default'); ?>">
                            <?php _e('Email Address', 'seamless-addon'); ?> <span class="required">*</span>
                        </label>
                        <input type="email" id="seamless-user-dashboard-email-<?php echo esc_attr($widget_id ?? 'default'); ?>" name="email" value="<?php echo esc_attr($pf_email); ?>" required>
                    </div>
                </div>
                <div class="seamless-user-dashboard-profile-grid">
                    <div class="seamless-user-dashboard-form-group">
                        <label for="seamless-user-dashboard-phone-type-<?php echo esc_attr($widget_id ?? 'default'); ?>">
                            <?php _e('Phone Type', 'seamless-addon'); ?>
                        </label>
                        <select id="seamless-user-dashboard-phone-type-<?php echo esc_attr($widget_id ?? 'default'); ?>" name="phone_type">
                            <option value="mobile" <?php selected($pf_phone_type, 'mobile'); ?>><?php _e('Mobile', 'seamless-addon'); ?></option>
                            <option value="home" <?php selected($pf_phone_type, 'home'); ?>><?php _e('Home', 'seamless-addon'); ?></option>
                            <option value="work" <?php selected($pf_phone_type, 'work'); ?>><?php _e('Work', 'seamless-addon'); ?></option>
                            <option value="other" <?php selected($pf_phone_type, 'other'); ?>><?php _e('Other', 'seamless-addon'); ?></option>
                        </select>
                    </div>
                    <div class="seamless-user-dashboard-form-group">
                        <label for="seamless-user-dashboard-phone-<?php echo esc_attr($widget_id ?? 'default'); ?>">
                            <?php _e('Phone Number', 'seamless-addon'); ?>
                        </label>
                        <?php
                            $raw_phone = preg_replace('/[^0-9]/', '', $pf_phone);
                            if (strlen($raw_phone) === 11 && strpos($raw_phone, '1') === 0) {
                                $raw_phone = substr($raw_phone, 1);
                            }
                            if (strlen($raw_phone) === 10) {
                                $edit_phone_display = sprintf('(%s) %s-%s',
                                    substr($raw_phone, 0, 3),
                                    substr($raw_phone, 3, 3),
                                    substr($raw_phone, 6, 4)
                                );
                            } else {
                                $edit_phone_display = $pf_phone;
                            }
                        ?>
                        <input type="tel" id="seamless-user-dashboard-phone-<?php echo esc_attr($widget_id ?? 'default'); ?>" placeholder="(201) 555-0123" name="phone" value="<?php echo esc_attr($edit_phone_display); ?>">
                    </div>
                </div>

                <div class="seamless-user-dashboard-profile-separator">
                    <h4 class="seamless-user-dashboard-subsection-title"><?php _e('Address Information', 'seamless-addon'); ?></h4>
                </div>

                <div class="seamless-user-dashboard-profile-grid address-grid">
                    <div class="seamless-user-dashboard-form-group full-width">
                        <label for="seamless-user-dashboard-address-1-<?php echo esc_attr($widget_id ?? 'default'); ?>">
                            <?php _e('Address Line 1', 'seamless-addon'); ?>
                        </label>
                        <input type="text" id="seamless-user-dashboard-address-1-<?php echo esc_attr($widget_id ?? 'default'); ?>" name="address_line_1" value="<?php echo esc_attr($pf_address_1); ?>">
                    </div>
                    <div class="seamless-user-dashboard-form-group full-width">
                        <label for="seamless-user-dashboard-address-2-<?php echo esc_attr($widget_id ?? 'default'); ?>">
                            <?php _e('Address Line 2', 'seamless-addon'); ?>
                        </label>
                        <input type="text" id="seamless-user-dashboard-address-2-<?php echo esc_attr($widget_id ?? 'default'); ?>" name="address_line_2" value="<?php echo esc_attr($pf_address_2); ?>">
                    </div>
                </div>

                <div class="seamless-user-dashboard-profile-grid country-state-grid">
                    <div class="seamless-user-dashboard-form-group">
                        <label for="seamless-user-dashboard-country-<?php echo esc_attr($widget_id ?? 'default'); ?>">
                            <?php _e('Country', 'seamless-addon'); ?>
                        </label>
                        <select id="seamless-user-dashboard-country-<?php echo esc_attr($widget_id ?? 'default'); ?>" name="country" class="seamless-user-dashboard-location-select">
                            <option value=""><?php _e('Select country', 'seamless-addon'); ?></option>
                            <?php foreach ($country_options as $country_code => $country_name) : ?>
                                <option value="<?php echo esc_attr($country_code); ?>" <?php selected($pf_country_code, (string) $country_code); ?>>
                                    <?php echo esc_html($country_name); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="seamless-user-dashboard-form-group">
                        <label for="seamless-user-dashboard-state-<?php echo esc_attr($widget_id ?? 'default'); ?>">
                            <?php _e('State', 'seamless-addon'); ?>
                        </label>
                        <select id="seamless-user-dashboard-state-<?php echo esc_attr($widget_id ?? 'default'); ?>" name="state" class="seamless-user-dashboard-location-select" data-current-state="<?php echo esc_attr($pf_state_raw); ?>">
                            <option value=""><?php _e('Select state/province', 'seamless-addon'); ?></option>
                            <?php foreach ($selected_country_states as $state_code => $state_name) : ?>
                                <?php
                                // Build the API-format value: {country}_{state} (e.g. US_IL)
                                $state_api_value = (!empty($pf_country_code) ? $pf_country_code . '_' : '') . $state_code;
                                ?>
                                <option value="<?php echo esc_attr($state_api_value); ?>" <?php selected($pf_state_raw, $state_api_value); ?>>
                                    <?php echo esc_html($state_name); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="seamless-user-dashboard-form-group">
                        <label for="seamless-user-dashboard-city-<?php echo esc_attr($widget_id ?? 'default'); ?>">
                            <?php _e('City', 'seamless-addon'); ?>
                        </label>
                        <input type="text" id="seamless-user-dashboard-city-<?php echo esc_attr($widget_id ?? 'default'); ?>" name="city" value="<?php echo esc_attr($pf_city); ?>">
                    </div>
                    <div class="seamless-user-dashboard-form-group">
                        <label for="seamless-user-dashboard-zip-<?php echo esc_attr($widget_id ?? 'default'); ?>">
                            <?php _e('Zip Code', 'seamless-addon'); ?>
                        </label>
                        <input type="text" id="seamless-user-dashboard-zip-<?php echo esc_attr($widget_id ?? 'default'); ?>" name="zip_code" value="<?php echo esc_attr($pf_zip); ?>">
                    </div>
                </div>

                <div class="seamless-user-dashboard-form-message" style="display: none;"></div>

                <div class="seamless-user-dashboard-profile-actions">
                    <button type="button" class="seamless-user-dashboard-btn seamless-user-dashboard-btn-cancel">
                        <?php _e('Cancel', 'seamless-addon'); ?>
                    </button>
                    <button type="submit" class="seamless-user-dashboard-btn seamless-user-dashboard-btn-save">
                        <?php _e('Save Changes', 'seamless-addon'); ?>
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
    (function() {
        var form = document.getElementById('<?php echo esc_js($profile_form_id); ?>');
        if (!form) {
            return;
        }

        var countrySelect = form.querySelector('select[name="country"]');
        var stateSelect = form.querySelector('select[name="state"]');
        if (!countrySelect || !stateSelect) {
            return;
        }

        var statesByCountry = <?php echo wp_json_encode($country_states); ?>;
        var statePlaceholder = '<?php echo esc_js(__('Select state/province', 'seamless-addon')); ?>';

        function buildStateOptions(countryCode, selectedState) {
            var stateMap = statesByCountry[countryCode] || {};
            var entries = Object.entries(stateMap);

            stateSelect.innerHTML = '';
            stateSelect.appendChild(new Option(statePlaceholder, ''));

            if (!entries.length) {
                stateSelect.disabled = true;
                stateSelect.value = '';
                return;
            }

            stateSelect.disabled = false;
            var resolvedValue = '';

            // Strip country prefix from selectedState for matching
            // API returns e.g. "US_IL", data file keys are e.g. "IL"
            var selectedStateLookup = selectedState;
            if (countryCode && selectedState && selectedState.indexOf(countryCode + '_') === 0) {
                selectedStateLookup = selectedState.substring(countryCode.length + 1);
            }

            entries.forEach(function(entry) {
                var stateCode = entry[0]; // e.g. "IL"
                var stateName = entry[1]; // e.g. "Illinois"
                var apiValue = countryCode + '_' + stateCode; // e.g. "US_IL"
                var option = new Option(stateName, apiValue);

                if (selectedStateLookup && (selectedStateLookup === stateCode || selectedStateLookup === stateName)) {
                    resolvedValue = apiValue;
                }

                stateSelect.appendChild(option);
            });

            stateSelect.value = resolvedValue;
        }

        countrySelect.addEventListener('change', function() {
            buildStateOptions(countrySelect.value, '');
        });

        buildStateOptions(countrySelect.value, stateSelect.getAttribute('data-current-state') || '');
    })();
</script>