import type { Product, FilterState, SortState, SortOption } from '@/types/product-catalog';
import { MemoCache } from './performanceUtils';

// Create a global cache for expensive filter operations
const filterCache = new MemoCache<any, Product[]>(50);
const sortCache = new MemoCache<any, Product[]>(20);

/**
 * Apply filters to a list of products with memoization
 */
export const applyFilters = (products: Product[], filters: FilterState): Product[] => {
  if (!products || !Array.isArray(products)) {
    console.warn('Invalid products array provided to applyFilters');
    return [];
  }

  if (!filters) {
    console.warn('Invalid filters provided to applyFilters');
    return products;
  }

  // Use cache for expensive filter operations
  const cacheKey = { 
    productIds: products.map(p => p.id).sort().join(','),
    filters: JSON.stringify(filters)
  };

  return filterCache.get(cacheKey, () => {
    return products.filter(product => {
    try {
      // Size filter
      if (filters.sizes && filters.sizes.length > 0) {
        const productSizes = product.sizes || [];
        const hasMatchingSize = filters.sizes.some(size => 
          productSizes.includes(size)
        );
        if (!hasMatchingSize) return false;
      }

      // Color filter
      if (filters.colors && filters.colors.length > 0) {
        const productColors = product.colors || [];
        const hasMatchingColor = filters.colors.some(colorName =>
          productColors.some(color => color && color.name === colorName)
        );
        if (!hasMatchingColor) return false;
      }

      // Brand filter
      if (filters.brands && filters.brands.length > 0) {
        if (!product.brand || !filters.brands.includes(product.brand)) return false;
      }

      // Price range filter
      if (filters.priceRange && Array.isArray(filters.priceRange) && filters.priceRange.length === 2) {
        const productPrice = product.salePrice || product.price || 0;
        const [minPrice, maxPrice] = filters.priceRange;
        if (productPrice < minPrice || productPrice > maxPrice) {
          return false;
        }
      }

      // Sale filter
      if (filters.onSale && !product.isOnSale) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error filtering product:', product.id, error);
      return false;
    }
    });
  });
};

/**
 * Sort products based on sort state with memoization
 */
export const sortProducts = (products: Product[], sortState: SortState): Product[] => {
  // Use cache for expensive sort operations
  const cacheKey = {
    productIds: products.map(p => p.id).sort().join(','),
    sortState: JSON.stringify(sortState)
  };

  return sortCache.get(cacheKey, () => {
    const sortedProducts = [...products];

  switch (sortState.option) {
    case 'price-low':
      return sortedProducts.sort((a, b) => {
        const priceA = a.salePrice || a.price;
        const priceB = b.salePrice || b.price;
        return sortState.direction === 'asc' ? priceA - priceB : priceB - priceA;
      });

    case 'price-high':
      return sortedProducts.sort((a, b) => {
        const priceA = a.salePrice || a.price;
        const priceB = b.salePrice || b.price;
        return sortState.direction === 'asc' ? priceB - priceA : priceA - priceB;
      });

    case 'name':
      return sortedProducts.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return sortState.direction === 'asc' ? comparison : -comparison;
      });

    case 'popularity':
      return sortedProducts.sort((a, b) => {
        // Sort by review count as a proxy for popularity
        const comparison = b.reviewCount - a.reviewCount;
        return sortState.direction === 'asc' ? -comparison : comparison;
      });

    case 'newest':
      // For now, sort by ID as a proxy for newest (in a real app, you'd have a createdAt field)
      return sortedProducts.sort((a, b) => {
        const comparison = b.id.localeCompare(a.id);
        return sortState.direction === 'asc' ? -comparison : comparison;
      });

    default:
      return sortedProducts;
    }
  });
};

/**
 * Get the count of products that match the current filters
 */
export const getFilteredCount = (products: Product[], filters: FilterState): number => {
  return applyFilters(products, filters).length;
};

/**
 * Validate filter state against available options
 */
export const validateFilters = (
  filters: FilterState,
  availableOptions: {
    sizes: string[];
    colors: string[];
    brands: string[];
    priceRange: [number, number];
  }
): FilterState => {
  if (!filters || !availableOptions) {
    console.warn('Invalid parameters provided to validateFilters');
    return {
      sizes: [],
      colors: [],
      brands: [],
      priceRange: availableOptions?.priceRange || [0, 1000],
      onSale: false
    };
  }

  try {
    const validatedSizes = Array.isArray(filters.sizes) 
      ? filters.sizes.filter(size => availableOptions.sizes?.includes(size))
      : [];

    const validatedColors = Array.isArray(filters.colors)
      ? filters.colors.filter(color => availableOptions.colors?.includes(color))
      : [];

    const validatedBrands = Array.isArray(filters.brands)
      ? filters.brands.filter(brand => availableOptions.brands?.includes(brand))
      : [];

    // Validate price range
    let validatedPriceRange: [number, number] = availableOptions.priceRange || [0, 1000];
    if (Array.isArray(filters.priceRange) && filters.priceRange.length === 2) {
      const [filterMin, filterMax] = filters.priceRange;
      const [availableMin, availableMax] = availableOptions.priceRange;
      
      const validMin = Math.max(
        Math.max(0, Number(filterMin) || 0),
        availableMin
      );
      const validMax = Math.min(
        Math.max(validMin, Number(filterMax) || availableMax),
        availableMax
      );
      
      validatedPriceRange = [validMin, validMax];
    }

    return {
      sizes: validatedSizes,
      colors: validatedColors,
      brands: validatedBrands,
      priceRange: validatedPriceRange,
      onSale: Boolean(filters.onSale)
    };
  } catch (error) {
    console.error('Error validating filters:', error);
    return {
      sizes: [],
      colors: [],
      brands: [],
      priceRange: availableOptions.priceRange || [0, 1000],
      onSale: false
    };
  }
};

/**
 * Get sort option from string with fallback
 */
export const getSortOption = (sortString: string | null): SortOption => {
  const validOptions: SortOption[] = ['price-low', 'price-high', 'name', 'popularity', 'newest'];
  return validOptions.includes(sortString as SortOption) 
    ? (sortString as SortOption) 
    : 'popularity';
};

/**
 * Get sort direction from string with fallback
 */
export const getSortDirection = (directionString: string | null): 'asc' | 'desc' => {
  return directionString === 'desc' ? 'desc' : 'asc';
};

/**
 * Combine filters and sorting to get final product list
 */
export const processProducts = (
  products: Product[],
  filters: FilterState,
  sortState: SortState
): Product[] => {
  const filtered = applyFilters(products, filters);
  return sortProducts(filtered, sortState);
};

/**
 * Extract unique filter options from products
 */
export const extractFilterOptions = (products: Product[]) => {
  const sizes = new Set<string>();
  const colors = new Map<string, { name: string; hex: string }>();
  const brands = new Set<string>();
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  products.forEach(product => {
    // Collect sizes
    product.sizes.forEach(size => sizes.add(size));

    // Collect colors
    product.colors.forEach(color => {
      colors.set(color.name, { name: color.name, hex: color.hex });
    });

    // Collect brands
    brands.add(product.brand);

    // Track price range
    const price = product.salePrice || product.price;
    minPrice = Math.min(minPrice, price);
    maxPrice = Math.max(maxPrice, price);
  });

  return {
    availableSizes: Array.from(sizes).sort(),
    availableColors: Array.from(colors.values()).sort((a, b) => a.name.localeCompare(b.name)),
    availableBrands: Array.from(brands).sort(),
    priceRange: [Math.floor(minPrice), Math.ceil(maxPrice)] as [number, number]
  };
};

/**
 * Check if filter combinations would result in no products
 */
export const checkFilterConflicts = (
  products: Product[],
  filters: FilterState
): { hasConflicts: boolean; conflictingFilters: string[] } => {
  const conflictingFilters: string[] = [];
  
  try {
    // Test each filter individually to see if it would return results
    const testFilters = (testFilter: Partial<FilterState>) => {
      const testResult = applyFilters(products, { 
        sizes: [], 
        colors: [], 
        brands: [], 
        priceRange: [0, Infinity], 
        onSale: false,
        ...testFilter 
      });
      return testResult.length > 0;
    };

    if (filters.sizes.length > 0 && !testFilters({ sizes: filters.sizes })) {
      conflictingFilters.push('sizes');
    }

    if (filters.colors.length > 0 && !testFilters({ colors: filters.colors })) {
      conflictingFilters.push('colors');
    }

    if (filters.brands.length > 0 && !testFilters({ brands: filters.brands })) {
      conflictingFilters.push('brands');
    }

    if (filters.onSale && !testFilters({ onSale: true })) {
      conflictingFilters.push('onSale');
    }

    // Check price range
    const productsInPriceRange = products.filter(p => {
      const price = p.salePrice || p.price;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });
    
    if (productsInPriceRange.length === 0) {
      conflictingFilters.push('priceRange');
    }

    return {
      hasConflicts: conflictingFilters.length > 0,
      conflictingFilters
    };
  } catch (error) {
    console.error('Error checking filter conflicts:', error);
    return { hasConflicts: false, conflictingFilters: [] };
  }
};

/**
 * Get suggested filters based on current selection
 */
export const getSuggestedFilters = (
  products: Product[],
  currentFilters: FilterState
): Partial<FilterState> => {
  try {
    const filteredProducts = applyFilters(products, currentFilters);
    
    if (filteredProducts.length === 0) {
      // If no products match, suggest loosening filters
      return {
        sizes: [],
        colors: [],
        brands: currentFilters.brands.slice(0, 1), // Keep only first brand
        priceRange: [0, Math.max(...products.map(p => p.salePrice || p.price))],
        onSale: false
      };
    }

    return currentFilters;
  } catch (error) {
    console.error('Error getting suggested filters:', error);
    return currentFilters;
  }
};

/**
 * Debounce function for filter inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};