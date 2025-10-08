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
    
    if (!projectId || projectId === 'your-project-id-here' || projectId === 'disabled' || !apiKey || apiKey === 'your-api-key-here' || apiKey === 'disabled') {
      // Return fallback data when Appwrite is not configured
      console.warn('Appwrite not configured, returning fallback category data')
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

    // Fetch categories with timeout
    const result = await Promise.race([
      databases.listDocuments(DATABASE_ID, CATEGORIES_COLLECTION_ID, queries),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
    ]) as any

    return NextResponse.json({
      categories: result.documents,
      total: result.total,
    })

  } catch (error: any) {
    console.error("Error fetching categories:", error.message || error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const categoryData = await request.json()

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

    // Create the category
    const category = await databases.createDocument(
      DATABASE_ID,
      CATEGORIES_COLLECTION_ID,
      'unique()',
      categoryToCreate
    )

    return NextResponse.json({ category }, { status: 201 })

  } catch (error: any) {
    console.error("Error creating category:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create category" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")
    const updateData = await request.json()

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

    // Update the category
    const updatedCategory = await databases.updateDocument(
      DATABASE_ID,
      CATEGORIES_COLLECTION_ID,
      categoryId,
      filteredUpdateData
    )

    return NextResponse.json({ category: updatedCategory })

  } catch (error: any) {
    console.error("Error updating category:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update category" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")

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

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Error deleting category:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete category" },
      { status: 500 }
    )
  }
}
