// Cache service for product data and other expensive operations

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface CacheOptions {
  ttl?: number; // Default: 5 minutes
  key?: string;
  tags?: string[];
}

export interface ICacheService {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, options?: CacheOptions): void;
  delete(key: string): void;
  clear(): void;
  invalidateByTag(tag: string): void;
  has(key: string): boolean;
  size(): number;
}

// In-memory cache implementation
export class MemoryCacheService implements ICacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private tags = new Map<string, Set<string>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      // Clean up tags
      this.removeKeyFromTags(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const { ttl = 5 * 60 * 1000, tags = [] } = options; // Default 5 minutes

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    this.cache.set(key, entry);

    // Update tags
    this.addKeyToTags(key, tags);
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.removeKeyFromTags(key);
  }

  clear(): void {
    this.cache.clear();
    this.tags.clear();
  }

  invalidateByTag(tag: string): void {
    const keys = this.tags.get(tag);

    if (keys) {
      keys.forEach(key => this.cache.delete(key));
      this.tags.delete(tag);
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  size(): number {
    return this.cache.size;
  }

  private addKeyToTags(key: string, tags: string[]): void {
    tags.forEach(tag => {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag)!.add(key);
    });
  }

  private removeKeyFromTags(key: string): void {
    this.tags.forEach((keys, tag) => {
      keys.delete(key);
      if (keys.size === 0) {
        this.tags.delete(tag);
      }
    });
  }
}

// Product-specific cache keys and utilities
export class ProductCacheService {
  private cache: ICacheService;

  constructor(cacheService: ICacheService) {
    this.cache = cacheService;
  }

  // Cache keys for different product operations
  static getProductDetailsKey(slug: string): string {
    return `product:details:${slug}`;
  }

  static getProductListKey(filters: Record<string, any> = {}): string {
    const filterStr = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');

    return `product:list:${filterStr}`;
  }

  static getProductImagesKey(productId: string): string {
    return `product:images:${productId}`;
  }

  // Product-specific cache operations
  getProductDetails(slug: string): any | null {
    return this.cache.get(ProductCacheService.getProductDetailsKey(slug));
  }

  setProductDetails(slug: string, product: any, ttl?: number): void {
    this.cache.set(
      ProductCacheService.getProductDetailsKey(slug),
      product,
      {
        ttl: ttl || 10 * 60 * 1000, // 10 minutes default
        tags: ['product', `product:${slug}`]
      }
    );
  }

  getProductList(filters: Record<string, any> = {}): any | null {
    return this.cache.get(ProductCacheService.getProductListKey(filters));
  }

  setProductList(filters: Record<string, any>, products: any, ttl?: number): void {
    this.cache.set(
      ProductCacheService.getProductListKey(filters),
      products,
      {
        ttl: ttl || 5 * 60 * 1000, // 5 minutes default
        tags: ['product-list', 'products']
      }
    );
  }

  getProductImages(productId: string): any | null {
    return this.cache.get(ProductCacheService.getProductImagesKey(productId));
  }

  setProductImages(productId: string, images: any, ttl?: number): void {
    this.cache.set(
      ProductCacheService.getProductImagesKey(productId),
      images,
      {
        ttl: ttl || 30 * 60 * 1000, // 30 minutes default (images change less frequently)
        tags: ['product-images', `product:${productId}`]
      }
    );
  }

  // Invalidate product-related cache
  invalidateProduct(slug: string): void {
    this.cache.delete(ProductCacheService.getProductDetailsKey(slug));
    this.cache.invalidateByTag(`product:${slug}`);
  }

  invalidateAllProducts(): void {
    this.cache.invalidateByTag('product');
    this.cache.invalidateByTag('product-list');
    this.cache.invalidateByTag('product-images');
  }

  // Get cache statistics
  getStats(): { size: number; entries: string[] } {
    const cacheService = this.cache as MemoryCacheService;
    return {
      size: this.cache.size(),
      entries: Array.from(cacheService['cache'].keys())
    };
  }
}

// Factory function for creating cache service
export const createCacheService = (): ICacheService => {
  return new MemoryCacheService();
};

// Factory function for creating product cache service
export const createProductCacheService = (cacheService?: ICacheService): ProductCacheService => {
  const cache = cacheService || createCacheService();
  return new ProductCacheService(cache);
};