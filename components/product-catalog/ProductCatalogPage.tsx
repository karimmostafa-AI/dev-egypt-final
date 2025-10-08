'use client';

import { useState, useEffect, useRef } from 'react';
import { useProductCatalog } from '@/hooks/useProductCatalog';
import type { ProductCatalogPageProps, BreadcrumbItem } from '@/types/product-catalog';
import { ScreenReaderAnnouncer, generateId, AriaHelpers } from '@/utils/accessibility';
import { usePerformanceMonitor, measureWebVitals } from '@/utils/performance';
import CategoryHeader from './CategoryHeader';
import FilterSidebar from './FilterSidebar';
import ProductGrid from './ProductGrid';
import MobileFilterDrawer from './MobileFilterDrawer';

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

  // Accessibility refs and state
  const mainContentRef = useRef<HTMLDivElement>(null);
  const skipLinkRef = useRef<HTMLAnchorElement>(null);
  const announcer = ScreenReaderAnnouncer.getInstance();
  const [regionIds] = useState({
    main: generateId('main-content'),
    filters: generateId('filters'),
    results: generateId('results'),
    skipLink: generateId('skip-link')
  });

  // Performance monitoring
  const performanceMonitor = usePerformanceMonitor('ProductCatalogPage');

  // Product catalog hook for state management
  const {
    state,
    actions,
    hasActiveFilters,
    totalPages,
    totalProducts
  } = useProductCatalog(initialProducts, filterOptions);

  // Initialize performance monitoring and web vitals
  useEffect(() => {
    performanceMonitor.startMeasurement();
    measureWebVitals();
    
    return () => {
      const renderTime = performanceMonitor.endMeasurement();
      if (process.env.NODE_ENV === 'development') {
        console.log(`ProductCatalogPage render time: ${renderTime}ms`);
      }
    };
  }, [performanceMonitor]);

  // Check for mobile viewport with debouncing for performance
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const checkMobile = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 1024); // lg breakpoint
      }, 100); // Debounce resize events
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timeoutId);
    };
  }, []);

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
    const newState = !isMobileFilterOpen;
    setIsMobileFilterOpen(newState);
    
    // Announce state change to screen readers
    announcer.announce(
      newState ? 'Filters opened' : 'Filters closed',
      'polite'
    );
  };

  // Handle mobile filter close
  const handleMobileFilterClose = () => {
    setIsMobileFilterOpen(false);
    announcer.announce('Filters closed', 'polite');
  };

  // Handle skip link
  const handleSkipToMain = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    mainContentRef.current?.focus();
    announcer.announce('Skipped to main content', 'polite');
  };

  // Announce product count changes
  useEffect(() => {
    if (!state.loading && totalProducts !== undefined) {
      const message = totalProducts === 0 
        ? 'No products found' 
        : `${totalProducts} ${totalProducts === 1 ? 'product' : 'products'} found`;
      announcer.announce(message, 'polite');
    }
  }, [totalProducts, state.loading, announcer]);

  // Loading state
  if (state.loading) {
    return (
      <div 
        className="min-h-screen bg-gray-50" 
        role="status" 
        aria-live="polite"
        aria-label="Loading products"
        {...AriaHelpers.loading(true, 'Loading product catalog')}
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
              aria-hidden="true"
            ></div>
            <p className="text-gray-600" id="loading-message">
              Loading products...
            </p>
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
              className="px-6 py-2 bg-[#173a6a] text-white rounded-md hover:bg-[#1e4a7a] focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:ring-offset-2 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mobile-optimized" style={{ paddingTop: 0 }}>
      {/* Skip Link for keyboard navigation */}
      <a
        ref={skipLinkRef}
        href={`#${regionIds.main}`}
        onClick={handleSkipToMain}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#173a6a] focus:text-white focus:rounded focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Category Header */}
      <CategoryHeader
        category={category}
        productCount={totalProducts}
        breadcrumbs={breadcrumbs}
      />

      <div className="max-w-[1920px] mx-auto px-[50px] sm:px-4 lg:px-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Desktop Filter Sidebar */}
          {!isMobile && (
            <aside 
              className="hidden lg:block lg:w-80 lg:flex-shrink-0"
              aria-label="Product filters"
              id={regionIds.filters}
            >
              <div className="sticky top-4">
                <FilterSidebar
                  filters={filterOptions}
                  currentFilters={state.filters}
                  onFilterChange={actions.setFilters}
                  onClearFilters={actions.clearFilters}
                  productCount={totalProducts}
                />
              </div>
            </aside>
          )}

          {/* Main Content Area */}
          <main 
            className="flex-1 min-w-0"
            id={regionIds.main}
            ref={mainContentRef}
            tabIndex={-1}
            aria-label="Product catalog main content"
          >
            {/* Mobile Filter Button */}
            {isMobile && (
              <div className="lg:hidden p-3 sm:p-4 bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-sm text-gray-600 font-medium"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {totalProducts} {totalProducts === 1 ? 'product' : 'products'}
                    </span>
                    {hasActiveFilters && (
                      <span 
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium"
                        aria-label="Filters are currently active"
                      >
                        Filtered
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleMobileFilterToggle}
                    className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-[var(--ua-gray-border)] rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:ring-offset-2 transition-colors active:scale-95 min-h-[44px]"
                    aria-label={`${isMobileFilterOpen ? 'Close' : 'Open'} filters${hasActiveFilters ? ' (filters currently active)' : ''}`}
                    aria-expanded={isMobileFilterOpen}
                    aria-controls="mobile-filter-drawer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                    </svg>
                    <span className="hidden xs:inline">Filters</span>
                  </button>
                </div>
              </div>
            )}

            {/* Product Grid with integrated sorting and pagination */}
            <section 
              id={regionIds.results}
              aria-label="Product search results"
              aria-live="polite"
              aria-atomic="false"
            >
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
                className="bg-white rounded-lg lg:shadow-sm"
              />
            </section>
          </main>
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