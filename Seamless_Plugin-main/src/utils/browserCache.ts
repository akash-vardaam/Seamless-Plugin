const CACHE_PREFIX = 'seamless_browser_cache_v1';

const memoryCache = new Map<string, string>();

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    if (!value || typeof value !== 'object') return false;
    return Object.getPrototypeOf(value) === Object.prototype;
};

const normalizeForCache = (value: unknown): unknown => {
    if (value instanceof Date) {
        return value.toISOString();
    }

    if (typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams) {
        return Array.from(value.entries()).sort(([a], [b]) => a.localeCompare(b));
    }

    if (Array.isArray(value)) {
        return value.map(normalizeForCache);
    }

    if (isPlainObject(value)) {
        return Object.keys(value)
            .sort()
            .reduce<Record<string, unknown>>((accumulator, key) => {
                const nextValue = value[key];

                if (nextValue !== undefined) {
                    accumulator[key] = normalizeForCache(nextValue);
                }

                return accumulator;
            }, {});
    }

    return value;
};

export const buildBrowserCacheKey = (namespace: string, value?: unknown): string => {
    const normalizedValue = normalizeForCache(value ?? null);
    return `${CACHE_PREFIX}:${namespace}:${JSON.stringify(normalizedValue)}`;
};

export const getBrowserCache = <T>(key: string): T | null => {
    try {
        const rawCached = memoryCache.get(key)
            ?? (typeof window !== 'undefined' ? window.localStorage.getItem(key) : null);

        if (!rawCached) return null;

        memoryCache.set(key, rawCached);
        return JSON.parse(rawCached) as T;
    } catch {
        memoryCache.delete(key);

        if (typeof window !== 'undefined') {
            try {
                window.localStorage.removeItem(key);
            } catch {
                // Ignore storage cleanup failures.
            }
        }

        return null;
    }
};

export const setBrowserCache = (key: string, value: unknown): void => {
    try {
        const serializedValue = JSON.stringify(value);
        memoryCache.set(key, serializedValue);

        if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, serializedValue);
        }
    } catch {
        // Ignore storage failures and continue with the live response.
    }
};

export const removeBrowserCache = (key: string): void => {
    memoryCache.delete(key);

    if (typeof window !== 'undefined') {
        try {
            window.localStorage.removeItem(key);
        } catch {
            // Ignore storage cleanup failures.
        }
    }
};
