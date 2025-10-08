'use client';

import { useState, useCallback } from 'react';

export interface WishlistItem {
  productId: string;
  addedAt: Date;
}

export interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
}

export interface UseWishlistReturn {
  wishlist: WishlistState;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
}

export const useWishlist = (isAuthenticated: boolean = false): UseWishlistReturn => {
  const [wishlist, setWishlist] = useState<WishlistState>({
    items: [],
    isLoading: false,
    error: null,
  });

  const addToWishlist = useCallback(async (productId: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required to add items to wishlist');
    }

    setWishlist(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setWishlist(prev => {
        // Check if item already exists
        if (prev.items.some(item => item.productId === productId)) {
          return {
            ...prev,
            isLoading: false,
            error: 'Item already in wishlist',
          };
        }

        const newItem: WishlistItem = {
          productId,
          addedAt: new Date(),
        };

        return {
          ...prev,
          items: [...prev.items, newItem],
          isLoading: false,
        };
      });
    } catch (error) {
      setWishlist(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to add item to wishlist',
      }));
    }
  }, [isAuthenticated]);

  const removeFromWishlist = useCallback(async (productId: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required to modify wishlist');
    }

    setWishlist(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      setWishlist(prev => ({
        ...prev,
        items: prev.items.filter(item => item.productId !== productId),
        isLoading: false,
      }));
    } catch (error) {
      setWishlist(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to remove item from wishlist',
      }));
    }
  }, [isAuthenticated]);

  const clearWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('Authentication required to clear wishlist');
    }

    setWishlist(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      setWishlist(prev => ({
        ...prev,
        items: [],
        isLoading: false,
      }));
    } catch (error) {
      setWishlist(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to clear wishlist',
      }));
    }
  }, [isAuthenticated]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlist.items.some(item => item.productId === productId);
  }, [wishlist.items]);

  const toggleWishlist = useCallback(async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  }, [isInWishlist, removeFromWishlist, addToWishlist]);

  return {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
    toggleWishlist,
  };
};