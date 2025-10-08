import type { Product, FilterOptions } from '../../types/product-catalog';

export const mockProduct: Product = {
  id: '1',
  name: 'Classic Scrub Top',
  price: 29.99,
  salePrice: 24.99,
  images: [
    { url: '/test1.jpg', alt: 'Classic Scrub Top in White' },
    { url: '/test1-navy.jpg', alt: 'Classic Scrub Top in Navy' }
  ],
  colors: [
    { name: 'White', hex: '#FFFFFF', imageUrl: '/test1.jpg' },
    { name: 'Navy', hex: '#1E3A8A', imageUrl: '/test1-navy.jpg' },
    { name: 'Black', hex: '#000000', imageUrl: '/test1-black.jpg' }
  ],
  sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  brand: 'Test Brand',
  rating: 4.5,
  reviewCount: 127,
  isOnSale: false,
  category: 'scrubs',
}

export const mockProducts: Product[] = [
  mockProduct,
  {
    id: '2',
    name: 'Premium Scrub Pants',
    price: 34.99,
    salePrice: 29.99,
    images: [
      { url: '/test2.jpg', alt: 'Premium Scrub Pants' }
    ],
    colors: [
      { name: 'Navy', hex: '#1E3A8A', imageUrl: '/test2-navy.jpg' },
      { name: 'Black', hex: '#000000', imageUrl: '/test2-black.jpg' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    brand: 'Test Brand',
    rating: 4.2,
    reviewCount: 89,
    isOnSale: true,
    category: 'scrubs',
  },
  {
    id: '3',
    name: 'Comfort Fit Scrub Set',
    price: 59.99,
    images: [
      { url: '/test3.jpg', alt: 'Comfort Fit Scrub Set' }
    ],
    colors: [
      { name: 'White', hex: '#FFFFFF', imageUrl: '/test3-white.jpg' },
      { name: 'Gray', hex: '#6B7280', imageUrl: '/test3-gray.jpg' }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    brand: 'Premium Brand',
    rating: 4.8,
    reviewCount: 203,
    isOnSale: false,
    category: 'scrubs',
  },
  {
    id: '4',
    name: 'Athletic Scrub Top',
    price: 32.99,
    images: [
      { url: '/test4.jpg', alt: 'Athletic Scrub Top' }
    ],
    colors: [
      { name: 'Royal Blue', hex: '#2563EB', imageUrl: '/test4-royal.jpg' },
      { name: 'Forest Green', hex: '#059669', imageUrl: '/test4-green.jpg' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    brand: 'Athletic Brand',
    rating: 4.3,
    reviewCount: 156,
    isOnSale: false,
    category: 'scrubs',
  },
  {
    id: '5',
    name: 'Stretch Scrub Pants',
    price: 28.99,
    salePrice: 22.99,
    images: [
      { url: '/test5.jpg', alt: 'Stretch Scrub Pants' }
    ],
    colors: [
      { name: 'Charcoal', hex: '#374151', imageUrl: '/test5-charcoal.jpg' },
      { name: 'Wine', hex: '#991B1B', imageUrl: '/test5-wine.jpg' }
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    brand: 'Comfort Brand',
    rating: 4.6,
    reviewCount: 98,
    isOnSale: true,
    category: 'scrubs',
  },
  // Additional products for testing
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `test-${i + 6}`,
    name: `Test Scrub Product ${i + 6}`,
    price: 25.99 + (i * 2),
    salePrice: i % 3 === 0 ? (25.99 + (i * 2)) * 0.8 : undefined,
    images: [{ url: `/test${i + 6}.jpg`, alt: `Test Product ${i + 6}` }],
    colors: [
      { name: 'White', hex: '#FFFFFF', imageUrl: `/test${i + 6}-white.jpg` },
      { name: 'Navy', hex: '#1E3A8A', imageUrl: `/test${i + 6}-navy.jpg` }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    brand: i % 2 === 0 ? 'Test Brand' : 'Premium Brand',
    rating: 4.0 + (i % 5) * 0.2,
    reviewCount: 50 + (i * 10),
    isOnSale: i % 3 === 0,
    category: 'scrubs',
  })),
]

export const mockFilterOptions: FilterOptions = {
  availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  availableColors: [
    { name: 'White', hex: '#FFFFFF', imageUrl: '/colors/white.jpg' },
    { name: 'Navy', hex: '#1E3A8A', imageUrl: '/colors/navy.jpg' },
    { name: 'Black', hex: '#000000', imageUrl: '/colors/black.jpg' },
    { name: 'Gray', hex: '#6B7280', imageUrl: '/colors/gray.jpg' },
    { name: 'Royal Blue', hex: '#2563EB', imageUrl: '/colors/royal.jpg' },
    { name: 'Forest Green', hex: '#059669', imageUrl: '/colors/green.jpg' },
    { name: 'Charcoal', hex: '#374151', imageUrl: '/colors/charcoal.jpg' },
    { name: 'Wine', hex: '#991B1B', imageUrl: '/colors/wine.jpg' }
  ],
  availableBrands: ['Test Brand', 'Premium Brand', 'Athletic Brand', 'Comfort Brand'],
  priceRange: [0, 100]
};

export const mockEmptyProducts: Product[] = [];

export const mockSingleProduct: Product[] = [mockProduct];

export const mockOutOfStockProduct: Product = {
  ...mockProduct,
  id: 'out-of-stock-1',
  name: 'Out of Stock Scrub Top',
}