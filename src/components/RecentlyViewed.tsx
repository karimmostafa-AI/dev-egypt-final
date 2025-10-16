'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, X, ShoppingCart, Heart } from 'lucide-react';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { Product } from '../types/product';

interface RecentlyViewedProps {
  maxItems?: number;
  showClearButton?: boolean;
  className?: string;
}

export default function RecentlyViewed({
  maxItems = 6,
  showClearButton = true,
  className = ""
}: RecentlyViewedProps) {
  const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed();
  const [displayedItems, setDisplayedItems] = useState(recentlyViewed.slice(0, maxItems));

  useEffect(() => {
    setDisplayedItems(recentlyViewed.slice(0, maxItems));
  }, [recentlyViewed, maxItems]);

  const getImageSrc = (product: Product) => {
    if ((product as any).mainImageUrl) {
      return (product as any).mainImageUrl;
    }
    if ((product as any).mainImageId) {
      return `/api/storage/files/${(product as any).mainImageId}`;
    }
    if ((product as any).featuredImageId) {
      return `/api/storage/files/${(product as any).featuredImageId}`;
    }
    if ((product as any).media_id) {
      if ((product as any).media_id.startsWith('http://') || (product as any).media_id.startsWith('https://')) {
        return (product as any).media_id;
      }
      return `/api/storage/files/${(product as any).media_id}`;
    }
    return 'https://via.placeholder.com/200x200?text=No+Image';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  if (displayedItems.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Recently Viewed</h3>
          </div>

          {showClearButton && displayedItems.length > 0 && (
            <button
              onClick={clearRecentlyViewed}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {displayedItems.map(({ product, viewedAt }) => (
            <div key={product.$id} className="group relative">
              <Link
                href={`/product/${product.slug}`}
                className="block bg-white rounded-lg border hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  <img
                    src={getImageSrc(product)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallbackIcon = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                      if (fallbackIcon) {
                        fallbackIcon.classList.remove('hidden');
                      }
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-2xl fallback-icon">
                    📦
                  </div>

                  {/* Time Badge */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {formatTimeAgo(viewedAt)}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-3">
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                    {product.name}
                  </h4>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    {product.discount_price > 0 && product.discount_price < product.price ? (
                      <>
                        <span className="font-bold text-gray-900 text-sm">
                          ${product.discount_price.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500 line-through">
                          ${product.price.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="font-bold text-gray-900 text-sm">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              {/* Quick Actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex flex-col gap-1">
                  <button className="p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors">
                    <Heart className="h-3 w-3 text-gray-600" />
                  </button>
                  <button className="p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors">
                    <ShoppingCart className="h-3 w-3 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        {recentlyViewed.length > maxItems && (
          <div className="text-center mt-4">
            <Link
              href="/recently-viewed"
              className="text-sm text-[#173a6a] hover:text-[#1e4a7a] font-medium"
            >
              View all recently viewed ({recentlyViewed.length})
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}