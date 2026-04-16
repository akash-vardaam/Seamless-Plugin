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
	}

	/**
	 * Render the welcome page with sticky navigation.
	 */
	public function render(): void
	{
		$this->remove_all_notices();
		$this->render_styles();
		$active_view = $this->get_active_view();
		$settings_page = $this->settings_page ?? new SettingsPage();
?>
		<div class="seamless-admin-shell">
			<?php $this->render_sidebar_navigation($active_view, $settings_page); ?>

			<div class="seamless-admin-main">
				<?php $this->render_content_header($active_view, $settings_page); ?>

				<div class="seamless-admin-content">
					<?php if ($active_view === 'settings') : ?>
						<?php $this->render_settings_view(); ?>
					<?php else : ?>
						<?php $this->render_overview_view(); ?>
					<?php endif; ?>
				</div>
			</div>
		</div>
<?php
		$this->render_scripts();
	}

	private function render_overview_view(): void
	{
?>
		<section class="seamless-overview-panel">
				<?php $this->render_welcome_header(); ?>
				<?php $this->render_stats_row(); ?>
				<?php $this->render_quick_access_header(); ?>
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
				<img src="<?php echo esc_url($logo_url); ?>" alt="Seamless" class="seamless-sidebar-logo" />
				<img src="<?php echo esc_url($icon_logo_url); ?>" alt="Seamless" class="seamless-sidebar-icon-logo" />
			</div>

			<div class="seamless-sidebar-scroll">
				<section class="seamless-sidebar-section">
					<p class="seamless-sidebar-section-label"><?php esc_html_e('Workspace', 'seamless'); ?></p>
					<nav class="seamless-sidebar-nav">
						<a href="<?php echo esc_url($this->get_view_url('overview')); ?>" class="seamless-sidebar-link <?php echo ($active_view === 'overview') ? 'is-active' : ''; ?>">
							<span class="dashicons dashicons-admin-home"></span>
							<span><?php esc_html_e('Overview', 'seamless'); ?></span>
						</a>
					</nav>
				</section>

				<section class="seamless-sidebar-section">
					<p class="seamless-sidebar-section-label"><?php esc_html_e('Settings', 'seamless'); ?></p>
					<nav class="seamless-sidebar-nav">
						<?php foreach ($tabs as $tab_key => $tab): ?>
							<a href="<?php echo esc_url($tab['url']); ?>" class="seamless-sidebar-link <?php echo ($active_view === 'settings' && $current_tab === $tab_key) ? 'is-active' : ''; ?>">
								<span class="dashicons <?php echo esc_attr($tab['icon']); ?>"></span>
								<span><?php echo esc_html($tab['label']); ?></span>
							</a>
						<?php endforeach; ?>
					</nav>
				</section>
			</div>

			<div class="seamless-sidebar-footer">
				<a href="https://seamlessams.com/" target="_blank" rel="noopener noreferrer"><?php esc_html_e('API Documentation', 'seamless'); ?></a>
				<button type="button" class="seamless-sidebar-toggle" aria-expanded="true" aria-label="<?php esc_attr_e('Collapse sidebar', 'seamless'); ?>">
					<span class="dashicons dashicons-arrow-left-alt2"></span>
				</button>
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
				<div class="seamless-admin-breadcrumbs">
					<span><?php esc_html_e('Seamless', 'seamless'); ?></span>
					<span class="dashicons dashicons-arrow-right-alt2"></span>
					<span><?php echo esc_html($active_view === 'settings' ? __('Settings', 'seamless') : __('Overview', 'seamless')); ?></span>
				</div>
				<h1 class="seamless-admin-page-title"><?php echo esc_html($title); ?></h1>
				<?php if (!empty($description)) : ?>
					<p class="seamless-admin-page-description"><?php echo esc_html($description); ?></p>
				<?php endif; ?>
			</div>

			<div class="seamless-admin-topbar-actions">
				<div class="seamless-admin-status-pill <?php echo $is_authenticated ? 'is-connected' : ''; ?>">
					<span class="seamless-admin-status-pill-dot"></span>
					<span><?php echo esc_html($is_authenticated ? __('Connected', 'seamless') : __('Needs Connection', 'seamless')); ?></span>
				</div>

				<?php if (class_exists('SeamlessAddon\Services\CacheService')): ?>
					<form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin: 0;">
						<?php wp_nonce_field('seamless_addon_clear_cache', 'seamless_addon_nonce'); ?>
						<input type="hidden" name="action" value="seamless_addon_clear_cache">
						<input type="hidden" name="cache_type" value="all">
						<input type="hidden" name="redirect_to" value="<?php echo esc_url($this->get_current_admin_url()); ?>">
						<button type="submit" class="button button-secondary seamless-clear-cache-btn">
							<span class="dashicons dashicons-update"></span>
							<?php esc_html_e('Clear All Cache', 'seamless'); ?>
						</button>
					</form>
				<?php endif; ?>
			</div>
		</div>
<?php
	}

	private function render_welcome_header(): void
	{
?>
		<div class="seamless-dashboard-header">
			<h1 class="seamless-dashboard-title"><?php esc_html_e('Seamless Overview', 'seamless'); ?></h1>
			<p class="seamless-dashboard-subtitle"><?php esc_html_e('Monitor your Seamless connection, jump into setup areas, and manage synced member experiences from one place.', 'seamless'); ?></p>
		</div>
<?php
	}

	private function render_stats_row(): void
	{
		$stats = $this->get_overview_stats_data();
?>
		<div class="seamless-stats-grid">
			<?php foreach ($stats as $stat) : ?>
				<div class="seamless-stat-card<?php echo !empty($stat['dynamic']) ? ' is-dynamic' : ''; ?>"<?php echo !empty($stat['dynamic_key']) ? ' data-stat-key="' . esc_attr($stat['dynamic_key']) . '"' : ''; ?>>
					<div class="seamless-stat-card-top">
						<span class="seamless-stat-label"><?php echo esc_html($stat['label']); ?></span>
						<span class="seamless-stat-icon <?php echo esc_attr($stat['accent_class']); ?>">
							<span class="dashicons <?php echo esc_attr($stat['icon_class']); ?>"></span>
						</span>
					</div>
					<p class="seamless-stat-value" data-stat-value><?php echo esc_html($stat['value']); ?></p>
					<p class="seamless-stat-trend" data-stat-trend><?php echo esc_html($stat['trend']); ?></p>
				</div>
			<?php endforeach; ?>
		</div>
<?php
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
		$view = isset($_GET['view']) ? sanitize_key(wp_unslash($_GET['view'])) : 'overview';

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
				'icon_class' => 'dashicons-admin-network',
				'accent_class' => 'is-primary',
				'link_url' => admin_url('admin.php?page=seamless&view=settings&tab=authentication'),
				'is_available' => true,
			],
			[
				'id' => 'event-sync',
				'title' => 'Event Sync & Display',
				'description' => 'Pull event data from Seamless, keep listings fresh, and manage how events appear across your WordPress site.',
				'icon_class' => 'dashicons-calendar-alt',
				'accent_class' => 'is-blue',
				'link_url' => admin_url('admin.php?page=seamless&view=settings&tab=events'),
				'is_available' => true,
			],
			[
				'id' => 'membership-sync',
				'title' => 'Membership Access Sync',
				'description' => 'Sync membership plans from Seamless to support access rules, member journeys, and protected WordPress experiences.',
				'icon_class' => 'dashicons-groups',
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
				'icon_class' => 'dashicons-admin-users',
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
				'icon_class' => 'dashicons-lock',
				'accent_class' => 'is-rose',
				'link_url' => admin_url('admin.php?page=seamless&view=settings&tab=restriction'),
				'is_available' => $is_authenticated,
				'disabled_text' => 'Requires Active Connection',
			],
			[
				'id' => 'shop-setup',
				'title' => 'Shop & Courses',
				'description' => 'Keep product routes, cart experiences, and commerce shortcodes aligned with the current plugin settings.',
				'icon_class' => 'dashicons-cart',
				'accent_class' => 'is-violet',
				'link_url' => admin_url('admin.php?page=seamless&view=settings&tab=shop'),
				'is_available' => true,
			],
		];
	}

	private function render_feature_card(array $card_data): void
	{
		$id = $card_data['id'] ?? '';
		$title = $card_data['title'] ?? '';
		$description = $card_data['description'] ?? '';
		$icon_class = $card_data['icon_class'] ?? 'dashicons-admin-generic';
		$accent_class = $card_data['accent_class'] ?? 'is-primary';
		$link_url = $card_data['link_url'] ?? '#';
		$is_available = $card_data['is_available'] ?? true;
		$disabled_text = $card_data['disabled_text'] ?? 'Coming Soon';

		$card_class = 'seamless-feature-card';
		if (!$is_available) {
			$card_class .= ' seamless-feature-card-disabled';
		}
?>
		<div class="<?php echo esc_attr($card_class); ?>" data-feature-id="<?php echo esc_attr($id); ?>">
			<div class="seamless-feature-card-icon <?php echo esc_attr($accent_class); ?>">
				<span class="dashicons <?php echo esc_attr($icon_class); ?>"></span>
			</div>
			<div class="seamless-feature-card-content">
				<div class="seamless-feature-card-heading">
					<h3 class="seamless-feature-card-title"><?php echo esc_html($title); ?></h3>
					<span class="seamless-feature-card-arrow dashicons dashicons-arrow-right-alt2"></span>
				</div>
				<p class="seamless-feature-card-description"><?php echo esc_html($description); ?></p>
				<div class="seamless-feature-card-footer">
					<?php if ($is_available): ?>
						<a href="<?php echo esc_url($link_url); ?>" class="seamless-feature-card-link">
							<?php echo esc_html($link_text); ?>
						</a>
					<?php else: ?>
						<span class="seamless-feature-card-disabled-text"><?php echo esc_html($disabled_text); ?></span>
					<?php endif; ?>
				</div>
			</div>
		</div>
<?php
	}

	private function get_overview_stats_data(): array
	{
		return [
			[
				'label' => __('Synced Events', 'seamless'),
				'value' => __('Loading...', 'seamless'),
				'trend' => __('Latest Seamless event feed', 'seamless'),
				'icon_class' => 'dashicons-calendar-alt',
				'dynamic' => true,
				'dynamic_key' => 'events',
			],
			[
				'label' => __('Active Members', 'seamless'),
				'value' => (string) $this->count_users_with_meta('seamless_active_memberships'),
				'trend' => __('synced members', 'seamless'),
				'icon_class' => 'dashicons-groups',
			],
			[
				'label' => __('SSO Logins', 'seamless'),
				'value' => (string) $this->count_users_with_meta('seamless_access_token'),
				'trend' => __('Active user tokens', 'seamless'),
				'icon_class' => 'dashicons-shield',
			],
			[
				'label' => __('Protected Pages', 'seamless'),
				'value' => (string) $this->count_protected_posts(),
				'trend' => __('Protected published pages', 'seamless'),
				'icon_class' => 'dashicons-lock',
			],
		];
	}

	private function count_users_with_meta(string $meta_key): int
	{
		$query = new \WP_User_Query([
			'fields' => 'ID',
			'number' => 1,
			'count_total' => true,
			'meta_query' => [
				[
					'key' => $meta_key,
					'compare' => 'EXISTS',
				],
			],
		]);

		return (int) $query->get_total();
	}

	private function count_protected_posts(): int
	{
		$protected_post_types = array_filter(array_map('trim', explode(',', (string) get_option('seamless_protected_post_types', ''))));
		if (empty($protected_post_types)) {
			return 0;
		}

		$total = 0;
		foreach ($protected_post_types as $post_type) {
			$counts = wp_count_posts($post_type);
			if ($counts && isset($counts->publish)) {
				$total += (int) $counts->publish;
			}
		}

		return $total;
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

	private function remove_all_notices(): void
	{
		remove_all_actions('admin_notices');
		remove_all_actions('all_admin_notices');
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

			.seamless-dashboard-wrapper .notice:not(.seamless-notice) {
				display: none !important;
			}

			.seamless-overview-panel {
				margin: 0;
			}
		</style>
<?php
	}

	private function render_scripts(): void
	{
?>
		<script>
			jQuery(document).ready(function($) {
				$('.seamless-feature-card').on('click', function(e) {
					if (!$(this).hasClass('seamless-feature-card-disabled')) {
						var link = $(this).find('.seamless-feature-card-link');
						if (link.length && e.target.tagName !== 'A') {
							window.location.href = link.attr('href');
						}
					}
				});

				const $eventStat = $('[data-stat-key="events"]');
				if ($eventStat.length && window.SeamlessAPI && typeof window.SeamlessAPI.fetchAllEvents === 'function') {
					window.SeamlessAPI.fetchAllEvents()
						.then(function(events) {
							var total = Array.isArray(events) ? events.length : 0;
							$eventStat.find('[data-stat-value]').text(total);
							$eventStat.find('[data-stat-trend]').text(total > 0 ? 'Published events' : 'No events returned from Seamless');
						})
						.catch(function() {
							$eventStat.find('[data-stat-value]').text('0');
							$eventStat.find('[data-stat-trend]').text('Connect Seamless to load event totals');
						});
				}

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
