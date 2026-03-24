
import { useState, useEffect } from 'react';
import { fetchEventBySlug, fetchGroupEventBySlug } from '../services/eventService';
import type { Event } from '../types/event';

interface SingleEventState {
    event: Event | null;
    loading: boolean;
    error: string | null;
}

export const useSingleEvent = (slug: string, isGroupEvent: boolean = false) => {
    const [state, setState] = useState<SingleEventState>({
        event: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (!slug) return;

        const fetchEvent = async () => {
            setState(prev => ({ ...prev, loading: true, error: null }));
            try {
                let response;

                if (isGroupEvent) {
                    try {
                        response = await fetchGroupEventBySlug(slug);
                    } catch {
                        response = await fetchEventBySlug(slug);
                    }
                } else {
                    try {
                        response = await fetchEventBySlug(slug);
                    } catch {
                        response = await fetchGroupEventBySlug(slug);
                    }
                }

                // Check if data is wrapped in 'data'
                const eventData = response.data.data || response.data;

                setState({
                    event: eventData,
                    loading: false,
                    error: null,
                });
            } catch (err: any) {
                setState({
                    event: null,
                    loading: false,
                    error: err.message || 'Failed to fetch event',
                });
            }
        };

        fetchEvent();
    }, [slug, isGroupEvent]);

    return state;
};
