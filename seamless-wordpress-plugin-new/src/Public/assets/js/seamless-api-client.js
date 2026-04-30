/**
 * Seamless Direct API Fetcher
 */

class SeamlessDirectAPI {
  constructor() {
    // Get API domain and remove trailing slash to prevent double slashes
    this.apiDomain = (window.seamless_ajax?.api_domain || "").replace(
      /\/+$/,
      "",
    );
    this.cache = new Map();
    this.cacheTimeout = 60000;

    if (!this.apiDomain) {
      console.error("[Seamless API] ERROR: API domain is not configured!");
      console.error(
        "[Seamless API] Please set the Client Domain in WordPress Admin → Seamless → Authentication",
      );
      console.error(
        "[Seamless API] Current seamless_ajax object:",
        window.seamless_ajax,
      );
    } else {
      // console.log("[Seamless API] Initialized with domain:", this.apiDomain);
    }
  }

  isCartEndpoint(endpoint) {
    return (
      typeof endpoint === "string" &&
      (endpoint === "cart" ||
        endpoint === "shop/cart" ||
        endpoint === "shop/cart/session" ||
        endpoint === "shop/cart/items" ||
        endpoint.startsWith("shop/cart/items/"))
    );
  }

  /**
   * Get cache key for a request
   */
  getCacheKey(endpoint, params = {}) {
    const paramString = new URLSearchParams(params).toString();
    return `${endpoint}?${paramString}`;
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid(cacheEntry) {
    if (!cacheEntry) return false;
    return Date.now() - cacheEntry.timestamp < this.cacheTimeout;
  }

  /**
   * Fetch data from API with request-level caching
   */
  async fetch(endpoint, params = {}, useCache = true) {
    if (!this.apiDomain) {
      const error = new Error(
        "API domain is not configured. Please set it in WordPress Admin → Seamless → Authentication",
      );
      console.error("[Seamless API]", error.message);
      throw error;
    }

    const cacheKey = this.getCacheKey(endpoint, params);

    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (this.isCacheValid(cached)) {
        // console.log(`[Seamless] Using cached data for: ${endpoint}`);
        return cached.data;
      }
    }

    try {
      const url = new URL(`${this.apiDomain}/api/${endpoint}`);

      Object.keys(params).forEach((key) => {
        if (
          params[key] !== null &&
          params[key] !== undefined &&
          params[key] !== ""
        ) {
          url.searchParams.append(key, params[key]);
        }
      });

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (useCache) {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });
      }

      return result;
    } catch (error) {
      console.error(`[Seamless] API Error (${endpoint}):`, error);
      throw error;
    }
  }

  async fetchWithHeaders(
    endpoint,
    params = {},
    useCache = true,
    customHeaders = {},
  ) {
    if (!this.apiDomain) {
      throw new Error("API domain is not configured");
    }

    const cacheKey = `${this.getCacheKey(endpoint, params)}|${JSON.stringify(customHeaders)}`;
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (this.isCacheValid(cached)) {
        return cached.data;
      }
    }

    const url = new URL(`${this.apiDomain}/api/${endpoint}`);
    Object.keys(params).forEach((key) => {
      if (
        params[key] !== null &&
        params[key] !== undefined &&
        params[key] !== ""
      ) {
        url.searchParams.append(key, params[key]);
      }
    });

    if (this.isCartEndpoint(endpoint)) {
      console.log("[Cart API][GET] Request", {
        endpoint,
        url: url.toString(),
        params,
        headers: customHeaders,
      });
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...customHeaders,
      },
    });

    if (!response.ok) {
      if (this.isCartEndpoint(endpoint)) {
        console.error("[Cart API][GET] Failed", {
          endpoint,
          url: url.toString(),
          status: response.status,
          statusText: response.statusText,
        });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (this.isCartEndpoint(endpoint)) {
      console.log("[Cart API][GET] Response", {
        endpoint,
        url: url.toString(),
        result,
      });
    }
    if (useCache) {
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });
    }

    return result;
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.cache.clear();
    console.log("[Seamless] Cache cleared");
  }

  /**
   * Clear specific cache entry
   */
  clearCacheEntry(endpoint, params = {}) {
    const cacheKey = this.getCacheKey(endpoint, params);
    this.cache.delete(cacheKey);
  }

  toArray(value) {
    if (Array.isArray(value)) {
      return value;
    }

    if (value === null || value === undefined || value === "") {
      return [];
    }

    return [value];
  }

  slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  stripHtml(value) {
    if (!value) {
      return "";
    }

    const div = document.createElement("div");
    div.innerHTML = String(value);
    return (div.textContent || div.innerText || "").trim();
  }

  parsePriceValue(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.replace(/[^0-9.-]+/g, "");
      const parsed = parseFloat(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  formatPrice(value, currencySymbol = "$") {
    if (!Number.isFinite(value)) {
      return "";
    }

    return `${currencySymbol}${value.toFixed(2)}`;
  }

  extractTags(result) {
    const payload = result?.data ?? result;

    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    if (Array.isArray(result?.data)) {
      return result.data;
    }

    return [];
  }

  normalizeTagReference(tag) {
    if (tag === null || tag === undefined || tag === "") {
      return null;
    }

    if (typeof tag === "string" || typeof tag === "number") {
      const label = String(tag).trim();
      if (!label) {
        return null;
      }

      const slug = this.slugify(label);
      return {
        id: label,
        slug,
        label,
        name: label,
      };
    }

    if (typeof tag !== "object") {
      return null;
    }

    const label = String(
      tag.label ?? tag.name ?? tag.title ?? tag.slug ?? tag.id ?? "",
    ).trim();
    const slug = String(tag.slug ?? this.slugify(label)).trim();
    const id = String(tag.id ?? slug ?? label).trim();

    if (!id && !slug && !label) {
      return null;
    }

    return {
      ...tag,
      id: id || slug || label,
      slug: slug || this.slugify(label || id),
      label: label || slug || id,
      name: label || slug || id,
    };
  }

  normalizeShopCategoryReference(category) {
    if (category === null || category === undefined || category === "") {
      return null;
    }

    if (typeof category === "string" || typeof category === "number") {
      const label = String(category);
      return {
        id: label,
        name: label,
        slug: this.slugify(label),
      };
    }

    const id = category.id ?? category.term_id ?? category.category_id;
    const name =
      category.name ?? category.label ?? category.title ?? String(id || "");
    const slug =
      category.slug ?? category.handle ?? this.slugify(name || String(id || ""));

    if (!id && !name && !slug) {
      return null;
    }

    return {
      id: String(id ?? slug ?? name),
      name: String(name || slug || id),
      slug: String(slug || this.slugify(name || id)),
    };
  }

  extractShopProducts(result) {
    const payload = result?.data ?? result ?? {};
    const candidates = [
      payload.products,
      payload.items,
      payload.shop,
      payload.data,
      result?.products,
      result?.items,
      result?.shop,
    ];

    if (Array.isArray(payload)) {
      return payload;
    }

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    if (payload && typeof payload === "object" && (payload.id || payload.slug)) {
      return [payload];
    }

    return [];
  }

  extractShopCategories(result) {
    const payload = result?.data ?? result ?? {};
    const candidates = [
      payload.categories,
      payload.items,
      payload.data,
      result?.categories,
      result?.items,
    ];

    if (Array.isArray(payload)) {
      return payload;
    }

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    return [];
  }

  normalizeShopCategoryTree(categories, parentId = null) {
    return this.toArray(categories)
      .map((category) => {
        const normalized = this.normalizeShopCategoryReference(category);
        if (!normalized) {
          return null;
        }

        const children = this.normalizeShopCategoryTree(
          category.children ??
            category.subcategories ??
            category.items ??
            category.categories,
          normalized.id,
        );

        return {
          ...normalized,
          parentId,
          children,
        };
      })
      .filter(Boolean);
  }

  dedupeShopProducts(products) {
    const map = new Map();

    products.forEach((product) => {
      const key = String(product.slug || product.id || product.title || "");
      if (key && !map.has(key)) {
        map.set(key, product);
      }
    });

    return Array.from(map.values());
  }

  normalizeShopProduct(product) {
    if (!product || typeof product !== "object") {
      return null;
    }

    const title =
      product.title ?? product.name ?? product.label ?? "Untitled Product";
    const id = String(
      product.id ??
        product.product_id ??
        product.uuid ??
        product.slug ??
        this.slugify(title),
    );
    const slug = String(
      product.slug ?? product.handle ?? this.slugify(title) ?? id,
    );

    const categoryRefs = [
      ...this.toArray(product.categories),
      ...this.toArray(product.category),
      ...this.toArray(product.category_ids).map((value) => ({ id: value })),
      ...this.toArray(product.category_slugs).map((value) => ({
        id: value,
        slug: value,
        name: String(value),
      })),
    ]
      .map((category) => this.normalizeShopCategoryReference(category))
      .filter(Boolean);

    const images = [];
    const pushImage = (candidate) => {
      if (!candidate) {
        return;
      }

      if (typeof candidate === "string") {
        images.push(candidate);
        return;
      }

      const imageUrl =
        candidate.url ??
        candidate.src ??
        candidate.image ??
        candidate.image_url ??
        candidate.thumbnail_url;

      if (imageUrl) {
        images.push(imageUrl);
      }
    };

    pushImage(product.primary_image_url);
    pushImage(product.primaryImageUrl);
    pushImage(product.primary_image);
    pushImage(product.featured_image);
    pushImage(product.image);
    pushImage(product.image_url);
    pushImage(product.thumbnail);
    pushImage(product.thumbnail_url);
    pushImage(product.hero_image);
    pushImage(product.main_image);
    this.toArray(product.images).forEach(pushImage);
    this.toArray(product.gallery_images).forEach(pushImage);
    this.toArray(product.gallery).forEach(pushImage);

    const uniqueImages = Array.from(new Set(images.filter(Boolean)));
    const descriptionHtml =
      product.description ??
      product.content ??
      product.long_description ??
      "";
    const shortDescription = this.stripHtml(
      product.excerpt_description ??
        product.short_description ??
        product.excerpt ??
        descriptionHtml,
    );
    const currencySymbol =
      product.currency_symbol ?? product.currencySymbol ?? "$";
    const priceValue = this.parsePriceValue(
      product.price ??
        product.sale_price ??
        product.regular_price ??
        product.amount ??
        product.price_html ??
        product.formatted_price,
    );
    const priceLabelSource =
      product.formatted_price ??
      product.price_html ??
      product.display_price ??
      "";
    const productType = String(
      product.type ?? product.product_type ?? product.kind ?? "physical",
    ).toLowerCase();
    const stockQuantity = Number(
      product.stock_quantity ?? product.inventory_quantity ?? product.quantity,
    );
    const hasExplicitAvailability =
      typeof product.is_in_stock === "boolean" ||
      typeof product.in_stock === "boolean" ||
      typeof product.available === "boolean";
    const isAvailable = hasExplicitAvailability
      ? Boolean(
          product.is_in_stock ?? product.in_stock ?? product.available ?? false,
        )
      : Number.isFinite(stockQuantity)
        ? stockQuantity > 0
        : true;
    const variants = this.toArray(product.variants)
      .map((group) => {
        if (!group || typeof group !== "object") {
          return null;
        }

        const options = this.toArray(group.options)
          .map((option) => {
            if (!option || typeof option !== "object") {
              return null;
            }

            const optionImages = [];
            pushImage(option.image);
            this.toArray(option.images).forEach(pushImage);
            if (option.image) {
              optionImages.push(option.image);
            }
            this.toArray(option.images).forEach((image) => {
              if (image) {
                optionImages.push(image);
              }
            });

            const optionStockQuantity = Number(
              option.stock_quantity ??
                option.inventory_quantity ??
                option.quantity ??
                0,
            );

            return {
              id: String(
                option.variant_id ??
                  option.id ??
                  `${group.attribute_type || "variant"}-${option.value || ""}`,
              ),
              value: String(option.value ?? option.label ?? ""),
              swatch: String(option.swatch ?? option.color ?? "").trim(),
              image: String(option.image ?? optionImages[0] ?? ""),
              images: Array.from(new Set(optionImages.filter(Boolean))),
              stockQuantity: Number.isFinite(optionStockQuantity)
                ? optionStockQuantity
                : 0,
              isAvailable: optionStockQuantity > 0,
            };
          })
          .filter(Boolean);

        if (!options.length) {
          return null;
        }

        return {
          attributeType: String(
            group.attribute_type ?? group.name ?? group.type ?? "Variant",
          ),
          options,
        };
      })
      .filter(Boolean);

    return {
      id,
      slug,
      title: String(title),
      name: String(title),
      sku: String(product.sku ?? product.code ?? ""),
      shortDescription,
      descriptionHtml,
      excerpt: shortDescription,
      price: priceValue,
      priceLabel:
        this.stripHtml(priceLabelSource) ||
        this.formatPrice(priceValue, currencySymbol) ||
        "Contact for pricing",
      currencySymbol,
      featuredImage: uniqueImages[0] || "",
      gallery: uniqueImages,
      productType,
      stockQuantity: Number.isFinite(stockQuantity) ? stockQuantity : 0,
      isAvailable,
      availabilityStatus: isAvailable ? "available" : "unavailable",
      hasVariants: Boolean(product.has_variants ?? variants.length),
      variants,
      categories: categoryRefs,
      featured: Boolean(
        product.featured ?? product.is_featured ?? product.featured_product,
      ),
      url:
        product.purchase_url ??
        product.checkout_url ??
        product.product_url ??
        product.permalink ??
        product.url ??
        "",
      raw: product,
    };
  }

  /**
   * Get all events with pagination
   */
  async getEvents(
    page = 1,
    categories = [],
    search = "",
    sort = "all",
    perPage = 15,
  ) {
    const params = {
      page,
      search,
      per_page: perPage,
    };

    if (categories && categories.length > 0) {
      params.category_ids = categories.join(",");
    }

    if (sort !== "all") {
      params.status = sort;
    }

    return await this.fetch("events", params);
  }

  /**
   * Get all group events with pagination
   */
  async getGroupEvents(page = 1, categories = [], search = "", sort = "all") {
    const params = {
      page,
      search,
    };

    if (categories && categories.length > 0) {
      params.category_ids = categories.join(",");
    }

    if (sort !== "all") {
      params.status = sort;
    }

    return await this.fetch("group-events", params);
  }

  /**
   * Get single event by slug
   */
  async getEvent(slug) {
    return await this.fetch(`events/${slug}`);
  }

  /**
   * Get single group event by slug
   * Also fetches full data for associated events to get their schedules
   */
  async getGroupEvent(slug) {
    const groupEventResponse = await this.fetch(`group-events/${slug}`);

    // If the group event has associated events, fetch their full data including schedules
    if (
      groupEventResponse?.data?.associated_events &&
      Array.isArray(groupEventResponse.data.associated_events)
    ) {
      const associatedEventsWithSchedules = await Promise.all(
        groupEventResponse.data.associated_events.map(
          async (associatedEvent) => {
            // If the associated event has a slug, fetch its full data
            if (associatedEvent.slug) {
              try {
                const fullEventResponse = await this.fetch(
                  `events/${associatedEvent.slug}`,
                );
                if (fullEventResponse?.data) {
                  // Merge the full event data (including schedules) with the associated event
                  return {
                    ...associatedEvent,
                    ...fullEventResponse.data,
                    schedules: fullEventResponse.data.schedules || [],
                  };
                }
              } catch (error) {
                console.warn(
                  `[Seamless] Could not fetch full data for associated event: ${associatedEvent.slug}`,
                  error,
                );
              }
            }
            // Return the original associated event if we couldn't fetch full data
            return associatedEvent;
          },
        ),
      );

      // Update the group event with the enhanced associated events
      groupEventResponse.data.associated_events = associatedEventsWithSchedules;
    }

    return groupEventResponse;
  }

  /**
   * Get event by slug - automatically detects if it's a regular event or group event
   * Uses localStorage to remember event types for faster subsequent loads
   */
  async getEventBySlug(slug) {
    const cachedType = this.getEventTypeFromStorage(slug);

    if (cachedType === "group_event") {
      try {
        const result = await this.getGroupEvent(slug);
        if (result && result.data) {
          return {
            ...result,
            data: {
              ...result.data,
              event_type: "group_event",
            },
          };
        }
      } catch (error) {
        this.removeEventTypeFromStorage(slug);
      }
    }
    try {
      const result = await this.fetchSilent(`events/${slug}`);
      if (result && result.data) {
        this.saveEventTypeToStorage(slug, "event");
        return {
          ...result,
          data: {
            ...result.data,
            event_type: "event",
          },
        };
      }
    } catch (error) {}

    try {
      const result = await this.getGroupEvent(slug);
      if (result && result.data) {
        this.saveEventTypeToStorage(slug, "group_event");
        return {
          ...result,
          data: {
            ...result.data,
            event_type: "group_event",
          },
        };
      }
    } catch (error) {
      console.error(
        `[Seamless] Event '${slug}' not found in either events or group-events endpoints`,
      );
      throw new Error(`Event '${slug}' not found`);
    }
  }

  getEventTypeFromStorage(slug) {
    try {
      const stored = localStorage.getItem("seamless_event_types");
      if (stored) {
        const types = JSON.parse(stored);
        return types[slug] || null;
      }
    } catch (e) {}
    return null;
  }

  /**
   * Save event type to localStorage
   */
  saveEventTypeToStorage(slug, type) {
    try {
      const stored = localStorage.getItem("seamless_event_types");
      const types = stored ? JSON.parse(stored) : {};
      types[slug] = type;

      const entries = Object.entries(types);
      if (entries.length > 100) {
        const reduced = Object.fromEntries(entries.slice(-100));
        localStorage.setItem("seamless_event_types", JSON.stringify(reduced));
      } else {
        localStorage.setItem("seamless_event_types", JSON.stringify(types));
      }
    } catch (e) {}
  }

  /**
   * Remove event type from localStorage
   */
  removeEventTypeFromStorage(slug) {
    try {
      const stored = localStorage.getItem("seamless_event_types");
      if (stored) {
        const types = JSON.parse(stored);
        delete types[slug];
        localStorage.setItem("seamless_event_types", JSON.stringify(types));
      }
    } catch (e) {}
  }

  /**
   * Fetch data from API without logging errors (for silent fallback attempts)
   */
  async fetchSilent(endpoint, params = {}) {
    if (!this.apiDomain) {
      throw new Error("API domain not configured");
    }

    const cacheKey = this.getCacheKey(endpoint, params);

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (this.isCacheValid(cached)) {
        return cached.data;
      }
    }

    const url = new URL(`${this.apiDomain}/api/${endpoint}`);

    Object.keys(params).forEach((key) => {
      if (
        params[key] !== null &&
        params[key] !== undefined &&
        params[key] !== ""
      ) {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Get event categories
   */
  async getCategories() {
    return await this.fetch("categories");
  }

  /**
   * Get event tags
   */
  async getTags() {
    const result = await this.fetch("tags");
    const tags = this.extractTags(result)
      .map((tag) => this.normalizeTagReference(tag))
      .filter(Boolean);

    return {
      ...result,
      data: tags,
    };
  }

  /**
   * Fetch all events (both regular and group events) across all pages
   */
  async fetchAllEvents(categories = [], search = "") {
    const allEvents = [];
    let page = 1;
    let hasMoreEvents = true;
    let hasMoreGroupEvents = true;

    while (hasMoreEvents) {
      try {
        const result = await this.getEvents(
          page,
          categories,
          search,
          "all",
          100,
        );

        if (
          result.data &&
          result.data.events &&
          result.data.events.length > 0
        ) {
          const eventsWithType = result.data.events.map((event) => ({
            ...event,
            event_type: "event",
          }));
          allEvents.push(...eventsWithType);

          hasMoreEvents = result.data.pagination?.has_more_pages || false;
        } else {
          hasMoreEvents = false;
        }

        page++;

        if (page > 50) {
          console.warn("[Seamless] Event fetch exceeded 50 pages. Breaking.");
          break;
        }
      } catch (error) {
        console.error("[Seamless] Error fetching events:", error);
        hasMoreEvents = false;
      }
    }

    page = 1;
    while (hasMoreGroupEvents) {
      try {
        const result = await this.getGroupEvents(
          page,
          categories,
          search,
          "all",
        );

        if (
          result.data &&
          result.data.group_events &&
          result.data.group_events.length > 0
        ) {
          const filteredGroupEvents = result.data.group_events
            .filter(
              (event) =>
                event.associated_events && event.associated_events.length > 0,
            )
            .map((event) => ({
              ...event,
              event_type: "group_event",
            }));

          allEvents.push(...filteredGroupEvents);

          hasMoreGroupEvents = result.data.pagination?.has_more_pages || false;
        } else {
          hasMoreGroupEvents = false;
        }

        page++;

        if (page > 50) {
          console.warn(
            "[Seamless] Group event fetch exceeded 50 pages. Breaking.",
          );
          break;
        }
      } catch (error) {
        console.error("[Seamless] Error fetching group events:", error);
        hasMoreGroupEvents = false;
      }
    }

    const publishedEvents = allEvents.filter((event) => {
      const status = (event.status || "").toLowerCase();
      return status === "published";
    });

    this.cacheEventTypes(publishedEvents);

    return publishedEvents;
  }

  /**
   * Cache event types in localStorage for faster single event loading
   */
  cacheEventTypes(events) {
    try {
      const stored = localStorage.getItem("seamless_event_types");
      const types = stored ? JSON.parse(stored) : {};

      events.forEach((event) => {
        if (event.slug && event.event_type) {
          types[event.slug] = event.event_type;
        }
      });

      const entries = Object.entries(types);
      if (entries.length > 100) {
        const reduced = Object.fromEntries(entries.slice(-100));
        localStorage.setItem("seamless_event_types", JSON.stringify(reduced));
      } else {
        localStorage.setItem("seamless_event_types", JSON.stringify(types));
      }
    } catch (e) {}
  }

  // ============ Membership API Methods ============

  /**
   * Get membership plans
   */
  async getMembershipPlans(page = 1, search = "") {
    const params = {
      page,
      search,
    };

    return await this.fetch("membership-plans", params);
  }

  /**
   * Get single membership plan
   */
  async getMembershipPlan(planId) {
    return await this.fetch(`membership-plans/${planId}`);
  }

  /**
   * Get all membership plans with details
   */
  async getAllMembershipPlans() {
    try {
      const result = await this.getMembershipPlans(1, "");

      if (!result.data || !Array.isArray(result.data)) {
        return [];
      }

      const plansWithDetails = await Promise.all(
        result.data.map(async (plan) => {
          if (plan.id) {
            try {
              const detailResult = await this.getMembershipPlan(plan.id);
              if (detailResult.data) {
                return { ...plan, ...detailResult.data };
              }
            } catch (error) {
              console.error(
                `[Seamless] Error fetching plan ${plan.id}:`,
                error,
              );
            }
          }
          return plan;
        }),
      );

      return plansWithDetails;
    } catch (error) {
      console.error("[Seamless] Error fetching membership plans:", error);
      return [];
    }
  }

  // ============ Shop API Methods ============

  async getShopProducts(page = 1, search = "", categoryIds = [], perPage = 100) {
    const params = {
      page,
      search,
      per_page: perPage,
    };

    if (categoryIds && categoryIds.length > 0) {
      params.category_ids = categoryIds.join(",");
    }

    return await this.fetch("shop/products", params);
  }

  async getShopProduct(slugOrId) {
    try {
      const result = await this.fetch(`shop/products/${slugOrId}`);
      if (result && (result.data || result.id)) {
        return this.normalizeShopProduct(result.data || result);
      }
    } catch (e) {
      console.warn("[Seamless] Could not fetch single shop product", e);
    }
    return null;
  }

  async getShopCategories() {
    const result = await this.fetch("shop/categories");
    return this.normalizeShopCategoryTree(this.extractShopCategories(result));
  }

  async getShopCart() {
    try {
      const result = await this.fetch("shop/cart", {}, false);
      return result?.data ?? result ?? null;
    } catch (error) {
      const fallback = await this.fetch("cart", {}, false);
      return fallback?.data ?? fallback ?? null;
    }
  }

  async getShopCartWithToken(guestToken = "", accessToken = "", userId = "") {
    const params = {};
    if (guestToken) {
      params.guest_token = guestToken;
    }
    if (userId) {
      params.user_id = userId;
    }
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

    try {
      const result = await this.fetchWithHeaders("shop/cart", params, false, headers);
      return result?.data ?? result ?? null;
    } catch (error) {
      const fallback = await this.fetchWithHeaders("cart", params, false, headers);
      return fallback?.data ?? fallback ?? null;
    }
  }

  async getAllShopProducts(search = "", categoryIds = []) {
    const products = [];
    let page = 1;
    let hasMore = true;
    const perPage = 100;

    while (hasMore && page <= 50) {
      const result = await this.getShopProducts(
        page,
        search,
        categoryIds,
        perPage,
      );
      const batch = this.extractShopProducts(result)
        .map((product) => this.normalizeShopProduct(product))
        .filter(Boolean);

      if (!batch.length) {
        break;
      }

      products.push(...batch);

      const pagination =
        result?.data?.pagination ??
        result?.pagination ??
        result?.data?.meta ??
        result?.meta ??
        {};

      if (typeof pagination.has_more_pages !== "undefined") {
        hasMore = Boolean(pagination.has_more_pages);
      } else if (
        pagination.current_page &&
        (pagination.last_page || pagination.total_pages)
      ) {
        hasMore =
          Number(pagination.current_page) <
          Number(pagination.last_page || pagination.total_pages);
      } else {
        hasMore = batch.length === perPage;
      }

      page += 1;
    }

    return this.dedupeShopProducts(products);
  }

  async getShopProductBySlug(slug) {
    const needle = String(slug || "").toLowerCase();
    if (!needle) {
      return null;
    }

    const products = await this.getAllShopProducts();
    return (
      products.find((product) => {
        return (
          String(product.slug || "").toLowerCase() === needle ||
          String(product.id || "").toLowerCase() === needle
        );
      }) || null
    );
  }

  // ============ Courses API Methods ============

  /**
   * Get courses
   */
  async getCourses(page = 1, search = "") {
    const params = {
      page,
      search,
    };

    return await this.fetch("courses", params);
  }

  /**
   * Get single course by ID
   */
  async getCourse(courseId) {
    return await this.fetch(`courses/${courseId}`);
  }

  /**
   * Get all courses with details
   */
  async getAllCourses() {
    try {
      const result = await this.getCourses(1, "");

      if (!result.data || !Array.isArray(result.data)) {
        return [];
      }

      return result.data;
    } catch (error) {
      console.error("[Seamless] Error fetching courses:", error);
      return [];
    }
  }

  async request(method, endpoint, data = null, customHeaders = {}) {
    if (!this.apiDomain) {
      throw new Error("API domain is not configured");
    }

    const url = new URL(`${this.apiDomain}/api/${endpoint}`);
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...customHeaders,
    };

    // Some AMS cart endpoints accept identity params via query rather than JSON body,
    // especially for PATCH/DELETE. Send them in both places for compatibility.
    if (
      method !== "GET" &&
      this.isCartEndpoint(endpoint) &&
      data &&
      typeof data === "object"
    ) {
      if (data.guest_token) {
        url.searchParams.set("guest_token", data.guest_token);
      }
      if (data.user_id) {
        url.searchParams.set("user_id", data.user_id);
      }
      if (method === "PATCH" && data.quantity !== undefined && data.quantity !== null) {
        url.searchParams.set("quantity", String(data.quantity));
      }
    }

    if (this.isCartEndpoint(endpoint)) {
      console.log(`[Cart API][${method}] Request`, {
        endpoint,
        url: url.toString(),
        data,
        headers: customHeaders,
      });
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      ...(data === null ? {} : { body: JSON.stringify(data) }),
    });

    if (!response.ok) {
      let responseBody = "";
      if (this.isCartEndpoint(endpoint)) {
        try {
          responseBody = await response.text();
        } catch (_) {}
        console.error(`[Cart API][${method}] Failed`, {
          endpoint,
          url: url.toString(),
          status: response.status,
          statusText: response.statusText,
          responseBody,
        });
      }
      const error = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.responseBody = responseBody;
      try {
        error.responseJson = responseBody ? JSON.parse(responseBody) : null;
      } catch (_) {
        error.responseJson = null;
      }
      throw error;
    }

    const result = await response.json();
    if (this.isCartEndpoint(endpoint)) {
      console.log(`[Cart API][${method}] Response`, {
        endpoint,
        url: url.toString(),
        result,
      });
    }

    return result;
  }

  async post(endpoint, data = {}, customHeaders = {}) {
    return await this.request("POST", endpoint, data, customHeaders);
  }

  async patch(endpoint, data = {}, customHeaders = {}) {
    return await this.request("PATCH", endpoint, data, customHeaders);
  }

  async delete(endpoint, data = {}, customHeaders = {}) {
    return await this.request("DELETE", endpoint, data, customHeaders);
  }
}

window.SeamlessAPI = new SeamlessDirectAPI();

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = SeamlessDirectAPI;
}
