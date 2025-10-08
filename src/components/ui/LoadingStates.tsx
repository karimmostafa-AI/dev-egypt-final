// Loading States and Skeleton Components
// Provides optimized loading UI for better user experience

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'rectangular' | 'circular' | 'text' | 'rounded';
}

// Base Skeleton Component
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  variant = 'rectangular'
}) => {
  const baseClasses = 'animate-pulse bg-gray-200';

  const variantClasses = {
    rectangular: 'rounded-none',
    circular: 'rounded-full',
    text: 'rounded',
    rounded: 'rounded-md'
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
};

// Product Card Skeleton
export const ProductCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Image skeleton */}
      <Skeleton className="aspect-square w-full" variant="rectangular" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <Skeleton width="80%" height="1.25rem" variant="text" />
        <Skeleton width="60%" height="1rem" variant="text" />
        <Skeleton width="40%" height="1rem" variant="text" />
        <Skeleton width="100%" height="2.5rem" variant="rounded" />
      </div>
    </div>
  );
};

// Product Grid Skeleton
export const ProductGridSkeleton: React.FC<{
  columns?: 2 | 3 | 4 | 5;
  count?: number;
  className?: string;
}> = ({ columns = 4, count = 8, className = '' }) => {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5'
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

// Brand Card Skeleton
export const BrandCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <Skeleton className="aspect-video w-full" variant="rectangular" />
      <div className="p-4 space-y-3">
        <Skeleton width="70%" height="1.5rem" variant="text" />
        <Skeleton width="90%" height="1rem" variant="text" />
        <Skeleton width="50%" height="1rem" variant="text" />
      </div>
    </div>
  );
};

// Page Loading Spinner
export const PageLoadingSpinner: React.FC<{
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ message = 'Loading...', className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4`} />
      {message && (
        <p className="text-gray-600 text-sm">{message}</p>
      )}
    </div>
  );
};

// Loading Overlay
export const LoadingOverlay: React.FC<{
  isVisible: boolean;
  message?: string;
  className?: string;
}> = ({ isVisible, message = 'Loading...', className = '' }) => {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg p-6 flex flex-col items-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  );
};

// Progressive Loading Container
export const ProgressiveLoader: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}> = ({ isLoading, children, fallback, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-white bg-opacity-75 flex items-center justify-center">
          {fallback || <PageLoadingSpinner />}
        </div>
      )}
      <div className={isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}>
        {children}
      </div>
    </div>
  );
};

// Image Loading Skeleton
export const ImageSkeleton: React.FC<{
  aspectRatio?: number;
  className?: string;
  showGradient?: boolean;
}> = ({ aspectRatio = 1, className = '', showGradient = false }) => {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      <Skeleton className="w-full h-full" variant="rectangular" />
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
      )}
    </div>
  );
};

// Text Loading Skeleton
export const TextSkeleton: React.FC<{
  lines?: number;
  className?: string;
  width?: string[];
}> = ({ lines = 3, className = '', width = [] }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={width[index] || (index === lines - 1 ? '60%' : '100%')}
          height="1rem"
          variant="text"
        />
      ))}
    </div>
  );
};

// Button Loading State
export const ButtonLoading: React.FC<{
  children: React.ReactNode;
  isLoading: boolean;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}> = ({ children, isLoading, loadingText = 'Loading...', className = '', disabled = false, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`relative ${className}`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          <span>{loadingText}</span>
        </div>
      )}
      <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  );
};

// Form Loading State
export const FormSkeleton: React.FC<{
  fields?: number;
  hasSubmitButton?: boolean;
  className?: string;
}> = ({ fields = 4, hasSubmitButton = true, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index}>
          <Skeleton width="30%" height="1rem" variant="text" className="mb-2" />
          <Skeleton width="100%" height="2.5rem" variant="rounded" />
        </div>
      ))}
      {hasSubmitButton && (
        <div className="pt-4">
          <Skeleton width="40%" height="2.5rem" variant="rounded" />
        </div>
      )}
    </div>
  );
};

// Table Loading Skeleton
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} height="1.25rem" variant="text" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="1rem" variant="text" />
          ))}
        </div>
      ))}
    </div>
  );
};

// Admin Panel Loading States
export const AdminPanelSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton width="200px" height="2rem" variant="text" />
          <Skeleton width="300px" height="1rem" variant="text" />
        </div>
        <Skeleton width="120px" height="2.5rem" variant="rounded" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex space-x-4 border-b">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} width="100px" height="3rem" variant="text" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3">
              <Skeleton width="80%" height="1.25rem" variant="text" />
              <Skeleton width="100%" height="2rem" variant="rounded" />
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-50 rounded-lg p-6">
            <Skeleton width="60%" height="1.5rem" variant="text" className="mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index}>
                  <Skeleton width="80%" height="1rem" variant="text" className="mb-2" />
                  <Skeleton width="100%" height="2.5rem" variant="rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Lazy Section Loader
export const LazySectionLoader: React.FC<{
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}> = ({ isLoading, error, onRetry, children, fallback, className = '' }) => {
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">{error.message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={className}>
        {fallback || <ProductGridSkeleton count={6} />}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
};

// Performance Loading Indicator
export const PerformanceIndicator: React.FC<{
  loadTime?: number;
  className?: string;
}> = ({ loadTime, className = '' }) => {
  if (!loadTime) return null;

  const getPerformanceColor = (time: number) => {
    if (time < 1000) return 'text-green-600'; // Fast
    if (time < 2000) return 'text-yellow-600'; // Moderate
    return 'text-red-600'; // Slow
  };

  const getPerformanceText = (time: number) => {
    if (time < 1000) return 'Fast';
    if (time < 2000) return 'Moderate';
    return 'Slow';
  };

  return (
    <div className={`fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-3 text-sm ${className}`}>
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${getPerformanceColor(loadTime)}`} />
        <span className="text-gray-700">
          Loaded in {Math.round(loadTime)}ms ({getPerformanceText(loadTime)})
        </span>
      </div>
    </div>
  );
};

export default Skeleton;