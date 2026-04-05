<?php
namespace SeamlessReact\Elementor\Widgets;

if ( ! class_exists( 'Elementor\\Widget_Base' ) ) { return; }

if ( ! defined( 'ABSPATH' ) ) exit;

class LoginButtonWidget extends \Elementor\Widget_Base {

	public function get_name() { return 'seamless-react-login_button'; }
	public function get_title() { return esc_html__( 'SSO Login Button', 'seamless-react' ); }
	public function get_icon() { return 'eicon-lock-user'; }
	public function get_categories() { return [ 'seamless-react' ]; }

	protected function register_controls() { }

    /**
     * Render widget output.
     */
    protected function render() {
        $settings = $this->get_settings_for_display();
        $button_text = $settings['button_text'] ?? esc_html__( 'Login to Dashboard', 'seamless-react' );
        
        if ( is_user_logged_in() ) {
            $dashboard_url = get_option( 'seamless_react_dashboard_page', home_url( '/dashboard/' ) );
            printf( '<a href="%s" class="seamless-react-btn seamless-react-login-btn">%s</a>', esc_url( $dashboard_url ), esc_html( $button_text ) );
        } else {
            $login_url = add_query_arg( 'sso_react_login', '1', home_url( '/' ) );
            printf( '<a href="%s" class="seamless-react-btn seamless-react-login-btn">%s</a>', esc_url( $login_url ), esc_html( $button_text ) );
        }
    }
}



