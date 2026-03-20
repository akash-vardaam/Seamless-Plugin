<?php

namespace SeamlessAddon\Integrations\Elementor\DynamicTags\MembershipTags;

use Elementor\Core\DynamicTags\Data_Tag;
use Elementor\Controls_Manager;
use SeamlessAddon\Services\MembershipService;

class MembershipImage extends Data_Tag
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
        return 'seamless-membership-image';
    }

    public function get_title()
    {
        return __('Membership Image', 'seamless-addon');
    }

    public function get_group()
    {
        return 'seamless-memberships';
    }

    public function get_categories()
    {
        return [\Elementor\Modules\DynamicTags\Module::IMAGE_CATEGORY];
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
            'fallback_image',
            [
                'label' => __('Fallback Image', 'seamless-addon'),
                'type' => Controls_Manager::MEDIA,
            ]
        );
    }

    public function get_value(array $options = [])
    {
        $settings = $this->get_settings();
        $membership = $this->get_membership($settings);

        if ($membership && !empty($membership['image_url'])) {
            return ['url' => $membership['image_url']];
        } elseif ($membership && !empty($membership['featured_image'])) {
            return ['url' => $membership['featured_image']];
        } elseif (!empty($settings['fallback_image']['url'])) {
            return $settings['fallback_image'];
        }

        return [];
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
