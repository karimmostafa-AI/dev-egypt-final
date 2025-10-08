// Type validation utilities and type guards
import type { Product, ColorOption, FilterState, SortOption } from './product-catalog';

// Type guards for runtime type checking
export const isProduct = (obj: any): obj is Product => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.price === 'number' &&
    Array.isArray(obj.images) &&
    Array.isArray(obj.colors) &&
    Array.isArray(obj.sizes) &&
    typeof obj.brand === 'string' &&
    typeof obj.rating === 'number' &&
    typeof obj.reviewCount === 'number' &&
    typeof obj.isOnSale === 'boolean' &&
    typeof obj.category === 'string'
  );
};

export const isColorOption = (obj: any): obj is ColorOption => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.name === 'string' &&
    typeof obj.hex === 'string' &&
    typeof obj.imageUrl === 'string'
  );
};

export const isValidSortOption = (value: string): value is SortOption => {
  const validOptions: SortOption[] = ['price-low', 'price-high', 'name', 'popularity', 'newest'];
  return validOptions.includes(value as SortOption);
};

export const isValidFilterState = (obj: any): obj is FilterState => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    Array.isArray(obj.sizes) &&
    Array.isArray(obj.colors) &&
    Array.isArray(obj.brands) &&
    Array.isArray(obj.priceRange) &&
    obj.priceRange.length === 2 &&
    typeof obj.priceRange[0] === 'number' &&
    typeof obj.priceRange[1] === 'number' &&
    typeof obj.onSale === 'boolean'
  );
};

// Default values for types
export const createDefaultFilterState = (): FilterState => ({
  sizes: [],
  colors: [],
  brands: [],
  priceRange: [0, 1000],
  onSale: false
});

export const createDefaultProduct = (): Partial<Product> => ({
  id: '',
  name: '',
  price: 0,
  images: [],
  colors: [],
  sizes: [],
  brand: '',
  rating: 0,
  reviewCount: 0,
  isOnSale: false,
  category: ''
});

// Utility functions for type manipulation
export const sanitizeFilterState = (filters: Partial<FilterState>): FilterState => {
  const defaults = createDefaultFilterState();
  return {
    sizes: Array.isArray(filters.sizes) ? filters.sizes : defaults.sizes,
    colors: Array.isArray(filters.colors) ? filters.colors : defaults.colors,
    brands: Array.isArray(filters.brands) ? filters.brands : defaults.brands,
    priceRange: Array.isArray(filters.priceRange) && filters.priceRange.length === 2 
      ? filters.priceRange as [number, number]
      : defaults.priceRange,
    onSale: typeof filters.onSale === 'boolean' ? filters.onSale : defaults.onSale
  };
};