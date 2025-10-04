import { NextRequest, NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { createAdminClient } from "@/lib/appwrite-admin"

// Get database ID from environment
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
const CATEGORIES_COLLECTION_ID = 'categories'

export async function GET(request: NextRequest) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const { searchParams } = new URL(request.url)
      const limit = parseInt(searchParams.get("limit") || "100")
      const offset = parseInt(searchParams.get("offset") || "0")
      const search = searchParams.get("search") || ""
      const status = searchParams.get("status")

      // Create admin client
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
      attempt++;
      console.error(`Error fetching categories (attempt ${attempt}/${maxRetries}):`, error.message || error)
      
      if (attempt >= maxRetries) {
        // Return fallback data on final failure
        console.error("All retry attempts failed, returning fallback data")
        return NextResponse.json({
          categories: [
            { $id: 'fallback-1', name: 'Women', status: true, $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString() },
            { $id: 'fallback-2', name: 'Men', status: true, $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString() },
            { $id: 'fallback-3', name: 'Scrubs', status: true, $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString() },
            { $id: 'fallback-4', name: 'Accessories', status: true, $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString() }
          ],
          total: 4,
          fallback: true
        })
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
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
