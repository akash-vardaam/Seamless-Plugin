<?php

/**
 * Template Part: Dashboard Organization
 *
 * Variables available:
 * @var array $organization Organization info (id, name, email)
 * @var array $group_memberships Array of group memberships with plans/members
 * @var array $my_memberships Array of user's own group membership records
 */

if (empty($organization) && empty($group_memberships)) {
?>
    <div class="seamless-user-dashboard-org-empty">
        <div class="seamless-user-dashboard-org-empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
        </div>
        <h3><?php _e('No Organization Found', 'seamless-addon'); ?></h3>
        <p><?php _e('You are not currently part of any organization or group membership.', 'seamless-addon'); ?></p>
    </div>
<?php
    return;
}

$org_name = $organization['name'] ?? 'Organization';
$org_email = $organization['email'] ?? '';
$plan_count = count($group_memberships);
$role_counts = [
    'owner' => 0,
    'admin' => 0,
    'member' => 0,
];
$unique_roles = [];

foreach ($group_memberships as $membership) {
    $membership_role = strtolower((string)($membership['role'] ?? 'member'));
    $unique_roles[$membership_role] = true;
    if (isset($role_counts[$membership_role])) {
        $role_counts[$membership_role]++;
    }
}

$has_multiple_memberships = $plan_count > 1;
$has_mixed_roles = count($unique_roles) > 1;
$header_eyebrow = $has_multiple_memberships ? __('Organization Memberships', 'seamless-addon') : __('My Organization', 'seamless-addon');
$header_title = (!$has_multiple_memberships && !empty($org_name)) ? $org_name : __('Your Organization Access', 'seamless-addon');
$header_description = $has_multiple_memberships
    ? sprintf(
        _n(
            '%d active group membership. Permissions below are shown per membership.',
            '%d active group memberships. Permissions below are shown per membership.',
            $plan_count,
            'seamless-addon'
        ),
        $plan_count
    )
    : (!empty($org_email) ? $org_email : __('Manage your organization membership details below.', 'seamless-addon'));
?>

<div class="seamless-user-dashboard-org-wrapper">
    <!-- Organization Header -->
    <div class="seamless-user-dashboard-org-header">
        <div class="seamless-user-dashboard-org-header-info">
            <p class="seamless-user-dashboard-org-name"><?php echo esc_html($header_eyebrow); ?></p>
            <h2 class="seamless-user-dashboard-org-title"><?php echo esc_html($header_title); ?></h2>
            <p class="seamless-user-dashboard-org-description"><?php echo esc_html($header_description); ?></p>
        </div>
        <div class="seamless-user-dashboard-org-summary">
            <span class="seamless-user-dashboard-org-plan-count">
                <?php echo esc_html($plan_count); ?> <?php echo $plan_count === 1 ? __('Plan', 'seamless-addon') : __('Plans', 'seamless-addon'); ?>
            </span>
            <?php if ($role_counts['owner'] > 0): ?>
                <span class="seamless-user-dashboard-org-summary-pill seamless-org-role-owner">
                    <?php echo esc_html($role_counts['owner']); ?> <?php echo $role_counts['owner'] === 1 ? __('Owner Role', 'seamless-addon') : __('Owner Roles', 'seamless-addon'); ?>
                </span>
            <?php endif; ?>
            <?php if ($role_counts['admin'] > 0): ?>
                <span class="seamless-user-dashboard-org-summary-pill seamless-org-role-admin">
                    <?php echo esc_html($role_counts['admin']); ?> <?php echo $role_counts['admin'] === 1 ? __('Admin Role', 'seamless-addon') : __('Admin Roles', 'seamless-addon'); ?>
                </span>
            <?php endif; ?>
            <?php if ($role_counts['member'] > 0): ?>
                <span class="seamless-user-dashboard-org-summary-pill seamless-org-role-member">
                    <?php echo esc_html($role_counts['member']); ?> <?php echo $role_counts['member'] === 1 ? __('Member Role', 'seamless-addon') : __('Member Roles', 'seamless-addon'); ?>
                </span>
            <?php endif; ?>
        </div>
    </div>

    <!-- Group Memberships Accordion -->
    <?php foreach ($group_memberships as $gm_index => $gm):
        $gm_id = $gm['id'] ?? '';
        $gm_role = $gm['role'] ?? 'member';
        $gm_role_key = strtolower((string)$gm_role);
        $gm_is_owner = $gm_role_key === 'owner';
        $gm_is_admin = $gm_role_key === 'admin';
        $plan = $gm['plan'] ?? [];
        $plan_label = $plan['label'] ?? 'Group Plan';
        $group_seats = (int)($plan['group_seats'] ?? 0);
        $group_admin_seats = (int)($plan['group_admin_seats'] ?? 0);
        $additional_seats_enabled = !empty($plan['additional_seats_enabled']);
        $per_seat_price = $plan['per_seat_price'] ?? '0.00';
        $members = $gm['group_members'] ?? [];
        $member_count = (int)($gm['member_count'] ?? count($members));

        // Count statuses and admins
        $accepted_count = 0;
        $pending_count = 0;
        $additional_count = 0;
        $current_admin_count = 0;
        foreach ($members as $member) {
            $status = $member['status'] ?? '';
            $role = $member['role'] ?? 'member';
            if ($status === 'accepted' || $status === 'pending') {
                if ($role === 'admin' || $role === 'owner') {
                    $current_admin_count++;
                }
            }
            if ($status === 'accepted') {
                $accepted_count++;
            } elseif ($status === 'pending') {
                $pending_count++;
            }
        }
        // Additional seats = members beyond the base group_seats
        $remaining_seats = max(0, $group_seats - $member_count);
    ?>
        <div class="seamless-user-dashboard-org-plan" data-membership-id="<?php echo esc_attr($gm_id); ?>">
            <!-- Plan Header (Accordion Toggle) -->
            <div class="seamless-user-dashboard-org-plan-header" data-accordion-toggle>
                <div class="seamless-user-dashboard-org-plan-info">
                    <h3 class="seamless-user-dashboard-org-plan-title"><?php echo esc_html($plan_label); ?></h3>
                    <div class="seamless-user-dashboard-org-plan-meta">
                        <span class="seamless-user-dashboard-org-role-badge seamless-org-role-<?php echo esc_attr($gm_role_key); ?>">
                            <?php
                            printf(
                                /* translators: %s is the user's role in this group membership. */
                                esc_html__('Your role: %s', 'seamless-addon'),
                                esc_html(ucfirst($gm_role_key))
                            );
                            ?>
                        </span>
                        <?php if ($has_multiple_memberships && $has_mixed_roles): ?>
                            <span class="seamless-user-dashboard-org-plan-scope"><?php _e('Permissions apply only to this membership', 'seamless-addon'); ?></span>
                        <?php endif; ?>
                    </div>
                    <div class="seamless-user-dashboard-org-plan-stats">
                        <span class="seamless-user-dashboard-org-stat-active">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            <?php echo esc_html($accepted_count); ?> <?php _e('active', 'seamless-addon'); ?> / <?php echo esc_html($group_seats); ?> <?php _e('seats', 'seamless-addon'); ?>
                        </span>
                        <?php if ($pending_count > 0): ?>
                            <span class="seamless-user-dashboard-org-stat-pending">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <?php echo esc_html($pending_count); ?> <?php _e('pending', 'seamless-addon'); ?>
                            </span>
                        <?php endif; ?>
                    </div>
                </div>
                <div class="seamless-user-dashboard-org-plan-toggle">
                    <span class="seamless-user-dashboard-badge seamless-user-dashboard-badge-active"><?php _e('Active', 'seamless-addon'); ?></span>
                    <svg class="seamless-user-dashboard-org-chevron" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>

            <!-- Plan Body (Accordion Content) -->
            <div class="seamless-user-dashboard-org-plan-body" style="display: none;">
                <!-- Capacity Stats -->
                <div class="seamless-user-dashboard-org-capacity">
                    <div class="seamless-user-dashboard-org-capacity-item seamless-org-capacity">
                        <div class="seamless-user-dashboard-org-content-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            <span class="seamless-user-dashboard-org-capacity-label"><?php _e('Capacity', 'seamless-addon'); ?></span>
                        </div>
                        <strong class="seamless-user-dashboard-org-capacity-value"><?php echo esc_html($group_seats); ?></strong>
                    </div>
                    <div class="seamless-user-dashboard-org-capacity-item seamless-org-current">
                        <div class="seamless-user-dashboard-org-content-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span class="seamless-user-dashboard-org-capacity-label"><?php _e('Current', 'seamless-addon'); ?></span>
                        </div>
                        <strong class="seamless-user-dashboard-org-capacity-value"><?php echo esc_html($accepted_count); ?></strong>
                    </div>
                    <div class="seamless-user-dashboard-org-capacity-item seamless-org-remaining">
                        <div class="seamless-user-dashboard-org-content-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="16"></line>
                                <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                            <span class="seamless-user-dashboard-org-capacity-label"><?php _e('Remaining', 'seamless-addon'); ?></span>
                        </div>
                        <strong class="seamless-user-dashboard-org-capacity-value"><?php echo esc_html($remaining_seats); ?></strong>
                    </div>
                    <div class="seamless-user-dashboard-org-capacity-item seamless-org-additional">
                        <div class="seamless-user-dashboard-org-content-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="16"></line>
                                <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                            <span class="seamless-user-dashboard-org-capacity-label"><?php _e('Additional', 'seamless-addon'); ?></span>
                        </div>
                        <strong class="seamless-user-dashboard-org-capacity-value"><?php echo esc_html(max(0, $accepted_count - $group_seats)); ?></strong>
                    </div>
                </div>

                <!-- Members Section -->
                <div class="seamless-user-dashboard-org-members-section">
                    <div class="seamless-user-dashboard-org-members-header">
                        <h4>
                            <?php _e('Members', 'seamless-addon'); ?>
                            <span class="seamless-user-dashboard-org-members-count"><?php echo esc_html($member_count); ?></span>
                        </h4>
                        <?php if (($gm_is_owner || $gm_is_admin) && ($remaining_seats > 0 || $additional_seats_enabled)): ?>
                            <button class="seamless-user-dashboard-org-add-member-btn"
                                data-membership-id="<?php echo esc_attr($gm_id); ?>"
                                data-remaining-seats="<?php echo esc_attr($remaining_seats); ?>"
                                data-additional-enabled="<?php echo esc_attr($additional_seats_enabled ? '1' : '0'); ?>"
                                data-per-seat-price="<?php echo esc_attr($per_seat_price); ?>"
                                data-prorated="<?php echo esc_attr(!empty($plan['prorated']) ? '1' : '0'); ?>"
                                data-group-seats="<?php echo esc_attr($group_seats); ?>"
                                data-member-count="<?php echo esc_attr($member_count); ?>"
                                data-group-admin-seats="<?php echo esc_attr($group_admin_seats); ?>"
                                data-current-admin-count="<?php echo esc_attr($current_admin_count); ?>">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                    <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                                <?php _e('Add Members', 'seamless-addon'); ?>
                            </button>
                        <?php endif; ?>
                    </div>

                    <!-- Members List -->
                    <div class="seamless-user-dashboard-org-members-list">
                        <?php foreach ($members as $member):
                            $member_id = $member['id'] ?? '';
                            $member_role = $member['role'] ?? 'member';
                            $member_status = $member['status'] ?? 'pending';
                            $member_user = $member['user'] ?? null;

                            // Get name
                            if ($member_user) {
                                $member_name = trim(($member_user['first_name'] ?? '') . ' ' . ($member_user['last_name'] ?? ''));
                                $member_email = $member_user['email'] ?? '';
                            } else {
                                $member_name = trim(($member['invited_first_name'] ?? '') . ' ' . ($member['invited_last_name'] ?? ''));
                                $member_email = $member['invited_email'] ?? '';
                            }
                            if (empty($member_name)) {
                                $member_name = $member_email;
                            }
                        ?>
                            <?php
                            $initials = '';
                            $name_parts = array_filter(explode(' ', trim($member_name)));
                            if (!empty($name_parts)) {
                                $first_part = array_shift($name_parts);
                                $initials .= mb_substr($first_part, 0, 1);
                                if (!empty($name_parts)) {
                                    $last_part = array_pop($name_parts);
                                    $initials .= mb_substr($last_part, 0, 1);
                                }
                            }
                            if (empty($initials) && !empty($member_email)) {
                                $initials = mb_substr($member_email, 0, 1);
                            }
                            $initials = strtoupper($initials);
                            ?>
                            <div class="seamless-user-dashboard-org-member-row" data-member-id="<?php echo esc_attr($member_id); ?>">
                                <div class="seamless-user-dashboard-org-member-info">
                                    <div class="seamless-user-dashboard-org-member-avatar seamless-org-avatar-initials">
                                        <?php echo esc_html($initials); ?>
                                    </div>
                                    <div class="seamless-user-dashboard-org-member-details">
                                        <span class="seamless-user-dashboard-org-member-name">
                                            <?php echo esc_html($member_name); ?>
                                            <?php if ($member_role === 'owner'): ?>
                                                <span class="seamless-user-dashboard-org-role-badge seamless-org-role-owner"><?php _e('Owner', 'seamless-addon'); ?></span>
                                            <?php elseif ($member_role === 'admin'): ?>
                                                <span class="seamless-user-dashboard-org-role-badge seamless-org-role-admin"><?php _e('Admin', 'seamless-addon'); ?></span>
                                            <?php endif; ?>
                                        </span>
                                        <span class="seamless-user-dashboard-org-member-email"><?php echo esc_html($member_email); ?></span>
                                    </div>
                                </div>
                                <div class="seamless-user-dashboard-org-member-actions">
                                    <?php if ($member_status === 'accepted'): ?>
                                        <span class="seamless-user-dashboard-org-status-badge seamless-org-status-accepted">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                            <?php _e('Accepted', 'seamless-addon'); ?>
                                        </span>
                                        <?php if (($gm_is_owner || $gm_is_admin) && $member_role !== 'owner'): ?>
                                            <div class="seamless-user-dashboard-org-role-change-wrap" data-current-role="<?php echo esc_attr($member_role); ?>">
                                                <select class="seamless-user-dashboard-org-role-change-select" data-membership-id="<?php echo esc_attr($gm_id); ?>" data-member-id="<?php echo esc_attr($member_id); ?>">
                                                    <option value="member" <?php selected($member_role, 'member'); ?>><?php _e('Member', 'seamless-addon'); ?></option>
                                                    <option value="admin" <?php selected($member_role, 'admin'); ?>><?php _e('Admin', 'seamless-addon'); ?></option>
                                                </select>
                                                <button type="button" class="seamless-user-dashboard-org-role-save-btn" style="display:none;" data-membership-id="<?php echo esc_attr($gm_id); ?>" data-member-id="<?php echo esc_attr($member_id); ?>" title="<?php esc_attr_e('Save Role', 'seamless-addon'); ?>">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                </button>
                                            </div>
                                        <?php endif; ?>
                                    <?php elseif ($member_status === 'pending'): ?>
                                        <span class="seamless-user-dashboard-org-status-badge seamless-org-status-pending">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <polyline points="12 6 12 12 16 14"></polyline>
                                            </svg>
                                            <?php _e('Pending', 'seamless-addon'); ?>
                                        </span>
                                        <?php if ($gm_is_owner || $gm_is_admin): ?>
                                            <button class="seamless-user-dashboard-org-resend-btn" data-membership-id="<?php echo esc_attr($gm_id); ?>" data-member-id="<?php echo esc_attr($member_id); ?>" title="<?php esc_attr_e('Send Invite Link', 'seamless-addon'); ?>">
                                                <!-- <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                                </svg> -->
                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                    width="14"
                                                    height="14"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2"
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round">
                                                    <path d="M22 2L11 13"></path>
                                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                                </svg>
                                            </button>
                                        <?php endif; ?>
                                    <?php elseif ($member_status === 'declined'): ?>
                                        <span class="seamless-user-dashboard-org-status-badge seamless-org-status-declined">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                                <line x1="9" y1="9" x2="15" y2="15"></line>
                                            </svg>
                                            <?php _e('Declined', 'seamless-addon'); ?>
                                        </span>
                                    <?php endif; ?>

                                    <?php if (($gm_is_owner || $gm_is_admin) && $member_role !== 'owner'): ?>
                                        <button class="seamless-user-dashboard-org-remove-btn" data-membership-id="<?php echo esc_attr($gm_id); ?>" data-member-id="<?php echo esc_attr($member_id); ?>" title="<?php esc_attr_e('Remove Member', 'seamless-addon'); ?>">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        </div>
    <?php endforeach; ?>
</div>

<!-- Add Member Modal -->
<div class="seamless-user-dashboard-org-add-modal" id="seamless-org-add-member-modal" style="display: none;">
    <div class="seamless-user-dashboard-modal-overlay"></div>
    <div class="seamless-user-dashboard-modal-container">
        <div class="seamless-user-dashboard-modal-header">
            <h3 class="seamless-user-dashboard-modal-title"><?php _e('Organization Members Management', 'seamless-addon'); ?></h3>
            <button class="seamless-user-dashboard-modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="seamless-user-dashboard-modal-body">
            <div class="seamless-user-dashboard-org-import-box">
                <div class="seamless-org-import-header">
                    <span class="seamless-org-import-title"><?php _e('Bulk Import via CSV', 'seamless-addon'); ?></span>
                    <button type="button" class="seamless-org-import-template-btn" id="seamless-org-download-template-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        <?php _e('Download Template', 'seamless-addon'); ?>
                    </button>
                </div>
                <div class="seamless-org-import-input-wrap">
                    <label class="seamless-org-import-file-label">
                        <span class="seamless-org-import-btn"><?php _e('Choose File', 'seamless-addon'); ?></span>
                        <span class="seamless-org-import-filename"><?php _e('No file chosen', 'seamless-addon'); ?></span>
                        <input type="file" id="seamless-org-import-csv" accept=".csv" style="display: none;">
                    </label>
                </div>
            </div>

            <div class="seamless-user-dashboard-org-pricing-box" id="seamless-org-pricing-box" style="display: none;">
                <div class="seamless-org-pricing-top">
                    <div class="seamless-org-pricing-title"><?php _e('Additional Seat Pricing', 'seamless-addon'); ?></div>
                    <div class="seamless-org-pricing-amount" id="seamless-org-pricing-amount">$0.00</div>
                </div>
                <div class="seamless-org-pricing-middle">
                    <div class="seamless-org-pricing-base-price" id="seamless-org-pricing-base-price">Base price: $0.00/seat</div>
                    <div class="seamless-org-pricing-prorated-pill" id="seamless-org-pricing-prorated-pill" style="display: none;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span><?php _e('Prorated', 'seamless-addon'); ?> (<span id="seamless-org-pricing-days-remaining">0</span> <?php _e('days remaining)', 'seamless-addon'); ?></span>
                    </div>
                    <div class="seamless-org-pricing-per-seat"><?php _e('per additional seat', 'seamless-addon'); ?></div>
                </div>
                <div class="seamless-org-pricing-remaining-seats" id="seamless-org-pricing-remaining-seats">
                    0 seats remaining at no extra charge
                </div>
            </div>

            <div class="seamless-user-dashboard-org-add-form">
                <div class="seamless-user-dashboard-org-add-row" data-row-index="0">
                    <div class="seamless-user-dashboard-org-add-field">
                        <label><?php _e('First Name', 'seamless-addon'); ?> <span class="required">*</span></label>
                        <input type="text" name="member_first_name[]" placeholder="<?php esc_attr_e('e.g. John', 'seamless-addon'); ?>" required>
                    </div>
                    <div class="seamless-user-dashboard-org-add-field">
                        <label><?php _e('Last Name', 'seamless-addon'); ?> <span class="required">*</span></label>
                        <input type="text" name="member_last_name[]" placeholder="<?php esc_attr_e('e.g. Doe', 'seamless-addon'); ?>" required>
                    </div>
                    <div class="seamless-user-dashboard-org-add-field">
                        <label><?php _e('Email', 'seamless-addon'); ?> <span class="required">*</span></label>
                        <input type="email" name="member_email[]" placeholder="<?php esc_attr_e('e.g. john@company.com', 'seamless-addon'); ?>" required>
                    </div>
                    <div class="seamless-user-dashboard-org-add-field seamless-user-dashboard-org-add-field-role">
                        <label><?php _e('Role', 'seamless-addon'); ?></label>
                        <div class="seamless-user-dashboard-org-role-wrap">
                            <select name="member_role[]">
                                <option value="member"><?php _e('Member', 'seamless-addon'); ?></option>
                                <option value="admin"><?php _e('Admin', 'seamless-addon'); ?></option>
                            </select>
                            <button type="button" class="seamless-user-dashboard-org-remove-row-btn" aria-label="Remove Row" title="<?php esc_attr_e('Remove Member', 'seamless-addon'); ?>">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
        <div class="seamless-user-dashboard-modal-footer">
            <button type="button" class="seamless-user-dashboard-org-add-another-btn">
                <?php _e('ADD ANOTHER ROW', 'seamless-addon'); ?>
            </button>
            <div class="seamless-user-dashboard-modal-actions">
                <button class="seamless-user-dashboard-btn seamless-user-dashboard-btn-cancel seamless-user-dashboard-org-add-cancel">
                    <?php _e('CANCEL', 'seamless-addon'); ?>
                </button>
                <button class="seamless-user-dashboard-btn seamless-user-dashboard-btn-save seamless-user-dashboard-org-add-confirm" data-membership-id="">
                    <span class="seamless-user-dashboard-org-add-confirm-text"><?php _e('SEND INVITATIONS', 'seamless-addon'); ?></span>
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Seat Capacity Warning Modal -->
<div class="seamless-user-dashboard-org-add-modal" id="seamless-org-seat-warning-modal" style="display: none;">
    <div class="seamless-user-dashboard-modal-overlay"></div>
    <div class="seamless-user-dashboard-modal-container warning-modal">
        <div class="seamless-user-dashboard-modal-header">
            <h3 class="seamless-user-dashboard-modal-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 10px; vertical-align: middle;">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <?php _e('Seat Capacity Warning', 'seamless-addon'); ?>
            </h3>
            <button class="seamless-user-dashboard-modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="seamless-user-dashboard-modal-body">
            <div class="seamless-org-warning-message-box">
                <p><?php printf(
                        __('You are adding <strong>%s</strong> additional member(s) which will exceed your seat capacity (%s/%s). Additional payment of %s is required to add these members.', 'seamless-addon'),
                        '<span id="warning-invited-count">0</span>',
                        '<span id="warning-total-members">0</span>',
                        '<span id="warning-group-seats">0</span>',
                        '<span id="warning-total-cost">$0.00</span>'
                    ); ?></p>
            </div>

            <div class="seamless-org-warning-details">
                <div class="seamless-org-warning-item">
                    <span class="label"><?php _e('Additional Members', 'seamless-addon'); ?></span>
                    <span class="value" id="warning-additional-count">0</span>
                </div>
                <div class="seamless-org-warning-item total-cost">
                    <span class="label"><?php _e('Additional Cost', 'seamless-addon'); ?></span>
                    <span class="value" id="warning-additional-cost">$0.00</span>
                </div>
            </div>
            <p class="seamless-org-warning-note">
                <?php _e('Click "Proceed to Payment" to continue with adding these members. You will be redirected to our secure payment gateway.', 'seamless-addon'); ?>
            </p>
        </div>
        <div class="seamless-user-dashboard-modal-footer">
            <div class="seamless-user-dashboard-modal-actions">
                <button class="seamless-user-dashboard-btn seamless-user-dashboard-btn-cancel seamless-org-warning-cancel">
                    <?php _e('CANCEL', 'seamless-addon'); ?>
                </button>
                <button class="seamless-user-dashboard-btn seamless-user-dashboard-btn-save seamless-org-warning-proceed">
                    <?php _e('PROCEED TO PAYMENT', 'seamless-addon'); ?>
                </button>
            </div>
        </div>
    </div>
</div>
</div>