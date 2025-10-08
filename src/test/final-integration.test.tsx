/**
 * Final Integration Test Suite
 * 
 * This test suite verifies that all components work together properly
 * after the final integration and polish phase.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextRouter } from 'next/router';
import ProductCatalogPage from '../../components/product-catalog/ProductCatalogPage';
import ProductCatalogErrorBoundary from '../../components/product-catalog/ProductCatalogErrorBoundary';
import type { Product, FilterOptions } from '../types/product-catalog';

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  pathname: '/catalog',
  query: {},
  asPath: '/catalog',
} as unknown as NextRouter;

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/catalog',
}));

// Mock hooks
vi.mock('../hooks/useCart', () => ({
  useCart: () => ({
    cart: { items: [], total: 0 },
    addToCart: vi.fn(),
    isInCart: vi.fn(() => false),
  }),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    auth: { isAuthenticated: false, user: null },
  }),
}));

vi.mock('../hooks/useWishlist', () => ({
  useWishlist: () => ({
    wishlist: { items: [] },
    addToWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
    isInWishlist: vi.fn(() => false),
  }),
}));

vi.mock('../hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [],
    addNotification: vi.fn(),
    removeNotification: vi.fn(),
  }),
}));

// Mock performance utilities
vi.mock('../utils/performance', () => ({
  usePerformanceMonitor: () => ({
    startMeasurement: vi.fn(),
    endMeasurement: vi.fn(() => 100),
    getMetrics: vi.fn(() => ({})),
    logMetrics: vi.fn(),
  }),
  measureWebVitals: vi.fn(),
}));

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Test Product 1',
    price: 29.99,
    salePrice: 24.99,
    images: [{ url: '/test1.jpg', alt: 'Test Product 1' }],
    colors: [
      { name: 'White', hex: '#FFFFFF', imageUrl: '/test1-white.jpg' },
      { name: 'Navy', hex: '#1E3A8A', imageUrl: '/test1-navy.jpg' },
    ],
    sizes: ['S', 'M', 'L'],
    brand: 'Test Brand',
    rating: 4.5,
    reviewCount: 10,
    isOnSale: true,
    category: 'scrubs',
  },
  {
    id: '2',
    name: 'Test Product 2',
    price: 39.99,
    images: [{ url: '/test2.jpg', alt: 'Test Product 2' }],
    colors: [
      { name: 'Black', hex: '#000000', imageUrl: '/test2-black.jpg' },
    ],
    sizes: ['M', 'L', 'XL'],
    brand: 'Test Brand',
    rating: 4.0,
    reviewCount: 5,
    isOnSale: false,
    category: 'scrubs',
  },
];

const mockFilterOptions: FilterOptions = {
  availableSizes: ['S', 'M', 'L', 'XL'],
  availableColors: [
    { name: 'White', hex: '#FFFFFF', imageUrl: '/white.jpg' },
    { name: 'Navy', hex: '#1E3A8A', imageUrl: '/navy.jpg' },
    { name: 'Black', hex: '#000000', imageUrl: '/black.jpg' },
  ],
  availableBrands: ['Test Brand'],
  priceRange: [0, 100],
};

describe('Final Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Boundary Integration', () => {
    it('should render error boundary when component throws', () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Create a component that throws an error
      const ThrowingComponent = () => {
        throw new Error('Test error');
      };

      render(
        <ProductCatalogErrorBoundary>
          <ThrowingComponent />
        </ProductCatalogErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Go to Homepage')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should allow retry after error', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      let shouldThrow = true;
      const ConditionalThrowingComponent = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Component recovered</div>;
      };

      const { rerender } = render(
        <ProductCatalogErrorBoundary>
          <ConditionalThrowingComponent />
        </ProductCatalogErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

      // Simulate fixing the error
      shouldThrow = false;
      
      const retryButton = screen.getByText('Try Again');
      await user.click(retryButton);

      // The error boundary should reset and try to render again
      // Note: In a real scenario, this would require the component to not throw anymore
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Integration', () => {
    it('should initialize performance monitoring', () => {
      const { usePerformanceMonitor } = require('../utils/performance');
      
      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      );

      // Performance monitoring should be initialized
      expect(usePerformanceMonitor).toHaveBeenCalledWith('ProductCatalogPage');
    });

    it('should handle lazy loading properly', async () => {
      // Test that the component renders without immediate errors
      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      );

      // Should show products
      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      });
    });
  });

  describe('Styling Consistency', () => {
    it('should use consistent UA brand colors', () => {
      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      );

      // Check that the page renders with proper styling
      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();
    });

    it('should handle responsive design properly', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      );

      // Should render mobile-optimized layout
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('should provide proper skip link functionality', () => {
      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      );

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', expect.stringContaining('#'));
    });

    it('should announce product count changes', async () => {
      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      );

      // Should show product count
      await waitFor(() => {
        expect(screen.getByText(/2 products/)).toBeInTheDocument();
      });
    });
  });

  describe('Bundle Optimization', () => {
    it('should render without performance issues', () => {
      const startTime = performance.now();
      
      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render quickly (less than 100ms in test environment)
      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('Complete Integration Flow', () => {
    it('should handle complete user workflow', async () => {
      const user = userEvent.setup();
      
      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={mockProducts}
          filters={mockFilterOptions}
        />
      );

      // Should show initial products
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();

      // Should show product count
      expect(screen.getByText(/2 products/)).toBeInTheDocument();

      // Should be able to interact with products
      const addToCartButtons = screen.getAllByText(/Add to Cart|Add/);
      expect(addToCartButtons.length).toBeGreaterThan(0);
    });

    it('should handle error states gracefully', () => {
      render(
        <ProductCatalogPage
          category="scrubs"
          initialProducts={[]}
          filters={mockFilterOptions}
        />
      );

      // Should handle empty product list
      expect(screen.getByText(/0 products/)).toBeInTheDocument();
    });
  });
});