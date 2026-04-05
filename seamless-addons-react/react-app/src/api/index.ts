import { config } from '../config';

// ─── Generic WP AJAX helper ───────────────────────────────────────────────────

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

// ─── Secure API proxy (only dashboard/ endpoints) ─────────────────────────────

export async function apiProxy<T = unknown>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  payload?: Record<string, unknown>
): Promise<T> {
  return wpAjax<T>({
    action: 'seamless_react_api_proxy',
    data: {
      endpoint,
      method,
      ...(payload ? { payload: JSON.stringify(payload) } : {}),
    },
  });
}

// ─── Public API (read-only, no bearer token needed) ──────────────────────────

async function publicGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  return wpAjax<T>({
    action: 'seamless_react_public_api_proxy',
    nonce: config.ajaxNonce, // Though not needed for auth, standard wpAjax passes it
    data: { endpoint: `${path}${query}` },
  });
}

// ─── Events ──────────────────────────────────────────────────────────────────

export interface Event {
  id: string;
  uuid: string;
  title: string;
  slug: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  category?: string;
  featured_image?: string;
  price?: string | number;
  is_free?: boolean;
  registration_url?: string;
  registration_closes?: string;
  capacity?: number;
  registered_count?: number;
  tags?: string[];
  type?: string;
}

export interface PaginatedEvents {
  data: Event[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const eventsApi = {
  list: (params?: Record<string, string>) =>
    publicGet<PaginatedEvents>('events', params),

  single: (slug: string) =>
    publicGet<{ data: Event }>(`events/${encodeURIComponent(slug)}`),

  groupEvents: (params?: Record<string, string>) =>
    publicGet<PaginatedEvents>('group-events', params),
};

// ─── Memberships (public listing) ─────────────────────────────────────────────

export interface MembershipPlan {
  id: string;
  label: string;
  price: string | number;
  interval?: string;
  description?: string;
  features?: string[];
  is_free?: boolean;
}

export const membershipsApi = {
  list: () => publicGet<{ data: MembershipPlan[] }>('membership-plans'),
};

// ─── Courses (public listing) ─────────────────────────────────────────────────

export interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  instructor?: string;
  duration?: string;
  level?: string;
  enrolled_count?: number;
  is_free?: boolean;
  price?: string | number;
}

export const coursesApi = {
  list: (params?: Record<string, string>) =>
    publicGet<{ data: Course[] }>('courses', params),
};

// ─── Dashboard (authenticated via AJAX proxy) ─────────────────────────────────

export const dashboardApi = {
  getProfile: () =>
    wpAjax({ action: 'seamless_react_get_dashboard_profile' }),

  getMemberships: () =>
    wpAjax({ action: 'seamless_react_get_dashboard_memberships' }),

  getCourses: () =>
    wpAjax({ action: 'seamless_react_get_dashboard_courses' }),

  getOrders: () =>
    wpAjax({ action: 'seamless_react_get_dashboard_orders' }),

  getOrganization: () =>
    wpAjax({ action: 'seamless_react_get_dashboard_organization' }),

  updateProfile: (email: string, profileData: Record<string, string>) =>
    wpAjax({
      action: 'seamless_react_update_profile',
      nonce: config.ajaxNonce,
      data: { email, profile_data: profileData },
    }),

  upgradeMembership: (newPlanId: string, membershipId: string, email: string) =>
    wpAjax({
      action: 'seamless_react_upgrade_membership',
      nonce: config.ajaxNonce,
      data: { new_plan_id: newPlanId, membership_id: membershipId, email },
    }),

  downgradeMembership: (newPlanId: string, membershipId: string, email: string) =>
    wpAjax({
      action: 'seamless_react_downgrade_membership',
      nonce: config.ajaxNonce,
      data: { new_plan_id: newPlanId, membership_id: membershipId, email },
    }),

  cancelMembership: (membershipId: string, email: string) =>
    wpAjax({
      action: 'seamless_react_cancel_membership',
      nonce: config.ajaxNonce,
      data: { membership_id: membershipId, email },
    }),

  renewMembership: (planId: string, email: string) =>
    wpAjax({
      action: 'seamless_react_renew_membership',
      nonce: config.ajaxNonce,
      data: { plan_id: planId, email },
    }),

  cancelScheduledChange: (membershipId: string, email: string) =>
    wpAjax({
      action: 'seamless_react_cancel_scheduled_change',
      nonce: config.ajaxNonce,
      data: { membership_id: membershipId, email },
    }),
};

export { wpAjax };
