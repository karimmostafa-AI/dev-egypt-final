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

    // Create admin client
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
    ])

    // Calculate stats
    const stats = {
      total: result.total,
      available: result.documents.filter(p => p.is_active).length,
      unavailable: result.documents.filter(p => !p.is_active).length,
      onSale: result.documents.filter(p => p.discount_price > 0 && p.discount_price < p.price).length,
      totalValue: result.documents.reduce((sum, p) => sum + (p.price * 1), 0)
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