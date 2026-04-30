<?php
$instance_id = isset($instance_id) && $instance_id ? $instance_id : uniqid('seamless-shop-', false);
?>
<div class="seamless-shop-wrapper seamless-courses-list-shell" data-shop-instance="<?php echo esc_attr($instance_id); ?>">
	<div class="seamless-shop-loader" aria-hidden="false">
		<?php $lid = substr(md5(uniqid('sl', true)), 0, 6); ?>
		<div class="seamless-plugin-loader" role="status" aria-label="<?php esc_attr_e('Loading', 'seamless'); ?>">
			<svg xmlns="http://www.w3.org/2000/svg" class="sync-wheel-svg" viewBox="62 64 282 282" aria-hidden="true">
				<defs>
					<linearGradient id="swg1-<?php echo esc_attr($lid); ?>" x1="135.2" y1="221.8" x2="271.3" y2="221.8" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
						<stop offset="0" stop-color="#0fd" />
						<stop offset=".2" stop-color="#2ac9e4" />
						<stop offset=".4" stop-color="#6383ed" />
						<stop offset=".6" stop-color="#904bf5" />
						<stop offset=".8" stop-color="#b022fa" />
						<stop offset=".9" stop-color="#c40afd" />
						<stop offset="1" stop-color="#cc01ff" />
					</linearGradient>
					<linearGradient id="swg2-<?php echo esc_attr($lid); ?>" x1="62.7" y1="214.6" x2="343.9" y2="214.6" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
						<stop offset="0" stop-color="#0fd" />
						<stop offset=".2" stop-color="#2ac9e4" />
						<stop offset=".4" stop-color="#6383ed" />
						<stop offset=".6" stop-color="#904bf5" />
						<stop offset=".8" stop-color="#b022fa" />
						<stop offset=".9" stop-color="#c40afd" />
						<stop offset="1" stop-color="#cc01ff" />
					</linearGradient>
					<linearGradient id="swg3-<?php echo esc_attr($lid); ?>" x1="99.4" y1="214.7" x2="314.3" y2="214.7" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse">
						<stop offset="0" stop-color="#0fd" />
						<stop offset=".2" stop-color="#2ac9e4" />
						<stop offset=".4" stop-color="#6383ed" />
						<stop offset=".6" stop-color="#904bf5" />
						<stop offset=".8" stop-color="#b022fa" />
						<stop offset=".9" stop-color="#c40afd" />
						<stop offset="1" stop-color="#cc01ff" />
					</linearGradient>
				</defs>
				<g class="sl-ring-outer">
					<path fill="url(#swg2-<?php echo esc_attr($lid); ?>)" d="M203,64.7c-77.5.2-140.5,63.4-140.3,140.9,0,34.4,12.6,65.9,33.2,90.3-1.6,3.2-2.6,6.8-2.6,10.6,0,12.6,10.3,22.9,23,22.9s9.6-1.6,13.3-4.3c21.5,13.3,46.9,21,74,20.9,77.5-.2,140.5-63.4,140.3-140.9-.2-77.5-63.4-140.5-140.9-140.3h0ZM116.3,316c-5.2,0-9.5-4.2-9.5-9.5s4.2-9.5,9.5-9.5,9.5,4.2,9.5,9.5-4.2,9.5-9.5,9.5ZM203.6,332.5c-24.1,0-46.6-6.6-65.8-18.2.9-2.5,1.4-5.1,1.4-7.9,0-12.6-10.3-22.9-23-22.9s-7.7,1-10.9,2.8c-18.2-21.9-29.1-50-29.2-80.7-.2-70.1,56.8-127.3,126.9-127.5s127.3,56.8,127.5,126.9-56.8,127.3-126.9,127.5Z" />
				</g>
				<g class="sl-ring-mid">
					<path fill="url(#swg3-<?php echo esc_attr($lid); ?>)" d="M305.1,226.9c1.5-7,2.3-14.2,2.3-21.6,0-57.4-46.7-104-104-104s-104,46.7-104,104,46.7,104,104,104,64.3-16.4,83.3-41.7c1.5.3,3.1.5,4.7.5,12.6,0,22.9-10.3,22.9-22.9s-3.6-14.1-9.2-18.3h0ZM203.3,296c-50,0-90.6-40.7-90.6-90.6s40.7-90.6,90.6-90.6,90.6,40.7,90.6,90.6-.6,11.5-1.6,17h-1c-12.6,0-22.9,10.3-22.9,22.9s2.4,11.7,6.4,15.8c-16.6,21.2-42.4,34.9-71.4,34.9h0ZM291.4,254.7c-5.2,0-9.5-4.3-9.5-9.5s4.3-9.5,9.5-9.5,9.5,4.3,9.5,9.5-4.3,9.5-9.5,9.5Z" />
				</g>
				<g class="sl-ring-inner">
					<path fill="url(#swg1-<?php echo esc_attr($lid); ?>)" d="M225.6,141.1c-2.2-10.4-11.5-18.2-22.5-18.1-11,0-20.2,7.9-22.4,18.3-26.5,9.4-45.5,34.7-45.5,64.3s30.7,68,68.2,67.9c37.5,0,68-30.7,67.9-68.2,0-29.7-19.2-54.9-45.8-64.1h0ZM203.2,136.3c5.2,0,9.5,4.2,9.5,9.5s-4.2,9.5-9.5,9.5-9.5-4.2-9.5-9.5,4.2-9.5,9.5-9.5ZM203.5,260c-30.1,0-54.7-24.4-54.8-54.5,0-22.7,13.8-42.2,33.5-50.5,3.5,8.1,11.7,13.8,21.1,13.8s17.5-5.7,21-13.9c19.7,8.2,33.7,27.7,33.7,50.3s-24.4,54.7-54.5,54.8Z" />
				</g>
			</svg>
		</div>
		<p><?php esc_html_e('Loading products...', 'seamless'); ?></p>
	</div>

	<div class="seamless-shop-content" hidden>
		<section class="seamless-shop-toolbar">
			<div class="seamless-shop-summary" aria-live="polite"><?php esc_html_e('Showing 0 products', 'seamless'); ?></div>

			<div class="seamless-nd-controls seamless-shop-toolbar-actions">
				<button type="button" class="seamless-nd-btn seamless-nd-filters-btn seamless-shop-filter-toggle" aria-expanded="false" aria-controls="<?php echo esc_attr($instance_id); ?>-filters-panel">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="15" height="15" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.3 48.3 0 0 1 12 3" />
					</svg>
					<span><?php esc_html_e('Filters', 'seamless'); ?></span>
					<span class="seamless-nd-filter-count seamless-shop-filter-count" hidden>0</span>
					<svg class="seamless-nd-chevron seamless-shop-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</button>

				<div class="seamless-nd-dropdown-wrap seamless-shop-dropdown-wrap">
					<button type="button" class="seamless-nd-btn seamless-nd-sort-btn seamless-shop-sort-trigger" aria-expanded="false" aria-controls="<?php echo esc_attr($instance_id); ?>-sort-menu">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<line x1="12" y1="5" x2="12" y2="19"></line>
							<polyline points="5 12 12 5 19 12"></polyline>
						</svg>
						<span class="seamless-nd-sort-label seamless-shop-sort-label"><?php esc_html_e('Featured', 'seamless'); ?></span>
						<svg class="seamless-nd-chevron seamless-shop-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<polyline points="6 9 12 15 18 9"></polyline>
						</svg>
					</button>
					<ul class="seamless-nd-menu seamless-shop-sort-menu" id="<?php echo esc_attr($instance_id); ?>-sort-menu" role="listbox" aria-label="Sort products" hidden>
						<li data-sort="featured" class="seamless-nd-menu-selected is-selected"><?php esc_html_e('Featured', 'seamless'); ?></li>
						<li data-sort="price_asc"><?php esc_html_e('Price: Low to High', 'seamless'); ?></li>
						<li data-sort="price_desc"><?php esc_html_e('Price: High to Low', 'seamless'); ?></li>
						<li data-sort="title_asc"><?php esc_html_e('Title (A-Z)', 'seamless'); ?></li>
						<li data-sort="title_desc"><?php esc_html_e('Title (Z-A)', 'seamless'); ?></li>
					</ul>
				</div>

				<button type="button" class="seamless-shop-cart-button" aria-label="<?php esc_attr_e('View cart', 'seamless'); ?>">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<circle cx="9" cy="20" r="1"></circle>
						<circle cx="18" cy="20" r="1"></circle>
						<path d="M2 3h3l2.4 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6.2"></path>
					</svg>
					<!-- <svg xmlns="http://www.w3.org/2000/svg" fill="none" width="20" height="20" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60 60 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0" />
					</svg> -->
					<span class="seamless-shop-cart-label"><?php esc_html_e('View Cart', 'seamless'); ?></span>
					<span class="seamless-shop-cart-count" hidden>0</span>
				</button>
			</div>
		</section>

		<section class="seamless-shop-filters-panel" id="<?php echo esc_attr($instance_id); ?>-filters-panel" hidden>
			<div class="seamless-shop-filters-heading">
				<h3><?php esc_html_e('Filter Products', 'seamless'); ?></h3>
				<button type="button" class="seamless-shop-clear-button seamless-shop-reset-button"><?php esc_html_e('Clear All Filters', 'seamless'); ?></button>
			</div>

			<div class="seamless-shop-filters-grid">
				<div class="seamless-shop-filter-group">
					<div class="seamless-shop-filter-label"><?php esc_html_e('Search', 'seamless'); ?></div>
					<div class="seamless-nd-search-field seamless-shop-search-field">
						<svg class="seamless-nd-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<circle cx="11" cy="11" r="8"></circle>
							<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
						</svg>
						<input
							id="<?php echo esc_attr($instance_id); ?>-search"
							type="search"
							class="seamless-nd-search-input seamless-shop-search"
							placeholder="<?php esc_attr_e('Find items...', 'seamless'); ?>"
							autocomplete="off" />
					</div>
				</div>

				<div class="seamless-shop-filter-group">
					<div class="seamless-shop-filter-label"><?php esc_html_e('Category', 'seamless'); ?></div>
					<div class="seamless-shop-checkbox-group seamless-shop-category-options">
						<label class="seamless-shop-checkbox-row is-all-option">
							<input type="checkbox" class="seamless-shop-all-categories" checked>
							<span><?php esc_html_e('All categories', 'seamless'); ?></span>
						</label>
						<span class="seamless-shop-filter-placeholder"><?php esc_html_e('Loading categories...', 'seamless'); ?></span>
					</div>
				</div>

				<div class="seamless-shop-filter-group">
					<div class="seamless-shop-filter-label"><?php esc_html_e('Product Type', 'seamless'); ?></div>
					<div class="seamless-shop-checkbox-group">
						<label class="seamless-shop-checkbox-row">
							<input type="checkbox" name="shop-product-type" value="all" checked>
							<span><?php esc_html_e('All types', 'seamless'); ?></span>
						</label>
						<label class="seamless-shop-checkbox-row">
							<input type="checkbox" name="shop-product-type" value="physical">
							<span><?php esc_html_e('Physical', 'seamless'); ?></span>
						</label>
						<label class="seamless-shop-checkbox-row">
							<input type="checkbox" name="shop-product-type" value="virtual">
							<span><?php esc_html_e('Virtual', 'seamless'); ?></span>
						</label>
						<label class="seamless-shop-checkbox-row">
							<input type="checkbox" name="shop-product-type" value="downloadable">
							<span><?php esc_html_e('Downloadable', 'seamless'); ?></span>
						</label>
					</div>
				</div>

				<div class="seamless-shop-filter-group">
					<div class="seamless-shop-filter-label"><?php esc_html_e('Availability', 'seamless'); ?></div>
					<div class="seamless-shop-checkbox-group">
						<label class="seamless-shop-checkbox-row">
							<input type="checkbox" name="shop-availability" value="all" checked>
							<span><?php esc_html_e('All availability', 'seamless'); ?></span>
						</label>
						<label class="seamless-shop-checkbox-row">
							<input type="checkbox" name="shop-availability" value="available">
							<span><?php esc_html_e('In stock', 'seamless'); ?></span>
						</label>
						<label class="seamless-shop-checkbox-row">
							<input type="checkbox" name="shop-availability" value="unavailable">
							<span><?php esc_html_e('Low stock', 'seamless'); ?></span>
						</label>
					</div>
				</div>
			</div>
		</section>

		<div class="seamless-shop-grid" aria-live="polite"></div>
		<div class="seamless-shop-empty" hidden>
			<p><?php esc_html_e('No products matched your current filters.', 'seamless'); ?></p>
		</div>
		<div class="seamless-pagination-wrapper seamless-shop-pagination" hidden></div>
	</div>
</div>
