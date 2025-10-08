import { useState } from 'react';
import SortControls from './SortControls';
import type { SortState } from '@/types/product-catalog';

export default function SortControlsExample() {
  const [currentSort, setCurrentSort] = useState<SortState>({
    option: 'popularity',
    direction: 'desc'
  });

  const handleSortChange = (newSort: SortState) => {
    setCurrentSort(newSort);
    console.log('Sort changed to:', newSort);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Sort Controls Examples
        </h1>

        <div className="space-y-8">
          {/* Basic Example */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Sort Controls
            </h2>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Current sort: {currentSort.option} ({currentSort.direction})
              </span>
              <SortControls
                currentSort={currentSort}
                onSortChange={handleSortChange}
              />
            </div>
          </div>

          {/* Different Sort States */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Different Sort States
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded">
                <h3 className="font-medium mb-2">Most Popular (Default)</h3>
                <SortControls
                  currentSort={{ option: 'popularity', direction: 'desc' }}
                  onSortChange={(sort) => console.log('Popularity:', sort)}
                />
              </div>

              <div className="p-4 border rounded">
                <h3 className="font-medium mb-2">Price: Low to High</h3>
                <SortControls
                  currentSort={{ option: 'price-low', direction: 'asc' }}
                  onSortChange={(sort) => console.log('Price Low:', sort)}
                />
              </div>

              <div className="p-4 border rounded">
                <h3 className="font-medium mb-2">Price: High to Low</h3>
                <SortControls
                  currentSort={{ option: 'price-high', direction: 'desc' }}
                  onSortChange={(sort) => console.log('Price High:', sort)}
                />
              </div>

              <div className="p-4 border rounded">
                <h3 className="font-medium mb-2">Name: A to Z</h3>
                <SortControls
                  currentSort={{ option: 'name', direction: 'asc' }}
                  onSortChange={(sort) => console.log('Name:', sort)}
                />
              </div>

              <div className="p-4 border rounded">
                <h3 className="font-medium mb-2">Newest</h3>
                <SortControls
                  currentSort={{ option: 'newest', direction: 'desc' }}
                  onSortChange={(sort) => console.log('Newest:', sort)}
                />
              </div>
            </div>
          </div>

          {/* Custom Styling */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Custom Styling
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">With Custom Class</h3>
                <SortControls
                  currentSort={currentSort}
                  onSortChange={handleSortChange}
                  className="w-64"
                />
              </div>
            </div>
          </div>

          {/* In Product Grid Context */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              In Product Grid Context
            </h2>
            <div className="border-b border-gray-200 pb-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Women's Scrubs
                  </h3>
                  <p className="text-sm text-gray-600">
                    Showing 1-12 of 48 products
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <SortControls
                    currentSort={currentSort}
                    onSortChange={handleSortChange}
                  />
                </div>
              </div>
            </div>
            
            {/* Mock product grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-gray-100 aspect-square rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Product {i}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Responsive */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Mobile Responsive
            </h2>
            <div className="max-w-sm mx-auto border rounded-lg p-4">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">48 products</span>
                  <SortControls
                    currentSort={currentSort}
                    onSortChange={handleSortChange}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  * Try this on mobile to see the responsive behavior
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}