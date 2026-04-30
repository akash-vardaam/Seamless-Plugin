<?php
$shop_url = home_url('/' . trim((string) get_option('seamless_product_list_endpoint', 'shop'), '/'));
?>
<div class="seamless-cart-page" id="seamless-cart-container">
  <nav class="seamless-shop-breadcrumbs seamless-cart-breadcrumbs" aria-label="Breadcrumb">
    <a href="<?php echo esc_url(home_url('/')); ?>"><?php esc_html_e('Home', 'seamless'); ?></a>
    <span>/</span>
    <a href="<?php echo esc_url($shop_url); ?>"><?php esc_html_e('Shop', 'seamless'); ?></a>
    <span>/</span>
    <span><?php esc_html_e('Cart', 'seamless'); ?></span>
    <a href="<?php echo esc_url($shop_url); ?>" class="seamless-cart-continue"> <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
      </svg><?php esc_html_e('Continue Shopping', 'seamless'); ?></a>
  </nav>

  <div class="seamless-cart-loading" aria-hidden="false">
    <div class="seamless-cart-loading-layout" aria-label="<?php esc_attr_e('Loading cart', 'seamless'); ?>">
      <div class="seamless-cart-loading-items">
        <article class="seamless-cart-item seamless-cart-item-skeleton">
          <div class="seamless-cart-item-main">
            <div class="seamless-cart-item-media">
              <div class="seamless-cart-skeleton-block seamless-cart-skeleton-image"></div>
            </div>
            <div class="seamless-cart-item-info">
              <div class="seamless-cart-skeleton-block seamless-cart-skeleton-title"></div>
              <div class="seamless-cart-skeleton-block seamless-cart-skeleton-meta"></div>
              <div class="seamless-cart-skeleton-qty">
                <span class="seamless-cart-skeleton-block"></span>
                <span class="seamless-cart-skeleton-block"></span>
                <span class="seamless-cart-skeleton-block"></span>
              </div>
            </div>
          </div>
          <div class="seamless-cart-item-side">
            <div class="seamless-cart-item-price">
              <div class="seamless-cart-skeleton-block seamless-cart-skeleton-price"></div>
              <div class="seamless-cart-skeleton-block seamless-cart-skeleton-unit-price"></div>
            </div>
            <div class="seamless-cart-skeleton-block seamless-cart-skeleton-remove"></div>
          </div>
        </article>
        <article class="seamless-cart-item seamless-cart-item-skeleton">
          <div class="seamless-cart-item-main">
            <div class="seamless-cart-item-media">
              <div class="seamless-cart-skeleton-block seamless-cart-skeleton-image"></div>
            </div>
            <div class="seamless-cart-item-info">
              <div class="seamless-cart-skeleton-block seamless-cart-skeleton-title"></div>
              <div class="seamless-cart-skeleton-block seamless-cart-skeleton-meta"></div>
              <div class="seamless-cart-skeleton-qty">
                <span class="seamless-cart-skeleton-block"></span>
                <span class="seamless-cart-skeleton-block"></span>
                <span class="seamless-cart-skeleton-block"></span>
              </div>
            </div>
          </div>
          <div class="seamless-cart-item-side">
            <div class="seamless-cart-item-price">
              <div class="seamless-cart-skeleton-block seamless-cart-skeleton-price"></div>
              <div class="seamless-cart-skeleton-block seamless-cart-skeleton-unit-price"></div>
            </div>
            <div class="seamless-cart-skeleton-block seamless-cart-skeleton-remove"></div>
          </div>
        </article>
      </div>
      <div class="seamless-cart-loading-summary seamless-cart-summary-box">
        <div class="seamless-cart-skeleton-block seamless-cart-skeleton-summary-title"></div>
        <div class="seamless-cart-skeleton-row">
          <div class="seamless-cart-skeleton-block seamless-cart-skeleton-summary-label"></div>
          <div class="seamless-cart-skeleton-block seamless-cart-skeleton-summary-value"></div>
        </div>
        <div class="seamless-cart-skeleton-row">
          <div class="seamless-cart-skeleton-block seamless-cart-skeleton-summary-label"></div>
          <div class="seamless-cart-skeleton-block seamless-cart-skeleton-summary-value"></div>
        </div>
        <div class="seamless-cart-skeleton-block seamless-cart-skeleton-checkout"></div>
      </div>
    </div>
  </div>

  <div id="seamless-cart-notice" class="seamless-shop-cart-notice" role="status" aria-live="polite" hidden></div>

  <div class="seamless-cart-layout" hidden>
    <div class="seamless-cart-items-column">
      <div id="seamless-cart-items-container"></div>
      <div class="seamless-cart-actions-row" aria-label="<?php esc_attr_e('Cart actions', 'seamless'); ?>">
        <button type="button" id="seamless-cart-update-button" class="seamless-cart-update-button" disabled>
          <?php esc_html_e('Update Cart', 'seamless'); ?>
        </button>
        <span id="seamless-cart-update-status" class="seamless-cart-update-status" aria-live="polite"></span>
      </div>
      <div id="seamless-cart-pagination" class="seamless-pagination-wrapper seamless-cart-pagination" hidden></div>
      <div id="seamless-cart-empty" class="seamless-cart-empty" hidden>
        <h2><?php esc_html_e('Your cart is currently empty.', 'seamless'); ?></h2>
        <a href="<?php echo esc_url($shop_url); ?>" class="seamless-cart-return-link"><?php esc_html_e('Return to Shop', 'seamless'); ?></a>
      </div>
    </div>

    <div class="seamless-cart-summary-column">
      <div class="seamless-cart-summary-box">
        <h3><?php esc_html_e('Order Summary', 'seamless'); ?></h3>
        <div class="seamless-cart-summary-row">
          <span><?php esc_html_e('Subtotal', 'seamless'); ?></span>
          <span id="seamless-cart-subtotal">$0.00</span>
        </div>
        <div class="seamless-cart-summary-row seamless-cart-summary-total">
          <span><?php esc_html_e('TOTAL', 'seamless'); ?></span>
          <span id="seamless-cart-total">$0.00</span>
        </div>
        <a href="#" id="seamless-checkout-button" class="seamless-cart-checkout-btn"><?php esc_html_e('Proceed to Checkout', 'seamless'); ?></a>
        <p class="seamless-cart-summary-note"><?php esc_html_e('Taxes and shipping calculated at checkout.', 'seamless'); ?></p>
      </div>
    </div>
  </div>
</div>