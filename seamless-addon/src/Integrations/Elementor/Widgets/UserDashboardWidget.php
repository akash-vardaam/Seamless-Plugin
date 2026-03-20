<?php

namespace SeamlessAddon\Integrations\Elementor\Widgets;

use SeamlessAddon\Integrations\Elementor\Widgets\Base\BaseWidget;
// UserProfile is no longer needed here for data fetching
// use Seamless\Operations\UserProfile; 

/**
 * User Dashboard Widget
 * 
 * Displays user dashboard with profile, memberships, and order history.
 * Includes edit profile functionality.
 */
class UserDashboardWidget extends BaseWidget
{
    /**
     * Get widget name.
     */
    public function get_name()
    {
        return 'seamless-user-dashboard';
    }

    /**
     * Get widget title.
     */
    public function get_title()
    {
        return __('User Dashboard', 'seamless-addon');
    }

    /**
     * Get widget icon.
     */
    public function get_icon()
    {
        return 'eicon-user-circle-o';
    }

    /**
     * Get widget keywords.
     */
    public function get_keywords()
    {
        return ['seamless', 'user', 'dashboard', 'profile', 'membership', 'orders'];
    }

    /**
     * Register widget controls.
     */
    protected function register_controls()
    {
        // Content Section
        $this->start_controls_section(
            'content_section',
            [
                'label' => __('Content', 'seamless-addon'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'show_membership_tab',
            [
                'label' => __('Show Membership Tab', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => __('Show', 'seamless-addon'),
                'label_off' => __('Hide', 'seamless-addon'),
                'return_value' => 'yes',
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_orders_tab',
            [
                'label' => __('Show Orders Tab', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => __('Show', 'seamless-addon'),
                'label_off' => __('Hide', 'seamless-addon'),
                'return_value' => 'yes',
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_courses_tab',
            [
                'label' => __('Show Courses Tab', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => __('Show', 'seamless-addon'),
                'label_off' => __('Hide', 'seamless-addon'),
                'return_value' => 'yes',
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_profile_tab',
            [
                'label' => __('Show Profile Tab', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => __('Show', 'seamless-addon'),
                'label_off' => __('Hide', 'seamless-addon'),
                'return_value' => 'yes',
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'orders_per_page',
            [
                'label' => __('Orders Per Page', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::NUMBER,
                'default' => 6,
                'min' => 1,
                'max' => 50,
                'description' => __('Number of orders to display per page', 'seamless-addon'),
            ]
        );

        $this->end_controls_section();

        // Style Section - Profile Card
        $this->start_controls_section(
            'profile_card_style_section',
            [
                'label' => __('Profile Card', 'seamless-addon'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'profile_text_color',
            [
                'label' => __('Text Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-user-dashboard-profile-name' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .seamless-user-dashboard-profile-email' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'profile_bg_color',
            [
                'label' => __('Background Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-user-dashboard-profile-card' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Style Section - Sidebar Navigation
        $this->start_controls_section(
            'sidebar_nav_style_section',
            [
                'label' => __('Sidebar Navigation', 'seamless-addon'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->start_controls_tabs('nav_colors');

        $this->start_controls_tab(
            'nav_normal',
            [
                'label' => __('Normal', 'seamless-addon'),
            ]
        );

        $this->add_control(
            'nav_text_color',
            [
                'label' => __('Text Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-user-dashboard-nav-item' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .seamless-user-dashboard-nav-item svg' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'nav_bg_color',
            [
                'label' => __('Background Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-user-dashboard-nav-item' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->start_controls_tab(
            'nav_hover',
            [
                'label' => __('Hover', 'seamless-addon'),
            ]
        );

        $this->add_control(
            'nav_hover_text_color',
            [
                'label' => __('Text Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-user-dashboard-nav-item:hover' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .seamless-user-dashboard-nav-item:hover svg' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'nav_hover_bg_color',
            [
                'label' => __('Background Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-user-dashboard-nav-item:hover' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->start_controls_tab(
            'nav_active',
            [
                'label' => __('Active', 'seamless-addon'),
            ]
        );

        $this->add_control(
            'nav_active_text_color',
            [
                'label' => __('Text Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-user-dashboard-nav-item.active' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .seamless-user-dashboard-nav-item.active svg' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'nav_active_bg_color',
            [
                'label' => __('Background Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-user-dashboard-nav-item.active' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'nav_active_border_color',
            [
                'label' => __('Border Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-user-dashboard-nav-item.active' => 'border-left-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->end_controls_tabs();

        $this->end_controls_section();

        // Style Section - Tabs
        $this->start_controls_section(
            'tabs_style_section',
            [
                'label' => __('Content Tabs', 'seamless-addon'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->start_controls_tabs('tab_colors');

        $this->start_controls_tab(
            'tab_normal',
            [
                'label' => __('Normal', 'seamless-addon'),
            ]
        );

        $this->add_control(
            'tab_text_color',
            [
                'label' => __('Text Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-user-dashboard-tab' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'tab_bg_color',
            [
                'label' => __('Background Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-user-dashboard-tab' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'tab_border_color',
            [
                'label' => __('Border Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-user-dashboard-tab' => 'border-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->start_controls_tab(
            'tab_active',
            [
                'label' => __('Active', 'seamless-addon'),
            ]
        );

        $this->add_control(
            'tab_active_text_color',
            [
                'label' => __('Text Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-user-dashboard-tab.active' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'tab_active_bg_color',
            [
                'label' => __('Background Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-user-dashboard-tab.active' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'tab_active_border_color',
            [
                'label' => __('Border Color', 'seamless-addon'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-user-dashboard-tab.active' => 'border-bottom-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->end_controls_tabs();

        $this->end_controls_section();
    }
    /**
     * Render widget output.
     */
    protected function render()
    {
        // Check if user is logged in
        if (!is_user_logged_in()) {
            echo '<div class="seamless-user-dashboard-notice">';
            echo '<p>' . __('Please log in to view your dashboard.', 'seamless-addon') . '</p>';
            if (shortcode_exists('seamless_login_button')) {
                echo do_shortcode('[seamless_login_button text="Sign in to view your dashboard" class="seamless-premium-btn seamless-login-btn"]');
            }
            echo '</div>';
            return;
        }

        $settings = $this->get_settings_for_display();
        $widget_id = $this->get_id();

        // No longer fetching data here. 
        // We load the "Shell" template which contains spinners.
        // Javascript will then fetch the data via AJAX.

        // Include the template from main plugin
        include WP_PLUGIN_DIR . '/seamless-wordpress-plugin/src/Public/templates/tpl-user-dashboard.php';
    }
}
