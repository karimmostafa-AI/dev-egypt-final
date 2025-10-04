import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductCatalogPage from '../../../components/product-catalog/ProductCatalogPage'
import ProductCard from '../../../components/product-catalog/ProductCard'
import FilterSidebar from '../../../components/product-catalog/FilterSidebar'
import { mockProducts, mockFilterOptions } from '../mocks/productData'

// Mock console.error to test error handling
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('Error Handling and Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    consoleSpy.mockClear()
  })

  describe('Data Loading Errors', () => {
    it('should handle empty product list gracefully', () => {
      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={[]}
          filters={mockFilterOptions}
        />
      )

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText(/no products found/i)).toBeInTheDocument()
      expect(screen.getByText(/try adjusting your filters/i)).toBeInTheDocument()
    })

    it('should handle null/undefined product data', () => {
      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={null as any}
          filters={mockFilterOptions}
        />
      )

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })

    it('should handle malformed product data', () => {
      const malformedProducts = [
        { id: '1' }, // Missing required fields
        { id: '2', name: 'Test Product' }, // Missing price
        null, // Null product
        undefined, // Undefined product
      ] as any

      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={malformedProducts}
          filters={mockFilterOptions}
        />
      )

      // Should filter out invalid products and show valid ones
      expect(screen.queryByText('Test Product')).not.toBeInTheDocument()
    })
  })

  describe('Image Loading Errors', () => {
    it('should handle missing product images', () => {
      const productWithoutImage = {
        id: '1',
        name: 'Test Product',
        price: 29.99,
        images: [],
        colors: [],
        sizes: ['S', 'M', 'L'],
        brand: 'Test Brand',
        rating: 4.5,
        reviewCount: 10,
        isOnSale: false,
        category: 'scrubs',
      }

      render(<ProductCard product={productWithoutImage} onAddToCart={vi.fn()} onAddToWishlist={vi.fn()} onColorChange={vi.fn()} />)

      const placeholderImage = screen.getByTestId('placeholder-image')
      expect(placeholderImage).toBeInTheDocument()
    })

    it('should handle image loading failures', async () => {
      const productWithBrokenImage = {
        id: '1',
        name: 'Test Product',
        price: 29.99,
        images: [{ url: 'broken-image.jpg', alt: 'Test' }],
        colors: [],
        sizes: ['S', 'M', 'L'],
        brand: 'Test Brand',
        rating: 4.5,
        reviewCount: 10,
        isOnSale: false,
        category: 'scrubs',
      }

      render(<ProductCard product={productWithBrokenImage} onAddToCart={vi.fn()} onAddToWishlist={vi.fn()} onColorChange={vi.fn()} />)

      const productImage = screen.getByTestId('product-image')
      
      // Simulate image error
      fireEvent.error(productImage)

      await waitFor(() => {
        expect(screen.getByTestId('placeholder-image')).toBeInTheDocument()
      })
    })
  })

  describe('Filter Edge Cases', () => {
    it('should handle filters with no matching products', async () => {
      const user = userEvent.setup()
      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      )

      // Apply filters that would result in no matches
      await user.click(screen.getByLabelText('XXXL')) // Assuming this size doesn't exist
      await user.click(screen.getByLabelText('Purple')) // Assuming this color doesn't exist

      await waitFor(() => {
        expect(screen.getByTestId('no-results-state')).toBeInTheDocument()
        expect(screen.getByText(/no products match your filters/i)).toBeInTheDocument()
      })
    })

    it('should handle invalid price range inputs', async () => {
      const user = userEvent.setup()
      render(
        <FilterSidebar
          filters={mockFilterOptions}
          currentFilters={{
            sizes: [],
            colors: [],
            brands: [],
            priceRange: [0, 100],
            onSale: false,
          }}
          onFilterChange={vi.fn()}
          onClearFilters={vi.fn()}
          productCount={0}
        />
      )

      const minPriceInput = screen.getByTestId('min-price-input')
      const maxPriceInput = screen.getByTestId('max-price-input')

      // Test invalid inputs
      await user.clear(minPriceInput)
      await user.type(minPriceInput, '-10') // Negative price

      await user.clear(maxPriceInput)
      await user.type(maxPriceInput, 'abc') // Non-numeric

      // Should handle gracefully without crashing
      expect(minPriceInput).toHaveValue('0') // Should default to 0
      expect(maxPriceInput).toHaveValue('100') // Should keep previous valid value
    })

    it('should handle extremely large filter lists', () => {
      const largeFilterOptions = {
        ...mockFilterOptions,
        availableSizes: Array.from({ length: 100 }, (_, i) => `Size${i}`),
        availableBrands: Array.from({ length: 50 }, (_, i) => `Brand${i}`),
      }

      render(
        <FilterSidebar
          filters={largeFilterOptions}
          currentFilters={{
            sizes: [],
            colors: [],
            brands: [],
            priceRange: [0, 100],
            onSale: false,
          }}
          onFilterChange={vi.fn()}
          onClearFilters={vi.fn()}
          productCount={0}
        />
      )

      // Should render without performance issues
      expect(screen.getByTestId('size-filter')).toBeInTheDocument()
      expect(screen.getByTestId('brand-filter')).toBeInTheDocument()
    })
  })

  describe('Network and API Errors', () => {
    it('should handle cart API failures', async () => {
      const mockAddToCart = vi.fn().mockRejectedValue(new Error('Network error'))
      
      vi.mock('../../../src/hooks/useCart', () => ({
        useCart: () => ({
          addToCart: mockAddToCart,
          items: [],
          isLoading: false,
        }),
      }))

      const user = userEvent.setup()
      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      )

      const addToCartButton = screen.getAllByTestId('add-to-cart')[0]
      await user.click(addToCartButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to add to cart/i)).toBeInTheDocument()
      })
    })

    it('should handle wishlist API failures', async () => {
      const mockAddToWishlist = vi.fn().mockRejectedValue(new Error('Network error'))
      
      vi.mock('../../../src/hooks/useWishlist', () => ({
        useWishlist: () => ({
          addToWishlist: mockAddToWishlist,
          removeFromWishlist: vi.fn(),
          isInWishlist: vi.fn(() => false),
          items: [],
          isLoading: false,
        }),
      }))

      const user = userEvent.setup()
      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      )

      const addToWishlistButton = screen.getAllByTestId('add-to-wishlist')[0]
      await user.click(addToWishlistButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to add to wishlist/i)).toBeInTheDocument()
      })
    })
  })

  describe('Browser Compatibility Edge Cases', () => {
    it('should handle missing IntersectionObserver', () => {
      const originalIntersectionObserver = global.IntersectionObserver
      delete (global as any).IntersectionObserver

      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      )

      // Should still render without lazy loading
      expect(screen.getByTestId('product-grid')).toBeInTheDocument()

      // Restore
      global.IntersectionObserver = originalIntersectionObserver
    })

    it('should handle missing ResizeObserver', () => {
      const originalResizeObserver = global.ResizeObserver
      delete (global as any).ResizeObserver

      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      )

      // Should still render without responsive features
      expect(screen.getByTestId('product-grid')).toBeInTheDocument()

      // Restore
      global.ResizeObserver = originalResizeObserver
    })
  })

  describe('Memory and Performance Edge Cases', () => {
    it('should handle rapid filter changes without memory leaks', async () => {
      const user = userEvent.setup()
      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      )

      // Rapidly toggle filters
      for (let i = 0; i < 10; i++) {
        await user.click(screen.getByLabelText('Small'))
        await user.click(screen.getByLabelText('Small'))
      }

      // Should not crash or show errors
      expect(screen.getByTestId('product-grid')).toBeInTheDocument()
    })

    it('should handle component unmounting during async operations', async () => {
      const { unmount } = render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      )

      // Start an async operation
      const addToCartButton = screen.getAllByTestId('add-to-cart')[0]
      fireEvent.click(addToCartButton)

      // Unmount component immediately
      unmount()

      // Should not cause memory leaks or errors
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('memory leak')
      )
    })
  })

  describe('Accessibility Edge Cases', () => {
    it('should handle keyboard navigation with no focusable elements', () => {
      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={[]}
          filters={{
            availableSizes: [],
            availableColors: [],
            availableBrands: [],
            priceRange: [0, 0],
          }}
        />
      )

      // Should still be navigable
      const emptyState = screen.getByTestId('empty-state')
      expect(emptyState).toBeInTheDocument()
    })

    it('should handle screen reader announcements for dynamic content', async () => {
      const user = userEvent.setup()
      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      )

      await user.click(screen.getByLabelText('Small'))

      await waitFor(() => {
        const announcement = screen.getByRole('status')
        expect(announcement).toHaveTextContent(/products updated/i)
      })
    })
  })

  describe('URL and State Edge Cases', () => {
    it('should handle invalid URL parameters gracefully', () => {
      // Mock invalid URL parameters
      const mockSearchParams = new URLSearchParams('?size=invalid&price=abc&page=-1')
      
      Object.defineProperty(window, 'location', {
        value: {
          search: mockSearchParams.toString(),
        },
        writable: true,
      })

      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      )

      // Should render with default values
      expect(screen.getByText('24 Products')).toBeInTheDocument()
    })

    it('should handle browser back/forward navigation edge cases', () => {
      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      )

      // Simulate browser navigation
      const popStateEvent = new PopStateEvent('popstate', {
        state: { filters: { invalid: 'data' } },
      })
      
      window.dispatchEvent(popStateEvent)

      // Should handle gracefully
      expect(screen.getByTestId('product-grid')).toBeInTheDocument()
    })
  })
})