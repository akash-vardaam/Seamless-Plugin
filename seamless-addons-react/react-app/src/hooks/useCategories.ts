import { useState, useEffect } from 'react';
import { fetchCategories } from '../services/eventService';
import type { Category } from '../types/event';

interface ApiCategory {
  id: string;
  label: string;
  slug: string;
  children?: ApiCategory[];
}

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and process categories from the API
 * Handles multiple response formats from the AMS API
 */
export const useCategories = (): UseCategoriesReturn => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const response = await fetchCategories();

        console.log('useCategories - Raw response:', response);

        let categoriesData: ApiCategory[] = [];

        // Handle multiple response structures:
        // 1. { success: true, data: [...] }
        // 2. { data: [...] }
        // 3. [...]
        if (response && typeof response === 'object') {
          if (Array.isArray(response)) {
            categoriesData = response;
          } else if ('data' in response && Array.isArray(response.data)) {
            categoriesData = response.data;
          }
        }

        // Convert ApiCategory to Category format
        const processedCategories: Category[] = categoriesData.map((cat: ApiCategory) => ({
          id: cat.id,
          name: cat.label || cat.id,
          slug: cat.slug,
          color: null,
        }));

        setCategories(processedCategories);
        console.log('useCategories - Processed categories:', processedCategories);
      } catch (err) {
        console.error('useCategories - Error fetching categories:', err);
        setError(err instanceof Error ? err.message : 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  return {
    categories,
    loading,
    error,
  };
};
