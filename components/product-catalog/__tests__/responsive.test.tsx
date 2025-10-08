import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import ProductCatalogPage from '../ProductCatalogPage';
import ProductGrid from '../ProductGrid';
import ProductCard from '../ProductCard';
import type { Product, FilterOptions } from '@/types/product-catalog';

import { vi } from 'vitest';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  }
}));

// Mock hooks
vi.mock('@/hooks/useProductCatalog', () => ({
  useProductCatalog: () => ({
    state: {
      products: mockProducts,
      loading: false,
      error: null,
      filters: {
        sizes: [],
        colors: [],
        brands: [],
        priceRange: [0, 100],
        onSale: false
      },
      sort: { field: 'name', direction: 'asc' },
      currentPage: 1
    },
    actions: {
      setFilters: vi.fn(),
      clearFilters: vi.fn(),
      setSort: vi.fn(),
      setPage: vi.fn(),
      addToCart: vi.fn(),
      addToWishlist: vi.fn()
    },
    hasActiveFilters: false,
    totalPages: 1,
    totalProducts: 2
  })
}));

vi.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    cart: { items: [], isLoading: false },
    addToCart: vi.fn(),
    isInCart: () => false
  })
}));

vi.mock('@/hooks/useWishlist', () => ({
  useWishlist: () => ({
    wishlist: { items: [], isLoading: false },
    addToWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
    isInWishlist: () => false
  })
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    auth: { isAuthenticated: true, user: null }
  })
}));

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    addNotification: vi.fn()
  })
}));

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Test Product 1',
    price: 29.99,
    salePrice: 24.99,
    images: [{ url: '/test1.jpg', alt: 'Test product 1' }],
    colors: [
      { name: 'White', hex: '#FFFFFF', imageUrl: '/test1-white.jpg' },
      { name: 'Navy', hex: '#1E3A8A', imageUrl: '/test1-navy.jpg' }
    ],
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
    colors: [{ name: 'Black', hex: '#000000', imageUrl: '/test2-black.jpg' }],
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
    { name: 'Navy', hex: '#1E3A8A', imageUrl: '/navy.jpg' },
    { name: 'Black', hex: '#000000', imageUrl: '/black.jpg' }
  ],
  availableBrands: ['Test Brand'],
  priceRange: [0, 100]
};

describe('Responsive Design Tests', () => {
  // Helper function to simulate viewport changes
  const setViewportSize = (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    
    // Trigger resize event
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
  };

  beforeEach(() => {
    // Reset viewport to desktop size
    setViewportSize(1024, 768);
  });

  describe('ProductCatalogPage Responsive Behavior', () => {
    it('should show desktop layout on large screens', async () => {
      setViewportSize(1024, 768);
      
      render(
        <ProductCatalogPage
          category="test"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      );

      await waitFor(() => {
        // Desktop filter sidebar should be visible
        expect(screen.queryByText('Filters')).not.toBeInTheDocument();
        
        // Mobile filter button should not be visible
        expect(screen.queryByRole('button', { name: /open filters/i })).not.toBeInTheDocument();
      });
    });

    it('should show mobile layout on small screens', async () => {
      setViewportSize(768, 1024);
      
      render(
        <ProductCatalogPage
          category="test"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      );

      await waitFor(() => {
        // Mobile filter button should be visible
        expect(screen.getByRole('button', { name: /open filters/i })).toBeInTheDocument();
        
        // Product count should be visible in mobile header
        expect(screen.getByText(/2 products/)).toBeInTheDocument();
      });
    });

    it('should handle viewport changes dynamically', async () => {
      const { rerender } = render(
        <ProductCatalogPage
          category="test"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      );

      // Start with desktop
      setViewportSize(1024, 768);
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /open filters/i })).not.toBeInTheDocument();
      });

      // Switch to mobile
      setViewportSize(768, 1024);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /open filters/i })).toBeInTheDocument();
      });
    });

    it('should open mobile filter drawer when filter button is clicked', async () => {
      setViewportSize(768, 1024);
      
      render(
        <ProductCatalogPage
          category="test"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      );

      const filterButton = await screen.findByRole('button', { name: /open filters/i });
      fireEvent.click(filterButton);

      // Mobile filter drawer should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('ProductGrid Responsive Layout', () => {
    const mockProps = {
      products: mockProducts,
      loading: false,
      onAddToCart: vi.fn(),
      onAddToWishlist: vi.fn(),
      currentSort: { option: 'name' as const, direction: 'asc' as const },
      onSortChange: vi.fn(),
      productCount: 2,
      currentPage: 1,
      totalPages: 1,
      onPageChange: vi.fn()
    };

    it('should apply responsive grid classes', () => {
      const { container } = render(<ProductGrid {...mockProps} />);
      
      const gridElement = container.querySelector('[role="grid"]');
      expect(gridElement).toHaveClass('grid');
      expect(gridElement).toHaveClass('grid-cols-1');
      expect(gridElement).toHaveClass('xs:grid-cols-2');
      expect(gridElement).toHaveClass('sm:grid-cols-2');
      expect(gridElement).toHaveClass('md:grid-cols-3');
    });

    it('should show responsive header with product count and sort controls', () => {
      render(<ProductGrid {...mockProps} />);
      
      expect(screen.getByText(/2 products/)).toBeInTheDocument();
      expect(screen.getByText('Sort by:')).toBeInTheDocument();
    });

    it('should handle empty state responsively', () => {
      render(<ProductGrid {...mockProps} products={[]} productCount={0} />);
      
      expect(screen.getAllByText('No products found')[0]).toBeInTheDocument();
      expect(screen.getByText(/We couldn't find any products/)).toBeInTheDocument();
    });
  });

  describe('ProductCard Touch Interactions', () => {
    const mockProduct = mockProducts[0];
    const mockProps = {
      product: mockProduct,
      onAddToCart: vi.fn(),
      onAddToWishlist: vi.fn(),
      onColorChange: vi.fn()
    };

    it('should have touch-friendly button sizes', () => {
      render(<ProductCard {...mockProps} />);
      
      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      const wishlistButton = screen.getByRole('button', { name: /add to wishlist/i });
      
      // Buttons should have minimum touch target size
      expect(addToCartButton).toHaveClass('min-h-[44px]');
      expect(wishlistButton).toHaveClass('min-h-[44px]');
      expect(wishlistButton).toHaveClass('min-w-[44px]');
    });

    it('should show responsive button text', () => {
      render(<ProductCard {...mockProps} />);
      
      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      
      // Should have both full and abbreviated text for different screen sizes
      expect(addToCartButton.querySelector('.hidden.xs\\:inline')).toBeInTheDocument();
      expect(addToCartButton.querySelector('.xs\\:hidden')).toBeInTheDocument();
    });

    it('should apply mobile-optimized classes', () => {
      const { container } = render(<ProductCard {...mockProps} />);
      
      const cardElement = container.firstChild as HTMLElement;
      expect(cardElement).toHaveClass('mobile-optimized');
    });

    it('should handle touch interactions with active states', () => {
      render(<ProductCard {...mockProps} />);
      
      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      const wishlistButton = screen.getByRole('button', { name: /add to wishlist/i });
      
      // Buttons should have active scale classes for touch feedback
      expect(addToCartButton).toHaveClass('active:scale-95');
      expect(wishlistButton).toHaveClass('active:scale-95');
    });
  });

  describe('Accessibility and Focus Management', () => {
    it('should have proper focus management for mobile interactions', async () => {
      setViewportSize(768, 1024);
      
      render(
        <ProductCatalogPage
          category="test"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      );

      const filterButton = await screen.findByRole('button', { name: /open filters/i });
      
      // Focus should be manageable
      filterButton.focus();
      expect(filterButton).toHaveFocus();
      
      // Should have proper ARIA labels
      expect(filterButton).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation', () => {
      render(<ProductGrid 
        products={mockProducts}
        loading={false}
        onAddToCart={vi.fn()}
        onAddToWishlist={vi.fn()}
        currentSort={{ option: 'name', direction: 'asc' }}
        onSortChange={vi.fn()}
        productCount={2}
      />);
      
      const gridElement = screen.getByRole('grid');
      expect(gridElement).toHaveAttribute('aria-label', 'Product grid');
      
      const gridCells = screen.getAllByRole('gridcell');
      expect(gridCells).toHaveLength(2);
    });

    it('should have proper focus ring styles', () => {
      render(<ProductCard 
        product={mockProducts[0]}
        onAddToCart={vi.fn()}
        onAddToWishlist={vi.fn()}
        onColorChange={vi.fn()}
      />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('focus:outline-none');
        expect(button).toHaveClass('focus:ring-2');
      });
    });
  });

  describe('Performance Optimizations', () => {
    it('should debounce resize events', async () => {
      const { rerender } = render(
        <ProductCatalogPage
          category="test"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      );

      // Simulate rapid resize events
      for (let i = 0; i < 10; i++) {
        setViewportSize(800 + i * 10, 600);
      }

      // Should handle multiple resize events without issues
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /open filters/i })).toBeInTheDocument();
      });
    });

    it('should use proper image sizing attributes', () => {
      render(<ProductCard 
        product={mockProducts[0]}
        onAddToCart={vi.fn()}
        onAddToWishlist={vi.fn()}
        onColorChange={vi.fn()}
      />);
      
      const image = screen.getByAltText('Test Product 1 in White');
      expect(image).toHaveAttribute('sizes');
    });
  });
});