'use client';

import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import type { MobileFilterDrawerProps } from '@/types/product-catalog';
import { FocusTrap, generateId, AriaHelpers, ScreenReaderAnnouncer } from '@/utils/accessibility';

interface FilterSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const FilterSection = ({ title, isOpen, onToggle, children }: FilterSectionProps) => (
  <div className="border-b border-gray-200 pb-4 mb-4">
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full text-left font-medium text-gray-900 hover:text-gray-700 transition-colors duration-200"
      aria-expanded={isOpen}
    >
      <span>{title}</span>
      <svg
        className={twMerge(
          'w-5 h-5 transition-transform duration-200',
          isOpen ? 'rotate-180' : ''
        )}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {isOpen && (
      <div className="mt-3 space-y-2">
        {children}
      </div>
    )}
  </div>
);

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

const PriceRangeSlider = ({ min, max, value, onChange }: PriceRangeSliderProps) => {
  const [localValue, setLocalValue] = useState(value);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), localValue[1]);
    const newValue: [number, number] = [newMin, localValue[1]];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), localValue[0]);
    const newValue: [number, number] = [localValue[0], newMax];
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={localValue[0]}
          onChange={handleMinChange}
          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Min"
        />
        <span className="text-gray-500">-</span>
        <input
          type="number"
          min={min}
          max={max}
          value={localValue[1]}
          onChange={handleMaxChange}
          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Max"
        />
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={localValue[0]}
          onChange={handleMinChange}
          className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={localValue[1]}
          onChange={handleMaxChange}
          className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
      </div>
      <div className="flex justify-between text-sm text-gray-500">
        <span>${min}</span>
        <span>${max}</span>
      </div>
    </div>
  );
};

const MobileFilterDrawer = ({
  isOpen,
  onClose,
  filters,
  currentFilters,
  onFilterChange,
  onClearFilters,
  productCount
}: MobileFilterDrawerProps) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [openSections, setOpenSections] = useState({
    size: true,
    color: true,
    brand: true,
    price: true,
    sale: true
  });

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle focus management
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      // Focus the first focusable element in the drawer
      const firstFocusable = drawerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [isOpen]);

  // Handle touch gestures for swipe to close
  useEffect(() => {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      currentX = e.touches[0].clientX;
      const deltaX = currentX - startX;
      
      // Only allow swiping left (negative delta) to close
      if (deltaX < 0 && drawerRef.current) {
        const translateX = Math.max(deltaX, -300);
        drawerRef.current.style.transform = `translateX(${translateX}px)`;
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      
      const deltaX = currentX - startX;
      
      if (drawerRef.current) {
        drawerRef.current.style.transform = '';
        
        // Close if swiped more than 100px to the left
        if (deltaX < -100) {
          onClose();
        }
      }
    };

    if (isOpen && drawerRef.current) {
      const drawer = drawerRef.current;
      drawer.addEventListener('touchstart', handleTouchStart, { passive: true });
      drawer.addEventListener('touchmove', handleTouchMove, { passive: true });
      drawer.addEventListener('touchend', handleTouchEnd, { passive: true });

      return () => {
        drawer.removeEventListener('touchstart', handleTouchStart);
        drawer.removeEventListener('touchmove', handleTouchMove);
        drawer.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isOpen, onClose]);

  // Animation handling
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSizeChange = (size: string, checked: boolean) => {
    const newSizes = checked
      ? [...currentFilters.sizes, size]
      : currentFilters.sizes.filter(s => s !== size);
    
    onFilterChange({
      ...currentFilters,
      sizes: newSizes
    });
  };

  const handleColorChange = (colorName: string) => {
    const isSelected = currentFilters.colors.includes(colorName);
    const newColors = isSelected
      ? currentFilters.colors.filter(c => c !== colorName)
      : [...currentFilters.colors, colorName];
    
    onFilterChange({
      ...currentFilters,
      colors: newColors
    });
  };

  const handleBrandChange = (brand: string, checked: boolean) => {
    const newBrands = checked
      ? [...currentFilters.brands, brand]
      : currentFilters.brands.filter(b => b !== brand);
    
    onFilterChange({
      ...currentFilters,
      brands: newBrands
    });
  };

  const handlePriceRangeChange = (priceRange: [number, number]) => {
    onFilterChange({
      ...currentFilters,
      priceRange
    });
  };

  const handleSaleToggle = (checked: boolean) => {
    onFilterChange({
      ...currentFilters,
      onSale: checked
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  const hasActiveFilters = currentFilters ? (
    currentFilters.sizes?.length > 0 ||
    currentFilters.colors?.length > 0 ||
    currentFilters.brands?.length > 0 ||
    currentFilters.onSale ||
    (currentFilters.priceRange && filters.priceRange && 
     (currentFilters.priceRange[0] !== filters.priceRange[0] || 
      currentFilters.priceRange[1] !== filters.priceRange[1]))
  ) : false;

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className={twMerge(
        'fixed inset-0 z-50 flex justify-end',
        'transition-all duration-300 ease-in-out',
        isOpen ? 'bg-black bg-opacity-50' : 'bg-transparent pointer-events-none'
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-filter-title"
    >
      <div
        ref={drawerRef}
        className={twMerge(
          'w-80 max-w-[85vw] h-full bg-white shadow-xl',
          'transform transition-transform duration-300 ease-in-out',
          'flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h2 id="mobile-filter-title" className="text-lg font-semibold text-gray-900">
            Filters
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            aria-label="Close filters"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Product Count */}
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">
              {productCount} {productCount === 1 ? 'product' : 'products'} found
            </span>
          </div>

          {/* Size Filter */}
          <FilterSection
            title="Size"
            isOpen={openSections.size}
            onToggle={() => toggleSection('size')}
          >
            <div className="grid grid-cols-3 gap-2">
              {filters.availableSizes.map(size => (
                <label
                  key={size}
                  className="flex items-center justify-center p-2 border border-gray-300 rounded cursor-pointer hover:border-gray-400 transition-colors duration-200 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                >
                  <input
                    type="checkbox"
                    checked={currentFilters.sizes.includes(size)}
                    onChange={(e) => handleSizeChange(size, e.target.checked)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{size}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Color Filter */}
          <FilterSection
            title="Color"
            isOpen={openSections.color}
            onToggle={() => toggleSection('color')}
          >
            <div className="flex flex-wrap gap-2">
              {filters.availableColors.map(color => (
                <button
                  key={color.name}
                  onClick={() => handleColorChange(color.name)}
                  className={twMerge(
                    'w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110',
                    currentFilters.colors.includes(color.name)
                      ? 'border-gray-900 ring-2 ring-blue-500 ring-offset-2'
                      : 'border-gray-300 hover:border-gray-400'
                  )}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                  aria-label={`Filter by ${color.name}`}
                />
              ))}
            </div>
            {currentFilters.colors.length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                Selected: {currentFilters.colors.join(', ')}
              </div>
            )}
          </FilterSection>

          {/* Brand Filter */}
          <FilterSection
            title="Brand"
            isOpen={openSections.brand}
            onToggle={() => toggleSection('brand')}
          >
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filters.availableBrands.map(brand => (
                <label
                  key={brand}
                  className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors duration-200"
                >
                  <input
                    type="checkbox"
                    checked={currentFilters.brands.includes(brand)}
                    onChange={(e) => handleBrandChange(brand, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-700">{brand}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Price Range Filter */}
          <FilterSection
            title="Price Range"
            isOpen={openSections.price}
            onToggle={() => toggleSection('price')}
          >
            <PriceRangeSlider
              min={filters.priceRange[0]}
              max={filters.priceRange[1]}
              value={currentFilters.priceRange}
              onChange={handlePriceRangeChange}
            />
          </FilterSection>

          {/* Sale Filter */}
          <FilterSection
            title="Special Offers"
            isOpen={openSections.sale}
            onToggle={() => toggleSection('sale')}
          >
            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors duration-200">
              <input
                type="checkbox"
                checked={currentFilters.onSale}
                onChange={(e) => handleSaleToggle(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-2 text-sm text-gray-700">On Sale</span>
            </label>
          </FilterSection>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
          <div className="flex gap-3">
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors duration-200"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileFilterDrawer;