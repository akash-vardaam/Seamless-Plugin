function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function stripHtml(value) {
  if (!value) {
    return "";
  }

  const div = document.createElement("div");
  div.innerHTML = String(value);
  return (div.textContent || div.innerText || "").trim();
}

function truncateText(value, maxLength = 110) {
  const text = stripHtml(value);
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

function formatSafeRichText(value) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = raw;

  const allowedTags = new Set([
    "p",
    "br",
    "ul",
    "ol",
    "li",
    "strong",
    "b",
    "em",
    "i",
    "a",
    "h2",
    "h3",
    "h4",
    "blockquote",
  ]);

  const sanitizeNode = (node) => {
    if (!node) {
      return "";
    }

    if (node.nodeType === Node.TEXT_NODE) {
      return escapeHtml(node.textContent || "");
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const tag = String(node.tagName || "").toLowerCase();
    const children = Array.from(node.childNodes || [])
      .map((child) => sanitizeNode(child))
      .join("");

    if (!allowedTags.has(tag)) {
      return children;
    }

    if (tag === "br") {
      return "<br>";
    }

    if (tag === "a") {
      const href = String(node.getAttribute("href") || "").trim();
      const safeHref =
        /^(https?:|mailto:|tel:|\/|#)/i.test(href) ? href : "";
      const attributes = safeHref
        ? ` href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer"`
        : "";
      return `<a${attributes}>${children}</a>`;
    }

    return `<${tag}>${children}</${tag}>`;
  };

  const sanitized = Array.from(wrapper.childNodes || [])
    .map((node) => sanitizeNode(node))
    .join("")
    .trim();

  if (sanitized) {
    return sanitized;
  }

  return escapeHtml(stripHtml(raw)).replace(/\n/g, "<br>");
}

function getApiErrorMessage(error, fallback = "") {
  const apiMessage =
    error?.responseJson?.message ||
    error?.responseJson?.error ||
    "";

  if (apiMessage) {
    return String(apiMessage);
  }

  const body = String(error?.responseBody || "").trim();
  if (!body) {
    return String(fallback || "");
  }

  try {
    const parsed = JSON.parse(body);
    return (
      parsed?.message ||
      parsed?.error ||
      String(fallback || "")
    );
  } catch (_) {
    return String(fallback || "");
  }
}

let __seamlessZoomModal = null;

function ensureSeamlessZoomModal() {
  if (typeof document === "undefined") return null;
  if (__seamlessZoomModal) return __seamlessZoomModal;

  const root = document.createElement("div");
  root.className = "seamless-shop-zoom-modal";
  root.hidden = true;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Image zoom");

  root.innerHTML = `
    <div class="seamless-shop-zoom-backdrop" data-zoom-close></div>
    <div class="seamless-shop-zoom-dialog" role="document">
      <button type="button" class="seamless-shop-zoom-close" data-zoom-close aria-label="Close zoom view">
        <span aria-hidden="true">&times;</span>
      </button>
      <div class="seamless-shop-zoom-stage" data-zoom-stage>
        <img class="seamless-shop-zoom-image" alt="" />
      </div>
      <div class="seamless-shop-zoom-hint" aria-hidden="true">Scroll to zoom, drag to pan</div>
    </div>
  `;

  document.body.appendChild(root);

  const stage = root.querySelector("[data-zoom-stage]");
  const img = root.querySelector(".seamless-shop-zoom-image");

  const state = { scale: 1, x: 0, y: 0, dragging: false, startX: 0, startY: 0, baseX: 0, baseY: 0 };

  const apply = () => {
    img.style.transformOrigin = "0 0";
    img.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
  };

  const reset = () => {
    state.scale = 1;
    state.x = 0;
    state.y = 0;
    apply();
  };

  const clampScale = (value) => Math.min(4, Math.max(1, value));

  stage.addEventListener(
    "wheel",
    (e) => {
      if (root.hidden) return;
      e.preventDefault();

      const rect = stage.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const delta = e.deltaY || 0;
      const factor = delta > 0 ? 0.9 : 1.1;

      const s1 = state.scale;
      const s2 = clampScale(s1 * factor);
      if (s2 === s1) return;

      const k = s2 / s1;
      state.x = state.x * k + cx * (1 - k);
      state.y = state.y * k + cy * (1 - k);
      state.scale = s2;
      apply();
    },
    { passive: false },
  );

  const endDrag = () => {
    if (!state.dragging) return;
    state.dragging = false;
    stage.classList.remove("is-dragging");
  };

  stage.addEventListener("pointerdown", (e) => {
    if (root.hidden) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    state.dragging = true;
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.baseX = state.x;
    state.baseY = state.y;
    stage.classList.add("is-dragging");
    try {
      stage.setPointerCapture(e.pointerId);
    } catch (_) {}
  });

  stage.addEventListener("pointermove", (e) => {
    if (!state.dragging || root.hidden) return;
    state.x = state.baseX + (e.clientX - state.startX);
    state.y = state.baseY + (e.clientY - state.startY);
    apply();
  });

  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  const close = () => {
    root.hidden = true;
    document.documentElement.classList.remove("seamless-shop-zoom-open");
    reset();
    endDrag();
  };

  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-zoom-close]")) {
      close();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !root.hidden) {
      close();
    }
  });

  __seamlessZoomModal = {
    root,
    stage,
    img,
    open: (src, alt) => {
      img.src = src;
      img.alt = alt || "";
      root.hidden = false;
      document.documentElement.classList.add("seamless-shop-zoom-open");
      reset();
    },
    close,
  };

  return __seamlessZoomModal;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function flattenCategories(categories, accumulator = []) {
  categories.forEach((category) => {
    accumulator.push(category);
    if (Array.isArray(category.children) && category.children.length) {
      flattenCategories(category.children, accumulator);
    }
  });

  return accumulator;
}

function getPlaceholderImage(label = "Product") {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <defs>
        <linearGradient id="seamless-shop-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#eff3f7" />
          <stop offset="100%" stop-color="#d9e2ec" />
        </linearGradient>
      </defs>
      <rect width="800" height="800" fill="url(#seamless-shop-gradient)" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#17324d" font-family="Montserrat, sans-serif" font-size="42">${escapeHtml(
        label,
      )}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getSeamlessConfig() {
  return {
    apiDomain: window.seamless_ajax?.api_domain || "",
    productTypeLabel:
      window.seamless_ajax?.shop_product_type_label || "Physical",
    availabilityLabel:
      window.seamless_ajax?.shop_availability_label || "Available",
    singleProductEndpoint:
      window.seamless_ajax?.single_product_endpoint || "product",
    shopListEndpoint: window.seamless_ajax?.shop_list_endpoint || "shop",
    shopCartEndpoint: window.seamless_ajax?.shop_cart_endpoint || "shops/cart",
    siteUrl:
      window.seamless_ajax?.site_url ||
      window.location.origin.replace(/\/$/, ""),
  };
}

function buildInternalProductUrl(product) {
  const config = getSeamlessConfig();
  const slug =
    product.slug || product.id || slugify(product.title || "product");
  return `${config.siteUrl}/${config.singleProductEndpoint}/${slug}`;
}

function buildShopUrl() {
  const config = getSeamlessConfig();
  return `${config.siteUrl}/${config.shopListEndpoint}`;
}

function buildCartUrl() {
  const config = getSeamlessConfig();
  return `${config.siteUrl}/${String(config.shopCartEndpoint || "shops/cart").replace(/^\/+/, "")}`;
}

const SEAMLESS_AMS_GUEST_COOKIE = "seamless_ams_guest_token";

function getCookie(name) {
  if (typeof document === "undefined") {
    return "";
  }

  const cookies = String(document.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");
    if (key === name) {
      return rest.join("=") || "";
    }
  }

  return "";
}

function setCookie(name, value, days = 30) {
  if (typeof document === "undefined") {
    return;
  }

  const maxAge = Math.max(0, Number(days) || 0) * 24 * 60 * 60;
  const secure = window.location?.protocol === "https:";
  const cookieValue = encodeURIComponent(String(value || ""));

  document.cookie = `${name}=${cookieValue}; Max-Age=${maxAge}; Path=/; SameSite=Lax${
    secure ? "; Secure" : ""
  }`;
}

function deleteCookie(name) {
  // Delete by setting Max-Age=0 with the same attributes we use for setting.
  setCookie(name, "", 0);
}

function getGuestToken() {
  const cookieToken = decodeURIComponent(getCookie(SEAMLESS_AMS_GUEST_COOKIE) || "");
  if (cookieToken) {
    return cookieToken;
  }

  // Migration: older builds stored guest token in sessionStorage/localStorage.
  const legacyToken =
    window.sessionStorage?.getItem("seamless_guest_token") ||
    window.localStorage?.getItem("seamless_guest_token") ||
    "";

  if (legacyToken) {
    setGuestToken(legacyToken);
    try {
      window.sessionStorage?.removeItem("seamless_guest_token");
    } catch (_) {}
    try {
      window.localStorage?.removeItem("seamless_guest_token");
    } catch (_) {}
    return legacyToken;
  }

  return "";
}

function setGuestToken(token) {
  if (!token) {
    return;
  }

  setCookie(SEAMLESS_AMS_GUEST_COOKIE, token, 30);
}

function clearGuestToken() {
  deleteCookie(SEAMLESS_AMS_GUEST_COOKIE);
}

function getAccessToken() {
  return String(window.seamless_ajax?.access_token || "").trim();
}

function getAmsUserId() {
  return String(window.seamless_ajax?.ams_user_id || "").trim();
}

async function ensureGuestCartToken() {
  let guestToken = getGuestToken();
  if (guestToken || window.seamless_ajax?.is_logged_in) {
    return guestToken;
  }

  const sessionRes = await window.SeamlessAPI.post("shop/cart/session");
  guestToken =
    sessionRes?.data?.guest_token ||
    sessionRes?.guest_token ||
    sessionRes?.token ||
    "";

  if (guestToken) {
    setGuestToken(guestToken);
  }

  return guestToken;
}

async function fetchCurrentCart() {
  const guestToken = getGuestToken();
  const isWpLoggedIn = Boolean(window.seamless_ajax?.is_logged_in);
  const amsUserId = getAmsUserId();
  console.log("[Cart Flow] fetchCurrentCart()", {
    guestToken,
    amsUserId,
    isLoggedIn: isWpLoggedIn,
  });

  // Guests without a token should not create a cart session during passive loads.
  if (!isWpLoggedIn && !guestToken) {
    return { items: [], item_count: 0, subtotal: 0 };
  }

  try {
    if (isWpLoggedIn && amsUserId) {
      // Logged-in cart source of truth: user_id-based cart endpoint (no Authorization header).
      // Include guest_token if it exists so AMS can associate/claim it.
      const userCart = await window.SeamlessAPI.getShopCartWithToken(
        guestToken,
        "",
        amsUserId,
      );
      console.log("[Cart Flow] fetchCurrentCart() result", userCart);
      return userCart || { items: [], item_count: 0, subtotal: 0 };
    }

    // WP user is logged in but AMS user id is not available; fall back to guest cart if present.
    if (isWpLoggedIn && !amsUserId) {
      console.warn("[Cart Flow] Missing AMS user id; falling back to guest cart when possible.");
      if (!guestToken) return { items: [], item_count: 0, subtotal: 0 };
    }

    const cart = await window.SeamlessAPI.getShopCartWithToken(
      guestToken,
      "",
    );

    const responseGuestToken = cart?.guest_token || "";
    if (responseGuestToken) {
      setGuestToken(responseGuestToken);
    }

    console.log("[Cart Flow] fetchCurrentCart() result", cart);
    return cart || { items: [], item_count: 0, subtotal: 0 };
  } catch (error) {
    const message = String(error?.message || error || "");
    if (!isWpLoggedIn && guestToken && /401|403|422|invalid/i.test(message)) {
      clearGuestToken();
    }

    console.warn("[Cart Flow] fetchCurrentCart() failed", error);
    return { items: [], item_count: 0, subtotal: 0 };
  }
}

function updateCartCountUI(count = 0) {
  const normalizedCount = Number.isFinite(Number(count)) ? Number(count) : 0;
  document.querySelectorAll(".seamless-shop-cart-count").forEach((element) => {
    element.textContent = String(normalizedCount);
    element.hidden = normalizedCount <= 0;
  });
}

function initStandaloneCartWidgets() {
  const widgets = Array.from(
    document.querySelectorAll(".seamless-shop-cart-widget"),
  );

  if (!widgets.length) {
    return;
  }

  let hasLiveWidget = false;

  widgets.forEach((root) => {
    if (root.dataset.cartWidgetInitialized === "true") {
      return;
    }

    root.dataset.cartWidgetInitialized = "true";

    const button = root.querySelector(".seamless-shop-cart-button");
    const cartUrl = String(root.dataset.cartUrl || buildCartUrl()).trim();
    const isPreview = root.dataset.cartPreview === "true";

    if (!button || isPreview) {
      return;
    }

    hasLiveWidget = true;
    button.addEventListener("click", () => {
      window.location.href = cartUrl || buildCartUrl();
    });
  });

  if (!hasLiveWidget || window.__seamlessCartWidgetCountLoaded) {
    return;
  }

  window.__seamlessCartWidgetCountLoaded = true;
  fetchCurrentCart()
    .then((cart) => {
      updateCartCountUI(Number(cart?.item_count ?? 0) || 0);
    })
    .catch(() => {
      updateCartCountUI(0);
    });
}

const SHOP_SORT_LABELS = {
  featured: "Featured",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
  title_asc: "Title (A-Z)",
  title_desc: "Title (Z-A)",
};

function resolveProductCategories(product, categoryMap) {
  const categories = (product.categories || []).map((category) => {
    const categoryId = String(category.id ?? category.slug ?? "");
    return (
      categoryMap.get(categoryId) ||
      categoryMap.get(String(category.slug || "")) || {
        id: String(category.id ?? category.slug ?? category.name),
        name: category.name || category.label || category.slug || "Category",
        slug: category.slug || slugify(category.name || category.label || ""),
      }
    );
  });

  return uniqueBy(
    categories.filter(Boolean),
    (category) => category.id || category.slug,
  );
}

function renderProductCard(product, categoryMap) {
  const categories = resolveProductCategories(product, categoryMap);
  const categoryLabel = categories[0]?.name || "Uncategorized";
  const title = product.title || product.name || "Untitled Product";
  const image = product.featuredImage || getPlaceholderImage(title);
  const productUrl = buildInternalProductUrl(product);
  const description = truncateText(
    product.shortDescription || product.descriptionHtml,
    72,
  );
  const hasVariants = Boolean(product.hasVariants || product.variants?.length);
  const isSimpleOutOfStock = !hasVariants && product.isAvailable === false;
  const actionMarkup = hasVariants
    ? `
        <a class="seamless-shop-card-action is-link" href="${escapeHtml(productUrl)}">
          <span class="seamless-shop-card-action-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings2-icon lucide-settings-2"><path d="M14 17H5"></path><path d="M19 7h-9"></path><circle cx="17" cy="17" r="3"></circle><circle cx="7" cy="7" r="3"></circle></svg></span>
          <span>Choose Options</span>
        </a>
      `
    : `
        <button
          type="button"
          class="seamless-shop-card-action${isSimpleOutOfStock ? " is-disabled" : ""}"
          data-shop-add-to-cart="${escapeHtml(product.id || "")}"
          data-shop-product-title="${escapeHtml(title)}"
          ${isSimpleOutOfStock ? "disabled" : ""}>
          <span class="seamless-shop-card-action-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-bag-icon lucide-shopping-bag"><path d="M16 10a4 4 0 0 1-8 0"></path><path d="M3.103 6.034h17.794"></path><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"></path></svg></span>
          <span>${isSimpleOutOfStock ? "Out of Stock" : "Add To Cart"}</span>
        </button>
      `;

  return `
    <article class="seamless-shop-card">
      <div class="seamless-shop-card-media">
        <a class="seamless-shop-card-media-link" href="${escapeHtml(productUrl)}">
          <span class="seamless-shop-card-image-frame image-container">
            <span class="loader"></span>
            <img
              src="${escapeHtml(image)}"
              alt="${escapeHtml(title)}"
              loading="lazy"
              data-shop-card-image="true"
              style="opacity: 0;" />
          </span>
        </a>
        <span class="seamless-shop-card-action-wrap">
          ${actionMarkup}
        </span>
      </div>
      <div class="seamless-shop-card-body">
        <div class="seamless-shop-card-category">${escapeHtml(
          categoryLabel,
        )}</div>
        <h3 class="seamless-shop-card-title">
          <a href="${escapeHtml(productUrl)}">${escapeHtml(
            title,
          )}</a>
        </h3>
        <p class="seamless-shop-card-description">${escapeHtml(description)}</p>
        <div class="seamless-shop-card-footer">
          <strong class="seamless-shop-card-price">${escapeHtml(
            product.priceLabel || "Contact for pricing",
          )}</strong>
        </div>
      </div>
    </article>
  `;
}

function renderCompactProductCard(product) {
  const title = product.title || product.name || "Untitled Product";
  const image = product.featuredImage || getPlaceholderImage(title);
  const productUrl = buildInternalProductUrl(product);

  return `
    <article class="seamless-shop-card seamless-shop-card-compact">
      <div class="seamless-shop-card-media">
        <a class="seamless-shop-card-media-link" href="${escapeHtml(productUrl)}">
          <span class="seamless-shop-card-image-frame image-container">
            <span class="loader"></span>
            <img
              src="${escapeHtml(image)}"
              alt="${escapeHtml(title)}"
              loading="lazy"
              data-shop-card-image="true"
              style="opacity: 0;" />
          </span>
        </a>
        <span class="seamless-shop-card-action-wrap">
          <a class="seamless-shop-card-action is-link" href="${escapeHtml(productUrl)}">
            <span>View Item</span>
          </a>
        </span>
      </div>
      <div class="seamless-shop-card-body">
        <h3 class="seamless-shop-card-title">
          <a href="${escapeHtml(productUrl)}">${escapeHtml(title)}</a>
        </h3>
        <div class="seamless-shop-card-footer">
          <strong class="seamless-shop-card-price">${escapeHtml(
            product.priceLabel || "Contact for pricing",
          )}</strong>
        </div>
      </div>
    </article>
  `;
}

function bindShopCardImageLoads(container) {
  container
    ?.querySelectorAll("img[data-shop-card-image]")
    .forEach((image) => {
      const frame = image.closest(".image-container");
      const loader = frame?.querySelector(".loader");

      const markLoaded = () => {
        image.style.opacity = "1";
        if (loader) {
          loader.style.display = "none";
        }
      };

      if (image.complete && image.naturalWidth > 0) {
        markLoaded();
        return;
      }

      image.addEventListener("load", markLoaded, { once: true });
      image.addEventListener(
        "error",
        () => {
          image.style.opacity = "1";
          if (loader) {
            loader.style.display = "none";
          }
        },
        { once: true },
      );
    });
}

function renderPaginationButton(pageNum, currentPage) {
  const isActive = pageNum === currentPage;
  const classes = isActive ? "seamless-btn seamless-active" : "seamless-btn";
  return `<button type="button" class="seamless-page-link ${classes}" data-page="${pageNum}" ${isActive ? 'aria-current="page"' : ""}>${pageNum}</button>`;
}

function renderNumbersPagination(currentPage, totalItems, totalPages, perPage) {
  if (totalItems <= perPage || totalPages <= 1) {
    return "";
  }

  let html = '<div class="seamless-pagination">';

  if (currentPage > 1) {
    html += `<button type="button" class="seamless-page-link seamless-prev seamless-btn" data-page="${currentPage - 1}">« Previous</button>`;
  }

  const visibleRange = 2;
  const start = Math.max(2, currentPage - visibleRange);
  const end = Math.min(totalPages - 1, currentPage + visibleRange);

  html += renderPaginationButton(1, currentPage);

  if (start > 2) {
    html += '<span class="seamless-ellipsis">...</span>';
  }

  for (let i = start; i <= end; i += 1) {
    html += renderPaginationButton(i, currentPage);
  }

  if (end < totalPages - 1) {
    html += '<span class="seamless-ellipsis">...</span>';
  }

  if (totalPages > 1) {
    html += renderPaginationButton(totalPages, currentPage);
  }

  if (currentPage < totalPages) {
    html += `<button type="button" class="seamless-page-link seamless-next seamless-btn" data-page="${currentPage + 1}">Next »</button>`;
  }

  html += "</div>";
  return html;
}

function formatAttributeLabel(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeGalleryImages(product, selectedOption = null) {
  const variantImages = [];
  const baseImages = [];

  const pushImage = (target, candidate) => {
    if (!candidate) return;
    if (typeof candidate === "string") {
      target.push(candidate);
      return;
    }
    const url = candidate.url || candidate.src || candidate.image || "";
    if (url) target.push(url);
  };

  if (selectedOption) {
    pushImage(variantImages, selectedOption.image);
    (selectedOption.images || []).forEach((image) => pushImage(variantImages, image));
  }

  pushImage(baseImages, product.featuredImage);
  (product.gallery || []).forEach((image) => pushImage(baseImages, image));

  // If a variant is selected, show ONLY that variant's images (deduped).
  // Fall back to base gallery only when the selected variant has no images.
  const preferred = variantImages.length ? variantImages : baseImages;
  return Array.from(new Set(preferred.filter(Boolean)));
}

function getInitialVariantSelection(product) {
  return (product.variants || []).map(() => null);
}

class SeamlessShopListing {
  constructor(root) {
    this.root = root;
    this.products = [];
    this.categories = [];
    this.categoryMap = new Map();
    this.state = {
      search: "",
      categories: new Set(),
      productTypes: new Set(),
      availabilities: new Set(),
      sort: "featured",
      filtersOpen: false,
      page: 1,
    };
    this.perPage = 8;
    this.elements = {
      loader: root.querySelector(".seamless-shop-loader"),
      content: root.querySelector(".seamless-shop-content"),
      summary: root.querySelector(".seamless-shop-summary"),
      toggle: root.querySelector(".seamless-shop-filter-toggle"),
      filterCount: root.querySelector(".seamless-shop-filter-count"),
      sortTrigger: root.querySelector(".seamless-shop-sort-trigger"),
      sortLabel: root.querySelector(".seamless-shop-sort-label"),
      sortMenu: root.querySelector(".seamless-shop-sort-menu"),
      filtersPanel: root.querySelector(".seamless-shop-filters-panel"),
      resetButton: root.querySelector(".seamless-shop-reset-button"),
      search: root.querySelector(".seamless-shop-search"),
      categoryOptions: root.querySelector(".seamless-shop-category-options"),
      allCategories: root.querySelector(".seamless-shop-all-categories"),
      productTypeInputs: root.querySelectorAll(
        'input[name="shop-product-type"]',
      ),
      availabilityInputs: root.querySelectorAll(
        'input[name="shop-availability"]',
      ),
      cartButton: root.querySelector(".seamless-shop-cart-button"),
      cartCount: root.querySelector(".seamless-shop-cart-count"),
      grid: root.querySelector(".seamless-shop-grid"),
      empty: root.querySelector(".seamless-shop-empty"),
      pagination: root.querySelector(".seamless-shop-pagination"),
    };
  }

  async init() {
    this.bindEvents();
    if (this.elements.filtersPanel) {
      this.elements.filtersPanel.hidden = !this.state.filtersOpen;
    }
    this.elements.toggle?.setAttribute(
      "aria-expanded",
      String(this.state.filtersOpen),
    );
    this.setSortMenuOpen(false);

    try {
      const [products, categories, cart] = await Promise.all([
        window.SeamlessAPI.getAllShopProducts(),
        window.SeamlessAPI.getShopCategories().catch(() => []),
        fetchCurrentCart().catch(() => null),
      ]);

      this.products = Array.isArray(products) ? products : [];
      this.categories = Array.isArray(categories) ? categories : [];

      const derivedCategories = flattenCategories(this.categories);
      if (!derivedCategories.length) {
        this.categories = this.buildCategoriesFromProducts();
      }

      flattenCategories(this.categories).forEach((category) => {
        if (!category) {
          return;
        }

        if (category.id) {
          this.categoryMap.set(String(category.id), category);
        }

        if (category.slug) {
          this.categoryMap.set(String(category.slug), category);
        }
      });

      this.renderCategoryFilters();
      this.renderCartSummary(cart);
      this.showContent();
      this.applyFilters();
    } catch (error) {
      console.error("Seamless shop listing failed to load:", error);
      this.showError("Unable to load shop products right now.");
    }
  }

  buildCategoriesFromProducts() {
    const fallbackCategories = uniqueBy(
      this.products
        .flatMap((product) => product.categories || [])
        .map((category) => ({
          id: String(category.id ?? category.slug ?? category.name),
          name: category.name || category.label || category.slug || "Category",
          slug: category.slug || slugify(category.name || category.label || ""),
          children: [],
        })),
      (category) => category.id || category.slug,
    );

    return fallbackCategories;
  }

  bindEvents() {
    this.elements.toggle?.addEventListener("click", () => {
      this.state.filtersOpen = !this.state.filtersOpen;
      this.elements.filtersPanel.hidden = !this.state.filtersOpen;
      this.elements.toggle.setAttribute(
        "aria-expanded",
        String(this.state.filtersOpen),
      );
    });

    this.elements.sortTrigger?.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen =
        this.elements.sortTrigger.getAttribute("aria-expanded") === "true";
      this.setSortMenuOpen(!isOpen);
    });

    this.elements.sortMenu?.addEventListener("click", (event) => {
      const option = event.target.closest("[data-sort]");
      if (!option) {
        return;
      }

      this.state.sort = option.dataset.sort || "featured";
      this.state.page = 1;
      this.setSortMenuOpen(false);
      this.applyFilters();
    });

    this.elements.search?.addEventListener("input", (event) => {
      this.state.search = event.target.value.trim().toLowerCase();
      this.state.page = 1;
      this.applyFilters();
    });

    this.elements.resetButton?.addEventListener("click", () => {
      this.resetFilters();
    });

    this.elements.cartButton?.addEventListener("click", () => {
      window.location.href = buildCartUrl();
    });

    this.elements.grid?.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-shop-add-to-cart]");
      if (!button) {
        return;
      }

      event.preventDefault();

      if (button.disabled) {
        return;
      }

      const productId = String(button.dataset.shopAddToCart || "").trim();
      const productTitle = String(button.dataset.shopProductTitle || "Product").trim();

      if (!productId) {
        return;
      }

      const originalMarkup = button.innerHTML;
      button.disabled = true;
      button.innerHTML = "<span>Adding...</span>";

      try {
        const payload = {
          product_id: productId,
          quantity: 1,
        };

        const guestToken = getGuestToken();
        const isLoggedIn = Boolean(window.seamless_ajax?.is_logged_in);

        if (isLoggedIn) {
          const amsUserId = getAmsUserId();
          if (amsUserId) {
            payload.user_id = amsUserId;
          }
          if (guestToken) {
            payload.guest_token = guestToken;
          }
        } else {
          const ensuredGuestToken = await ensureGuestCartToken();
          if (ensuredGuestToken) {
            payload.guest_token = ensuredGuestToken;
          }
        }

        const response = await window.SeamlessAPI.post(
          "shop/cart/items",
          payload,
          {},
        );

        const responseGuestToken =
          response?.data?.guest_token ||
          response?.guest_token ||
          "";
        if (responseGuestToken && !isLoggedIn) {
          setGuestToken(responseGuestToken);
        }

        const refreshedCart = await fetchCurrentCart().catch(() => null);
        this.renderCartSummary(refreshedCart);

        button.innerHTML = "<span>Added</span>";
        window.setTimeout(() => {
          button.disabled = false;
          button.innerHTML = originalMarkup;
        }, 1200);
      } catch (error) {
        console.error("[Shop Listing] Add to cart failed", error);
        button.innerHTML = "<span>Unavailable</span>";
        window.setTimeout(() => {
          button.disabled = false;
          button.innerHTML = originalMarkup;
        }, 1500);
      }
    });

    this.elements.categoryOptions?.addEventListener("change", (event) => {
      const input = event.target.closest("[data-category-id]");
      if (!input) {
        return;
      }

      const categoryId = String(input.dataset.categoryId);
      if (input.checked) {
        this.state.categories.add(categoryId);
      } else {
        this.state.categories.delete(categoryId);
      }

      this.state.page = 1;
      this.applyFilters();
    });

    this.elements.productTypeInputs.forEach((input) => {
      input.addEventListener("change", (event) => {
        this.syncMultiSelectCheckboxGroup(
          this.elements.productTypeInputs,
          this.state.productTypes,
          event.target.value,
          event.target.checked,
        );
        this.state.page = 1;
        this.applyFilters();
      });
    });

    this.elements.availabilityInputs.forEach((input) => {
      input.addEventListener("change", (event) => {
        this.syncMultiSelectCheckboxGroup(
          this.elements.availabilityInputs,
          this.state.availabilities,
          event.target.value,
          event.target.checked,
        );
        this.state.page = 1;
        this.applyFilters();
      });
    });

    this.elements.pagination?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-page]");
      if (!button) {
        return;
      }

      const nextPage = Number(button.dataset.page);
      if (!Number.isFinite(nextPage) || nextPage < 1) {
        return;
      }

      this.state.page = nextPage;
      this.applyFilters();
      this.root.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    document.addEventListener("click", (event) => {
      const clickedInsideSort = event.target.closest(
        ".seamless-shop-dropdown-wrap",
      );
      if (!clickedInsideSort || !this.root.contains(clickedInsideSort)) {
        this.setSortMenuOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.setSortMenuOpen(false);
      }
    });
  }

  syncMultiSelectCheckboxGroup(inputs, targetSet, value, isChecked) {
    if (value === "all") {
      if (isChecked) {
        targetSet.clear();
      }

      inputs.forEach((input) => {
        if (input.value !== "all") {
          input.checked = false;
        }
      });

      return;
    }

    if (isChecked) {
      targetSet.add(value);
    } else {
      targetSet.delete(value);
    }

    const allOption = Array.from(inputs).find((input) => input.value === "all");
    if (allOption) {
      allOption.checked = targetSet.size === 0;
    }
  }

  setSortMenuOpen(isOpen) {
    if (!this.elements.sortTrigger || !this.elements.sortMenu) {
      return;
    }

    this.elements.sortTrigger.setAttribute("aria-expanded", String(isOpen));
    this.elements.sortMenu.hidden = !isOpen;
    this.elements.sortMenu.classList.toggle("seamless-nd-menu-open", isOpen);
  }

  showContent() {
    if (this.elements.loader) {
      this.elements.loader.hidden = true;
      this.elements.loader.setAttribute("aria-hidden", "true");
    }

    if (this.elements.content) {
      this.elements.content.hidden = false;
    }
  }

  showError(message) {
    this.showContent();
    if (this.elements.grid) {
      this.elements.grid.innerHTML = `<p class="event-message">${escapeHtml(
        message,
      )}</p>`;
    }
  }

  resetFilters() {
    this.state.search = "";
    this.state.categories = new Set();
    this.state.productTypes = new Set();
    this.state.availabilities = new Set();
    this.state.sort = "featured";
    this.state.page = 1;

    if (this.elements.search) {
      this.elements.search.value = "";
    }

    this.setSortMenuOpen(false);

    this.applyFilters();
  }

  renderCategoryFilters() {
    if (!this.elements.categoryOptions) {
      return;
    }

    const categories = flattenCategories(this.categories);
    if (!categories.length) {
      this.elements.categoryOptions.innerHTML =
        '<label class="seamless-shop-checkbox-row is-all-option"><input type="checkbox" class="seamless-shop-all-categories" checked><span>All categories</span></label><span class="seamless-shop-filter-placeholder">No categories available</span>';
      this.elements.allCategories = this.root.querySelector(
        ".seamless-shop-all-categories",
      );
      this.bindAllCategoriesHandler();
      return;
    }

    this.elements.categoryOptions.innerHTML =
      `
        <label class="seamless-shop-checkbox-row is-all-option">
          <input type="checkbox" class="seamless-shop-all-categories" checked>
          <span>All categories</span>
        </label>
      ` +
      categories
        .map((category) => {
          const isChild = Boolean(category.parentId);
          return `
            <label class="seamless-shop-checkbox-row${isChild ? " is-child" : ""}">
              <input type="checkbox" data-category-id="${escapeHtml(category.id)}">
              <span>${escapeHtml(category.name)}</span>
            </label>
          `;
        })
        .join("");

    this.elements.allCategories = this.root.querySelector(
      ".seamless-shop-all-categories",
    );
    this.bindAllCategoriesHandler();
  }

  bindAllCategoriesHandler() {
    this.elements.allCategories?.addEventListener("change", (event) => {
      if (!event.target.checked) {
        event.target.checked = true;
        return;
      }

      this.state.categories = new Set();
      this.state.page = 1;
      this.applyFilters();
    });
  }

  productMatchesFilters(product) {
    const categories = resolveProductCategories(product, this.categoryMap);
    const matchesSearch =
      !this.state.search ||
      [
        product.title,
        product.sku,
        product.shortDescription,
        ...categories.map((category) => category.name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(this.state.search);

    if (!matchesSearch) {
      return false;
    }

    if (this.state.categories.size) {
      const productCategoryIds = new Set(
        categories.flatMap((category) => [
          String(category.id || ""),
          String(category.slug || ""),
        ]),
      );
      const matchesCategory = Array.from(this.state.categories).some((id) =>
        productCategoryIds.has(String(id)),
      );

      if (!matchesCategory) {
        return false;
      }
    }

    if (
      this.state.productTypes.size &&
      !this.state.productTypes.has(
        String(product.productType || "physical").toLowerCase(),
      )
    ) {
      return false;
    }

    if (
      this.state.availabilities.size &&
      !this.state.availabilities.has(
        String(product.availabilityStatus || "available").toLowerCase(),
      )
    ) {
      return false;
    }

    return true;
  }

  sortProducts(products) {
    const sorted = [...products];

    sorted.sort((left, right) => {
      if (this.state.sort === "price_asc") {
        return (
          (left.price ?? Number.MAX_SAFE_INTEGER) -
          (right.price ?? Number.MAX_SAFE_INTEGER)
        );
      }

      if (this.state.sort === "price_desc") {
        return (right.price ?? 0) - (left.price ?? 0);
      }

      if (this.state.sort === "title_asc") {
        return String(left.title || "").localeCompare(
          String(right.title || ""),
        );
      }

      if (this.state.sort === "title_desc") {
        return String(right.title || "").localeCompare(
          String(left.title || ""),
        );
      }

      const featuredDelta =
        Number(Boolean(right.featured)) - Number(Boolean(left.featured));
      if (featuredDelta !== 0) {
        return featuredDelta;
      }

      return String(left.title || "").localeCompare(String(right.title || ""));
    });

    return sorted;
  }

  applyFilters() {
    const filtered = this.sortProducts(
      this.products.filter((product) => this.productMatchesFilters(product)),
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / this.perPage));
    this.state.page = Math.min(Math.max(this.state.page, 1), totalPages);
    const startIndex = (this.state.page - 1) * this.perPage;
    const paginated = filtered.slice(startIndex, startIndex + this.perPage);

    this.renderSummary(filtered.length);
    this.renderFilterState();
    this.renderProducts(paginated);
    this.renderPagination(filtered.length, totalPages);
  }

  renderSummary(total) {
    if (!this.elements.summary) {
      return;
    }

    this.elements.summary.textContent = `Showing ${total} product${
      total === 1 ? "" : "s"
    }`;
  }

  renderCartSummary(cart) {
    if (!this.elements.cartCount) {
      return;
    }

    const itemCount = Number(cart?.item_count ?? 0);
    const normalizedCount = Number.isFinite(itemCount) ? itemCount : 0;

    this.elements.cartCount.textContent = String(normalizedCount);
    this.elements.cartCount.hidden = normalizedCount <= 0;
    updateCartCountUI(normalizedCount);

    if (this.elements.cartButton) {
      this.elements.cartButton.dataset.cartCount = String(normalizedCount);
    }
  }

  renderFilterState() {
    this.root
      .querySelectorAll(
        ".seamless-shop-category-options input[data-category-id]",
      )
      .forEach((input) => {
        const categoryId = String(input.dataset.categoryId || "");
        input.checked = this.state.categories.has(categoryId);
      });

    if (this.elements.allCategories) {
      this.elements.allCategories.checked = this.state.categories.size === 0;
    }

    this.elements.productTypeInputs.forEach((input) => {
      input.checked =
        input.value === "all"
          ? this.state.productTypes.size === 0
          : this.state.productTypes.has(input.value);
    });

    this.elements.availabilityInputs.forEach((input) => {
      input.checked =
        input.value === "all"
          ? this.state.availabilities.size === 0
          : this.state.availabilities.has(input.value);
    });

    if (this.elements.sortLabel) {
      this.elements.sortLabel.textContent =
        SHOP_SORT_LABELS[this.state.sort] || SHOP_SORT_LABELS.featured;
    }

    if (this.elements.sortMenu) {
      this.elements.sortMenu
        .querySelectorAll("[data-sort]")
        .forEach((option) => {
          const isSelected = option.dataset.sort === this.state.sort;
          option.classList.toggle("is-selected", isSelected);
          option.classList.toggle("seamless-nd-menu-selected", isSelected);
        });
    }

    const activeCount =
      this.state.categories.size +
      this.state.productTypes.size +
      this.state.availabilities.size +
      (this.state.search.length > 0 ? 1 : 0);

    const hasActiveFilters = activeCount > 0;

    this.elements.toggle?.classList.toggle(
      "seamless-nd-active-filter",
      hasActiveFilters,
    );

    if (this.elements.filterCount) {
      this.elements.filterCount.textContent = String(activeCount);
      this.elements.filterCount.hidden = activeCount === 0;
    }
  }

  renderProducts(products) {
    if (!this.elements.grid || !this.elements.empty) {
      return;
    }

    if (!products.length) {
      this.elements.grid.innerHTML = "";
      this.elements.empty.hidden = false;
      return;
    }

    this.elements.empty.hidden = true;
    this.elements.grid.innerHTML = products
      .map((product) => renderProductCard(product, this.categoryMap))
      .join("");
    bindShopCardImageLoads(this.elements.grid);
  }

  renderPagination(totalItems, totalPages) {
    if (!this.elements.pagination) {
      return;
    }

    const markup = renderNumbersPagination(
      this.state.page,
      totalItems,
      totalPages,
      this.perPage,
    );

    this.elements.pagination.innerHTML = markup;
    this.elements.pagination.hidden = !markup;
  }
}

class SeamlessShopDetail {
  constructor(root) {
    this.root = root;
    this.slug = root.dataset.productSlug || "";
    this.elements = {
      loader: root.querySelector(".seamless-shop-loader"),
      content: root.querySelector(".seamless-shop-detail-content"),
    };
    this.categoryMap = new Map();
    this.product = null;
    this.allProducts = [];
    this.selectedVariantIds = [];
    this.galleryIndex = 0;
    this.quantity = 1;
    this.notice = "";
    this.cartCount = 0;
    this.cart = null;
    this.loadedDetailImages = new Set();
    this.noticeTimer = null;
    this.stockWarning = "";
    this.thumbnailStart = 0;
  }

  async init() {
    if (!this.slug) {
      this.showError("No product was requested.");
      return;
    }

    try {
      let product = null;
      if (window.SeamlessAPI && window.SeamlessAPI.getShopProduct) {
        product = await window.SeamlessAPI.getShopProduct(this.slug);
      }

      const [products, categories, cart] = await Promise.all([
        window.SeamlessAPI.getAllShopProducts(),
        window.SeamlessAPI.getShopCategories().catch(() => []),
        fetchCurrentCart().catch(() => null),
      ]);

      flattenCategories(categories).forEach((category) => {
        if (category.id) {
          this.categoryMap.set(String(category.id), category);
        }
        if (category.slug) {
          this.categoryMap.set(String(category.slug), category);
        }
      });

      if (!product) {
        product =
          products.find((item) => {
            const needle = String(this.slug).toLowerCase();
            return (
              String(item.slug || "").toLowerCase() === needle ||
              String(item.id || "").toLowerCase() === needle
            );
          }) || null;
      }

      if (!product) {
        this.showError("We couldn't find that product.");
        return;
      }

      this.product = product;
      this.allProducts = products;
      this.selectedVariantIds = getInitialVariantSelection(product);
      this.galleryIndex = 0;
      this.thumbnailStart = 0;
      this.quantity = 1;
      this.cart = cart || { items: [], item_count: 0, subtotal: 0 };
      this.cartCount = Number(cart?.item_count ?? 0) || 0;
      updateCartCountUI(this.cartCount);
      this.render();
    } catch (error) {
      console.error("Seamless product detail failed to load:", error);
      this.showError("Unable to load this product right now.");
    }
  }

  showError(message) {
    if (this.elements.loader) {
      this.elements.loader.hidden = true;
      this.elements.loader.setAttribute("aria-hidden", "true");
    }

    if (this.elements.content) {
      this.elements.content.hidden = false;
      this.elements.content.innerHTML = `
        <div class="seamless-shop-detail-empty-state">
          <p>${escapeHtml(message)}</p>
          <a class="seamless-shop-secondary-button" href="${escapeHtml(
            buildShopUrl(),
          )}">Back to Shop</a>
        </div>
      `;
    }
  }

  getSelectedVariantOptions() {
    if (!this.product?.variants?.length) {
      return [];
    }

    return this.product.variants
      .map((group, index) => {
        const selectedId = this.selectedVariantIds[index];
        return (
          group.options.find((option) => option.id === selectedId) ||
          group.options[0] ||
          null
        );
      })
      .filter(Boolean);
  }

  getPrimaryVariantOption() {
    return this.getSelectedVariantOptions()[0] || null;
  }

  getCurrentGalleryImages() {
    const images = normalizeGalleryImages(
      this.product,
      this.getPrimaryVariantOption(),
    );
    if (!images.length) {
      return [getPlaceholderImage(this.product?.title || "Product")];
    }

    return images;
  }

  getCurrentVariantSelectionMap() {
    const selectedOptions = this.getSelectedVariantOptions();
    const variantGroups = Array.isArray(this.product?.variants)
      ? this.product.variants
      : [];
    const selections = {};

    variantGroups.forEach((group, index) => {
      const option = selectedOptions[index];
      const attributeType = String(group?.attributeType || "")
        .trim()
        .toLowerCase();
      const value = String(option?.value || "")
        .trim()
        .toLowerCase();

      if (attributeType && value) {
        selections[attributeType] = value;
      }
    });

    return selections;
  }

  getCartQuantityForCurrentSelection() {
    const items = Array.isArray(this.cart?.items) ? this.cart.items : [];
    const productId = String(this.product?.id || "");
    const currentSelections = this.getCurrentVariantSelectionMap();
    const currentSelectionKeys = Object.keys(currentSelections).sort();

    return items.reduce((total, item) => {
      const itemProductId = String(
        item?.product_id || item?.id || "",
      );

      if (!productId || itemProductId !== productId) {
        return total;
      }

      const itemSelections = Array.isArray(item?.variant_selections)
        ? item.variant_selections.reduce((acc, selection) => {
            const key = String(
              selection?.attribute_type || selection?.attribute_label || "",
            )
              .trim()
              .toLowerCase();
            const value = String(
              selection?.value || selection?.value_label || "",
            )
              .trim()
              .toLowerCase();
            if (key && value) {
              acc[key] = value;
            }
            return acc;
          }, {})
        : item?.variant_selections && typeof item.variant_selections === "object"
          ? Object.entries(item.variant_selections).reduce((acc, [key, value]) => {
              const normalizedKey = String(key).trim().toLowerCase();
              const normalizedValue = String(value || "").trim().toLowerCase();
              if (normalizedKey && normalizedValue) {
                acc[normalizedKey] = normalizedValue;
              }
              return acc;
            }, {})
          : {};

      const itemSelectionKeys = Object.keys(itemSelections).sort();
      const sameSelection =
        currentSelectionKeys.length === itemSelectionKeys.length &&
        currentSelectionKeys.every(
          (key) => itemSelections[key] === currentSelections[key],
        );

      // For simple products (no variant attributes), selections are both empty and match.
      if (!sameSelection) {
        return total;
      }

      return total + (Number(item?.quantity || 0) || 0);
    }, 0);
  }

  getCartQuantityForVariantOption(groupIndex, option) {
    if (!option) {
      return 0;
    }

    const originalSelectedId = this.selectedVariantIds[groupIndex];
    this.selectedVariantIds[groupIndex] = option.id;
    const quantity = this.getCartQuantityForCurrentSelection();
    this.selectedVariantIds[groupIndex] = originalSelectedId;
    return quantity;
  }

  clampQuantity(maxQuantity) {
    if (this.quantity < 1) {
      this.quantity = 1;
    }

    if (maxQuantity > 0 && this.quantity > maxQuantity) {
      this.quantity = maxQuantity;
    }
  }

  getVisibleThumbnailCount() {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      return 3;
    }

    return 5;
  }

  syncThumbnailWindow(images) {
    const totalImages = Array.isArray(images) ? images.length : 0;
    const visibleCount = this.getVisibleThumbnailCount();
    const maxStart = Math.max(0, totalImages - visibleCount);

    this.thumbnailStart = Math.min(Math.max(this.thumbnailStart, 0), maxStart);

    if (this.galleryIndex < this.thumbnailStart) {
      this.thumbnailStart = this.galleryIndex;
    } else if (this.galleryIndex >= this.thumbnailStart + visibleCount) {
      this.thumbnailStart = this.galleryIndex - visibleCount + 1;
    }

    this.thumbnailStart = Math.min(Math.max(this.thumbnailStart, 0), maxStart);
  }

  bindDetailEvents() {
    this.elements.content
      ?.querySelectorAll("[data-variant-group-index][data-variant-id]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const variantId = button.dataset.variantId || "";
          const groupIndex = Number(button.dataset.variantGroupIndex);

          if (!variantId || !Number.isFinite(groupIndex)) {
            return;
          }

          this.selectedVariantIds[groupIndex] = variantId;
          this.galleryIndex = 0;
          this.thumbnailStart = 0;
          this.quantity = 1;
          this.stockWarning = "";
          this.render();
        });
      });

    this.elements.content
      ?.querySelector("[data-gallery-prev]")
      ?.addEventListener("click", () => {
        const images = this.getCurrentGalleryImages();
        if (images.length <= 1) {
          return;
        }

        this.galleryIndex =
          (this.galleryIndex - 1 + images.length) % images.length;
        this.render();
      });

    this.elements.content
      ?.querySelector("[data-gallery-next]")
      ?.addEventListener("click", () => {
        const images = this.getCurrentGalleryImages();
        if (images.length <= 1) {
          return;
        }

        this.galleryIndex = (this.galleryIndex + 1) % images.length;
        this.render();
      });

    this.elements.content
      ?.querySelectorAll("[data-gallery-index]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const nextIndex = Number(button.dataset.galleryIndex);
          if (!Number.isFinite(nextIndex)) {
            return;
          }

          this.galleryIndex = nextIndex;
          this.render();
        });
      });

    this.elements.content
      ?.querySelector("[data-thumbnail-prev]")
      ?.addEventListener("click", () => {
        const images = this.getCurrentGalleryImages();
        const visibleCount = this.getVisibleThumbnailCount();
        const maxStart = Math.max(0, images.length - visibleCount);
        this.thumbnailStart = Math.max(0, this.thumbnailStart - visibleCount);
        this.thumbnailStart = Math.min(this.thumbnailStart, maxStart);
        this.render();
      });

    this.elements.content
      ?.querySelector("[data-thumbnail-next]")
      ?.addEventListener("click", () => {
        const images = this.getCurrentGalleryImages();
        const visibleCount = this.getVisibleThumbnailCount();
        const maxStart = Math.max(0, images.length - visibleCount);
        this.thumbnailStart = Math.min(
          maxStart,
          this.thumbnailStart + visibleCount,
        );
        this.render();
      });

    this.bindImageZoom();

    this.elements.content
      ?.querySelector("[data-qty-decrease]")
      ?.addEventListener("click", () => {
        this.quantity = Math.max(1, this.quantity - 1);
        this.stockWarning = "";
        this.render();
      });

    this.elements.content
      ?.querySelector("[data-qty-increase]")
      ?.addEventListener("click", () => {
        const selectedStock =
          this.getPrimaryVariantOption()?.stockQuantity ??
          this.product?.stockQuantity ??
          0;
        const availableStock = Math.max(
          selectedStock - this.getCartQuantityForCurrentSelection(),
          0,
        );

        if (availableStock > 0) {
          this.quantity = Math.min(availableStock, this.quantity + 1);
        }
        this.stockWarning = "";
        this.render();
      });
    this.elements.content
      ?.querySelector(".seamless-shop-add-to-cart-button")
      ?.addEventListener("click", async (e) => {
        const btn = e.currentTarget;
        if (btn.disabled) return;

        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span>Adding...</span>`;

        try {
          const productId = this.product.id;
          const selectedOptions = this.getSelectedVariantOptions();
          const selectedStock =
            this.getPrimaryVariantOption()?.stockQuantity ??
            this.product?.stockQuantity ??
            0;
          const availableStock = Math.max(
            selectedStock - this.getCartQuantityForCurrentSelection(),
            0,
          );

          if (availableStock <= 0) {
            this.stockWarning =
              "This selected variant is out of stock. Choose another available option.";
            btn.innerHTML = originalText;
            btn.disabled = false;
            this.render();
            return;
          }

          if (this.quantity > availableStock) {
            this.quantity = availableStock;
            this.stockWarning =
              availableStock === 1
                ? "Only 1 item is available for this selection."
                : `Only ${availableStock} items are available for this selection.`;
            btn.innerHTML = originalText;
            btn.disabled = false;
            this.render();
            return;
          }

          const payload = {
            product_id: productId,
            quantity: this.quantity,
          };

          // Persist variant selection explicitly so AMS can store & return it as `variant_selections`.
          // AMS expects an object map like: { color: "white", size: "7" }.
          const variantGroups = Array.isArray(this.product?.variants)
            ? this.product.variants
            : [];
          const selectionsPayload = {};
          variantGroups.forEach((group, index) => {
            const option = selectedOptions[index];
            if (!group || !option) return;

            const attributeType = String(group.attributeType || "")
              .trim()
              .toLowerCase();
            const value = String(option.value || "").trim();
            if (!attributeType || !value) return;

            selectionsPayload[attributeType] = value;
          });

          if (Object.keys(selectionsPayload).length) {
            payload.variant_selections = selectionsPayload;
          }

          const headers = {};
          const isLoggedIn = Boolean(window.seamless_ajax?.is_logged_in);
          const existingGuestToken = getGuestToken();

          if (isLoggedIn) {
            const amsUserId = getAmsUserId();
            if (amsUserId) {
              payload.user_id = amsUserId;
            }
            if (existingGuestToken) {
              payload.guest_token = existingGuestToken;
            }
          } else {
            const guestToken = await ensureGuestCartToken();
            if (guestToken) {
              payload.guest_token = guestToken;
            }
          }

          const addResponse = await window.SeamlessAPI.post(
            "shop/cart/items",
            payload,
            headers,
          );
          const responseGuestToken =
            addResponse?.data?.guest_token ||
            addResponse?.guest_token ||
            "";
          if (responseGuestToken && !isLoggedIn) {
            setGuestToken(responseGuestToken);
          }

          const refreshedCart = await fetchCurrentCart().catch(() => null);
          this.cart = refreshedCart || this.cart;
          this.cartCount =
            Number(refreshedCart?.item_count ?? this.cartCount) || 0;
          updateCartCountUI(this.cartCount);
          this.stockWarning = "";

          this.showNotice(`${this.product.title} is added to cart.`);
        } catch (err) {
          console.error("[Cart] Error during add to cart process:", err);
          this.stockWarning =
            getApiErrorMessage(
              err,
              "This selected variant is out of stock. Choose another available option.",
            ) ||
            "This selected variant is out of stock. Choose another available option.";
          btn.innerHTML = originalText;
          btn.disabled = false;
          this.render();
        }
      });
  }

  bindImageZoom() {
    const imageContainer = this.elements.content?.querySelector(
      ".seamless-shop-detail-media .image-container",
    );
    const img = imageContainer?.querySelector("img");
    const zoomTrigger = this.elements.content?.querySelector(
      "[data-image-zoom]",
    );

    if (!imageContainer || !img) return;

    let zoomLevel = 1;
    const setZoom = (next) => {
      zoomLevel = Math.min(3, Math.max(1, next));
      imageContainer.style.setProperty("--seamless-zoom", String(zoomLevel));
      imageContainer.classList.toggle("is-zooming", zoomLevel > 1);
    };

    const updateOrigin = (clientX, clientY) => {
      const rect = imageContainer.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      imageContainer.style.setProperty("--seamless-zoom-x", `${x}%`);
      imageContainer.style.setProperty("--seamless-zoom-y", `${y}%`);
    };

    imageContainer.addEventListener("mouseenter", (e) => {
      updateOrigin(e.clientX, e.clientY);
      // Start with a subtle zoom on hover.
      setZoom(1.35);
    });

    imageContainer.addEventListener("mousemove", (e) => {
      if (zoomLevel <= 1) return;
      updateOrigin(e.clientX, e.clientY);
    });

    imageContainer.addEventListener("mouseleave", () => {
      setZoom(1);
    });

    imageContainer.addEventListener(
      "wheel",
      (e) => {
        // Wheel zoom when hovering the image; keep page from scrolling while zooming.
        if (!imageContainer.matches(":hover")) return;
        e.preventDefault();
        const delta = e.deltaY || 0;
        const factor = delta > 0 ? 0.9 : 1.1;
        updateOrigin(e.clientX, e.clientY);
        setZoom(zoomLevel * factor);
      },
      { passive: false },
    );

    const openModal = () => {
      const modal = ensureSeamlessZoomModal();
      if (!modal) return;
      modal.open(img.currentSrc || img.src, this.product?.title || "Product");
    };

    zoomTrigger?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal();
    });

    img.addEventListener("click", (e) => {
      // If user clicks the image, open the zoom modal.
      e.preventDefault();
      openModal();
    });
  }

  bindCurrentImageLoad(currentImage) {
    const imageContainer = this.elements.content?.querySelector(
      ".seamless-shop-detail-media .image-container",
    );
    const img = imageContainer?.querySelector("img");
    const loader = imageContainer?.querySelector(".loader");

    if (!imageContainer || !img || !currentImage) {
      return;
    }

    const markLoaded = () => {
      this.loadedDetailImages.add(currentImage);
      img.style.opacity = "1";
      if (loader) {
        loader.style.display = "none";
      }
    };

    if (this.loadedDetailImages.has(currentImage)) {
      markLoaded();
      return;
    }

    img.style.opacity = "0";
    if (loader) {
      loader.style.display = "flex";
    }

    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
      return;
    }

    img.addEventListener("load", markLoaded, { once: true });
    img.addEventListener(
      "error",
      () => {
        img.style.opacity = "1";
        if (loader) {
          loader.style.display = "none";
        }
      },
      { once: true },
    );
  }

  showNotice(message, timeout = 9000) {
    if (this.noticeTimer) {
      window.clearTimeout(this.noticeTimer);
      this.noticeTimer = null;
    }

    this.notice = String(message || "");
    this.render();

    if (!this.notice) {
      return;
    }

    this.noticeTimer = window.setTimeout(() => {
      this.notice = "";
      this.noticeTimer = null;
      this.render();
    }, timeout);
  }

  render() {
    const product = this.product;
    const allProducts = this.allProducts;
    if (!product) {
      return;
    }

    const config = getSeamlessConfig();
    const categories = resolveProductCategories(product, this.categoryMap);
    const categoryLabel = categories
      .map((category) => category.name)
      .join(", ");
    const descriptionSource =
      product.descriptionHtml || product.shortDescription || "";
    const description = stripHtml(descriptionSource);
    const richDescriptionHtml = formatSafeRichText(descriptionSource);
    const selectedOptions = this.getSelectedVariantOptions();
    const primaryOption = this.getPrimaryVariantOption();
    const galleryImages = this.getCurrentGalleryImages();
    this.syncThumbnailWindow(galleryImages);
    const visibleThumbnailCount = this.getVisibleThumbnailCount();
    const visibleThumbnails = galleryImages.slice(
      this.thumbnailStart,
      this.thumbnailStart + visibleThumbnailCount,
    );
    const showThumbnailNavigation = galleryImages.length > visibleThumbnailCount;
    this.galleryIndex = Math.min(
      Math.max(this.galleryIndex, 0),
      Math.max(galleryImages.length - 1, 0),
    );
    const currentImage =
      galleryImages[this.galleryIndex] ||
      product.featuredImage ||
      getPlaceholderImage(product.title);
    const isCurrentImageLoaded = this.loadedDetailImages.has(currentImage);
    const selectedStock =
      primaryOption?.stockQuantity ?? product.stockQuantity ?? 0;
    const quantityInCart = this.getCartQuantityForCurrentSelection();
    const availableStock =
      selectedStock > 0 ? Math.max(selectedStock - quantityInCart, 0) : 0;
    const hasTrackedStock = selectedStock > 0;
    const isOutOfStock =
      product.hasVariants && primaryOption
        ? !primaryOption.isAvailable || (hasTrackedStock && availableStock <= 0)
        : !product.isAvailable || (hasTrackedStock && availableStock <= 0);
    this.clampQuantity(availableStock);
    const similarProducts = allProducts
      .filter((candidate) => candidate.slug !== product.slug)
      .filter((candidate) => {
        if (!categories.length) {
          return true;
        }

        const candidateCategories = resolveProductCategories(
          candidate,
          this.categoryMap,
        );
        return candidateCategories.some((candidateCategory) =>
          categories.some(
            (category) =>
              String(category.id) === String(candidateCategory.id) ||
              String(category.slug) === String(candidateCategory.slug),
          ),
        );
      })
      .slice(0, 4);

    const variantMarkup = (product.variants || [])
      .map((group, groupIndex) => {
        const selectedOption = selectedOptions[groupIndex];
        if (!group.options.length) {
          return "";
        }

        const selectedValue = selectedOption
          ? formatAttributeLabel(selectedOption.value)
          : "";

        return `
          <div class="seamless-shop-variant-group">
            <div class="seamless-shop-variant-label">${escapeHtml(
              formatAttributeLabel(group.attributeType),
            )}</div>
            <div class="seamless-shop-variant-options" style="display: flex; gap: 12px;">
              ${group.options
                .map((option) => {
                  const isSelected =
                    selectedOption && option.id === selectedOption.id;
                  const optionStockQuantity = Number(option.stockQuantity ?? 0) || 0;
                  const optionCartQuantity =
                    this.getCartQuantityForVariantOption(groupIndex, option);
                  const optionIsSoldOut =
                    optionStockQuantity > 0 &&
                    optionCartQuantity >= optionStockQuantity;
                  const isOptionDisabled =
                    !option.isAvailable || optionIsSoldOut;
                  const hasSwatch = Boolean(option.swatch);
                  const swatchStyle = hasSwatch
                    ? ` style="--swatch-color: ${escapeHtml(option.swatch)};"`
                    : "";
                  const buttonClass = hasSwatch
                    ? "seamless-shop-variant-swatch"
                    : "seamless-shop-variant-pill";
                  const buttonContent = hasSwatch
                    ? `<span class="seamless-shop-variant-swatch-inner"></span>`
                    : `<span class="seamless-shop-variant-pill-label">${escapeHtml(
                        formatAttributeLabel(option.value),
                      )}</span>`;

                  return `
                    <div style="display: flex; flex-direction: column; align-items: center;">
                      <button
                        type="button"
                        class="${buttonClass}${isSelected ? " is-selected" : ""}${isOptionDisabled ? " is-disabled" : ""}"
                        data-variant-group-index="${groupIndex}"
                        data-variant-id="${escapeHtml(option.id)}"
                        aria-pressed="${isSelected ? "true" : "false"}"
                        aria-disabled="${isOptionDisabled ? "true" : "false"}"
                        aria-label="${escapeHtml(option.value)}"
                        ${isOptionDisabled ? "disabled" : ""}
                        ${swatchStyle}>
                        ${buttonContent}
                      </button>
                      ${
                        hasSwatch && isSelected
                          ? `<span style="font-size: 11px; font-weight: 700; color: #5c6c80; margin-top: 6px; text-transform: uppercase;">${escapeHtml(option.value)}</span>`
                          : ""
                      }
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>
        `;
      })
      .join("");
    const detailMetaMarkup = variantMarkup.trim()
      ? `
          <div class="seamless-shop-detail-meta">
            ${variantMarkup}
          </div>
        `
      : "";

    this.elements.loader.hidden = true;
    this.elements.loader.setAttribute("aria-hidden", "true");
    this.elements.content.hidden = false;
    this.elements.content.innerHTML = `
      <nav class="seamless-shop-breadcrumbs" aria-label="Breadcrumb">
        <a href="${escapeHtml(getSeamlessConfig().siteUrl)}">Home</a>
        <span>/</span>
        <a href="${escapeHtml(buildShopUrl())}">Shop</a>
        <span>/</span>
        <span>${escapeHtml(product.title)}</span>
        <a href="${escapeHtml(buildCartUrl())}" class="seamless-shop-breadcrumb-cart">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="9" cy="20" r="1"></circle>
            <circle cx="18" cy="20" r="1"></circle>
            <path d="M2 3h3l2.4 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6.2"></path>
          </svg>
          <span class="seamless-shop-cart-label">View Cart</span>
          <span class="seamless-shop-cart-count"${this.cartCount > 0 ? "" : " hidden"}>${escapeHtml(this.cartCount)}</span>
        </a>
      </nav>

      ${
        this.notice
          ? `
            <div class="seamless-shop-cart-notice" role="status" aria-live="polite">
              ${escapeHtml(this.notice)}
            </div>
          `
          : ""
      }

      <section class="seamless-shop-detail-hero">
      <div class="seamless-shop-detail-media-wrapper">
        <div class="seamless-shop-detail-media">
          <button type="button" class="seamless-shop-gallery-arrow is-prev" data-gallery-prev aria-label="Previous image"${galleryImages.length <= 1 ? " disabled" : ""}>
            <span>&lsaquo;</span>
          </button>
          <div class="image-container">
            <button type="button" class="seamless-shop-image-zoom-trigger" data-image-zoom aria-label="Zoom image">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            <div class="loader"${isCurrentImageLoaded ? ' style="display: none;"' : ""}></div>
            <img src="${escapeHtml(currentImage)}" alt="${escapeHtml(
              product.title,
            )}" loading="lazy" style="opacity: ${isCurrentImageLoaded ? "1" : "0"}; transition: opacity 0.3s ease;" />
          </div>
          <button type="button" class="seamless-shop-gallery-arrow is-next" data-gallery-next aria-label="Next image"${galleryImages.length <= 1 ? " disabled" : ""}>
            <span>&rsaquo;</span>
          </button>
        </div>
          ${
            galleryImages.length > 1
              ? `
                <div class="seamless-shop-detail-thumbnails-wrapper">
                  ${
                    showThumbnailNavigation
                      ? `
                        <button
                          type="button"
                          class="seamless-shop-thumbnail-nav is-prev"
                          data-thumbnail-prev
                          aria-label="Previous thumbnails"
                          ${this.thumbnailStart <= 0 ? "disabled" : ""}>
                          <span>&lsaquo;</span>
                        </button>
                      `
                      : ""
                  }
                  <div class="seamless-shop-detail-thumbnails" aria-label="Product gallery thumbnails">
                  ${visibleThumbnails
                    .map(
                      (image, index) => `
                        <button
                          type="button"
                          class="seamless-shop-detail-thumbnail${this.thumbnailStart + index === this.galleryIndex ? " is-active" : ""}"
                          data-gallery-index="${this.thumbnailStart + index}"
                          aria-label="View image ${this.thumbnailStart + index + 1}"
                          aria-pressed="${this.thumbnailStart + index === this.galleryIndex ? "true" : "false"}">
                          <img src="${escapeHtml(image)}" alt="${escapeHtml(product.title)} thumbnail ${index + 1}" loading="lazy" />
                        </button>
                      `,
                    )
                    .join("")}
                  </div>
                  ${
                    showThumbnailNavigation
                      ? `
                        <button
                          type="button"
                          class="seamless-shop-thumbnail-nav is-next"
                          data-thumbnail-next
                          aria-label="Next thumbnails"
                          ${
                            this.thumbnailStart + visibleThumbnailCount >=
                            galleryImages.length
                              ? "disabled"
                              : ""
                          }>
                          <span>&rsaquo;</span>
                        </button>
                      `
                      : ""
                  }
                </div>
              `
              : ""
          }
      </div>

        <div class="seamless-shop-detail-summary">
          <div class="seamless-shop-detail-overline">
            <h1>${escapeHtml(product.title)}</h1>
            <span class="seamless-shop-card-badge">${escapeHtml(
              config.productTypeLabel,
            )}</span>
          </div>
          <div class="seamless-shop-detail-price">${escapeHtml(
            product.priceLabel || "Contact for pricing",
          )}</div>
          <p class="seamless-shop-detail-excerpt">${escapeHtml(
            product.shortDescription || truncateText(description, 180),
          )}</p>
          ${detailMetaMarkup}

          <div class="seamless-shop-detail-actions">
            <div class="seamless-shop-quantity-control" aria-label="Quantity selector">
              <button type="button" class="seamless-shop-quantity-button" data-qty-decrease ${isOutOfStock ? "disabled" : ""}>-</button>
              <span class="seamless-shop-quantity-value">${escapeHtml(
                this.quantity,
              )}</span>
              <button type="button" class="seamless-shop-quantity-button" data-qty-increase ${isOutOfStock || (hasTrackedStock && availableStock <= this.quantity) ? "disabled" : ""}>+</button>
            </div>

            <button type="button" class="seamless-shop-add-to-cart-button${isOutOfStock ? " is-disabled" : ""}" ${isOutOfStock ? "disabled" : ""}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="9" cy="20" r="1"></circle>
                <circle cx="18" cy="20" r="1"></circle>
                <path d="M2 3h3l2.4 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6.2"></path>
              </svg>
              <span>${isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
            </button>
          </div>

          ${
            isOutOfStock || this.stockWarning
              ? `
                <p class="seamless-shop-variant-stock-message is-out" style="color: #e53e3e; font-size: 13px; font-weight: 600; margin-top: 12px;">
                  ${escapeHtml(
                    this.stockWarning ||
                      "This selected variant is out of stock. Choose another available option.",
                  )}
                </p>
              `
              : `
                <div class="seamless-shop-variant-helper">
                  <span class="seamless-shop-variant-helper-icon">&#10003;</span>
                  <span>Fast, trackable worldwide shipping available</span>
                </div>
              `
          }
        </div>
      </section>

      <section class="seamless-shop-detail-body">
        <h2>Product Details</h2>
        <div class="seamless-shop-detail-description">
          ${
            richDescriptionHtml
              ? richDescriptionHtml
              : `<p>${escapeHtml(
                  description ||
                    "Additional product information will be available soon.",
                )}</p>`
          }
        </div>
      </section>

      ${
        similarProducts.length
          ? `
            <section class="seamless-shop-similar-products">
              <div class="seamless-shop-section-header">
                <h2>Similar Products</h2>
                <a href="${escapeHtml(buildShopUrl())}">View Collection</a>
              </div>
              <div class="seamless-shop-grid">
                ${similarProducts
                  .map((item) => renderCompactProductCard(item))
                  .join("")}
              </div>
            </section>
          `
          : ""
      }
    `;

    this.bindDetailEvents();
    this.bindCurrentImageLoad(currentImage);
    bindShopCardImageLoads(this.elements.content);
  }
}

class SeamlessCart {
  constructor(root) {
    this.container = root;
    this.itemsContainer = root.querySelector("#seamless-cart-items-container");
    this.emptyContainer = root.querySelector("#seamless-cart-empty");
    this.summaryContainer = root.querySelector(
      ".seamless-cart-summary-column .seamless-cart-summary-box",
    );
    this.layoutElement = root.querySelector(".seamless-cart-layout");
    this.noticeElement = root.querySelector("#seamless-cart-notice");
    this.subtotalElement = root.querySelector("#seamless-cart-subtotal");
    this.totalElement = root.querySelector("#seamless-cart-total");
    this.checkoutButton = root.querySelector("#seamless-checkout-button");
    this.updateButton = root.querySelector("#seamless-cart-update-button");
    this.updateStatus = root.querySelector("#seamless-cart-update-status");
    this.updateButtonLabel =
      this.updateButton?.textContent?.trim() || "Update Cart";
    this.actionsRow = root.querySelector(".seamless-cart-actions-row");
    this.loadingElement = root.querySelector(".seamless-cart-loading");
    this.paginationElement = root.querySelector("#seamless-cart-pagination");
    this.cart = null;
    this.pendingQuantities = new Map();
    this.itemMessages = new Map();
    this.noticeTimer = null;
    this.currentPage = 1;
    this.perPage = 4;
  }

  async init() {
    try {
      await this.loadCart();
    } catch (e) {
      console.warn("[Seamless Cart] Failed to load cart", e);
    }
  }

  async loadCart() {
    this.cart = await fetchCurrentCart();
    console.log("[Cart UI] loadCart()", this.cart);
    updateCartCountUI(Number(this.cart?.item_count ?? 0) || 0);
    this.pendingQuantities.clear();
    this.itemMessages.clear();
    if (this.updateStatus) {
      this.updateStatus.textContent = "";
    }
    this.render();
    this.bindEvents();
  }

  getCartItems() {
    return this.cart?.items || [];
  }

  getCartValue(...values) {
    for (const value of values) {
      if (value !== null && value !== undefined && value !== "") {
        return value;
      }
    }

    return "";
  }

  formatMoney(value) {
    const numeric = Number(value || 0);
    return `$${numeric.toFixed(2)}`;
  }

  getMaxQuantity(item) {
    const rawMax = this.getCartValue(
      item.stock_quantity,
      item.stockQuantity,
      item.available_quantity,
      item.availableQuantity,
      item.max_quantity,
      item.maxQuantity,
      0,
    );
    const max = Number(rawMax || 0);
    return Number.isFinite(max) && max > 0 ? max : 0;
  }

  getItemKey(item) {
    return String(this.getCartValue(item.key, item.id, item.item_key));
  }

  getDisplayedQuantity(key, item) {
    if (this.pendingQuantities.has(key)) {
      return Number(this.pendingQuantities.get(key)) || 1;
    }
    return Number(this.getCartValue(item.quantity, 1)) || 1;
  }

  setPendingQuantity(key, nextQuantity, item) {
    const original = Number(this.getCartValue(item.quantity, 1)) || 1;
    const normalized = Math.max(1, Number(nextQuantity) || 1);
    if (normalized === original) {
      this.pendingQuantities.delete(key);
    } else {
      this.pendingQuantities.set(key, normalized);
    }
  }

  setItemMessage(key, message) {
    if (!message) {
      this.itemMessages.delete(key);
      return;
    }
    this.itemMessages.set(key, String(message));
  }

  showNotice(message, timeout = 7000) {
    if (!this.noticeElement) {
      return;
    }

    if (this.noticeTimer) {
      window.clearTimeout(this.noticeTimer);
      this.noticeTimer = null;
    }

    this.noticeElement.textContent = String(message || "");
    this.noticeElement.hidden = !message;

    if (!message) {
      return;
    }

    this.noticeTimer = window.setTimeout(() => {
      if (this.noticeElement) {
        this.noticeElement.textContent = "";
        this.noticeElement.hidden = true;
      }
      this.noticeTimer = null;
    }, timeout);
  }

  getStockLimitMessage(item, fallback) {
    const maxQuantity = this.getMaxQuantity(item);
    if (maxQuantity > 0) {
      return `Only ${maxQuantity} in stock for this product.`;
    }

    return this.getCartValue(
      item?.stock_message,
      fallback,
      "Requested quantity is not available for this product.",
    );
  }

  getErrorMessageFromResponse(error, item, fallback) {
    const apiMessage =
      error?.responseJson?.message ||
      error?.responseJson?.error ||
      "";

    if (apiMessage) {
      return String(apiMessage);
    }

    return this.getStockLimitMessage(item, fallback);
  }

  updateUpdateButtonState() {
    if (!this.updateButton) {
      return;
    }
    this.updateButton.disabled = this.pendingQuantities.size === 0;
  }

  buildCartItemMarkup(item) {
    const key = this.getItemKey(item);
    const quantity = this.getDisplayedQuantity(key, item);
    const image = this.getCartValue(
      item.image_url,
      item.image,
      "",
    );
    const title = escapeHtml(
      this.getCartValue(
        item.product_name,
        item.name,
        "Product",
      ),
    );
    const productUrl = buildInternalProductUrl({
      slug: this.getCartValue(item.product_slug, item.slug, ""),
      id: this.getCartValue(item.product_id, item.id, ""),
      title: this.getCartValue(item.product_name, item.name, "Product"),
    });
    const variantSelections = Array.isArray(item.variant_selections)
      ? item.variant_selections
      : item.variant_selections && typeof item.variant_selections === "object"
        ? Object.entries(item.variant_selections).map(([key, value]) => ({
            attribute_type: key,
            value,
          }))
        : [];
    const variantLabel = escapeHtml(
      variantSelections
        .map((selection) => {
          if (!selection || typeof selection !== "object") {
            return "";
          }

          const label = this.getCartValue(
            selection.attribute_label,
            selection.attribute_type,
            selection.name,
            "",
          );
          const value = this.getCartValue(
            selection.value_label,
            selection.value,
            "",
          );

          if (!label && !value) {
            return "";
          }

          return label ? `${label}: ${value}` : value;
        })
        .filter(Boolean)
        .join(", "),
    );
    const price = this.formatMoney(
      this.getCartValue(
        item.subtotal,
        item.line_total,
        item.total,
        item.unit_price,
        item.price,
        0,
      ),
    );
    const unitPrice = this.getCartValue(item.unit_price, item.price, 0);
    const unitPriceLabel = this.formatMoney(unitPrice);
    const canIncrement =
      typeof item.can_increment === "boolean" ? item.can_increment : true;
    const maxQuantity = this.getMaxQuantity(item);
    const incrementDisabled = (maxQuantity > 0 && quantity >= maxQuantity) || !canIncrement;
    const message =
      this.itemMessages.get(String(key)) ||
      String(this.getCartValue(item.stock_message, "")) ||
      "";

    return `
      <article class="seamless-cart-item" data-cart-key="${escapeHtml(key)}">
        <div class="seamless-cart-item-main">
          <div class="seamless-cart-item-media">
            <img src="${escapeHtml(image || getPlaceholderImage(title))}" alt="${title}" loading="lazy" />
          </div>
          <div class="seamless-cart-item-info">
            <h3><a href="${escapeHtml(productUrl)}">${title}</a></h3>
            ${variantLabel ? `<p>${variantLabel}</p>` : ""}
            <div class="seamless-shop-quantity-control seamless-cart-quantity-control" aria-label="Quantity selector">
              <button type="button" class="seamless-shop-quantity-button" data-cart-decrease="${escapeHtml(key)}">-</button>
              <span class="seamless-shop-quantity-value">${escapeHtml(quantity)}</span>
              <button type="button" class="seamless-shop-quantity-button" data-cart-increase="${escapeHtml(key)}" ${incrementDisabled ? "disabled" : ""}>+</button>
            </div>
            ${message ? `<p class="seamless-cart-item-message">${escapeHtml(message)}</p>` : ""}
          </div>
        </div>
        <div class="seamless-cart-item-side">
          <div class="seamless-cart-item-price">
            <strong>${escapeHtml(price)}</strong>
            <span class="seamless-cart-unit-price">${escapeHtml(unitPriceLabel)} each</span>
          </div>
          <button type="button" class="seamless-cart-remove-button" data-cart-remove="${escapeHtml(key)}">Remove</button>
        </div>
      </article>
    `;
  }

  render() {
    const items = this.getCartItems();
    const subtotal = this.getCartValue(
      this.cart?.subtotal,
      this.cart?.total,
      0,
    );
    const totalPages = Math.max(1, Math.ceil(items.length / this.perPage));
    this.currentPage = Math.min(Math.max(this.currentPage, 1), totalPages);
    const startIndex = (this.currentPage - 1) * this.perPage;
    const visibleItems = items.slice(startIndex, startIndex + this.perPage);

    if (this.loadingElement) {
      this.loadingElement.hidden = true;
      this.loadingElement.setAttribute("aria-hidden", "true");
    }

    if (this.layoutElement) {
      this.layoutElement.hidden = false;
    }

    if (!items.length) {
      if (this.itemsContainer) {
        this.itemsContainer.innerHTML = "";
      }
      this.container.classList.add("is-empty");
      this.emptyContainer.hidden = false;
      if (this.actionsRow) {
        this.actionsRow.hidden = true;
      }
      if (this.summaryContainer) {
        this.summaryContainer.hidden = true;
      }
      if (this.paginationElement) {
        this.paginationElement.hidden = true;
        this.paginationElement.innerHTML = "";
      }
      return;
    }

    this.container.classList.remove("is-empty");
    this.emptyContainer.hidden = true;
    if (this.actionsRow) {
      this.actionsRow.hidden = false;
    }
    if (this.summaryContainer) {
      this.summaryContainer.hidden = false;
    }

    if (this.checkoutButton) {
      const checkoutBase = `${getSeamlessConfig().apiDomain}/shop/checkout`;
      const accessToken = getAccessToken();
      const isLoggedIn = Boolean(window.seamless_ajax?.is_logged_in && accessToken);
      const guestToken = !isLoggedIn ? getGuestToken() : "";

      // No handoff: guests pass raw guest_token so AMS can load the same cart.
      this.checkoutButton.href = guestToken
        ? `${checkoutBase}?guest_token=${encodeURIComponent(guestToken)}`
        : checkoutBase;
    }

    if (this.subtotalElement) {
      this.subtotalElement.textContent = this.formatMoney(subtotal);
    }
    if (this.totalElement) {
      this.totalElement.textContent = this.formatMoney(subtotal);
    }

    if (this.itemsContainer) {
      this.itemsContainer.innerHTML = visibleItems
        .map((item) => this.buildCartItemMarkup(item))
        .join("");
    }

    this.renderPagination(items.length, totalPages);
    this.updateUpdateButtonState();
  }

  renderPagination(totalItems, totalPages) {
    if (!this.paginationElement) {
      return;
    }

    const markup = renderNumbersPagination(
      this.currentPage,
      totalItems,
      totalPages,
      this.perPage,
    );

    this.paginationElement.innerHTML = markup;
    this.paginationElement.hidden = !markup;
  }

  bindEvents() {
    if (this.itemsContainer && !this.itemsContainer.dataset.cartDelegated) {
      this.itemsContainer.dataset.cartDelegated = "true";
      this.itemsContainer.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
          return;
        }

        const inc = target.closest("[data-cart-increase]");
        const dec = target.closest("[data-cart-decrease]");
        const rem = target.closest("[data-cart-remove]");

        if (inc) {
          const key = String(inc.getAttribute("data-cart-increase") || "");
          const item = this.getCartItems().find(
            (entry) => this.getItemKey(entry) === key,
          );
          if (!item) return;

          const current = this.getDisplayedQuantity(key, item);
          const canIncrement =
            typeof item.can_increment === "boolean" ? item.can_increment : true;
          const maxQuantity = this.getMaxQuantity(item);

          if (maxQuantity > 0 && current >= maxQuantity) {
            this.setItemMessage(
              key,
              this.getStockLimitMessage(item),
            );
            this.render();
            return;
          }

          if (!canIncrement && current >= Number(this.getCartValue(item.quantity, current))) {
            this.setItemMessage(
              key,
              this.getStockLimitMessage(
                item,
                "Only this quantity is available for this product.",
              ),
            );
            this.render();
            return;
          }

          this.setItemMessage(key, "");
          this.setPendingQuantity(key, current + 1, item);
          this.render();
          return;
        }

        if (dec) {
          const key = String(dec.getAttribute("data-cart-decrease") || "");
          const item = this.getCartItems().find(
            (entry) => this.getItemKey(entry) === key,
          );
          if (!item) return;

          const current = this.getDisplayedQuantity(key, item);
          if (current <= 1) {
            this.removeItem(key);
            return;
          }
          this.setItemMessage(key, "");
          this.setPendingQuantity(key, Math.max(1, current - 1), item);
          this.render();
          return;
        }

        if (rem) {
          const key = String(rem.getAttribute("data-cart-remove") || "");
          if (key) {
            this.removeItem(key);
          }
        }
      });
    }

    if (this.updateButton && !this.updateButton.dataset.cartUpdateBound) {
      this.updateButton.dataset.cartUpdateBound = "true";
      this.updateButton.addEventListener("click", () => {
        this.applyPendingUpdates();
      });
    }

    if (this.paginationElement && !this.paginationElement.dataset.cartPaginationBound) {
      this.paginationElement.dataset.cartPaginationBound = "true";
      this.paginationElement.addEventListener("click", (event) => {
        const button = event.target.closest("[data-page]");
        if (!button) {
          return;
        }

        const nextPage = Number(button.dataset.page);
        if (!Number.isFinite(nextPage) || nextPage < 1) {
          return;
        }

        this.currentPage = nextPage;
        this.render();
        this.container.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  async applyPendingUpdates() {
    if (!this.pendingQuantities.size) {
      return;
    }

    if (this.updateButton) {
      this.updateButton.disabled = true;
      this.updateButton.textContent = "Updating...";
    }
    if (this.updateStatus) {
      this.updateStatus.textContent = "";
      this.updateStatus.classList.remove("is-visible");
    }

    const items = this.getCartItems();
    const updates = Array.from(this.pendingQuantities.entries());
    const headers = {};
    const failedMessages = new Map();
    let hadFailures = false;

    for (const [key, quantity] of updates) {
      const item = items.find((entry) => this.getItemKey(entry) === String(key));
      if (!item) continue;

      const currentQuantity = Number(this.getCartValue(item.quantity, 1)) || 1;
      const desiredQuantity = Math.max(1, Number(quantity) || 1);

      // AMS PATCH currently behaves like "adjust quantity by N" (delta) rather than "set quantity to N".
      // Convert our desired absolute quantity into a delta for the API.
      const delta = desiredQuantity - currentQuantity;
      if (delta === 0) {
        this.pendingQuantities.delete(String(key));
        continue;
      }

      const payload = { quantity: delta };
      const guestToken = getGuestToken();
      const isLoggedIn = Boolean(window.seamless_ajax?.is_logged_in);

      if (isLoggedIn) {
        const amsUserId = getAmsUserId();
        if (amsUserId) payload.user_id = amsUserId;
        if (guestToken) payload.guest_token = guestToken;
      } else if (guestToken) {
        payload.guest_token = guestToken;
      }

      try {
        if (delta > 0) {
          const response = await window.SeamlessAPI.patch(
            `shop/cart/items/${key}`,
            payload,
            headers,
          );
          if (response?.data?.guest_token || response?.guest_token) {
            setGuestToken(response?.data?.guest_token || response?.guest_token);
          }
        } else {
          const deletePayload = {};
          if (isLoggedIn) {
            const amsUserId = getAmsUserId();
            if (amsUserId) deletePayload.user_id = amsUserId;
            if (guestToken) deletePayload.guest_token = guestToken;
          } else if (guestToken) {
            deletePayload.guest_token = guestToken;
          }
          deletePayload.quantity = Math.abs(delta);

          const response = await window.SeamlessAPI.delete(
            `shop/cart/items/${key}`,
            deletePayload,
            headers,
          );
          if (response?.data?.guest_token || response?.guest_token) {
            setGuestToken(response?.data?.guest_token || response?.guest_token);
          }
        }
        this.setItemMessage(String(key), "");
      } catch (error) {
        // If AMS rejects quantity, show a friendly message and keep the original quantity.
        hadFailures = true;
        this.pendingQuantities.delete(String(key));
        failedMessages.set(
          String(key),
          this.getErrorMessageFromResponse(
            error,
            item,
            "Only this quantity is available for this product.",
          ),
        );
      }
    }

    await this.loadCart();
    failedMessages.forEach((message, key) => {
      this.setItemMessage(String(key), message);
    });
    if (failedMessages.size) {
      this.render();
    }
    if (this.updateStatus) {
      this.updateStatus.classList.remove("is-error");
      this.updateStatus.textContent = hadFailures
        ? "Some cart items could not be updated."
        : "Cart updated.";
      if (hadFailures) {
        this.updateStatus.classList.add("is-error");
      }
      this.updateStatus.classList.add("is-visible");
      window.setTimeout(() => {
        if (this.updateStatus) {
          this.updateStatus.textContent = "";
          this.updateStatus.classList.remove("is-visible");
          this.updateStatus.classList.remove("is-error");
        }
      }, 1800);
    }

    if (this.updateButton) {
      this.updateButton.textContent = this.updateButtonLabel;
    }
  }

  async updateItemQuantity(key, quantity) {
    const payload = { quantity };
    const headers = {};
    const guestToken = getGuestToken();
    const isLoggedIn = Boolean(window.seamless_ajax?.is_logged_in);

    if (isLoggedIn) {
      const amsUserId = getAmsUserId();
      if (amsUserId) {
        payload.user_id = amsUserId;
      }
      if (guestToken) {
        payload.guest_token = guestToken;
      }
    } else if (guestToken) {
      payload.guest_token = guestToken;
    }

    const response = await window.SeamlessAPI.patch(
      `shop/cart/items/${key}`,
      payload,
      headers,
    );
    if (response?.data?.guest_token || response?.guest_token) {
      setGuestToken(response?.data?.guest_token || response?.guest_token);
    }
    await this.loadCart();
  }

  async removeItem(key) {
    const payload = {};
    const headers = {};
    const guestToken = getGuestToken();
    const isLoggedIn = Boolean(window.seamless_ajax?.is_logged_in);
    const item = this.getCartItems().find(
      (entry) => this.getItemKey(entry) === String(key),
    );
    const productName = this.getCartValue(
      item?.product_name,
      item?.name,
      "This product",
    );
    const quantity = Math.max(1, this.getDisplayedQuantity(String(key), item));

    if (isLoggedIn) {
      const amsUserId = getAmsUserId();
      if (amsUserId) {
        payload.user_id = amsUserId;
      }
      if (guestToken) {
        payload.guest_token = guestToken;
      }
    } else if (guestToken) {
      payload.guest_token = guestToken;
    }
    payload.quantity = quantity;

    try {
      const response = await window.SeamlessAPI.delete(
        `shop/cart/items/${key}`,
        payload,
        headers,
      );
      if (response?.data?.guest_token || response?.guest_token) {
        setGuestToken(response?.data?.guest_token || response?.guest_token);
      }
    } catch (error) {
      console.warn("[Seamless Cart] Failed to remove item", error);
    }
    await this.loadCart();
    this.showNotice(`${productName} removed from cart.`);
  }
}

export function initSeamlessShop() {
  if (!window.SeamlessAPI) {
    return;
  }

  initStandaloneCartWidgets();

  document.querySelectorAll(".seamless-shop-wrapper").forEach((root) => {
    if (root.dataset.shopInitialized === "true") {
      return;
    }

    root.dataset.shopInitialized = "true";
    const listing = new SeamlessShopListing(root);
    listing.init();
  });

  document.querySelectorAll(".seamless-shop-detail").forEach((root) => {
    if (root.dataset.shopInitialized === "true") {
      return;
    }

    root.dataset.shopInitialized = "true";
    const detail = new SeamlessShopDetail(root);
    detail.init();
  });

  const cartEl = document.getElementById("seamless-cart-container");
  if (cartEl && cartEl.dataset.cartInitialized !== "true") {
    cartEl.dataset.cartInitialized = "true";
    const cart = new SeamlessCart(cartEl);
    cart.init();
  }
}

if (typeof window !== "undefined") {
  // Expose an imperative initializer for integrations (Elementor preview, etc.).
  // Safe because `initSeamlessShop()` is idempotent via data-* guards.
  window.SeamlessShop = window.SeamlessShop || {};
  window.SeamlessShop.init = initSeamlessShop;

  // Elementor preview renders widgets dynamically. Bind to element-ready hooks so the
  // shop UI initializes even when markup is injected after DOMContentLoaded.
  const bindElementorHooks = () => {
    if (window.__seamlessShopElementorHooksBound) return;
    const hooks = window.elementorFrontend?.hooks;
    if (!hooks?.addAction) return;
    window.__seamlessShopElementorHooksBound = true;

    const safeInit = () => {
      try {
        initSeamlessShop();
      } catch (e) {
        console.warn("[Seamless Shop] init failed in Elementor hook", e);
      }
    };

    // Our custom Seamless Products List Elementor widget.
    hooks.addAction(
      "frontend/element_ready/seamless-products-list.default",
      safeInit,
    );
    hooks.addAction(
      "frontend/element_ready/seamless-cart-widget.default",
      safeInit,
    );

    // Also support users embedding the shortcode via Elementor's Shortcode widget.
    hooks.addAction("frontend/element_ready/shortcode.default", safeInit);
  };

  if (window.elementorFrontend) {
    bindElementorHooks();
  }
  // Elementor triggers `elementor/frontend/init` via jQuery events.
  if (window.jQuery && typeof window.jQuery === "function") {
    window.jQuery(window).on("elementor/frontend/init", bindElementorHooks);
  }
  // Fallback for environments where jQuery event binding isn't available.
  window.addEventListener("load", bindElementorHooks);
  // Final fallback: in Elementor preview iframe, sometimes `elementorFrontend` appears
  // after `load`. Retry briefly to avoid a "loader only" state in editor preview.
  if (window.location?.search?.includes("elementor-preview=")) {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      bindElementorHooks();
      if (window.__seamlessShopElementorHooksBound || attempts >= 20) {
        window.clearInterval(timer);
      }
    }, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSeamlessShop);
  } else {
    initSeamlessShop();
  }
}
