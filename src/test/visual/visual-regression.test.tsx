import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import ProductCatalogPage from '../../../components/product-catalog/ProductCatalogPage'
import ProductCard from '../../../components/product-catalog/ProductCard'
import FilterSidebar from '../../../components/product-catalog/FilterSidebar'
import MobileFilterDrawer from '../../../components/product-catalog/MobileFilterDrawer'
import { mockProducts, mockFilterOptions, mockProduct } from '../mocks/productData'

// Mock hooks for consistent visual testing
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

describe('Visual Regression Tests', () => {
  describe('ProductCatalogPage Layouts', () => {
    it('should render desktop layout consistently', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      })

      const { container } = render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      )

      // Verify main layout structure
      expect(container.querySelector('[data-testid="category-header"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="filter-sidebar"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="product-grid"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="pagination"]')).toBeInTheDocument()

      // Verify grid layout classes
      const productGrid = container.querySelector('[data-testid="product-grid"]')
      expect(productGrid).toHaveClass('grid')
      expect(productGrid).toHaveClass('lg:grid-cols-4')
    })

    it('should render tablet layout consistently', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      const { container } = render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      )

      const productGrid = container.querySelector('[data-testid="product-grid"]')
      expect(productGrid).toHaveClass('md:grid-cols-3')
    })

    it('should render mobile layout consistently', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      const { container } = render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      )

      // Mobile should show filter button instead of sidebar
      expect(container.querySelector('[data-testid="mobile-filter-button"]')).toBeInTheDocument()
      
      const productGrid = container.querySelector('[data-testid="product-grid"]')
      expect(productGrid).toHaveClass('grid-cols-2')
    })
  })

  describe('ProductCard Visual States', () => {
    it('should render regular product card consistently', () => {
      const { container } = render(
        <ProductCard product={mockProduct} onAddToCart={vi.fn()} onAddToWishlist={vi.fn()} onColorChange={vi.fn()} />
      )

      // Verify card structure
      expect(container.querySelector('[data-testid="product-image"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="product-name"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="product-price"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="color-swatches"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="product-actions"]')).toBeInTheDocument()

      // Verify styling classes
      const card = container.querySelector('[data-testid="product-card"]')
      expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm')
    })

    it('should render sale product card consistently', () => {
      const saleProduct = {
        ...mockProduct,
        isOnSale: true,
        salePrice: 19.99,
      }

      const { container } = render(
        <ProductCard product={saleProduct} onAddToCart={vi.fn()} onAddToWishlist={vi.fn()} onColorChange={vi.fn()} />
      )

      // Verify sale badge
      expect(container.querySelector('[data-testid="sale-badge"]')).toBeInTheDocument()
      
      // Verify price display
      expect(container.querySelector('[data-testid="original-price"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="sale-price"]')).toBeInTheDocument()
    })

    it('should render out of stock product card consistently', () => {
      const outOfStockProduct = {
        ...mockProduct,
        isOutOfStock: true,
      }

      const { container } = render(
        <ProductCard product={outOfStockProduct} onAddToCart={vi.fn()} onAddToWishlist={vi.fn()} onColorChange={vi.fn()} />
      )

      // Verify out of stock styling
      const card = container.querySelector('[data-testid="product-card"]')
      expect(card).toHaveClass('opacity-60')
      
      expect(container.querySelector('[data-testid="out-of-stock-badge"]')).toBeInTheDocument()
    })
  })

  describe('Filter Sidebar Visual States', () => {
    it('should render expanded filter sections consistently', () => {
      const { container } = render(
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
          productCount={mockProducts.length}
        />
      )

      // Verify filter sections
      expect(container.querySelector('[data-testid="size-filter"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="color-filter"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="brand-filter"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="price-filter"]')).toBeInTheDocument()

      // Verify styling
      const sidebar = container.querySelector('[data-testid="filter-sidebar"]')
      expect(sidebar).toHaveClass('w-80', 'bg-white', 'border-r')
    })

    it('should render collapsed filter sections consistently', () => {
      const { container } = render(
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
          productCount={mockProducts.length}
        />
      )

      // Verify collapsed state styling
      const filterSections = container.querySelectorAll('[data-testid*="filter-section"]')
      filterSections.forEach(section => {
        expect(section).toHaveClass('collapsed')
      })
    })
  })

  describe('Mobile Filter Drawer Visual States', () => {
    it('should render opened drawer consistently', () => {
      const { container } = render(
        <MobileFilterDrawer
          isOpen={true}
          filters={mockFilterOptions}
          currentFilters={{
            sizes: [],
            colors: [],
            brands: [],
            priceRange: [0, 100],
            onSale: false,
          }}
          onFilterChange={vi.fn()}
          onClose={vi.fn()}
          onClearFilters={vi.fn()}
          productCount={mockProducts.length}
        />
      )

      // Verify drawer structure
      expect(container.querySelector('[data-testid="mobile-filter-drawer"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="drawer-backdrop"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="drawer-content"]')).toBeInTheDocument()

      // Verify styling
      const drawer = container.querySelector('[data-testid="mobile-filter-drawer"]')
      expect(drawer).toHaveClass('fixed', 'inset-0', 'z-50')
    })

    it('should render closed drawer consistently', () => {
      const { container } = render(
        <MobileFilterDrawer
          isOpen={false}
          filters={mockFilterOptions}
          currentFilters={{
            sizes: [],
            colors: [],
            brands: [],
            priceRange: [0, 100],
            onSale: false,
          }}
          onFilterChange={vi.fn()}
          onClose={vi.fn()}
          onClearFilters={vi.fn()}
          productCount={mockProducts.length}
        />
      )

      // Drawer should not be visible when closed
      expect(container.querySelector('[data-testid="mobile-filter-drawer"]')).not.toBeInTheDocument()
    })
  })

  describe('Loading States Visual Consistency', () => {
    it('should render product grid skeleton consistently', () => {
      const { container } = render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={[]}
          filters={mockFilterOptions}
        />
      )

      // Verify skeleton elements
      const skeletons = container.querySelectorAll('[data-testid="product-skeleton"]')
      expect(skeletons.length).toBeGreaterThan(0)

      // Verify skeleton styling
      skeletons.forEach(skeleton => {
        expect(skeleton).toHaveClass('animate-pulse')
      })
    })

    it('should render empty state consistently', () => {
      const { container } = render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={[]}
          filters={mockFilterOptions}
        />
      )

      // Verify empty state
      expect(container.querySelector('[data-testid="empty-state"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="empty-state-message"]')).toBeInTheDocument()
    })
  })

  describe('Color Swatch Visual Consistency', () => {
    it('should render color swatches with correct styling', () => {
      const { container } = render(
        <ProductCard product={mockProduct} onAddToCart={vi.fn()} onAddToWishlist={vi.fn()} onColorChange={vi.fn()} />
      )

      const colorSwatches = container.querySelectorAll('[data-testid="color-swatch"]')
      expect(colorSwatches.length).toBeGreaterThan(0)

      // Verify swatch styling
      colorSwatches.forEach(swatch => {
        expect(swatch).toHaveClass('w-5', 'h-5', 'rounded-full', 'border-2')
      })
    })

    it('should render selected color swatch consistently', () => {
      const { container } = render(
        <ProductCard product={mockProduct} onAddToCart={vi.fn()} onAddToWishlist={vi.fn()} onColorChange={vi.fn()} />
      )

      const selectedSwatch = container.querySelector('[data-testid="color-swatch"][aria-selected="true"]')
      expect(selectedSwatch).toHaveClass('ring-2', 'ring-blue-500')
    })
  })
})
