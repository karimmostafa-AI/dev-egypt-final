import { NextRequest, NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { createAdminClient } from "@/lib/appwrite-admin"

// Get database ID from environment
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
const PRODUCTS_COLLECTION_ID = 'products'

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
      console.warn('Appwrite not configured, returning fallback product data')
      const fallbackProducts = [
        {
          $id: 'omaima-scrub-top-1',
          name: 'Omaima Premium Scrub Top',
          slug: 'omaima-premium-scrub-top',
          media_id: 'https://via.placeholder.com/300x400?text=Omaima+Scrub+Top',
          brand_id: 'omaima-fallback',
          category_id: 'scrubs-fallback',
          units: 1,
          price: 150,
          discount_price: 120,
          min_order_quantity: 1,
          description: 'Premium quality scrub top from Omaima collection',
          is_active: true,
          is_new: true,
          is_featured: true,
          meta_title: 'Omaima Premium Scrub Top',
          meta_description: 'High-quality medical scrub top',
          meta_keywords: 'scrubs, medical, omaima',
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString()
        },
        {
          $id: 'omaima-scrub-pants-1',
          name: 'Omaima Comfortable Scrub Pants',
          slug: 'omaima-comfortable-scrub-pants',
          media_id: 'https://via.placeholder.com/300x400?text=Omaima+Scrub+Pants',
          brand_id: 'omaima-fallback',
          category_id: 'scrubs-fallback',
          units: 1,
          price: 130,
          discount_price: 100,
          min_order_quantity: 1,
          description: 'Comfortable and durable scrub pants from Omaima',
          is_active: true,
          is_new: false,
          is_featured: true,
          meta_title: 'Omaima Comfortable Scrub Pants',
          meta_description: 'Durable medical scrub pants',
          meta_keywords: 'scrubs, medical, omaima, pants',
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString()
        },
        {
          $id: 'dev-egypt-uniform-1',
          name: 'Dev Egypt Professional Uniform',
          slug: 'dev-egypt-professional-uniform',
          media_id: 'https://via.placeholder.com/300x400?text=Dev+Egypt+Uniform',
          brand_id: 'dev-egypt-fallback',
          category_id: 'uniforms-fallback',
          units: 1,
          price: 200,
          discount_price: 0,
          min_order_quantity: 1,
          description: 'Professional uniform from Dev Egypt collection',
          is_active: true,
          is_new: false,
          is_featured: false,
          meta_title: 'Dev Egypt Professional Uniform',
          meta_description: 'High-quality professional uniform',
          meta_keywords: 'uniform, professional, dev egypt',
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
      
      // Apply pagination
      const paginatedProducts = filteredProducts.slice(offset, offset + limit)
      
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

    return NextResponse.json({
      products: result.documents,
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

    // Set default values
    const productToCreate = {
      name: productData.name,
      slug: productData.slug,
      media_id: productData.media_id || '',
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
      meta_title: productData.meta_title || productData.name,
      meta_description: productData.meta_description || '',
      meta_keywords: productData.meta_keywords || ''
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
    const allowedFields = ['name', 'slug', 'media_id', 'brand_id', 'category_id', 'units', 'price', 'discount_price', 'min_order_quantity', 'description', 'is_active', 'is_new', 'is_featured', 'meta_title', 'meta_description', 'meta_keywords']
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