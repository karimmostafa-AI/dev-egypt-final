import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  MemoCache,
  useMemoCache,
  debounce,
  throttle,
  useExpensiveMemo,
  useStableCallback,
  calculateVirtualScrollRange,
  createImagePreloader,
  PerformanceMonitor
} from '../performanceUtils';

// Mock performance.now
const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
});

describe('Performance Utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPerformanceNow.mockReturnValue(0);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('MemoCache', () => {
    it('should cache and retrieve values', () => {
      const cache = new MemoCache<string, number>();
      const factory = vi.fn(() => 42);

      const result1 = cache.get('key1', factory);
      const result2 = cache.get('key1', factory);

      expect(result1).toBe(42);
      expect(result2).toBe(42);
      expect(factory).toHaveBeenCalledTimes(1); // Should only call factory once
    });

    it('should handle different keys', () => {
      const cache = new MemoCache<string, number>();
      const factory1 = vi.fn(() => 1);
      const factory2 = vi.fn(() => 2);

      const result1 = cache.get('key1', factory1);
      const result2 = cache.get('key2', factory2);

      expect(result1).toBe(1);
      expect(result2).toBe(2);
      expect(factory1).toHaveBeenCalledTimes(1);
      expect(factory2).toHaveBeenCalledTimes(1);
    });

    it('should respect max size and evict oldest entries', () => {
      const cache = new MemoCache<string, number>(2); // Max size 2
      const factory = vi.fn((key: string) => key.length);

      cache.get('key1', () => factory('key1'));
      cache.get('key2', () => factory('key2'));
      cache.get('key3', () => factory('key3')); // Should evict key1

      expect(cache.size()).toBe(2);

      // key1 should be evicted, so factory should be called again
      cache.get('key1', () => factory('key1'));
      expect(factory).toHaveBeenCalledTimes(4); // 3 initial + 1 re-call for key1
    });

    it('should clear cache', () => {
      const cache = new MemoCache<string, number>();
      cache.get('key1', () => 42);

      expect(cache.size()).toBe(1);
      cache.clear();
      expect(cache.size()).toBe(0);
    });

    it('should handle complex keys', () => {
      const cache = new MemoCache<{ id: number; name: string }, string>();
      const factory = vi.fn(() => 'result');

      const key1 = { id: 1, name: 'test' };
      const key2 = { id: 1, name: 'test' }; // Same content, different object

      cache.get(key1, factory);
      cache.get(key2, factory);

      expect(factory).toHaveBeenCalledTimes(1); // Should be cached based on content
    });
  });

  describe('useMemoCache', () => {
    it('should create and return a stable cache instance', () => {
      const { result, rerender } = renderHook(
        ({ maxSize }) => useMemoCache<string, number>(maxSize),
        { initialProps: { maxSize: 10 } }
      );

      const cache1 = result.current;
      rerender({ maxSize: 10 });
      const cache2 = result.current;

      expect(cache1).toBe(cache2); // Should be the same instance
    });

    it('should create new cache when maxSize changes', () => {
      const { result, rerender } = renderHook(
        ({ maxSize }) => useMemoCache<string, number>(maxSize),
        { initialProps: { maxSize: 10 } }
      );

      const cache1 = result.current;
      rerender({ maxSize: 20 });
      const cache2 = result.current;

      expect(cache1).not.toBe(cache2); // Should be different instances
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      expect(mockFn).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    it('should reset timer on rapid calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn('arg1');
      
      act(() => {
        vi.advanceTimersByTime(300);
      });

      debouncedFn('arg2'); // Should reset timer

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockFn).not.toHaveBeenCalled(); // Should not have been called yet

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(mockFn).toHaveBeenCalledWith('arg2');
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 500);

      throttledFn('arg1');
      throttledFn('arg2');
      throttledFn('arg3');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');

      act(() => {
        vi.advanceTimersByTime(500);
      });

      throttledFn('arg4');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('arg4');
    });

    it('should allow calls after throttle period', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 500);

      throttledFn('arg1');
      expect(mockFn).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(600);
      });

      throttledFn('arg2');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('useExpensiveMemo', () => {
    it('should memoize expensive calculations', () => {
      const expensiveCalculation = vi.fn(() => 'result');

      const { result, rerender } = renderHook(
        ({ deps }) => useExpensiveMemo(expensiveCalculation, deps, 'test-memo'),
        { initialProps: { deps: [1, 2] } }
      );

      expect(result.current).toBe('result');
      expect(expensiveCalculation).toHaveBeenCalledTimes(1);

      // Rerender with same deps
      rerender({ deps: [1, 2] });
      expect(expensiveCalculation).toHaveBeenCalledTimes(1); // Should not recalculate

      // Rerender with different deps
      rerender({ deps: [1, 3] });
      expect(expensiveCalculation).toHaveBeenCalledTimes(2); // Should recalculate
    });

    it('should log performance in development mode', () => {
      vi.stubGlobal('process', {
        ...process,
        env: {
          ...process.env,
          NODE_ENV: 'development',
        },
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      let callCount = 0;
      mockPerformanceNow.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 0 : 15; // 15ms duration
      });

      const expensiveCalculation = vi.fn(() => 'result');

      renderHook(() => 
        useExpensiveMemo(expensiveCalculation, [1], 'slow-calculation')
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Performance] slow-calculation took 15.00ms'
      );

      consoleSpy.mockRestore();
      vi.unstubAllGlobals();
    });
  });

  describe('useStableCallback', () => {
    it('should return stable callback reference', () => {
      const mockCallback = vi.fn();

      const { result, rerender } = renderHook(
        ({ callback, deps }) => useStableCallback(callback, deps, 'test-callback'),
        { initialProps: { callback: mockCallback, deps: [1] } }
      );

      const stableCallback1 = result.current;

      // Rerender with same deps
      rerender({ callback: mockCallback, deps: [1] });
      const stableCallback2 = result.current;

      expect(stableCallback1).toBe(stableCallback2);
    });

    it('should update callback when dependencies change', () => {
      const mockCallback1 = vi.fn(() => 'result1');
      const mockCallback2 = vi.fn(() => 'result2');

      const { result, rerender } = renderHook(
        ({ callback, deps }) => useStableCallback(callback, deps, 'test-callback'),
        { initialProps: { callback: mockCallback1, deps: [1] } }
      );

      result.current();
      expect(mockCallback1).toHaveBeenCalled();

      // Update callback and deps
      rerender({ callback: mockCallback2, deps: [2] });
      result.current();
      expect(mockCallback2).toHaveBeenCalled();
    });
  });

  describe('calculateVirtualScrollRange', () => {
    it('should calculate correct scroll range', () => {
      const options = {
        itemHeight: 50,
        containerHeight: 300,
        overscan: 2
      };

      const result = calculateVirtualScrollRange(100, 100, options);

      expect(result.startIndex).toBe(0); // Math.max(0, Math.floor(100/50) - 2) = 0
      expect(result.endIndex).toBe(10); // Math.min(99, 0 + Math.ceil(300/50) + 2) = 10
      expect(result.offsetY).toBe(0); // 0 * 50 = 0
    });

    it('should handle scrolling down', () => {
      const options = {
        itemHeight: 50,
        containerHeight: 300,
        overscan: 2
      };

      const result = calculateVirtualScrollRange(500, 100, options);

      expect(result.startIndex).toBe(8); // Math.max(0, Math.floor(500/50) - 2) = 8
      expect(result.endIndex).toBe(18); // Math.min(99, 8 + Math.ceil(300/50) + 2) = 18
      expect(result.offsetY).toBe(400); // 8 * 50 = 400
    });

    it('should respect total items limit', () => {
      const options = {
        itemHeight: 50,
        containerHeight: 300,
        overscan: 2
      };

      const result = calculateVirtualScrollRange(2000, 10, options); // Only 10 items total

      expect(result.endIndex).toBe(9); // Should not exceed totalItems - 1
    });
  });

  describe('createImagePreloader', () => {
    it('should create preloader with preload methods', () => {
      const preloader = createImagePreloader();

      expect(typeof preloader.preload).toBe('function');
      expect(typeof preloader.preloadBatch).toBe('function');
    });

    // Note: Testing actual image loading would require more complex mocking
    // of Image constructor and load events, which is beyond the scope here
  });

  describe('PerformanceMonitor', () => {
    it('should be a singleton', () => {
      const monitor1 = PerformanceMonitor.getInstance();
      const monitor2 = PerformanceMonitor.getInstance();

      expect(monitor1).toBe(monitor2);
    });

    it('should track timing metrics', () => {
      const monitor = PerformanceMonitor.getInstance();

      let callCount = 0;
      mockPerformanceNow.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 0 : 100;
      });

      const stopTiming = monitor.startTiming('test-metric-unique');
      stopTiming();

      expect(monitor.getAverageMetric('test-metric-unique')).toBe(100);
    });

    it('should record multiple metrics', () => {
      const monitor = PerformanceMonitor.getInstance();

      let callCount = 0;
      mockPerformanceNow.mockImplementation(() => {
        callCount++;
        if (callCount === 1 || callCount === 3) return 0;
        if (callCount === 2) return 50;
        if (callCount === 4) return 150;
        return 0;
      });

      const stopTiming1 = monitor.startTiming('test-metric-multi');
      stopTiming1();

      const stopTiming2 = monitor.startTiming('test-metric-multi');
      stopTiming2();

      expect(monitor.getAverageMetric('test-metric-multi')).toBe(100); // (50 + 150) / 2
    });

    it('should provide metric summary', () => {
      const monitor = PerformanceMonitor.getInstance();

      let callCount = 0;
      mockPerformanceNow.mockImplementation(() => {
        callCount++;
        if (callCount === 1 || callCount === 3 || callCount === 5) return 0;
        if (callCount === 2) return 50;
        if (callCount === 4) return 150;
        if (callCount === 6) return 75;
        return 0;
      });

      const stopTiming1 = monitor.startTiming('summary-metric1');
      stopTiming1();

      const stopTiming2 = monitor.startTiming('summary-metric1');
      stopTiming2();

      const stopTiming3 = monitor.startTiming('summary-metric2');
      stopTiming3();

      const summary = monitor.getMetricSummary();

      expect(summary['summary-metric1']).toEqual({
        avg: 100,
        min: 50,
        max: 150,
        count: 2
      });

      expect(summary['summary-metric2']).toEqual({
        avg: 75,
        min: 75,
        max: 75,
        count: 1
      });
    });

    it('should limit stored measurements', () => {
      const monitor = PerformanceMonitor.getInstance();

      // Record more than 100 measurements
      for (let i = 0; i < 150; i++) {
        mockPerformanceNow
          .mockReturnValueOnce(i)
          .mockReturnValueOnce(i + 10);

        const stopTiming = monitor.startTiming('test-metric');
        stopTiming();
      }

      const summary = monitor.getMetricSummary();
      expect(summary['test-metric'].count).toBe(100); // Should be limited to 100
    });

    it('should log summary in development mode', () => {
      vi.stubGlobal('process', {
        ...process,
        env: {
          ...process.env,
          NODE_ENV: 'development',
        },
      });

      const consoleSpy = vi.spyOn(console, 'table').mockImplementation(() => {});
      
      const monitor = PerformanceMonitor.getInstance();
      monitor.logSummary();

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      vi.unstubAllGlobals();
    });
  });
});
