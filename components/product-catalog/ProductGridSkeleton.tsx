'use client';

import { twMerge } from 'tailwind-merge';

interface ProductGridSkeletonProps {
  count?: number;
  className?: string;
}

const ProductCardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
    {/* Image skeleton */}
    <div className="aspect-square bg-gray-200" />
    
    {/* Content skeleton */}
    <div className="p-4 space-y-3">
      {/* Brand */}
      <div className="h-4 bg-gray-200 rounded w-20" />
      
      {/* Product name */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
      
      {/* Rating */}
      <div className="flex items-center space-x-1">
        <div className="flex space-x-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-4 h-4 bg-gray-200 rounded" />
          ))}
        </div>
        <div className="h-4 bg-gray-200 rounded w-8" />
      </div>
      
      {/* Price */}
      <div className="h-6 bg-gray-200 rounded w-24" />
      
      {/* Color swatches */}
      <div className="flex items-center space-x-2">
        <div className="h-4 bg-gray-200 rounded w-12" />
        <div className="flex space-x-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-5 h-5 bg-gray-200 rounded-full" />
          ))}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <div className="flex-1 h-10 bg-gray-200 rounded" />
        <div className="w-10 h-10 bg-gray-200 rounded" />
      </div>
    </div>
  </div>
);

const ProductGridSkeleton = ({ 
  count = 12, 
  className 
}: ProductGridSkeletonProps) => {
  return (
    <div
      className={twMerge(
        // Base grid layout
        'grid gap-6',
        // Responsive grid columns
        'grid-cols-1', // Mobile: 1 column
        'sm:grid-cols-2', // Small screens: 2 columns
        'lg:grid-cols-3', // Large screens: 3 columns
        'xl:grid-cols-4', // Extra large: 4 columns
        '2xl:grid-cols-5', // 2XL: 5 columns
        // Padding and spacing
        'p-4 sm:p-6',
        className
      )}
      role="status"
      aria-label="Loading products"
    >
      {[...Array(count)].map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default ProductGridSkeleton;