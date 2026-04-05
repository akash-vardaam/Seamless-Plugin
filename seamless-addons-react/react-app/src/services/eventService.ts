import { config } from '../config';

/**
 * Event Service - Handles all event-related API calls
 * Routes through WP AJAX for public endpoints to ensure proper CORS handling
 */

// ─── Generic WP AJAX helper ─────────────────────────────────────────────────

interface AjaxOptions {
  action: string;
  nonce?: string;
  data?: Record<string, unknown>;
}

async function wpAjax<T = unknown>(opts: AjaxOptions): Promise<T> {
  const formData = new FormData();
  formData.append('action', opts.action);
  formData.append('nonce', opts.nonce ?? config.ajaxNonce);

  const data = opts.data ?? {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object' && value !== null) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  }

  const res = await fetch(config.ajaxUrl, {
    method: 'POST',
    credentials: 'same-origin',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const json: { success: boolean; data: T } = await res.json();
  if (!json.success) {
    const msg = (json.data as { message?: string })?.message ?? 'Request failed';
    throw new Error(msg);
  }

  return json.data;
}

// ─── Public API calls ───────────────────────────────────────────────────────

async function publicGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  const response = await wpAjax<any>({
    action: 'seamless_react_public_api_proxy',
    data: { endpoint: `${path}${query}` },
  });

  // Handle different response structures from the AMS API
  // Could be: { data: [...] } or directly [...]
  if (response && typeof response === 'object') {
    if ('data' in response && Array.isArray(response.data)) {
      return response.data as T;
    } else if (Array.isArray(response)) {
      return response as T;
    }
  }

  return response as T;
}

// ─── Exported API calls ─────────────────────────────────────────────────────

export const fetchCategories = async () => {
  try {
    const response = await wpAjax<any>({
      action: 'seamless_react_public_api_proxy',
      data: { endpoint: '/categories' },
    });

    // Log for debugging
    console.log('Categories API Response:', response);

    // Ensure we always return an array
    if (Array.isArray(response)) {
      return { data: response };
    } else if (response && typeof response === 'object' && 'data' in response) {
      return response;
    }

    return { data: [] };
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const fetchEvents = async (params?: Record<string, any>) => {
  return publicGet<any>('events', params as Record<string, string>);
};

export const fetchGroupEvents = async (params?: Record<string, any>) => {
  return publicGet<any>('group-events', params as Record<string, string>);
};

export const fetchEventBySlug = async (slug: string) => {
  return publicGet<any>(`events/${slug}`);
};

export const fetchGroupEventBySlug = async (slug: string) => {
  return publicGet<any>(`group-events/${slug}`);
};

export const fetchMembershipPlans = async () => {
  return publicGet<any>('membership-plans');
};

export const fetchCourses = async (params?: Record<string, any>) => {
  return publicGet<any>('courses', params as Record<string, string>);
};

export const fetchCourseBySlug = async (slug: string) => {
  return publicGet<any>(`courses/${slug}`);
};
