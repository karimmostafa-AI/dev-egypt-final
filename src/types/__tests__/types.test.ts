import { describe, it, expect } from 'vitest'
import type { 
  Product, 
  ColorOption, 
  FilterState, 
  ProductCardProps,
  SortOption 
} from '../product-catalog'
import { 
  isProduct, 
  isColorOption, 
  isValidSortOption,
  createDefaultFilterState 
} from '../validation'

// Test data that should match our types
const mockColorOption: ColorOption = {
  name: 'Navy Blue',
  hex: '#1e3a8a',
  imageUrl: '/images/navy-product.jpg'
}

const mockProduct: Product = {
  id: 'prod-123',
  name: 'Classic Scrub Top',
  price: 29.99,
  salePrice: 24.99,
  images: [
    { url: '/images/scrub-navy.jpg', alt: 'Navy scrub top' },
    { url: '/images/scrub-white.jpg', alt: 'White scrub top' }
  ],
  colors: [mockColorOption],
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  brand: 'Dev Egypt',
  rating: 4.5,
  reviewCount: 128,
  isOnSale: true,
  category: 'scrub-tops'
}

const mockFilterState: FilterState = {
  sizes: ['M', 'L'],
  colors: ['Navy Blue'],
  brands: ['Dev Egypt'],
  priceRange: [20, 50],
  onSale: true
}

describe('Type Validation', () => {
  it('validates Product objects correctly', () => {
    expect(isProduct(mockProduct)).toBe(true)
    expect(isProduct({})).toBe(false)
    expect(isProduct(null)).toBe(false)
  })

  it('validates ColorOption objects correctly', () => {
    expect(isColorOption(mockColorOption)).toBe(true)
    expect(isColorOption({})).toBe(false)
    expect(isColorOption({ name: 'Blue' })).toBe(false) // missing hex and imageUrl
  })

  it('validates sort options correctly', () => {
    expect(isValidSortOption('price-low')).toBe(true)
    expect(isValidSortOption('price-high')).toBe(true)
    expect(isValidSortOption('name')).toBe(true)
    expect(isValidSortOption('popularity')).toBe(true)
    expect(isValidSortOption('newest')).toBe(true)
    expect(isValidSortOption('invalid')).toBe(false)
  })

  it('creates default filter state correctly', () => {
    const defaultFilters = createDefaultFilterState()
    
    expect(defaultFilters).toEqual({
      sizes: [],
      colors: [],
      brands: [],
      priceRange: [0, 1000],
      onSale: false
    })
  })

  it('validates component props interface', () => {
    const mockProductCardProps: ProductCardProps = {
      product: mockProduct,
      onAddToCart: (productId: string) => console.log('Add to cart:', productId),
      onAddToWishlist: (productId: string) => console.log('Add to wishlist:', productId),
      onColorChange: (productId: string, colorName: string) => 
        console.log('Color change:', productId, colorName)
    }
    
    expect(mockProductCardProps.product).toBe(mockProduct)
    expect(typeof mockProductCardProps.onAddToCart).toBe('function')
    expect(typeof mockProductCardProps.onAddToWishlist).toBe('function')
    expect(typeof mockProductCardProps.onColorChange).toBe('function')
  })
})

export {
  mockProduct,
  mockColorOption,
  mockFilterState
}