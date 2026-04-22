import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { fetchEvents, fetchGroupEvents } from '../services/eventService';
import type { Event, FilterState } from '../types/event';
import { buildBrowserCacheKey, getBrowserCache, setBrowserCache } from '../utils/browserCache';

function formatError(err: unknown): string {
    if (axios.isAxiosError(err)) {
        const details = err.response
            ? `Status: ${err.response.status} - ${JSON.stringify(err.response.data)}`
            : err.request ? 'No response received' : err.config?.url || '';
        return `${err.message} ${details ? `(${details})` : ''}`;
    }
    return err instanceof Error ? err.message : 'Unknown error';
}

// In-memory cache to avoid repeated sessionStorage access or API calls
const calendarCache = new Map<string, Event[]>();

export const useCalendarEvents = (
    currentDate: Date,
    filters: FilterState,
    enabled: boolean = true
) => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState<string | null>(null);

    // Helper to get start/end of month
    const getMonthRange = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        // Start: 1st of month
        const start = new Date(year, month, 1);
        // End: Last day of month
        const end = new Date(year, month + 1, 0); // 0th day of next month = last day of current

        // Format YYYY-MM-DD
        const formatDate = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        return {
            start_date: formatDate(start),
            end_date: formatDate(end)
        };
    };

    const buildParams = useCallback(() => {
        // High limit for calendar view to get "all" events
        const p: any = { per_page: 100 };

        // Apply category filters
        const cats = filters.categories.filter(Boolean).join(',');
        if (cats) p.category_ids = cats;

        // Apply tag filters
        const tagsStr = filters.tags.filter(Boolean).join(',');
        if (tagsStr) p.tag_ids = tagsStr;

        if (filters.search) p.search = filters.search;

        // Note: We intentionally ignore filters.status ('upcoming', 'past') 
        // because Calendar view should show events for the specific month regardless of global status preference.
        // Unless user explicitly wants "Past events in March 2026", but usually Calendar overrides "Upcoming/Past".

        // Add date range
        const { start_date, end_date } = getMonthRange(currentDate);
        p.start_date = start_date;
        p.end_date = end_date;

        return p;
    }, [currentDate, filters.categories, filters.tags, filters.search]);

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            if (!enabled) return;

            const params = buildParams();
            const cacheKey = buildBrowserCacheKey('calendar-events', params);
            const cachedEvents = calendarCache.get(cacheKey) || getBrowserCache<Event[]>(cacheKey);

            if (cachedEvents) {
                calendarCache.set(cacheKey, cachedEvents);
                setEvents(cachedEvents);
                setLoading(false);
                setError(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const [response, groupResponse] = await Promise.all([
                    fetchEvents(params),
                    fetchGroupEvents({ per_page: 100 }).catch(e => { console.error("Calendar fetch group error:", e); return null; })
                ]);

                if (cancelled) return;

                const rawEvents = (response.data.data?.events || []) as Event[];
                const groupEventsRaw = groupResponse?.data?.data?.group_events || [];

                const hiddenSubEvents = new Set<string>();
                const groupEventBySubId: Record<string, Event> = {};

                groupEventsRaw.forEach((ge: any) => {
                    const mappedGe = { ...ge, start_date: ge.event_date_range?.start || ge.formatted_start_date || '', end_date: ge.event_date_range?.end || ge.formatted_end_date || '', is_group_event: true } as Event;
                    (ge.associated_events || []).forEach((sub: any) => {
                        hiddenSubEvents.add(sub.id);
                        groupEventBySubId[sub.id] = mappedGe;
                    });
                });

                const finalEvents: Event[] = [];
                const seenGroups = new Set<string>();

                for (const e of rawEvents) {
                    if (hiddenSubEvents.has(e.id)) {
                        const ge = groupEventBySubId[e.id];
                        if (ge && !seenGroups.has(ge.id)) {
                            finalEvents.push(ge);
                            seenGroups.add(ge.id);
                        }
                    } else {
                        finalEvents.push(e);
                    }
                }

                // Save to caches and update UI with fresh server data
                calendarCache.set(cacheKey, finalEvents);
                setEvents(finalEvents);
                setLoading(false);

                setBrowserCache(cacheKey, finalEvents);

            } catch (err) {
                if (!cancelled) {
                    setError(formatError(err));
                    console.error('Calendar fetch error:', err);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => { cancelled = true; };
    }, [buildParams, enabled]);

    return { events, loading, error };
};
