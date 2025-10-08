import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWishlist } from '../useWishlist';

// Mock setTimeout for testing
vi.useFakeTimers();

describe('useWishlist', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with empty wishlist', () => {
    const { result } = renderHook(() => useWishlist(true));

    expect(result.current.wishlist.items).toEqual([]);
    expect(result.current.wishlist.isLoading).toBe(false);
    expect(result.current.wishlist.error).toBeNull();
  });

  it('should add item to wishlist when authenticated', async () => {
    const { result } = renderHook(() => useWishlist(true));

    await act(async () => {
      const promise = result.current.addToWishlist('product-1');
      vi.advanceTimersByTime(500);
      await promise;
    });

    expect(result.current.wishlist.items).toHaveLength(1);
    expect(result.current.wishlist.items[0].productId).toBe('product-1');
    expect(result.current.wishlist.items[0].addedAt).toBeInstanceOf(Date);
  });

  it('should throw error when adding to wishlist without authentication', async () => {
    const { result } = renderHook(() => useWishlist(false));

    await act(async () => {
      try {
        await result.current.addToWishlist('product-1');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Authentication required to add items to wishlist');
      }
    });

    expect(result.current.wishlist.items).toHaveLength(0);
  });

  it('should not add duplicate items to wishlist', async () => {
    const { result } = renderHook(() => useWishlist(true));

    // Add item first time
    await act(async () => {
      const promise = result.current.addToWishlist('product-1');
      vi.advanceTimersByTime(500);
      await promise;
    });

    // Try to add same item again
    await act(async () => {
      const promise = result.current.addToWishlist('product-1');
      vi.advanceTimersByTime(500);
      await promise;
    });

    expect(result.current.wishlist.items).toHaveLength(1);
    expect(result.current.wishlist.error).toBe('Item already in wishlist');
  });

  it('should remove item from wishlist', async () => {
    const { result } = renderHook(() => useWishlist(true));

    // Add item first
    await act(async () => {
      const promise = result.current.addToWishlist('product-1');
      vi.advanceTimersByTime(500);
      await promise;
    });

    // Remove item
    await act(async () => {
      const promise = result.current.removeFromWishlist('product-1');
      vi.advanceTimersByTime(300);
      await promise;
    });

    expect(result.current.wishlist.items).toHaveLength(0);
  });

  it('should throw error when removing from wishlist without authentication', async () => {
    const { result } = renderHook(() => useWishlist(false));

    await act(async () => {
      try {
        await result.current.removeFromWishlist('product-1');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Authentication required to modify wishlist');
      }
    });
  });

  it('should clear entire wishlist', async () => {
    const { result } = renderHook(() => useWishlist(true));

    // Add multiple items
    await act(async () => {
      const promise1 = result.current.addToWishlist('product-1');
      const promise2 = result.current.addToWishlist('product-2');
      vi.advanceTimersByTime(500);
      await Promise.all([promise1, promise2]);
    });

    // Clear wishlist
    await act(async () => {
      const promise = result.current.clearWishlist();
      vi.advanceTimersByTime(300);
      await promise;
    });

    expect(result.current.wishlist.items).toHaveLength(0);
  });

  it('should throw error when clearing wishlist without authentication', async () => {
    const { result } = renderHook(() => useWishlist(false));

    await act(async () => {
      try {
        await result.current.clearWishlist();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Authentication required to clear wishlist');
      }
    });
  });

  it('should check if item is in wishlist', async () => {
    const { result } = renderHook(() => useWishlist(true));

    expect(result.current.isInWishlist('product-1')).toBe(false);

    await act(async () => {
      const promise = result.current.addToWishlist('product-1');
      vi.advanceTimersByTime(500);
      await promise;
    });

    expect(result.current.isInWishlist('product-1')).toBe(true);
    expect(result.current.isInWishlist('product-2')).toBe(false);
  });

  it('should toggle wishlist item', async () => {
    const { result } = renderHook(() => useWishlist(true));

    // Toggle to add
    await act(async () => {
      const promise = result.current.toggleWishlist('product-1');
      vi.advanceTimersByTime(500);
      await promise;
    });

    expect(result.current.wishlist.items).toHaveLength(1);
    expect(result.current.isInWishlist('product-1')).toBe(true);

    // Toggle to remove
    await act(async () => {
      const promise = result.current.toggleWishlist('product-1');
      vi.advanceTimersByTime(300);
      await promise;
    });

    expect(result.current.wishlist.items).toHaveLength(0);
    expect(result.current.isInWishlist('product-1')).toBe(false);
  });

  it('should handle loading states', async () => {
    const { result } = renderHook(() => useWishlist(true));

    let addPromise: Promise<void>;
    act(() => {
      addPromise = result.current.addToWishlist('product-1');
    });

    expect(result.current.wishlist.isLoading).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(500);
      await addPromise;
    });

    expect(result.current.wishlist.isLoading).toBe(false);
  });

  it('should update authentication state correctly', () => {
    const { result, rerender } = renderHook(
      ({ isAuthenticated }) => useWishlist(isAuthenticated),
      { initialProps: { isAuthenticated: false } }
    );

    expect(() => result.current.addToWishlist('product-1')).rejects.toThrow();

    rerender({ isAuthenticated: true });

    // Should now be able to add items
    act(() => {
      result.current.addToWishlist('product-1');
    });

    expect(result.current.wishlist.isLoading).toBe(true);
  });
});