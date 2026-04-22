import { useState, useEffect, useMemo } from 'react';
import { fetchCategories as fetchCategoriesApi } from '../services/eventService';
import type { Category } from '../types/event';

interface ApiCategory {
    id: string;
    label: string;
    slug: string;
    children: ApiCategory[];
}

interface UseCategoriesReturn {
    categories: Category[];
    loading: boolean;
    error: string | null;
}

export const useCategories = (): UseCategoriesReturn => {
    const [rawCategories, setRawCategories] = useState<ApiCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                // Fetch categories from the new endpoint
                const response = await fetchCategoriesApi();

                console.log('Categories API Response:', response.data);

                let fetchedData: ApiCategory[] = [];

                // Handle response structure { success: true, data: [...] }
                if (response.data && Array.isArray(response.data.data)) {
                    fetchedData = response.data.data;
                } else if (Array.isArray(response.data)) {
                    fetchedData = response.data;
                }

                setRawCategories(fetchedData);
            } catch (err) {
                console.error('Error fetching categories:', err);
                setError('Failed to load categories');
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const categories = useMemo(() => {
        const normalizeLabel = (value: string | undefined): string => {
            const trimmedValue = String(value || '').trim();
            return trimmedValue === '-' ? '' : trimmedValue;
        };

        const flattenedCategories: Category[] = [];
        const seenIds = new Set<string>();

        const walk = (nodes: ApiCategory[], parentId: string | null = null): string[] => {
            const collectedIds: string[] = [];

            nodes.forEach((node) => {
                if (!node?.id || seenIds.has(node.id)) return;

                seenIds.add(node.id);

                const childMatchIds = Array.isArray(node.children) && node.children.length > 0
                    ? walk(node.children, node.id)
                    : [];

                const mappedCategory: Category = {
                    id: node.id,
                    name: normalizeLabel(node.label),
                    slug: node.slug,
                    color: null,
                    parentId,
                    matchIds: [node.id, ...childMatchIds]
                };

                if (!mappedCategory.name) {
                    return;
                }

                flattenedCategories.push(mappedCategory);
                collectedIds.push(node.id, ...childMatchIds);
            });

            return collectedIds;
        };

        walk(rawCategories);
        return flattenedCategories;
    }, [rawCategories]);

    return {
        categories,
        loading,
        error
    };
};
