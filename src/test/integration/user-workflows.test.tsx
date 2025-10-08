import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductCatalogPage from '../../../components/product-catalog/ProductCatalogPage'
import { mockProducts, mockFilterOptions } from '../mocks/productData'

// Mock hooks
vi.mock('../../../src/hooks/useCart', () => ({
  useCart: () => ({
    addToCart: vi.fn(),
    items: [],
    isLoading: false,
  }),
}))

vi.mock('../../../src/hooks/useWishlist', () => ({
  useWishlist: () => ({
    addToWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
    isInWishlist: vi.fn(() => false),
    items: [],
    isLoading: false,
  }),
}))

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User' },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

describe('User Workflows Integration Tests', () => {
  const defaultProps = {
    category: 'scrubs',
    initialProducts: mockProducts,
    filters: mockFilterOptions,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Shopping Workflow', () => {
    it('should allow user to browse, filter, and add products to cart', async () => {
      const user = userEvent.setup()
      render(<ProductCatalogPage {...defaultProps} />)

      // 1. Verify initial product display
      expect(screen.getByText('24 Products')).toBeInTheDocument()
      expect(screen.getAllByTestId('product-card')).toHaveLength(8) // First page

      // 2. Apply size filter
      const sizeFilter = screen.getByLabelText('Small')
      await user.click(sizeFilter)

      await waitFor(() => {
        expect(screen.getByText(/\d+ Products/)).toBeInTheDocument()
      })

      // 3. Apply color filter
      const colorFilter = screen.getByLabelText('Blue')
      await user.click(colorFilter)

      await waitFor(() => {
        const productCards = screen.getAllByTestId('product-card')
        expect(productCards.length).toBeGreaterThan(0)
      })

      // 4. Change product color via swatch
      const firstColorSwatch = screen.getAllByTestId('color-swatch')[0]
      await user.click(firstColorSwatch)

      await waitFor(() => {
        const productImage = screen.getAllByTestId('product-image')[0]
        expect(productImage).toBeInTheDocument()
      })

      // 5. Add product to cart
      const addToCartButton = screen.getAllByTestId('add-to-cart')[0]
      await user.click(addToCartButton)

      // Verify cart action was called
      expect(screen.getByText(/added to cart/i)).toBeInTheDocument()
    })

    it('should handle complete filter and sort workflow', async () => {
      const user = userEvent.setup()
      render(<ProductCatalogPage {...defaultProps} />)

      // 1. Apply multiple filters
      await user.click(screen.getByLabelText('Medium'))
      await user.click(screen.getByLabelText('Red'))
      await user.click(screen.getByLabelText('Cherokee'))

      // 2. Apply price range filter
      const priceSlider = screen.getByTestId('price-range-slider')
      fireEvent.change(priceSlider, { target: { value: [20, 80] } })

      await waitFor(() => {
        expect(screen.getByText(/\d+ Products/)).toBeInTheDocument()
      })

      // 3. Change sort order
      const sortSelect = screen.getByTestId('sort-select')
      await user.selectOptions(sortSelect, 'price-low-high')

      await waitFor(() => {
        const productCards = screen.getAllByTestId('product-card')
        expect(productCards.length).toBeGreaterThan(0)
      })

      // 4. Clear all filters
      const clearFiltersButton = screen.getByText('Clear All')
      await user.click(clearFiltersButton)

      await waitFor(() => {
        expect(screen.getByText('24 Products')).toBeInTheDocument()
      })
    })
  })

  describe('Mobile Workflow', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      window.dispatchEvent(new Event('resize'))
    })

    it('should handle mobile filter drawer workflow', async () => {
      const user = userEvent.setup()
      render(<ProductCatalogPage {...defaultProps} />)

      // 1. Open mobile filter drawer
      const filterButton = screen.getByTestId('mobile-filter-button')
      await user.click(filterButton)

      await waitFor(() => {
        expect(screen.getByTestId('mobile-filter-drawer')).toBeInTheDocument()
      })

      // 2. Apply filters in mobile drawer
      const sizeFilter = screen.getByLabelText('Large')
      await user.click(sizeFilter)

      // 3. Apply filters
      const applyButton = screen.getByText('Apply Filters')
      await user.click(applyButton)

      await waitFor(() => {
        expect(screen.queryByTestId('mobile-filter-drawer')).not.toBeInTheDocument()
      })

      // 4. Verify filters were applied
      expect(screen.getByText(/\d+ Products/)).toBeInTheDocument()
    })
  })

  describe('Pagination Workflow', () => {
    it('should handle pagination with filters maintained', async () => {
      const user = userEvent.setup()
      render(<ProductCatalogPage {...defaultProps} />)

      // 1. Apply a filter
      await user.click(screen.getByLabelText('Small'))

      await waitFor(() => {
        expect(screen.getByText(/\d+ Products/)).toBeInTheDocument()
      })

      // 2. Navigate to next page
      const nextPageButton = screen.getByTestId('next-page')
      await user.click(nextPageButton)

      await waitFor(() => {
        expect(screen.getByText('Page 2')).toBeInTheDocument()
      })

      // 3. Verify filter is still applied
      expect(screen.getByLabelText('Small')).toBeChecked()

      // 4. Navigate back to first page
      const prevPageButton = screen.getByTestId('prev-page')
      await user.click(prevPageButton)

      await waitFor(() => {
        expect(screen.getByText('Page 1')).toBeInTheDocument()
      })
    })
  })

  describe('Wishlist Workflow', () => {
    it('should handle adding and removing from wishlist', async () => {
      const user = userEvent.setup()
      render(<ProductCatalogPage {...defaultProps} />)

      // 1. Add product to wishlist
      const wishlistButton = screen.getAllByTestId('add-to-wishlist')[0]
      await user.click(wishlistButton)

      await waitFor(() => {
        expect(screen.getByText(/added to wishlist/i)).toBeInTheDocument()
      })

      // 2. Remove from wishlist
      const removeWishlistButton = screen.getAllByTestId('remove-from-wishlist')[0]
      await user.click(removeWishlistButton)

      await waitFor(() => {
        expect(screen.getByText(/removed from wishlist/i)).toBeInTheDocument()
      })
    })
  })

  describe('Search and Filter Combination', () => {
    it('should handle search with filters and sorting', async () => {
      const user = userEvent.setup()
      render(<ProductCatalogPage {...defaultProps} />)

      // 1. Apply search filter (if search is implemented)
      // This would be implemented when search functionality is added

      // 2. Apply category filters
      await user.click(screen.getByLabelText('Medium'))
      await user.click(screen.getByLabelText('Blue'))

      // 3. Sort results
      const sortSelect = screen.getByTestId('sort-select')
      await user.selectOptions(sortSelect, 'name-asc')

      await waitFor(() => {
        const productCards = screen.getAllByTestId('product-card')
        expect(productCards.length).toBeGreaterThan(0)
      })

      // 4. Verify URL parameters are updated
      // This would check URL synchronization
    })
  })
})
