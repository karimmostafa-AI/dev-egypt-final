'use client';

import { useState, memo, useCallback, useMemo, useRef, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import type { FilterSidebarProps } from '@/types/product-catalog';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { generateId, AriaHelpers, ScreenReaderAnnouncer, KeyboardNavigation } from '@/utils/accessibility';

interface FilterSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  id?: string;
}

const FilterSection = ({ title, isOpen, onToggle, children, id }: FilterSectionProps) => {
  const contentId = id || generateId('filter-section');
  const announcer = ScreenReaderAnnouncer.getInstance();

  const handleToggle = () => {
    onToggle();
    announcer.announce(
      `${title} section ${isOpen ? 'collapsed' : 'expanded'}`,
      'polite'
    );
  };

  return (
    <div className="border-b border-gray-200 pb-4 mb-4">
      <h3>
        <button
          onClick={handleToggle}
          className="flex items-center justify-between w-full text-left font-medium text-gray-900 hover:text-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          {...AriaHelpers.expandable(isOpen, contentId)}
          aria-label={`${title} filter section, ${isOpen ? 'expanded' : 'collapsed'}`}
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
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </h3>
      {isOpen && (
        <div 
          id={contentId}
          className="mt-3 space-y-2"
          role="region"
          aria-labelledby={`${contentId}-header`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

const PriceRangeSlider = memo(({ min, max, value, onChange }: PriceRangeSliderProps) => {
  const [localValue, setLocalValue] = useState(value);
  const [minId] = useState(generateId('price-min'));
  const [maxId] = useState(generateId('price-max'));
  const [groupId] = useState(generateId('price-range'));
  const announcer = ScreenReaderAnnouncer.getInstance();

  // Debounce price changes to avoid excessive API calls
  const debouncedOnChange = useDebouncedCallback(onChange, 300);

  const handleMinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), localValue[1]);
    const newValue: [number, number] = [newMin, localValue[1]];
    setLocalValue(newValue);
    debouncedOnChange(newValue);
    
    // Announce price change for screen readers
    announcer.announce(`Minimum price set to $${newMin}`, 'polite');
  }, [localValue, debouncedOnChange, announcer]);

  const handleMaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), localValue[0]);
    const newValue: [number, number] = [localValue[0], newMax];
    setLocalValue(newValue);
    debouncedOnChange(newValue);
    
    // Announce price change for screen readers
    announcer.announce(`Maximum price set to $${newMax}`, 'polite');
  }, [localValue, debouncedOnChange, announcer]);

  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Price range filter</legend>
      <div className="flex items-center gap-2" role="group" aria-labelledby={groupId}>
        <label htmlFor={minId} className="sr-only">Minimum price</label>
        <input
          id={minId}
          type="number"
          min={min}
          max={max}
          value={localValue[0]}
          onChange={handleMinChange}
          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Min"
          aria-label={`Minimum price, current value $${localValue[0]}`}
        />
        <span className="text-gray-500" aria-hidden="true">-</span>
        <label htmlFor={maxId} className="sr-only">Maximum price</label>
        <input
          id={maxId}
          type="number"
          min={min}
          max={max}
          value={localValue[1]}
          onChange={handleMaxChange}
          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Max"
          aria-label={`Maximum price, current value $${localValue[1]}`}
        />
      </div>
      <div className="relative" role="group" aria-label="Price range sliders">
        <input
          type="range"
          min={min}
          max={max}
          value={localValue[0]}
          onChange={handleMinChange}
          className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
          aria-label={`Minimum price slider, current value $${localValue[0]}`}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={localValue[1]}
          onChange={handleMaxChange}
          className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
          aria-label={`Maximum price slider, current value $${localValue[1]}`}
        />
      </div>
      <div className="flex justify-between text-sm text-gray-500" aria-hidden="true">
        <span>${min}</span>
        <span>${max}</span>
      </div>
    </fieldset>
  );
});

PriceRangeSlider.displayName = 'PriceRangeSlider';

const FilterSidebar = memo(({
  filters,
  currentFilters,
  onFilterChange,
  onClearFilters,
  productCount
}: FilterSidebarProps) => {
  const [openSections, setOpenSections] = useState({
    size: true,
    color: true,
    brand: true,
    price: true,
    sale: true
  });

  // Accessibility state
  const [focusedColorIndex, setFocusedColorIndex] = useState(-1);
  const colorButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const announcer = ScreenReaderAnnouncer.getInstance();
  const [sectionIds] = useState({
    size: generateId('size-section'),
    color: generateId('color-section'),
    brand: generateId('brand-section'),
    price: generateId('price-section'),
    sale: generateId('sale-section')
  });

  const toggleSection = useCallback((section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const handleSizeChange = useCallback((size: string, checked: boolean) => {
    const newSizes = checked
      ? [...currentFilters.sizes, size]
      : currentFilters.sizes.filter(s => s !== size);
    
    onFilterChange({
      ...currentFilters,
      sizes: newSizes
    });

    // Announce change to screen readers
    announcer.announce(
      `Size ${size} ${checked ? 'selected' : 'deselected'}`,
      'polite'
    );
  }, [currentFilters, onFilterChange, announcer]);

  const handleColorChange = useCallback((colorName: string) => {
    const isSelected = currentFilters.colors.includes(colorName);
    const newColors = isSelected
      ? currentFilters.colors.filter(c => c !== colorName)
      : [...currentFilters.colors, colorName];
    
    onFilterChange({
      ...currentFilters,
      colors: newColors
    });

    // Announce change to screen readers
    announcer.announce(
      `Color ${colorName} ${isSelected ? 'deselected' : 'selected'}`,
      'polite'
    );
  }, [currentFilters, onFilterChange, announcer]);

  const handleBrandChange = useCallback((brand: string, checked: boolean) => {
    const newBrands = checked
      ? [...currentFilters.brands, brand]
      : currentFilters.brands.filter(b => b !== brand);
    
    onFilterChange({
      ...currentFilters,
      brands: newBrands
    });

    // Announce change to screen readers
    announcer.announce(
      `Brand ${brand} ${checked ? 'selected' : 'deselected'}`,
      'polite'
    );
  }, [currentFilters, onFilterChange, announcer]);

  const handlePriceRangeChange = useCallback((priceRange: [number, number]) => {
    onFilterChange({
      ...currentFilters,
      priceRange
    });
  }, [currentFilters, onFilterChange]);

  const handleSaleToggle = useCallback((checked: boolean) => {
    onFilterChange({
      ...currentFilters,
      onSale: checked
    });

    // Announce change to screen readers
    announcer.announce(
      `Sale filter ${checked ? 'enabled' : 'disabled'}`,
      'polite'
    );
  }, [currentFilters, onFilterChange, announcer]);

  // Handle keyboard navigation for color swatches
  const handleColorKeyDown = useCallback((event: React.KeyboardEvent, colorIndex: number) => {
    const handled = KeyboardNavigation.handleListNavigation(
      event.nativeEvent,
      colorIndex,
      filters.availableColors.length,
      (newIndex) => {
        setFocusedColorIndex(newIndex);
        colorButtonRefs.current[newIndex]?.focus();
      }
    );

    if (!handled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      handleColorChange(filters.availableColors[colorIndex].name);
    }
  }, [filters.availableColors, handleColorChange]);

  const hasActiveFilters = useMemo(() => {
    if (!currentFilters) return false;
    return (
      currentFilters.sizes?.length > 0 ||
      currentFilters.colors?.length > 0 ||
      currentFilters.brands?.length > 0 ||
      currentFilters.onSale ||
      (currentFilters.priceRange && filters.priceRange && 
       (currentFilters.priceRange[0] !== filters.priceRange[0] || 
        currentFilters.priceRange[1] !== filters.priceRange[1]))
    );
  }, [currentFilters, filters.priceRange]
  );

  return (
    <div 
      className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto"
      role="complementary"
      aria-label="Product filters"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-label="Clear all active filters"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Product Count */}
      <div className="mb-6 p-3 bg-gray-50 rounded-lg" role="status" aria-live="polite">
        <span className="text-sm text-gray-600">
          {productCount} {productCount === 1 ? 'product' : 'products'} found
        </span>
      </div>

      {/* Size Filter */}
      <FilterSection
        title="Size"
        isOpen={openSections.size}
        onToggle={() => toggleSection('size')}
        id={sectionIds.size}
      >
        <fieldset>
          <legend className="sr-only">Filter by size</legend>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Size options">
            {filters.availableSizes.map(size => (
              <label
                key={size}
                className="flex items-center justify-center p-2 border border-gray-300 rounded cursor-pointer hover:border-gray-400 transition-colors duration-200 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
              >
                <input
                  type="checkbox"
                  checked={currentFilters.sizes.includes(size)}
                  onChange={(e) => handleSizeChange(size, e.target.checked)}
                  className="sr-only"
                  aria-describedby={`size-${size}-desc`}
                />
                <span className="text-sm font-medium" id={`size-${size}-desc`}>
                  {size}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </FilterSection>

      {/* Color Filter */}
      <FilterSection
        title="Color"
        isOpen={openSections.color}
        onToggle={() => toggleSection('color')}
        id={sectionIds.color}
      >
        <fieldset>
          <legend className="sr-only">Filter by color</legend>
          <div 
            className="flex flex-wrap gap-2" 
            role="group" 
            aria-label="Color options"
            onKeyDown={(e) => {
              if (focusedColorIndex >= 0) {
                handleColorKeyDown(e, focusedColorIndex);
              }
            }}
          >
            {filters.availableColors.map((color, index) => (
              <button
                key={color.name}
                ref={(el) => {
                  colorButtonRefs.current[index] = el;
                }}
                onClick={() => handleColorChange(color.name)}
                onFocus={() => setFocusedColorIndex(index)}
                onBlur={() => setFocusedColorIndex(-1)}
                onKeyDown={(e) => handleColorKeyDown(e, index)}
                className={twMerge(
                  'w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  currentFilters.colors.includes(color.name)
                    ? 'border-gray-900 ring-2 ring-blue-500 ring-offset-2'
                    : 'border-gray-300 hover:border-gray-400'
                )}
                style={{ backgroundColor: color.hex }}
                title={color.name}
                aria-label={`${currentFilters.colors.includes(color.name) ? 'Remove' : 'Add'} ${color.name} color filter`}
                {...AriaHelpers.selection(currentFilters.colors.includes(color.name))}
              />
            ))}
          </div>
          {currentFilters.colors.length > 0 && (
            <div className="mt-2 text-xs text-gray-600" aria-live="polite">
              Selected colors: {currentFilters.colors.join(', ')}
            </div>
          )}
        </fieldset>
      </FilterSection>

      {/* Brand Filter */}
      <FilterSection
        title="Brand"
        isOpen={openSections.brand}
        onToggle={() => toggleSection('brand')}
        id={sectionIds.brand}
      >
        <fieldset>
          <legend className="sr-only">Filter by brand</legend>
          <div className="space-y-2 max-h-48 overflow-y-auto" role="group" aria-label="Brand options">
            {filters.availableBrands.map(brand => (
              <label
                key={brand}
                className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors duration-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
              >
                <input
                  type="checkbox"
                  checked={currentFilters.brands.includes(brand)}
                  onChange={(e) => handleBrandChange(brand, e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  aria-describedby={`brand-${brand.replace(/\s+/g, '-').toLowerCase()}-desc`}
                />
                <span 
                  className="ml-2 text-sm text-gray-700"
                  id={`brand-${brand.replace(/\s+/g, '-').toLowerCase()}-desc`}
                >
                  {brand}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </FilterSection>

      {/* Price Range Filter */}
      <FilterSection
        title="Price Range"
        isOpen={openSections.price}
        onToggle={() => toggleSection('price')}
        id={sectionIds.price}
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
        id={sectionIds.sale}
      >
        <fieldset>
          <legend className="sr-only">Filter by special offers</legend>
          <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors duration-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
            <input
              type="checkbox"
              checked={currentFilters.onSale}
              onChange={(e) => handleSaleToggle(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              aria-describedby="sale-filter-desc"
            />
            <span className="ml-2 text-sm text-gray-700" id="sale-filter-desc">
              On Sale
            </span>
          </label>
        </fieldset>
      </FilterSection>
    </div>
  );
});

FilterSidebar.displayName = 'FilterSidebar';

export default FilterSidebar;