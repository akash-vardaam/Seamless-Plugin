/**
 * API Response utility - Ensures consistent data structure handling
 */

export function ensureArray<T>(data: any): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object') {
    // Handle { data: [...] } structure
    if ('data' in data && Array.isArray(data.data)) {
      return data.data;
    }
    // If it's an object with results key
    if ('results' in data && Array.isArray(data.results)) {
      return data.results;
    }
  }

  // Return empty array if nothing matches
  return [];
}

export function ensureObject<T>(data: any): T {
  if (data && typeof data === 'object') {
    return data as T;
  }
  return {} as T;
}
