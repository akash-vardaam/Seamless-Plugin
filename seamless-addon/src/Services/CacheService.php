<?php

namespace SeamlessAddon\Services;

/**
 * Cache Service
 * 
 * Wrapper for WordPress transient API with addon-specific cache keys.
 */
class CacheService
{
    /**
     * Cache key prefix.
     */
    const CACHE_PREFIX = 'seamless_addon_';

    /**
     * Default cache duration in seconds (30 minutes).
     */
    const DEFAULT_DURATION = 1800;

    /**
     * Get cached data.
     *
     * @param string $key Cache key.
     * @return mixed|false Cached data or false if not found.
     */
    public function get($key)
    {
        $duration = get_option('seamless_addon_cache_duration', self::DEFAULT_DURATION);
        if ($duration <= 0) {
            return false;
        }
        return get_transient($this->get_prefixed_key($key));
    }

    /**
     * Set cached data.
     *
     * @param string $key Cache key.
     * @param mixed $data Data to cache.
     * @param int $duration Cache duration in seconds.
     * @return bool
     */
    public function set($key, $data, $duration = null)
    {
        if (null === $duration) {
            $duration = get_option('seamless_addon_cache_duration', self::DEFAULT_DURATION);
        }

        if ($duration <= 0) {
            return false;
        }

        return set_transient($this->get_prefixed_key($key), $data, $duration);
    }

    /**
     * Delete cached data.
     *
     * @param string $key Cache key.
     * @return bool
     */
    public function delete($key)
    {
        return delete_transient($this->get_prefixed_key($key));
    }

    /**
     * Clear all addon caches.
     *
     * @return int Number of caches cleared.
     */
    public function clear_all()
    {
        global $wpdb;

        $count = $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
                $wpdb->esc_like('_transient_' . self::CACHE_PREFIX) . '%'
            )
        );

        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
                $wpdb->esc_like('_transient_timeout_' . self::CACHE_PREFIX) . '%'
            )
        );

        return $count;
    }

    /**
     * Clear event-related caches.
     */
    public function clear_events_cache()
    {
        global $wpdb;

        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
                $wpdb->esc_like('_transient_' . self::CACHE_PREFIX . 'event') . '%'
            )
        );

        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
                $wpdb->esc_like('_transient_timeout_' . self::CACHE_PREFIX . 'event') . '%'
            )
        );
    }

    /**
     * Clear membership-related caches.
     */
    public function clear_memberships_cache()
    {
        global $wpdb;

        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
                $wpdb->esc_like('_transient_' . self::CACHE_PREFIX . 'membership') . '%'
            )
        );

        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
                $wpdb->esc_like('_transient_timeout_' . self::CACHE_PREFIX . 'membership') . '%'
            )
        );
    }

    /**
     * Get prefixed cache key.
     *
     * @param string $key Original cache key.
     * @return string Prefixed cache key.
     */
    private function get_prefixed_key($key)
    {
        return self::CACHE_PREFIX . $key;
    }
}
