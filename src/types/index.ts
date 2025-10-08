// Export all product catalog types
export * from './product-catalog';

// Export common utility types
export * from './common';

// Export validation utilities
export * from './validation';

// Re-export commonly used types for convenience
export type {
  Product,
  ColorOption,
  FilterState,
  FilterOptions,
  SortOption,
  ProductCardProps,
  ProductCatalogPageProps,
  CatalogState,
  CatalogAction
} from './product-catalog';

export type {
  LoadingState,
  ApiResponse,
  PaginationMeta,
  BaseComponentProps,
  ClickHandler,
  ChangeHandler
} from './common';