'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MainLayout from '../../components/MainLayout';
import { useWishlist } from '../../hooks/useWishlist';
import { Product } from '../../types/product';
import { Heart, ShoppingCart, Trash2, ArrowRight, Package } from 'lucide-react';

interface WishlistItemWithProduct extends Product {
  wishlistAddedAt: Date;
}

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, isInWishlist } = useWishlist(true);
  const [products, setProducts] = useState<WishlistItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock products data for wishlist items
  const mockProducts: Record<string, WishlistItemWithProduct> = {
    'prod_1': {
      $id: 'prod_1',
      name: 'Dev Egypt Professional Scrub Top',
      slug: 'dev-egypt-professional-scrub-top',
      price: 299,
      discount_price: 249,
      category_id: 'cat_1',
      brand_id: 'brand_1',
      units: 1,
      min_order_quantity: 1,
      is_featured: true,
      is_new: true,
      is_active: true,
      hasVariations: false,
      media_id: 'https://via.placeholder.com/300x400?text=Scrub+Top',
      description: 'High-quality professional scrub top for healthcare workers',
      meta_title: 'Dev Egypt Professional Scrub Top',
      meta_description: 'High-quality professional scrub top for healthcare workers',
      meta_keywords: 'scrub top, medical scrubs, professional',
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      wishlistAddedAt: new Date('2024-01-10')
    },
    'prod_2': {
      $id: 'prod_2',
      name: 'Cherokee Classic Scrub Set',
      slug: 'cherokee-classic-scrub-set',
      price: 449,
      discount_price: 399,
      category_id: 'cat_2',
      brand_id: 'brand_2',
      units: 1,
      min_order_quantity: 1,
      is_featured: false,
      is_new: false,
      is_active: true,
      hasVariations: false,
      media_id: 'https://via.placeholder.com/300x400?text=Scrub+Set',
      description: 'Complete professional scrub set with top and pants',
      meta_title: 'Cherokee Classic Scrub Set',
      meta_description: 'Complete professional scrub set with top and pants',
      meta_keywords: 'scrub set, cherokee, professional scrubs',
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      wishlistAddedAt: new Date('2024-01-08')
    }
  };

  useEffect(() => {
    const loadWishlistProducts = async () => {
      setLoading(true);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get products for wishlist items
      const wishlistProducts = wishlist.items
        .map(item => mockProducts[item.productId])
        .filter(Boolean) as WishlistItemWithProduct[];

      setProducts(wishlistProducts);
      setLoading(false);
    };

    loadWishlistProducts();
  }, [wishlist.items]);

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
    return 'https://via.placeholder.com/300x400?text=No+Image';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1920px] mx-auto px-[50px] py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="h-8 w-8 text-red-500" />
              <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            </div>
            <p className="text-gray-600">
              {products.length} {products.length === 1 ? 'item' : 'items'} saved for later
            </p>
          </div>

          {/* Wishlist Content */}
          {loading ? (
            <LoadingSkeleton />
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Save items you're interested in for easy access later. Just click the heart icon on any product.
              </p>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 bg-[#173a6a] text-white px-6 py-3 rounded-lg hover:bg-[#1e4a7a] transition-colors font-medium"
              >
                <Package className="h-5 w-5" />
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.$id} className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-all duration-300 group">
                  {/* Product Image */}
                  <div className="relative h-64 bg-gray-100 overflow-hidden">
                    <Link href={`/product/${product.slug}`}>
                      <img
                        src={getImageSrc(product)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Wishlist Remove Button */}
                    <button
                      onClick={() => handleRemoveFromWishlist(product.$id)}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove from wishlist"
                    >
                      <Heart className="h-4 w-4 text-red-500 fill-current" />
                    </button>

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.is_featured && (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                          Featured
                        </span>
                      )}
                      {product.is_new && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          New
                        </span>
                      )}
                      {product.discount_price > 0 && product.discount_price < product.price && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                          Sale
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-4">
                    <div className="mb-2">
                      <p className="text-sm text-gray-600 mb-1">
                        Added {formatDate(product.wishlistAddedAt)}
                      </p>
                      <Link
                        href={`/product/${product.slug}`}
                        className="font-semibold text-gray-900 hover:text-[#173a6a] transition-colors line-clamp-2"
                      >
                        {product.name}
                      </Link>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        {product.discount_price > 0 && product.discount_price < product.price ? (
                          <>
                            <span className="text-lg font-bold text-red-600">
                              ${product.discount_price.toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              ${product.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button className="w-full bg-[#173a6a] text-white py-3 px-4 rounded-lg hover:bg-[#1e4a7a] transition-colors font-medium flex items-center justify-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Add to Cart
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href={`/product/${product.slug}`}
                          className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium text-center text-sm"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleRemoveFromWishlist(product.$id)}
                          className="bg-red-50 text-red-600 py-2 px-4 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm flex items-center justify-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Continue Shopping */}
          {products.length > 0 && (
            <div className="text-center mt-12">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Continue Shopping
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}