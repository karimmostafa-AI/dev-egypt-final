// Core product interfaces
export interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  images: ProductImage[];
  colors: ColorOption[];
  sizes: string[];
  brand: string;
  rating: number;
  reviewCount: number;
  isOnSale: boolean;
  category: string;
}

export interface ProductImage {
  url: string;
  alt: string;
  colorName?: string;
}

export interface ColorOption {
  name: string;
  hex: string;
  imageUrl: string;
}

// Filter interfaces
export interface FilterState {
  sizes: string[];
  colors: string[];
  brands: string[];
  priceRange: [number, number];
  onSale: boolean;
}

export interface FilterOptions {
  availableSizes: string[];
  availableColors: ColorOption[];
  availableBrands: string[];
  priceRange: [number, number];
}

// Sorting types
export type SortOption = 'price-low' | 'price-high' | 'name' | 'popularity' | 'newest';

export interface SortState {
  option: SortOption;
  direction: 'asc' | 'desc';
}

// Component prop interfaces
export interface ProductCatalogPageProps {
  category: string;
  initialProducts: Product[];
  filters: FilterOptions;
}

export interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
  onAddToWishlist: (productId: string) => void;
  onColorChange: (productId: string, colorName: string) => void;
  className?: string;
}

export interface ColorSwatchProps {
  colors: ColorOption[];
  selectedColor?: string;
  onColorSelect: (colorName: string) => void;
  maxVisible?: number;
}

export interface FilterSidebarProps {
  filters: FilterOptions;
  currentFilters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  productCount: number;
}

export interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  onAddToCart: (productId: string) => void;
  onAddToWishlist: (productId: string) => void;
  currentSort?: SortState;
  onSortChange?: (sort: SortState) => void;
  productCount?: number;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  paginationLoading?: boolean;
}

export interface CategoryHeaderProps {
  category: string;
  productCount: number;
  breadcrumbs: BreadcrumbItem[];
}

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export interface SortControlsProps {
  currentSort: SortState;
  onSortChange: (sort: SortState) => void;
}

export interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  currentFilters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  productCount: number;
}

// Utility types for filtering and sorting
export type FilterFunction<T> = (item: T, filters: FilterState) => boolean;
export type SortFunction<T> = (a: T, b: T, sortState: SortState) => number;

export interface FilterUtilities {
  applyFilters: FilterFunction<Product>;
  sortProducts: SortFunction<Product>;
  getFilteredCount: (products: Product[], filters: FilterState) => number;
}

// State management types
export interface CatalogState {
  products: Product[];
  filteredProducts: Product[];
  filters: FilterState;
  sort: SortState;
  currentPage: number;
  loading: boolean;
  error: string | null;
}

export type CatalogAction = 
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_FILTERS'; payload: FilterState }
  | { type: 'SET_SORT'; payload: SortState }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_FILTERS' };

// API response types
export interface ProductCatalogResponse {
  products: Product[];
  totalCount: number;
  filters: FilterOptions;
  currentPage: number;
  totalPages: number;
}

// Hook return types
export interface UseProductCatalogReturn {
  state: CatalogState;
  actions: {
    setFilters: (filters: FilterState) => void;
    setSort: (sort: SortState) => void;
    setPage: (page: number) => void;
    clearFilters: () => void;
    addToCart: (productId: string) => void;
    addToWishlist: (productId: string) => void;
  };
  hasActiveFilters: boolean;
  totalPages: number;
  totalProducts: number;
}

export interface UseFilterReturn {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  clearFilters: () => void;
  applyFilter: (key: keyof FilterState, value: any) => void;
  toggleFilter: (key: 'sizes' | 'colors' | 'brands', value: string) => void;
  resetFilter: (key: keyof FilterState) => void;
  hasActiveFilters: boolean;
}