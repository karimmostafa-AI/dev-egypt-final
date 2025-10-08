import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useURLSync } from '../useURLSync';
import type { FilterState, SortState } from '@/types/product-catalog';

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

describe('useURLSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useSearchParams as any).mockReturnValue(mockSearchParams);
    mockSearchParams.get.mockReturnValue(null);
    mockSearchParams.toString.mockReturnValue('');
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { pathname: '/products' },
      writable: true
    });
  });

  it('should parse filters from URL correctly', () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      switch (key) {
        case 'sizes': return 'S,M,L';
        case 'colors': return 'Navy Blue,White';
        case 'brands': return 'Cherokee';
        case 'min_price': return '10';
        case 'max_price': return '50';
        case 'on_sale': return 'true';
        default: return null;
      }
    });

    const { result } = renderHook(() => useURLSync());

    const filters = result.current.parseFiltersFromURL();
    
    expect(filters).toEqual({
      sizes: ['S', 'M', 'L'],
      colors: ['Navy Blue', 'White'],
      brands: ['Cherokee'],
      priceRange: [10, 50],
      onSale: true
    });
  });

  it('should handle missing filter parameters', () => {
    const { result } = renderHook(() => useURLSync());

    const filters = result.current.parseFiltersFromURL();
    
    expect(filters).toEqual({});
  });

  it('should parse sort from URL correctly', () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      switch (key) {
        case 'sort': return 'price-low';
        case 'direction': return 'desc';
        default: return null;
      }
    });

    const { result } = renderHook(() => useURLSync());

    const sort = result.current.parseSortFromURL();
    
    expect(sort).toEqual({
      option: 'price-low',
      direction: 'desc'
    });
  });

  it('should parse page from URL correctly', () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      return key === 'page' ? '3' : null;
    });

    const { result } = renderHook(() => useURLSync());

    const page = result.current.parsePageFromURL();
    
    expect(page).toBe(3);
  });

  it('should handle invalid page numbers', () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      return key === 'page' ? '-5' : null;
    });

    const { result } = renderHook(() => useURLSync());

    const page = result.current.parsePageFromURL();
    
    expect(page).toBe(1); // Should default to 1
  });

  it('should sync filters to URL', () => {
    const { result } = renderHook(() => useURLSync());

    const filters: FilterState = {
      sizes: ['S', 'M'],
      colors: ['Navy Blue'],
      brands: ['Cherokee'],
      priceRange: [10, 50],
      onSale: true
    };

    act(() => {
      result.current.syncFiltersToURL(filters);
    });

    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.stringContaining('sizes=S%2CM'),
      { scroll: false }
    );
  });

  it('should remove empty filter parameters from URL', () => {
    const { result } = renderHook(() => useURLSync());

    const filters: FilterState = {
      sizes: [],
      colors: [],
      brands: [],
      priceRange: [0, 1000],
      onSale: false
    };

    act(() => {
      result.current.syncFiltersToURL(filters);
    });

    expect(mockRouter.replace).toHaveBeenCalledWith(
      '/products', // Should be clean URL with no parameters
      { scroll: false }
    );
  });

  it('should sync sort to URL', () => {
    const { result } = renderHook(() => useURLSync());

    const sort: SortState = {
      option: 'name',
      direction: 'desc'
    };

    act(() => {
      result.current.syncSortToURL(sort);
    });

    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.stringContaining('sort=name'),
      { scroll: false }
    );
  });

  it('should not add default sort values to URL', () => {
    const { result } = renderHook(() => useURLSync());

    const sort: SortState = {
      option: 'popularity', // Default
      direction: 'asc' // Default
    };

    act(() => {
      result.current.syncSortToURL(sort);
    });

    expect(mockRouter.replace).toHaveBeenCalledWith(
      '/products', // Should be clean URL
      { scroll: false }
    );
  });

  it('should sync page to URL', () => {
    const { result } = renderHook(() => useURLSync());

    act(() => {
      result.current.syncPageToURL(3);
    });

    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.stringContaining('page=3'),
      { scroll: false }
    );
  });

  it('should not add page=1 to URL', () => {
    const { result } = renderHook(() => useURLSync());

    act(() => {
      result.current.syncPageToURL(1);
    });

    expect(mockRouter.replace).toHaveBeenCalledWith(
      '/products', // Should be clean URL
      { scroll: false }
    );
  });

  it('should reset page when filters change', () => {
    const { result } = renderHook(() => useURLSync());

    const filters: FilterState = {
      sizes: ['S'],
      colors: [],
      brands: [],
      priceRange: [0, 100],
      onSale: false
    };

    act(() => {
      result.current.syncFiltersToURL(filters);
    });

    // Should remove page parameter when filters change
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.not.stringContaining('page='),
      { scroll: false }
    );
  });

  it('should reset page when sort changes', () => {
    const { result } = renderHook(() => useURLSync());

    const sort: SortState = {
      option: 'price-low',
      direction: 'asc'
    };

    act(() => {
      result.current.syncSortToURL(sort);
    });

    // Should remove page parameter when sort changes
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.not.stringContaining('page='),
      { scroll: false }
    );
  });

  it('should call filter change callback when URL changes', () => {
    const onFiltersChange = vi.fn();
    
    mockSearchParams.get.mockImplementation((key: string) => {
      return key === 'sizes' ? 'S,M' : null;
    });

    renderHook(() => useURLSync({ onFiltersChange }));

    expect(onFiltersChange).toHaveBeenCalledWith({
      sizes: ['S', 'M']
    });
  });

  it('should call sort change callback when URL changes', () => {
    const onSortChange = vi.fn();
    
    mockSearchParams.get.mockImplementation((key: string) => {
      switch (key) {
        case 'sort': return 'price-low';
        case 'direction': return 'desc';
        default: return null;
      }
    });

    renderHook(() => useURLSync({ onSortChange }));

    expect(onSortChange).toHaveBeenCalledWith({
      option: 'price-low',
      direction: 'desc'
    });
  });

  it('should call page change callback when URL changes', () => {
    const onPageChange = vi.fn();
    
    mockSearchParams.get.mockImplementation((key: string) => {
      return key === 'page' ? '2' : null;
    });

    renderHook(() => useURLSync({ onPageChange }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should not call callbacks for empty parameters', () => {
    const onFiltersChange = vi.fn();
    const onSortChange = vi.fn();
    const onPageChange = vi.fn();

    renderHook(() => useURLSync({ 
      onFiltersChange, 
      onSortChange, 
      onPageChange 
    }));

    expect(onFiltersChange).not.toHaveBeenCalled();
    expect(onSortChange).not.toHaveBeenCalled();
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('should update URL with complex parameter combinations', () => {
    mockSearchParams.toString.mockReturnValue('existing=param');
    
    const { result } = renderHook(() => useURLSync());

    act(() => {
      result.current.updateURL({
        'new_param': 'value',
        'empty_param': null,
        'another_param': 'another_value'
      });
    });

    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.stringContaining('new_param=value'),
      { scroll: false }
    );
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.stringContaining('another_param=another_value'),
      { scroll: false }
    );
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.not.stringContaining('empty_param'),
      { scroll: false }
    );
  });
});