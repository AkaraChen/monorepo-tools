type CacheKey = string;

interface CacheEntry<T> {
    value: T;
    timestamp: number;
}

export class LRUCache<T> {
    private cache = new Map<CacheKey, CacheEntry<T>>();
    private maxSize: number;
    private ttl: number;

    constructor(maxSize = 100, ttl = 5000) {
        this.maxSize = maxSize;
        this.ttl = ttl;
    }

    get(key: CacheKey): T | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        // Check TTL
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return undefined;
        }

        // LRU: move to end
        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry.value;
    }

    set(key: CacheKey, value: T): void {
        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, { value, timestamp: Date.now() });
    }

    has(key: CacheKey): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }

    clear(): void {
        this.cache.clear();
    }

    get size(): number {
        return this.cache.size;
    }
}

// Global cache instances
export const globResultCache = new LRUCache<string[]>(50, 10000);
export const packageJsonCache = new LRUCache<Record<string, unknown>>(
    200,
    5000,
);
export const configCache = new LRUCache<{ pm: string; globs: string[] }>(
    20,
    10000,
);

export function clearAllCaches(): void {
    globResultCache.clear();
    packageJsonCache.clear();
    configCache.clear();
}
