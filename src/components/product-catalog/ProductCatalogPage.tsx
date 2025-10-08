'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useProductCatalog } from '@/hooks/useProductCatalog';
import type { ProductCatalogPageProps, BreadcrumbItem } from '@/types/product-catalog';
import CategoryHeader from '../../../components/product-catalog/CategoryHeader';
import FilterSidebar from '../../../components/product-catalog/FilterSidebar';
import ProductGrid from '../../../components/product-catalog/ProductGrid';

// Dynamically import MobileFilterDrawer to avoid SSR issues with document access
const MobileFilterDrawer = dynamic(
  () => import('../../../components/product-catalog/MobileFilterDrawer'),
  { 
    ssr: false,
    loading: () => null // Don't show anything while loading
  }
);

/**
 * Main Product Catalog Page Component
 * 
 * This component integrates all sub-components (header, filters, grid, pagination)
 * and manages the overall state and data flow for the product catalog.
 * 
 * Features:
 * - Responsive design with mobile filter drawer
 * - URL synchronization for filters, sorting, and pagination
 * - Loading and error states
 * - Cart and wishlist integration
 * - Comprehensive TypeScript typing
 */
function ProductCatalogPage({
  category,
  initialProducts,
  filters: filterOptions
}: ProductCatalogPageProps) {
  // Mobile filter drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Product catalog hook for state management
  const {
    state,
    actions,
    hasActiveFilters,
    totalPages,
    totalProducts
  } = useProductCatalog(initialProducts, filterOptions);

  // Check for mobile viewport
  // Ensure we're on the client before rendering components that use browser APIs
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check for mobile viewport
  useEffect(() => {
    if (!isClient) return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isClient]);

  // Generate breadcrumbs based on category
  const generateBreadcrumbs = (categoryName: string): BreadcrumbItem[] => {
    return [
      { label: 'Home', href: '/' },
      { label: 'Categories', href: '/categories' },
      { 
        label: categoryName.charAt(0).toUpperCase() + categoryName.slice(1), 
        href: `/catalog/${categoryName}` 
      }
    ];
  };

  const breadcrumbs = generateBreadcrumbs(category);

  // Handle mobile filter toggle
  const handleMobileFilterToggle = () => {
    setIsMobileFilterOpen(!isMobileFilterOpen);
  };

  // Handle mobile filter close
  const handleMobileFilterClose = () => {
    setIsMobileFilterOpen(false);
  };

  // Loading state
  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50" role="status" aria-label="Loading products">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50" role="alert">
        <div className="flex flex-col items-center justify-center h-64 px-4">
          <div className="text-center max-w-md">
            <svg 
              className="w-16 h-16 text-red-400 mx-auto mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">{state.error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Category Header */}
      <CategoryHeader
        category={category}
        productCount={totalProducts}
        breadcrumbs={breadcrumbs}
      />

      <div className="max-w-7xl mx-auto">
        <div className="flex">
          {/* Desktop Filter Sidebar */}
          {isClient && !isMobile && (
            <div className="hidden lg:block">
              <FilterSidebar
                filters={filterOptions}
                currentFilters={state.filters}
                onFilterChange={actions.setFilters}
                onClearFilters={actions.clearFilters}
                productCount={totalProducts}
              />
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 lg:ml-0">
            {/* Mobile Filter Button */}
            {isClient && isMobile && (
              <div className="lg:hidden p-4 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {totalProducts} {totalProducts === 1 ? 'product' : 'products'}
                    </span>
                    {hasActiveFilters && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Filtered
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleMobileFilterToggle}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    aria-label={`Open filters${hasActiveFilters ? ' (filters currently active)' : ''}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                    </svg>
                    Filters
                  </button>
                </div>
              </div>
            )}

            {/* Product Grid with integrated sorting and pagination */}
            <ProductGrid
              products={state.products}
              loading={state.loading}
              onAddToCart={actions.addToCart}
              onAddToWishlist={actions.addToWishlist}
              currentSort={state.sort}
              onSortChange={actions.setSort}
              productCount={totalProducts}
              currentPage={state.currentPage}
              totalPages={totalPages}
              onPageChange={actions.setPage}
              className="bg-white"
            />
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={handleMobileFilterClose}
        filters={filterOptions}
        currentFilters={state.filters}
        onFilterChange={actions.setFilters}
        onClearFilters={actions.clearFilters}
        productCount={totalProducts}
      />
    </div>
  );
}

export default ProductCatalogPage;