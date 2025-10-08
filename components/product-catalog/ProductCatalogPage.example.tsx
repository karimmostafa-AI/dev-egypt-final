import ProductCatalogPage from './ProductCatalogPage';
import type { Product, FilterOptions } from '@/types/product-catalog';

// Example products data
const exampleProducts: Product[] = [
  {
    id: '1',
    name: 'Classic White Scrub Top',
    price: 29.99,
    salePrice: 24.99,
    images: [
      { url: '/images/scrub-white-1.jpg', alt: 'White scrub top front view' },
      { url: '/images/scrub-white-2.jpg', alt: 'White scrub top back view' }
    ],
    colors: [
      { name: 'White', hex: '#FFFFFF', imageUrl: '/images/scrub-white-1.jpg' },
      { name: 'Navy', hex: '#1E3A8A', imageUrl: '/images/scrub-navy-1.jpg' },
      { name: 'Black', hex: '#000000', imageUrl: '/images/scrub-black-1.jpg' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    brand: 'Dev Egypt',
    rating: 4.5,
    reviewCount: 128,
    isOnSale: true,
    category: 'scrubs'
  },
  {
    id: '2',
    name: 'Comfort Fit Scrub Pants',
    price: 34.99,
    images: [
      { url: '/images/pants-navy-1.jpg', alt: 'Navy scrub pants' }
    ],
    colors: [
      { name: 'Navy', hex: '#1E3A8A', imageUrl: '/images/pants-navy-1.jpg' },
      { name: 'Black', hex: '#000000', imageUrl: '/images/pants-black-1.jpg' },
      { name: 'Gray', hex: '#6B7280', imageUrl: '/images/pants-gray-1.jpg' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    brand: 'Dev Egypt',
    rating: 4.2,
    reviewCount: 89,
    isOnSale: false,
    category: 'scrubs'
  },
  {
    id: '3',
    name: 'Professional Lab Coat',
    price: 49.99,
    salePrice: 39.99,
    images: [
      { url: '/images/labcoat-white-1.jpg', alt: 'White lab coat' }
    ],
    colors: [
      { name: 'White', hex: '#FFFFFF', imageUrl: '/images/labcoat-white-1.jpg' }
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    brand: 'Cherokee',
    rating: 4.7,
    reviewCount: 203,
    isOnSale: true,
    category: 'lab-coats'
  },
  {
    id: '4',
    name: 'Compression Socks',
    price: 19.99,
    images: [
      { url: '/images/socks-black-1.jpg', alt: 'Black compression socks' }
    ],
    colors: [
      { name: 'Black', hex: '#000000', imageUrl: '/images/socks-black-1.jpg' },
      { name: 'White', hex: '#FFFFFF', imageUrl: '/images/socks-white-1.jpg' },
      { name: 'Navy', hex: '#1E3A8A', imageUrl: '/images/socks-navy-1.jpg' }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    brand: 'Dickies',
    rating: 4.3,
    reviewCount: 67,
    isOnSale: false,
    category: 'accessories'
  }
];

// Example filter options
const exampleFilterOptions: FilterOptions = {
  availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  availableColors: [
    { name: 'White', hex: '#FFFFFF', imageUrl: '/images/color-white.jpg' },
    { name: 'Navy', hex: '#1E3A8A', imageUrl: '/images/color-navy.jpg' },
    { name: 'Black', hex: '#000000', imageUrl: '/images/color-black.jpg' },
    { name: 'Gray', hex: '#6B7280', imageUrl: '/images/color-gray.jpg' },
    { name: 'Royal Blue', hex: '#2563EB', imageUrl: '/images/color-royal.jpg' },
    { name: 'Burgundy', hex: '#991B1B', imageUrl: '/images/color-burgundy.jpg' },
    { name: 'Teal', hex: '#0D9488', imageUrl: '/images/color-teal.jpg' },
    { name: 'Pink', hex: '#EC4899', imageUrl: '/images/color-pink.jpg' }
  ],
  availableBrands: ['Dev Egypt', 'Cherokee', 'Dickies', 'WonderWink', 'Barco', 'FIGS'],
  priceRange: [0, 200]
};

/**
 * Example 1: Basic Scrubs Category Page
 */
export const ScrubsCatalogExample = () => (
  <ProductCatalogPage
    category="scrubs"
    initialProducts={exampleProducts.filter(p => p.category === 'scrubs')}
    filters={exampleFilterOptions}
  />
);

/**
 * Example 2: Lab Coats Category Page
 */
export const LabCoatsCatalogExample = () => (
  <ProductCatalogPage
    category="lab-coats"
    initialProducts={exampleProducts.filter(p => p.category === 'lab-coats')}
    filters={exampleFilterOptions}
  />
);

/**
 * Example 3: All Products Catalog
 */
export const AllProductsCatalogExample = () => (
  <ProductCatalogPage
    category="all-products"
    initialProducts={exampleProducts}
    filters={exampleFilterOptions}
  />
);

/**
 * Example 4: Accessories Category Page
 */
export const AccessoriesCatalogExample = () => (
  <ProductCatalogPage
    category="accessories"
    initialProducts={exampleProducts.filter(p => p.category === 'accessories')}
    filters={{
      ...exampleFilterOptions,
      // Customize filter options for accessories
      availableSizes: ['S', 'M', 'L', 'XL'], // Accessories might have different sizes
      priceRange: [0, 50] // Lower price range for accessories
    }}
  />
);

/**
 * Example 5: Empty State (No Products)
 */
export const EmptyCatalogExample = () => (
  <ProductCatalogPage
    category="out-of-stock"
    initialProducts={[]}
    filters={exampleFilterOptions}
  />
);

/**
 * Example 6: Single Product Category
 */
export const SingleProductExample = () => (
  <ProductCatalogPage
    category="featured"
    initialProducts={[exampleProducts[0]]}
    filters={exampleFilterOptions}
  />
);

/**
 * Example Usage in a Next.js Page
 */
export default function CatalogPageExample() {
  return (
    <div>
      <h1>Product Catalog Examples</h1>
      
      {/* Example with dynamic category from URL */}
      <ScrubsCatalogExample />
      
      {/* You could also use it with dynamic data: */}
      {/* 
      <ProductCatalogPage
        category={params.category}
        initialProducts={await fetchProducts(params.category)}
        filters={await fetchFilterOptions(params.category)}
      />
      */}
    </div>
  );
}

/**
 * Example API Integration
 */
export async function getServerSideProps(context: any) {
  const { category } = context.params;
  
  try {
    // In a real app, these would be API calls
    const products = await fetchProductsByCategory(category);
    const filterOptions = await fetchFilterOptions(category);
    
    return {
      props: {
        category,
        initialProducts: products,
        filters: filterOptions
      }
    };
  } catch (error) {
    return {
      notFound: true
    };
  }
}

// Mock API functions (replace with real API calls)
async function fetchProductsByCategory(category: string): Promise<Product[]> {
  // Simulate API call
  return exampleProducts.filter(p => p.category === category);
}

async function fetchFilterOptions(category: string): Promise<FilterOptions> {
  // Simulate API call
  return exampleFilterOptions;
}