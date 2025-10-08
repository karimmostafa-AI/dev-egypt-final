'use client';

import { useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FilterState, SortState } from '@/types/product-catalog';

interface URLSyncOptions {
  onFiltersChange?: (filters: FilterState) => void;
  onSortChange?: (sort: SortState) => void;
  onPageChange?: (page: number) => void;
}

/**
 * Hook for synchronizing state with URL parameters
 */
export const useURLSync = (options: URLSyncOptions = {}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse filters from URL
  const parseFiltersFromURL = useCallback((): Partial<FilterState> => {
    const filters: Partial<FilterState> = {};

    const sizes = searchParams.get('sizes');
    if (sizes) {
      filters.sizes = sizes.split(',').filter(Boolean);
    }

    const colors = searchParams.get('colors');
    if (colors) {
      filters.colors = colors.split(',').filter(Boolean);
    }

    const brands = searchParams.get('brands');
    if (brands) {
      filters.brands = brands.split(',').filter(Boolean);
    }

    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    if (minPrice || maxPrice) {
      filters.priceRange = [
        minPrice ? Number(minPrice) : 0,
        maxPrice ? Number(maxPrice) : 1000
      ];
    }

    const onSale = searchParams.get('on_sale');
    if (onSale === 'true') {
      filters.onSale = true;
    }

    return filters;
  }, [searchParams]);

  // Parse sort from URL
  const parseSortFromURL = useCallback((): Partial<SortState> => {
    const sort: Partial<SortState> = {};

    const sortOption = searchParams.get('sort');
    if (sortOption) {
      sort.option = sortOption as any;
    }

    const direction = searchParams.get('direction');
    if (direction === 'desc' || direction === 'asc') {
      sort.direction = direction;
    }

    return sort;
  }, [searchParams]);

  // Parse page from URL
  const parsePageFromURL = useCallback((): number => {
    const page = searchParams.get('page');
    return page ? Math.max(1, Number(page)) : 1;
  }, [searchParams]);

  // Update URL with new parameters
  const updateURL = useCallback((params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });

    const newURL = newParams.toString() 
      ? `?${newParams.toString()}` 
      : window.location.pathname;
    
    router.replace(newURL, { scroll: false });
  }, [searchParams, router]);

  // Sync filters to URL
  const syncFiltersToURL = useCallback((filters: FilterState) => {
    const params: Record<string, string | null> = {
      sizes: filters.sizes.length > 0 ? filters.sizes.join(',') : null,
      colors: filters.colors.length > 0 ? filters.colors.join(',') : null,
      brands: filters.brands.length > 0 ? filters.brands.join(',') : null,
      min_price: filters.priceRange[0] > 0 ? filters.priceRange[0].toString() : null,
      max_price: filters.priceRange[1] < 1000 ? filters.priceRange[1].toString() : null,
      on_sale: filters.onSale ? 'true' : null,
      page: null // Reset page when filters change
    };

    updateURL(params);
  }, [updateURL]);

  // Sync sort to URL
  const syncSortToURL = useCallback((sort: SortState) => {
    const params: Record<string, string | null> = {
      sort: sort.option !== 'popularity' ? sort.option : null,
      direction: sort.direction !== 'asc' ? sort.direction : null,
      page: null // Reset page when sort changes
    };

    updateURL(params);
  }, [updateURL]);

  // Sync page to URL
  const syncPageToURL = useCallback((page: number) => {
    const params: Record<string, string | null> = {
      page: page > 1 ? page.toString() : null
    };

    updateURL(params);
  }, [updateURL]);

  // Listen for URL changes and notify callbacks
  useEffect(() => {
    if (options.onFiltersChange) {
      const filters = parseFiltersFromURL();
      if (Object.keys(filters).length > 0) {
        // Only call if there are actual filter parameters
        options.onFiltersChange(filters as FilterState);
      }
    }
  }, [searchParams, options.onFiltersChange, parseFiltersFromURL]);

  useEffect(() => {
    if (options.onSortChange) {
      const sort = parseSortFromURL();
      if (Object.keys(sort).length > 0) {
        options.onSortChange(sort as SortState);
      }
    }
  }, [searchParams, options.onSortChange, parseSortFromURL]);

  useEffect(() => {
    if (options.onPageChange) {
      const page = parsePageFromURL();
      if (page > 1) {
        options.onPageChange(page);
      }
    }
  }, [searchParams, options.onPageChange, parsePageFromURL]);

  return {
    parseFiltersFromURL,
    parseSortFromURL,
    parsePageFromURL,
    syncFiltersToURL,
    syncSortToURL,
    syncPageToURL,
    updateURL
  };
};