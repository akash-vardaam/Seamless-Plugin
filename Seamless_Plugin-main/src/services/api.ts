import axios from "axios";

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

export default api;
