'use client';

import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types/product';

interface RecentlyViewedItem {
  product: Product;
  viewedAt: Date;
}

interface UseRecentlyViewedReturn {
  recentlyViewed: RecentlyViewedItem[];
  addToRecentlyViewed: (product: Product) => void;
  clearRecentlyViewed: () => void;
  isRecentlyViewed: (productId: string) => boolean;
}

const STORAGE_KEY = 'recently_viewed_products';
const MAX_ITEMS = 10;

export const useRecentlyViewed = (): UseRecentlyViewedReturn => {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert viewedAt strings back to Date objects
        const items = parsed.map((item: any) => ({
          ...item,
          viewedAt: new Date(item.viewedAt)
        }));
        setRecentlyViewed(items);
      }
    } catch (error) {
      console.error('Error loading recently viewed products:', error);
    }
  }, []);

  // Save to localStorage whenever recentlyViewed changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed));
    } catch (error) {
      console.error('Error saving recently viewed products:', error);
    }
  }, [recentlyViewed]);

  const addToRecentlyViewed = useCallback((product: Product) => {
    setRecentlyViewed(prev => {
      // Remove existing entry if it exists
      const filtered = prev.filter(item => item.product.$id !== product.$id);

      // Add new entry at the beginning
      const newItem: RecentlyViewedItem = {
        product,
        viewedAt: new Date()
      };

      // Keep only the most recent items (limit to MAX_ITEMS)
      const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);

      return updated;
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
  }, []);

  const isRecentlyViewed = useCallback((productId: string) => {
    return recentlyViewed.some(item => item.product.$id === productId);
  }, [recentlyViewed]);

  return {
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
    isRecentlyViewed
  };
};