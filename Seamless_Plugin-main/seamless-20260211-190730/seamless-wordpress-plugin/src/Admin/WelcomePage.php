<?php

namespace Seamless\Admin;

use Seamless\Auth\SeamlessAuth as Auth;

class WelcomePage
{
	private Auth $auth;
	private ?SettingsPage $settings_page;

	public function __construct(?SettingsPage $settings_page = null)
	{
		$this->auth = new Auth();
		$this->settings_page = $settings_page;
		add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_styles']);
		add_action('current_screen', [$this, 'clean_admin_notices']);
	}

	/**
	 * Render the welcome page with sticky navigation.
	 */
	public function render(): void
	{
		$this->clean_admin_notices();
		$this->render_styles();
		$active_view = $this->get_active_view();
		$settings_page = $this->settings_page ?? new SettingsPage();
?>
		<div class="seamless-admin-shell seamless-shell-loading">
			<?php $this->render_sidebar_navigation($active_view, $settings_page); ?>

			<div class="seamless-admin-main">
				<?php $this->render_content_header($active_view, $settings_page); ?>

				<div class="seamless-admin-content">
					<div class="seamless-admin-view <?php echo ($active_view === 'overview') ? 'is-active' : ''; ?>" data-seamless-view="overview">
						<?php $this->render_overview_view(); ?>
					</div>
					<div class="seamless-admin-view <?php echo ($active_view === 'settings') ? 'is-active' : ''; ?>" data-seamless-view="settings">
						<?php $this->render_settings_view(); ?>
					</div>
				</div>
			</div>
		</div>
<?php
		$this->render_scripts();
	}

	private function render_overview_view(): void
	{
?>
		<section class="seamless-overview-panel seamless-loading-surface is-page-loading" data-seamless-page-loading="overview">
				<?php $this->render_welcome_header(); ?>
				<?php $this->render_feature_grid(); ?>
		</section>
<?php
	}

	private function render_settings_view(): void
	{
		$settings_page = $this->settings_page ?? new SettingsPage();
?>
		<?php $settings_page->render_settings_content(); ?>
<?php
	}

	private function render_sidebar_navigation(string $active_view, SettingsPage $settings_page): void
	{
		$logo_url = $this->get_logo_url();
		$icon_logo_url = plugins_url('assets/seamless-icon-logo.png', __FILE__);
		$current_tab = $settings_page->get_active_tab();
		$tabs = $settings_page->get_navigation_tabs();
?>
		<aside class="seamless-admin-sidebar">
			<div class="seamless-sidebar-brand">
				<img src="<?php echo esc_url($logo_url); ?>" alt="Seamless" class="seamless-sidebar-logo" width="148" height="39" />
				<img src="<?php echo esc_url($icon_logo_url); ?>" alt="Seamless" class="seamless-sidebar-icon-logo" width="27" height="40" />
				<div class="seamless-sidebar-controller">
					<button type="button" class="seamless-sidebar-toggle" aria-expanded="true" aria-label="<?php esc_attr_e('Collapse sidebar', 'seamless'); ?>">
					<?php $this->render_outline_icon('chevron-left', 'seamless-sidebar-toggle-icon'); ?>
				</button>
				</div>
			</div>

			<div class="seamless-sidebar-scroll">
				<section class="seamless-sidebar-section sidebar-top-section">
					<p class="seamless-sidebar-section-label"><?php esc_html_e('Workspace', 'seamless'); ?></p>
					<nav class="seamless-sidebar-nav">
						<a href="<?php echo esc_url($this->get_view_url('overview')); ?>" class="seamless-sidebar-link seamless-sidebar-link--overview <?php echo ($active_view === 'overview') ? 'is-active' : ''; ?>" data-seamless-view-link="overview">
							<?php $this->render_outline_icon('home', 'seamless-sidebar-icon'); ?>
							<span><?php esc_html_e('Overview', 'seamless'); ?></span>
						</a>
					</nav>
				</section>

				<section class="seamless-sidebar-section">
					<p class="seamless-sidebar-section-label"><?php esc_html_e('Settings', 'seamless'); ?></p>
					<nav class="seamless-sidebar-nav">
						<?php foreach ($tabs as $tab_key => $tab): ?>
							<a href="<?php echo esc_url($tab['url']); ?>" class="seamless-sidebar-link seamless-sidebar-link--<?php echo esc_attr($tab_key); ?> <?php echo ($active_view === 'settings' && $current_tab === $tab_key) ? 'is-active' : ''; ?>" data-seamless-tab="<?php echo esc_attr($tab_key); ?>">
								<?php $this->render_outline_icon($this->get_sidebar_icon_name((string) $tab_key), 'seamless-sidebar-icon'); ?>
								<span><?php echo esc_html($tab['label']); ?></span>
							</a>
						<?php endforeach; ?>
					</nav>
				</section>
			</div>

			<div class="seamless-sidebar-footer" style="display: none;">
				<a style="display: none;" href="https://seamlessams.com/" target="_blank" rel="noopener noreferrer"><?php esc_html_e('API Documentation', 'seamless'); ?></a>
			</div>
		</aside>
<?php
	}

	private function render_content_header(string $active_view, SettingsPage $settings_page): void
	{
		$is_authenticated = $this->auth->is_authenticated();
?>
		<div class="seamless-admin-topbar">
			<div>
				<?php if (!empty($description)) : ?>
					<p class="seamless-admin-page-description"><?php echo esc_html($description); ?></p>
				<?php endif; ?>
			</div>

			<div class="seamless-admin-topbar-actions">
				<div class="seamless-admin-status-pill <?php echo $is_authenticated ? 'is-connected' : ''; ?>">
					<span class="seamless-admin-status-ping" aria-hidden="true">
						<span class="seamless-admin-status-ping-ring"></span>
						<span class="seamless-admin-status-ping-dot"></span>
					</span>
					<span><?php echo esc_html($is_authenticated ? __('Connected', 'seamless') : __('Needs Connection', 'seamless')); ?></span>
				</div>

				<form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" class="seamless-clear-cache-form">
					<?php wp_nonce_field('seamless_clear_cache', 'seamless_nonce'); ?>
					<input type="hidden" name="action" value="seamless_clear_cache">
					<input type="hidden" name="redirect_to" value="<?php echo esc_url($this->get_current_admin_url()); ?>">
					<button type="submit" class="button button-secondary seamless-clear-cache-btn">
						<span class="dashicons dashicons-update"></span>
						<?php esc_html_e('Clear Cache', 'seamless'); ?>
					</button>
				</form>
			</div>
		</div>
<?php
	}

	private function render_welcome_header(): void
	{
		$status = $this->get_dashboard_status_data();
?>
		<div class="seamless-dashboard-header">
			<div class="seamless-dashboard-copy">
				<div class="seamless-dashboard-health-pill <?php echo esc_attr($status['state_class']); ?>">
					<?php $this->render_outline_icon($status['health_icon'], 'seamless-dashboard-status-icon'); ?>
					<span><?php echo esc_html($status['health_text']); ?></span>
				</div>
				<h1 class="seamless-dashboard-title"><?php esc_html_e('Seamless Overview', 'seamless'); ?></h1>
				<p class="seamless-dashboard-subtitle"><?php esc_html_e('Monitor your connection and manage synced member experiences from one place.', 'seamless'); ?></p>
			</div>

			<div class="seamless-dashboard-connection-card <?php echo esc_attr($status['state_class']); ?>">
				<?php $this->render_outline_icon($status['connection_icon'], 'seamless-dashboard-connection-icon'); ?>
				<div>
					<strong><?php echo esc_html($status['connection_title']); ?></strong>
					<span><?php echo esc_html($status['connection_detail']); ?></span>
				</div>
			</div>
		</div>
<?php
	}

	private function get_dashboard_status_data(): array
	{
		$status = $this->auth->get_auth_status();
		$client_domain = trim((string) get_option('seamless_client_domain', ''));
		$last_error = trim((string) ($status['last_error'] ?? ''));
		$is_authenticated = !empty($status['is_authenticated']);

		if ($is_authenticated) {
			return [
				'state_class' => 'is-connected',
				'health_icon' => 'activity',
				'health_text' => __('All systems operational', 'seamless'),
				'connection_icon' => 'check-circle',
				'connection_title' => __('Connected', 'seamless'),
				'connection_detail' => $client_domain !== '' ? $client_domain : __('Seamless domain verified', 'seamless'),
			];
		}

		if (!empty(get_option('seamless_manual_disconnect'))) {
			$message = __('Disconnected manually', 'seamless');
		} elseif (empty($status['credentials_set'])) {
			$message = __('Client domain is not configured', 'seamless');
		} elseif (!empty($status['token_expired'])) {
			$message = __('Connection token expired', 'seamless');
		} elseif ($last_error !== '') {
			$message = $last_error;
		} else {
			$message = __('Unable to verify the Seamless connection', 'seamless');
		}

		return [
			'state_class' => 'has-error',
			'health_icon' => 'alert-circle',
			'health_text' => $message,
			'connection_icon' => 'alert-circle',
			'connection_title' => __('Needs Connection', 'seamless'),
			'connection_detail' => $client_domain !== '' ? $message : __('Connect your Seamless domain', 'seamless'),
		];
	}

	private function render_quick_access_header(): void
	{
?>
		<div class="seamless-quick-access-header">
			<h2><?php esc_html_e('Quick Access', 'seamless'); ?></h2>
		</div>
<?php
	}

	private function get_active_view(): string
	{
		$view = isset($_GET['view']) ? sanitize_key(wp_unslash($_GET['view'])) : '';
		if ($view === '' && isset($_GET['tab'])) {
			$view = 'settings';
		}
		if ($view === '') {
			$view = 'overview';
		}

		return in_array($view, ['overview', 'settings'], true) ? $view : 'overview';
	}

	private function get_view_url(string $view, ?string $tab = null): string
	{
		$args = [
			'page' => 'seamless',
			'view' => $view,
		];

		if ($view === 'settings') {
			$args['tab'] = $tab ?: 'authentication';
		}

		return add_query_arg($args, admin_url('admin.php'));
	}

	private function get_current_admin_url(): string
	{
		$active_view = $this->get_active_view();
		$current_tab = isset($_GET['tab']) ? sanitize_key(wp_unslash($_GET['tab'])) : 'authentication';

		return $this->get_view_url($active_view, $current_tab);
	}

	private function render_feature_grid(): void
	{
		$feature_cards = $this->get_feature_cards_data();
?>
		<div class="seamless-feature-grid">
			<?php foreach ($feature_cards as $card): ?>
				<?php $this->render_feature_card($card); ?>
			<?php endforeach; ?>
		</div>
<?php
	}

	private function get_feature_cards_data(): array
	{
		$is_authenticated = $this->auth->is_authenticated();

		return [
			[
				'id' => 'connection-status',
				'title' => $is_authenticated ? 'Connection Status' : 'Connect Seamless AMS',
				'description' => $is_authenticated
					? 'WordPress site is connected to Seamless AMS and ready for sync, authentication, and protected content workflows.'
					: 'Connect your Seamless AMS domain to enable real-time sync, secure authentication, and member-aware content experiences.',
				'icon' => 'key',
				'accent_class' => 'is-primary',
				'link_url' => admin_url('admin.php?page=seamless&view=settings&tab=authentication'),
				'is_available' => true,
			],
			[
				'id' => 'event-sync',
				'title' => 'Event Sync & Display',
				'description' => 'Pull event data from Seamless, keep listings fresh, and manage how events appear across your WordPress site.',
				'icon' => 'calendar',
				'accent_class' => 'is-blue',
				'link_url' => admin_url('admin.php?page=seamless&view=settings&tab=events'),
				'is_available' => true,
			],
			[
				'id' => 'membership-sync',
				'title' => 'Membership Access Sync',
				'description' => 'Sync membership plans from Seamless to support access rules, member journeys, and protected WordPress experiences.',
				'icon' => 'users',
				'accent_class' => 'is-emerald',
				'link_url' => admin_url('admin.php?page=seamless&view=settings&tab=membership'),
				'is_available' => true,
			],
			[
				'id' => 'sso-integration',
				'title' => 'Single Sign-On',
				'description' => $is_authenticated
					? 'Configure Seamless-powered SSO so members can sign in smoothly with a connected authentication flow.'
					: 'SSO becomes available after your site is connected to Seamless AMS and ready for secure authentication setup.',
				'icon' => 'user-circle',
				'accent_class' => 'is-amber',
				'link_url' => admin_url('admin.php?page=seamless&view=settings&tab=sso'),
				'is_available' => $is_authenticated,
				'disabled_text' => 'Connect Seamless First',
			],
			[
				'id' => 'content-restriction',
				'title' => 'Content Protection',
				'description' => $is_authenticated
					? 'Control which posts, pages, and member content stay visible based on synced membership access from Seamless.'
					: 'Content protection tools unlock once Seamless is connected, so membership-based visibility rules can be applied correctly.',
				'icon' => 'lock',
				'accent_class' => 'is-rose',
				'link_url' => admin_url('admin.php?page=seamless&view=settings&tab=restriction'),
				'is_available' => $is_authenticated,
				'disabled_text' => 'Requires Active Connection',
			],
			[
				'id' => 'shop-setup',
				'title' => 'Shop & Courses',
				'description' => 'Keep product routes, cart experiences, and commerce shortcodes aligned with the current plugin settings.',
				'icon' => 'shopping-cart',
				'accent_class' => 'is-violet',
				'link_url' => admin_url('admin.php?page=seamless&view=settings&tab=shop'),
				'is_available' => true,
			],
		];
	}

	private function get_sidebar_icon_name(string $tab_key): string
	{
		$icons = [
			'authentication' => 'key',
			'endpoints' => 'link',
			'events' => 'calendar',
			'shop' => 'shopping-cart',
			'membership' => 'users',
			'sso' => 'user-circle',
			'restriction' => 'lock',
			'advanced' => 'settings',
			'addons' => 'puzzle',
		];

		return $icons[$tab_key] ?? 'settings';
	}

	private function get_tab_from_url(string $url): string
	{
		$parts = wp_parse_url($url);
		if (empty($parts['query'])) {
			return 'authentication';
		}

		parse_str($parts['query'], $query);
		return isset($query['tab']) ? sanitize_key((string) $query['tab']) : 'authentication';
	}

	private function render_outline_icon(string $icon, string $class = ''): void
	{
		$paths = [
			'activity' => '<path d="M22 12h-4l-3 8L9 4l-3 8H2"/>',
			'alert-circle' => '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
			'calendar' => '<path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/>',
			'check-circle' => '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
			'chevron-left' => '<path d="m15 18-6-6 6-6"/>',
			'chevron-right' => '<path d="m9 18 6-6-6-6"/>',
			'home' => '<path d="m3 10 9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
			'key' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-key-round h-[18px] w-[18px] shrink-0"><path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle></svg>',
			'link' => '<path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3A5 5 0 0 0 11 21.07l1.71-1.71"/>',
			'lock' => '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
			'puzzle' => '<path d="M14 4V2h-4v2a2 2 0 1 1-4 0H4v4h2a2 2 0 1 1 0 4H4v4h4v-2a2 2 0 1 1 4 0v2h4v-4h-2a2 2 0 1 1 0-4h2V4h-2a2 2 0 1 1 0-4Z"/>',
			'settings' => '<path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.4 1v.17a2 2 0 1 1-4 0V21a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1-.4h-.17a2 2 0 1 1 0-4H3a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .4-1V2.83a2 2 0 1 1 4 0V3a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.34.34.65.6 1 .3.26.66.4 1 .4h.17a2 2 0 1 1 0 4H21a1.65 1.65 0 0 0-1.6.6Z"/>',
			'shopping-cart' => '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h7.72a2 2 0 0 0 2-1.61L20 7H5.12"/>',
			'user-circle' => '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.66a5 5 0 0 1 10 0"/>',
			'users' => '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
		];

		$svg_class = trim('seamless-ui-icon ' . $class);
		$path = $paths[$icon] ?? $paths['settings'];

		echo '<svg class="' . esc_attr($svg_class) . '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' . $path . '</svg>';
	}

	private function render_feature_card(array $card_data): void
	{
		$id = $card_data['id'] ?? '';
		$title = $card_data['title'] ?? '';
		$description = $card_data['description'] ?? '';
		$icon = $card_data['icon'] ?? 'settings';
		$accent_class = $card_data['accent_class'] ?? 'is-primary';
		$link_url = $card_data['link_url'] ?? '#';
		$link_text = $card_data['link_text'] ?? __('', 'seamless');
		$is_available = $card_data['is_available'] ?? true;
		$disabled_text = $card_data['disabled_text'] ?? 'Coming Soon';

		$card_class = 'seamless-feature-card';
		if (!$is_available) {
			$card_class .= ' seamless-feature-card-disabled';
		}
?>
		<a class="<?php echo esc_attr($card_class); ?>" href="<?php echo esc_url($is_available ? $link_url : '#'); ?>" data-feature-id="<?php echo esc_attr($id); ?>" <?php echo $is_available ? 'data-seamless-tab="' . esc_attr($this->get_tab_from_url($link_url)) . '"' : 'aria-disabled="true"'; ?>>
			<div class="seamless-feature-card-icon <?php echo esc_attr($accent_class); ?>">
				<?php $this->render_outline_icon($icon, 'seamless-feature-icon'); ?>
			</div>
			<div class="seamless-feature-card-content">
				<div class="seamless-feature-card-heading">
					<h3 class="seamless-feature-card-title"><?php echo esc_html($title); ?></h3>
					<?php $this->render_outline_icon('chevron-right', 'seamless-feature-card-arrow'); ?>
				</div>
				<p class="seamless-feature-card-description"><?php echo esc_html($description); ?></p>
				<?php if (!$is_available): ?>
					<span class="seamless-feature-card-disabled-text"><?php echo esc_html($disabled_text); ?></span>
				<?php endif; ?>
			</div>
		</a>
<?php
	}

	private function get_logo_url(): string
	{
		$logo_files = ['seamless-logo.svg', 'seamless-logo.png', 'logo.svg', 'logo.png'];
		$assets_dir = dirname(__FILE__) . '/assets/';

		foreach ($logo_files as $file) {
			if (file_exists($assets_dir . $file)) {
				return plugins_url('assets/' . $file, __FILE__);
			}
		}

		return 'https://mafpnew.flywheelsites.com/wp-content/uploads/2025/09/seamless.png';
	}

	public function clean_admin_notices($screen = null): void
	{
		$screen = $screen ?: get_current_screen();
		if (!$screen || empty($screen->id) || $screen->id !== 'toplevel_page_seamless') {
			return;
		}

		global $wp_filter;
		if (!is_array($wp_filter)) {
			return;
		}

		foreach (['admin_notices', 'all_admin_notices'] as $hook_name) {
			if (empty($wp_filter[$hook_name]) || empty($wp_filter[$hook_name]->callbacks) || !is_array($wp_filter[$hook_name]->callbacks)) {
				continue;
			}

			foreach ($wp_filter[$hook_name]->callbacks as $priority => $callbacks) {
				if (!is_array($callbacks)) {
					continue;
				}

				foreach ($callbacks as $callback_key => $callback_data) {
					if ($this->is_seamless_notice_callback($callback_data, (string) $callback_key)) {
						continue;
					}

					unset($wp_filter[$hook_name]->callbacks[$priority][$callback_key]);
				}
			}
		}
	}

	private function is_seamless_notice_callback(array $callback_data, string $callback_key): bool
	{
		if (stripos($callback_key, 'seamless') !== false) {
			return true;
		}

		$callback = $callback_data['function'] ?? null;
		if (is_string($callback)) {
			return stripos($callback, 'seamless') !== false;
		}

		if (is_array($callback)) {
			$target = $callback[0] ?? null;
			$method = isset($callback[1]) ? (string) $callback[1] : '';

			if ($method !== '' && stripos($method, 'seamless') !== false) {
				return true;
			}

			if (is_string($target)) {
				return stripos($target, 'seamless') !== false;
			}

			if (is_object($target)) {
				return stripos(get_class($target), 'seamless') !== false;
			}
		}

		if (is_object($callback)) {
			return stripos(get_class($callback), 'seamless') !== false;
		}

		return false;
	}

	public function enqueue_admin_styles($hook)
	{
		if (strpos($hook, 'seamless') === false) {
			return;
		}

		wp_add_inline_style('wp-admin', $this->get_admin_css());
	}

	private function get_admin_css()
	{
		ob_start();
		$this->render_styles();
		return ob_get_clean();
	}

	private function render_styles(): void
	{
?>
		<style>
			.seamless-admin-shell {
				--seamless-grid-url: url('<?php echo esc_url(plugins_url('assets/white-grid-new.png', __FILE__)); ?>');
			}

			.seamless-admin-sidebar .seamless-sidebar-brand {
				display: flex;
				align-items: center;
				gap: 14px;
				padding: 20px 24px 13px;
				min-height: 74px;
				box-sizing: border-box;
				border-bottom: 1px solid var(--seamless-border);
			}

			.seamless-admin-sidebar .seamless-sidebar-logo {
				display: block;
				object-fit: contain;
			}

			.seamless-admin-sidebar .seamless-sidebar-icon-logo {
				object-fit: contain;
			}

			.seamless-dashboard-wrapper .notice:not(.seamless-notice) {
				display: none !important;
			}

			.seamless-overview-panel {
				margin: 0;
			}
		</style>
		<script>
			(function() {
				try {
					if (window.localStorage && window.localStorage.getItem('seamless_sidebar_collapsed') === '1') {
						document.documentElement.classList.add('seamless-sidebar-collapsed');
					}
				} catch (error) {
					// Keep the default expanded layout when storage is unavailable.
				}
			})();
		</script>
<?php
	}

	private function render_scripts(): void
	{
?>
		<script>
			jQuery(document).ready(function($) {
				const $overviewSurface = $('[data-seamless-page-loading="overview"]');

				function finishOverviewLoading() {
					$('.seamless-admin-shell').removeClass('seamless-shell-loading');
					$overviewSurface.removeClass('is-page-loading');
				}

				$('.seamless-feature-card').on('click', function(e) {
					if ($(this).hasClass('seamless-feature-card-disabled')) {
						e.preventDefault();
						return;
					}

					if (!$(this).hasClass('seamless-feature-card-disabled')) {
						var link = $(this).find('.seamless-feature-card-link');
						if (link.length && e.target.tagName !== 'A') {
							window.location.href = link.attr('href');
						}
					}
				});

				finishOverviewLoading();

				const storageKey = 'seamless_sidebar_collapsed';
				const $shell = $('.seamless-admin-shell');
				const $sidebar = $('.seamless-admin-sidebar');
				const $toggle = $('.seamless-sidebar-toggle');

				function setSidebarCollapsed(isCollapsed) {
					document.documentElement.classList.toggle('seamless-sidebar-collapsed', isCollapsed);
					$shell.toggleClass('is-sidebar-collapsed', isCollapsed);
					$sidebar.toggleClass('is-collapsed', isCollapsed);
					$toggle.attr('aria-expanded', isCollapsed ? 'false' : 'true');
					$toggle.attr('aria-label', isCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
				}

				try {
					setSidebarCollapsed(localStorage.getItem(storageKey) === '1');
				} catch (error) {
					setSidebarCollapsed(false);
				}

				$toggle.on('click', function() {
					const nextState = !$shell.hasClass('is-sidebar-collapsed');
					try {
						localStorage.setItem(storageKey, nextState ? '1' : '0');
					} catch (error) {
						// Keep the visual state even if storage is unavailable.
					}
					setSidebarCollapsed(nextState);
				});
			});
		</script>
<?php
	}
}
