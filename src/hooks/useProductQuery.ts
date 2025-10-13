'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Types for our API responses
interface ProductVariation {
  $id: string
  product_id: string
  variation_type: 'color' | 'size' | 'material' | 'style'
  variation_value: string
  price_modifier: number
  stock_quantity: number
  sku_suffix: string
  is_active: boolean
  $createdAt: string
  $updatedAt: string
}

interface ProductReview {
  $id: string
  product_id: string
  customer_name: string
  rating: number
  title: string
  comment: string
  is_approved: boolean
  is_verified_purchase: boolean
  $createdAt: string
  $updatedAt: string
}

interface ProductReviewStats {
  total: number
  averageRating: number
  ratingDistribution: Array<{
    rating: number
    count: number
  }>
}

interface EnhancedProduct {
  $id: string
  name: string
  slug: string
  brand_id: string
  category_id: string
  price: number
  discount_price: number
  description: string
  is_active: boolean
  hasVariations: boolean
  mainImageUrl?: string
  mainImageId?: string
  stockQuantity?: number
  variations?: ProductVariation[]
  reviews?: ProductReview[]
  reviewStats?: ProductReviewStats
  $createdAt: string
  $updatedAt: string
}

interface ProductQueryResponse {
  product: EnhancedProduct
  success: boolean
  fallback?: boolean
}

interface ReviewsQueryResponse {
  reviews: ProductReview[]
  total: number
  stats: ProductReviewStats
  fallback?: boolean
}

// Custom hook for fetching product details
export function useProductDetails(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async (): Promise<ProductQueryResponse> => {
      const response = await fetch(`/api/products/${slug}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.statusText}`)
      }
      return response.json()
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Custom hook for fetching product reviews
export function useProductReviews(slug: string, options?: {
  limit?: number
  offset?: number
  rating?: number
}) {
  const { limit = 10, offset = 0, rating } = options || {}

  return useQuery({
    queryKey: ['product-reviews', slug, limit, offset, rating],
    queryFn: async (): Promise<ReviewsQueryResponse> => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      })

      if (rating) {
        params.append('rating', rating.toString())
      }

      const response = await fetch(`/api/products/${slug}/reviews?${params}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.statusText}`)
      }
      return response.json()
    },
    enabled: !!slug,
    staleTime: 2 * 60 * 1000, // 2 minutes for reviews
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Custom hook for fetching related products
export function useRelatedProducts(productId: string, categoryId?: string, limit = 4) {
  return useQuery({
    queryKey: ['related-products', productId, categoryId, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        available: 'true',
      })

      if (categoryId) {
        params.append('catalog', categoryId)
      }

      const response = await fetch(`/api/admin/products?${params}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch related products: ${response.statusText}`)
      }
      return response.json()
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Mutation hook for updating product view count
export function useUpdateProductViewCount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/products/${productId}/view`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Failed to update view count')
      }
      return response.json()
    },
    onSuccess: (data, productId) => {
      // Invalidate and refetch product data to update view count
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
    },
  })
}

// Custom hook for prefetching related products
export function usePrefetchRelatedProducts() {
  const queryClient = useQueryClient()

  const prefetchRelatedProducts = (productId: string, categoryId?: string) => {
    queryClient.prefetchQuery({
      queryKey: ['related-products', productId, categoryId, 4],
      queryFn: async () => {
        const params = new URLSearchParams({
          limit: '4',
          available: 'true',
        })

        if (categoryId) {
          params.append('catalog', categoryId)
        }

        const response = await fetch(`/api/admin/products?${params}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch related products: ${response.statusText}`)
        }
        return response.json()
      },
      staleTime: 5 * 60 * 1000,
    })
  }

  return { prefetchRelatedProducts }
}