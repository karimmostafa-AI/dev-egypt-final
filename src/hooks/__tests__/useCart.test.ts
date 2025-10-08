import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCart } from '../useCart';

describe('useCart', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with empty cart', () => {
    const { result } = renderHook(() => useCart());

    expect(result.current.cart.items).toEqual([]);
    expect(result.current.cart.totalItems).toBe(0);
    expect(result.current.cart.isLoading).toBe(false);
    expect(result.current.cart.error).toBeNull();
  });

  it('should add item to cart', async () => {
    const { result } = renderHook(() => useCart());

    await act(async () => {
      const promise = result.current.addToCart('product-1', { color: 'red', quantity: 2 });
      vi.advanceTimersByTime(500);
      await promise;
    });

    expect(result.current.cart.items).toHaveLength(1);
    expect(result.current.cart.items[0]).toMatchObject({
      productId: 'product-1',
      quantity: 2,
      selectedColor: 'red',
    });
    expect(result.current.cart.totalItems).toBe(2);
  });

  it('should update quantity when adding existing item', async () => {
    const { result } = renderHook(() => useCart());

    // Add item first time
    await act(async () => {
      const promise = result.current.addToCart('product-1', { color: 'red', quantity: 1 });
      vi.advanceTimersByTime(500);
      await promise;
    });

    // Add same item again
    await act(async () => {
      const promise = result.current.addToCart('product-1', { color: 'red', quantity: 2 });
      vi.advanceTimersByTime(500);
      await promise;
    });

    expect(result.current.cart.items).toHaveLength(1);
    expect(result.current.cart.items[0].quantity).toBe(3);
    expect(result.current.cart.totalItems).toBe(3);
  });

  it('should treat different colors as separate items', async () => {
    const { result } = renderHook(() => useCart());

    await act(async () => {
      const promise1 = result.current.addToCart('product-1', { color: 'red' });
      vi.advanceTimersByTime(500);
      await promise1;
    });

    await act(async () => {
      const promise2 = result.current.addToCart('product-1', { color: 'blue' });
      vi.advanceTimersByTime(500);
      await promise2;
    });

    expect(result.current.cart.items).toHaveLength(2);
    expect(result.current.cart.totalItems).toBe(2);
  });

  it('should remove item from cart', async () => {
    const { result } = renderHook(() => useCart());

    // Add item first
    await act(async () => {
      const promise = result.current.addToCart('product-1');
      vi.advanceTimersByTime(500);
      await promise;
    });

    // Remove item
    await act(async () => {
      const promise = result.current.removeFromCart('product-1');
      vi.advanceTimersByTime(300);
      await promise;
    });

    expect(result.current.cart.items).toHaveLength(0);
    expect(result.current.cart.totalItems).toBe(0);
  });

  it('should update item quantity', async () => {
    const { result } = renderHook(() => useCart());

    // Add item first
    await act(async () => {
      const promise = result.current.addToCart('product-1', { quantity: 1 });
      vi.advanceTimersByTime(500);
      await promise;
    });

    // Update quantity
    await act(async () => {
      const promise = result.current.updateQuantity('product-1', 5);
      vi.advanceTimersByTime(300);
      await promise;
    });

    expect(result.current.cart.items[0].quantity).toBe(5);
    expect(result.current.cart.totalItems).toBe(5);
  });

  it('should remove item when quantity is set to 0', async () => {
    const { result } = renderHook(() => useCart());

    // Add item first
    await act(async () => {
      const promise = result.current.addToCart('product-1');
      vi.advanceTimersByTime(500);
      await promise;
    });

    // Set quantity to 0
    await act(async () => {
      const promise = result.current.updateQuantity('product-1', 0);
      vi.advanceTimersByTime(300);
      await promise;
    });

    expect(result.current.cart.items).toHaveLength(0);
    expect(result.current.cart.totalItems).toBe(0);
  });

  it('should clear entire cart', async () => {
    const { result } = renderHook(() => useCart());

    // Add multiple items
    await act(async () => {
      const promise1 = result.current.addToCart('product-1');
      const promise2 = result.current.addToCart('product-2');
      vi.advanceTimersByTime(500);
      await Promise.all([promise1, promise2]);
    });

    // Clear cart
    await act(async () => {
      const promise = result.current.clearCart();
      vi.advanceTimersByTime(300);
      await promise;
    });

    expect(result.current.cart.items).toHaveLength(0);
    expect(result.current.cart.totalItems).toBe(0);
  });

  it('should check if item is in cart', async () => {
    const { result } = renderHook(() => useCart());

    expect(result.current.isInCart('product-1')).toBe(false);

    await act(async () => {
      const promise = result.current.addToCart('product-1');
      vi.advanceTimersByTime(500);
      await promise;
    });

    expect(result.current.isInCart('product-1')).toBe(true);
    expect(result.current.isInCart('product-2')).toBe(false);
  });

  it('should handle loading states', async () => {
    const { result } = renderHook(() => useCart());

    let addPromise: Promise<void>;
    act(() => {
      addPromise = result.current.addToCart('product-1');
    });

    expect(result.current.cart.isLoading).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(500);
      await addPromise;
    });

    expect(result.current.cart.isLoading).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    // Mock console.error to avoid noise in tests
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useCart());

    // Mock a failed API call by rejecting the promise
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = vi.fn().mockImplementation((callback, delay) => {
      if (delay === 500) {
        // Simulate API failure
        throw new Error('Network error');
      }
      return originalSetTimeout(callback, delay);
    }) as any;

    await act(async () => {
      try {
        await result.current.addToCart('product-1');
      } catch (error) {
        // Expected to fail
      }
    });

    expect(result.current.cart.error).toBeTruthy();
    expect(result.current.cart.isLoading).toBe(false);

    // Restore
    global.setTimeout = originalSetTimeout;
    consoleSpy.mockRestore();
  });
});