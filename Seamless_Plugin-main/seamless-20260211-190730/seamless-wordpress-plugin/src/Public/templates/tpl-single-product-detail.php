<div class="seamless-shop-detail" data-product-slug="<?php echo esc_attr($product_slug); ?>">
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
		<p><?php esc_html_e('Loading product details...', 'seamless'); ?></p>
	</div>
	<div class="seamless-shop-detail-content" hidden></div>
</div>