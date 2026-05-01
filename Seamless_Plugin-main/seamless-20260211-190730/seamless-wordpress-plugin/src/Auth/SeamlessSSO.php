<?php

namespace Seamless\Auth;

use Seamless\Auth\SeamlessCallbackHandler;
use Exception;
use Random\RandomException;
use WP_Error;
use WP_REST_Request;
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
    const LOGOUT_ROUTE = 'auth/logout';
    const LEGACY_LOGOUT_ROUTE = 'logout';

    private string $client_domain;
    private string $sso_client_id;

    public function __construct()
    {
        $domain = get_option('seamless_client_domain', '');
        $this->client_domain = $this->normalize_client_domain((string) $domain);
        $this->sso_client_id = get_option('seamless_sso_client_id', '');

        add_action('init', [$this, 'register_login_rewrite_rule']);
        add_action('query_vars', [$this, 'add_login_query_vars']);
        add_action('template_redirect', [$this, 'handle_login_redirect']);
        add_action('rest_api_init', [$this, 'register_rest_routes']);
        add_action('save_post_page', [$this, 'clear_default_return_to_cache']);
        add_action('deleted_post', [$this, 'clear_default_return_to_cache']);
        add_shortcode('seamless_login_button', [$this, 'render_login_button']);
    }

    private function normalize_client_domain(string $domain): string
    {
        $domain = trim($domain);
        if ($domain === '') {
            return '';
        }

        if (strpos($domain, '//') === 0) {
            $domain = 'https:' . $domain;
        } elseif (strpos($domain, 'http') !== 0) {
            $domain = 'https://' . $domain;
        } elseif (stripos($domain, 'http://') === 0) {
            $domain = 'https://' . substr($domain, 7);
        }

        $second_http = stripos($domain, 'http://', 8);
        $second_https = stripos($domain, 'https://', 8);
        $cuts = array_filter([$second_http, $second_https], static function ($value) {
            return $value !== false;
        });
        if (!empty($cuts)) {
            $domain = substr($domain, 0, min($cuts));
        }

        $parts = wp_parse_url($domain);
        $host = $parts['host'] ?? '';
        if ($host === '') {
            return rtrim($domain, '/');
        }

        $scheme = 'https';
        $port = isset($parts['port']) ? ':' . $parts['port'] : '';

        return $scheme . '://' . $host . $port;
    }

    public function get_public_login_url(): string
    {
        return home_url(self::LOGIN_ROUTE);
    }

    public function get_public_logout_url(?string $return_to = null, bool $include_return_to = true): string
    {
        $logout_url = home_url(self::LOGOUT_ROUTE);

        if (!$include_return_to) {
            return $logout_url;
        }

        $return_to = self::sanitize_return_to_url($return_to ?: self::get_return_to_url());

        if ($return_to !== '') {
            $logout_url = add_query_arg('return_to', $return_to, $logout_url);
        }

        return $logout_url;
    }

    public function register_login_rewrite_rule(): void
    {
        add_rewrite_rule('^' . self::LOGIN_ROUTE . '/?$', 'index.php?sso_login_redirect=1', 'top');
        add_rewrite_rule('^' . self::LOGOUT_ROUTE . '/?$', 'index.php?sso_logout_redirect=1', 'top');
        add_rewrite_rule('^' . self::LEGACY_LOGOUT_ROUTE . '/?$', 'index.php?sso_logout_redirect=1', 'top');
    }

    public function add_login_query_vars(array $vars): array
    {
        $vars[] = 'sso_login_redirect';
        $vars[] = 'sso_logout_redirect';
        return $vars;
    }

    public function handle_login_redirect(): void
    {
        $login_requested = get_query_var('sso_login_redirect') || isset($_GET['sso_login_redirect']) || $this->is_current_auth_route(self::LOGIN_ROUTE);
        $logout_requested = get_query_var('sso_logout_redirect') || isset($_GET['sso_logout_redirect']) || $this->is_current_logout_route();

        if ($login_requested) {
            $this->ensure_session_started();

            $return_to = self::get_return_to_url();
            $login_url = $this->get_login_url($return_to);

            wp_redirect($login_url);
            exit;
        }

        if ($logout_requested) {
            $this->ensure_session_started();
            $return_to = isset($_GET['return_to']) ? wp_unslash($_GET['return_to']) : self::get_return_to_url();
            $this->handle_logout_redirect($return_to);
            return;
        }
    }

    private function is_current_logout_route(): bool
    {
        return $this->is_current_auth_route(self::LOGOUT_ROUTE) || $this->is_current_auth_route(self::LEGACY_LOGOUT_ROUTE);
    }

    private function is_current_auth_route(string $route): bool
    {
        $request_uri = isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '';
        $request_path = (string) wp_parse_url($request_uri, PHP_URL_PATH);
        if ($request_path === '') {
            return false;
        }

        $home_path = (string) wp_parse_url(home_url('/'), PHP_URL_PATH);
        $expected_path = '/' . trim(trim($home_path, '/') . '/' . trim($route, '/'), '/');

        return trim($request_path, '/') === trim($expected_path, '/');
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
            return self::sanitize_return_to_url(wp_unslash($return_to));
        }

        $current_url = self::get_current_url();
        if (!empty($current_url) && !self::is_auth_transition_url($current_url)) {
            return self::sanitize_return_to_url($current_url);
        }

        $referer = isset($_SERVER['HTTP_REFERER']) ? wp_unslash($_SERVER['HTTP_REFERER']) : '';
        if (!empty($referer) && !self::is_auth_transition_url($referer)) {
            return self::sanitize_return_to_url($referer);
        }

        return self::get_default_return_to_url();
    }

    public static function sanitize_return_to_url($return_to): string
    {
        $fallback = self::get_default_return_to_url();
        $url = is_string($return_to) ? trim($return_to) : '';

        if ($url === '') {
            return $fallback;
        }

        if (strpos($url, '/') === 0 && strpos($url, '//') !== 0) {
            $url = home_url($url);
        }

        $url = esc_url_raw($url);
        if ($url === '' || self::is_auth_transition_url($url)) {
            return $fallback;
        }

        $url_host = wp_parse_url($url, PHP_URL_HOST);
        $home_host = wp_parse_url(home_url('/'), PHP_URL_HOST);
        if (empty($url_host) || empty($home_host) || strcasecmp((string) $url_host, (string) $home_host) !== 0) {
            return $fallback;
        }

        return $url;
    }

    public static function get_default_return_to_url(): string
    {
        $default = self::discover_default_shortcode_url();
        return apply_filters('seamless_sso_default_return_to', $default);
    }

    private static function is_auth_transition_url(string $url): bool
    {
        if ($url === '') {
            return false;
        }

        return (
            strpos($url, 'sso_login_redirect=1') !== false ||
            strpos($url, 'sso_logout_redirect=1') !== false ||
            strpos($url, '/wp-json/' . self::REST_NAMESPACE . '/callback') !== false ||
            preg_match('#/(?:' . preg_quote(self::LOGIN_ROUTE, '#') . '|' . preg_quote(self::LOGOUT_ROUTE, '#') . '|' . preg_quote(self::LEGACY_LOGOUT_ROUTE, '#') . ')(?:/|$)#', (string) wp_parse_url($url, PHP_URL_PATH))
        );
    }

    private static function get_current_url(): string
    {
        $request_uri = isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '';
        if ($request_uri === '') {
            return '';
        }

        return home_url($request_uri);
    }

    private static function discover_default_shortcode_url(): string
    {
        $transient_key = 'seamless_sso_default_return_to';
        $cached = get_transient($transient_key);
        if (is_string($cached) && $cached !== '') {
            return esc_url_raw($cached);
        }

        $shortcode_fallback = '';
        global $wpdb;
        if (isset($wpdb) && !empty($wpdb->posts)) {
            $sql = "
                SELECT ID
                FROM {$wpdb->posts}
                WHERE post_type = %s
                  AND post_status = %s
                  AND (
                    post_content LIKE %s
                    OR post_content LIKE %s
                    OR post_content LIKE %s
                  )
                ORDER BY ID ASC
                LIMIT 1
            ";

            $post_id = (int) $wpdb->get_var($wpdb->prepare(
                $sql,
                'page',
                'publish',
                '%[seamless_dashboard%',
                '%[seamless_user_dashboard%',
                '%[seamless_login_button%'
            ));

            if ($post_id > 0) {
                $permalink = get_permalink($post_id);
                if (!empty($permalink)) {
                    $shortcode_fallback = esc_url_raw($permalink);
                }
            }
        }

        $fallback = $shortcode_fallback ?: home_url('/');
        set_transient($transient_key, $fallback, HOUR_IN_SECONDS);
        return $fallback;
    }

    public function clear_default_return_to_cache(): void
    {
        delete_transient('seamless_sso_default_return_to');
    }

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

        // Generate a random string instead of a nonce because WP nonces rely on user session state which breaks on redirect
        $state_hash = wp_generate_password(16, false);
        $state = $state_hash . '|' . $encoded_return_to;

        // Store PKCE verifier directly in the wp_options table (bypasses all object-cache/session issues).
        // Using add_option with autoload=false ensures it's a raw DB write, reliable on ALL hosts.
        $pkce_option_key = 'seamless_pkce_' . $state_hash;
        delete_option($pkce_option_key); // clean any stale entry first
        add_option($pkce_option_key, [
            'verifier' => $code_verifier,
            'created_at' => time(),
        ], '', 'no'); // autoload = no

        // Build the URL
        $redirect_uri = rest_url(self::REST_NAMESPACE . '/callback');
        $query = http_build_query([
            'client_id' => $this->sso_client_id,
            'redirect_uri' => $redirect_uri,
            'response_type' => 'code',
            'scope' => $scope,
            'state' => $state,
            'code_challenge' => $code_challenge,
            'code_challenge_method' => 'S256',
        ]);

        $final_url = "{$this->client_domain}/oauth/authorize?{$query}";

        return $final_url;
    }

    public function handle_oauth_callback(WP_REST_Request $req): void
    {
        $this->ensure_session_started();
        $handler = new SeamlessCallbackHandler();

        $result = $handler->handle($req);

        if (is_wp_error($result)) {
            Helper::log('SeamlessSSO | handle_oauth_callback | OAuth callback failed: ' . $result->get_error_message());
            wp_die($result);
        }
    }

    /**
     * Logout user from WordPress using email sent by Laravel.
     */
    public function custom_logout_user(WP_REST_Request $req)
    {
        if (!headers_sent()) {
            foreach ($_COOKIE as $name => $value) {
                if (strpos($name, 'wordpress_logged_in') !== false || strpos($name, 'PHPSESSID') !== false) {
                    setcookie($name, '', time() - 3600, '/');
                    unset($_COOKIE[$name]);
                }
            }
        }

        $email = sanitize_email($req->get_param('email'));
        if (!$email) {
            return new WP_Error('invalid_user', 'User not found or invalid email', ['status' => 400]);
        }

        $user = get_user_by('email', $email);
        if (!$user) {
            return new WP_Error('no_user', 'User not found.', ['status' => 404]);
        }

        require_once ABSPATH . 'wp-includes/class-wp-session-tokens.php';
        $session_tokens = \WP_Session_Tokens::get_instance($user->ID);
        $session_tokens->destroy_all();

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (isset($_SESSION[self::SSO_PREFIX])) {
            unset($_SESSION[self::SSO_PREFIX]);
        }

        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }

        exit;
    }

    /**
     * @param string $return_to  Optional URL to redirect to after logout.
     *                           Must be on the same site; falls back to home_url('/') otherwise.
     */
    private function handle_logout_redirect(string $return_to = ''): void
    {
        $return_to = self::sanitize_return_to_url($return_to);

        $user = wp_get_current_user();
        if (!$user || empty($user->user_email)) {
            wp_safe_redirect($return_to ?: home_url('/'));
            exit;
        }

        $email = $user->user_email;
        $api_url = $this->client_domain . '/api/oauth/portal/terminate-session';

        wp_remote_post($api_url, [
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'X-PORTAL-SECRET' => 'zTheQ4AcUnOY7GSs1SH010MQgdvhsklOYXZODcgzdioCNCGwIWnB9ephfIZhQW1B',
            ],
            'body' => wp_json_encode(['user_email' => $email]),
            'timeout' => 10,
        ]);

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
        }

        require_once ABSPATH . 'wp-includes/class-wp-session-tokens.php';
        $session_tokens = \WP_Session_Tokens::get_instance($user->ID);
        $session_tokens->destroy_all();

        // Clear user-level SSO token meta so the next login starts fresh
        delete_user_meta($user->ID, 'seamless_access_token');
        delete_user_meta($user->ID, 'seamless_refresh_token');
        delete_user_meta($user->ID, 'seamless_token_expires');

        if (isset($_SESSION[self::SSO_PREFIX])) {
            unset($_SESSION[self::SSO_PREFIX]);
        }

        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }

        // Redirect back to the page the user came from (same-site only),
        // or fall back to home if no valid return_to was provided.
        $redirect = $return_to ?: home_url('/');

        wp_safe_redirect($redirect);
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
            'text' => 'Login',
            'class' => 'button seamless-sso-login-btn',
            'style' => '',
            'logout_text' => 'Logout',
            'logout_class' => 'button seamless-sso-logout-btn',
        ], $atts);

        $style_attr = trim((string) $atts['style']);
        $style_html = $style_attr !== '' ? sprintf(' style="%s"', esc_attr($style_attr)) : '';

        if (empty($this->sso_client_id) || empty($this->client_domain)) {
            return '<p>Seamless SSO is not configured.</p>';
        }

        if (is_user_logged_in()) {
            $uid = get_current_user_id();
            $has_sso_token = !empty(get_user_meta($uid, 'seamless_access_token', true));

            // If the user is logged into WordPress but has NO SSO token,
            // they never completed the OAuth flow (typical for WP admins).
            // Show a "Login via SSO" button so they can connect their account.
            if (!$has_sso_token) {
                $url = $this->get_public_login_url();
                return sprintf(
                    '<a class="%s" href="%s"%s>%s</a>',
                    esc_attr($atts['class']),
                    esc_url($url),
                    $style_html,
                    esc_html('Connect SSO Account')
                );
            }

            // Fully SSO-authenticated: show the Logout button.
            $logout_url = $this->get_public_logout_url(null, false);
            return sprintf(
                '<a class="%s" href="%s">%s</a>',
                esc_attr($atts['logout_class']),
                esc_url($logout_url),
                esc_html($atts['logout_text'])
            );
        }

        $url = $this->get_public_login_url();

        return sprintf(
            '<a class="%s" href="%s"%s>%s</a>',
            esc_attr($atts['class']),
            esc_url($url),
            $style_html,
            esc_html($atts['text'])
        );
    }

    // --- Token Refresh ---


    public function seamless_refresh_token_if_needed(int $user_id)
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
        $expires_in = (int) ($data['expires_in'] ?? 3600);
        update_user_meta($user_id, 'seamless_token_expires', time() + $expires_in);


        return $data['access_token'];
    }
}
