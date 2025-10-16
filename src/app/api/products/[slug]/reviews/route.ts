import { NextRequest, NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { createAdminClient } from "@/lib/appwrite-admin"

// Get database ID from environment
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
const REVIEWS_COLLECTION_ID = 'reviews'

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")
    const rating = searchParams.get("rating") // Filter by specific rating

    if (!slug) {
      return NextResponse.json(
        { error: 'Product slug is required' },
        { status: 400 }
      )
    }

    // Check if Appwrite is properly configured
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
    const apiKey = process.env.APPWRITE_API_KEY

    if (!projectId || projectId === 'your-project-id-here' || projectId === 'disabled' ||
        !apiKey || apiKey === 'your-api-key-here' || apiKey === 'disabled') {

      // Return fallback reviews when Appwrite is not configured
      console.warn('Appwrite not configured, returning fallback reviews')

      const fallbackReviews: ProductReview[] = [
        {
          $id: 'review-1',
          product_id: 'fallback-product-1',
          customer_name: 'Dr. Sarah Johnson',
          rating: 5,
          title: 'Excellent quality and comfort',
          comment: 'These scrubs are perfect for long shifts. The fabric is breathable and the fit is professional. Highly recommend for medical professionals.',
          is_approved: true,
          is_verified_purchase: true,
          $createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          $updatedAt: new Date().toISOString()
        },
        {
          $id: 'review-2',
          product_id: 'fallback-product-1',
          customer_name: 'Nurse Mike Chen',
          rating: 4,
          title: 'Great value for money',
          comment: 'Very comfortable and well-made. Sizing runs true and the pockets are very functional. Only wish they had more color options.',
          is_approved: true,
          is_verified_purchase: true,
          $createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          $updatedAt: new Date().toISOString()
        },
        {
          $id: 'review-3',
          product_id: 'fallback-product-1',
          customer_name: 'Dr. Emily Rodriguez',
          rating: 5,
          title: 'Perfect for busy hospital environment',
          comment: 'Love the durability and easy care. These scrubs hold up well through multiple washes and maintain their color and shape.',
          is_approved: true,
          is_verified_purchase: true,
          $createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          $updatedAt: new Date().toISOString()
        }
      ]

      // Apply rating filter if specified
      let filteredReviews = fallbackReviews
      if (rating) {
        filteredReviews = fallbackReviews.filter(review => review.rating === parseInt(rating))
      }

      // Apply pagination
      const paginatedReviews = filteredReviews.slice(offset, offset + limit)

      // Calculate stats
      const stats = {
        total: filteredReviews.length,
        averageRating: filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length,
        ratingDistribution: [1, 2, 3, 4, 5].map(r => ({
          rating: r,
          count: filteredReviews.filter(review => review.rating === r).length
        }))
      }

      return NextResponse.json({
        reviews: paginatedReviews,
        total: filteredReviews.length,
        stats,
        fallback: true
      })
    }

    // Production Appwrite implementation
    const { databases } = await createAdminClient()

    // First, we need to find the product by slug to get its ID
    const PRODUCTS_COLLECTION_ID = 'products'
    const productQuery = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      [Query.equal('slug', slug), Query.equal('is_active', true)]
    )

    if (productQuery.documents.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const productId = productQuery.documents[0].$id

    // Build queries for reviews
    const queries = [
      Query.equal('product_id', productId),
      Query.equal('is_approved', true),
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
      Query.offset(offset)
    ]

    // Add rating filter if specified
    if (rating) {
      queries.push(Query.equal('rating', parseInt(rating)))
    }

    // Fetch reviews with timeout
    const reviewsQuery = await Promise.race([
      databases.listDocuments(DATABASE_ID, REVIEWS_COLLECTION_ID, queries),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      )
    ]) as any

    // Calculate statistics
    const allReviewsQuery = await databases.listDocuments(
      DATABASE_ID,
      REVIEWS_COLLECTION_ID,
      [Query.equal('product_id', productId), Query.equal('is_approved', true)]
    )

    const allReviews = allReviewsQuery.documents as unknown as ProductReview[]
    const averageRating = allReviews.length > 0
      ? allReviews.reduce((sum: number, review: ProductReview) => sum + review.rating, 0) / allReviews.length
      : 0

    const stats = {
      total: allReviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution: [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: allReviews.filter((review: ProductReview) => review.rating === rating).length
      }))
    }

    return NextResponse.json({
      reviews: reviewsQuery.documents,
      total: allReviews.length,
      stats,
      hasMore: (offset + limit) < allReviews.length
    })

  } catch (error: any) {
    console.error('Error fetching product reviews:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}