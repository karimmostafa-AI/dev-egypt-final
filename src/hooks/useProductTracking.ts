'use client'

import { useEffect, useCallback } from 'react'

interface ProductTrackingData {
  product_id: string
  product_name: string
  product_price: number
  category?: string
  brand?: string
}

export function useProductTracking() {
  const trackProductView = useCallback(async (product: ProductTrackingData) => {
    try {
      const visitorId = localStorage.getItem('visitor_id') || ''
      const sessionId = sessionStorage.getItem('session_id') || ''

      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'product_view',
          visitor_id: visitorId,
          session_id: sessionId,
          page_url: window.location.pathname,
          product_id: product.product_id,
          product_name: product.product_name,
          product_price: product.product_price,
          category: product.category,
          custom_data: {
            brand: product.brand,
          },
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (error) {
      console.error('Failed to track product view:', error)
    }
  }, [])

  const trackAddToCart = useCallback(async (
    product: ProductTrackingData,
    quantity: number = 1
  ) => {
    try {
      const visitorId = localStorage.getItem('visitor_id') || ''
      const sessionId = sessionStorage.getItem('session_id') || ''

      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'add_to_cart',
          visitor_id: visitorId,
          session_id: sessionId,
          page_url: window.location.pathname,
          product_id: product.product_id,
          product_name: product.product_name,
          product_price: product.product_price,
          quantity,
          cart_value: product.product_price * quantity,
          category: product.category,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (error) {
      console.error('Failed to track add to cart:', error)
    }
  }, [])

  const trackAddToWishlist = useCallback(async (product: ProductTrackingData) => {
    try {
      const visitorId = localStorage.getItem('visitor_id') || ''
      const sessionId = sessionStorage.getItem('session_id') || ''

      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'add_to_wishlist',
          visitor_id: visitorId,
          session_id: sessionId,
          page_url: window.location.pathname,
          product_id: product.product_id,
          product_name: product.product_name,
          product_price: product.product_price,
          category: product.category,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (error) {
      console.error('Failed to track add to wishlist:', error)
    }
  }, [])

  const trackSearch = useCallback(async (searchQuery: string) => {
    try {
      const visitorId = localStorage.getItem('visitor_id') || ''
      const sessionId = sessionStorage.getItem('session_id') || ''

      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'search',
          visitor_id: visitorId,
          session_id: sessionId,
          page_url: window.location.pathname,
          search_query: searchQuery,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (error) {
      console.error('Failed to track search:', error)
    }
  }, [])

  return {
    trackProductView,
    trackAddToCart,
    trackAddToWishlist,
    trackSearch,
  }
}

// Auto-track product view on mount
export function useAutoTrackProductView(product: ProductTrackingData | null) {
  const { trackProductView } = useProductTracking()

  useEffect(() => {
    if (product) {
      trackProductView(product)
    }
  }, [product?.product_id]) // Only track when product ID changes
}
