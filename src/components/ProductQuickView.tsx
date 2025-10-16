'use client';

import { useState, useEffect } from 'react';
import { X, Heart, ShoppingCart, Star, Share2, Eye } from 'lucide-react';
import Image from 'next/image';
import { Product } from '../types/product';
import SocialShare from './SocialShare';

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (productId: string) => void;
  onWishlistToggle?: (productId: string) => void;
}

export default function ProductQuickView({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onWishlistToggle
}: ProductQuickViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

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
    return 'https://via.placeholder.com/400x400?text=No+Image';
  };

  // Mock gallery images for demonstration
  const galleryImages = [
    getImageSrc(product),
    'https://via.placeholder.com/400x400?text=View+2',
    'https://via.placeholder.com/400x400?text=View+3',
    'https://via.placeholder.com/400x400?text=View+4'
  ].filter(Boolean);

  const currentPrice = product.discount_price > 0 ? product.discount_price : product.price;
  const originalPrice = product.discount_price > 0 ? product.price : null;

  const handleAddToCart = () => {
    onAddToCart?.(product.$id);
    // Optionally close modal after adding to cart
    // onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        <div className="flex flex-col lg:flex-row">
          {/* Product Images */}
          <div className="lg:w-1/2 p-6">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
              <Image
                src={galleryImages[selectedImageIndex] || getImageSrc(product)}
                alt={product.name}
                width={400}
                height={400}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Image Gallery */}
            {galleryImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {galleryImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index ? 'border-[#173a6a]' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="lg:w-1/2 p-6 flex flex-col">
            <div className="flex-1">
              {/* Product Title and Brand */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Brand Name</p>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= 4.5 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">4.5 (127 reviews)</span>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  {originalPrice && (
                    <span className="text-lg text-gray-500 line-through">
                      ${originalPrice.toFixed(2)}
                    </span>
                  )}
                  <span className="text-3xl font-bold text-gray-900">
                    ${currentPrice.toFixed(2)}
                  </span>
                  {originalPrice && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-sm font-medium rounded">
                      Save ${(originalPrice - currentPrice).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed">
                  {product.description || 'High-quality medical scrubs designed for comfort and durability. Perfect for healthcare professionals who need reliable, comfortable workwear that looks professional and feels great all day long.'}
                </p>
              </div>

              {/* Availability */}
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">In Stock</span>
                  <span className="text-sm text-gray-600">• Ready to ship</span>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                className="w-full bg-[#173a6a] text-white py-4 px-6 rounded-lg hover:bg-[#1e4a7a] transition-colors font-medium flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart - ${(currentPrice * quantity).toFixed(2)}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onWishlistToggle?.(product.$id)}
                  className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Heart className="h-4 w-4" />
                  Save
                </button>

                <div className="relative">
                  <SocialShare
                    productName={product.name}
                    productUrl={`/product/${product.slug}`}
                    productDescription={product.description}
                    variant="compact"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-gray-900 mb-1">Free Shipping</p>
                  <p>On orders over $75</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">Easy Returns</p>
                  <p>30-day return policy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}