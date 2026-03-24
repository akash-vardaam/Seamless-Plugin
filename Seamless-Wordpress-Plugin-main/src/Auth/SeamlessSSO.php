<?php

namespace Seamless\Auth;

use Seamless\Auth\SeamlessCallbackHandler;
use Exception;
use Random\RandomException;
use WP_Error;
use WP_REST_Request;
use WP_Session_Tokens;
use WP_User;
use Seamless\Auth\Helper;

/**
 * Class SeamlessSSO
 * Manages WordPress integration for Seamless SSO, including URL generation.
 */
class SeamlessSSO
{
    const SSO_PREFIX = 'seamless_sso';
    const REST_NAMESPACE = 'seamless-oauth/v1';
    const NONCE_ACTION = 'seamless_sso_state';
    const LOGIN_ROUTE = 'auth/login';
    const LOGOUT_ROUTE = 'logout';
    const PKCE_TRANSIENT_PREFIX = 'seamless_sso_pkce_';
    const PKCE_TTL = 900;

    private string $client_domain;
    private string $sso_client_id;

    public function __construct()
    {
        $this->client_domain = rtrim(get_option('seamless_client_domain', ''), '/');
        $this->sso_client_id = get_option('seamless_sso_client_id', '');

        add_action('init', [$this, 'register_login_rewrite_rule']);
        add_action('query_vars', [$this, 'add_login_query_vars']);
        add_action('template_redirect', [$this, 'handle_login_redirect']);
        add_action('rest_api_init', [$this, 'register_rest_routes']);
        add_shortcode('seamless_login_button', [$this, 'render_login_button']);
    }

    public function register_login_rewrite_rule(): void
    {
        add_rewrite_rule('^' . self::LOGIN_ROUTE . '/?$', 'index.php?sso_login_redirect=1', 'top');
        add_rewrite_rule('^' . self::LOGOUT_ROUTE . '/?$', 'index.php?sso_logout_redirect=1', 'top');
    }

    public function add_login_query_vars(array $vars): array
    {
        $vars[] = 'sso_login_redirect';
        $vars[] = 'sso_logout_redirect';
        return $vars;
    }

    public function handle_login_redirect(): void
    {
        if (get_query_var('sso_login_redirect')) {
            $this->ensure_session_started();

            $return_to = $this->resolve_return_to_url();
            $login_url = $this->get_login_url($return_to);

            wp_redirect($login_url);
            exit;
        }

        if (get_query_var('sso_logout_redirect')) {
            $this->ensure_session_started();
            Helper::log('SeamlessSSO | handle_login_redirect | Detected logout route');
            $this->handle_logout_redirect();
            return;
        }
    }

    // --- REST API Callback ---

    public function register_rest_routes(): void
    {
        register_rest_route(self::REST_NAMESPACE, '/callback', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_oauth_callback'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::REST_NAMESPACE, '/logout-user', [
            'methods' => 'POST',
            'callback' => [$this, 'custom_logout_user'],
            'permission_callback' => '__return_true',
        ]);
    }

    private function ensure_session_started(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public static function get_return_to_url(): string
    {
        $return_to = $_GET['return_to'] ?? null;
        if ($return_to) {
            return esc_url_raw(wp_unslash($return_to));
        }

        return isset($_SERVER['HTTP_REFERER'])
            ? esc_url_raw($_SERVER['HTTP_REFERER'])
            : home_url('/');
    }

    private function resolve_return_to_url(): string
    {
        $requested_return_to = $this->sanitize_internal_return_url($_GET['return_to'] ?? null);
        if ($requested_return_to) {
            return $requested_return_to;
        }

        $fallback_url = $this->get_post_login_redirect_url();
        $referer = $this->sanitize_internal_return_url($_SERVER['HTTP_REFERER'] ?? null);

        if (!$referer) {
            return $fallback_url;
        }

        if ($this->is_auth_route_url($referer)) {
            return $fallback_url;
        }

        $referer_post_id = url_to_postid($referer);
        if ($referer_post_id > 0) {
            $post = get_post($referer_post_id);
            $content = $post ? (string) $post->post_content : '';

            if ($this->content_has_shortcode($content, 'seamless_login_button')) {
                return $fallback_url;
            }
        }

        return $referer;
    }

    private function sanitize_internal_return_url($url): string
    {
        if (!is_string($url) || trim($url) === '') {
            return '';
        }

        $url = esc_url_raw(wp_unslash($url));
        if ($url === '') {
            return '';
        }

        $home_host = wp_parse_url(home_url('/'), PHP_URL_HOST);
        $target_host = wp_parse_url($url, PHP_URL_HOST);

        if ($target_host && $home_host && strcasecmp((string) $target_host, (string) $home_host) !== 0) {
            return '';
        }

        return $url;
    }

    private function is_auth_route_url(string $url): bool
    {
        $normalized = untrailingslashit($url);

        return in_array($normalized, [
            untrailingslashit(home_url(self::LOGIN_ROUTE)),
            untrailingslashit(home_url(self::LOGOUT_ROUTE)),
            untrailingslashit(rest_url(self::REST_NAMESPACE . '/callback')),
        ], true);
    }

    private function content_has_shortcode(string $content, string $shortcode): bool
    {
        return $content !== '' && function_exists('has_shortcode') && has_shortcode($content, $shortcode);
    }

    private function get_post_login_redirect_url(): string
    {
        $configured_url = $this->sanitize_internal_return_url(get_option('seamless_redirect_url', ''));
        if ($configured_url) {
            return $configured_url;
        }

        $dashboard_page = get_page_by_path('dashboard');
        if ($dashboard_page instanceof \WP_Post && $dashboard_page->post_status === 'publish') {
            return get_permalink($dashboard_page);
        }

        $dashboard_page = $this->find_page_with_shortcodes([
            'seamless_user_dashboard',
            'seamless_dashboard',
        ]);

        if ($dashboard_page instanceof \WP_Post) {
            $permalink = get_permalink($dashboard_page);
            if (is_string($permalink) && $permalink !== '') {
                return $permalink;
            }
        }

        return home_url('/');
    }

    private function find_page_with_shortcodes(array $shortcodes): ?\WP_Post
    {
        $pages = get_posts([
            'post_type' => 'page',
            'post_status' => 'publish',
            'numberposts' => -1,
            'suppress_filters' => false,
        ]);

        foreach ($pages as $page) {
            $content = (string) $page->post_content;

            foreach ($shortcodes as $shortcode) {
                if ($this->content_has_shortcode($content, $shortcode)) {
                    return $page;
                }
            }
        }

        return null;
    }

    /**
     * Generates the SSO login URL with PKCE and stores PKCE verifier + return URL in PHP session keyed by state.
     *
     * @param string|null $return_to Optional return URL.
     * @return string
     * @throws RandomException
     */
    public function get_login_url(?string $return_to = null): string
    {
        $scope = '';

        $code_verifier = bin2hex(random_bytes(64));
        $code_challenge = strtr(rtrim(
            base64_encode(hash('sha256', $code_verifier, true)),
            '='
        ), '+/', '-_');

        $return_to = $return_to ?: home_url('/');
        $return_to = esc_url_raw($return_to);

        $encoded_return_to = base64_encode($return_to);

        $nonce = wp_create_nonce(self::NONCE_ACTION);
        $state = $nonce . '|' . $encoded_return_to;

        // Helper::log('SeamlessSSO | get_login_url | State nonce=' . $nonce . ', return_to=' . $return_to);

        $_SESSION[self::SSO_PREFIX]['pkce'][$nonce] = [
            'verifier'   => $code_verifier,
            'created_at' => time(),
        ];

        set_transient($this->get_pkce_transient_key($nonce), [
            'verifier'   => $code_verifier,
            'created_at' => time(),
        ], self::PKCE_TTL);

        // Helper::log('SeamlessSSO | get_login_url | Stored PKCE in session with nonce=' . $nonce . ', session_id=' . session_id());

        // Build the URL
        $redirect_uri = rest_url(self::REST_NAMESPACE . '/callback');
        $query = http_build_query([
            'client_id'             => $this->sso_client_id,
            'redirect_uri'          => $redirect_uri,
            'response_type'         => 'code',
            'scope'                 => $scope,
            'state'                 => $state,
            'code_challenge'        => $code_challenge,
            'code_challenge_method' => 'S256',
        ]);

        $final_url = "{$this->client_domain}/oauth/authorize?{$query}";

        return $final_url;
    }

    public static function get_pkce_transient_key(string $nonce): string
    {
        return self::PKCE_TRANSIENT_PREFIX . md5($nonce);
    }

    public function handle_oauth_callback(WP_REST_Request $req): void
    {
        $this->ensure_session_started();
        // Helper::log('SeamlessSSO | handle_oauth_callback | Received OAuth callback request.');

        $handler = new SeamlessCallbackHandler();

        $result = $handler->handle($req);

        if (is_wp_error($result)) {
            Helper::log('SeamlessSSO | handle_oauth_callback | OAuth callback failed: ' . $result->get_error_message());
            wp_die($result);
        }
    }

    /**
     * Logout user from WordPress using email sent by Laravel.
     *
     * @param WP_REST_Request $req
     * @return array|WP_Error
     */
    public function custom_logout_user(WP_REST_Request $req)
    {
        Helper::log('SeamlessSSO | custom_logout_user | Request received');

        if (!headers_sent()) {
            foreach ($_COOKIE as $name => $value) {
                if (strpos($name, 'wordpress_logged_in') !== false || strpos($name, 'PHPSESSID') !== false) {
                    setcookie($name, '', time() - 3600, '/');
                    unset($_COOKIE[$name]);
                }
            }
            Helper::log('SeamlessSSO | custom_logout_user | Cleared auth/session cookies');
        }

        $email = sanitize_email($req->get_param('email'));

        if (!$email) {
            Helper::log('SeamlessSSO | custom_logout_user | Invalid or missing email');
            return new WP_Error('invalid_user', 'User not found or invalid email', ['status' => 400]);
        }

        $user = get_user_by('email', $email);
        if (!$user) {
            Helper::log('SeamlessSSO | custom_logout_user | No user found for email=' . $email);
            return new WP_Error('no_user', 'User not found.', ['status' => 404]);
        }

        Helper::log('SeamlessSSO | custom_logout_user | Logging out user_id=' . $user->ID);
        $session_tokens = WP_Session_Tokens::get_instance($user->ID);
        $session_tokens->destroy_all();
        Helper::log('SeamlessSSO | custom_logout_user | Destroyed WP session tokens');

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (isset($_SESSION[self::SSO_PREFIX])) {
            unset($_SESSION[self::SSO_PREFIX]);
            Helper::log('SeamlessSSO | custom_logout_user | Cleared Seamless session payload');
        }

        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
            Helper::log('SeamlessSSO | custom_logout_user | Destroyed PHP session');
        }

        Helper::log('SeamlessSSO | custom_logout_user | Redirecting to home');
        wp_redirect(home_url('/'));
        exit;
    }

    private function handle_logout_redirect(): void
    {
        Helper::log('SeamlessSSO | handle_logout_redirect | Started');
        $user = wp_get_current_user();
        if (!$user || empty($user->user_email)) {
            Helper::log('SeamlessSSO | handle_logout_redirect | No authenticated user, redirecting');
            wp_redirect(home_url('/'));
            exit;
        }

        $email = $user->user_email;
        Helper::log('SeamlessSSO | handle_logout_redirect | User identified user_id=' . $user->ID . ', email=' . $email);

        $api_url = $this->client_domain . '/api/oauth/portal/terminate-session';
        $request_body = ['user_email' => $email];
        Helper::log('SeamlessSSO | handle_logout_redirect | Calling Laravel logout API at ' . $api_url);
        $response = wp_remote_post($api_url, [
            'headers' => [
                'Content-Type'   => 'application/json',
                'Accept'         => 'application/json',
                'X-PORTAL-SECRET' => 'zTheQ4AcUnOY7GSs1SH010MQgdvhsklOYXZODcgzdioCNCGwIWnB9ephfIZhQW1B',
            ],
            'body'    => wp_json_encode($request_body),
            'timeout' => 10,
        ]);

        if (is_wp_error($response)) {
            Helper::log('SeamlessSSO | handle_logout_redirect | Laravel logout API error: ' . $response->get_error_message());
        } else {
            $status_code = wp_remote_retrieve_response_code($response);
            $content_type = wp_remote_retrieve_header($response, 'content-type');
            $response_body = (string) wp_remote_retrieve_body($response);
            $response_json = json_decode($response_body, true);

            if (is_array($response_json)) {
                Helper::log('SeamlessSSO | handle_logout_redirect | Laravel response JSON=' . wp_json_encode($response_json));
            } else {
                $snippet = substr(trim(wp_strip_all_tags($response_body)), 0, 300);
                Helper::log('SeamlessSSO | handle_logout_redirect | Non-JSON response snippet=' . $snippet);
            }

            if ($status_code < 200 || $status_code >= 300) {
                Helper::log('SeamlessSSO | handle_logout_redirect | Laravel logout API returned status ' . $status_code . ', content-type=' . $content_type);
            } else {
                Helper::log('SeamlessSSO | handle_logout_redirect | Laravel logout API success status ' . $status_code . ', content-type=' . $content_type);
            }
        }

        if (!headers_sent()) {
            foreach ($_COOKIE as $name => $value) {
                if (
                    strpos($name, 'wordpress_logged_in') !== false ||
                    strpos($name, 'PHPSESSID') !== false ||
                    strpos($name, 'wp-settings') !== false
                ) {
                    setcookie($name, '', time() - 3600, '/');
                    unset($_COOKIE[$name]);
                }
            }
            Helper::log('SeamlessSSO | handle_logout_redirect | Cleared auth/session cookies');
        }

        $session_tokens = \WP_Session_Tokens::get_instance($user->ID);
        $session_tokens->destroy_all();
        Helper::log('SeamlessSSO | handle_logout_redirect | Destroyed WP session tokens');

        if (isset($_SESSION[self::SSO_PREFIX])) {
            unset($_SESSION[self::SSO_PREFIX]);
            Helper::log('SeamlessSSO | handle_logout_redirect | Cleared Seamless session payload');
        }

        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
            Helper::log('SeamlessSSO | handle_logout_redirect | Destroyed PHP session');
        }

        Helper::log('SeamlessSSO | handle_logout_redirect | Redirecting to home');
        wp_redirect(home_url('/'));
        exit;
    }

    /**
     * Renders the SSO login button with the generated query URL.
     * @param array $atts Shortcode attributes.
     * @return string
     * @throws RandomException
     */
    public function render_login_button(array $atts): string
    {
        // Helper::log('SeamlessSSO | render_login_button | Rendering login button shortcode.');

        $atts = shortcode_atts([
            'text'          => 'Login',
            'class'         => 'button seamless-sso-login-btn',
            'logout_text'   => 'Logout',
            'logout_class'  => 'button seamless-sso-logout-btn',
        ], $atts);

        if (empty($this->sso_client_id) || empty($this->client_domain)) {
            return '<p>Seamless SSO is not configured.</p>';
        }

        if (is_user_logged_in()) {
            $logout_url = home_url(self::LOGOUT_ROUTE);

            return sprintf(
                '<a class="%s" href="%s">%s</a>',
                esc_attr($atts['logout_class']),
                esc_url($logout_url),
                esc_html($atts['logout_text'])
            );
        }

        $url = add_query_arg('return_to', $this->get_post_login_redirect_url(), home_url(self::LOGIN_ROUTE));

        return sprintf(
            '<a class="%s" href="%s">%s</a>',
            esc_attr($atts['class']),
            esc_url($url),
            esc_html($atts['text'])
        );
    }

    // --- Token Refresh ---

    public function seamless_refresh_token_if_needed(int $user_id): string|false
    {
        $expires_at = (int) get_user_meta($user_id, 'seamless_token_expires', true);
        $access_token = get_user_meta($user_id, 'seamless_access_token', true);

        if ($access_token && $expires_at > time() + 30) {
            return $access_token;
        }

        $refresh_token = get_user_meta($user_id, 'seamless_refresh_token', true);
        if (empty($refresh_token)) {
            return false;
        }

        $body = [
            'grant_type' => 'refresh_token',
            'client_id' => $this->sso_client_id,
            'refresh_token' => $refresh_token,
        ];

        $response = wp_remote_post("{$this->client_domain}/oauth/token", [
            'body' => $body,
            'headers' => ['Accept' => 'application/json'],
            'timeout' => 20,
        ]);

        // Error handling
        if (is_wp_error($response)) {
            Helper::log('SeamlessSSO | seamless_refresh_token_if_needed | Refresh request failed: ' . $response->get_error_message());
            return false;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        if (empty($data['access_token'])) {
            return false;
        }

        // Save new tokens
        update_user_meta($user_id, 'seamless_access_token', sanitize_text_field($data['access_token']));
        if (!empty($data['refresh_token'])) {
            update_user_meta($user_id, 'seamless_refresh_token', sanitize_text_field($data['refresh_token']));
        }
        $expires_in = (int)($data['expires_in'] ?? 3600);
        update_user_meta($user_id, 'seamless_token_expires', time() + $expires_in);

        return $data['access_token'];
    }
}
