import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProductCard from '../ProductCard'
import type { Product } from '@/types/product-catalog'

// Mock product data
const mockProduct: Product = {
  id: 'test-product-1',
  name: 'Classic Scrub Top',
  price: 29.99,
  salePrice: 24.99,
  images: [
    { url: '/images/scrub-navy.jpg', alt: 'Navy scrub top', colorName: 'Navy' },
    { url: '/images/scrub-white.jpg', alt: 'White scrub top', colorName: 'White' }
  ],
  colors: [
    { name: 'Navy', hex: '#1e3a8a', imageUrl: '/images/scrub-navy.jpg' },
    { name: 'White', hex: '#ffffff', imageUrl: '/images/scrub-white.jpg' }
  ],
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  brand: 'Dev Egypt',
  rating: 4.5,
  reviewCount: 128,
  isOnSale: true,
  category: 'scrub-tops'
}

const mockProductNoSale: Product = {
  ...mockProduct,
  id: 'test-product-2',
  isOnSale: false,
  salePrice: undefined
}

const mockProductNoImage: Product = {
  ...mockProduct,
  id: 'test-product-3',
  images: []
}

const mockHandlers = {
  onAddToCart: vi.fn(),
  onAddToWishlist: vi.fn(),
  onColorChange: vi.fn()
}

describe('ProductCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} {...mockHandlers} />)
    
    expect(screen.getByText('Classic Scrub Top')).toBeInTheDocument()
    expect(screen.getByText('Dev Egypt')).toBeInTheDocument()
    expect(screen.getByText('$24.99')).toBeInTheDocument()
    expect(screen.getByText('$29.99')).toBeInTheDocument()
    expect(screen.getByText('(128)')).toBeInTheDocument()
  })

  it('displays sale badge when product is on sale', () => {
    render(<ProductCard product={mockProduct} {...mockHandlers} />)
    
    expect(screen.getByText('SALE')).toBeInTheDocument()
  })

  it('does not display sale badge when product is not on sale', () => {
    render(<ProductCard product={mockProductNoSale} {...mockHandlers} />)
    
    expect(screen.queryByText('SALE')).not.toBeInTheDocument()
  })

  it('displays regular price when not on sale', () => {
    render(<ProductCard product={mockProductNoSale} {...mockHandlers} />)
    
    expect(screen.getByText('$29.99')).toBeInTheDocument()
    expect(screen.queryByText('$24.99')).not.toBeInTheDocument()
  })

  it('renders color swatches', () => {
    render(<ProductCard product={mockProduct} {...mockHandlers} />)
    
    expect(screen.getByText('Colors:')).toBeInTheDocument()
    expect(screen.getByLabelText('Select Navy color')).toBeInTheDocument()
    expect(screen.getByLabelText('Select White color')).toBeInTheDocument()
  })

  it('handles color selection', () => {
    render(<ProductCard product={mockProduct} {...mockHandlers} />)
    
    const whiteColorSwatch = screen.getByLabelText('Select White color')
    fireEvent.click(whiteColorSwatch)
    
    expect(mockHandlers.onColorChange).toHaveBeenCalledWith('test-product-1', 'White')
  })

  it('handles add to cart button click', () => {
    render(<ProductCard product={mockProduct} {...mockHandlers} />)
    
    const addToCartButton = screen.getByText('Add to Cart')
    fireEvent.click(addToCartButton)
    
    expect(mockHandlers.onAddToCart).toHaveBeenCalledWith('test-product-1')
  })

  it('handles add to wishlist button click', () => {
    render(<ProductCard product={mockProduct} {...mockHandlers} />)
    
    const wishlistButton = screen.getByLabelText('Add to wishlist')
    fireEvent.click(wishlistButton)
    
    expect(mockHandlers.onAddToWishlist).toHaveBeenCalledWith('test-product-1')
  })

  it('displays placeholder when no image is available', () => {
    render(<ProductCard product={mockProductNoImage} {...mockHandlers} />)
    
    expect(screen.getByText('No Image')).toBeInTheDocument()
  })

  it('renders star rating correctly', () => {
    render(<ProductCard product={mockProduct} {...mockHandlers} />)
    
    // Check that the rating is displayed
    expect(screen.getByText('(128)')).toBeInTheDocument()
    
    // Check for star elements (they are SVGs, not img elements)
    const starContainer = screen.getByText('(128)').previousElementSibling
    expect(starContainer).toBeInTheDocument()
  })

  it('shows +X more indicator for many colors', () => {
    const productWithManyColors: Product = {
      ...mockProduct,
      colors: [
        ...mockProduct.colors,
        { name: 'Red', hex: '#dc2626', imageUrl: '/images/scrub-red.jpg' },
        { name: 'Blue', hex: '#2563eb', imageUrl: '/images/scrub-blue.jpg' },
        { name: 'Green', hex: '#16a34a', imageUrl: '/images/scrub-green.jpg' },
        { name: 'Yellow', hex: '#ca8a04', imageUrl: '/images/scrub-yellow.jpg' },
        { name: 'Purple', hex: '#9333ea', imageUrl: '/images/scrub-purple.jpg' },
        { name: 'Pink', hex: '#ec4899', imageUrl: '/images/scrub-pink.jpg' },
        { name: 'Orange', hex: '#ea580c', imageUrl: '/images/scrub-orange.jpg' },
        { name: 'Gray', hex: '#6b7280', imageUrl: '/images/scrub-gray.jpg' }
      ]
    }
    
    render(<ProductCard product={productWithManyColors} {...mockHandlers} />)
    
    expect(screen.getByText('+2 more')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <ProductCard product={mockProduct} {...mockHandlers} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})