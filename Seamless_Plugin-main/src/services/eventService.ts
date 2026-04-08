import api, { requestWithCache } from './api';

export const fetchCategories = async () => {
    return await requestWithCache<any>({ method: 'GET', url: '/categories' });
};

export const fetchEvents = async (params?: Record<string, any>) => {
    return await requestWithCache<any>({ method: 'GET', url: '/events', params });
};

export const fetchGroupEvents = async (params?: Record<string, any>) => {
    return await requestWithCache<any>({ method: 'GET', url: '/group-events', params });
};

export const fetchEventBySlug = async (slug: string) => {
    return await api.get<any>(`/events/${slug}`);
};

export const fetchGroupEventBySlug = async (slug: string) => {
    return await api.get<any>(`/group-events/${slug}`);
};
