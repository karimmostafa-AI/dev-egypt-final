'use client';

import { memo, useCallback, useMemo } from 'react';
import { twMerge } from 'tailwind-merge';
import type { ProductGridProps, SortState } from '@/types/product-catalog';
import ProductCard from './ProductCard';
import ProductGridSkeleton from './ProductGridSkeleton';
import SortControls from './SortControls';
import Pagination from './Pagination';

const ProductGrid = memo(({
    products,
    loading = false,
    onAddToCart,
    onAddToWishlist,
    currentSort,
    onSortChange,
    productCount,
    className,
    // Pagination props
    currentPage,
    totalPages,
    onPageChange,
    paginationLoading
}: ProductGridProps & {
    currentSort?: SortState;
    onSortChange?: (sort: SortState) => void;
    productCount?: number;
    className?: string;
    // Pagination props
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
    paginationLoading?: boolean;
}) => {
    const handleColorChange = useCallback((productId: string, colorName: string) => {
        // This would typically update the product state or trigger a callback
        // For now, we'll just log it as the color change is handled within ProductCard
        console.log(`Color changed for product ${productId} to ${colorName}`);
    }, []);

    // Memoize header rendering to avoid unnecessary re-renders
    const headerContent = useMemo(() => {
        if (!currentSort || !onSortChange) return null;

        return (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    {productCount !== undefined && (
                        <span className="text-sm sm:text-base text-gray-600 font-medium">
                            {productCount === 0 ? 'No products found' :
                                productCount === 1 ? '1 product' :
                                    `${productCount.toLocaleString()} products`}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-sm text-gray-600 hidden sm:inline font-medium">Sort by:</span>
                    <SortControls
                        currentSort={currentSort}
                        onSortChange={onSortChange}
                    />
                </div>
            </div>
        );
    }, [currentSort, onSortChange, productCount]);

    if (loading) {
        return <ProductGridSkeleton />;
    }

    if (products.length === 0) {
        return (
            <div className={className}>
                {headerContent}
                <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="text-center">
                        <svg
                            className="w-16 h-16 text-gray-300 mx-auto mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                            />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No products found
                        </h3>
                        <p className="text-gray-600 max-w-md">
                            We couldn't find any products matching your criteria. Try adjusting your filters or search terms.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            {headerContent}
            <div
                className={twMerge(
                    // Base grid layout with responsive gaps
                    'grid gap-3 sm:gap-4 lg:gap-6',
                    // Responsive grid columns optimized for different screen sizes
                    'grid-cols-1', // Mobile portrait: 1 column
                    'xs:grid-cols-2', // Mobile landscape: 2 columns
                    'sm:grid-cols-2', // Small tablets: 2 columns
                    'md:grid-cols-3', // Medium tablets: 3 columns
                    'lg:grid-cols-3', // Large screens with sidebar: 3 columns
                    'xl:grid-cols-4', // Extra large: 4 columns
                    '2xl:grid-cols-4', // 2XL: 4 columns (adjusted for better spacing)
                    // Responsive padding
                    'p-3 sm:p-4 lg:p-6',
                    // Auto-fit for flexible layouts
                    'auto-rows-fr'
                )}
                role="grid"
                aria-label="Product grid"
                style={{
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
                }}
            >
                {products.map((product) => (
                    <div
                        key={product.id}
                        role="gridcell"
                        className="flex"
                    >
                        <ProductCard
                            product={product}
                            onAddToCart={onAddToCart}
                            onAddToWishlist={onAddToWishlist}
                            onColorChange={handleColorChange}
                            className="w-full"
                        />
                    </div>
                ))}
            </div>
            
            {/* Pagination */}
            {totalPages && totalPages > 1 && onPageChange && (
                <Pagination
                    currentPage={currentPage || 1}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                    loading={paginationLoading}
                />
            )}
        </div>
    );
});

ProductGrid.displayName = 'ProductGrid';

export default ProductGrid;