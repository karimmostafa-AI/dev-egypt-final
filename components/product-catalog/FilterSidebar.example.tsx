'use client';

import { useState } from 'react';
import FilterSidebar from './FilterSidebar';
import type { FilterState, FilterOptions } from '@/types/product-catalog';

// Mock data for demonstration
const mockFilterOptions: FilterOptions = {
  availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'],
  availableColors: [
    { name: 'Black', hex: '#000000', imageUrl: '/images/black.jpg' },
    { name: 'White', hex: '#FFFFFF', imageUrl: '/images/white.jpg' },
    { name: 'Navy', hex: '#1E3A8A', imageUrl: '/images/navy.jpg' },
    { name: 'Gray', hex: '#6B7280', imageUrl: '/images/gray.jpg' },
    { name: 'Red', hex: '#DC2626', imageUrl: '/images/red.jpg' },
    { name: 'Blue', hex: '#2563EB', imageUrl: '/images/blue.jpg' },
    { name: 'Green', hex: '#16A34A', imageUrl: '/images/green.jpg' },
    { name: 'Purple', hex: '#9333EA', imageUrl: '/images/purple.jpg' },
  ],
  availableBrands: [
    'Dev Egypt',
    'Cherokee',
    'Dickies',
    'WonderWink',
    'Barco One',
    'FIGS',
    'Jaanuu',
    'Healing Hands',
    'Grey\'s Anatomy',
    'Koi'
  ],
  priceRange: [10, 200]
};

const initialFilters: FilterState = {
  sizes: [],
  colors: [],
  brands: [],
  priceRange: [10, 200],
  onSale: false
};

const FilterSidebarExample = () => {
  const [currentFilters, setCurrentFilters] = useState<FilterState>(initialFilters);
  const [productCount, setProductCount] = useState(156);

  const handleFilterChange = (newFilters: FilterState) => {
    setCurrentFilters(newFilters);
    
    // Simulate product count update based on filters
    let count = 156;
    if (newFilters.sizes.length > 0) count = Math.floor(count * 0.7);
    if (newFilters.colors.length > 0) count = Math.floor(count * 0.8);
    if (newFilters.brands.length > 0) count = Math.floor(count * 0.6);
    if (newFilters.onSale) count = Math.floor(count * 0.3);
    
    setProductCount(Math.max(1, count));
  };

  const handleClearFilters = () => {
    setCurrentFilters(initialFilters);
    setProductCount(156);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Filter Sidebar Example
        </h1>
        
        <div className="flex gap-6">
          <FilterSidebar
            filters={mockFilterOptions}
            currentFilters={currentFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            productCount={productCount}
          />
          
          <div className="flex-1 bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Current Filter State</h2>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Sizes:</strong> {currentFilters.sizes.length > 0 ? currentFilters.sizes.join(', ') : 'None'}
              </div>
              <div>
                <strong>Colors:</strong> {currentFilters.colors.length > 0 ? currentFilters.colors.join(', ') : 'None'}
              </div>
              <div>
                <strong>Brands:</strong> {currentFilters.brands.length > 0 ? currentFilters.brands.join(', ') : 'None'}
              </div>
              <div>
                <strong>Price Range:</strong> ${currentFilters.priceRange[0]} - ${currentFilters.priceRange[1]}
              </div>
              <div>
                <strong>On Sale:</strong> {currentFilters.onSale ? 'Yes' : 'No'}
              </div>
              <div className="pt-3 border-t">
                <strong>Product Count:</strong> {productCount}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebarExample;