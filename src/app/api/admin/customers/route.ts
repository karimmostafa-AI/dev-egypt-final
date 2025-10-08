import { NextRequest, NextResponse } from "next/server"
import { Users, Query } from "node-appwrite"
import { createAdminClient } from "@/lib/appwrite-admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Create admin client
    const { users } = await createAdminClient()

    // Build queries
    const queries = [
      Query.limit(limit),
      Query.offset(offset),
    ]

    // Add search query if provided
    if (search) {
      queries.push(Query.search("name", search))
    }

    // Fetch users
    const result = await users.list(queries)

    // Transform the data to match our interface
    const transformedUsers = result.users.map(user => ({
      $id: user.$id,
      name: user.name,
      email: user.email,
      phone: user.phone || undefined,
      emailVerification: user.emailVerification,
      phoneVerification: user.phoneVerification,
      status: user.status,
      registration: user.registration,
      labels: user.labels || [],
    }))

    return NextResponse.json({
      users: transformedUsers,
      total: result.total,
    })

  } catch (error: any) {
    console.error("Error fetching customers:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch customers" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Create admin client
    const { users } = await createAdminClient()

    // Delete the user
    await users.delete(userId)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Error deleting customer:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete customer" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, status } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Create admin client
    const { users } = await createAdminClient()

    // Update user status
    await users.updateStatus(userId, status)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Error updating customer status:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update customer status" },
      { status: 500 }
    )
  }
}
