import type {
  ShopCart,
  ShopCategory,
  ShopCategoryReference,
  ShopProduct,
  ShopRichTextBlock,
  ShopRuntimeConfig,
  ShopVariantSelection,
  ShopVariantOption,
} from '../types/shop';

const SEAMLESS_AMS_GUEST_COOKIE = 'seamless_ams_guest_token';

const normalizeEndpoint = (value: string | undefined, fallback: string): string => {
  const normalized = String(value || fallback).trim().replace(/^\/+|\/+$/g, '');
  return normalized || fallback;
};

export const slugify = (value: string): string =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const looksLikeOpaqueProductId = (value: string): boolean =>
  /^[0-9a-f]{8,}-[0-9a-f-]{8,}$/i.test(String(value || '').trim());

export const stripHtml = (value: string): string => {
  if (!value) return '';

  if (typeof window === 'undefined') {
    return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const div = document.createElement('div');
  div.innerHTML = String(value);
  return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
};

export const truncateText = (value: string, maxLength = 110): string => {
  const text = stripHtml(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
};

export const formatAttributeLabel = (value: string): string =>
  String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const getPlaceholderImage = (label = 'Product'): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <defs>
        <linearGradient id="seamless-shop-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#eff3f7" />
          <stop offset="100%" stop-color="#d9e2ec" />
        </linearGradient>
      </defs>
      <rect width="800" height="800" fill="url(#seamless-shop-gradient)" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#17324d" font-family="Montserrat, sans-serif" font-size="42">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const getShopRuntimeConfig = (): ShopRuntimeConfig => {
  const config = typeof window !== 'undefined' ? (window as any).seamlessReactConfig || {} : {};

  return {
    apiDomain: String(config.clientDomain || '').replace(/\/+$/g, ''),
    siteUrl: String(config.siteUrl || window.location.origin).replace(/\/+$/g, ''),
    shopListEndpoint: normalizeEndpoint(config.shopListEndpoint, 'shop'),
    singleProductEndpoint: normalizeEndpoint(config.singleProductEndpoint, 'product'),
    shopCartEndpoint: normalizeEndpoint(config.shopCartEndpoint, 'shops/cart'),
    shopProductTypeLabel: String(config.shopProductTypeLabel || 'Physical').trim() || 'Physical',
    shopAvailabilityLabel: String(config.shopAvailabilityLabel || 'Available').trim() || 'Available',
    isLoggedIn: Boolean(config.isLoggedIn),
    amsUserId: String(config.amsUserId || '').trim(),
  };
};

const getGuestTokenFromUrl = (): string => {
  if (typeof window === 'undefined') return '';

  try {
    return new URLSearchParams(window.location.search).get('guest_token')?.trim() || '';
  } catch {
    return '';
  }
};

const appendGuestToken = (url: string, token = ''): string => {
  const guestToken = token || getGuestToken();
  if (!guestToken) return url;

  try {
    const parsedUrl = new URL(url, window.location.origin);
    parsedUrl.searchParams.set('guest_token', guestToken);
    return parsedUrl.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}guest_token=${encodeURIComponent(guestToken)}`;
  }
};

export const buildShopUrl = (): string => {
  const config = getShopRuntimeConfig();
  return appendGuestToken(`${config.siteUrl}/${config.shopListEndpoint}`);
};

export const buildProductUrl = (product: Pick<ShopProduct, 'slug' | 'id' | 'title'>): string => {
  const config = getShopRuntimeConfig();
  const normalizedSlug = String(product.slug || '').trim();
  const titleSlug = slugify(product.title || 'product');
  const slug = normalizedSlug && !looksLikeOpaqueProductId(normalizedSlug)
    ? normalizedSlug
    : titleSlug || String(product.id || '').trim() || 'product';
  return appendGuestToken(`${config.siteUrl}/${config.singleProductEndpoint}/${encodeURIComponent(slug)}`);
};

export const buildCartUrl = (): string => {
  const config = getShopRuntimeConfig();
  return appendGuestToken(`${config.siteUrl}/${config.shopCartEndpoint}`);
};

export const buildCheckoutUrl = (guestToken = ''): string => {
  const config = getShopRuntimeConfig();
  const baseUrl = `${config.apiDomain}/shop/checkout`;
  return appendGuestToken(baseUrl, guestToken);
};

export const buildSiteUrl = (): string => {
  const config = getShopRuntimeConfig();
  return config.siteUrl;
};

export const flattenCategories = (categories: ShopCategory[], accumulator: ShopCategory[] = []): ShopCategory[] => {
  categories.forEach((category) => {
    accumulator.push(category);
    if (category.children.length) {
      flattenCategories(category.children, accumulator);
    }
  });
  return accumulator;
};

export const resolveProductCategories = (
  product: Pick<ShopProduct, 'categories'>,
  categoryMap: Map<string, ShopCategory>,
): ShopCategoryReference[] => {
  const resolved = product.categories
    .map((category) => {
      const id = String(category.id ?? category.slug ?? '');
      return categoryMap.get(id) || categoryMap.get(String(category.slug || '')) || category;
    })
    .filter(Boolean);

  const seen = new Set<string>();
  return resolved.filter((category) => {
    const key = String(category.id || category.slug || '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const normalizeGalleryImages = (product: ShopProduct, selectedOption: ShopVariantOption | null): string[] => {
  const variantImages: string[] = [];
  const baseImages: string[] = [];

  const pushImage = (target: string[], candidate: unknown) => {
    if (!candidate) return;
    if (typeof candidate === 'string') {
      target.push(candidate);
      return;
    }

    if (typeof candidate === 'object') {
      const imageCandidate = candidate as Record<string, unknown>;
      const value =
        imageCandidate.url ||
        imageCandidate.src ||
        imageCandidate.image ||
        imageCandidate.image_url;

      if (typeof value === 'string' && value.trim()) {
        target.push(value);
      }
    }
  };

  if (selectedOption) {
    pushImage(variantImages, selectedOption.image);
    selectedOption.images.forEach((image) => pushImage(variantImages, image));
  }

  pushImage(baseImages, product.featuredImage);
  product.gallery.forEach((image) => pushImage(baseImages, image));

  const preferredImages = variantImages.length ? variantImages : baseImages;
  return Array.from(new Set(preferredImages.filter(Boolean)));
};

export const getInitialVariantSelection = (product: ShopProduct): string[] =>
  (product.variants || []).map(() => '');

export const buildVariantSelectionMap = (
  variantSelections: ShopVariantSelection[],
): Record<string, string> =>
  variantSelections.reduce<Record<string, string>>((accumulator, selection) => {
    const key = String(selection.attributeType || selection.attributeLabel || '')
      .trim()
      .toLowerCase();
    const value = String(selection.value || selection.valueLabel || '')
      .trim()
      .toLowerCase();

    if (key && value) {
      accumulator[key] = value;
    }

    return accumulator;
  }, {});

export const getCartQuantityForSelection = (
  cart: ShopCart | null,
  productId: string,
  variantSelections: Record<string, string>,
): number => {
  const items = Array.isArray(cart?.items) ? cart.items : [];
  const normalizedProductId = String(productId || '').trim();
  const selectionKeys = Object.keys(variantSelections).sort();

  return items.reduce((total, item) => {
    if (String(item.productId || '').trim() !== normalizedProductId) {
      return total;
    }

    const itemSelections = buildVariantSelectionMap(item.variantSelections || []);
    const itemSelectionKeys = Object.keys(itemSelections).sort();
    const sameSelection =
      selectionKeys.length === itemSelectionKeys.length &&
      selectionKeys.every((key) => itemSelections[key] === variantSelections[key]);

    if (!sameSelection) {
      return total;
    }

    return total + Math.max(0, Number(item.quantity || 0));
  }, 0);
};

export const formatPrice = (value: number | null, currencySymbol = '$'): string => {
  if (value === null || Number.isNaN(value)) {
    return 'Contact for pricing';
  }

  return `${currencySymbol}${value.toFixed(2)}`;
};

export const formatCurrency = (value: number | null): string => {
  return `$${Number(value || 0).toFixed(2)}`;
};

export const buildSafeRichTextBlocks = (value: string): ShopRichTextBlock[] => {
  const raw = String(value || '').trim();
  if (!raw) return [];

  const normalized = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*p\s*>/gi, '\n\n')
    .replace(/<\s*p[^>]*>/gi, '')
    .replace(/<\/\s*li\s*>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '- ')
    .replace(/<\/\s*ul\s*>/gi, '\n')
    .replace(/<\s*ul[^>]*>/gi, '')
    .replace(/<\/\s*ol\s*>/gi, '\n')
    .replace(/<\s*ol[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '');

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const firstLine = lines[0] || '';
  const remainingLines = lines.slice(1);
  const remainingLooksLikeList =
    remainingLines.length >= 2 ||
    remainingLines.some((line) => /^[-•]/.test(line)) ||
    remainingLines.some((line) => line.length <= 80);

  if (/:$/.test(firstLine) && remainingLines.length && remainingLooksLikeList) {
    return [
      {
        type: 'list',
        heading: firstLine.replace(/:$/, '').trim(),
        items: remainingLines.map((line) => line.replace(/^[-•]\s*/, '').trim()).filter(Boolean),
      },
    ];
  }

  if (lines.length >= 2 && lines.every((line) => /^[-•]\s*/.test(line))) {
    return [
      {
        type: 'list',
        items: lines.map((line) => line.replace(/^[-•]\s*/, '').trim()).filter(Boolean),
      },
    ];
  }

  return lines.map((line) => ({ type: 'paragraph', text: line }));
};

const getCookie = (name: string): string => {
  if (typeof document === 'undefined') return '';

  const cookies = String(document.cookie || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split('=');
    if (key === name) {
      return rest.join('=') || '';
    }
  }

  return '';
};

const setCookie = (name: string, value: string, days?: number): void => {
  if (typeof document === 'undefined') return;

  const maxAge = typeof days === 'number' ? Math.max(0, Number(days) || 0) * 24 * 60 * 60 : null;
  const secure = window.location?.protocol === 'https:';
  const cookieValue = encodeURIComponent(String(value || ''));
  const maxAgeAttribute = maxAge === null ? '' : `; Max-Age=${maxAge}`;

  document.cookie = `${name}=${cookieValue}${maxAgeAttribute}; Path=/; SameSite=Lax${secure ? '; Secure' : ''}`;
};

export const getGuestToken = (): string => {
  const urlToken = getGuestTokenFromUrl();
  if (urlToken) {
    setGuestToken(urlToken);
    return urlToken;
  }

  const cookieToken = decodeURIComponent(getCookie(SEAMLESS_AMS_GUEST_COOKIE) || '');
  if (cookieToken) {
    return cookieToken;
  }

  const legacyToken =
    window.sessionStorage?.getItem('seamless_guest_token') ||
    window.localStorage?.getItem('seamless_guest_token') ||
    '';

  if (legacyToken) {
    setGuestToken(legacyToken);

    try {
      window.sessionStorage?.removeItem('seamless_guest_token');
    } catch {
      // Ignore storage cleanup failures.
    }

    try {
      window.localStorage?.removeItem('seamless_guest_token');
    } catch {
      // Ignore storage cleanup failures.
    }

    return legacyToken;
  }

  return '';
};

export const setGuestToken = (token: string): void => {
  if (!token) return;
  setCookie(SEAMLESS_AMS_GUEST_COOKIE, token);
};

export const clearGuestToken = (): void => {
  setCookie(SEAMLESS_AMS_GUEST_COOKIE, '', 0);
};

export const getEmptyCart = (): ShopCart => ({
  items: [],
  itemCount: 0,
  subtotal: 0,
  total: 0,
  guestToken: '',
  raw: null,
});
