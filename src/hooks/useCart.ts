'use client';

import { useState, useCallback } from 'react';

export interface CartItem {
  productId: string;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  addedAt: Date;
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
  isLoading: boolean;
  error: string | null;
}

export interface UseCartReturn {
  cart: CartState;
  addToCart: (productId: string, options?: { color?: string; size?: string; quantity?: number }) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isInCart: (productId: string) => boolean;
}

export const useCart = (): UseCartReturn => {
  const [cart, setCart] = useState<CartState>({
    items: [],
    totalItems: 0,
    isLoading: false,
    error: null,
  });

  const addToCart = useCallback(async (
    productId: string, 
    options: { color?: string; size?: string; quantity?: number } = {}
  ) => {
    setCart(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setCart(prev => {
        const existingItemIndex = prev.items.findIndex(item => 
          item.productId === productId && 
          item.selectedColor === options.color &&
          item.selectedSize === options.size
        );

        let newItems: CartItem[];
        
        if (existingItemIndex >= 0) {
          // Update existing item quantity
          newItems = [...prev.items];
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + (options.quantity || 1)
          };
        } else {
          // Add new item
          const newItem: CartItem = {
            productId,
            quantity: options.quantity || 1,
            selectedColor: options.color,
            selectedSize: options.size,
            addedAt: new Date(),
          };
          newItems = [...prev.items, newItem];
        }

        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);

        return {
          ...prev,
          items: newItems,
          totalItems,
          isLoading: false,
        };
      });
    } catch (error) {
      setCart(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to add item to cart',
      }));
    }
  }, []);

  const removeFromCart = useCallback(async (productId: string) => {
    setCart(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      setCart(prev => {
        const newItems = prev.items.filter(item => item.productId !== productId);
        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);

        return {
          ...prev,
          items: newItems,
          totalItems,
          isLoading: false,
        };
      });
    } catch (error) {
      setCart(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to remove item from cart',
      }));
    }
  }, []);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    setCart(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      setCart(prev => {
        const newItems = prev.items.map(item =>
          item.productId === productId ? { ...item, quantity } : item
        );
        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);

        return {
          ...prev,
          items: newItems,
          totalItems,
          isLoading: false,
        };
      });
    } catch (error) {
      setCart(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update cart',
      }));
    }
  }, [removeFromCart]);

  const clearCart = useCallback(async () => {
    setCart(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      setCart(prev => ({
        ...prev,
        items: [],
        totalItems: 0,
        isLoading: false,
      }));
    } catch (error) {
      setCart(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to clear cart',
      }));
    }
  }, []);

  const isInCart = useCallback((productId: string) => {
    return cart.items.some(item => item.productId === productId);
  }, [cart.items]);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
  };
};