<?php
namespace {
    define('ABSPATH', true);
    define('WPINC', true);
    define('SEAMLESS_REACT_DIR', __DIR__ . '/seamless-addons-react/plugin/');
    define('SEAMLESS_REACT_SRC_DIR', __DIR__ . '/seamless-addons-react/plugin/src/');
    define('SEAMLESS_REACT_URL', 'http://example.com/');
    function esc_html__($t, $d) { return $t; }
    function esc_attr($t) { return $t; }
    function get_option($k, $d = false) { return $d; }
    function add_action($h, $c) {}
    function add_filter($h, $c) {}
    function add_shortcode($t, $c) {}
    function did_action($h) { return true; }
    function is_admin() { return true; }
    function plugin_dir_path($f) { return dirname($f) . '/'; }
    function plugin_dir_url($f) { return 'http://example.com/'; }
    function plugin_basename($f) { return basename($f); }
}

namespace Elementor {
    class Widget_Base {
        public function start_controls_section($l, $s) {}
        public function add_control($l, $s) {}
        public function end_controls_section() {}
        public function add_responsive_control($l, $s) {}
        public function add_group_control($l, $s) {}
    }
    class Controls_Manager { 
        const TAB_CONTENT = 'content'; 
        const TEXT = 'text'; 
        const SELECT = 'select'; 
        const NUMBER = 'number'; 
        const SWITCHER = 'switcher';
        const COLOR = 'color';
        const HEADING = 'heading';
        const SLIDER = 'slider';
        const DIMENSIONS = 'dimensions';
        const TAB_STYLE = 'style';
        const RAW_HTML = 'raw_html';
    }
    class Group_Control_Typography { public static function get_type() { return 'typography'; } }
    class Group_Control_Border { public static function get_type() { return 'border'; } }
    class Group_Control_Box_Shadow { public static function get_type() { return 'box_shadow'; } }
}

namespace {
    require_once 'seamless-addons-react/plugin/src/Autoloader.php';
    \SeamlessReact\Autoloader::get_instance();
    
    $widgets = [
        'CoursesListWidget',
        'EventAdditionalDetailsWidget',
        'EventBreadcrumbsWidget',
        'EventDescriptionWidget',
        'EventExcerptWidget',
        'EventFeaturedImageWidget',
        'EventLocationWidget',
        'EventRegisterURLWidget',
        'EventSchedulesWidget',
        'EventSidebarWidget',
        'EventTicketsWidget',
        'EventTitleWidget',
        'EventsListWidget',
        'LoginButtonWidget',
        'MembershipComparePlansWidget',
        'MembershipsListWidget',
        'SingleEventWidget',
        'UserDashboardWidget',
    ];

    foreach ($widgets as $widget) {
        $class = "SeamlessReact\\Elementor\\Widgets\\$widget";
        echo "Testing $class...\n";
        try {
            $instance = new $class();
            echo "Success: $class instantiated.\n";
        } catch (\Throwable $e) {
            echo "FAILED: $class - " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine() . "\n";
        }
    }
}
