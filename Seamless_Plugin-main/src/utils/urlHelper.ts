export interface EventURLConfig {
  siteUrl: string;
  singleEventEndpoint: string;
  eventListEndpoint: string;
  amsContentEndpoint?: string;
}

const normalizeEndpoint = (value: string | undefined, fallback: string): string => {
  const normalized = (value || fallback).trim().replace(/^\/+|\/+$/g, '');
  return normalized || fallback;
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
    };
  }

  const siteUrl = getWordPressSiteUrl();
  if (siteUrl) {
    return {
      siteUrl: siteUrl.replace(/\/+$/g, ''),
      singleEventEndpoint: 'event',
      eventListEndpoint: 'events',
      amsContentEndpoint: 'ams-content',
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
  const eventUrl = `${baseUrl.replace(/\/+$/g, '')}/${singleEventEndpoint}/${encodeURIComponent(eventSlug)}`;

  if (!isGroupEvent) {
    return eventUrl;
  }

  return `${eventUrl}?type=group-event`;
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

export const getEventsListURL = (): string => {
  const config = getSeamlessConfig();

  if (config) {
    return `${config.siteUrl}/${config.eventListEndpoint}`;
  }

  return '/events';
};
