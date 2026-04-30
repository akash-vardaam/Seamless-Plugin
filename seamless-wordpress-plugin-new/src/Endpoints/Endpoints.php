<?php

namespace Seamless\Endpoints;

use Seamless\Auth\SeamlessAuth;

class Endpoints
{

	public function __construct()
	{
		add_action('init', [$this, 'register_rewrite_rules']);
		add_filter('query_vars', [$this, 'add_query_vars']);
		add_filter('template_include', [$this, 'handle_template_redirect'], 100);
		add_action('update_option_seamless_event_list_endpoint', 'flush_rewrite_rules');
		add_action('update_option_seamless_single_event_endpoint', 'flush_rewrite_rules');
		add_action('update_option_seamless_ams_content_endpoint', 'flush_rewrite_rules');
		add_action('update_option_seamless_single_donation_endpoint', 'flush_rewrite_rules');
		add_action('update_option_seamless_membership_list_endpoint', 'flush_rewrite_rules');
		add_action('update_option_seamless_single_membership_endpoint', 'flush_rewrite_rules');
		add_action('update_option_seamless_product_list_endpoint', 'flush_rewrite_rules');
		add_action('update_option_seamless_single_product_endpoint', 'flush_rewrite_rules');
		add_action('update_option_seamless_shop_cart_endpoint', 'flush_rewrite_rules');

		add_filter('document_title_parts', [$this, 'filter_event_title'], 10);
		add_filter('pre_get_document_title', [$this, 'filter_pre_get_document_title'], 10);
		add_filter('wp_title', [$this, 'filter_wp_title'], 10, 2);
	}

	/**
	 * Filter document title parts for Seamless endpoint pages.
	 */
	public function filter_event_title($title_parts)
	{
		$endpoint_title = $this->get_endpoint_title();
		if ($endpoint_title !== null) {
			return [
				'title' => $endpoint_title,
			];
		}

		return $title_parts;
	}

	/**
	 * Filter pre_get_document_title for Seamless endpoint pages.
	 */
	public function filter_pre_get_document_title($title)
	{
		$endpoint_title = $this->get_endpoint_title();
		if ($endpoint_title !== null) {
			return $endpoint_title;
		}

		return $title;
	}

	/**
	 * Filter wp_title for Seamless endpoint pages.
	 */
	public function filter_wp_title($title, $sep)
	{
		$endpoint_title = $this->get_endpoint_title();
		if ($endpoint_title !== null) {
			return $endpoint_title;
		}

		return $title;
	}

	private function get_endpoint_title()
	{
		$page = (string) get_query_var('seamless_page');

		if ($page === 'single_event') {
			$event_slug = (string) get_query_var('event_uuid');
			return $event_slug !== '' ? $this->get_event_title($event_slug) : null;
		}

		if ($page === 'single_product') {
			$product_slug = (string) get_query_var('product_slug');
			return $product_slug !== '' ? $this->get_product_title($product_slug) : null;
		}

		if ($page === 'seamless-shop-list') {
			return __('Shop', 'seamless');
		}

		if ($page === 'seamless-shop-cart') {
			return __('Cart', 'seamless');
		}

		return null;
	}

	/**
	 * Get event title from API
	 */
	private function get_event_title($slug)
	{
		// Check transient cache first
		$cache_key = 'seamless_event_title_' . md5($slug);
		$cached_title = get_transient($cache_key);
		if ($cached_title !== false) {
			return $cached_title;
		}

		// Fetch from API
		$client_domain = get_option('seamless_client_domain', '');
		if (empty($client_domain)) {
			return null;
		}

		$client_domain = rtrim($client_domain, '/');

		// Try regular events endpoint first
		$response = wp_remote_get($client_domain . '/api/events/' . $slug, [
			'timeout' => 5,
			'sslverify' => false,
		]);

		if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
			$body = json_decode(wp_remote_retrieve_body($response), true);
			if (isset($body['data']['title'])) {
				$title = $body['data']['title'];
				set_transient($cache_key, $title, 300); // Cache for 5 minutes
				return $title;
			}
		}

		// Try group events endpoint
		$response = wp_remote_get($client_domain . '/api/group-events/' . $slug, [
			'timeout' => 5,
			'sslverify' => false,
		]);

		if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
			$body = json_decode(wp_remote_retrieve_body($response), true);
			if (isset($body['data']['title'])) {
				$title = $body['data']['title'];
				set_transient($cache_key, $title, 300); // Cache for 5 minutes
				return $title;
			}
		}

		return null;
	}

	private function get_product_title($slug)
	{
		$cache_key = 'seamless_product_title_' . md5($slug);
		$cached_title = get_transient($cache_key);
		if ($cached_title !== false) {
			return $cached_title;
		}

		$client_domain = rtrim((string) get_option('seamless_client_domain', ''), '/');
		if ($client_domain === '') {
			return null;
		}

		$single_product_response = wp_remote_get(
			$client_domain . '/api/shop/products/' . rawurlencode((string) $slug),
			[
				'timeout' => 8,
				'sslverify' => false,
			]
		);

		if (!is_wp_error($single_product_response) && wp_remote_retrieve_response_code($single_product_response) === 200) {
			$body = json_decode(wp_remote_retrieve_body($single_product_response), true);
			$product = $this->extract_shop_product($body);
			$title = (string) ($product['title'] ?? $product['name'] ?? $product['label'] ?? '');
			if ($title !== '') {
				set_transient($cache_key, $title, 300);
				return $title;
			}
		}

		$page = 1;
		$listing_endpoints = [
			'/api/shop/products',
			'/api/shop',
		];

		while ($page <= 20) {
			$products = [];
			$body = null;

			foreach ($listing_endpoints as $endpoint) {
				$response = wp_remote_get(
					add_query_arg(
						[
							'page' => $page,
							'per_page' => 100,
						],
						$client_domain . $endpoint
					),
					[
						'timeout' => 8,
						'sslverify' => false,
					]
				);

				if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
					continue;
				}

				$body = json_decode(wp_remote_retrieve_body($response), true);
				$products = $this->extract_shop_products($body);
				if (!empty($products)) {
					break;
				}
			}

			if (empty($products)) {
				break;
			}

			foreach ($products as $product) {
				$product_candidates = [
					(string) ($product['slug'] ?? ''),
					(string) ($product['handle'] ?? ''),
					(string) ($product['id'] ?? ''),
				];

				if (in_array((string) $slug, $product_candidates, true)) {
					$title = (string) ($product['title'] ?? $product['name'] ?? $product['label'] ?? '');
					if ($title !== '') {
						set_transient($cache_key, $title, 300);
						return $title;
					}
				}
			}

			$has_more = false;
			if (isset($body['data']['pagination']['has_more_pages'])) {
				$has_more = (bool) $body['data']['pagination']['has_more_pages'];
			} elseif (isset($body['pagination']['has_more_pages'])) {
				$has_more = (bool) $body['pagination']['has_more_pages'];
			} elseif (count($products) === 100) {
				$has_more = true;
			}

			if (!$has_more) {
				break;
			}

			$page++;
		}

		return null;
	}

	private function extract_shop_product($payload): array
	{
		if (!is_array($payload)) {
			return [];
		}

		$candidate = $payload['data'] ?? $payload;
		if (!is_array($candidate)) {
			return [];
		}

		$is_list = array_keys($candidate) === range(0, count($candidate) - 1);
		if ($is_list) {
			return [];
		}

		return $candidate;
	}

	private function extract_shop_products($payload): array
	{
		if (!is_array($payload)) {
			return [];
		}

		$candidates = [
			$payload['data']['products'] ?? null,
			$payload['data']['items'] ?? null,
			$payload['data']['shop'] ?? null,
			$payload['data'] ?? null,
			$payload['products'] ?? null,
			$payload['items'] ?? null,
			$payload['shop'] ?? null,
		];

		foreach ($candidates as $candidate) {
			if (is_array($candidate)) {
				$is_list = array_keys($candidate) === range(0, count($candidate) - 1);
				if ($is_list) {
					return $candidate;
				}
			}
		}

		return [];
	}

	public function register_rewrite_rules(): void
	{
		add_rewrite_rule('^' . preg_quote(get_option('seamless_event_list_endpoint', 'events'), '/') . '/?$', 'index.php?seamless_page=seamless-event-list', 'top');
		$slug = get_option('seamless_single_event_endpoint', 'event');
		add_rewrite_rule(
			'^' . preg_quote($slug, '/') . '/([^/]+)/?$',
			'index.php?seamless_page=single_event&event_uuid=$matches[1]',
			'top'
		);

		add_rewrite_rule('^' . preg_quote(get_option('seamless_product_list_endpoint', 'shop'), '/') . '/?$', 'index.php?seamless_page=seamless-shop-list', 'top');
		add_rewrite_rule('^' . preg_quote(get_option('seamless_shop_cart_endpoint', 'shops/cart'), '/') . '/?$', 'index.php?seamless_page=seamless-shop-cart', 'top');
		$product_slug = get_option('seamless_single_product_endpoint', 'product');
		add_rewrite_rule(
			'^' . preg_quote($product_slug, '/') . '/([^/]+)/?$',
			'index.php?seamless_page=single_product&product_slug=$matches[1]',
			'top'
		);

		// AMS Content endpoint
		$ams_slug = get_option('seamless_ams_content_endpoint', 'ams-content');
		add_rewrite_rule(
			'^' . preg_quote($ams_slug, '/') . '/?$',
			'index.php?seamless_page=ams_content',
			'top'
		);
	}

	public function add_query_vars($vars)
	{
		$vars[] = 'seamless_page';
		$vars[] = 'event_uuid';
		$vars[] = 'donation_id';
		$vars[] = 'membership_uuid';
		$vars[] = 'product_slug';
		return $vars;
	}

	public function handle_template_redirect($template)
	{
		$page = get_query_var('seamless_page');
		if ($page) {
			if ('seamless-event-list' === $page) {
				return plugin_dir_path(__DIR__) . 'Public/templates/tpl-event-container.php';
			} elseif ('seamless-shop-list' === $page) {
				return plugin_dir_path(__DIR__) . 'Public/templates/tpl-shop-container.php';
			} elseif ('seamless-shop-cart' === $page) {
				return plugin_dir_path(__DIR__) . 'Public/templates/tpl-cart-wrapper.php';
			} elseif ('single_event' === $page) {
				return plugin_dir_path(__DIR__) . 'Public/templates/tpl-single-event-wrapper.php';
			} elseif ('single_product' === $page) {
				return plugin_dir_path(__DIR__) . 'Public/templates/tpl-single-product-wrapper.php';
			} elseif ('ams_content' === $page) {
				return plugin_dir_path(__DIR__) . 'Public/templates/tpl-seamless-ams-content.php';
			}
		}
		return $template;
	}
}
