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
?>
		<div class="seamless-dashboard-wrapper">
			<?php $this->render_top_navigation($active_view); ?>

			<div class="seamless-dashboard-container">
				<?php if ($active_view === 'settings') : ?>
					<?php $this->render_settings_view(); ?>
				<?php else : ?>
					<?php $this->render_overview_view(); ?>
				<?php endif; ?>
			</div>
		</div>
<?php
		$this->render_scripts();
	}

	private function render_overview_view(): void
	{
?>
		<section class="seamless-overview-panel">
			<div class="seamless-overview-panel-inner">
				<?php $this->render_welcome_header(); ?>
				<?php $this->render_feature_grid(); ?>
			</div>
		</section>
<?php
	}

	private function render_settings_view(): void
	{
		$settings_page = $this->settings_page ?? new SettingsPage();
?>
		<div class="seamless-settings-content">
			<?php $settings_page->render_settings_content(); ?>
		</div>
<?php
	}

	private function render_top_navigation(string $active_view = 'overview'): void
	{
		$logo_url = $this->get_logo_url();
		$current_tab = isset($_GET['tab']) ? sanitize_key(wp_unslash($_GET['tab'])) : 'authentication';
?>
		<div class="seamless-top-nav">
			<div class="seamless-top-nav-content">
				<div class="seamless-top-nav-left">
					<div class="seamless-logo-container">
						<img src="<?php echo esc_url($logo_url); ?>" alt="Seamless" class="seamless-logo-img" height="50" style="height: 50px; width: auto;" />
					</div>
					<nav class="seamless-nav-tabs" aria-label="<?php esc_attr_e('Seamless sections', 'seamless'); ?>">
						<a href="<?php echo esc_url($this->get_view_url('overview')); ?>" class="seamless-nav-tab <?php echo ($active_view === 'overview') ? 'active' : ''; ?>">
							<span class="dashicons dashicons-admin-home"></span>
							<span><?php esc_html_e('Overview', 'seamless'); ?></span>
						</a>
						<a href="<?php echo esc_url($this->get_view_url('settings', $current_tab)); ?>" class="seamless-nav-tab <?php echo ($active_view === 'settings') ? 'active' : ''; ?>">
							<span class="dashicons dashicons-admin-settings"></span>
							<span><?php esc_html_e('Settings', 'seamless'); ?></span>
						</a>
					</nav>
				</div>
				<div class="seamless-top-nav-right">
					<?php if (class_exists('SeamlessAddon\Services\CacheService')): ?>
						<form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin: 0;">
							<?php wp_nonce_field('seamless_addon_clear_cache', 'seamless_addon_nonce'); ?>
							<input type="hidden" name="action" value="seamless_addon_clear_cache">
							<input type="hidden" name="cache_type" value="all">
							<button type="submit" class="button button-secondary seamless-clear-cache-btn">
								<span class="dashicons dashicons-update"></span>
								<?php esc_html_e('Clear All Cache', 'seamless'); ?>
							</button>
						</form>
					<?php endif; ?>
				</div>
			</div>
		</div>
<?php
	}

	private function render_welcome_header(): void
	{
?>
		<div class="seamless-dashboard-header">
			<h1 class="seamless-dashboard-title"><?php esc_html_e('Seamless Overview', 'seamless'); ?></h1>
			<p class="seamless-dashboard-subtitle"><?php esc_html_e('Real-time management of events, memberships, and advanced features', 'seamless'); ?></p>
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
				'link_url' => admin_url('admin.php?page=seamless&view=settings&tab=authentication'),
				'link_text' => $is_authenticated ? 'Review Connection' : 'Connect Now',
				'is_available' => true,
			],
			[
				'id' => 'event-sync',
				'title' => 'Event Sync & Display',
				'description' => 'Pull event data from Seamless, keep listings fresh, and manage how events appear across your WordPress site.',
				'icon_class' => 'dashicons-calendar-alt',
				'link_url' => admin_url('admin.php?page=seamless&view=settings&tab=events'),
				'link_text' => 'Manage Events',
				'is_available' => true,
			],
			[
				'id' => 'membership-sync',
				'title' => 'Membership Access Sync',
				'description' => 'Sync membership plans from Seamless to support access rules, member journeys, and protected WordPress experiences.',
				'icon_class' => 'dashicons-groups',
				'link_url' => admin_url('admin.php?page=seamless&view=settings&tab=membership'),
				'link_text' => 'Manage Memberships',
				'is_available' => true,
			],
			[
				'id' => 'sso-integration',
				'title' => 'Single Sign-On',
				'description' => $is_authenticated
					? 'Configure Seamless-powered SSO so members can sign in smoothly with a connected authentication flow.'
					: 'SSO becomes available after your site is connected to Seamless AMS and ready for secure authentication setup.',
				'icon_class' => 'dashicons-admin-users',
				'link_url' => admin_url('admin.php?page=seamless&view=settings&tab=sso'),
				'link_text' => 'Configure SSO',
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
				'link_url' => admin_url('admin.php?page=seamless&view=settings&tab=restriction'),
				'link_text' => 'Set Access Rules',
				'is_available' => $is_authenticated,
				'disabled_text' => 'Requires Active Connection',
			],
		];
	}

	private function render_feature_card(array $card_data): void
	{
		$id = $card_data['id'] ?? '';
		$title = $card_data['title'] ?? '';
		$description = $card_data['description'] ?? '';
		$icon_class = $card_data['icon_class'] ?? 'dashicons-admin-generic';
		$link_url = $card_data['link_url'] ?? '#';
		$link_text = $card_data['link_text'] ?? 'Learn More';
		$is_available = $card_data['is_available'] ?? true;
		$disabled_text = $card_data['disabled_text'] ?? 'Coming Soon';

		$card_class = 'seamless-feature-card';
		if (!$is_available) {
			$card_class .= ' seamless-feature-card-disabled';
		}
?>
		<div class="<?php echo esc_attr($card_class); ?>" data-feature-id="<?php echo esc_attr($id); ?>">
			<div class="seamless-feature-card-icon">
				<span class="dashicons <?php echo esc_attr($icon_class); ?>"></span>
			</div>
			<div class="seamless-feature-card-content">
				<h3 class="seamless-feature-card-title"><?php echo esc_html($title); ?></h3>
				<p class="seamless-feature-card-description"><?php echo esc_html($description); ?></p>
				<?php if ($is_available): ?>
					<a href="<?php echo esc_url($link_url); ?>" class="seamless-feature-card-link">
						<?php echo esc_html($link_text); ?> &rarr;
					</a>
				<?php else: ?>
					<span class="seamless-feature-card-disabled-text"><?php echo esc_html($disabled_text); ?></span>
				<?php endif; ?>
			</div>
		</div>
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
		$white_grid_url = plugins_url('assets/white-grid-new.png', __FILE__);
?>
		<style>
			.seamless-dashboard-wrapper .notice:not(.seamless-notice) {
				display: none !important;
			}

			.seamless-dashboard-wrapper {
				margin-left: -20px;
				margin-top: -10px;
				background: linear-gradient(180deg, #fbfbfb 0%, #f5f5f5 100%);
				z-index: -1;
			}

			.seamless-dashboard-wrapper a:active,
			.seamless-dashboard-wrapper a:hover {
				color: #6c5ce7;
			}

			.seamless-top-nav {
				position: sticky;
				top: 32px;
				background: #ffffff;
				border-bottom: 1px solid #e5e5e5;
				z-index: 999;
				padding: 0 32px;
			}

			@media screen and (max-width: 782px) {
				.seamless-top-nav {
					top: 46px;
				}
			}

			.seamless-top-nav-content {
				margin: 0 auto;
				display: flex;
				align-items: center;
				justify-content: space-between;
				height: 64px;
			}

			.seamless-top-nav-left {
				display: flex;
				align-items: center;
				gap: 32px;
				flex-wrap: wrap;
			}

			.seamless-top-nav-right {
				display: flex;
				align-items: center;
				gap: 16px;
			}

			.seamless-clear-cache-btn {
				display: inline-flex !important;
				align-items: center !important;
				gap: 6px !important;
				padding: 8px 16px !important;
				height: auto !important;
				font-size: 13px !important;
			}

			.seamless-clear-cache-btn .dashicons {
				font-size: 16px;
				width: 16px;
				height: 16px;
			}

			.seamless-logo-container {
				display: flex;
				align-items: center;
				gap: 12px;
			}

			.seamless-logo-img {
				height: 50px;
				width: auto;
				max-width: 150px;
				object-fit: contain;
			}

			.seamless-nav-tabs {
				display: flex;
				gap: 8px;
				flex-wrap: wrap;
			}

			.seamless-nav-tab {
				display: inline-flex;
				align-items: center;
				gap: 8px;
				padding: 8px 16px;
				border-radius: 6px;
				text-decoration: none;
				color: #6b7280;
				font-size: 14px;
				font-weight: 500;
				transition: all 0.2s ease;
			}

			.seamless-nav-tab .dashicons {
				font-size: 18px;
				width: 18px;
				height: 18px;
			}

			.seamless-nav-tab:hover {
				background: #f3f4f6;
				color: #374151;
			}

			.seamless-nav-tab.active {
				background: #eff6ff;
				color: #6c5ce7;
			}

			.seamless-nav-tab:focus {
				box-shadow: 0 0 0 2px rgba(108, 92, 231, 0.18);
				outline: none;
			}

			.seamless-dashboard-container {
				min-height: 100vh;
				inset: 0;
				background-image: url('<?php echo esc_url($white_grid_url); ?>');
				opacity: 1;
				background-position: center;
				background-size: cover;
			}

			.seamless-dashboard-container::before {
				content: "";
				position: absolute;
				inset: 0;
				background: rgba(255, 255, 255, 0.7);
				opacity: 0.9;
				z-index: 0;
			}

			.seamless-dashboard-container:has(.seamless-settings-content) {
				background: none;
			}

			.seamless-dashboard-wrapper:has(.seamless-settings-content) .seamless-dashboard-container::before {
				background: none;
			}

			.seamless-dashboard-wrapper:has(.seamless-settings-content) {
				background: #f5f5f5;
			}

			.seamless-dashboard-container>* {
				position: relative;
				z-index: 1;
			}

			section.seamless-overview-panel {
				max-width: 1400px;
				margin: 0 auto;
				padding: 30px;
			}

			.seamless-overview-panel-inner {
				position: relative;
				padding: 12px 18px 40px;
			}

			.seamless-dashboard-header,
			.seamless-settings-header {
				text-align: center;
				margin: 60px auto;
			}

			.seamless-dashboard-title {
				font-size: 42px;
				font-weight: 700;
				color: #1a1a1a;
				margin: 0 0 30px 0;
			}

			.seamless-dashboard-subtitle {
				font-size: 18px;
				color: #6b7280;
				margin: 0;
			}

			.seamless-feature-grid {
				display: grid;
				grid-template-columns: repeat(3, 1fr);
				gap: 24px;
				margin-top: 32px;
			}

			@media screen and (max-width: 1024px) {
				.seamless-feature-grid {
					grid-template-columns: repeat(2, 1fr);
				}
			}

			@media screen and (max-width: 640px) {
				.seamless-feature-grid {
					grid-template-columns: 1fr;
				}
			}

			@media screen and (max-width: 782px) {
				.seamless-top-nav {
					padding: 0 20px;
				}

				.seamless-top-nav-content {
					height: auto;
					padding: 14px 0;
					align-items: flex-start;
					gap: 16px;
				}

				.seamless-top-nav-left,
				.seamless-top-nav-right {
					width: 100%;
				}

				.seamless-dashboard-container {
					padding: 24px 20px 36px;
				}

				.seamless-dashboard-header,
				.seamless-settings-header {
					margin: 32px auto;
				}

				.seamless-dashboard-title {
					font-size: 30px;
					margin-bottom: 18px;
				}

				.seamless-dashboard-subtitle {
					font-size: 16px;
				}
			}

			.seamless-feature-card {
				background: #ffffff;
				border: 1px solid #e5e5e5;
				border-radius: 12px;
				padding: 24px;
				transition: all 0.3s ease;
				cursor: pointer;
			}

			.seamless-feature-card:hover {
				box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
				border-color: #6c5ce7;
			}

			.seamless-feature-card-disabled {
				opacity: 0.6;
				cursor: not-allowed;
			}

			.seamless-feature-card-disabled:hover {
				transform: none;
				box-shadow: none;
				border-color: #e5e5e5;
			}

			.seamless-feature-card-icon {
				width: 48px;
				height: 48px;
				background: #eff6ff;
				border-radius: 10px;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-bottom: 16px;
			}

			.seamless-feature-card-icon .dashicons {
				font-size: 24px;
				width: 24px;
				height: 24px;
				color: #6c5ce7;
			}

			.seamless-feature-card-title {
				font-size: 18px;
				font-weight: 600;
				color: #1a1a1a;
				margin: 0 0 8px 0;
			}

			.seamless-feature-card-description {
				font-size: 14px;
				color: #6b7280;
				line-height: 1.6;
				margin: 0 0 16px 0;
			}

			.seamless-feature-card-link {
				display: inline-flex;
				align-items: center;
				gap: 4px;
				color: #6c5ce7;
				text-decoration: none;
				font-size: 14px;
				font-weight: 500;
				transition: gap 0.2s ease;
			}

			.seamless-feature-card-link:hover {
				gap: 8px;
			}

			.seamless-feature-card-disabled-text {
				color: #9ca3af;
				font-size: 14px;
				font-weight: 500;
			}

			.seamless-settings-content {
				background: transparent;
				border-radius: 0;
				padding: 48px 32px;
				box-shadow: none;
				max-width: 1400px;
			}

			.seamless-settings-content .nav-tab-wrapper {
				border-radius: 12px 12px 0 0;
				border: 1px solid #e1e5e9;
			}

			.seamless-settings-content .seamless-tab-content {
				padding: 0;
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
			});
		</script>
<?php
	}
}
