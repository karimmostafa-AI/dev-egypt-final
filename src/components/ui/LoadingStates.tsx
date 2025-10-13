'use client'

import React from 'react'
import { Loader2, Image as ImageIcon, Package, Truck, AlertTriangle } from 'lucide-react'
import { Button } from './button'

interface LoadingSkeletonProps {
  className?: string
}

export const ImageSkeleton: React.FC<LoadingSkeletonProps> = ({ className = '' }) => (
  <div className={`bg-gray-200 animate-pulse ${className}`}>
    <div className="flex items-center justify-center h-full">
      <ImageIcon className="w-12 h-12 text-gray-400" />
    </div>
  </div>
)

export const ProductCardSkeleton: React.FC<LoadingSkeletonProps> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
    <ImageSkeleton className="w-full aspect-square mb-4" />
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
      <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
    </div>
  </div>
)

export const ProductDetailsSkeleton: React.FC<LoadingSkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Image Gallery Skeleton */}
      <div className="space-y-4">
        <ImageSkeleton className="w-full aspect-[3/4]" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => (
            <ImageSkeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>

      {/* Product Info Skeleton */}
      <div className="space-y-6">
        {/* Brand */}
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>

        {/* Title */}
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>

        {/* Price */}
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>

        {/* Variations */}
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>

        {/* Add to Cart Button */}
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
)

export const PriceBreakdownSkeleton: React.FC<LoadingSkeletonProps> = ({ className = '' }) => (
  <div className={`bg-white border rounded-lg p-4 space-y-3 ${className}`}>
    <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="flex justify-between items-center">
        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
      </div>
    ))}
    <div className="border-t pt-3">
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
      </div>
    </div>
  </div>
)

export const ReviewsSkeleton: React.FC<LoadingSkeletonProps> = ({ className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-white border rounded-lg p-4 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/6 animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
      </div>
    ))}
  </div>
)

interface ProgressiveLoaderProps {
  isLoading: boolean
  error?: Error | null
  onRetry?: () => void
  children: React.ReactNode
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
  className?: string
}

export const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  isLoading,
  error,
  onRetry,
  children,
  loadingComponent,
  errorComponent,
  className = ''
}) => {
  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>
    }

    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-4">
            Failed to load content
          </p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>
    }

    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]} mr-2`} />
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  )
}

interface PageLoadingSpinnerProps {
  message?: string
  className?: string
}

export const PageLoadingSpinner: React.FC<PageLoadingSpinnerProps> = ({
  message = 'Loading...',
  className = ''
}) => (
  <div className={`min-h-[400px] flex items-center justify-center ${className}`}>
    <div className="text-center">
      <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
      <p className="text-lg text-gray-600">{message}</p>
    </div>
  </div>
)

interface SkeletonGridProps {
  items?: number
  className?: string
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({
  items = 6,
  className = ''
}) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
    {Array.from({ length: items }).map((_, index) => (
      <ProductCardSkeleton key={index} />
    ))}
  </div>
)

export default {
  ImageSkeleton,
  ProductCardSkeleton,
  ProductDetailsSkeleton,
  PriceBreakdownSkeleton,
  ReviewsSkeleton,
  ProgressiveLoader,
  LoadingSpinner,
  PageLoadingSpinner,
  SkeletonGrid
}