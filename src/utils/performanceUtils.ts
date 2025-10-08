'use client';

import { useMemo, useRef, useCallback } from 'react';

/**
 * Memoization utility for expensive calculations
 */
export class MemoCache<K, V> {
  private cache = new Map<string, V>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: K, factory: () => V): V {
    const keyStr = JSON.stringify(key);
    
    if (this.cache.has(keyStr)) {
      return this.cache.get(keyStr)!;
    }

    const value = factory();
    
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(keyStr, value);
    return value;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Hook for creating a memoized cache instance
 */
export function useMemoCache<K, V>(maxSize = 100): MemoCache<K, V> {
  return useMemo(() => new MemoCache<K, V>(maxSize), [maxSize]);
}

/**
 * Debounce utility for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle utility for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Hook for memoizing expensive calculations with dependency tracking
 */
export function useExpensiveMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  debugName?: string
): T {
  const startTime = useRef<number>(0);
  
  return useMemo(() => {
    if (process.env.NODE_ENV === 'development' && debugName) {
      startTime.current = performance.now();
    }
    
    const result = factory();
    
    if (process.env.NODE_ENV === 'development' && debugName && startTime.current) {
      const duration = performance.now() - startTime.current;
      if (duration > 10) { // Log if calculation takes more than 10ms
        console.log(`[Performance] ${debugName} took ${duration.toFixed(2)}ms`);
      }
    }
    
    return result;
  }, deps);
}

/**
 * Hook for creating a stable callback reference with performance tracking
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  debugName?: string
): T {
  const callbackRef = useRef<T>(callback);
  
  // Update the ref when dependencies change
  useMemo(() => {
    callbackRef.current = callback;
  }, deps);
  
  return useCallback(
    ((...args: Parameters<T>) => {
      if (process.env.NODE_ENV === 'development' && debugName) {
        const startTime = performance.now();
        const result = callbackRef.current(...args);
        const duration = performance.now() - startTime;
        
        if (duration > 5) { // Log if callback takes more than 5ms
          console.log(`[Performance] ${debugName} callback took ${duration.toFixed(2)}ms`);
        }
        
        return result;
      }
      
      return callbackRef.current(...args);
    }) as T,
    [] // Empty deps array since we manage dependencies manually
  );
}

/**
 * Virtual scrolling utilities for large lists
 */
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function calculateVirtualScrollRange(
  scrollTop: number,
  totalItems: number,
  options: VirtualScrollOptions
): { startIndex: number; endIndex: number; offsetY: number } {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleItems = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(totalItems - 1, startIndex + visibleItems + overscan);
  const offsetY = startIndex * itemHeight;
  
  return { startIndex, endIndex, offsetY };
}

/**
 * Image loading optimization utilities
 */
export function createImagePreloader(): {
  preload: (src: string) => Promise<void>;
  preloadBatch: (srcs: string[]) => Promise<void>;
} {
  const cache = new Set<string>();
  
  const preload = (src: string): Promise<void> => {
    if (cache.has(src)) {
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        cache.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  };
  
  const preloadBatch = async (srcs: string[]): Promise<void> => {
    const uncachedSrcs = srcs.filter(src => !cache.has(src));
    
    if (uncachedSrcs.length === 0) {
      return Promise.resolve();
    }
    
    // Preload in batches of 5 to avoid overwhelming the browser
    const batchSize = 5;
    for (let i = 0; i < uncachedSrcs.length; i += batchSize) {
      const batch = uncachedSrcs.slice(i, i + batchSize);
      await Promise.allSettled(batch.map(preload));
    }
  };
  
  return { preload, preloadBatch };
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  startTiming(label: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(label, duration);
    };
  }
  
  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // Keep only the last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }
  
  getAverageMetric(label: string): number {
    const values = this.metrics.get(label);
    if (!values || values.length === 0) return 0;
    
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  getMetricSummary(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [label, values] of this.metrics.entries()) {
      if (values.length > 0) {
        summary[label] = {
          avg: values.reduce((sum, val) => sum + val, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length
        };
      }
    }
    
    return summary;
  }
  
  logSummary(): void {
    if (process.env.NODE_ENV === 'development') {
      console.table(this.getMetricSummary());
    }
  }
}