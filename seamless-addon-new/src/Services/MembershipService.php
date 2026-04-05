<?php

namespace SeamlessAddon\Services;


/**
 * Membership Service
 * 
 * Service class to interact with Seamless Membership operations.
 */
class MembershipService
{
    /**
     * Seamless Membership instance.
     *
     * @var Membership
     */

    /**
     * Cache service instance.
     *
     * @var CacheService
     */
    private $cache_service;

    /**
     * Request-level cache for membership data.
     * Prevents multiple API calls during the same page load.
     *
     * @var array
     */
    private static $request_cache = [];

    /**
     * Constructor.
     *
     * @param CacheService $cache_service Cache service instance.
     */
    public function __construct(CacheService $cache_service)
    {
        $this->cache_service = $cache_service;
    }

    /**
     * Get a single membership plan by ID.
     *
     * @param int|string $membership_id Membership plan ID.
     * @return array Membership data.
     */
    public function get_membership_plan($membership_id)
    {
        return ['success' => false, 'data' => []];
    }

    /**
     * Get membership plans list.
     *
     * @param array $args Query arguments.
     * @return array Membership plans data.
     */
    public function get_membership_plans($args = [])
    {
        return ['success' => false, 'data' => []];
    }

    /**
     * Get membership by context (auto-detect from URL).
     *
     * @return array|null Membership data or null if not on membership page.
     */
    public function get_membership_by_context()
    {
        // Check request-level cache first for context-based lookups
        $request_uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
        $request_cache_key = 'membership_by_context_' . md5($request_uri);
        if (isset(self::$request_cache[$request_cache_key])) {
            return self::$request_cache[$request_cache_key];
        }

        global $wp;

        // Try to extract membership slug/ID from current URL
        $current_url = home_url($wp->request);
        $membership_id = $this->extract_membership_id_from_url($current_url);

        if (!$membership_id) {
            // Store null result to prevent repeated lookups
            self::$request_cache[$request_cache_key] = null;
            return null;
        }

        $result = $this->get_membership_plan($membership_id);
        // Store in request cache
        self::$request_cache[$request_cache_key] = $result;
        return $result;
    }

    /**
     * Get recent memberships for dropdowns/selectors.
     *
     * @param int $limit Number of memberships to return.
     * @return array Memberships data.
     */
    public function get_recent_memberships($limit = 20)
    {
        return ['success' => false, 'data' => []];
    }

    /**
     * Extract membership ID from URL.
     *
     * @param string $url URL to parse.
     * @return string|null Membership ID or null.
     */
    private function extract_membership_id_from_url($url)
    {
        // Get the memberships endpoint from settings if available
        $memberships_endpoint = get_option('seamless_memberships_endpoint', 'memberships');

        // Parse URL and extract ID after memberships endpoint
        $path = parse_url($url, PHP_URL_PATH);
        $path_parts = explode('/', trim($path, '/'));

        $key = array_search($memberships_endpoint, $path_parts);
        if (false !== $key && isset($path_parts[$key + 1])) {
            return sanitize_text_field($path_parts[$key + 1]);
        }

        return null;
    }
}
