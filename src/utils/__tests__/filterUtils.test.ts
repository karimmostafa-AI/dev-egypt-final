import { describe, it, expect, vi } from 'vitest';
import type { Product, FilterState } from '@/types/product-catalog';
import {
  applyFilters,
  sortProducts,
  validateFilters,
  extractFilterOptions,
  getFilteredCount,
  processProducts,
  checkFilterConflicts,
  getSuggestedFilters,
  debounce
} from '../filterUtils';

// Mock products for testing
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Blue Scrub Top',
    price: 29.99,
    salePrice: 24.99,
    images: [{ url: '/image1.jpg', alt: 'Blue Scrub Top' }],
    colors: [{ name: 'Navy Blue', hex: '#000080', imageUrl: '/navy.jpg' }],
    sizes: ['XS', 'S', 'M', 'L'],
    brand: 'Cherokee',
    rating: 4.5,
    reviewCount: 120,
    isOnSale: true,
    category: 'scrubs'
  },
  {
    id: '2',
    name: 'White Lab Coat',
    price: 89.99,
    images: [{ url: '/image2.jpg', alt: 'White Lab Coat' }],
    colors: [{ name: 'White', hex: '#FFFFFF', imageUrl: '/white.jpg' }],
    sizes: ['S', 'M', 'L', 'XL'],
    brand: 'Dickies',
    rating: 4.8,
    reviewCount: 85,
    isOnSale: false,
    category: 'lab-coats'
  }
];

const defaultFilters: FilterState = {
  sizes: [],
  colors: [],
  brands: [],
  priceRange: [0, 100],
  onSale: false
};

describe('Filter Utilities', () => {
  describe('applyFilters', () => {
    it('should handle empty arrays', () => {
      const result = applyFilters([], defaultFilters);
      expect(result).toHaveLength(0);
    });

    it('should return all products when no filters are applied', () => {
      const result = applyFilters(mockProducts, defaultFilters);
      expect(result).toHaveLength(2);
    });

    it('should filter products by size', () => {
      const filters: FilterState = {
        ...defaultFilters,
        sizes: ['XS']
      };
      const result = applyFilters(mockProducts, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should filter products by brand', () => {
      const filters: FilterState = {
        ...defaultFilters,
        brands: ['Cherokee']
      };
      const result = applyFilters(mockProducts, filters);
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe('Cherokee');
    });

    it('should filter products on sale', () => {
      const filters: FilterState = {
        ...defaultFilters,
        onSale: true
      };
      const result = applyFilters(mockProducts, filters);
      expect(result).toHaveLength(1);
      expect(result[0].isOnSale).toBe(true);
    });
  });

  describe('sortProducts', () => {
    it('should sort by price low to high', () => {
      const sortState = { option: 'price-low' as const, direction: 'asc' as const };
      const result = sortProducts(mockProducts, sortState);
      
      const prices = result.map(p => p.salePrice || p.price);
      expect(prices).toEqual([24.99, 89.99]);
    });

    it('should sort by name', () => {
      const sortState = { option: 'name' as const, direction: 'asc' as const };
      const result = sortProducts(mockProducts, sortState);
      
      expect(result[0].name).toBe('Blue Scrub Top');
      expect(result[1].name).toBe('White Lab Coat');
    });
  });

  describe('validateFilters', () => {
    const availableOptions = {
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Navy Blue', 'White'],
      brands: ['Cherokee', 'Dickies'],
      priceRange: [0, 100] as [number, number]
    };

    it('should validate and clean filter options', () => {
      const invalidFilters: FilterState = {
        sizes: ['XS', 'XXL'], // XXL not available
        colors: ['Navy Blue', 'Green'], // Green not available
        brands: ['Cherokee', 'Nike'], // Nike not available
        priceRange: [10, 80],
        onSale: true
      };

      const result = validateFilters(invalidFilters, availableOptions);
      
      expect(result.sizes).toEqual(['XS']);
      expect(result.colors).toEqual(['Navy Blue']);
      expect(result.brands).toEqual(['Cherokee']);
      expect(result.priceRange).toEqual([10, 80]);
      expect(result.onSale).toBe(true);
    });

    it('should handle null inputs', () => {
      const result = validateFilters(null as any, availableOptions);
      expect(result).toEqual({
        sizes: [],
        colors: [],
        brands: [],
        priceRange: [0, 100],
        onSale: false
      });
    });
  });

  describe('extractFilterOptions', () => {
    it('should extract unique filter options from products', () => {
      const options = extractFilterOptions(mockProducts);
      
      expect(options.availableSizes).toContain('XS');
      expect(options.availableSizes).toContain('XL');
      expect(options.availableColors.map(c => c.name)).toContain('Navy Blue');
      expect(options.availableColors.map(c => c.name)).toContain('White');
      expect(options.availableBrands).toContain('Cherokee');
      expect(options.availableBrands).toContain('Dickies');
    });

    it('should handle empty products array', () => {
      const options = extractFilterOptions([]);
      expect(options.availableSizes).toHaveLength(0);
      expect(options.availableColors).toHaveLength(0);
      expect(options.availableBrands).toHaveLength(0);
    });
  });

  describe('getFilteredCount', () => {
    it('should return correct count of filtered products', () => {
      const filters: FilterState = {
        ...defaultFilters,
        brands: ['Cherokee']
      };
      const count = getFilteredCount(mockProducts, filters);
      expect(count).toBe(1);
    });
  });

  describe('processProducts', () => {
    it('should apply filters and sorting together', () => {
      const filters: FilterState = {
        ...defaultFilters,
        brands: ['Cherokee']
      };
      const sortState = { option: 'price-low' as const, direction: 'asc' as const };
      
      const result = processProducts(mockProducts, filters, sortState);
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe('Cherokee');
    });
  });

  describe('checkFilterConflicts', () => {
    it('should detect when filters would result in no products', () => {
      const conflictingFilters: FilterState = {
        sizes: ['XXL'], // Size not available in any product
        colors: [],
        brands: [],
        priceRange: [0, 100],
        onSale: false
      };

      const result = checkFilterConflicts(mockProducts, conflictingFilters);
      expect(result.hasConflicts).toBe(true);
      expect(result.conflictingFilters).toContain('sizes');
    });

    it('should return no conflicts for valid filters', () => {
      const validFilters: FilterState = {
        sizes: ['S'],
        colors: [],
        brands: [],
        priceRange: [0, 100],
        onSale: false
      };

      const result = checkFilterConflicts(mockProducts, validFilters);
      expect(result.hasConflicts).toBe(false);
      expect(result.conflictingFilters).toHaveLength(0);
    });
  });

  describe('getSuggestedFilters', () => {
    it('should suggest loosened filters when no products match', () => {
      const noMatchFilters: FilterState = {
        sizes: ['XXL'],
        colors: ['Purple'],
        brands: ['NonExistentBrand'],
        priceRange: [0, 100],
        onSale: false
      };

      const suggestions = getSuggestedFilters(mockProducts, noMatchFilters);
      expect(suggestions.sizes).toEqual([]);
      expect(suggestions.colors).toEqual([]);
      expect(suggestions.brands).toHaveLength(1);
    });

    it('should return current filters when products match', () => {
      const validFilters: FilterState = {
        sizes: ['S'],
        colors: [],
        brands: ['Cherokee'],
        priceRange: [0, 100],
        onSale: false
      };

      const suggestions = getSuggestedFilters(mockProducts, validFilters);
      expect(suggestions).toEqual(validFilters);
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      vi.useFakeTimers();
      let callCount = 0;
      const debouncedFn = debounce(() => {
        callCount++;
      }, 50);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(callCount).toBe(0);

      await vi.advanceTimersByTimeAsync(60);

      expect(callCount).toBe(1);
      vi.useRealTimers();
    });
  });
});
