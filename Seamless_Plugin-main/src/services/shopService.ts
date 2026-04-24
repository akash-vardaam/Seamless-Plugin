import api, { requestWithCache } from './api';
import type {
  ShopCart,
  ShopCartItem,
  ShopCategory,
  ShopCategoryReference,
  ShopProduct,
  ShopRuntimeConfig,
  ShopVariantSelection,
} from '../types/shop';
import {
  clearGuestToken,
  formatPrice,
  getEmptyCart,
  getGuestToken,
  getPlaceholderImage,
  getShopRuntimeConfig,
  setGuestToken,
  slugify,
  stripHtml,
} from '../utils/shopHelpers';

const MAX_PRODUCTS_PAGE = 50;
const PRODUCTS_PER_PAGE = 100;
const SHOP_CART_EVENT = 'seamless-shop-cart-updated';

const toArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value === null || value === undefined || value === '') return [];
  return [value as T];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const parsePriceValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const numeric = Number(value.replace(/[^0-9.-]+/g, ''));
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
};

const parseDateTimestamp = (...values: unknown[]): number => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value > 100000000000 ? value : value * 1000;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Date.parse(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return 0;
};

const normalizeShopCategoryReference = (category: unknown): ShopCategoryReference | null => {
  if (category === null || category === undefined) return null;

  if (typeof category === 'string' || typeof category === 'number') {
    const stringValue = String(category);
    return { id: stringValue, name: stringValue, slug: slugify(stringValue) };
  }

  if (typeof category !== 'object') return null;

  const value = category as Record<string, unknown>;
  const name = String(value.name ?? value.label ?? value.slug ?? value.id ?? 'Category').trim();
  const id = (String(value.id ?? value.slug ?? slugify(name) ?? '').trim() || name).trim();
  const slug = (String(value.slug ?? slugify(name) ?? '').trim() || id).trim();

  if (!id) return null;

  return { id, name: name || 'Category', slug: slug || slugify(name) || id };
};

const normalizeShopCategoryTree = (categories: unknown, parentId: string | null = null): ShopCategory[] =>
  toArray<unknown>(categories)
    .map((category) => {
      const normalized = normalizeShopCategoryReference(category);
      if (!normalized || typeof category !== 'object' || category === null) return null;

      const categoryValue = category as Record<string, unknown>;
      return {
        ...normalized,
        parentId,
        children: normalizeShopCategoryTree(
          categoryValue.children ??
            categoryValue.subcategories ??
            categoryValue.items ??
            categoryValue.categories,
          normalized.id,
        ),
      };
    })
    .filter(Boolean) as ShopCategory[];

const findNestedArray = (
  value: unknown,
  matcher: (entry: Record<string, unknown>) => boolean,
  depth = 0,
): Record<string, unknown>[] => {
  if (depth > 6 || value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    const records = value.filter(isRecord);
    if (records.length && records.some(matcher)) {
      return records;
    }

    for (const entry of value) {
      const nested = findNestedArray(entry, matcher, depth + 1);
      if (nested.length) return nested;
    }

    return [];
  }

  if (!isRecord(value)) return [];

  for (const nestedValue of Object.values(value)) {
    const nested = findNestedArray(nestedValue, matcher, depth + 1);
    if (nested.length) return nested;
  }

  return [];
};

const looksLikeProduct = (entry: Record<string, unknown>): boolean =>
  ['title', 'name', 'slug', 'handle', 'sku', 'price', 'product_type', 'type'].some((key) => key in entry);

const looksLikeCategory = (entry: Record<string, unknown>): boolean =>
  ['id', 'slug', 'name', 'label', 'children', 'subcategories', 'categories'].some((key) => key in entry);

const findCartSource = (value: unknown, depth = 0): Record<string, unknown> | null => {
  if (depth > 6 || !isRecord(value)) return null;

  const cartLikeKeys = ['items', 'line_items', 'cart_items', 'item_count', 'subtotal', 'total', 'guest_token'];
  if (cartLikeKeys.some((key) => key in value)) {
    return value;
  }

  for (const nestedValue of Object.values(value)) {
    if (isRecord(nestedValue)) {
      const nested = findCartSource(nestedValue, depth + 1);
      if (nested) return nested;
    }
  }

  return null;
};

const findGuestToken = (value: unknown, depth = 0): string => {
  if (depth > 6 || value === null || value === undefined) return '';

  if (Array.isArray(value)) {
    for (const entry of value) {
      const token = findGuestToken(entry, depth + 1);
      if (token) return token;
    }

    return '';
  }

  if (!isRecord(value)) return '';

  const directToken = getStringValue(value.guest_token, value.guestToken, value.token);
  if (directToken) return directToken;

  for (const nestedValue of Object.values(value)) {
    const token = findGuestToken(nestedValue, depth + 1);
    if (token) return token;
  }

  return '';
};

const extractShopProducts = (result: unknown): Record<string, unknown>[] => {
  const payload = (result as any)?.data ?? result ?? {};
  const candidates = [
    payload.products,
    payload.items,
    payload.shop,
    payload.data,
    (result as any)?.products,
    (result as any)?.items,
    (result as any)?.shop,
  ];

  if (Array.isArray(payload)) return payload as Record<string, unknown>[];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as Record<string, unknown>[];
  }

  if (isRecord(payload) && looksLikeProduct(payload)) {
    return [payload];
  }

  return findNestedArray(result, looksLikeProduct);
};

const extractShopCategories = (result: unknown): Record<string, unknown>[] => {
  const payload = (result as any)?.data ?? result ?? {};
  const candidates = [
    payload.categories,
    payload.items,
    payload.data,
    (result as any)?.categories,
    (result as any)?.items,
  ];

  if (Array.isArray(payload)) return payload as Record<string, unknown>[];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as Record<string, unknown>[];
  }

  if (isRecord(payload) && looksLikeCategory(payload)) {
    return [payload];
  }

  return findNestedArray(result, looksLikeCategory);
};

const shouldUseGuestCartFallback = (config: ShopRuntimeConfig): boolean =>
  !config.isLoggedIn || !config.amsUserId;

const emitCartUpdated = (cart: ShopCart): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ShopCart>(SHOP_CART_EVENT, { detail: cart }));
};

export const subscribeToShopCart = (listener: (cart: ShopCart) => void): (() => void) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const cart = (event as CustomEvent<ShopCart>).detail;
    if (cart) listener(cart);
  };

  window.addEventListener(SHOP_CART_EVENT, handler as EventListener);
  return () => window.removeEventListener(SHOP_CART_EVENT, handler as EventListener);
};

const getRawCartItems = (source: Record<string, unknown>): unknown[] =>
  toArray<unknown>(source.items ?? source.line_items ?? source.cart_items);

const getCartItemUniqueKey = (item: ShopCartItem): string => {
  const variantSignature = (item.variantSelections || [])
    .map((selection) => `${selection.attributeType}:${selection.value}`)
    .sort()
    .join('|');

  const normalizedProductId = String(item.productId || '').trim();
  if (normalizedProductId) {
    return `${normalizedProductId}::${variantSignature}`;
  }

  const fallbackIdentifier = String(getCartItemIdentifier(item) || '').trim();
  if (fallbackIdentifier) {
    return fallbackIdentifier;
  }

  return [
    String(item.productName || ''),
    String(item.unitPrice || ''),
    variantSignature,
  ].join('::');
};

const getRawCartItemCount = (source: Record<string, unknown>, items: ShopCartItem[]): number => {
  if (items.length) {
    return new Set(items.map(getCartItemUniqueKey)).size;
  }

  // Fallback when API responds without item lines.
  return Math.max(0, getNumericValue(source.item_count, source.itemCount, 0));
};

const getRawCartTotal = (source: Record<string, unknown>, fallbackSubtotal: number): number =>
  getNumericValue(source.total, source.grand_total, source.cart_total, fallbackSubtotal);

const getRawCartSubtotal = (source: Record<string, unknown>): number =>
  getNumericValue(source.subtotal, source.sub_total, source.cart_subtotal, source.total);

const getRawCartGuestToken = (source: Record<string, unknown>): string =>
  getStringValue(source.guest_token, source.guestToken);

const extractCart = (value: unknown): ShopCart => {
  const source = findCartSource(value);
  if (!source) return getEmptyCart();

  const items = dedupeCartItems(
    getRawCartItems(source).map(normalizeCartItem).filter(Boolean) as ShopCartItem[],
  );
  const subtotal = getRawCartSubtotal(source);
  const total = getRawCartTotal(source, subtotal);
  const cart: ShopCart = {
    items,
    itemCount: getRawCartItemCount(source, items),
    subtotal,
    total,
    guestToken: getRawCartGuestToken(source),
    raw: source,
  };

  return cart;
};

const fetchShopProductsPage = async (
  params: Record<string, unknown>,
  preferCache = false,
): Promise<Record<string, unknown>> => {
  if (preferCache) {
    const response = await requestWithCache<Record<string, unknown>>({
      method: 'GET',
      url: '/shop/products',
      params,
    });

    return response.data;
  }

  const response = await api.get<Record<string, unknown>>('/shop/products', { params });
  return response.data;
};

const extractPagination = (payload: unknown): Record<string, unknown> =>
  ((payload as any)?.data?.pagination ??
    (payload as any)?.pagination ??
    (payload as any)?.data?.meta ??
    (payload as any)?.meta ??
    {}) as Record<string, unknown>;

const hasMorePages = (pagination: Record<string, unknown>, batchLength: number): boolean => {
  if (typeof pagination.has_more_pages !== 'undefined') {
    return Boolean(pagination.has_more_pages);
  }

  if (pagination.current_page && (pagination.last_page || pagination.total_pages)) {
    return Number(pagination.current_page) < Number(pagination.last_page || pagination.total_pages);
  }

  return batchLength === PRODUCTS_PER_PAGE;
};

const normalizeVariantOptions = (
  rawOptions: unknown,
  attributeType: string,
): ShopProduct['variants'][number]['options'] => {
  const optionsSource = Array.isArray(rawOptions)
    ? rawOptions
    : isRecord(rawOptions)
      ? Object.values(rawOptions)
      : [];

  return optionsSource
    .map((option) => {
      if (option === null || option === undefined) return null;

      if (typeof option === 'string' || typeof option === 'number') {
        const primitiveValue = String(option).trim();
        if (!primitiveValue) return null;

        return {
          id: `${attributeType}-${primitiveValue}`,
          value: primitiveValue,
          swatch: '',
          image: '',
          images: [],
          stockQuantity: 0,
          isAvailable: true,
        };
      }

      if (!isRecord(option)) return null;

      const optionImages: string[] = [];
      if (typeof option.image === 'string' && option.image.trim()) {
        optionImages.push(option.image);
      }
      toArray<unknown>(option.images ?? option.gallery ?? option.image_urls).forEach((image) => {
        if (typeof image === 'string' && image.trim()) {
          optionImages.push(image);
        }
      });

      const optionStockQuantity = Number(
        option.stock_quantity ??
          option.inventory_quantity ??
          option.quantity ??
          option.stock ??
          0,
      );
      const hasExplicitStockQuantity =
        Object.prototype.hasOwnProperty.call(option, 'stock_quantity') ||
        Object.prototype.hasOwnProperty.call(option, 'inventory_quantity') ||
        Object.prototype.hasOwnProperty.call(option, 'quantity') ||
        Object.prototype.hasOwnProperty.call(option, 'stock');

      const optionValue = String(
        option.value ??
          option.label ??
          option.name ??
          option.option ??
          option.term ??
          '',
      ).trim();

      if (!optionValue) return null;

      return {
        id: String(option.variant_id ?? option.id ?? `${attributeType}-${optionValue}`),
        value: optionValue,
        swatch: String(option.swatch ?? option.color ?? option.hex ?? '').trim(),
        image: String(option.image ?? optionImages[0] ?? ''),
        images: Array.from(new Set(optionImages.filter(Boolean))),
        stockQuantity: Number.isFinite(optionStockQuantity) ? optionStockQuantity : 0,
        isAvailable:
          typeof option.is_available === 'boolean' || typeof option.available === 'boolean'
            ? Boolean(option.is_available ?? option.available)
            : hasExplicitStockQuantity
              ? optionStockQuantity > 0
              : true,
      };
    })
    .filter(Boolean) as ShopProduct['variants'][number]['options'];
};

const normalizeProductVariants = (source: Record<string, unknown>): ShopProduct['variants'] => {
  const rawGroups = [
    ...toArray<unknown>(source.variants),
    ...toArray<unknown>(source.variant_attributes),
    ...toArray<unknown>(source.attributes),
    ...toArray<unknown>(source.options),
  ];

  const normalized = rawGroups
    .map((group) => {
      if (!group) return null;

      if (isRecord(group)) {
        const attributeType = String(
          group.attribute_type ?? group.attributeType ?? group.name ?? group.type ?? group.key ?? 'Variant',
        ).trim();

        const options = normalizeVariantOptions(
          group.options ?? group.values ?? group.terms ?? group.items ?? group.choices,
          attributeType || 'Variant',
        );

        if (!options.length) return null;

        return {
          attributeType: attributeType || 'Variant',
          options,
        };
      }

      return null;
    })
    .filter(Boolean) as ShopProduct['variants'];

  if (normalized.length) {
    return normalized;
  }

  if (isRecord(source.variants)) {
    return Object.entries(source.variants)
      .map(([attributeType, values]) => {
        const options = normalizeVariantOptions(values, attributeType);
        if (!options.length) return null;
        return { attributeType, options };
      })
      .filter(Boolean) as ShopProduct['variants'];
  }

  return [];
};

const normalizeShopProduct = (product: unknown): ShopProduct | null => {
  if (!product || typeof product !== 'object') return null;

  const source = product as Record<string, unknown>;
  const title = String(source.title ?? source.name ?? source.label ?? 'Untitled Product');
  const id = String(source.id ?? source.product_id ?? source.uuid ?? source.slug ?? slugify(title));
  const slug = String(source.slug ?? source.handle ?? slugify(title) ?? id);

  const categoryRefs = [
    ...toArray<unknown>(source.categories),
    ...toArray<unknown>(source.category),
    ...toArray<unknown>(source.category_ids).map((value) => ({ id: value })),
    ...toArray<unknown>(source.category_slugs).map((value) => ({
      id: value,
      slug: value,
      name: String(value),
    })),
  ]
    .map((category) => normalizeShopCategoryReference(category))
    .filter(Boolean) as ShopCategoryReference[];

  const images: string[] = [];
  const pushImage = (candidate: unknown): void => {
    if (!candidate) return;
    if (typeof candidate === 'string') {
      images.push(candidate);
      return;
    }

    if (typeof candidate === 'object') {
      const imageValue = candidate as Record<string, unknown>;
      const imageUrl =
        imageValue.url ??
        imageValue.src ??
        imageValue.image ??
        imageValue.image_url ??
        imageValue.thumbnail_url;

      if (typeof imageUrl === 'string' && imageUrl.trim()) {
        images.push(imageUrl);
      }
    }
  };

  pushImage(source.primary_image_url);
  pushImage(source.primaryImageUrl);
  pushImage(source.primary_image);
  pushImage(source.featured_image);
  pushImage(source.image);
  pushImage(source.image_url);
  pushImage(source.thumbnail);
  pushImage(source.thumbnail_url);
  pushImage(source.hero_image);
  pushImage(source.main_image);
  toArray<unknown>(source.images).forEach(pushImage);
  toArray<unknown>(source.gallery_images).forEach(pushImage);
  toArray<unknown>(source.gallery).forEach(pushImage);

  const uniqueImages = Array.from(new Set(images.filter(Boolean)));
  const descriptionHtml = String(source.description ?? source.content ?? source.long_description ?? '');
  const shortDescription = stripHtml(
    String(source.excerpt_description ?? source.short_description ?? source.excerpt ?? descriptionHtml),
  );
  const currencySymbol = String(source.currency_symbol ?? source.currencySymbol ?? '$');
  const priceValue = parsePriceValue(
    source.price ??
      source.sale_price ??
      source.regular_price ??
      source.amount ??
      source.price_html ??
      source.formatted_price,
  );
  const priceLabelSource = String(source.formatted_price ?? source.price_html ?? source.display_price ?? '');
  const sortTimestamp = parseDateTimestamp(
    source.created_at,
    source.createdAt,
    source.published_at,
    source.publishedAt,
    source.updated_at,
    source.updatedAt,
    source.date,
  );
  const productType = String(source.type ?? source.product_type ?? source.kind ?? 'physical').toLowerCase();
  const stockQuantity = Number(source.stock_quantity ?? source.inventory_quantity ?? source.quantity);
  const hasExplicitAvailability =
    typeof source.is_in_stock === 'boolean' ||
    typeof source.in_stock === 'boolean' ||
    typeof source.available === 'boolean';
  const isAvailable = hasExplicitAvailability
    ? Boolean(source.is_in_stock ?? source.in_stock ?? source.available ?? false)
    : Number.isFinite(stockQuantity)
      ? stockQuantity > 0
      : true;

  const variants = normalizeProductVariants(source);

  return {
    id,
    slug,
    title,
    name: title,
    sku: String(source.sku ?? source.code ?? ''),
    shortDescription,
    descriptionHtml,
    excerpt: shortDescription,
    price: priceValue,
    priceLabel: stripHtml(priceLabelSource) || formatPrice(priceValue, currencySymbol),
    currencySymbol,
    featuredImage: uniqueImages[0] || '',
    gallery: uniqueImages,
    productType,
    stockQuantity: Number.isFinite(stockQuantity) ? stockQuantity : 0,
    isAvailable,
    availabilityStatus: isAvailable ? 'available' : 'unavailable',
    hasVariants: Boolean(source.has_variants ?? variants.length),
    variants,
    categories: categoryRefs,
    featured: Boolean(source.featured ?? source.is_featured ?? source.featured_product),
    sortTimestamp,
    url: String(source.purchase_url ?? source.checkout_url ?? source.product_url ?? source.permalink ?? source.url ?? ''),
    raw: source,
  };
};

const dedupeShopProducts = (products: ShopProduct[]): ShopProduct[] => {
  const map = new Map<string, ShopProduct>();
  products.forEach((product) => {
    const key = String(product.slug || product.id || product.title || '');
    if (key && !map.has(key)) {
      map.set(key, product);
    }
  });
  return Array.from(map.values());
};

const getNumericValue = (...values: unknown[]): number => {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return 0;
};

const getStringValue = (...values: unknown[]): string => {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== '') {
      return String(value);
    }
  }
  return '';
};

const normalizeVariantSelections = (value: unknown): ShopVariantSelection[] => {
  if (Array.isArray(value)) {
    return value
      .map((selection) => {
        if (!selection || typeof selection !== 'object') return null;
        const selectionValue = selection as Record<string, unknown>;
        const attributeType = getStringValue(
          selectionValue.attribute_type,
          selectionValue.attribute_label,
          selectionValue.name,
        );
        const optionValue = getStringValue(selectionValue.value, selectionValue.value_label, selectionValue.label);
        if (!attributeType && !optionValue) return null;

        return {
          attributeType,
          attributeLabel: getStringValue(selectionValue.attribute_label, attributeType),
          value: optionValue,
          valueLabel: getStringValue(selectionValue.value_label, optionValue),
        };
      })
      .filter(Boolean) as ShopVariantSelection[];
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(([key, selectionValue]) => {
      const normalizedValue = getStringValue(selectionValue);
      return {
        attributeType: key,
        attributeLabel: key,
        value: normalizedValue,
        valueLabel: normalizedValue,
      };
    });
  }

  return [];
};

const getCartItemSourceIdentifier = (source: Record<string, unknown>): string =>
  getStringValue(
    source.key,
    source.item_key,
    source.cart_item_key,
    source.line_item_key,
    source.line_key,
    source.id,
    source.uuid,
  );

const getImageUrlFromCandidate = (candidate: unknown): string => {
  if (typeof candidate === 'string') {
    return candidate.trim();
  }

  if (!isRecord(candidate)) {
    return '';
  }

  return getStringValue(
    candidate.url,
    candidate.src,
    candidate.image,
    candidate.image_url,
    candidate.thumbnail,
    candidate.thumbnail_url,
    candidate.featured_image,
    candidate.primary_image_url,
  ).trim();
};

const getCartItemImageUrl = (source: Record<string, unknown>, title: string): string => {
  const productSource = [
    source.product,
    source.product_data,
    source.product_details,
    source.product_item,
  ].find(isRecord) as Record<string, unknown> | undefined;

  const directCandidates = [
    source.image_url,
    source.image,
    source.thumbnail,
    source.thumbnail_url,
    source.featured_image,
    source.primary_image_url,
    productSource?.image_url,
    productSource?.image,
    productSource?.thumbnail,
    productSource?.thumbnail_url,
    productSource?.featured_image,
    productSource?.primary_image_url,
  ];

  for (const candidate of directCandidates) {
    const imageUrl = getImageUrlFromCandidate(candidate);
    if (imageUrl) return imageUrl;
  }

  const listCandidates = [
    source.images,
    source.gallery,
    productSource?.images,
    productSource?.gallery,
  ];

  for (const collection of listCandidates) {
    for (const candidate of toArray<unknown>(collection)) {
      const imageUrl = getImageUrlFromCandidate(candidate);
      if (imageUrl) return imageUrl;
    }
  }

  return getPlaceholderImage(title);
};

const normalizeCartItem = (item: unknown): ShopCartItem | null => {
  if (!item || typeof item !== 'object') return null;

  const source = item as Record<string, unknown>;
  const productSource = [
    source.product,
    source.product_data,
    source.product_details,
    source.product_item,
  ].find(isRecord) as Record<string, unknown> | undefined;
  const title =
    getStringValue(
      source.product_name,
      source.name,
      productSource?.name,
      productSource?.title,
      productSource?.label,
    ) || 'Product';
  const unitPrice = getNumericValue(source.unit_price, source.price);
  const subtotal = getNumericValue(source.subtotal, source.line_total, source.total, unitPrice);
  const imageUrl = getCartItemImageUrl(source, title);
  const itemIdentifier = getCartItemSourceIdentifier(source);

  return {
    key: itemIdentifier,
    id: getStringValue(source.id, source.key, source.item_key, source.cart_item_key, source.line_item_key),
    productId: getStringValue(source.product_id, productSource?.id, productSource?.product_id, source.id),
    productName: title,
    quantity: Math.max(1, getNumericValue(source.quantity, 1)),
    subtotal,
    total: subtotal,
    unitPrice,
    imageUrl,
    canIncrement: typeof source.can_increment === 'boolean' ? Boolean(source.can_increment) : true,
    maxQuantity: getNumericValue(
      source.stock_quantity,
      source.stockQuantity,
      source.available_quantity,
      source.availableQuantity,
      source.max_quantity,
      source.maxQuantity,
    ),
    stockMessage: getStringValue(source.stock_message),
    variantSelections: normalizeVariantSelections(
      source.variant_selections ?? source.variantSelections ?? source.variant_selection ?? productSource?.variant_selections,
    ),
    raw: source,
  };
};

const isPlaceholderCartImage = (imageUrl: string): boolean => imageUrl.startsWith('data:image/svg+xml');

const getCartItemQualityScore = (item: ShopCartItem): number => {
  let score = 0;
  if (getCartItemIdentifier(item)) score += 8;
  if (!isPlaceholderCartImage(item.imageUrl)) score += 4;
  if (item.variantSelections.length) score += 2;
  if (item.productName && item.productName !== 'Product') score += 2;
  if (item.raw && Object.keys(item.raw).length) score += 1;
  return score;
};

const dedupeCartItems = (items: ShopCartItem[]): ShopCartItem[] => {
  const byIdentifier = new Map<string, ShopCartItem>();
  const passthrough: ShopCartItem[] = [];

  items.forEach((item) => {
    const itemIdentifier = getCartItemIdentifier(item);
    if (!itemIdentifier) {
      passthrough.push(item);
      return;
    }

    const existing = byIdentifier.get(itemIdentifier);
    if (!existing || getCartItemQualityScore(item) >= getCartItemQualityScore(existing)) {
      byIdentifier.set(itemIdentifier, item);
    }
  });

  return [...byIdentifier.values(), ...passthrough];
};

const normalizeCart = (value: unknown): ShopCart => extractCart(value);

const getCartItemIdentifier = (item: ShopCartItem): string =>
  getStringValue(
    item.key,
    item.id,
    item.raw?.['key'],
    item.raw?.['item_key'],
    item.raw?.['cart_item_key'],
    item.raw?.['line_item_key'],
    item.raw?.['line_key'],
    item.raw?.['id'],
    item.raw?.['uuid'],
  );

const getCartItemMatchSignature = (item: ShopCartItem): string =>
  [
    String(item.productId || ''),
    String(item.productName || ''),
    String(item.unitPrice || 0),
    item.variantSelections
      .map((selection) => `${selection.attributeType}:${selection.value}`)
      .sort()
      .join('|'),
  ].join('::');

const findMatchingCartItemInCart = (cart: ShopCart, targetItem: ShopCartItem): ShopCartItem | null => {
  const targetIdentifier = getCartItemIdentifier(targetItem);
  if (targetIdentifier) {
    const exactMatch = cart.items.find((item) => getCartItemIdentifier(item) === targetIdentifier);
    if (exactMatch) return exactMatch;
  }

  const targetSignature = getCartItemMatchSignature(targetItem);
  return cart.items.find((item) => getCartItemMatchSignature(item) === targetSignature) || null;
};

const isCartItemNotFoundError = (error: unknown): boolean =>
  /cart item was not found in the current cart/i.test(String((error as any)?.message || error || ''));

const isInvalidGuestCartError = (error: unknown): boolean => {
  const message = String((error as any)?.message || error || '');
  const status = Number((error as any)?.response?.status || 0);
  return [401, 403, 422].includes(status) || /401|403|422|invalid/i.test(message);
};

const getApiMessage = (value: unknown): string => {
  if (!value || typeof value !== 'object') return '';

  const source = value as Record<string, unknown>;
  const directMessage = getStringValue(source.message, source.error);
  if (directMessage) return directMessage;

  if (source.data && typeof source.data === 'object') {
    return getApiMessage(source.data);
  }

  return '';
};

const getCartRequestParams = (config: ShopRuntimeConfig, guestToken: string): Record<string, string> => {
  if (config.isLoggedIn && config.amsUserId) {
    return {
      ...(guestToken ? { guest_token: guestToken } : {}),
      user_id: config.amsUserId,
    };
  }

  if (guestToken) return { guest_token: guestToken };
  return {};
};

const mutateCart = async (
  method: 'post' | 'patch' | 'delete',
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<ShopCart> => {
  const requestEndpoint = endpoint.replace(/^\/+/, '');
  const payloadGuestToken = getStringValue(payload.guest_token);
  if (payloadGuestToken) {
    setGuestToken(payloadGuestToken);
  }

  const params: Record<string, unknown> = {
    ...(payloadGuestToken ? { guest_token: payloadGuestToken } : {}),
    ...(payload.user_id ? { user_id: payload.user_id } : {}),
    ...(typeof payload.quantity !== 'undefined' ? { quantity: payload.quantity } : {}),
  };

  let response;
  try {
    response =
      method === 'post'
        ? await api.post(requestEndpoint, payload, { params })
        : method === 'patch'
          ? await api.patch(requestEndpoint, payload, { params })
          : await api.delete(requestEndpoint, { data: payload, params });
  } catch (requestError: any) {
    throw new Error(
      getApiMessage(requestError?.response?.data) ||
        requestError?.message ||
        'Unable to update cart right now.',
    );
  }

  const responseGuestToken = findGuestToken(response.data);
  if (responseGuestToken) {
    setGuestToken(responseGuestToken);
  }

  if ((response.data as any)?.success === false) {
    throw new Error(getApiMessage(response.data) || 'Unable to update cart right now.');
  }

  const responseCart = normalizeCart(response.data);
  if (responseCart.items.length || responseCart.itemCount > 0) {
    emitCartUpdated(responseCart);
    return responseCart;
  }

  return fetchCurrentCart();
};

export const fetchShopCategories = async (): Promise<ShopCategory[]> => {
  const response = await requestWithCache<Record<string, unknown>>({
    method: 'GET',
    url: '/shop/categories',
  });

  return normalizeShopCategoryTree(extractShopCategories(response.data));
};

export const fetchAllShopProducts = async (search = '', categoryIds: string[] = []): Promise<ShopProduct[]> => {
  const products: ShopProduct[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= MAX_PRODUCTS_PAGE) {
    const params = {
      page,
      search,
      per_page: PRODUCTS_PER_PAGE,
      ...(categoryIds.length ? { category_ids: categoryIds.join(',') } : {}),
    };

    let payload = await fetchShopProductsPage(params);
    let batch = extractShopProducts(payload)
      .map(normalizeShopProduct)
      .filter(Boolean) as ShopProduct[];

    if (!batch.length && page === 1) {
      payload = await fetchShopProductsPage(
        {
          ...(search ? { search } : {}),
          ...(categoryIds.length ? { category_ids: categoryIds.join(',') } : {}),
        },
        false,
      );

      batch = extractShopProducts(payload)
        .map(normalizeShopProduct)
        .filter(Boolean) as ShopProduct[];
    }

    if (!batch.length) break;

    products.push(...batch);

    const pagination = extractPagination(payload);
    hasMore = hasMorePages(pagination, batch.length);

    page += 1;
  }

  return dedupeShopProducts(products);
};

export const fetchShopProduct = async (slugOrId: string): Promise<ShopProduct | null> => {
  try {
    const response = await requestWithCache<Record<string, unknown>>({
      method: 'GET',
      url: `/shop/products/${slugOrId}`,
    });

    return normalizeShopProduct((response.data as any)?.data ?? response.data);
  } catch {
    return null;
  }
};

export const ensureGuestCartToken = async (): Promise<string> => {
  const guestToken = getGuestToken();
  const config = getShopRuntimeConfig();
  if (guestToken) return guestToken;
  if (config.isLoggedIn) return '';

  const response = await api.post('/shop/cart/session');
  const token = getStringValue(response.data?.data?.guest_token, response.data?.guest_token, response.data?.token);
  if (token) setGuestToken(token);
  return token;
};

export const fetchCurrentCart = async (): Promise<ShopCart> => {
  const config = getShopRuntimeConfig();
  const guestToken = getGuestToken();

  if (!config.isLoggedIn && !guestToken) {
    return getEmptyCart();
  }

  try {
    let response = await api.get('/shop/cart', {
      params: getCartRequestParams(config, guestToken),
    });

    let cart = normalizeCart(response.data?.data ?? response.data);

    if (config.isLoggedIn && config.amsUserId && guestToken && cart.itemCount <= 0 && cart.items.length === 0) {
      response = await api.get('/shop/cart', {
        params: { user_id: config.amsUserId },
      });

      const userScopedCart = normalizeCart(response.data?.data ?? response.data);
      if (userScopedCart.itemCount > 0 || userScopedCart.items.length > 0) {
        cart = userScopedCart;
      }
    }

    if (cart.guestToken) setGuestToken(cart.guestToken);
    emitCartUpdated(cart);
    return cart;
  } catch (error) {
    if (config.isLoggedIn && config.amsUserId && guestToken) {
      try {
        const response = await api.get('/shop/cart', {
          params: { user_id: config.amsUserId },
        });

        const userScopedCart = normalizeCart(response.data?.data ?? response.data);
        if (userScopedCart.guestToken) setGuestToken(userScopedCart.guestToken);
        emitCartUpdated(userScopedCart);
        return userScopedCart;
      } catch {
        // Fall through to default handling below.
      }
    }

    if (!config.isLoggedIn && guestToken && isInvalidGuestCartError(error)) {
      clearGuestToken();
    }
    const emptyCart = getEmptyCart();
    emitCartUpdated(emptyCart);
    return emptyCart;
  }
};

export const addItemToCart = async (product: ShopProduct, quantity: number, variantSelections: Record<string, string>) => {
  const config = getShopRuntimeConfig();
  const existingGuestToken = getGuestToken();
  const payload: Record<string, unknown> = {
    product_id: product.id,
    quantity,
  };

  if (Object.keys(variantSelections).length) {
    payload.variant_selections = variantSelections;
  }

  if (config.isLoggedIn) {
    if (!shouldUseGuestCartFallback(config)) {
      payload.user_id = config.amsUserId;
      if (existingGuestToken) payload.guest_token = existingGuestToken;
    } else {
      const guestToken = existingGuestToken || (await ensureGuestCartToken());
      if (guestToken) payload.guest_token = guestToken;
    }
  } else {
    const guestToken = await ensureGuestCartToken();
    if (guestToken) payload.guest_token = guestToken;
  }

  return mutateCart('post', '/shop/cart/items', payload);
};

export const updateCartItemQuantity = async (item: ShopCartItem, desiredQuantity: number): Promise<ShopCart> => {
  const config = getShopRuntimeConfig();
  const guestToken = getGuestToken();
  const currentQuantity = Math.max(1, item.quantity);
  const nextQuantity = Math.max(1, desiredQuantity);

  if (nextQuantity === currentQuantity) return fetchCurrentCart();

  const delta = nextQuantity - currentQuantity;
  const mutateQuantity = async (targetItem: ShopCartItem): Promise<ShopCart> => {
    const itemIdentifier = getCartItemIdentifier(targetItem);

    if (!itemIdentifier) {
      throw new Error('Unable to update this cart item right now.');
    }

    const payload: Record<string, unknown> = { quantity: Math.abs(delta) };

    if (config.isLoggedIn) {
      if (config.amsUserId) payload.user_id = config.amsUserId;
      if (guestToken) payload.guest_token = guestToken;
    } else if (guestToken) {
      payload.guest_token = guestToken;
    }

    return delta > 0
      ? mutateCart('patch', `/shop/cart/items/${encodeURIComponent(itemIdentifier)}`, payload)
      : mutateCart('delete', `/shop/cart/items/${encodeURIComponent(itemIdentifier)}`, payload);
  };

  try {
    return await mutateQuantity(item);
  } catch (error) {
    if (!isCartItemNotFoundError(error)) {
      throw error;
    }

    const latestCart = await fetchCurrentCart();
    const latestItem = findMatchingCartItemInCart(latestCart, item);
    if (!latestItem) {
      throw new Error('This cart item is no longer available in the current cart.');
    }

    return mutateQuantity(latestItem);
  }
};

export const removeCartItem = async (item: ShopCartItem, quantity = item.quantity): Promise<ShopCart> => {
  const config = getShopRuntimeConfig();
  const guestToken = getGuestToken();
  const performRemove = async (targetItem: ShopCartItem): Promise<ShopCart> => {
    const itemIdentifier = getCartItemIdentifier(targetItem);

    if (!itemIdentifier) {
      throw new Error('Unable to remove this cart item right now.');
    }

    const payload: Record<string, unknown> = {};

    if (config.isLoggedIn) {
      if (config.amsUserId) payload.user_id = config.amsUserId;
      if (guestToken) payload.guest_token = guestToken;
    } else if (guestToken) {
      payload.guest_token = guestToken;
    }

    payload.quantity = Math.max(1, quantity);

    await mutateCart('delete', `/shop/cart/items/${encodeURIComponent(itemIdentifier)}`, payload);
    return fetchCurrentCart();
  };

  try {
    return await performRemove(item);
  } catch (error) {
    if (!isCartItemNotFoundError(error)) {
      throw error;
    }

    const latestCart = await fetchCurrentCart();
    const latestItem = findMatchingCartItemInCart(latestCart, item);
    if (!latestItem) {
      throw new Error('This cart item is no longer available in the current cart.');
    }

    return performRemove(latestItem);
  }
};
