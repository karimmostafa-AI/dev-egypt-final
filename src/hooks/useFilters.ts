'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FilterState, FilterOptions } from '@/types/product-catalog';

// Default filter state
const DEFAULT_FILTERS: FilterState = {
  sizes: [],
  colors: [],
  brands: [],
  priceRange: [0, 1000],
  onSale: false
};

// URL parameter keys
const URL_PARAMS = {
  sizes: 'sizes',
  colors: 'colors',
  brands: 'brands',
  minPrice: 'min_price',
  maxPrice: 'max_price',
  onSale: 'on_sale'
} as const;

/**
 * Custom hook for managing filter state with URL synchronization
 */
export const useFilters = (filterOptions: FilterOptions) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL parameters
  const getFiltersFromURL = useCallback((): FilterState => {
    try {
      const sizes = searchParams.get(URL_PARAMS.sizes)?.split(',').filter(Boolean) || [];
      const colors = searchParams.get(URL_PARAMS.colors)?.split(',').filter(Boolean) || [];
      const brands = searchParams.get(URL_PARAMS.brands)?.split(',').filter(Boolean) || [];
      
      // Validate and parse price parameters
      const minPriceParam = searchParams.get(URL_PARAMS.minPrice);
      const maxPriceParam = searchParams.get(URL_PARAMS.maxPrice);
      
      const minPrice = minPriceParam ? Math.max(0, Number(minPriceParam)) : filterOptions.priceRange[0];
      const maxPrice = maxPriceParam ? Math.max(0, Number(maxPriceParam)) : filterOptions.priceRange[1];
      
      // Ensure min <= max
      const validMinPrice = isNaN(minPrice) ? filterOptions.priceRange[0] : minPrice;
      const validMaxPrice = isNaN(maxPrice) ? filterOptions.priceRange[1] : maxPrice;
      const finalMinPrice = Math.min(validMinPrice, validMaxPrice);
      const finalMaxPrice = Math.max(validMinPrice, validMaxPrice);
      
      const onSale = searchParams.get(URL_PARAMS.onSale) === 'true';

      return {
        sizes,
        colors,
        brands,
        priceRange: [finalMinPrice, finalMaxPrice],
        onSale
      };
    } catch (error) {
      console.warn('Error parsing filters from URL, using defaults:', error);
      return {
        ...DEFAULT_FILTERS,
        priceRange: filterOptions?.priceRange || [0, 1000]
      };
    }
  }, [searchParams, filterOptions?.priceRange]);

  const [filters, setFiltersState] = useState<FilterState>(() => getFiltersFromURL());

  // Update URL parameters when filters change
  const updateURL = useCallback((newFilters: FilterState) => {
    const params = new URLSearchParams(searchParams.toString());

    // Update or remove size parameter
    if (newFilters.sizes.length > 0) {
      params.set(URL_PARAMS.sizes, newFilters.sizes.join(','));
    } else {
      params.delete(URL_PARAMS.sizes);
    }

    // Update or remove color parameter
    if (newFilters.colors.length > 0) {
      params.set(URL_PARAMS.colors, newFilters.colors.join(','));
    } else {
      params.delete(URL_PARAMS.colors);
    }

    // Update or remove brand parameter
    if (newFilters.brands.length > 0) {
      params.set(URL_PARAMS.brands, newFilters.brands.join(','));
    } else {
      params.delete(URL_PARAMS.brands);
    }

    // Update or remove price parameters
    if (newFilters.priceRange[0] !== filterOptions.priceRange[0]) {
      params.set(URL_PARAMS.minPrice, newFilters.priceRange[0].toString());
    } else {
      params.delete(URL_PARAMS.minPrice);
    }

    if (newFilters.priceRange[1] !== filterOptions.priceRange[1]) {
      params.set(URL_PARAMS.maxPrice, newFilters.priceRange[1].toString());
    } else {
      params.delete(URL_PARAMS.maxPrice);
    }

    // Update or remove sale parameter
    if (newFilters.onSale) {
      params.set(URL_PARAMS.onSale, 'true');
    } else {
      params.delete(URL_PARAMS.onSale);
    }

    // Update URL without page reload
    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(newURL, { scroll: false });
  }, [searchParams, router, filterOptions.priceRange]);

  // Set filters with URL synchronization
  const setFilters = useCallback((newFilters: FilterState) => {
    setFiltersState(newFilters);
    updateURL(newFilters);
  }, [updateURL]);

  // Apply a single filter with validation - memoized for performance
  const applyFilter = useCallback((key: keyof FilterState, value: any) => {
    try {
      let validatedValue = value;
      
      // Validate based on filter type
      switch (key) {
        case 'sizes':
        case 'colors':
        case 'brands':
          validatedValue = Array.isArray(value) ? value : [];
          break;
        case 'priceRange':
          if (Array.isArray(value) && value.length === 2) {
            const [min, max] = value;
            const validMin = Math.max(0, Number(min) || 0);
            const validMax = Math.max(validMin, Number(max) || filterOptions.priceRange[1]);
            validatedValue = [validMin, validMax];
          } else {
            validatedValue = filterOptions.priceRange;
          }
          break;
        case 'onSale':
          validatedValue = Boolean(value);
          break;
        default:
          console.warn(`Unknown filter key: ${key}`);
          return;
      }
      
      const newFilters = { ...filters, [key]: validatedValue };
      setFilters(newFilters);
    } catch (error) {
      console.error('Error applying filter:', error);
    }
  }, [filters, setFilters, filterOptions.priceRange]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const clearedFilters: FilterState = {
      ...DEFAULT_FILTERS,
      priceRange: filterOptions.priceRange
    };
    setFilters(clearedFilters);
  }, [setFilters, filterOptions.priceRange]);

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.sizes.length > 0 ||
      filters.colors.length > 0 ||
      filters.brands.length > 0 ||
      filters.onSale ||
      filters.priceRange[0] !== filterOptions.priceRange[0] ||
      filters.priceRange[1] !== filterOptions.priceRange[1]
    );
  }, [filters, filterOptions.priceRange]);

  // Toggle a filter value (for checkboxes)
  const toggleFilter = useCallback((key: 'sizes' | 'colors' | 'brands', value: string) => {
    const currentValues = filters[key];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    applyFilter(key, newValues);
  }, [filters, applyFilter]);

  // Reset specific filter
  const resetFilter = useCallback((key: keyof FilterState) => {
    switch (key) {
      case 'sizes':
      case 'colors':
      case 'brands':
        applyFilter(key, []);
        break;
      case 'priceRange':
        applyFilter(key, filterOptions.priceRange);
        break;
      case 'onSale':
        applyFilter(key, false);
        break;
    }
  }, [applyFilter, filterOptions.priceRange]);

  return {
    filters,
    setFilters,
    applyFilter,
    toggleFilter,
    resetFilter,
    clearFilters,
    hasActiveFilters
  };
};