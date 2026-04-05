<?php

namespace SeamlessAddon\Integrations\Elementor\DynamicTags\MembershipTags;

use Elementor\Core\DynamicTags\Tag;
use Elementor\Controls_Manager;
use SeamlessAddon\Services\MembershipService;
use SeamlessAddon\Helpers\Helper;

class MembershipDescription extends Tag
{

    /**
     * Get membership service.
     */
    private function get_membership_service()
    {
        return \SeamlessAddon\Integrations\Elementor\ElementorIntegration::get_membership_service();
    }



    public function get_name()
    {
        return 'seamless-membership-description';
    }

    public function get_title()
    {
        return __('Membership Description', 'seamless-addon');
    }

    public function get_group()
    {
        return 'seamless-memberships';
    }

    public function get_categories()
    {
        return [\Elementor\Modules\DynamicTags\Module::TEXT_CATEGORY];
    }

    protected function register_controls()
    {
        $this->add_control(
            'auto_detect_info',
            [
                'type' => Controls_Manager::RAW_HTML,
                'raw' => '<div style="padding: 10px; background: #0a1a3d; border-left: 3px solid #2563eb; color: #fff; font-style: italic; font-size: 12px; font-weight: 300;">' .
                    __('Automatically detects membership data from URL on single membership pages.', 'seamless-addon') .
                    '</div>',
                'content_classes' => 'elementor-panel-alert elementor-panel-alert-info',
            ]
        );

        $this->add_control(
            'char_limit',
            [
                'label' => __('Character Limit', 'seamless-addon'),
                'type' => Controls_Manager::NUMBER,
                'default' => 0,
            ]
        );
    }

    public function render()
    {
        $settings = $this->get_settings();
        $membership = $this->get_membership($settings);

        if (!$membership || !isset($membership['description'])) {
            return;
        }

        $description = wp_strip_all_tags($membership['description']);

        if ($settings['char_limit'] > 0) {
            $description = Helper::truncate($description, $settings['char_limit']);
        }

        echo esc_html($description);
    }

    private function get_membership($settings)
    {
        // Always auto-detect from context
        $membership_data = $this->get_membership_service()->get_membership_by_context();
        return ($membership_data && $membership_data['success']) ? $membership_data['data'] : null;
    }

    private function get_membership_options()
    {
        $memberships_data = $this->get_membership_service()->get_recent_memberships(20);
        if (!$memberships_data['success'] || empty($memberships_data['data'])) {
            return [];
        }

        $options = [];
        foreach ($memberships_data['data'] as $membership) {
            if (isset($membership['id'])) {
                $name = $membership['name'] ?? $membership['title'] ?? 'Membership #' . $membership['id'];
                $options[$membership['id']] = $name;
            }
        }
        return $options;
    }
}
