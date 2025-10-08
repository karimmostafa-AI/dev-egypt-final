'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { 
  Product, 
  FilterState, 
  FilterOptions, 
  SortState, 
  CatalogState,
  UseProductCatalogReturn 
} from '@/types/product-catalog';
import { 
  processProducts, 
  getSortOption, 
  getSortDirection,
  validateFilters 
} from '@/utils/filterUtils';
import { useFilters } from './useFilters';
import { useExpensiveMemo, PerformanceMonitor } from '@/utils/performanceUtils';
import { useDebouncedCallback } from './useDebounce';

const PRODUCTS_PER_PAGE = 12;

/**
 * Main hook for product catalog state management
 */
export const useProductCatalog = (
  initialProducts: Product[],
  filterOptions: FilterOptions
): UseProductCatalogReturn => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Filter management
  const { filters, setFilters, clearFilters, hasActiveFilters } = useFilters(filterOptions);

  // Sort state from URL
  const getSortFromURL = useCallback((): SortState => {
    const sortOption = getSortOption(searchParams.get('sort'));
    const sortDirection = getSortDirection(searchParams.get('direction'));
    return { option: sortOption, direction: sortDirection };
  }, [searchParams]);

  // Page state from URL
  const getPageFromURL = useCallback((): number => {
    const page = Number(searchParams.get('page')) || 1;
    return Math.max(1, page);
  }, [searchParams]);

  // Local state
  const [products] = useState<Product[]>(initialProducts);
  const [sort, setSortState] = useState<SortState>(getSortFromURL);
  const [currentPage, setCurrentPageState] = useState<number>(getPageFromURL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Process products with filters and sorting - optimized with performance monitoring
  const filteredAndSortedProducts = useExpensiveMemo(() => {
    try {
      const monitor = PerformanceMonitor.getInstance();
      const stopTiming = monitor.startTiming('process-products');
      
      const result = processProducts(products, filters, sort);
      
      stopTiming();
      return result;
    } catch (err) {
      setError('Error processing products');
      return [];
    }
  }, [products, filters, sort], 'process-products');

  // Pagination calculations - memoized for performance
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredAndSortedProducts.length / PRODUCTS_PER_PAGE);
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    const paginatedProducts = filteredAndSortedProducts.slice(startIndex, endIndex);
    
    return { totalPages, paginatedProducts };
  }, [filteredAndSortedProducts, currentPage]);

  const { totalPages, paginatedProducts } = paginationData;

  // Update URL when sort changes - debounced to prevent excessive URL updates
  const updateSortURL = useDebouncedCallback((newSort: SortState) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newSort.option !== 'popularity') {
      params.set('sort', newSort.option);
    } else {
      params.delete('sort');
    }

    if (newSort.direction !== 'asc') {
      params.set('direction', newSort.direction);
    } else {
      params.delete('direction');
    }

    // Reset to page 1 when sorting changes
    params.delete('page');

    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(newURL, { scroll: false });
  }, 150);

  // Update URL when page changes - debounced to prevent excessive URL updates
  const updatePageURL = useDebouncedCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newPage > 1) {
      params.set('page', newPage.toString());
    } else {
      params.delete('page');
    }

    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(newURL, { scroll: false });
  }, 100);

  // Set sort with URL synchronization
  const setSort = useCallback((newSort: SortState) => {
    setSortState(newSort);
    setCurrentPageState(1); // Reset to first page when sorting
    updateSortURL(newSort);
  }, [updateSortURL]);

  // Set page with URL synchronization
  const setPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setCurrentPageState(validPage);
    updatePageURL(validPage);
  }, [totalPages, updatePageURL]);

  // Reset page when filters change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setPage(1);
    }
  }, [currentPage, totalPages, setPage]);

  // Validate filters on mount and when filter options change
  useEffect(() => {
    const validatedFilters = validateFilters(filters, {
      sizes: filterOptions.availableSizes,
      colors: filterOptions.availableColors.map(c => c.name),
      brands: filterOptions.availableBrands,
      priceRange: filterOptions.priceRange
    });

    // Only update if validation changed something
    if (JSON.stringify(validatedFilters) !== JSON.stringify(filters)) {
      setFilters(validatedFilters);
    }
  }, [filterOptions]); // Intentionally not including filters and setFilters to avoid infinite loop

  // Cart and wishlist actions (placeholder implementations)
  const addToCart = useCallback((productId: string) => {
    // TODO: Implement cart functionality
    console.log('Adding to cart:', productId);
  }, []);

  const addToWishlist = useCallback((productId: string) => {
    // TODO: Implement wishlist functionality
    console.log('Adding to wishlist:', productId);
  }, []);

  // Clear filters and reset page
  const handleClearFilters = useCallback(() => {
    clearFilters();
    setCurrentPageState(1);
  }, [clearFilters]);

  // State object
  const state: CatalogState = {
    products: paginatedProducts,
    filteredProducts: filteredAndSortedProducts,
    filters,
    sort,
    currentPage,
    loading,
    error
  };

  // Actions object
  const actions = {
    setFilters,
    setSort,
    setPage,
    clearFilters: handleClearFilters,
    addToCart,
    addToWishlist
  };

  return {
    state,
    actions,
    hasActiveFilters,
    // Pagination data
    totalPages,
    totalProducts: filteredAndSortedProducts.length
  };
};