// Image Caching Service
// Provides intelligent caching strategies for images

import { UploadResult } from './image-service';

export interface CacheConfig {
  strategy: 'memory' | 'localStorage' | 'indexedDB' | 'redis' | 'cdn';
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size in MB
  compression: boolean;
  encryption: boolean;
}

export interface CacheEntry {
  key: string;
  data: string | ArrayBuffer;
  metadata: {
    size: number;
    type: string;
    lastAccessed: number;
    accessCount: number;
    createdAt: number;
    expiresAt: number;
  };
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  averageAccessTime: number;
}

export interface ImageCachingService {
  // Basic cache operations
  set(key: string, data: string | ArrayBuffer, metadata?: Partial<CacheEntry['metadata']>): Promise<void>;
  get(key: string): Promise<CacheEntry | null>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;

  // Batch operations
  setMultiple(entries: Array<{ key: string; data: string | ArrayBuffer; metadata?: any }>): Promise<void>;
  getMultiple(keys: string[]): Promise<(CacheEntry | null)[]>;

  // Cache management
  getStats(): Promise<CacheStats>;
  cleanup(): Promise<number>; // Returns number of entries cleaned up
  optimize(): Promise<void>;

  // Image-specific operations
  cacheImage(imageUrl: string, imageData: ArrayBuffer, options?: { quality?: number; format?: string }): Promise<string>;
  getCachedImage(imageUrl: string): Promise<ArrayBuffer | null>;
  invalidateImage(imageUrl: string): Promise<boolean>;

  // CDN integration
  getCDNUrl(imageId: string, transformations?: Record<string, any>): string;
  prefetchImages(imageUrls: string[]): Promise<void>;
  warmCache(imageUrls: string[]): Promise<void>;
}

class ImageCacheManager implements ImageCachingService {
  private cache: Map<string, CacheEntry> = new Map();
  private accessLog: Array<{ key: string; timestamp: number; hit: boolean }> = [];
  private config: CacheConfig;
  private stats: CacheStats = {
    totalEntries: 0,
    totalSize: 0,
    hitRate: 0,
    missRate: 0,
    evictions: 0,
    averageAccessTime: 0
  };

  constructor(config: CacheConfig) {
    this.config = config;
    this.initializeCache();
  }

  async set(key: string, data: string | ArrayBuffer, metadata?: Partial<CacheEntry['metadata']>): Promise<void> {
    try {
      const now = Date.now();
      const dataSize = typeof data === 'string' ? data.length : data.byteLength;

      // Check if adding this entry would exceed max size
      if (this.stats.totalSize + dataSize > this.config.maxSize * 1024 * 1024) {
        await this.evictEntries(dataSize);
      }

      const entry: CacheEntry = {
        key,
        data,
        metadata: {
          size: dataSize,
          type: typeof data === 'string' ? 'text' : 'binary',
          lastAccessed: now,
          accessCount: 0,
          createdAt: now,
          expiresAt: now + this.config.ttl,
          ...metadata
        }
      };

      this.cache.set(key, entry);
      this.stats.totalEntries++;
      this.stats.totalSize += dataSize;

      // Persist to storage based on strategy
      await this.persistToStorage(key, entry);
    } catch (error) {
      console.error('Error setting cache entry:', error);
      throw error;
    }
  }

  async get(key: string): Promise<CacheEntry | null> {
    try {
      const startTime = Date.now();

      // Check memory cache first
      let entry = this.cache.get(key);

      if (!entry) {
        // Try persistent storage
        const storedEntry = await this.getFromStorage(key);
        if (storedEntry) {
          entry = storedEntry;
          this.cache.set(key, entry);
        }
      }

      if (entry) {
        // Check if expired
        if (Date.now() > entry.metadata.expiresAt) {
          await this.delete(key);
          return null;
        }

        // Update access metadata
        entry.metadata.lastAccessed = Date.now();
        entry.metadata.accessCount++;

        this.logAccess(key, true, Date.now() - startTime);
        return entry;
      }

      this.logAccess(key, false, Date.now() - startTime);
      return null;
    } catch (error) {
      console.error('Error getting cache entry:', error);
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      this.cache.delete(key);
      await this.deleteFromStorage(key);

      // Update stats
      const entry = this.cache.get(key);
      if (entry) {
        this.stats.totalEntries--;
        this.stats.totalSize -= entry.metadata.size;
      }

      return true;
    } catch (error) {
      console.error('Error deleting cache entry:', error);
      return false;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const entry = this.cache.get(key);
      if (entry && Date.now() <= entry.metadata.expiresAt) {
        return true;
      }

      // Check persistent storage
      return await this.hasInStorage(key);
    } catch (error) {
      console.error('Error checking cache entry:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache.clear();
      await this.clearStorage();
      this.resetStats();
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  async setMultiple(entries: Array<{ key: string; data: string | ArrayBuffer; metadata?: any }>): Promise<void> {
    try {
      for (const entry of entries) {
        await this.set(entry.key, entry.data, entry.metadata);
      }
    } catch (error) {
      console.error('Error setting multiple cache entries:', error);
      throw error;
    }
  }

  async getMultiple(keys: string[]): Promise<(CacheEntry | null)[]> {
    try {
      const results = await Promise.all(keys.map(key => this.get(key)));
      return results;
    } catch (error) {
      console.error('Error getting multiple cache entries:', error);
      return keys.map(() => null);
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      // Calculate hit/miss rates
      const totalAccesses = this.accessLog.length;
      const hits = this.accessLog.filter(log => log.hit).length;
      const misses = totalAccesses - hits;

      this.stats.hitRate = totalAccesses > 0 ? hits / totalAccesses : 0;
      this.stats.missRate = totalAccesses > 0 ? misses / totalAccesses : 0;

      // Calculate average access time
      if (this.accessLog.length > 0) {
        const totalTime = this.accessLog.reduce((sum, log) => sum + log.timestamp, 0);
        this.stats.averageAccessTime = totalTime / this.accessLog.length;
      }

      return { ...this.stats };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return this.stats;
    }
  }

  async cleanup(): Promise<number> {
    try {
      const now = Date.now();
      let cleanedCount = 0;

      // Clean expired entries from memory cache
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.metadata.expiresAt) {
          this.cache.delete(key);
          this.stats.totalEntries--;
          this.stats.totalSize -= entry.metadata.size;
          cleanedCount++;
        }
      }

      // Clean persistent storage
      const storageCleanedCount = await this.cleanupStorage();

      return cleanedCount + storageCleanedCount;
    } catch (error) {
      console.error('Error cleaning up cache:', error);
      return 0;
    }
  }

  async optimize(): Promise<void> {
    try {
      // Implement LRU eviction for memory cache
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].metadata.lastAccessed - b[1].metadata.lastAccessed);

      // Remove least recently used entries if over capacity
      const maxEntries = Math.floor(this.config.maxSize * 1024 * 1024 / (100 * 1024)); // Assume average 100KB per entry

      if (entries.length > maxEntries) {
        const entriesToRemove = entries.slice(0, entries.length - maxEntries);
        for (const [key] of entriesToRemove) {
          await this.delete(key);
          this.stats.evictions++;
        }
      }

      // Optimize storage
      await this.optimizeStorage();
    } catch (error) {
      console.error('Error optimizing cache:', error);
      throw error;
    }
  }

  async cacheImage(imageUrl: string, imageData: ArrayBuffer, options?: { quality?: number; format?: string }): Promise<string> {
    try {
      const cacheKey = this.generateImageCacheKey(imageUrl, options);

      await this.set(cacheKey, imageData, {
        size: imageData.byteLength,
        type: options?.format || 'image',
        createdAt: Date.now(),
        expiresAt: Date.now() + this.config.ttl
      });

      return cacheKey;
    } catch (error) {
      console.error('Error caching image:', error);
      throw error;
    }
  }

  async getCachedImage(imageUrl: string): Promise<ArrayBuffer | null> {
    try {
      const cacheKey = this.generateImageCacheKey(imageUrl);
      const entry = await this.get(cacheKey);

      return entry ? entry.data as ArrayBuffer : null;
    } catch (error) {
      console.error('Error getting cached image:', error);
      return null;
    }
  }

  async invalidateImage(imageUrl: string): Promise<boolean> {
    try {
      const cacheKey = this.generateImageCacheKey(imageUrl);
      return await this.delete(cacheKey);
    } catch (error) {
      console.error('Error invalidating cached image:', error);
      return false;
    }
  }

  getCDNUrl(imageId: string, transformations?: Record<string, any>): string {
    const baseUrl = 'https://cdn.devegypt.com';
    const transformString = transformations
      ? `/${Object.entries(transformations).map(([key, value]) => `${key}_${value}`).join(',')}`
      : '';

    return `${baseUrl}/${transformString}/${imageId}`;
  }

  async prefetchImages(imageUrls: string[]): Promise<void> {
    try {
      // Prefetch images and cache them
      for (const url of imageUrls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            await this.cacheImage(url, arrayBuffer);
          }
        } catch (error) {
          console.warn(`Failed to prefetch image: ${url}`, error);
        }
      }
    } catch (error) {
      console.error('Error prefetching images:', error);
      throw error;
    }
  }

  async warmCache(imageUrls: string[]): Promise<void> {
    try {
      // Similar to prefetch but with higher priority
      await this.prefetchImages(imageUrls);
    } catch (error) {
      console.error('Error warming cache:', error);
      throw error;
    }
  }

  private initializeCache(): void {
    // Initialize cache based on strategy
    switch (this.config.strategy) {
      case 'localStorage':
        this.initializeLocalStorage();
        break;
      case 'indexedDB':
        this.initializeIndexedDB();
        break;
      case 'redis':
        this.initializeRedis();
        break;
      default:
        // Memory cache is already initialized
        break;
    }
  }

  private async evictEntries(requiredSpace: number): Promise<void> {
    // Implement LRU eviction
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].metadata.lastAccessed - b[1].metadata.lastAccessed);

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace) break;

      await this.delete(key);
      this.stats.evictions++;
      freedSpace += entry.metadata.size;
    }
  }

  private generateImageCacheKey(imageUrl: string, options?: { quality?: number; format?: string }): string {
    const baseKey = `img:${btoa(imageUrl).replace(/[^a-zA-Z0-9]/g, '')}`;
    if (options) {
      return `${baseKey}:${options.quality || 75}:${options.format || 'auto'}`;
    }
    return baseKey;
  }

  private logAccess(key: string, hit: boolean, accessTime: number): void {
    this.accessLog.push({
      key,
      timestamp: accessTime,
      hit
    });

    // Keep only last 1000 entries to prevent memory bloat
    if (this.accessLog.length > 1000) {
      this.accessLog = this.accessLog.slice(-1000);
    }
  }

  private resetStats(): void {
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictions: 0,
      averageAccessTime: 0
    };
  }

  // Storage strategy implementations (placeholders)
  private async persistToStorage(key: string, entry: CacheEntry): Promise<void> {
    if (this.config.strategy === 'localStorage') {
      localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    }
    // IndexedDB and Redis would be implemented here
  }

  private async getFromStorage(key: string): Promise<CacheEntry | null> {
    if (this.config.strategy === 'localStorage') {
      const stored = localStorage.getItem(`cache:${key}`);
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  }

  private async deleteFromStorage(key: string): Promise<void> {
    if (this.config.strategy === 'localStorage') {
      localStorage.removeItem(`cache:${key}`);
    }
  }

  private async hasInStorage(key: string): Promise<boolean> {
    if (this.config.strategy === 'localStorage') {
      return localStorage.getItem(`cache:${key}`) !== null;
    }
    return false;
  }

  private async clearStorage(): Promise<void> {
    if (this.config.strategy === 'localStorage') {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache:'));
      keys.forEach(key => localStorage.removeItem(key));
    }
  }

  private async cleanupStorage(): Promise<number> {
    // Implementation would clean expired entries from persistent storage
    return 0;
  }

  private async optimizeStorage(): Promise<void> {
    // Implementation would optimize storage structure
  }

  private initializeLocalStorage(): void {
    // Load existing entries from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cache:')) {
        try {
          const entry = JSON.parse(localStorage.getItem(key) || '{}');
          this.cache.set(key.substring(6), entry); // Remove 'cache:' prefix
        } catch (error) {
          // Remove corrupted entries
          localStorage.removeItem(key);
        }
      }
    }
  }

  private initializeIndexedDB(): void {
    // Placeholder for IndexedDB initialization
    console.log('IndexedDB cache initialized');
  }

  private initializeRedis(): void {
    // Placeholder for Redis initialization
    console.log('Redis cache initialized');
  }
}

// Factory function to create the service
export const createImageCachingService = (config: CacheConfig): ImageCachingService => {
  return new ImageCacheManager(config);
};

// Default configurations for different use cases
export const cacheConfigs = {
  development: {
    strategy: 'memory' as const,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 50, // 50MB
    compression: false,
    encryption: false
  },
  production: {
    strategy: 'redis' as const,
    ttl: 60 * 60 * 1000, // 1 hour
    maxSize: 1000, // 1GB
    compression: true,
    encryption: false
  },
  mobile: {
    strategy: 'indexedDB' as const,
    ttl: 30 * 60 * 1000, // 30 minutes
    maxSize: 100, // 100MB
    compression: true,
    encryption: false
  }
};