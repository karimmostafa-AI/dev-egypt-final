import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProductGrid from '../ProductGrid';
import type { Product, SortState } from '@/types/product-catalog';

// Mock the ProductCard component
vi.mock('../ProductCard', () => ({
  default: ({ product, onAddToCart, onAddToWishlist }: any) => (
    <div data-testid={`product-card-${product.id}`}>
      <h3>{product.name}</h3>
      <span>${product.price}</span>
      <button onClick={() => onAddToCart(product.id)}>Add to Cart</button>
      <button onClick={() => onAddToWishlist(product.id)}>Add to Wishlist</button>
    </div>
  ),
}));

// Mock the ProductGridSkeleton component
vi.mock('../ProductGridSkeleton', () => ({
  default: () => <div data-testid="product-grid-skeleton">Loading...</div>,
}));

// Mock the SortControls component
vi.mock('../SortControls', () => ({
  default: ({ currentSort, onSortChange }: any) => (
    <div data-testid="sort-controls">
      <span>Current sort: {currentSort.option}</span>
      <button onClick={() => onSortChange({ option: 'price-low', direction: 'asc' })}>
        Change Sort
      </button>
    </div>
  ),
}));

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Test Product 1',
    price: 29.99,
    salePrice: 24.99,
    images: [{ url: '/test1.jpg', alt: 'Test Product 1' }],
    colors: [{ name: 'Blue', hex: '#0000FF', imageUrl: '/test1-blue.jpg' }],
    sizes: ['S', 'M', 'L'],
    brand: 'Test Brand',
    rating: 4.5,
    reviewCount: 10,
    isOnSale: true,
    category: 'test-category',
  },
  {
    id: '2',
    name: 'Test Product 2',
    price: 39.99,
    images: [{ url: '/test2.jpg', alt: 'Test Product 2' }],
    colors: [{ name: 'Red', hex: '#FF0000', imageUrl: '/test2-red.jpg' }],
    sizes: ['M', 'L', 'XL'],
    brand: 'Test Brand 2',
    rating: 4.0,
    reviewCount: 5,
    isOnSale: false,
    category: 'test-category',
  },
];

describe('ProductGrid', () => {
  const mockOnAddToCart = vi.fn();
  const mockOnAddToWishlist = vi.fn();
  const mockOnSortChange = vi.fn();

  const defaultSort: SortState = {
    option: 'popularity',
    direction: 'desc'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders products in a grid layout', () => {
    render(
      <ProductGrid
        products={mockProducts}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
      />
    );

    expect(screen.getByRole('grid', { name: 'Product grid' })).toBeInTheDocument();
    expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-2')).toBeInTheDocument();
  });

  it('displays loading skeleton when loading is true', () => {
    render(
      <ProductGrid
        products={[]}
        loading={true}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
      />
    );

    expect(screen.getByTestId('product-grid-skeleton')).toBeInTheDocument();
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  it('displays no products message when products array is empty', () => {
    render(
      <ProductGrid
        products={[]}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
      />
    );

    expect(screen.getByText('No products found')).toBeInTheDocument();
    expect(screen.getByText(/We couldn't find any products matching your criteria/)).toBeInTheDocument();
  });

  it('calls onAddToCart when add to cart button is clicked', () => {
    render(
      <ProductGrid
        products={mockProducts}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
      />
    );

    const addToCartButtons = screen.getAllByText('Add to Cart');
    fireEvent.click(addToCartButtons[0]);

    expect(mockOnAddToCart).toHaveBeenCalledWith('1');
  });

  it('calls onAddToWishlist when add to wishlist button is clicked', () => {
    render(
      <ProductGrid
        products={mockProducts}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
      />
    );

    const addToWishlistButtons = screen.getAllByText('Add to Wishlist');
    fireEvent.click(addToWishlistButtons[0]);

    expect(mockOnAddToWishlist).toHaveBeenCalledWith('1');
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <ProductGrid
        products={mockProducts}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
        className="custom-grid-class"
      />
    );

    const gridElement = container.querySelector('.custom-grid-class');
    expect(gridElement).toBeInTheDocument();
  });

  it('renders correct number of grid cells', () => {
    render(
      <ProductGrid
        products={mockProducts}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
      />
    );

    const gridCells = screen.getAllByRole('gridcell');
    expect(gridCells).toHaveLength(mockProducts.length);
  });

  it('has proper responsive grid classes', () => {
    const { container } = render(
      <ProductGrid
        products={mockProducts}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
      />
    );

    const gridElement = screen.getByRole('grid');
    expect(gridElement).toHaveClass('grid-cols-1'); // Mobile
    expect(gridElement).toHaveClass('sm:grid-cols-2'); // Small screens
    expect(gridElement).toHaveClass('lg:grid-cols-3'); // Large screens
    expect(gridElement).toHaveClass('xl:grid-cols-4'); // Extra large
    expect(gridElement).toHaveClass('2xl:grid-cols-5'); // 2XL
  });

  it('has proper spacing and padding classes', () => {
    render(
      <ProductGrid
        products={mockProducts}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
      />
    );

    const gridElement = screen.getByRole('grid');
    expect(gridElement).toHaveClass('gap-6'); // Grid gap
    expect(gridElement).toHaveClass('p-4'); // Mobile padding
    expect(gridElement).toHaveClass('sm:p-6'); // Desktop padding
  });

  it('handles single product correctly', () => {
    const singleProduct = [mockProducts[0]];
    
    render(
      <ProductGrid
        products={singleProduct}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
      />
    );

    expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
    expect(screen.queryByTestId('product-card-2')).not.toBeInTheDocument();
  });

  it('handles large number of products', () => {
    const manyProducts = Array.from({ length: 20 }, (_, i) => ({
      ...mockProducts[0],
      id: `product-${i}`,
      name: `Product ${i}`,
    }));

    render(
      <ProductGrid
        products={manyProducts}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
      />
    );

    const gridCells = screen.getAllByRole('gridcell');
    expect(gridCells).toHaveLength(20);
  });

  describe('Sorting functionality', () => {
    it('renders sort controls when currentSort and onSortChange are provided', () => {
      render(
        <ProductGrid
          products={mockProducts}
          onAddToCart={mockOnAddToCart}
          onAddToWishlist={mockOnAddToWishlist}
          currentSort={defaultSort}
          onSortChange={mockOnSortChange}
          productCount={mockProducts.length}
        />
      );

      expect(screen.getByTestId('sort-controls')).toBeInTheDocument();
      expect(screen.getByText('Current sort: popularity')).toBeInTheDocument();
    });

    it('does not render sort controls when currentSort or onSortChange are not provided', () => {
      render(
        <ProductGrid
          products={mockProducts}
          onAddToCart={mockOnAddToCart}
          onAddToWishlist={mockOnAddToWishlist}
        />
      );

      expect(screen.queryByTestId('sort-controls')).not.toBeInTheDocument();
    });

    it('displays product count when provided', () => {
      render(
        <ProductGrid
          products={mockProducts}
          onAddToCart={mockOnAddToCart}
          onAddToWishlist={mockOnAddToWishlist}
          currentSort={defaultSort}
          onSortChange={mockOnSortChange}
          productCount={42}
        />
      );

      // Use getAllByText to handle multiple matching elements and pick the first one
      const productCountElements = screen.getAllByText((content, element) => {
        const text = element?.textContent || '';
        return text.includes('products') && 
               (text.includes('42') || text.includes('٤٢'));
      });
      
      expect(productCountElements.length).toBeGreaterThan(0);
    });

    it('displays singular product count correctly', () => {
      render(
        <ProductGrid
          products={mockProducts}
          onAddToCart={mockOnAddToCart}
          onAddToWishlist={mockOnAddToWishlist}
          currentSort={defaultSort}
          onSortChange={mockOnSortChange}
          productCount={1}
        />
      );

      expect(screen.getByText('1 product')).toBeInTheDocument();
    });

    it('displays zero product count correctly', () => {
      render(
        <ProductGrid
          products={[]}
          onAddToCart={mockOnAddToCart}
          onAddToWishlist={mockOnAddToWishlist}
          currentSort={defaultSort}
          onSortChange={mockOnSortChange}
          productCount={0}
        />
      );

      expect(screen.getByText('No products')).toBeInTheDocument();
    });

    it('calls onSortChange when sort is changed', () => {
      render(
        <ProductGrid
          products={mockProducts}
          onAddToCart={mockOnAddToCart}
          onAddToWishlist={mockOnAddToWishlist}
          currentSort={defaultSort}
          onSortChange={mockOnSortChange}
          productCount={mockProducts.length}
        />
      );

      const changeSortButton = screen.getByText('Change Sort');
      fireEvent.click(changeSortButton);

      expect(mockOnSortChange).toHaveBeenCalledWith({
        option: 'price-low',
        direction: 'asc'
      });
    });

    it('renders header with sort controls even when no products', () => {
      render(
        <ProductGrid
          products={[]}
          onAddToCart={mockOnAddToCart}
          onAddToWishlist={mockOnAddToWishlist}
          currentSort={defaultSort}
          onSortChange={mockOnSortChange}
          productCount={0}
        />
      );

      expect(screen.getByTestId('sort-controls')).toBeInTheDocument();
      expect(screen.getByText('No products found')).toBeInTheDocument();
    });

    it('formats large product counts with commas', () => {
      render(
        <ProductGrid
          products={mockProducts}
          onAddToCart={mockOnAddToCart}
          onAddToWishlist={mockOnAddToWishlist}
          currentSort={defaultSort}
          onSortChange={mockOnSortChange}
          productCount={1234}
        />
      );

      // Use getAllByText to handle multiple matching elements and pick the first one
      const productCountElements = screen.getAllByText((content, element) => {
        const text = element?.textContent || '';
        return text.includes('products') && 
               (text.includes('1,234') || text.includes('1٬234') || text.includes('١٬٢٣٤'));
      });
      
      expect(productCountElements.length).toBeGreaterThan(0);
    });

    it('hides sort label on mobile screens', () => {
      render(
        <ProductGrid
          products={mockProducts}
          onAddToCart={mockOnAddToCart}
          onAddToWishlist={mockOnAddToWishlist}
          currentSort={defaultSort}
          onSortChange={mockOnSortChange}
          productCount={mockProducts.length}
        />
      );

      const sortLabel = screen.getByText('Sort by:');
      expect(sortLabel).toHaveClass('hidden', 'sm:inline');
    });
  });
});