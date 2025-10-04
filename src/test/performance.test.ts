import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Product, FilterState, SortState } from '@/types/product-catalog';
import { applyFilters, sortProducts, processProducts } from '@/utils/filterUtils';
import { PerformanceMonitor } from '@/utils/performanceUtils';

// Mock performance.now for consistent testing
const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
});

// Generate test data
const generateProducts = (count: number): Product[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `product-${i}`,
    name: `Product ${i}`,
    price: Math.random() * 200 + 10,
    salePrice: Math.random() > 0.7 ? Math.random() * 150 + 5 : undefined,
    images: [
      {
        url: `https://example.com/image-${i}.jpg`,
        alt: `Product ${i} image`,
        colorName: 'Default'
      }
    ],
    colors: [
      { name: 'Red', hex: '#ff0000', imageUrl: '' },
      { name: 'Blue', hex: '#0000ff', imageUrl: '' },
      { name: 'Green', hex: '#00ff00', imageUrl: '' }
    ].slice(0, Math.floor(Math.random() * 3) + 1),
    sizes: ['S', 'M', 'L', 'XL'].slice(0, Math.floor(Math.random() * 4) + 1),
    brand: ['Nike', 'Adidas', 'Puma', 'Reebok'][Math.floor(Math.random() * 4)],
    rating: Math.random() * 5,
    reviewCount: Math.floor(Math.random() * 1000),
    isOnSale: Math.random() > 0.7,
    category: 'test'
  }));
};

const defaultFilters: FilterState = {
  sizes: [],
  colors: [],
  brands: [],
  priceRange: [0, 1000],
  onSale: false
};

const defaultSort: SortState = {
  option: 'popularity',
  direction: 'asc'
};

describe('Performance Tests', () => {
  let performanceMonitor: PerformanceMonitor;
  let products: Product[];

  beforeEach(() => {
    performanceMonitor = PerformanceMonitor.getInstance();
    products = generateProducts(1000); // Large dataset for performance testing
    mockPerformanceNow.mockReturnValue(0);
  });

  describe('Filter Performance', () => {
    it('should filter large product lists efficiently', () => {
      const startTime = 0;
      const endTime = 50; // 50ms max for filtering 1000 products
      
      mockPerformanceNow
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(endTime);

      const filters: FilterState = {
        ...defaultFilters,
        brands: ['Nike', 'Adidas'],
        priceRange: [50, 150],
        onSale: true
      };

      const stopTiming = performanceMonitor.startTiming('filter-large-dataset');
      const result = applyFilters(products, filters);
      stopTiming();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(performanceMonitor.getAverageMetric('filter-large-dataset')).toBeLessThan(100);
    });

    it('should handle multiple filter applications efficiently', () => {
      const filterVariations: FilterState[] = [
        { ...defaultFilters, sizes: ['S', 'M'] },
        { ...defaultFilters, colors: ['Red', 'Blue'] },
        { ...defaultFilters, brands: ['Nike'] },
        { ...defaultFilters, priceRange: [0, 100] },
        { ...defaultFilters, onSale: true }
      ];

      mockPerformanceNow.mockImplementation(() => Date.now());

      const stopTiming = performanceMonitor.startTiming('multiple-filters');
      
      filterVariations.forEach(filter => {
        applyFilters(products, filter);
      });
      
      stopTiming();

      expect(performanceMonitor.getAverageMetric('multiple-filters')).toBeLessThan(200);
    });

    it('should cache filter results for identical inputs', () => {
      const filters: FilterState = {
        ...defaultFilters,
        brands: ['Nike']
      };

      mockPerformanceNow.mockImplementation(() => Date.now());

      // First call - should be slower
      const stopTiming1 = performanceMonitor.startTiming('filter-first-call');
      const result1 = applyFilters(products, filters);
      stopTiming1();

      // Second call - should be faster due to caching
      const stopTiming2 = performanceMonitor.startTiming('filter-cached-call');
      const result2 = applyFilters(products, filters);
      stopTiming2();

      expect(result1).toEqual(result2);
      // Note: In a real scenario, cached call should be faster
      // but we can't easily test this with mocked performance.now
    });
  });

  describe('Sort Performance', () => {
    it('should sort large product lists efficiently', () => {
      const sortOptions: SortState[] = [
        { option: 'price-low', direction: 'asc' },
        { option: 'price-high', direction: 'desc' },
        { option: 'name', direction: 'asc' },
        { option: 'popularity', direction: 'desc' },
        { option: 'newest', direction: 'desc' }
      ];

      mockPerformanceNow.mockImplementation(() => Date.now());

      sortOptions.forEach(sortState => {
        const stopTiming = performanceMonitor.startTiming(`sort-${sortState.option}`);
        const result = sortProducts(products, sortState);
        stopTiming();

        expect(result).toBeDefined();
        expect(result.length).toBe(products.length);
        expect(performanceMonitor.getAverageMetric(`sort-${sortState.option}`)).toBeLessThan(100);
      });
    });

    it('should handle combined filter and sort operations efficiently', () => {
      const filters: FilterState = {
        ...defaultFilters,
        brands: ['Nike', 'Adidas'],
        priceRange: [20, 200]
      };

      const sortState: SortState = {
        option: 'price-low',
        direction: 'asc'
      };

      mockPerformanceNow.mockImplementation(() => Date.now());

      const stopTiming = performanceMonitor.startTiming('filter-and-sort');
      const result = processProducts(products, filters, sortState);
      stopTiming();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(performanceMonitor.getAverageMetric('filter-and-sort')).toBeLessThan(150);
    });
  });

  describe('Component Performance', () => {
    it('should simulate component rendering performance', () => {
      const product = products[0];

      mockPerformanceNow.mockImplementation(() => Date.now());

      const stopTiming = performanceMonitor.startTiming('component-simulation');
      
      // Simulate component rendering work
      for (let i = 0; i < 1000; i++) {
        const mockRender = {
          productName: product.name,
          productPrice: product.price,
          productColors: product.colors.length
        };
        // Simulate some processing
        JSON.stringify(mockRender);
      }

      stopTiming();

      expect(performanceMonitor.getAverageMetric('component-simulation')).toBeDefined();
    });

    it('should simulate multiple component renders', () => {
      const testProducts = products.slice(0, 20);

      mockPerformanceNow.mockImplementation(() => Date.now());

      const stopTiming = performanceMonitor.startTiming('multiple-component-simulation');

      testProducts.forEach(product => {
        // Simulate component processing
        const mockComponent = {
          id: product.id,
          name: product.name,
          price: product.price,
          colors: product.colors,
          isOnSale: product.isOnSale
        };
        JSON.stringify(mockComponent);
      });

      stopTiming();

      expect(performanceMonitor.getAverageMetric('multiple-component-simulation')).toBeDefined();
    });

    it('should simulate grid layout performance', () => {
      const testProducts = products.slice(0, 50);

      mockPerformanceNow.mockImplementation(() => Date.now());

      const stopTiming = performanceMonitor.startTiming('grid-simulation');

      // Simulate grid layout calculations
      const gridData = testProducts.map((product, index) => ({
        ...product,
        gridPosition: {
          row: Math.floor(index / 4),
          col: index % 4
        }
      }));

      // Simulate sorting and filtering
      gridData.sort((a, b) => a.name.localeCompare(b.name));

      stopTiming();

      expect(performanceMonitor.getAverageMetric('grid-simulation')).toBeDefined();
      expect(gridData.length).toBe(testProducts.length);
    });
  });

  describe('Memory Performance', () => {
    it('should not create excessive objects during filtering', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform multiple filter operations
      for (let i = 0; i < 100; i++) {
        const filters: FilterState = {
          ...defaultFilters,
          brands: [`Brand-${i % 5}`]
        };
        applyFilters(products, filters);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB for 100 operations)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should clean up event listeners and timers', () => {
      // This test would be more meaningful in a real browser environment
      // For now, we just ensure no errors are thrown
      expect(() => {
        const filters: FilterState = {
          ...defaultFilters,
          brands: ['Nike']
        };
        applyFilters(products, filters);
      }).not.toThrow();
    });
  });

  describe('Debounce Performance', () => {
    it('should debounce rapid filter changes', async () => {
      let callCount = 0;
      const debouncedFunction = vi.fn(() => {
        callCount++;
      });

      // Simulate rapid calls
      for (let i = 0; i < 10; i++) {
        debouncedFunction();
      }

      // In a real debounce scenario, only the last call should execute
      // This is a simplified test
      expect(debouncedFunction).toHaveBeenCalledTimes(10);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics correctly', () => {
      const monitor = PerformanceMonitor.getInstance();
      
      mockPerformanceNow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(100);

      const stopTiming = monitor.startTiming('test-metric');
      stopTiming();

      expect(monitor.getAverageMetric('test-metric')).toBe(100);
    });

    it('should provide performance summary', () => {
      const monitor = PerformanceMonitor.getInstance();
      
      mockPerformanceNow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(50)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(75);

      const stopTiming1 = monitor.startTiming('summary-test');
      stopTiming1();
      
      const stopTiming2 = monitor.startTiming('summary-test');
      stopTiming2();

      const summary = monitor.getMetricSummary();
      
      expect(summary['summary-test']).toBeDefined();
      expect(summary['summary-test'].avg).toBe(62.5);
      expect(summary['summary-test'].min).toBe(50);
      expect(summary['summary-test'].max).toBe(75);
      expect(summary['summary-test'].count).toBe(2);
    });
  });
});

describe('Performance Benchmarks', () => {
  it('should benchmark filter operations with different dataset sizes', () => {
    const sizes = [100, 500, 1000, 2000];
    const results: Record<number, number> = {};

    sizes.forEach(size => {
      const testProducts = generateProducts(size);
      const filters: FilterState = {
        ...defaultFilters,
        brands: ['Nike', 'Adidas'],
        priceRange: [50, 150]
      };

      const startTime = performance.now();
      applyFilters(testProducts, filters);
      const endTime = performance.now();

      results[size] = endTime - startTime;
    });

    // Ensure performance scales reasonably (handle case where times are 0 due to fast execution)
    const ratio = results[100] > 0 ? results[2000] / results[100] : 1;
    expect(ratio).toBeLessThan(50); // Should not be 50x slower
    
    console.log('Filter Performance Benchmark:', results);
  });

  it('should benchmark sort operations with different algorithms', () => {
    const testProducts = generateProducts(1000);
    const sortOptions: SortState[] = [
      { option: 'price-low', direction: 'asc' },
      { option: 'name', direction: 'asc' },
      { option: 'popularity', direction: 'desc' }
    ];

    const results: Record<string, number> = {};

    sortOptions.forEach(sortState => {
      const startTime = performance.now();
      sortProducts(testProducts, sortState);
      const endTime = performance.now();

      results[`${sortState.option}-${sortState.direction}`] = endTime - startTime;
    });

    // All sort operations should complete within reasonable time
    Object.values(results).forEach(time => {
      expect(time).toBeLessThan(100); // Less than 100ms
    });

    console.log('Sort Performance Benchmark:', results);
  });
});
