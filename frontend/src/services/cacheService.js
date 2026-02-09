// Cache service for managing API call optimizations
class CacheService {
  constructor() {
    this.cache = new Map();
  }

  // Get data from cache if valid, otherwise execute the function and cache the result
  async getOrFetch(key, fetchFunction, ttl = 2000) {
    const now = Date.now();
    const cached = this.cache.get(key);
    
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.data;
    }
    
    try {
      const data = await fetchFunction();
      this.cache.set(key, {
        data,
        timestamp: now
      });
      return data;
    } catch (error) {
      // If there's cached data available, use it even if expired
      if (cached) {
        console.warn(`Using expired cache for ${key} due to fetch error:`, error);
        return cached.data;
      }
      throw error;
    }
  }

  // Clear specific cache entry
  invalidate(key) {
    this.cache.delete(key);
  }

  // Clear all cache
  clearAll() {
    this.cache.clear();
  }

  // Clear cache entries matching a pattern
  invalidatePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Specific cache keys for common API calls
export const CACHE_KEYS = {
  BEKLEYEN_IS_EMIRLERI: 'bekleyen_is_emirleri',
  TEZGAHLAR: 'tezgahlar',
  PARCALAR: 'parcalar',
};
