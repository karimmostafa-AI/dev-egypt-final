import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFilters } from '../useFilters';
import type { FilterOptions, FilterState } from '@/types/product-catalog';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn()
}));

const mockRouter = {
  replace: vi.fn()
};

const mockSearchParams = {
  get: vi.fn(),
  toString: vi.fn(() => '')
};

const mockFilterOptions: FilterOptions = {
  availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
  availableColors: [
    { name: 'Navy Blue', hex: '#000080', imageUrl: '/navy.jpg' },
    { name: 'White', hex: '#FFFFFF', imageUrl: '/white.jpg' },
    { name: 'Black', hex: '#000000', imageUrl: '/black.jpg' }
  ],
  availableBrands: ['Cherokee', 'Dickies', 'FIGS'],
  priceRange: [0, 100]
};

describe('useFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useSearchParams as any).mockReturnValue(mockSearchParams);
    mockSearchParams.get.mockReturnValue(null);
    mockSearchParams.toString.mockReturnValue('');
  });

  it('should initialize with default filters', () => {
    const { result } = renderHook(() => useFilters(mockFilterOptions));

    expect(result.current.filters).toEqual({
      sizes: [],
      colors: [],
      brands: [],
      priceRange: [0, 100],
      onSale: false
    });
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should initialize filters from URL parameters', () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      switch (key) {
        case 'sizes': return 'S,M';
        case 'colors': return 'Navy Blue';
        case 'brands': return 'Cherokee';
        case 'min_price': return '10';
        case 'max_price': return '50';
        case 'on_sale': return 'true';
        default: return null;
      }
    });

    const { result } = renderHook(() => useFilters(mockFilterOptions));

    expect(result.current.filters).toEqual({
      sizes: ['S', 'M'],
      colors: ['Navy Blue'],
      brands: ['Cherokee'],
      priceRange: [10, 50],
      onSale: true
    });
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should handle invalid URL parameters gracefully', () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      switch (key) {
        case 'min_price': return 'invalid';
        case 'max_price': return 'also-invalid';
        case 'on_sale': return 'maybe';
        default: return null;
      }
    });

    const { result } = renderHook(() => useFilters(mockFilterOptions));

    expect(result.current.filters.priceRange).toEqual([0, 100]);
    expect(result.current.filters.onSale).toBe(false);
  });

  it('should apply single filter correctly', () => {
    const { result } = renderHook(() => useFilters(mockFilterOptions));

    act(() => {
      result.current.applyFilter('sizes', ['S', 'M']);
    });

    expect(result.current.filters.sizes).toEqual(['S', 'M']);
    expect(mockRouter.replace).toHaveBeenCalled();
  });

  it('should validate filter values when applying', () => {
    const { result } = renderHook(() => useFilters(mockFilterOptions));

    // Test invalid price range
    act(() => {
      result.current.applyFilter('priceRange', ['invalid', 'values']);
    });

    expect(result.current.filters.priceRange).toEqual([0, 100]); // Should fallback to default

    // Test non-array for array filters
    act(() => {
      result.current.applyFilter('sizes', 'not-an-array');
    });

    expect(result.current.filters.sizes).toEqual([]);
  });

  it('should toggle filter values correctly', () => {
    const { result } = renderHook(() => useFilters(mockFilterOptions));

    // Add a size
    act(() => {
      result.current.toggleFilter('sizes', 'S');
    });

    expect(result.current.filters.sizes).toEqual(['S']);

    // Add another size
    act(() => {
      result.current.toggleFilter('sizes', 'M');
    });

    expect(result.current.filters.sizes).toEqual(['S', 'M']);

    // Remove the first size
    act(() => {
      result.current.toggleFilter('sizes', 'S');
    });

    expect(result.current.filters.sizes).toEqual(['M']);
  });

  it('should reset specific filters', () => {
    const { result } = renderHook(() => useFilters(mockFilterOptions));

    // Set some filters first
    act(() => {
      result.current.applyFilter('sizes', ['S', 'M']);
    });
    
    act(() => {
      result.current.applyFilter('colors', ['Navy Blue']);
    });
    
    act(() => {
      result.current.applyFilter('onSale', true);
    });

    // Verify filters are set
    expect(result.current.filters.sizes).toEqual(['S', 'M']);
    expect(result.current.filters.colors).toEqual(['Navy Blue']);
    expect(result.current.filters.onSale).toBe(true);

    // Reset sizes
    act(() => {
      result.current.resetFilter('sizes');
    });

    expect(result.current.filters.sizes).toEqual([]);
    expect(result.current.filters.colors).toEqual(['Navy Blue']); // Should remain unchanged

    // Reset price range
    act(() => {
      result.current.resetFilter('priceRange');
    });

    expect(result.current.filters.priceRange).toEqual([0, 100]);

    // Reset onSale
    act(() => {
      result.current.resetFilter('onSale');
    });

    expect(result.current.filters.onSale).toBe(false);
  });

  it('should clear all filters', () => {
    const { result } = renderHook(() => useFilters(mockFilterOptions));

    // Set some filters first
    act(() => {
      result.current.applyFilter('sizes', ['S', 'M']);
      result.current.applyFilter('colors', ['Navy Blue']);
      result.current.applyFilter('brands', ['Cherokee']);
      result.current.applyFilter('onSale', true);
    });

    expect(result.current.hasActiveFilters).toBe(true);

    // Clear all filters
    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({
      sizes: [],
      colors: [],
      brands: [],
      priceRange: [0, 100],
      onSale: false
    });
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should detect active filters correctly', () => {
    const { result } = renderHook(() => useFilters(mockFilterOptions));

    expect(result.current.hasActiveFilters).toBe(false);

    // Add size filter
    act(() => {
      result.current.applyFilter('sizes', ['S']);
    });

    expect(result.current.hasActiveFilters).toBe(true);

    // Clear size but add price filter
    act(() => {
      result.current.applyFilter('sizes', []);
    });
    
    act(() => {
      result.current.applyFilter('priceRange', [10, 90]);
    });

    expect(result.current.hasActiveFilters).toBe(true);

    // Reset price to default
    act(() => {
      result.current.applyFilter('priceRange', [0, 100]);
    });

    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should update URL when filters change', () => {
    const { result } = renderHook(() => useFilters(mockFilterOptions));

    act(() => {
      result.current.applyFilter('sizes', ['S', 'M']);
      result.current.applyFilter('colors', ['Navy Blue']);
      result.current.applyFilter('onSale', true);
    });

    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.stringContaining('sizes=S%2CM'),
      { scroll: false }
    );
  });

  it('should handle price range edge cases', () => {
    const { result } = renderHook(() => useFilters(mockFilterOptions));

    // Test negative prices
    act(() => {
      result.current.applyFilter('priceRange', [-10, 50]);
    });

    expect(result.current.filters.priceRange[0]).toBeGreaterThanOrEqual(0);

    // Test min > max
    act(() => {
      result.current.applyFilter('priceRange', [80, 20]);
    });

    expect(result.current.filters.priceRange[0]).toBeLessThanOrEqual(result.current.filters.priceRange[1]);
  });

  it('should handle URL parameter parsing errors gracefully', () => {
    // Mock console.warn to avoid test output noise
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Simulate URL parsing error
    mockSearchParams.get.mockImplementation(() => {
      throw new Error('URL parsing error');
    });

    const { result } = renderHook(() => useFilters(mockFilterOptions));

    expect(result.current.filters).toEqual({
      sizes: [],
      colors: [],
      brands: [],
      priceRange: [0, 100],
      onSale: false
    });

    consoleSpy.mockRestore();
  });
});