import { NextRequest, NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { createAdminClient } from "@/lib/appwrite-admin"

// Get database ID from environment
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
const BRANDS_COLLECTION_ID = 'brands'

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
      console.warn('Appwrite not configured, returning fallback brand data')
      const fallbackBrands = [
        { $id: 'omaima-fallback', name: 'OMAIMA', prefix: 'OMA', status: true, logo_id: null, $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString() },
        { $id: 'hleo-fallback', name: 'H LEO', prefix: 'HL', status: true, logo_id: null, $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString() },
        { $id: 'seen-fallback', name: 'SEEN', prefix: 'SEEN', status: true, logo_id: null, $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString() },
        { $id: 'dev-egypt-fallback', name: 'Dev Egypt', prefix: 'DE', status: true, logo_id: null, $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString() },
        { $id: 'cherokee-fallback', name: 'Cherokee', prefix: 'CHE', status: true, logo_id: null, $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString() },
        { $id: 'wonderwink-fallback', name: 'WonderWink', prefix: 'WW', status: true, logo_id: null, $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString() }
      ]
      
      // Apply search filter if provided
      let filteredBrands = fallbackBrands
      if (search) {
        filteredBrands = fallbackBrands.filter(brand => 
          brand.name.toLowerCase().includes(search.toLowerCase()) ||
          brand.prefix.toLowerCase().includes(search.toLowerCase())
        )
      }
      
      // Apply status filter if provided
      if (status !== null && status !== undefined) {
        const statusBool = status === "true"
        filteredBrands = filteredBrands.filter(brand => brand.status === statusBool)
      }
      
      // Apply pagination
      const paginatedBrands = filteredBrands.slice(offset, offset + limit)
      
      return NextResponse.json({
        brands: paginatedBrands,
        total: filteredBrands.length,
        fallback: true
      })
    }

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

    // Fetch brands
    const result = await databases.listDocuments(DATABASE_ID, BRANDS_COLLECTION_ID, queries)

    return NextResponse.json({
      brands: result.documents,
      total: result.total,
    })

  } catch (error: any) {
    console.error("Error fetching brands:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch brands" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const brandData = await request.json()

    // Create admin client
    const { databases } = await createAdminClient()

    // Validate required fields
    const requiredFields = ['name', 'prefix']
    for (const field of requiredFields) {
      if (!brandData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Set default values
    const brandToCreate = {
      name: brandData.name,
      logo_id: brandData.logo_id || null,
      prefix: brandData.prefix,
      status: brandData.status !== undefined ? brandData.status : true
    }

    // Create the brand
    const brand = await databases.createDocument(
      DATABASE_ID,
      BRANDS_COLLECTION_ID,
      'unique()',
      brandToCreate
    )

    return NextResponse.json({ brand }, { status: 201 })

  } catch (error: any) {
    console.error("Error creating brand:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create brand" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get("brandId")
    const updateData = await request.json()

    if (!brandId) {
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      )
    }

    // Create admin client
    const { databases } = await createAdminClient()

    // Prepare update data (only include fields that are provided)
    const allowedFields = ['name', 'logo_id', 'prefix', 'status']
    const filteredUpdateData: any = {}

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field]
      }
    })

    // Update the brand
    const updatedBrand = await databases.updateDocument(
      DATABASE_ID,
      BRANDS_COLLECTION_ID,
      brandId,
      filteredUpdateData
    )

    return NextResponse.json({ brand: updatedBrand })

  } catch (error: any) {
    console.error("Error updating brand:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update brand" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get("brandId")

    if (!brandId) {
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      )
    }

    // Create admin client
    const { databases } = await createAdminClient()

    // Delete the brand
    await databases.deleteDocument(DATABASE_ID, BRANDS_COLLECTION_ID, brandId)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Error deleting brand:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete brand" },
      { status: 500 }
    )
  }
}
