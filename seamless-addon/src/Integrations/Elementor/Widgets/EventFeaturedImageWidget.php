<?php

namespace SeamlessAddon\Integrations\Elementor\Widgets;

use SeamlessAddon\Integrations\Elementor\Widgets\Base\BaseWidget;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Border;
use Elementor\Group_Control_Box_Shadow;
use Elementor\Group_Control_Css_Filter;
use function esc_attr;
use function esc_html;
use function esc_url;
use function site_url;
use function wp_kses_post;

/**
 * Event Featured Image Widget
 *
 * Displays the event's main/featured image.
 */
class EventFeaturedImageWidget extends BaseWidget
{
    /**
     * Get widget name.
     */
    public function get_name()
    {
        return 'seamless-event-featured-image';
    }

    /**
     * Get widget title.
     */
    public function get_title()
    {
        return __('Event Featured Image', 'seamless-addon');
    }

    /**
     * Get widget icon.
     */
    public function get_icon()
    {
        return 'eicon-image';
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
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_event_selection_controls();

        $this->add_control(
            'link_to',
            [
                'label' => __('Link', 'seamless-addon'),
                'type' => Controls_Manager::SELECT,
                'default' => 'none',
                'options' => [
                    'none' => __('None', 'seamless-addon'),
                    'event' => __('Event Page', 'seamless-addon'),
                    'custom' => __('Custom URL', 'seamless-addon'),
                ],
            ]
        );

        $this->add_control(
            'custom_link',
            [
                'label' => __('Custom URL', 'seamless-addon'),
                'type' => Controls_Manager::URL,
                'dynamic' => [
                    'active' => true,
                ],
                'condition' => [
                    'link_to' => 'custom',
                ],
                'show_external' => true,
            ]
        );

        $this->add_control(
            'caption_source',
            [
                'label' => __('Caption', 'seamless-addon'),
                'type' => Controls_Manager::SELECT,
                'default' => 'none',
                'options' => [
                    'none' => __('None', 'seamless-addon'),
                    'event_title' => __('Event Title', 'seamless-addon'),
                    'custom' => __('Custom Caption', 'seamless-addon'),
                ],
            ]
        );

        $this->add_control(
            'caption_text',
            [
                'label' => __('Custom Caption', 'seamless-addon'),
                'type' => Controls_Manager::TEXT,
                'dynamic' => [
                    'active' => true,
                ],
                'condition' => [
                    'caption_source' => 'custom',
                ],
            ]
        );

        $this->add_control(
            'fallback_image',
            [
                'label' => __('Fallback Image', 'seamless-addon'),
                'type' => Controls_Manager::MEDIA,
                'default' => [
                    'url' => SEAMLESS_ADDON_PLUGIN_URL . 'assets/images/placeholder-image.png',
                ],
                'description' => __('This image will be displayed if the event has no featured image.', 'seamless-addon'),
            ]
        );

        $this->end_controls_section();

        // Style Section
        $this->start_controls_section(
            'style_section',
            [
                'label' => __('Image', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
            'align',
            [
                'label' => __('Alignment', 'seamless-addon'),
                'type' => Controls_Manager::CHOOSE,
                'options' => [
                    'left' => [
                        'title' => __('Left', 'seamless-addon'),
                        'icon' => 'eicon-text-align-left',
                    ],
                    'center' => [
                        'title' => __('Center', 'seamless-addon'),
                        'icon' => 'eicon-text-align-center',
                    ],
                    'right' => [
                        'title' => __('Right', 'seamless-addon'),
                        'icon' => 'eicon-text-align-right',
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-featured-image' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'image_width',
            [
                'label' => __('Width', 'seamless-addon'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', '%', 'em', 'rem', 'vw'],
                'range' => [
                    '%' => [
                        'min' => 1,
                        'max' => 100,
                    ],
                    'px' => [
                        'min' => 1,
                        'max' => 1000,
                    ],
                    'vw' => [
                        'min' => 1,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-featured-image img' => 'width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'image_max_width',
            [
                'label' => __('Max Width', 'seamless-addon'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', '%', 'em', 'rem', 'vw'],
                'range' => [
                    '%' => [
                        'min' => 1,
                        'max' => 100,
                    ],
                    'px' => [
                        'min' => 1,
                        'max' => 1000,
                    ],
                    'vw' => [
                        'min' => 1,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-featured-image img' => 'max-width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'image_height',
            [
                'label' => __('Height', 'seamless-addon'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', '%', 'vh', 'em', 'rem'],
                'range' => [
                    'px' => [
                        'min' => 1,
                        'max' => 800,
                    ],
                    'vh' => [
                        'min' => 1,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-featured-image img' => 'height: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'object_fit',
            [
                'label' => __('Object Fit', 'seamless-addon'),
                'type' => Controls_Manager::SELECT,
                'default' => '',
                'options' => [
                    '' => __('Default', 'seamless-addon'),
                    'fill' => __('Fill', 'seamless-addon'),
                    'cover' => __('Cover', 'seamless-addon'),
                    'contain' => __('Contain', 'seamless-addon'),
                    'scale-down' => __('Scale Down', 'seamless-addon'),
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-featured-image img' => 'object-fit: {{VALUE}};',
                ],
                'condition' => [
                    'image_height[size]!' => '',
                ],
            ]
        );

        $this->add_responsive_control(
            'object_position',
            [
                'label' => __('Object Position', 'seamless-addon'),
                'type' => Controls_Manager::SELECT,
                'default' => 'center center',
                'options' => [
                    'center center' => __('Center Center', 'seamless-addon'),
                    'center left' => __('Center Left', 'seamless-addon'),
                    'center right' => __('Center Right', 'seamless-addon'),
                    'top center' => __('Top Center', 'seamless-addon'),
                    'top left' => __('Top Left', 'seamless-addon'),
                    'top right' => __('Top Right', 'seamless-addon'),
                    'bottom center' => __('Bottom Center', 'seamless-addon'),
                    'bottom left' => __('Bottom Left', 'seamless-addon'),
                    'bottom right' => __('Bottom Right', 'seamless-addon'),
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-featured-image img' => 'object-position: {{VALUE}};',
                ],
                'condition' => [
                    'image_height[size]!' => '',
                ],
            ]
        );

        $this->add_responsive_control(
            'image_border_radius',
            [
                'label' => __('Border Radius', 'seamless-addon'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-featured-image img' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name' => 'image_border',
                'selector' => '{{WRAPPER}} .seamless-event-featured-image img',
            ]
        );

        $this->add_group_control(
            Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'image_box_shadow',
                'selector' => '{{WRAPPER}} .seamless-event-featured-image img',
            ]
        );

        $this->add_group_control(
            Group_Control_Css_Filter::get_type(),
            [
                'name' => 'image_css_filters',
                'selector' => '{{WRAPPER}} .seamless-event-featured-image img',
            ]
        );

        $this->add_control(
            'image_opacity',
            [
                'label' => __('Opacity', 'seamless-addon'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 1,
                        'step' => 0.1,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-featured-image img' => 'opacity: {{SIZE}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Caption Style
        $this->start_controls_section(
            'caption_style_section',
            [
                'label' => __('Caption', 'seamless-addon'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'caption_typography',
                'selector' => '{{WRAPPER}} .seamless-event-featured-caption',
            ]
        );

        $this->add_control(
            'caption_color',
            [
                'label' => __('Color', 'seamless-addon'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-featured-caption' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'caption_margin',
            [
                'label' => __('Margin', 'seamless-addon'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .seamless-event-featured-caption' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();
    }

    /**
     * Render widget output.
     */
    protected function render()
    {
        $settings = $this->get_settings_for_display();
        $event = $this->get_event_data($settings);

        // Use preview data in Elementor editor
        if (!$event && \Elementor\Plugin::$instance->editor->is_edit_mode()) {
            $event = $this->get_preview_event_data();
        }

        if (!$event) {
            return;
        }

        $image_url = '';
        if (!empty($event['featured_image'])) {
            $image_url = $event['featured_image'];
        } elseif (!empty($event['image_url'])) {
            $image_url = $event['image_url'];
        }

        // Use fallback image if no event image is available
        if (empty($image_url) && !empty($settings['fallback_image']['url'])) {
            $image_url = $settings['fallback_image']['url'];
        }

        // If still no image, return
        if (empty($image_url)) {
            return;
        }

        $alt = !empty($event['title']) ? $event['title'] : '';

        $link_to = $settings['link_to'] ?? 'none';
        $link_url = '';

        if ('event' === $link_to && !empty($event['slug'])) {
            $link_url = site_url('/event/' . $event['slug']);
        } elseif ('custom' === $link_to && !empty($settings['custom_link']['url'])) {
            $link_url = $settings['custom_link']['url'];
        }

        $caption_html = '';
        $caption_source = $settings['caption_source'] ?? 'none';
        if ('event_title' === $caption_source && !empty($event['title'])) {
            $caption_html = esc_html($event['title']);
        } elseif ('custom' === $caption_source && !empty($settings['caption_text'])) {
            $caption_html = wp_kses_post($settings['caption_text']);
        }
?>
        <div class="seamless-event-featured-image">
            <?php if ($link_url) :
                $is_external = !empty($settings['custom_link']['is_external']);
                $nofollow = !empty($settings['custom_link']['nofollow']);
                $rel_parts = [];
                if ($nofollow) {
                    $rel_parts[] = 'nofollow';
                }
                $rel_attr = $rel_parts ? ' rel="' . esc_attr(implode(' ', $rel_parts)) . '"' : '';
                $target_attr = $is_external ? ' target="_blank"' : '';
            ?>
                <a href="<?php echo esc_url($link_url); ?>" <?php echo $target_attr . $rel_attr; ?>>
                    <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($alt); ?>" />
                </a>
            <?php else : ?>
                <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($alt); ?>" />
            <?php endif; ?>

            <?php if ($caption_html) : ?>
                <div class="seamless-event-featured-caption"><?php echo $caption_html; ?></div>
            <?php endif; ?>
        </div>
<?php
    }
}
