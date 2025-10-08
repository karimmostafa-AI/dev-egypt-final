'use client';

import React from 'react';
import ProductCard from './ProductCard';
import ToastContainer from '../ui/ToastContainer';
import type { Product } from '@/types/product-catalog';

// Example product data
const exampleProduct: Product = {
  id: 'example-product-1',
  name: 'Classic Scrub Top',
  price: 29.99,
  salePrice: 24.99,
  images: [
    { url: '/images/scrub-navy.jpg', alt: 'Navy scrub top', colorName: 'Navy' },
    { url: '/images/scrub-white.jpg', alt: 'White scrub top', colorName: 'White' },
    { url: '/images/scrub-red.jpg', alt: 'Red scrub top', colorName: 'Red' },
  ],
  colors: [
    { name: 'Navy', hex: '#1e3a8a', imageUrl: '/images/scrub-navy.jpg' },
    { name: 'White', hex: '#ffffff', imageUrl: '/images/scrub-white.jpg' },
    { name: 'Red', hex: '#dc2626', imageUrl: '/images/scrub-red.jpg' },
  ],
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  brand: 'Dev Egypt',
  rating: 4.5,
  reviewCount: 128,
  isOnSale: true,
  category: 'scrub-tops'
};

const ProductCardCartWishlistExample = () => {
  const handleAddToCart = (productId: string) => {
    console.log('Parent: Product added to cart:', productId);
  };

  const handleAddToWishlist = (productId: string) => {
    console.log('Parent: Product added to wishlist:', productId);
  };

  const handleColorChange = (productId: string, colorName: string) => {
    console.log('Parent: Color changed:', productId, colorName);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Product Card with Cart & Wishlist Integration
        </h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Features Demonstrated:</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Add to cart with color selection and visual feedback</li>
            <li>Add to wishlist with authentication check</li>
            <li>Toast notifications for success/error states</li>
            <li>Loading states and button state changes</li>
            <li>Login modal for unauthenticated users</li>
            <li>Remove from wishlist when already added</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProductCard
            product={exampleProduct}
            onAddToCart={handleAddToCart}
            onAddToWishlist={handleAddToWishlist}
            onColorChange={handleColorChange}
          />
          
          {/* Additional product cards for comparison */}
          <ProductCard
            product={{
              ...exampleProduct,
              id: 'example-product-2',
              name: 'Premium Scrub Pants',
              isOnSale: false,
              salePrice: undefined,
              colors: [
                { name: 'Black', hex: '#000000', imageUrl: '/images/scrub-black.jpg' },
                { name: 'Gray', hex: '#6b7280', imageUrl: '/images/scrub-gray.jpg' },
              ]
            }}
            onAddToCart={handleAddToCart}
            onAddToWishlist={handleAddToWishlist}
            onColorChange={handleColorChange}
          />
          
          <ProductCard
            product={{
              ...exampleProduct,
              id: 'example-product-3',
              name: 'Medical Jacket',
              price: 49.99,
              isOnSale: false,
              salePrice: undefined,
              colors: [
                { name: 'White', hex: '#ffffff', imageUrl: '/images/jacket-white.jpg' },
              ]
            }}
            onAddToCart={handleAddToCart}
            onAddToWishlist={handleAddToWishlist}
            onColorChange={handleColorChange}
          />
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">How to Test:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Click "Add to Cart" to see success notification and button state change</li>
            <li>Click the heart icon to add to wishlist (will show login modal if not authenticated)</li>
            <li>Select different colors to see image updates</li>
            <li>Try adding the same product multiple times to see quantity updates</li>
            <li>Check browser console for parent component callbacks</li>
          </ol>
        </div>
      </div>

      {/* Toast notifications will appear here */}
      <ToastContainer />
    </div>
  );
};

export default ProductCardCartWishlistExample;