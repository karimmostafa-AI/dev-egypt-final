import { NextRequest, NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { createAdminClient } from "@/lib/appwrite-admin"

// Get database ID from environment
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
const PRODUCTS_COLLECTION_ID = 'products'
const REVIEWS_COLLECTION_ID = 'reviews'
const VARIATIONS_COLLECTION_ID = 'product_variations'
const IMAGES_COLLECTION_ID = 'product_images'

// Enhanced interfaces for better type safety
interface ProductImage {
  $id: string;
  product_id: string;
  image_type: 'main' | 'variation' | 'gallery' | 'back';
  variation_type?: 'color' | 'size';
  variation_value?: string;
  file_id: string;
  url: string;
  alt_text: string;
  sort_order: number;
  image_source: 'device' | 'external';
  is_active: boolean;
  $createdAt: string;
  $updatedAt: string;
}

interface ProductVariation {
  $id: string;
  product_id: string;
  variation_type: 'color' | 'size' | 'material' | 'style';
  variation_value: string;
  variation_label: string;
  price_modifier: number;
  stock_quantity: number;
  sku_suffix: string;
  image_id?: string;
  is_active: boolean;
  sort_order: number;
  $createdAt: string;
  $updatedAt: string;
}

interface ProductReview {
  $id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  title: string;
  comment: string;
  is_approved: boolean;
  is_verified_purchase: boolean;
  $createdAt: string;
  $updatedAt: string;
}

interface EnhancedProductResponse {
  $id: string;
  name: string;
  slug: string;
  brand_id: string;
  category_id: string;
  price: number;
  discount_price: number;
  description: string;
  is_active: boolean;
  hasVariations: boolean;
  min_order_quantity: number;
  stock_quantity: number;
  low_stock_threshold: number;

  // Enhanced image structure
  images: {
    main: ProductImage[];
    back: ProductImage[];
    gallery: ProductImage[];
    variations: Record<string, ProductImage[]>;
  };

  // Enhanced variations structure
  variations: {
    colors: ProductVariation[];
    sizes: ProductVariation[];
    styles?: ProductVariation[];
    materials?: ProductVariation[];
  };

  // Stock and availability
  availability: {
    is_available: boolean;
    stock_quantity: number;
    min_order_quantity: number;
    max_order_quantity: number;
  };

  // Reviews
  reviews?: ProductReview[];
  reviewStats?: {
    total: number;
    averageRating: number;
    ratingDistribution: Array<{
      rating: number;
      count: number;
    }>;
  };

  $createdAt: string;
  $updatedAt: string;
}

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
  reviewStats?: {
    total: number
    averageRating: number
    ratingDistribution: Array<{
      rating: number
      count: number
    }>
  }
  $createdAt: string
  $updatedAt: string
}

// Helper function to fetch product images with enhanced structure
async function fetchProductImages(databases: any, productId: string): Promise<EnhancedProductResponse['images']> {
  try {
    const imagesQuery = await databases.listDocuments(
      DATABASE_ID,
      IMAGES_COLLECTION_ID,
      [Query.equal('product_id', productId), Query.equal('is_active', true)]
    )

    const images = imagesQuery.documents as ProductImage[]

    // Organize images by type
    const organizedImages: EnhancedProductResponse['images'] = {
      main: [],
      back: [],
      gallery: [],
      variations: {}
    }

    images.forEach(image => {
      switch (image.image_type) {
        case 'main':
          organizedImages.main.push(image)
          break
        case 'back':
          organizedImages.back.push(image)
          break
        case 'gallery':
          organizedImages.gallery.push(image)
          break
        case 'variation':
          if (image.variation_value) {
            if (!organizedImages.variations[image.variation_value]) {
              organizedImages.variations[image.variation_value] = []
            }
            organizedImages.variations[image.variation_value].push(image)
          }
          break
      }
    })

    // Sort images by sort_order
    Object.keys(organizedImages).forEach(key => {
      if (Array.isArray(organizedImages[key as keyof typeof organizedImages])) {
        (organizedImages[key as keyof typeof organizedImages] as ProductImage[]).sort(
          (a, b) => a.sort_order - b.sort_order
        )
      }
    })

    return organizedImages
  } catch (error) {
    console.warn('Images collection not found, using fallback')
    throw error
  }
}

// Helper function to fetch product variations
async function fetchProductVariations(
  databases: any,
  productId: string,
  hasVariations: boolean
): Promise<ProductVariation[]> {
  if (!hasVariations) return []

  try {
    const variationsQuery = await databases.listDocuments(
      DATABASE_ID,
      VARIATIONS_COLLECTION_ID,
      [
        Query.equal('product_id', productId),
        Query.equal('is_active', true),
        Query.orderAsc('sort_order')
      ]
    )

    return variationsQuery.documents as ProductVariation[]
  } catch (error) {
    console.warn('Variations collection not found, using legacy format')
    throw error
  }
}

// Helper function to fetch product reviews
async function fetchProductReviews(databases: any, productId: string): Promise<ProductReview[]> {
  try {
    const reviewsQuery = await databases.listDocuments(
      DATABASE_ID,
      REVIEWS_COLLECTION_ID,
      [
        Query.equal('product_id', productId),
        Query.equal('is_approved', true),
        Query.orderDesc('$createdAt'),
        Query.limit(20)
      ]
    )

    return reviewsQuery.documents as ProductReview[]
  } catch (error) {
    console.warn('Reviews collection not found')
    return []
  }
}

// Helper function to organize variations by type
function organizeVariationsByType(variations: ProductVariation[]): EnhancedProductResponse['variations'] {
  const organized: EnhancedProductResponse['variations'] = {
    colors: [],
    sizes: [],
    styles: [],
    materials: []
  }

  variations.forEach(variation => {
    switch (variation.variation_type) {
      case 'color':
        organized.colors.push(variation)
        break
      case 'size':
        organized.sizes.push(variation)
        break
      case 'style':
        organized.styles!.push(variation)
        break
      case 'material':
        organized.materials!.push(variation)
        break
    }
  })

  return organized
}

// Helper function to get fallback images
async function getFallbackImages(product: any): Promise<EnhancedProductResponse['images']> {
  const images: ProductImage[] = []

  // Create main image from product data
  if (product.mainImageUrl) {
    images.push({
      $id: 'fallback_main',
      product_id: product.$id,
      image_type: 'main',
      file_id: product.mainImageId || 'fallback_main',
      url: product.mainImageUrl,
      alt_text: `${product.name} - Main Image`,
      sort_order: 0,
      image_source: 'device',
      is_active: true,
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString()
    })
  }

  // Create back image from product data
  if (product.backImageUrl) {
    images.push({
      $id: 'fallback_back',
      product_id: product.$id,
      image_type: 'back',
      file_id: product.backImageId || 'fallback_back',
      url: product.backImageUrl,
      alt_text: `${product.name} - Back Image`,
      sort_order: 1,
      image_source: 'device',
      is_active: true,
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString()
    })
  }

  // Organize fallback images
  const organizedImages: EnhancedProductResponse['images'] = {
    main: images.filter(img => img.image_type === 'main'),
    back: images.filter(img => img.image_type === 'back'),
    gallery: images.filter(img => img.image_type === 'gallery'),
    variations: {}
  }

  return organizedImages
}

// Helper function to get fallback variations
function getFallbackVariations(product: any): EnhancedProductResponse['variations'] {
  const variations: ProductVariation[] = []

  // Parse legacy variations if available
  if (product.variations) {
    try {
      const legacyVariations = typeof product.variations === 'string'
        ? JSON.parse(product.variations)
        : product.variations

      legacyVariations.forEach((v: any, index: number) => {
        variations.push({
          $id: `legacy-var-${index}`,
          product_id: product.$id,
          variation_type: v.type || 'color',
          variation_value: v.color || v.size || v.value || 'Default',
          variation_label: v.colorName || v.label || v.color || v.size || 'Default',
          price_modifier: v.priceModifier || 0,
          stock_quantity: v.stock || 10,
          sku_suffix: v.sku || '',
          is_active: true,
          sort_order: index,
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString()
        })
      })
    } catch (error) {
      console.warn('Failed to parse legacy variations')
    }
  }

  return organizeVariationsByType(variations)
}

// Helper function to calculate availability info
function calculateAvailabilityInfo(
  product: any,
  variations: EnhancedProductResponse['variations']
): EnhancedProductResponse['availability'] {
  const totalStock = Object.values(variations).reduce((total, variationArray) => {
    return total + variationArray.reduce((sum, variation) => sum + variation.stock_quantity, 0)
  }, 0)

  return {
    is_available: totalStock > 0,
    stock_quantity: totalStock,
    min_order_quantity: product.min_order_quantity || 1,
    max_order_quantity: totalStock
  }
}

// Helper function to calculate review stats
function calculateReviewStats(reviews: ProductReview[]) {
  if (reviews.length === 0) {
    return {
      total: 0,
      averageRating: 0,
      ratingDistribution: [1, 2, 3, 4, 5].map(rating => ({ rating, count: 0 }))
    }
  }

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length

  return {
    total: reviews.length,
    averageRating: Math.round(averageRating * 10) / 10,
    ratingDistribution: [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: reviews.filter(review => review.rating === rating).length
    }))
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug

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

      // Return enhanced fallback data when Appwrite is not configured
      console.warn('Appwrite not configured, returning enhanced fallback product data')

      const fallbackProduct: EnhancedProduct = {
        $id: 'fallback-product-1',
        name: 'Premium Medical Scrub Set',
        slug: slug,
        brand_id: 'fallback-brand',
        category_id: 'fallback-category',
        price: 45.99,
        discount_price: 38.99,
        description: 'High-quality medical scrubs with enhanced comfort and durability. Features moisture-wicking fabric and multiple pockets for functionality.',
        is_active: true,
        hasVariations: true,
        mainImageUrl: '/figma/product-images/main-product-royal.png',
        stockQuantity: 50,
        variations: [
          {
            $id: 'var-1',
            product_id: 'fallback-product-1',
            variation_type: 'color',
            variation_value: 'Royal Blue',
            variation_label: 'Royal Blue',
            price_modifier: 0,
            stock_quantity: 20,
            sku_suffix: 'RB',
            is_active: true,
            sort_order: 0,
            $createdAt: new Date().toISOString(),
            $updatedAt: new Date().toISOString()
          },
          {
            $id: 'var-2',
            product_id: 'fallback-product-1',
            variation_type: 'color',
            variation_value: 'Navy Blue',
            variation_label: 'Navy Blue',
            price_modifier: 0,
            stock_quantity: 15,
            sku_suffix: 'NB',
            is_active: true,
            sort_order: 1,
            $createdAt: new Date().toISOString(),
            $updatedAt: new Date().toISOString()
          },
          {
            $id: 'var-3',
            product_id: 'fallback-product-1',
            variation_type: 'size',
            variation_value: 'Medium',
            variation_label: 'Medium',
            price_modifier: 0,
            stock_quantity: 25,
            sku_suffix: 'M',
            is_active: true,
            sort_order: 0,
            $createdAt: new Date().toISOString(),
            $updatedAt: new Date().toISOString()
          },
          {
            $id: 'var-4',
            product_id: 'fallback-product-1',
            variation_type: 'size',
            variation_value: 'Large',
            variation_label: 'Large',
            price_modifier: 2,
            stock_quantity: 10,
            sku_suffix: 'L',
            is_active: true,
            sort_order: 1,
            $createdAt: new Date().toISOString(),
            $updatedAt: new Date().toISOString()
          }
        ],
        reviews: [
          {
            $id: 'review-1',
            product_id: 'fallback-product-1',
            customer_name: 'Dr. Sarah Johnson',
            rating: 5,
            title: 'Excellent quality and comfort',
            comment: 'These scrubs are perfect for long shifts. The fabric is breathable and the fit is professional.',
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
            comment: 'Very comfortable and well-made. Sizing runs true and the pockets are very functional.',
            is_approved: true,
            is_verified_purchase: true,
            $createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            $updatedAt: new Date().toISOString()
          }
        ],
        reviewStats: {
          total: 2,
          averageRating: 4.5,
          ratingDistribution: [
            { rating: 1, count: 0 },
            { rating: 2, count: 0 },
            { rating: 3, count: 0 },
            { rating: 4, count: 1 },
            { rating: 5, count: 1 }
          ]
        },
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString()
      }

      return NextResponse.json({
        product: fallbackProduct,
        success: true,
        fallback: true
      })
    }

    // Production Appwrite implementation
    const { databases } = await createAdminClient()

    // Fetch main product
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

    const product = productQuery.documents[0]

    // Enhanced data fetching with proper error handling
    const [imagesResult, variationsResult, reviewsResult] = await Promise.allSettled([
      fetchProductImages(databases, product.$id),
      fetchProductVariations(databases, product.$id, product.hasVariations),
      fetchProductReviews(databases, product.$id)
    ])

    // Process images with enhanced structure
    const images = imagesResult.status === 'fulfilled'
      ? imagesResult.value
      : await getFallbackImages(product)

    // Process variations with enhanced structure
    const variations = variationsResult.status === 'fulfilled'
      ? organizeVariationsByType(variationsResult.value)
      : getFallbackVariations(product)

    // Process reviews
    const reviews = reviewsResult.status === 'fulfilled'
      ? reviewsResult.value
      : []

    // Calculate enhanced availability info
    const availability = calculateAvailabilityInfo(product, variations)

    // Calculate review statistics
    const reviewStats = calculateReviewStats(reviews)

    // Build enhanced product response
    const enhancedProduct: EnhancedProductResponse = {
      $id: product.$id,
      name: product.name,
      slug: product.slug,
      brand_id: product.brand_id,
      category_id: product.category_id,
      price: product.price || 0,
      discount_price: product.discount_price || 0,
      description: product.description || '',
      is_active: product.is_active !== false,
      hasVariations: product.hasVariations || false,
      min_order_quantity: product.min_order_quantity || 1,
      stock_quantity: product.stockQuantity || product.stock_quantity || 0,
      low_stock_threshold: product.lowStockThreshold || 5,
      images,
      variations,
      availability,
      reviews,
      reviewStats,
      $createdAt: product.$createdAt,
      $updatedAt: product.$updatedAt
    }

    return NextResponse.json({
      product: enhancedProduct,
      success: true
    })

  } catch (error: any) {
    console.error('Error fetching product details:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product details' },
      { status: 500 }
    )
  }
}