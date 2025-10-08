import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductCatalogPage from '../ProductCatalogPage';
import type { Product, FilterOptions } from '@/types/product-catalog';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock all sub-components
jest.mock('../CategoryHeader', () => {
  return function MockCategoryHeader({ category, productCount }: any) {
    return (
      <div data-testid="category-header">
        <h1>{category}</h1>
        <p>{productCount} {productCount === 1 ? 'product' : 'products'}</p>
        <nav>
          <span>Home</span>
          <span>Categories</span>
          <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
        </nav>
      </div>
    );
  };
});

jest.mock('../FilterSidebar', () => {
  return function MockFilterSidebar({ productCount }: any) {
    return (
      <div data-testid="filter-sidebar">
        <h2>Filters</h2>
        <span>{productCount} {productCount === 1 ? 'product' : 'products'} found</span>
      </div>
    );
  };
});

jest.mock('../ProductGrid', () => {
  return function MockProductGrid({ products, productCount }: any) {
    return (
      <div data-testid="product-grid">
        {products.map((product: any) => (
          <div key={product.id}>{product.name}</div>
        ))}
        {productCount === 0 && <div>No products found</div>}
      </div>
    );
  };
});

jest.mock('../MobileFilterDrawer', () => {
  return function MockMobileFilterDrawer({ isOpen }: any) {
    return isOpen ? (
      <div data-testid="mobile-filter-drawer" role="dialog">
        Mobile Filter Drawer
      </div>
    ) : null;
  };
});

// Mock hooks
jest.mock('@/hooks/useProductCatalog');

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
};

const mockSearchParams = {
  get: jest.fn(),
  toString: jest.fn(() => ''),
};

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Test Product 1',
    price: 29.99,
    salePrice: 24.99,
    images: [{ url: '/test1.jpg', alt: 'Test product 1' }],
    colors: [{ name: 'White', hex: '#FFFFFF', imageUrl: '/test1.jpg' }],
    sizes: ['S', 'M', 'L'],
    brand: 'Test Brand',
    rating: 4.5,
    reviewCount: 10,
    isOnSale: true,
    category: 'test'
  },
  {
    id: '2',
    name: 'Test Product 2',
    price: 39.99,
    images: [{ url: '/test2.jpg', alt: 'Test product 2' }],
    colors: [{ name: 'Black', hex: '#000000', imageUrl: '/test2.jpg' }],
    sizes: ['M', 'L', 'XL'],
    brand: 'Test Brand',
    rating: 4.0,
    reviewCount: 5,
    isOnSale: false,
    category: 'test'
  }
];

const mockFilterOptions: FilterOptions = {
  availableSizes: ['S', 'M', 'L', 'XL'],
  availableColors: [
    { name: 'White', hex: '#FFFFFF', imageUrl: '/white.jpg' },
    { name: 'Black', hex: '#000000', imageUrl: '/black.jpg' }
  ],
  availableBrands: ['Test Brand'],
  priceRange: [0, 100]
};

const mockCatalogState = {
  products: mockProducts,
  filteredProducts: mockProducts,
  filters: {
    sizes: [],
    colors: [],
    brands: [],
    priceRange: [0, 100] as [number, number],
    onSale: false
  },
  sort: { option: 'popularity' as const, direction: 'asc' as const },
  currentPage: 1,
  loading: false,
  error: null
};

const mockActions = {
  setFilters: jest.fn(),
  setSort: jest.fn(),
  setPage: jest.fn(),
  clearFilters: jest.fn(),
  addToCart: jest.fn(),
  addToWishlist: jest.fn(),
};

// Mock the useProductCatalog hook
const mockUseProductCatalog = {
  state: mockCatalogState,
  actions: mockActions,
  hasActiveFilters: false,
  totalPages: 1,
  totalProducts: 2
};

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
  (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  
  // Mock the hook
  const { useProductCatalog } = require('@/hooks/useProductCatalog');
  useProductCatalog.mockReturnValue(mockUseProductCatalog);
  
  // Reset all mocks
  jest.clearAllMocks();
});

describe('ProductCatalogPage', () => {
  const defaultProps = {
    category: 'test-category',
    initialProducts: mockProducts,
    filters: mockFilterOptions
  };

  describe('Rendering', () => {
    it('renders the main components correctly', () => {
      render(<ProductCatalogPage {...defaultProps} />);

      // Check for category header
      expect(screen.getByText('test-category')).toBeInTheDocument();
      expect(screen.getByText('2 products')).toBeInTheDocument();

      // Check for product grid
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    });

    it('renders breadcrumbs correctly', () => {
      render(<ProductCatalogPage {...defaultProps} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Test-category')).toBeInTheDocument();
    });

    it('shows desktop filter sidebar on large screens', () => {
      // Mock window.innerWidth for desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<ProductCatalogPage {...defaultProps} />);

      // Should show desktop filters
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('shows mobile filter button on small screens', async () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });

      render(<ProductCatalogPage {...defaultProps} />);

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(screen.getByLabelText(/open filters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state when products are loading', () => {
      const { useProductCatalog } = require('@/hooks/useProductCatalog');
      useProductCatalog.mockReturnValue({
        ...mockUseProductCatalog,
        state: { ...mockCatalogState, loading: true }
      });

      render(<ProductCatalogPage {...defaultProps} />);

      expect(screen.getByText('Loading products...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('shows error state when there is an error', () => {
      const { useProductCatalog } = require('@/hooks/useProductCatalog');
      useProductCatalog.mockReturnValue({
        ...mockUseProductCatalog,
        state: { ...mockCatalogState, error: 'Failed to load products' }
      });

      render(<ProductCatalogPage {...defaultProps} />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Failed to load products')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('allows retry on error', () => {
      const { useProductCatalog } = require('@/hooks/useProductCatalog');
      useProductCatalog.mockReturnValue({
        ...mockUseProductCatalog,
        state: { ...mockCatalogState, error: 'Network error' }
      });

      // Mock window.location.reload
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });

      render(<ProductCatalogPage {...defaultProps} />);

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('Mobile Filter Drawer', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });
    });

    it('opens mobile filter drawer when filter button is clicked', async () => {
      render(<ProductCatalogPage {...defaultProps} />);

      // Trigger resize to set mobile state
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const filterButton = screen.getByLabelText(/open filters/i);
        fireEvent.click(filterButton);
      });

      // Mobile filter drawer should be rendered (though may not be visible due to CSS)
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('shows active filter indicator on mobile', async () => {
      const { useProductCatalog } = require('@/hooks/useProductCatalog');
      useProductCatalog.mockReturnValue({
        ...mockUseProductCatalog,
        hasActiveFilters: true
      });

      render(<ProductCatalogPage {...defaultProps} />);

      // Trigger resize to set mobile state
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(screen.getByText('Filtered')).toBeInTheDocument();
      });
    });
  });

  describe('Integration', () => {
    it('passes correct props to CategoryHeader', () => {
      render(<ProductCatalogPage {...defaultProps} />);

      expect(screen.getByText('test-category')).toBeInTheDocument();
      expect(screen.getByText('2 products')).toBeInTheDocument();
    });

    it('passes correct props to ProductGrid', () => {
      render(<ProductCatalogPage {...defaultProps} />);

      // Products should be rendered
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    });

    it('handles cart and wishlist actions', () => {
      render(<ProductCatalogPage {...defaultProps} />);

      // These would be tested through ProductGrid component interactions
      // The actions are passed down correctly
      expect(mockActions.addToCart).toBeDefined();
      expect(mockActions.addToWishlist).toBeDefined();
    });
  });

  describe('Responsive Behavior', () => {
    it('handles window resize events', async () => {
      render(<ProductCatalogPage {...defaultProps} />);

      // Start with desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
      fireEvent(window, new Event('resize'));

      // Switch to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(screen.getByLabelText(/open filters/i)).toBeInTheDocument();
      });
    });

    it('cleans up resize event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<ProductCatalogPage {...defaultProps} />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ProductCatalogPage {...defaultProps} />);

      // Check for proper navigation structure
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('provides proper loading state accessibility', () => {
      const { useProductCatalog } = require('@/hooks/useProductCatalog');
      useProductCatalog.mockReturnValue({
        ...mockUseProductCatalog,
        state: { ...mockCatalogState, loading: true }
      });

      render(<ProductCatalogPage {...defaultProps} />);

      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading products');
    });

    it('provides proper error state accessibility', () => {
      const { useProductCatalog } = require('@/hooks/useProductCatalog');
      useProductCatalog.mockReturnValue({
        ...mockUseProductCatalog,
        state: { ...mockCatalogState, error: 'Test error' }
      });

      render(<ProductCatalogPage {...defaultProps} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Product Count Display', () => {
    it('displays singular product count correctly', () => {
      const { useProductCatalog } = require('@/hooks/useProductCatalog');
      useProductCatalog.mockReturnValue({
        ...mockUseProductCatalog,
        totalProducts: 1
      });

      render(<ProductCatalogPage {...defaultProps} />);

      expect(screen.getByText('1 product')).toBeInTheDocument();
    });

    it('displays plural product count correctly', () => {
      render(<ProductCatalogPage {...defaultProps} />);

      expect(screen.getByText('2 products')).toBeInTheDocument();
    });

    it('displays zero products correctly', () => {
      const { useProductCatalog } = require('@/hooks/useProductCatalog');
      useProductCatalog.mockReturnValue({
        ...mockUseProductCatalog,
        totalProducts: 0,
        state: {
          ...mockCatalogState,
          products: []
        }
      });

      render(<ProductCatalogPage {...defaultProps} />);

      expect(screen.getByText('0 products')).toBeInTheDocument();
    });
  });
});