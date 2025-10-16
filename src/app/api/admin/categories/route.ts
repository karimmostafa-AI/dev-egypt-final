import { NextRequest, NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { createAdminClient } from "@/lib/appwrite-admin"

// Get database ID from environment
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
const CATEGORIES_COLLECTION_ID = 'categories'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status")

    // Check if Appwrite is properly configured
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
    const apiKey = process.env.APPWRITE_API_KEY

    console.log('🔧 Categories API - Checking Appwrite configuration:', {
      projectId: projectId ? '✓' : '✗',
      apiKey: apiKey ? '✓' : '✗',
      endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
    })

    if (!projectId || projectId === 'your-project-id-here' || projectId === 'disabled' || !apiKey || apiKey === 'your-api-key-here' || apiKey === 'disabled') {
      // Return fallback data when Appwrite is not configured
      console.warn('⚠️ Appwrite not configured, returning fallback category data')
      const fallbackCategories = [
        { $id: 'women-fallback', name: 'Women', status: true, $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString() },
        { $id: 'men-fallback', name: 'Men', status: true, $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString() },
        { $id: 'scrubs-fallback', name: 'Scrubs', status: true, $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString() },
        { $id: 'uniforms-fallback', name: 'Uniforms', status: true, $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString() },
        { $id: 'medical-fallback', name: 'Medical', status: true, $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString() },
        { $id: 'formal-fallback', name: 'Formal', status: true, $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString() },
        { $id: 'prints-fallback', name: 'Prints', status: true, $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString() },
        { $id: 'footwear-fallback', name: 'Footwear', status: true, $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString() },
        { $id: 'accessories-fallback', name: 'Accessories', status: true, $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString() }
      ]
      
      // Apply search filter if provided
      let filteredCategories = fallbackCategories
      if (search) {
        filteredCategories = fallbackCategories.filter(category => 
          category.name.toLowerCase().includes(search.toLowerCase())
        )
      }
      
      // Apply status filter if provided
      if (status !== null && status !== undefined) {
        const statusBool = status === "true"
        filteredCategories = filteredCategories.filter(category => category.status === statusBool)
      }
      
      // Apply pagination
      const paginatedCategories = filteredCategories.slice(offset, offset + limit)
      
      return NextResponse.json({
        categories: paginatedCategories,
        total: filteredCategories.length,
        fallback: true
      })
    }

    // Original Appwrite logic (when properly configured)
    console.log('🔗 Attempting to connect to Appwrite for categories...')
    const { databases } = await createAdminClient()

    // Build queries
    const queries = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderAsc('name')
    ]

    // Add search query if provided
    if (search) {
      queries.push(Query.search("name", search))
    }

    // Add status filter if provided
    if (status !== null && status !== undefined) {
      queries.push(Query.equal("status", status === "true"))
    }

    console.log('📋 Fetching categories with queries:', queries)

    // Fetch categories with timeout
    const result = await Promise.race([
      databases.listDocuments(DATABASE_ID, CATEGORIES_COLLECTION_ID, queries),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
    ]) as any

    console.log('✅ Categories fetched successfully:', result.documents.length, 'categories')
    return NextResponse.json({
      categories: result.documents,
      total: result.total,
    })

  } catch (error: any) {
    console.error("❌ Error fetching categories:", {
      message: error.message || error,
      code: error.code,
      type: error.type,
      stack: error.stack
    })

    // Provide more specific error messages based on error type
    let errorMessage = "Failed to fetch categories"
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      errorMessage = "Network error - unable to connect to database"
    } else if (error.message?.includes('timeout')) {
      errorMessage = "Request timeout - database connection is slow"
    } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
      errorMessage = "Permission error - check API key configuration"
    }

    return NextResponse.json(
      { error: errorMessage, details: error.message || error },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const categoryData = await request.json()
    console.log('📝 Creating category:', categoryData)

    // Create admin client
    const { databases } = await createAdminClient()

    // Validate required fields
    const requiredFields = ['name']
    for (const field of requiredFields) {
      if (!categoryData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Set default values
    const categoryToCreate = {
      name: categoryData.name,
      status: categoryData.status !== undefined ? categoryData.status : true
    }

    console.log('💾 Saving category to database...')

    // Create the category
    const category = await databases.createDocument(
      DATABASE_ID,
      CATEGORIES_COLLECTION_ID,
      'unique()',
      categoryToCreate
    )

    console.log('✅ Category created successfully:', category.$id)
    return NextResponse.json({ category }, { status: 201 })

  } catch (error: any) {
    console.error("❌ Error creating category:", {
      message: error.message || error,
      code: error.code,
      type: error.type
    })

    let errorMessage = "Failed to create category"
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      errorMessage = "Network error - unable to connect to database"
    } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
      errorMessage = "Permission error - check API key configuration"
    }

    return NextResponse.json(
      { error: errorMessage, details: error.message || error },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")
    const updateData = await request.json()

    console.log('🔄 Updating category:', categoryId, updateData)

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      )
    }

    // Create admin client
    const { databases } = await createAdminClient()

    // Prepare update data (only include fields that are provided)
    const allowedFields = ['name', 'status']
    const filteredUpdateData: any = {}

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field]
      }
    })

    console.log('💾 Updating category in database...')

    // Update the category
    const updatedCategory = await databases.updateDocument(
      DATABASE_ID,
      CATEGORIES_COLLECTION_ID,
      categoryId,
      filteredUpdateData
    )

    console.log('✅ Category updated successfully:', updatedCategory.$id)
    return NextResponse.json({ category: updatedCategory })

  } catch (error: any) {
    console.error("❌ Error updating category:", {
      message: error.message || error,
      code: error.code,
      type: error.type
    })

    let errorMessage = "Failed to update category"
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      errorMessage = "Network error - unable to connect to database"
    } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
      errorMessage = "Permission error - check API key configuration"
    }

    return NextResponse.json(
      { error: errorMessage, details: error.message || error },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")

    console.log('🗑️ Deleting category:', categoryId)

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      )
    }

    // Create admin client
    const { databases } = await createAdminClient()

    // Delete the category
    await databases.deleteDocument(DATABASE_ID, CATEGORIES_COLLECTION_ID, categoryId)

    console.log('✅ Category deleted successfully:', categoryId)
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("❌ Error deleting category:", {
      message: error.message || error,
      code: error.code,
      type: error.type
    })

    let errorMessage = "Failed to delete category"
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      errorMessage = "Network error - unable to connect to database"
    } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
      errorMessage = "Permission error - check API key configuration"
    }

    return NextResponse.json(
      { error: errorMessage, details: error.message || error },
      { status: 500 }
    )
  }
}
