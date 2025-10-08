'use client';

import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import type { SortControlsProps, SortOption } from '@/types/product-catalog';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popularity', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' }
];

const SortControls = ({ 
  currentSort, 
  onSortChange,
  className 
}: SortControlsProps & { className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = SORT_OPTIONS.find(option => option.value === currentSort.option);
  const currentLabel = currentOption?.label || 'Most Popular';

  const handleSortSelect = (option: SortOption) => {
    // Determine direction based on option
    let direction: 'asc' | 'desc' = 'asc';
    
    switch (option) {
      case 'price-high':
      case 'popularity':
      case 'newest':
        direction = 'desc';
        break;
      case 'price-low':
      case 'name':
        direction = 'asc';
        break;
    }

    onSortChange({ option, direction });
    setIsOpen(false);
  };

  return (
    <div className={twMerge('relative', className)}>
      <label htmlFor="sort-select" className="sr-only">
        Sort products by
      </label>
      
      {/* Desktop dropdown */}
      <div className="relative">
        <button
          type="button"
          className={twMerge(
            'flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
            'min-w-[200px]'
          )}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          id="sort-select"
        >
          <span className="flex items-center">
            <svg
              className="w-4 h-4 mr-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
              />
            </svg>
            Sort: {currentLabel}
          </span>
          <svg
            className={twMerge(
              'w-4 h-4 ml-2 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <>
            {/* Click outside handler */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            
            <div className="absolute right-0 z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              <ul
                role="listbox"
                aria-labelledby="sort-select"
                className="py-1 max-h-60 overflow-auto"
              >
                {SORT_OPTIONS.map((option) => (
                  <li key={option.value} role="option">
                    <button
                      type="button"
                      className={twMerge(
                        'w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100',
                        currentSort.option === option.value && 'bg-blue-50 text-blue-700 font-medium'
                      )}
                      onClick={() => handleSortSelect(option.value)}
                      aria-selected={currentSort.option === option.value}
                    >
                      <span className="flex items-center justify-between">
                        {option.label}
                        {currentSort.option === option.value && (
                          <svg
                            className="w-4 h-4 text-blue-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SortControls;