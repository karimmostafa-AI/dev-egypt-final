import { NextRequest, NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { createAdminClient } from "@/lib/appwrite-admin"
import { createImageMappingService } from "@/lib/image-mapping-service"
import { enhanceProductWithVariations } from "@/lib/legacy-variation-converter"

// Get database ID from environment
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
const PRODUCTS_COLLECTION_ID = 'products'
const REVIEWS_COLLECTION_ID = 'reviews'
const VARIATIONS_COLLECTION_ID = 'product_variations'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")
    const available = searchParams.get("available")
    const catalog = searchParams.get("catalog")
    const brand = searchParams.get("brand")

    // Check if Appwrite is properly configured
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
    const apiKey = process.env.APPWRITE_API_KEY
    
    if (!projectId || projectId === 'your-project-id-here' || projectId === 'disabled' || !apiKey || apiKey === 'your-api-key-here' || apiKey === 'disabled') {
      // Return fallback data when Appwrite is not configured
      console.warn('Appwrite not configured, returning fallback product data with real uploaded images')

      // Use image mapping service to get real uploaded images
      const mappingService = createImageMappingService()
      const mapping = await mappingService.mapImagesToProducts()

      const fallbackProducts = [
        {
          $id: 'img_1759798139129',
          name: 'Premium Medical Scrub Top',
          slug: 'premium-medical-scrub-top',
          brand_id: 'dev-egypt-fallback',
          category_id: 'scrubs-fallback',
          units: 1,
          price: 150,
          discount_price: 120,
          min_order_quantity: 1,
          description: 'High-quality medical scrub top with professional design',
          is_active: true,
          is_new: true,
          is_featured: true,
          hasVariations: false,
          mainImageUrl: mapping.mainImages['img_1759798139129'] || 'https://via.placeholder.com/300x400?text=Scrub+Top',
          backImageUrl: mapping.backImages['img_1759798144021'] || mapping.mainImages['img_1759798139129'],
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString()
        },
        {
          $id: 'img_1759798144021',
          name: 'Comfortable Medical Scrub Pants',
          slug: 'comfortable-medical-scrub-pants',
          brand_id: 'dev-egypt-fallback',
          category_id: 'scrubs-fallback',
          units: 1,
          price: 130,
          discount_price: 100,
          min_order_quantity: 1,
          description: 'Comfortable and durable medical scrub pants for all-day wear',
          is_active: true,
          is_new: false,
          is_featured: true,
          hasVariations: false,
          mainImageUrl: mapping.mainImages['img_1759798144021'] || 'https://via.placeholder.com/300x400?text=Scrub+Pants',
          backImageUrl: mapping.backImages['img_1759798139129'] || mapping.mainImages['img_1759798144021'],
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString()
        },
        {
          $id: 'dev-egypt-set-1',
          name: 'Dev Egypt Professional Scrub Set',
          slug: 'dev-egypt-professional-scrub-set',
          brand_id: 'dev-egypt-fallback',
          category_id: 'scrubs-fallback',
          units: 1,
          price: 250,
          discount_price: 200,
          min_order_quantity: 1,
          description: 'Complete professional scrub set with top and pants',
          is_active: true,
          is_new: false,
          is_featured: false,
          hasVariations: false,
          mainImageUrl: mapping.mainImages['img_1759798139129'] || 'https://via.placeholder.com/300x400?text=Scrub+Set',
          backImageUrl: mapping.backImages['img_1759798144021'] || mapping.mainImages['img_1759798139129'],
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString()
        }
      ]
      
      // Apply filters
      let filteredProducts = fallbackProducts
      
      if (search) {
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.description.toLowerCase().includes(search.toLowerCase())
        )
      }
      
      if (available !== null && available !== undefined) {
        const availableBool = available === "true"
        filteredProducts = filteredProducts.filter(product => product.is_active === availableBool)
      }
      
      if (catalog) {
        filteredProducts = filteredProducts.filter(product => product.category_id === catalog)
      }
      
      if (brand) {
        filteredProducts = filteredProducts.filter(product => product.brand_id === brand)
      }
      
      // Enhance fallback products with real uploaded images and normalized variations
      const enhancedFallbackProducts = await Promise.all(
        filteredProducts.map(async (product: any) => {
          const withImages = await mappingService.enhanceProductWithImages(product)
          return enhanceProductWithVariations(withImages)
        })
      )

      // Apply pagination
      const paginatedProducts = enhancedFallbackProducts.slice(offset, offset + limit)
      
      // Calculate stats
      const stats = {
        total: filteredProducts.length,
        available: filteredProducts.filter(p => p.is_active).length,
        unavailable: filteredProducts.filter(p => !p.is_active).length,
        onSale: filteredProducts.filter(p => p.discount_price > 0 && p.discount_price < p.price).length,
        totalValue: filteredProducts.reduce((sum, p) => sum + (p.price * 1), 0)
      }
      
      return NextResponse.json({
        products: paginatedProducts,
        total: filteredProducts.length,
        stats,
        fallback: true
      })
    }

    // Original Appwrite logic (when properly configured)
    const { databases } = await createAdminClient()

    // Build queries
    const queries = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc('$createdAt')
    ]

    // Add search query if provided
    if (search) {
      queries.push(Query.search("name", search))
    }

    // Add filters
    if (available !== null && available !== undefined) {
      queries.push(Query.equal("is_active", available === "true"))
    }

    if (catalog) {
      queries.push(Query.equal("category_id", catalog))
    }

    if (brand) {
      queries.push(Query.equal("brand_id", brand))
    }

    // Fetch products with timeout
    const result = await Promise.race([
      databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION_ID, queries),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      )
    ]) as any

    // Calculate stats
    const stats = {
      total: result.total,
      available: result.documents.filter((p: any) => p.is_active).length,
      unavailable: result.documents.filter((p: any) => !p.is_active).length,
      onSale: result.documents.filter((p: any) => p.discount_price > 0 && p.discount_price < p.price).length,
      totalValue: result.documents.reduce((sum: number, p: any) => sum + (p.price * 1), 0)
    }

    // Enhance products with real uploaded images and normalized variations
    const imageMappingService = createImageMappingService()
    const enhancedProducts = await Promise.all(
      result.documents.map(async (product: any) => {
        const withImages = await imageMappingService.enhanceProductWithImages(product)
        return enhanceProductWithVariations(withImages)
      })
    )

    return NextResponse.json({
      products: enhancedProducts,
      total: result.total,
      stats,
    })

  } catch (error: any) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 }
    )
  }
}

// Enhanced product details endpoint with variations and reviews
export async function GET_PRODUCT_DETAILS(slug: string) {
  try {
    const { databases } = await createAdminClient()

    // Fetch main product
    const productQuery = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      [Query.equal('slug', slug), Query.equal('is_active', true)]
    )

    if (productQuery.documents.length === 0) {
      return { error: 'Product not found', status: 404 }
    }

    const product = productQuery.documents[0]

    // Fetch product variations if the product has variations
    let variations = []
    if (product.hasVariations) {
      try {
        const variationsQuery = await databases.listDocuments(
          DATABASE_ID,
          VARIATIONS_COLLECTION_ID,
          [Query.equal('product_id', product.$id)]
        )
        variations = variationsQuery.documents
      } catch (error) {
        console.warn('Variations collection not found, using legacy variations format')
        // Fallback to parsing variations from product data
        if (product.variations) {
          try {
            variations = typeof product.variations === 'string'
              ? JSON.parse(product.variations)
              : product.variations
          } catch (error) {
            console.warn('Failed to parse legacy variations')
          }
        }
      }
    }

    // Fetch product reviews
    let reviews: any[] = []
    try {
      const reviewsQuery = await databases.listDocuments(
        DATABASE_ID,
        REVIEWS_COLLECTION_ID,
        [
          Query.equal('product_id', product.$id),
          Query.equal('is_approved', true),
          Query.orderDesc('$createdAt'),
          Query.limit(10)
        ]
      )
      reviews = reviewsQuery.documents
    } catch (error) {
      console.warn('Reviews collection not found')
    }

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / reviews.length
      : 0

    // Enhanced product data structure
    const enhancedProduct = {
      ...product,
      variations: variations,
      reviews: reviews,
      reviewStats: {
        total: reviews.length,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution: [1, 2, 3, 4, 5].map(rating => ({
          rating,
          count: reviews.filter((review: any) => review.rating === rating).length
        }))
      }
    }

    return { product: enhancedProduct, status: 200 }

  } catch (error: any) {
    console.error('Error fetching product details:', error)
    return { error: error.message || 'Failed to fetch product details', status: 500 }
  }
}

export async function POST(request: NextRequest) {
  try {
    const productData = await request.json()

    // Create admin client
    const { databases } = await createAdminClient()

    // Validate required fields
    const requiredFields = ['name', 'slug', 'price', 'brand_id', 'category_id']
    for (const field of requiredFields) {
      if (!productData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Parse colors, sizes, and auto-generated variations
    let colors = []
    let sizes = []
    let variations = []
    let hasVariations = false

    try {
      // Parse selected colors from the ColorSelector component
      if (productData.selectedColors) {
        colors = typeof productData.selectedColors === 'string'
          ? JSON.parse(productData.selectedColors)
          : productData.selectedColors
      }

      // Parse selected sizes from the SizeSelector component
      if (productData.selectedSizes) {
        sizes = typeof productData.selectedSizes === 'string'
          ? JSON.parse(productData.selectedSizes)
          : productData.selectedSizes
      }

      // Parse generated variations from the variation-generator utility
      if (productData.generatedVariations) {
        variations = typeof productData.generatedVariations === 'string'
          ? JSON.parse(productData.generatedVariations)
          : productData.generatedVariations
      } else if (productData.variations) {
        // Fallback to legacy variations format
        variations = typeof productData.variations === 'string'
          ? JSON.parse(productData.variations)
          : productData.variations
      }

      // Determine if product has variations
      hasVariations = (Array.isArray(variations) && variations.length > 0) ||
                     (Array.isArray(colors) && colors.length > 0) ||
                     (Array.isArray(sizes) && sizes.length > 0)

      console.log('Parsed variation data:', {
        colors: colors.length,
        sizes: sizes.length,
        variations: variations.length,
        hasVariations
      })

    } catch (error) {
      console.warn('Error parsing variation data:', error)
      hasVariations = false
      colors = []
      sizes = []
      variations = []
    }

    // Create compact variation summary (to fit in 1000 char limit)
    const compactVariationSummary = {
      count: variations.length,
      colorIds: colors.map(c => c.id),
      sizeIds: sizes.map(s => s.id)
    }
    const variationString = JSON.stringify(compactVariationSummary)
    
    // Log warning if variations string is too long
    if (variationString.length > 1000) {
      console.warn(`⚠️ Variations string too long (${variationString.length} chars). Storing summary only.`)
    }

    // Prepare compact color options (only essential fields)
    const compactColors = colors.map(c => ({
      i: c.id,
      n: c.name,
      h: c.hexCode,
      f: c.frontImageUrl,
      b: c.backImageUrl
    }))

    // Prepare compact size options (only essential fields)
    const compactSizes = sizes.map(s => ({
      i: s.id,
      n: s.name,
      s: s.stock,
      p: s.priceModifier
    }))

    const colorOptionsString = JSON.stringify(compactColors)
    const sizeOptionsString = JSON.stringify(compactSizes)

    console.log('Storage size check:', {
      variations: variationString.length,
      colorOptions: colorOptionsString.length,
      sizeOptions: sizeOptionsString.length
    })

    // Set default values
    const productToCreate = {
      name: productData.name,
      slug: productData.slug,
      brand_id: productData.brand_id,
      category_id: productData.category_id,
      units: productData.units || 1,
      price: parseFloat(productData.price),
      discount_price: productData.discount_price ? parseFloat(productData.discount_price) : 0,
      min_order_quantity: productData.min_order_quantity || 1,
      description: productData.description || '',
      is_active: productData.is_active !== undefined ? productData.is_active : true,
      is_new: productData.is_new !== undefined ? productData.is_new : false,
      is_featured: productData.is_featured !== undefined ? productData.is_featured : false,
      hasVariations: hasVariations,
      // Store compact variation summary (fits in 1000 chars)
      variations: variationString.length <= 1000 ? variationString : '{}',
      // Store compact color and size options
      colorOptions: colorOptionsString.length <= 1000 ? colorOptionsString : '[]',
      sizeOptions: sizeOptionsString.length <= 1000 ? sizeOptionsString : '[]',
      // Image data
      mainImageId: productData.mainImageId || '',
      backImageId: productData.backImageId || '',
      mainImageUrl: productData.mainImageUrl || '',
      backImageUrl: productData.backImageUrl || '',
      galleryImages: productData.galleryImages || '[]',
      imageVariations: productData.imageVariations || '[]',
      // Pricing and inventory
      compareAtPrice: productData.compareAtPrice || null,
      costPerItem: productData.costPerItem || null,
      sku: productData.sku || '',
      stockQuantity: productData.stockQuantity || 0,
      lowStockThreshold: productData.lowStockThreshold || 5,
      // Metadata
      tags: productData.tags || [],
      status: productData.status || 'active',
      featuredImageId: productData.featuredImageId || null,
      viewCount: productData.viewCount || 0,
      salesCount: productData.salesCount || 0,
      lastViewedAt: productData.lastViewedAt || null
    }

    // Create the product
    const product = await databases.createDocument(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      'unique()',
      productToCreate
    )

    return NextResponse.json({ product }, { status: 201 })

  } catch (error: any) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    const updateData = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }

    // Create admin client
    const { databases } = await createAdminClient()

    // Prepare update data (only include fields that are provided)
    const allowedFields = ['name', 'slug', 'brand_id', 'category_id', 'units', 'price', 'discount_price', 'min_order_quantity', 'description', 'is_active', 'is_new', 'is_featured', 'mainImageId', 'mainImageUrl', 'backImageId', 'backImageUrl']
    const filteredUpdateData: any = {}

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'price' || field === 'discount_price') {
          filteredUpdateData[field] = parseFloat(updateData[field])
        } else if (field === 'units' || field === 'min_order_quantity') {
          filteredUpdateData[field] = parseInt(updateData[field])
        } else {
          filteredUpdateData[field] = updateData[field]
        }
      }
    })

    // Update the product
    const updatedProduct = await databases.updateDocument(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      productId,
      filteredUpdateData
    )

    return NextResponse.json({ product: updatedProduct })

  } catch (error: any) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update product" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }

    // Create admin client
    const { databases } = await createAdminClient()

    // Delete the product
    await databases.deleteDocument(DATABASE_ID, PRODUCTS_COLLECTION_ID, productId)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete product" },
      { status: 500 }
    )
  }
}