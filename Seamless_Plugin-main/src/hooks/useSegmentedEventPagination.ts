import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { fetchEvents, fetchGroupEvents } from '../services/eventService';
import type { Event, FilterState } from '../types/event';
import { buildBrowserCacheKey, getBrowserCache, setBrowserCache } from '../utils/browserCache';

// ─── Error formatter ────────────────────────────────────────────
function formatError(err: unknown): string {
    if (axios.isAxiosError(err)) {
        const details = err.response
            ? `Status: ${err.response.status} - ${JSON.stringify(err.response.data)}`
            : err.request ? 'No response received' : err.config?.url || '';
        return `${err.message} ${details ? `(${details})` : ''}`;
    }
    return err instanceof Error ? err.message : 'Unknown error';
}

// ─── Constants ──────────────────────────────────────────────────
const API_PAGE_SIZE = 24; // Fixed size per API call
const UI_PAGE_SIZE = 8;   // Exact size for the UI grid

// ─── Types ──────────────────────────────────────────────────────
interface SegmentedReturn {
    events: Event[];
    loading: boolean;
    error: string | null;
    totalPages: number;
    totalApiEvents: number;
}

// ─── Hook ───────────────────────────────────────────────────────
export const useSegmentedEventPagination = (
    filters?: FilterState,
    uiPage: number = 1
): SegmentedReturn => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(1);
    const [totalApiEvents, setTotalApiEvents] = useState(0);

    // Accumulators to hold data across fetches
    const rawEventsPool = useRef<Event[]>([]);
    const groupEventsPool = useRef<any[]>([]);
    const apiPageRef = useRef(1);
    const mode = filters?.status;

    // Use category_ids instead of category, and include status/search
    const buildParams = useCallback(() => {
        const p: any = { per_page: API_PAGE_SIZE };
        if (filters) {
            if (filters.status) p.status = filters.status;

            const cats = [filters.audience, filters.focus, filters.localChapter]
                .filter(Boolean).join(',');
            if (cats) p.category_ids = cats;

            if (filters.search) p.search = filters.search;
        }
        return p;
    }, [filters?.status, filters?.audience, filters?.focus, filters?.localChapter, filters?.search]);

    // Reset accumulators when filters change
    useEffect(() => {
        rawEventsPool.current = [];
        groupEventsPool.current = [];
        apiPageRef.current = 1;
    }, [buildParams]);

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            setError(null);
            const params = buildParams();
            const cacheKey = buildBrowserCacheKey('events-ui-page', { params, uiPage });

            if (rawEventsPool.current.length === 0) {
                const cached = getBrowserCache<{
                    events: Event[];
                    totalPages: number;
                    totalApiEvents: number;
                }>(cacheKey);

                if (cached) {
                    setEvents(cached.events);
                    setTotalPages(cached.totalPages);
                    setTotalApiEvents(cached.totalApiEvents);
                    setLoading(false);
                    return;
                }
            }

            setLoading(true);

            try {
                // Consolidation logic wrapper
                const getConsolidated = (raw: Event[], groupRaw: any[]) => {
                    const hiddenSubEvents = new Set<string>();
                    const groupEventBySubId: Record<string, Event> = {};

                    groupRaw.forEach((ge: any) => {
                        const mappedGe = { ...ge, start_date: ge.event_date_range?.start || ge.formatted_start_date || '', end_date: ge.event_date_range?.end || ge.formatted_end_date || '', is_group_event: true } as Event;
                        (ge.associated_events || []).forEach((sub: any) => {
                            hiddenSubEvents.add(sub.id);
                            groupEventBySubId[sub.id] = mappedGe;
                        });
                    });

                    const consolidated: Event[] = [];
                    const seenGroups = new Set<string>();

                    for (const e of raw) {
                        if (hiddenSubEvents.has(e.id)) {
                            const ge = groupEventBySubId[e.id];
                            if (ge && !seenGroups.has(ge.id)) {
                                consolidated.push(ge);
                                seenGroups.add(ge.id);
                            }
                        } else {
                            consolidated.push(e);
                        }
                    }
                    if (mode === 'upcoming') {
                        consolidated.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
                    }
                    return consolidated;
                };

                // Fetch group events (needed for consolidation) - ONLY IF NOT ALREADY FETCHED
                if (groupEventsPool.current.length === 0) {
                    const groupResponse = await fetchGroupEvents({ per_page: 100 }).catch(e => { console.error("Filter fetch group error:", e); return null; });
                    groupEventsPool.current = groupResponse?.data?.data?.group_events || [];
                }
                const groupEventsRaw = groupEventsPool.current;

                // Re-calculate consolidated list from current pool
                let currentConsolidated = getConsolidated(rawEventsPool.current, groupEventsRaw);
                let nextTotalApiEvents = totalApiEvents;
                let nextTotalPages = totalPages;

                // If we don't have enough to fill the current page, fetch more until we do
                const targetCount = uiPage * UI_PAGE_SIZE;

                while (currentConsolidated.length < targetCount && !cancelled) {
                    const response = await fetchEvents({ ...params, page: apiPageRef.current });
                    const newRaw = (response.data.data?.events || []) as Event[];
                    const meta = response.data.data?.pagination;

                    if (newRaw.length === 0) break; // No more data available

                    rawEventsPool.current = [...rawEventsPool.current, ...newRaw];
                    apiPageRef.current += 1;

                    // Update totals
                    if (meta?.total) {
                        nextTotalApiEvents = meta.total;
                        nextTotalPages = Math.ceil(meta.total / UI_PAGE_SIZE) || 1;
                        setTotalApiEvents(nextTotalApiEvents);
                        setTotalPages(nextTotalPages);
                    }

                    currentConsolidated = getConsolidated(rawEventsPool.current, groupEventsRaw);

                    // If the API returned fewer than requested items, it's the end of the collection
                    if (newRaw.length < API_PAGE_SIZE) break;
                }

                if (cancelled) return;

                // Slice the consolidated list for the specific UI page
                const startIndex = (uiPage - 1) * UI_PAGE_SIZE;
                const paginatedEvents = currentConsolidated.slice(startIndex, startIndex + UI_PAGE_SIZE);

                setEvents(paginatedEvents);
                setLoading(false);

                setBrowserCache(cacheKey, {
                    events: paginatedEvents,
                    totalPages: nextTotalPages,
                    totalApiEvents: nextTotalApiEvents
                });

            } catch (err) {
                if (!cancelled) {
                    setError(formatError(err));
                    console.error("Fetch Data Error:", err);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchData();
        return () => { cancelled = true; };
    }, [buildParams, mode, uiPage]);

    return { events, loading, error, totalPages, totalApiEvents };
};
