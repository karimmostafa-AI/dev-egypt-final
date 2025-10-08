'use client';

import { useState } from 'react';
import MobileFilterDrawer from './MobileFilterDrawer';
import type { FilterOptions, FilterState } from '@/types/product-catalog';

// Example data
const exampleFilters: FilterOptions = {
  availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  availableColors: [
    { name: 'Navy', hex: '#1f2937', imageUrl: '/navy.jpg' },
    { name: 'White', hex: '#ffffff', imageUrl: '/white.jpg' },
    { name: 'Black', hex: '#000000', imageUrl: '/black.jpg' },
    { name: 'Royal Blue', hex: '#2563eb', imageUrl: '/royal-blue.jpg' },
    { name: 'Red', hex: '#dc2626', imageUrl: '/red.jpg' },
    { name: 'Green', hex: '#16a34a', imageUrl: '/green.jpg' },
    { name: 'Pink', hex: '#ec4899', imageUrl: '/pink.jpg' },
    { name: 'Purple', hex: '#9333ea', imageUrl: '/purple.jpg' }
  ],
  availableBrands: [
    'Dev Egypt',
    'Cherokee',
    'Dickies',
    'WonderWink',
    'Barco One',
    'FIGS',
    'Jaanuu',
    'Healing Hands'
  ],
  priceRange: [15, 150]
};

const initialFilters: FilterState = {
  sizes: [],
  colors: [],
  brands: [],
  priceRange: [15, 150],
  onSale: false
};

const MobileFilterDrawerExample = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterState>(initialFilters);
  const [productCount, setProductCount] = useState(247);

  const handleFilterChange = (newFilters: FilterState) => {
    setCurrentFilters(newFilters);
    
    // Simulate product count update based on filters
    let count = 247;
    if (newFilters.sizes.length > 0) count -= 50;
    if (newFilters.colors.length > 0) count -= 30;
    if (newFilters.brands.length > 0) count -= 40;
    if (newFilters.onSale) count -= 100;
    if (newFilters.priceRange[0] > 15 || newFilters.priceRange[1] < 150) count -= 20;
    
    setProductCount(Math.max(0, count));
  };

  const handleClearFilters = () => {
    setCurrentFilters(initialFilters);
    setProductCount(247);
  };

  const hasActiveFilters = 
    currentFilters.sizes.length > 0 ||
    currentFilters.colors.length > 0 ||
    currentFilters.brands.length > 0 ||
    currentFilters.onSale ||
    (currentFilters.priceRange[0] !== exampleFilters.priceRange[0] || 
     currentFilters.priceRange[1] !== exampleFilters.priceRange[1]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Mobile Filter Drawer Example
        </h1>
        
        {/* Mobile Filter Button */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Product Catalog
            </h2>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {hasActiveFilters && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full">
                  {[
                    ...currentFilters.sizes,
                    ...currentFilters.colors,
                    ...currentFilters.brands,
                    ...(currentFilters.onSale ? ['sale'] : []),
                    ...(currentFilters.priceRange[0] !== exampleFilters.priceRange[0] || 
                        currentFilters.priceRange[1] !== exampleFilters.priceRange[1] ? ['price'] : [])
                  ].length}
                </span>
              )}
            </button>
          </div>
          
          <div className="text-sm text-gray-600 mb-4">
            {productCount} products found
          </div>
          
          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">Active Filters:</h3>
              <div className="flex flex-wrap gap-2">
                {currentFilters.sizes.map(size => (
                  <span
                    key={size}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full"
                  >
                    Size: {size}
                  </span>
                ))}
                {currentFilters.colors.map(color => (
                  <span
                    key={color}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full"
                  >
                    Color: {color}
                  </span>
                ))}
                {currentFilters.brands.map(brand => (
                  <span
                    key={brand}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full"
                  >
                    Brand: {brand}
                  </span>
                ))}
                {currentFilters.onSale && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                    On Sale
                  </span>
                )}
                {(currentFilters.priceRange[0] !== exampleFilters.priceRange[0] || 
                  currentFilters.priceRange[1] !== exampleFilters.priceRange[1]) && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                    Price: ${currentFilters.priceRange[0]} - ${currentFilters.priceRange[1]}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Try the Mobile Filter Drawer:
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click the "Filters" button to open the drawer</li>
            <li>• Try selecting different sizes, colors, and brands</li>
            <li>• Adjust the price range slider</li>
            <li>• Toggle the "On Sale" option</li>
            <li>• Use the "Clear All" button to reset filters</li>
            <li>• Close with the X button, backdrop click, or swipe left</li>
            <li>• Press Escape key to close</li>
          </ul>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        filters={exampleFilters}
        currentFilters={currentFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        productCount={productCount}
      />
    </div>
  );
};

export default MobileFilterDrawerExample;