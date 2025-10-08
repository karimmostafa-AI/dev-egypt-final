import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductCatalogPage from '../../../components/product-catalog/ProductCatalogPage'
import { mockProducts, mockFilterOptions } from '../mocks/productData'

// Mock external dependencies for E2E testing
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/catalog/scrubs',
}))

vi.mock('../../../src/hooks/useCart', () => ({
  useCart: () => ({
    addToCart: vi.fn().mockResolvedValue({ success: true }),
    items: [],
    isLoading: false,
    totalItems: 0,
  }),
}))

vi.mock('../../../src/hooks/useWishlist', () => ({
  useWishlist: () => ({
    addToWishlist: vi.fn().mockResolvedValue({ success: true }),
    removeFromWishlist: vi.fn().mockResolvedValue({ success: true }),
    isInWishlist: vi.fn(() => false),
    items: [],
    isLoading: false,
  }),
}))

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User', email: 'test@example.com' },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

describe('End-to-End Critical User Paths', () => {
  const defaultProps = {
    category: 'scrubs',
    initialProducts: mockProducts,
    filters: mockFilterOptions,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Shopping Journey', () => {
    it('should complete full product discovery to purchase flow', async () => {
      const user = userEvent.setup()
      render(<ProductCatalogPage {...defaultProps} />)

      // Step 1: User lands on category page
      expect(screen.getByText('Scrubs')).toBeInTheDocument()
      expect(screen.getByText('24 Products')).toBeInTheDocument()

      // Step 2: User browses products
      const productCards = screen.getAllByTestId('product-card')
      expect(productCards).toHaveLength(8) // First page

      // Step 3: User applies filters to narrow down options
      await user.click(screen.getByLabelText('Medium'))
      await user.click(screen.getByLabelText('Blue'))

      await waitFor(() => {
        expect(screen.getByText(/\d+ Products/)).toBeInTheDocument()
      })

      // Step 4: User sorts products by price
      const sortSelect = screen.getByTestId('sort-select')
      await user.selectOptions(sortSelect, 'price-low-high')

      await waitFor(() => {
        const updatedCards = screen.getAllByTestId('product-card')
        expect(updatedCards.length).toBeGreaterThan(0)
      })

      // Step 5: User selects a color variant
      const colorSwatch = screen.getAllByTestId('color-swatch')[0]
      await user.click(colorSwatch)

      await waitFor(() => {
        expect(colorSwatch).toHaveAttribute('data-selected', 'true')
      })

      // Step 6: User adds product to cart
      const addToCartButton = screen.getAllByTestId('add-to-cart')[0]
      await user.click(addToCartButton)

      await waitFor(() => {
        expect(screen.getByText(/added to cart/i)).toBeInTheDocument()
      })

      // Step 7: User adds product to wishlist
      const addToWishlistButton = screen.getAllByTestId('add-to-wishlist')[0]
      await user.click(addToWishlistButton)

      await waitFor(() => {
        expect(screen.getByText(/added to wishlist/i)).toBeInTheDocument()
      })

      // Verify the complete flow was successful
      expect(screen.getByTestId('product-grid')).toBeInTheDocument()
    })

    it('should handle mobile shopping journey', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      window.dispatchEvent(new Event('resize'))

      const user = userEvent.setup()
      render(<ProductCatalogPage {...defaultProps} />)

      // Step 1: User opens mobile filter drawer
      const filterButton = screen.getByTestId('mobile-filter-button')
      await user.click(filterButton)

      await waitFor(() => {
        expect(screen.getByTestId('mobile-filter-drawer')).toBeInTheDocument()
      })

      // Step 2: User applies filters in mobile drawer
      await user.click(screen.getByLabelText('Large'))
      await user.click(screen.getByLabelText('Red'))

      // Step 3: User applies filters
      const applyButton = screen.getByText('Apply Filters')
      await user.click(applyButton)

      await waitFor(() => {
        expect(screen.queryByTestId('mobile-filter-drawer')).not.toBeInTheDocument()
      })

      // Step 4: User scrolls through products (mobile grid)
      const productGrid = screen.getByTestId('product-grid')
      expect(productGrid).toHaveClass('grid-cols-2')

      // Step 5: User adds product to cart on mobile
      const addToCartButton = screen.getAllByTestId('add-to-cart')[0]
      await user.click(addToCartButton)

      await waitFor(() => {
        expect(screen.getByText(/added to cart/i)).toBeInTheDocument()
      })
    })
  })

  describe('Filter and Search Workflows', () => {
    it('should handle complex multi-filter scenarios', async () => {
      const user = userEvent.setup()
      render(<ProductCatalogPage {...defaultProps} />)

      // Apply multiple filters in sequence
      await user.click(screen.getByLabelText('Small'))
      await user.click(screen.getByLabelText('Medium'))
      await user.click(screen.getByLabelText('Blue'))
      await user.click(screen.getByLabelText('Cherokee'))

      // Apply price range filter
      const priceSlider = screen.getByTestId('price-range-slider')
      fireEvent.change(priceSlider, { target: { value: [25, 75] } })

      await waitFor(() => {
        expect(screen.getByText(/\d+ Products/)).toBeInTheDocument()
      })

      // Sort filtered results
      const sortSelect = screen.getByTestId('sort-select')
      await user.selectOptions(sortSelect, 'name-asc')

      await waitFor(() => {
        const productCards = screen.getAllByTestId('product-card')
        expect(productCards.length).toBeGreaterThan(0)
      })

      // Clear specific filters
      await user.click(screen.getByLabelText('Small'))
      
      await waitFor(() => {
        // Should update product count
        expect(screen.getByText(/\d+ Products/)).toBeInTheDocument()
      })

      // Clear all filters
      const clearAllButton = screen.getByText('Clear All')
      await user.click(clearAllButton)

      await waitFor(() => {
        expect(screen.getByText('24 Products')).toBeInTheDocument()
      })
    })

    it('should handle filter persistence across page navigation', async () => {
      const user = userEvent.setup()
      render(<ProductCatalogPage {...defaultProps} />)

      // Apply filters
      await user.click(screen.getByLabelText('Medium'))
      await user.click(screen.getByLabelText('Blue'))

      await waitFor(() => {
        expect(screen.getByText(/\d+ Products/)).toBeInTheDocument()
      })

      // Navigate to next page
      const nextPageButton = screen.getByTestId('next-page')
      await user.click(nextPageButton)

      await waitFor(() => {
        expect(screen.getByText('Page 2')).toBeInTheDocument()
      })

      // Verify filters are still applied
      expect(screen.getByLabelText('Medium')).toBeChecked()
      expect(screen.getByLabelText('Blue')).toBeChecked()

      // Navigate back
      const prevPageButton = screen.getByTestId('prev-page')
      await user.click(prevPageButton)

      await waitFor(() => {
        expect(screen.getByText('Page 1')).toBeInTheDocument()
      })

      // Filters should still be applied
      expect(screen.getByLabelText('Medium')).toBeChecked()
      expect(screen.getByLabelText('Blue')).toBeChecked()
    })
  })

  describe('Cart and Wishlist Integration', () => {
    it('should handle complete cart workflow', async () => {
      const user = userEvent.setup()
      render(<ProductCatalogPage {...defaultProps} />)

      // Add multiple products to cart
      const addToCartButtons = screen.getAllByTestId('add-to-cart')
      
      await user.click(addToCartButtons[0])
      await waitFor(() => {
        expect(screen.getByText(/added to cart/i)).toBeInTheDocument()
      })

      await user.click(addToCartButtons[1])
      await waitFor(() => {
        expect(screen.getByText(/added to cart/i)).toBeInTheDocument()
      })

      // Verify cart state updates
      // This would typically update a cart counter in the header
    })

    it('should handle wishlist workflow with authentication', async () => {
      const user = userEvent.setup()
      render(<ProductCatalogPage {...defaultProps} />)

      // Add to wishlist (user is authenticated)
      const addToWishlistButton = screen.getAllByTestId('add-to-wishlist')[0]
      await user.click(addToWishlistButton)

      await waitFor(() => {
        expect(screen.getByText(/added to wishlist/i)).toBeInTheDocument()
      })

      // Remove from wishlist
      const removeFromWishlistButton = screen.getAllByTestId('remove-from-wishlist')[0]
      await user.click(removeFromWishlistButton)

      await waitFor(() => {
        expect(screen.getByText(/removed from wishlist/i)).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Behavior Workflows', () => {
    it('should handle viewport changes during user interaction', async () => {
      const user = userEvent.setup()
      
      // Start on desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      })
      
      render(<ProductCatalogPage {...defaultProps} />)

      // Apply filters on desktop
      await user.click(screen.getByLabelText('Medium'))
      
      // Switch to mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      window.dispatchEvent(new Event('resize'))

      await waitFor(() => {
        // Should show mobile filter button
        expect(screen.getByTestId('mobile-filter-button')).toBeInTheDocument()
      })

      // Filters should still be applied
      expect(screen.getByLabelText('Medium')).toBeChecked()

      // Switch back to desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      })
      window.dispatchEvent(new Event('resize'))

      await waitFor(() => {
        // Should show desktop sidebar
        expect(screen.getByTestId('filter-sidebar')).toBeInTheDocument()
      })
    })
  })

  describe('Performance Critical Paths', () => {
    it('should handle large product sets efficiently', async () => {
      const largeProductSet = Array.from({ length: 100 }, (_, i) => ({
        ...mockProducts[0],
        id: `product-${i}`,
        name: `Product ${i}`,
      }))

      const user = userEvent.setup()
      render(
        <ProductCatalogPage
          {...defaultProps}
          initialProducts={largeProductSet}
        />
      )

      // Should render first page quickly
      expect(screen.getByText('100 Products')).toBeInTheDocument()
      
      // Apply filter to large dataset
      await user.click(screen.getByLabelText('Medium'))

      await waitFor(() => {
        expect(screen.getByText(/\d+ Products/)).toBeInTheDocument()
      }, { timeout: 3000 })

      // Should handle pagination efficiently
      const nextPageButton = screen.getByTestId('next-page')
      await user.click(nextPageButton)

      await waitFor(() => {
        expect(screen.getByText('Page 2')).toBeInTheDocument()
      })
    })

    it('should handle rapid user interactions without lag', async () => {
      const user = userEvent.setup()
      render(<ProductCatalogPage {...defaultProps} />)

      // Rapid filter toggling
      const sizeFilter = screen.getByLabelText('Medium')
      
      for (let i = 0; i < 5; i++) {
        await user.click(sizeFilter)
        await user.click(sizeFilter)
      }

      // Should still be responsive
      expect(screen.getByTestId('product-grid')).toBeInTheDocument()
    })
  })

  describe('Error Recovery Workflows', () => {
    it('should recover from network failures gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock network failure
      const mockFailingCart = vi.fn().mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true })

      vi.mocked(vi.fn()).mockImplementation(() => ({
        useCart: () => ({
          addToCart: mockFailingCart,
          items: [],
          isLoading: false,
        }),
      }))

      render(<ProductCatalogPage {...defaultProps} />)

      // First attempt fails
      const addToCartButton = screen.getAllByTestId('add-to-cart')[0]
      await user.click(addToCartButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to add to cart/i)).toBeInTheDocument()
      })

      // Retry should succeed
      const retryButton = screen.getByText('Retry')
      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText(/added to cart/i)).toBeInTheDocument()
      })
    })
  })
})