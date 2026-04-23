import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Event, FilterState } from '../types/event';

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  status: '',
  categories: [],
  tags: [],
  year: '',
};

interface UseFilterStateReturn {
  filters: FilterState;
  updateFilter: (key: keyof FilterState, value: string | string[]) => void;
  resetFilters: () => void;
}

export const useFilterState = (): UseFilterStateReturn => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = searchParams.get('status');
  const rawCategories = searchParams.get('categories') || '';
  const rawTags = searchParams.get('tags') || '';
  const normalizedStatus =
    rawStatus === 'upcoming' || rawStatus === 'current' || rawStatus === 'past'
      ? rawStatus
      : DEFAULT_FILTERS.status;

  // Create filters object from searchParams, falling back to defaults
  const filters: FilterState = useMemo(() => ({
    search: searchParams.get('search') || DEFAULT_FILTERS.search,
    status: normalizedStatus,
    categories: rawCategories
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    tags: rawTags
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    year: searchParams.get('year') || DEFAULT_FILTERS.year,
  }), [searchParams, normalizedStatus, rawCategories, rawTags]);

  const updateFilter = (key: keyof FilterState, value: string | string[]) => {
    console.log(`Updating filter ${key} to ${value}`);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);

      if (key === 'categories' || key === 'tags') {
        const serializedCategories = Array.isArray(value)
          ? value.join(',')
          : value;
        if (serializedCategories) {
          newParams.set(key, serializedCategories);
        } else {
          newParams.delete(key);
        }
      } else if (typeof value === 'string' && value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
      // Reset page to 1 when filters change (common pattern)
      newParams.set('page', '1');

      // Sync to real browser URL — MemoryRouter never touches window.location
      try {
        const realParams = new URLSearchParams(window.location.search);
        newParams.forEach((val, k) => {
          if (k !== 'seamless_event') realParams.set(k, val);
        });
        // Clear any filter keys that were removed
        Array.from(realParams.keys()).forEach(k => {
          if (!newParams.has(k) && k !== 'seamless_event' && k !== 'type') realParams.delete(k);
        });
        const qs = realParams.toString();
        history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
      } catch { /* ignore */ }

      return newParams;
    });
  };

  const resetFilters = () => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      // Remove all filter keys
      Object.keys(DEFAULT_FILTERS).forEach(key => {
        newParams.delete(key);
      });
      newParams.set('page', '1');

      // Sync cleared filters to real browser URL
      try {
        const realParams = new URLSearchParams(window.location.search);
        Object.keys(DEFAULT_FILTERS).forEach(k => realParams.delete(k));
        realParams.set('page', '1');
        const qs = realParams.toString();
        history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
      } catch { /* ignore */ }

      return newParams;
    });
  };

  return { filters, updateFilter, resetFilters };
};

export const useClientFilters = (
  events: Event[],
  filters: FilterState,
): Event[] => {
  return useMemo(() => {
    return events.filter((event) => {
      const now = new Date();

      // Status filter (as fallback for edge cases)
      if (filters.status) {
        try {
          const startDate = new Date(event.start_date);
          const endDate = new Date(event.end_date);

          if (filters.status === 'upcoming' && startDate <= now) return false;
          if (filters.status === 'current' && (now < startDate || now > endDate)) return false;
          if (filters.status === 'past' && endDate >= now) return false;
        } catch {
          // If date parsing fails, don't filter on status
        }
      }

      // Year filter - only one that requires client-side processing
      // (API filters by date range, not by year directly)
      if (filters.year) {
        try {
          const eventYear = new Date(event.start_date).getFullYear().toString();
          if (eventYear !== filters.year) return false;
        } catch {
          // If date parsing fails, don't filter
          return false;
        }
      }

      // NOTE: Categories, Tags, and Search filters are already handled by the API
      // Applying them again client-side causes issues when event.categories or event.tags
      // are not populated in the response. The server has already filtered the results,
      // so we don't need to filter them again here.

      return true;
    });
  }, [events, filters]);
};

// We will replace usage in ItemsPage
export const useFilters = (events: Event[]) => {
  const { filters, updateFilter, resetFilters } = useFilterState();
  const filteredItems = useClientFilters(events, filters);
  return { filters, updateFilter, resetFilters, filteredItems, setFilters: () => { } };
};
