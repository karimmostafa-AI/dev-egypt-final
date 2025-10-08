import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductCard from '../ProductCard';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import type { Product } from '@/types/product-catalog';

// Mock all the hooks
vi.mock('@/hooks/useCart');
vi.mock('@/hooks/useWishlist');
vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useNotifications');

const mockUseCart = useCart as any;
const mockUseWishlist = useWishlist as any;
const mockUseAuth = useAuth as any;
const mockUseNotifications = useNotifications as any;

// Mock setTimeout for testing
vi.useFakeTimers();

describe('ProductCard Integration', () => {
  const mockProduct: Product = {
    id: 'product-1',
    name: 'Test Product',
    price: 29.99,
    salePrice: 24.99,
    images: [
      { url: '/test-image.jpg', alt: 'Test Product', colorName: 'red' },
      { url: '/test-image-blue.jpg', alt: 'Test Product Blue', colorName: 'blue' },
    ],
    colors: [
      { name: 'red', hex: '#ff0000', imageUrl: '/test-image.jpg' },
      { name: 'blue', hex: '#0000ff', imageUrl: '/test-image-blue.jpg' },
    ],
    sizes: ['S', 'M', 'L'],
    brand: 'Test Brand',
    rating: 4.5,
    reviewCount: 123,
    isOnSale: true,
    category: 'test-category',
  };

  const mockAddToCart = vi.fn();
  const mockAddToWishlist = vi.fn();
  const mockRemoveFromWishlist = vi.fn();
  const mockIsInCart = vi.fn();
  const mockIsInWishlist = vi.fn();
  const mockAddNotification = vi.fn();
  const mockOnAddToCart = vi.fn();
  const mockOnAddToWishlist = vi.fn();
  const mockOnColorChange = vi.fn();

  const defaultCartState = {
    cart: {
      items: [],
      totalItems: 0,
      isLoading: false,
      error: null,
    },
    addToCart: mockAddToCart,
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    isInCart: mockIsInCart,
  };

  const defaultWishlistState = {
    wishlist: {
      items: [],
      isLoading: false,
      error: null,
    },
    addToWishlist: mockAddToWishlist,
    removeFromWishlist: mockRemoveFromWishlist,
    clearWishlist: vi.fn(),
    isInWishlist: mockIsInWishlist,
    toggleWishlist: vi.fn(),
  };

  const defaultAuthState = {
    auth: {
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      isAuthenticated: true,
      isLoading: false,
      error: null,
    },
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    clearError: vi.fn(),
  };

  const defaultNotificationState = {
    notifications: [],
    addNotification: mockAddNotification,
    removeNotification: vi.fn(),
    clearNotifications: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCart.mockReturnValue(defaultCartState);
    mockUseWishlist.mockReturnValue(defaultWishlistState);
    mockUseAuth.mockReturnValue(defaultAuthState);
    mockUseNotifications.mockReturnValue(defaultNotificationState);
    mockIsInCart.mockReturnValue(false);
    mockIsInWishlist.mockReturnValue(false);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should add item to cart successfully', async () => {
    mockAddToCart.mockResolvedValue(undefined);

    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
        onColorChange={mockOnColorChange}
      />
    );

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledWith('product-1', {
        color: 'red', // First color should be selected by default
        quantity: 1,
      });
    });

    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'success',
      title: 'Added to Cart',
      message: 'Test Product has been added to your cart.',
      duration: 3000,
    });

    expect(mockOnAddToCart).toHaveBeenCalledWith('product-1');
  });

  it('should show error notification when cart addition fails', async () => {
    const error = new Error('Cart service unavailable');
    mockAddToCart.mockRejectedValue(error);

    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
        onColorChange={mockOnColorChange}
      />
    );

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Failed to Add to Cart',
        message: 'Cart service unavailable',
        duration: 4000,
      });
    });
  });

  it('should add item to wishlist when authenticated', async () => {
    mockAddToWishlist.mockResolvedValue(undefined);

    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
        onColorChange={mockOnColorChange}
      />
    );

    const wishlistButton = screen.getByLabelText('Add to wishlist');
    fireEvent.click(wishlistButton);

    await waitFor(() => {
      expect(mockAddToWishlist).toHaveBeenCalledWith('product-1');
    });

    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'success',
      title: 'Added to Wishlist',
      message: 'Test Product has been added to your wishlist.',
      duration: 3000,
    });

    expect(mockOnAddToWishlist).toHaveBeenCalledWith('product-1');
  });

  it('should remove item from wishlist when already in wishlist', async () => {
    mockIsInWishlist.mockReturnValue(true);
    mockRemoveFromWishlist.mockResolvedValue(undefined);

    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
        onColorChange={mockOnColorChange}
      />
    );

    const wishlistButton = screen.getByLabelText('Remove from wishlist');
    fireEvent.click(wishlistButton);

    await waitFor(() => {
      expect(mockRemoveFromWishlist).toHaveBeenCalledWith('product-1');
    });

    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'info',
      title: 'Removed from Wishlist',
      message: 'Test Product has been removed from your wishlist.',
      duration: 3000,
    });
  });

  it('should show login modal when adding to wishlist without authentication', () => {
    mockUseAuth.mockReturnValue({
      ...defaultAuthState,
      auth: {
        ...defaultAuthState.auth,
        isAuthenticated: false,
        user: null,
      },
    });

    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
        onColorChange={mockOnColorChange}
      />
    );

    const wishlistButton = screen.getByLabelText('Add to wishlist');
    fireEvent.click(wishlistButton);

    expect(screen.getByText('Sign in to save favorites')).toBeInTheDocument();
    expect(mockAddToWishlist).not.toHaveBeenCalled();
  });

  it('should show different button states based on cart/wishlist status', () => {
    mockIsInCart.mockReturnValue(true);
    mockIsInWishlist.mockReturnValue(true);

    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
        onColorChange={mockOnColorChange}
      />
    );

    expect(screen.getByText('In Cart')).toBeInTheDocument();
    expect(screen.getByLabelText('Remove from wishlist')).toBeInTheDocument();
  });

  it('should show loading states', () => {
    mockUseCart.mockReturnValue({
      ...defaultCartState,
      cart: {
        ...defaultCartState.cart,
        isLoading: true,
      },
    });

    mockUseWishlist.mockReturnValue({
      ...defaultWishlistState,
      wishlist: {
        ...defaultWishlistState.wishlist,
        isLoading: true,
      },
    });

    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
        onColorChange={mockOnColorChange}
      />
    );

    const addToCartButton = screen.getByRole('button', { name: /Add to Cart/i });
    const wishlistButton = screen.getByLabelText(/wishlist/i);

    expect(addToCartButton).toBeDisabled();
    expect(wishlistButton).toBeDisabled();
  });

  it('should handle wishlist error gracefully', async () => {
    const error = new Error('Wishlist service error');
    mockAddToWishlist.mockRejectedValue(error);

    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
        onColorChange={mockOnColorChange}
      />
    );

    const wishlistButton = screen.getByLabelText('Add to wishlist');
    fireEvent.click(wishlistButton);

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Wishlist Error',
        message: 'Wishlist service error',
        duration: 4000,
      });
    });
  });

  it('should display correct product information', () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
        onColorChange={mockOnColorChange}
      />
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test Brand')).toBeInTheDocument();
    expect(screen.getByText('$24.99')).toBeInTheDocument(); // Sale price
    expect(screen.getByText('$29.99')).toBeInTheDocument(); // Original price
    expect(screen.getByText('SALE')).toBeInTheDocument();
    expect(screen.getByText('(123)')).toBeInTheDocument(); // Review count
  });

  it('should handle products without sale price', () => {
    const regularProduct = {
      ...mockProduct,
      isOnSale: false,
      salePrice: undefined,
    };

    render(
      <ProductCard
        product={regularProduct}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
        onColorChange={mockOnColorChange}
      />
    );

    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.queryByText('SALE')).not.toBeInTheDocument();
  });

  it('should handle products without colors', () => {
    const productWithoutColors = {
      ...mockProduct,
      colors: [],
    };

    render(
      <ProductCard
        product={productWithoutColors}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
        onColorChange={mockOnColorChange}
      />
    );

    expect(screen.queryByText('Colors:')).not.toBeInTheDocument();
  });
});