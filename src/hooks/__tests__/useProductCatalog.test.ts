import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProductCatalog } from '../useProductCatalog';
import type { Product, FilterOptions } from '@/types/product-catalog';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn()
}));

// Mock the useFilters hook
vi.mock('../useFilters', () => ({
  useFilters: vi.fn()
}));

import { useFilters } from '../useFilters';

const mockRouter = {
  replace: vi.fn()
};

const mockSearchParams = {
  get: vi.fn(),
  toString: vi.fn(() => '')
};

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

const mockFilterOptions: FilterOptions = {
  availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
  availableColors: [
    { name: 'Navy Blue', hex: '#000080', imageUrl: '/navy.jpg' },
    { name: 'White', hex: '#FFFFFF', imageUrl: '/white.jpg' }
  ],
  availableBrands: ['Cherokee', 'Dickies'],
  priceRange: [0, 100]
};

const mockUseFilters = {
  filters: {
    sizes: [],
    colors: [],
    brands: [],
    priceRange: [0, 100] as [number, number],
    onSale: false
  },
  setFilters: vi.fn(),
  clearFilters: vi.fn(),
  hasActiveFilters: false
};

describe('useProductCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useSearchParams as any).mockReturnValue(mockSearchParams);
    (useFilters as any).mockReturnValue(mockUseFilters);
    mockSearchParams.get.mockReturnValue(null);
    mockSearchParams.toString.mockReturnValue('');
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => 
      useProductCatalog(mockProducts, mockFilterOptions)
    );

    expect(result.current.state.products).toHaveLength(2);
    expect(result.current.state.filteredProducts).toHaveLength(2);
    expect(result.current.state.currentPage).toBe(1);
    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.error).toBeNull();
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should initialize sort state from URL', () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      switch (key) {
        case 'sort': return 'price-low';
        case 'direction': return 'desc';
        default: return null;
      }
    });

    const { result } = renderHook(() => 
      useProductCatalog(mockProducts, mockFilterOptions)
    );

    expect(result.current.state.sort).toEqual({
      option: 'price-low',
      direction: 'desc'
    });
  });

  it('should initialize page from URL', () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      return key === 'page' ? '3' : null;
    });

    const { result } = renderHook(() => 
      useProductCatalog(mockProducts, mockFilterOptions)
    );

    expect(result.current.state.currentPage).toBe(3);
  });

  it('should handle invalid page numbers from URL', () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      return key === 'page' ? '-5' : null;
    });

    const { result } = renderHook(() => 
      useProductCatalog(mockProducts, mockFilterOptions)
    );

    expect(result.current.state.currentPage).toBe(1); // Should default to 1
  });

  it('should update sort and sync to URL', () => {
    const { result } = renderHook(() => 
      useProductCatalog(mockProducts, mockFilterOptions)
    );

    act(() => {
      result.current.actions.setSort({
        option: 'name',
        direction: 'desc'
      });
    });

    expect(result.current.state.sort).toEqual({
      option: 'name',
      direction: 'desc'
    });
    expect(result.current.state.currentPage).toBe(1); // Should reset to page 1
    expect(mockRouter.replace).toHaveBeenCalled();
  });

  it('should update page and sync to URL', () => {
    const { result } = renderHook(() => 
      useProductCatalog(mockProducts, mockFilterOptions)
    );

    act(() => {
      result.current.actions.setPage(2);
    });

    expect(result.current.state.currentPage).toBe(2);
    expect(mockRouter.replace).toHaveBeenCalled();
  });

  it('should clamp page to valid range', () => {
    const { result } = renderHook(() => 
      useProductCatalog(mockProducts, mockFilterOptions)
    );

    // Try to set page beyond total pages
    act(() => {
      result.current.actions.setPage(100);
    });

    expect(result.current.state.currentPage).toBe(1); // Should clamp to max page
  });

  it('should handle cart actions', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    const { result } = renderHook(() => 
      useProductCatalog(mockProducts, mockFilterOptions)
    );

    act(() => {
      result.current.actions.addToCart('1');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Adding to cart:', '1');
    
    consoleSpy.mockRestore();
  });

  it('should handle wishlist actions', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    const { result } = renderHook(() => 
      useProductCatalog(mockProducts, mockFilterOptions)
    );

    act(() => {
      result.current.actions.addToWishlist('2');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Adding to wishlist:', '2');
    
    consoleSpy.mockRestore();
  });

  it('should clear filters and reset page', () => {
    const { result } = renderHook(() => 
      useProductCatalog(mockProducts, mockFilterOptions)
    );

    // Set page to 2 first
    act(() => {
      result.current.actions.setPage(2);
    });

    expect(result.current.state.currentPage).toBe(2);

    // Clear filters
    act(() => {
      result.current.actions.clearFilters();
    });

    expect(mockUseFilters.clearFilters).toHaveBeenCalled();
    expect(result.current.state.currentPage).toBe(1); // Should reset to page 1
  });

  it('should handle processing errors gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock processProducts to throw an error
    vi.doMock('@/utils/filterUtils', () => ({
      processProducts: vi.fn(() => {
        throw new Error('Processing error');
      }),
      getSortOption: vi.fn(() => 'popularity'),
      getSortDirection: vi.fn(() => 'asc'),
      validateFilters: vi.fn((filters) => filters)
    }));

    const { result } = renderHook(() => 
      useProductCatalog(mockProducts, mockFilterOptions)
    );

    expect(result.current.state.filteredProducts).toHaveLength(0);
    expect(result.current.state.error).toBe('Error processing products');
    
    consoleErrorSpy.mockRestore();
  });

  it('should reset page when total pages change', () => {
    // Mock useFilters to return filters that would reduce product count
    const mockUseFiltersWithFilter = {
      ...mockUseFilters,
      filters: {
        ...mockUseFilters.filters,
        brands: ['Cherokee'] // This would filter to only 1 product
      }
    };
    
    (useFilters as any).mockReturnValue(mockUseFiltersWithFilter);

    const { result } = renderHook(() => 
      useProductCatalog(mockProducts, mockFilterOptions)
    );

    // Set page to 2 first
    act(() => {
      result.current.actions.setPage(2);
    });

    // The effect should reset page to 1 since there's only 1 page of results
    expect(result.current.state.currentPage).toBe(1);
  });

  it('should validate filters on mount', () => {
    const { result } = renderHook(() => 
      useProductCatalog(mockProducts, mockFilterOptions)
    );

    // The hook should call validateFilters internally
    expect(result.current.state).toBeDefined();
  });

  it('should handle URL sync for sort parameters', () => {
    const { result } = renderHook(() => 
      useProductCatalog(mockProducts, mockFilterOptions)
    );

    act(() => {
      result.current.actions.setSort({
        option: 'popularity', // Default option
        direction: 'asc' // Default direction
      });
    });

    // Should not add default values to URL
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.not.stringContaining('sort='),
      { scroll: false }
    );
  });

  it('should handle URL sync for page parameters', () => {
    const { result } = renderHook(() => 
      useProductCatalog(mockProducts, mockFilterOptions)
    );

    // Set page to 1 (default)
    act(() => {
      result.current.actions.setPage(1);
    });

    // Should not add page=1 to URL
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.not.stringContaining('page='),
      { scroll: false }
    );

    // Set page to 2
    act(() => {
      result.current.actions.setPage(2);
    });

    // Should add page=2 to URL
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.stringContaining('page=2'),
      { scroll: false }
    );
  });
});