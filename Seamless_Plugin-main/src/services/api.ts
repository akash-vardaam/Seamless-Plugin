import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";
import { buildBrowserCacheKey, getBrowserCache, setBrowserCache } from '../utils/browserCache';

/**
 * Seamless API Client - Dual Mode
 * 
 * 1. Proxy Mode: For /dashboard/* endpoints, requests are routed through the 
 *    WordPress middleware (admin-ajax.php) to ensure secure authentication 
 *    without storing tokens in the browser.
 * 2. Direct Mode: For other endpoints (events, courses, etc.), requests hit the 
 *    AMS API directly for better performance and public access.
 */

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const cfg = (window as any).seamlessReactConfig;
    if (cfg?.clientDomain) {
      return cfg.clientDomain + '/api';
    }
  }
  if (import.meta.env.DEV) return '/api';
  return import.meta.env.VITE_API_BASE_URL || '/api';
};

const getAjaxUrl = () => {
  if (typeof window !== 'undefined') {
    const cfg = (window as any).seamlessReactConfig;
    if (cfg?.ajaxUrl) return cfg.ajaxUrl;
  }
  return '/wp-admin/admin-ajax.php';
};

const getAjaxNonce = () => {
  if (typeof window !== 'undefined') {
    const cfg = (window as any).seamlessReactConfig;
    return cfg?.ajaxNonce || '';
  }
  return '';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
});

const buildApiCacheKey = (config: AxiosRequestConfig) => buildBrowserCacheKey('api', {
  method: (config.method || 'GET').toUpperCase(),
  url: config.url || '',
  params: config.params || null,
  data: config.data || null,
});

const CACHE_REVALIDATE_INTERVAL_MS = 30_000;
const QUICK_REVALIDATE_BUDGET_MS = 120;
const inFlightRevalidations = new Map<string, Promise<AxiosResponse<any> | null>>();
const lastRevalidatedAt = new Map<string, number>();

const isCacheableMethod = (config: AxiosRequestConfig): boolean =>
  ((config.method || 'GET').toUpperCase() === 'GET');

const delay = (ms: number) => new Promise<null>((resolve) => {
  setTimeout(() => resolve(null), ms);
});

const normalizeForComparison = (value: any): any => {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(normalizeForComparison);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return Object.keys(value)
    .sort()
    .reduce<Record<string, any>>((accumulator, key) => {
      const nextValue = (value as Record<string, any>)[key];
      if (nextValue !== undefined) {
        accumulator[key] = normalizeForComparison(nextValue);
      }
      return accumulator;
    }, {});
};

const hasDataChanged = (previous: unknown, next: unknown): boolean => {
  try {
    return JSON.stringify(normalizeForComparison(previous)) !== JSON.stringify(normalizeForComparison(next));
  } catch {
    // If serialization fails for any reason, prefer fresh data.
    return true;
  }
};

const notifyCacheUpdate = (cacheKey: string, data: unknown): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('seamless:cache-updated', {
    detail: { key: cacheKey, data },
  }));
};

const shouldRevalidate = (cacheKey: string): boolean => {
  const lastCheckedAt = lastRevalidatedAt.get(cacheKey) || 0;
  return Date.now() - lastCheckedAt >= CACHE_REVALIDATE_INTERVAL_MS;
};

const startRevalidation = <T>(
  cacheKey: string,
  config: AxiosRequestConfig,
  cachedData: T
): Promise<AxiosResponse<T> | null> => {
  const existing = inFlightRevalidations.get(cacheKey) as Promise<AxiosResponse<T> | null> | undefined;
  if (existing) return existing;

  const promise = (async () => {
    try {
      const freshResponse = await api.request<T>(config);
      lastRevalidatedAt.set(cacheKey, Date.now());

      if (hasDataChanged(cachedData, freshResponse.data)) {
        setBrowserCache(cacheKey, freshResponse.data);
        notifyCacheUpdate(cacheKey, freshResponse.data);
      }

      return freshResponse;
    } catch {
      // Preserve cached data on revalidation failures.
      return null;
    } finally {
      inFlightRevalidations.delete(cacheKey);
    }
  })();

  inFlightRevalidations.set(cacheKey, promise as Promise<AxiosResponse<any> | null>);
  return promise;
};

// ─── Request Interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const url = config.url || '';
  const isDashboard = url.startsWith('/dashboard');

  if (isDashboard) {
    // PROXY MODE: Route through WordPress
    const method = (config.method || 'GET').toUpperCase();
    const nonce = getAjaxNonce();
    let path = url;

    // Append query params to the internal path
    if (config.params && Object.keys(config.params).length > 0) {
      const queryParams = new URLSearchParams(config.params as any).toString();
      path += (path.includes('?') ? '&' : '?') + queryParams;
    }

    const params = new URLSearchParams();
    params.append('action', 'seamless_api_proxy');
    params.append('nonce', nonce);
    params.append('endpoint', path);
    params.append('method', method);

    if (config.data) {
      params.append('payload', typeof config.data === 'string' ? config.data : JSON.stringify(config.data));
    }

    // Rewrite request for admin-ajax.php
    config.baseURL = '';
    config.url = getAjaxUrl();
    config.method = 'POST';
    config.data = params;
    config.params = {};
    config.headers = {
      ...config.headers,
      'Content-Type': 'application/x-www-form-urlencoded',
    } as any;
    config.withCredentials = true; // For WordPress session
  } else {
    // DIRECT MODE: Hit AMS API directly (NO AUTH TOKEN on frontend)
    if (typeof config.headers.set === 'function') {
      config.headers.set('Accept', 'application/json');
    } else {
      (config.headers as any)['Accept'] = 'application/json';
    }
    config.withCredentials = false;
  }

  return config;
});

// ─── Response Interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    // Determine if this was a proxied call by checking if it hit the Ajax URL
    const isProxied = response.config.url === getAjaxUrl();

    if (isProxied) {
      const wpData = response.data;
      if (wpData && wpData.success === false) {
        console.error('[Seamless Proxy Error]', wpData.data?.message || wpData.data || 'Unknown error');
        return Promise.reject(wpData.data || wpData);
      }
      return { ...response, data: wpData.data || wpData };
    }

    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const requestWithCache = async <T>(
  config: AxiosRequestConfig,
  options?: { preferCache?: boolean }
): Promise<AxiosResponse<T>> => {
  const preferCache = options?.preferCache !== false;
  const cacheKey = buildApiCacheKey(config);
  const cacheable = isCacheableMethod(config);

  if (preferCache && cacheable) {
    const cachedData = getBrowserCache<T>(cacheKey);

    if (cachedData !== null) {
      if (shouldRevalidate(cacheKey)) {
        const revalidationPromise = startRevalidation(cacheKey, config, cachedData);
        const quickRevalidatedResponse = await Promise.race([
          revalidationPromise,
          delay(QUICK_REVALIDATE_BUDGET_MS),
        ]) as AxiosResponse<T> | null;

        if (quickRevalidatedResponse) {
          return quickRevalidatedResponse;
        }
      }

      return {
        data: cachedData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config as any,
      } as AxiosResponse<T>;
    }
  }

  const response = await api.request<T>(config);
  if (cacheable) {
    setBrowserCache(cacheKey, response.data);
    lastRevalidatedAt.set(cacheKey, Date.now());
  }
  return response;
};

export default api;
