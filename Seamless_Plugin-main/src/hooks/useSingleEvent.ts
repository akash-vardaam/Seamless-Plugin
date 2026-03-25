
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
        const normalizedSlug = slug.trim();
        if (!normalizedSlug) {
            setState({
                event: null,
                loading: false,
                error: 'Missing event slug',
            });
            return;
        }

        let isActive = true;

        const fetchEvent = async () => {
            setState(prev => ({ ...prev, loading: true, error: null }));
            try {
                let response;

                if (isGroupEvent) {
                    try {
                        response = await fetchGroupEventBySlug(normalizedSlug);
                    } catch {
                        response = await fetchEventBySlug(normalizedSlug);
                    }
                } else {
                    try {
                        response = await fetchEventBySlug(normalizedSlug);
                    } catch {
                        response = await fetchGroupEventBySlug(normalizedSlug);
                    }
                }

                // Check if data is wrapped in 'data'
                const eventData = response.data.data || response.data;

                if (isActive) {
                    setState({
                        event: eventData,
                        loading: false,
                        error: null,
                    });
                }
            } catch (err: any) {
                if (isActive) {
                    setState({
                        event: null,
                        loading: false,
                        error: err.message || 'Failed to fetch event',
                    });
                }
            }
        };

        fetchEvent();

        return () => {
            isActive = false;
        };
    }, [slug, isGroupEvent]);

    return state;
};
