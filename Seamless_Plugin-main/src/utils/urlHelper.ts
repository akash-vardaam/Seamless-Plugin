export interface EventURLConfig {
  siteUrl: string;
  singleEventEndpoint: string;
  eventListEndpoint: string;
  amsContentEndpoint?: string;
  shopListEndpoint?: string;
  singleProductEndpoint?: string;
  shopCartEndpoint?: string;
}

const normalizeEndpoint = (value: string | undefined, fallback: string): string => {
  const normalized = (value || fallback).trim().replace(/^\/+|\/+$/g, '');
  return normalized || fallback;
};

const getSafeRelativeReturnPath = (value: string | null): string => {
  if (!value || typeof window === 'undefined') {
    return '';
  }

  try {
    const decoded = decodeURIComponent(value);
    if (!decoded.startsWith('/') || decoded.startsWith('//') || /[\r\n]/.test(decoded)) {
      return '';
    }

    const url = new URL(decoded, window.location.origin);
    if (url.origin !== window.location.origin) {
      return '';
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '';
  }
};

const getCurrentEventListReturnPath = (singleEventEndpoint: string): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const currentUrl = new URL(window.location.href);
    const pathParts = currentUrl.pathname.split('/').filter(Boolean);
    const endpoint = normalizeEndpoint(singleEventEndpoint, 'event');

    if (pathParts.indexOf(endpoint) !== -1) {
      return '';
    }

    return currentUrl.pathname || '/';
  } catch {
    return '';
  }
};

const getWindowConfig = (): Partial<EventURLConfig> | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    (window as any).seamlessReactConfig ||
    (window as any).seamlessConfig ||
    null
  );
};

export const getWordPressSiteUrl = (): string => {
  if (typeof window !== 'undefined') {
    const config = getWindowConfig();
    if (config?.siteUrl) {
      return config.siteUrl;
    }

    const restApiMeta = document.querySelector('meta[name="rest-api-base-url"]');
    if (restApiMeta) {
      let siteUrl = restApiMeta.getAttribute('content');
      if (siteUrl && siteUrl.includes('/wp-json')) {
        siteUrl = siteUrl.split('/wp-json')[0];
      }
      return siteUrl || window.location.origin;
    }

    const siteMeta = document.querySelector('meta[name="wordpress-site-url"]');
    if (siteMeta) {
      const siteUrl = siteMeta.getAttribute('content');
      if (siteUrl) {
        return siteUrl;
      }
    }

    return window.location.origin;
  }

  return '';
};

export const getSeamlessConfig = (): EventURLConfig | null => {
  const config = getWindowConfig();
  if (config) {
    return {
      siteUrl: (config.siteUrl || getWordPressSiteUrl()).replace(/\/+$/g, ''),
      singleEventEndpoint: normalizeEndpoint(config.singleEventEndpoint, 'event'),
      eventListEndpoint: normalizeEndpoint(config.eventListEndpoint, 'events'),
      amsContentEndpoint: normalizeEndpoint(config.amsContentEndpoint, 'ams-content'),
      shopListEndpoint: normalizeEndpoint(config.shopListEndpoint, 'shop'),
      singleProductEndpoint: normalizeEndpoint(config.singleProductEndpoint, 'product'),
      shopCartEndpoint: normalizeEndpoint(config.shopCartEndpoint, 'shops/cart'),
    };
  }

  const siteUrl = getWordPressSiteUrl();
  if (siteUrl) {
    return {
      siteUrl: siteUrl.replace(/\/+$/g, ''),
      singleEventEndpoint: 'event',
      eventListEndpoint: 'events',
      amsContentEndpoint: 'ams-content',
      shopListEndpoint: 'shop',
      singleProductEndpoint: 'product',
      shopCartEndpoint: 'shops/cart',
    };
  }

  return null;
};

export const createEventSlug = (title: string, id: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() || id;
};

export const getEventPageURL = (eventSlug: string, isGroupEvent: boolean = false): string => {
  const config = getSeamlessConfig();
  const baseUrl = config?.siteUrl || window.location.origin;
  const singleEventEndpoint = config?.singleEventEndpoint || 'event';
  const eventUrl = new URL(`${baseUrl.replace(/\/+$/g, '')}/${singleEventEndpoint}/${encodeURIComponent(eventSlug)}`);

  if (isGroupEvent) {
    eventUrl.searchParams.set('type', 'group-event');
  }

  const returnPath = getCurrentEventListReturnPath(singleEventEndpoint);
  if (returnPath) {
    eventUrl.searchParams.set('return_to', returnPath);
  }

  return eventUrl.toString();
};

export const getEventURL = (
  eventTitle: string,
  eventId: string,
  eventSlug?: string,
  isGroupEvent?: boolean
): string => {
  const slug = eventSlug || createEventSlug(eventTitle, eventId);
  return getEventPageURL(slug, isGroupEvent);
};

export const navigateToEvent = (eventSlug: string, isGroupEvent?: boolean): void => {
  const url = getEventPageURL(eventSlug, isGroupEvent);
  window.location.href = url;
};

export const getSingleEventRoutePath = (): string => {
  const config = getSeamlessConfig();
  return `/${config?.singleEventEndpoint || 'event'}/:slug`;
};

export const getEventListRoutePath = (): string => {
  const config = getSeamlessConfig();
  return `/${config?.eventListEndpoint || 'events'}`;
};

export const getAmsContentRoutePath = (): string => {
  const config = getSeamlessConfig();
  return `/${config?.amsContentEndpoint || 'ams-content'}`;
};

export const getShopListRoutePath = (): string => {
  const config = getSeamlessConfig();
  return `/${config?.shopListEndpoint || 'shop'}`;
};

export const getSingleProductRoutePath = (): string => {
  const config = getSeamlessConfig();
  return `/${config?.singleProductEndpoint || 'product'}/:slug`;
};

export const getShopCartRoutePath = (): string => {
  const config = getSeamlessConfig();
  return `/${config?.shopCartEndpoint || 'shops/cart'}`;
};

export const getEventsListURL = (): string => {
  if (typeof window !== 'undefined') {
    const currentUrl = new URL(window.location.href);
    const returnPath = getSafeRelativeReturnPath(currentUrl.searchParams.get('return_to'));
    if (returnPath) {
      return new URL(returnPath, window.location.origin).toString();
    }

    if (currentUrl.searchParams.has('seamless_event')) {
      currentUrl.searchParams.delete('seamless_event');
      currentUrl.searchParams.delete('type');
      currentUrl.searchParams.delete('return_to');
      return currentUrl.toString();
    }
  }

  const config = getSeamlessConfig();

  if (config) {
    return `${config.siteUrl}/${config.eventListEndpoint}`;
  }

  return '/events';
};

export const getShopListURL = (): string => {
  const config = getSeamlessConfig();

  if (config) {
    return `${config.siteUrl}/${config.shopListEndpoint || 'shop'}`;
  }

  return '/shop';
};

export const getProductPageURL = (productSlug: string): string => {
  const config = getSeamlessConfig();
  const baseUrl = config?.siteUrl || window.location.origin;
  const endpoint = config?.singleProductEndpoint || 'product';
  return `${baseUrl.replace(/\/+$/g, '')}/${endpoint}/${encodeURIComponent(productSlug)}`;
};

export const getShopCartURL = (): string => {
  const config = getSeamlessConfig();

  if (config) {
    return `${config.siteUrl}/${config.shopCartEndpoint || 'shops/cart'}`;
  }

  return '/shops/cart';
};
