import { useEffect, useMemo, useState } from 'react';
import { fetchTags as fetchTagsApi } from '../services/eventService';
import type { Tag } from '../types/event';

interface ApiTag {
    id: string;
    name?: string;
    label?: string;
    slug: string;
}

interface UseTagsReturn {
    tags: Tag[];
    loading: boolean;
    error: string | null;
}

export const useTags = (): UseTagsReturn => {
    const [rawTags, setRawTags] = useState<ApiTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadTags = async () => {
            try {
                setLoading(true);
                const response = await fetchTagsApi();

                let fetchedData: ApiTag[] = [];

                if (response.data && Array.isArray(response.data.data)) {
                    fetchedData = response.data.data;
                } else if (Array.isArray(response.data)) {
                    fetchedData = response.data;
                }

                setRawTags(fetchedData);
            } catch (err) {
                console.error('Error fetching tags:', err);
                setError('Failed to load tags');
            } finally {
                setLoading(false);
            }
        };

        loadTags();
    }, []);

    const tags = useMemo(() => {
        const normalizeLabel = (value: string | undefined): string => {
            const trimmedValue = String(value || '').trim();
            return trimmedValue === '-' ? '' : trimmedValue;
        };

        const seenIds = new Set<string>();

        return rawTags
            .filter((tag) => {
                if (!tag?.id || seenIds.has(tag.id)) {
                    return false;
                }

                seenIds.add(tag.id);
                return true;
            })
            .map((tag) => {
                const name = normalizeLabel(tag.label || tag.name || tag.slug);

                return {
                    id: tag.id,
                    name,
                    slug: tag.slug,
                };
            })
            .filter((tag) => tag.name)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [rawTags]);

    return {
        tags,
        loading,
        error,
    };
};
