import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/appwrite-admin"
import { Client, Account, Databases, Query } from "node-appwrite"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
const ADMIN_USERS_COLLECTION_ID = 'admin_users'
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || ''

export interface AdminUser {
  $id: string
  role: 'admin' | 'manager' | 'staff'
  status: 'active' | 'inactive'
  permissions?: any[]
}

export interface AuthenticatedAdmin {
  userId: string
  adminUser: AdminUser
}

/**
 * Server-side admin authorization middleware
 * Verifies that the user is authenticated and exists in the admin_users collection
 * 
 * Usage:
 * export const GET = withAdminAuth(async (request, admin) => {
 *   // admin.adminUser contains the admin user data
 *   // admin.userId contains the user ID
 *   return NextResponse.json({ data: '...' })
 * })
 */
export async function verifyAdmin(request: NextRequest): Promise<AuthenticatedAdmin | NextResponse> {
  try {
    // Extract session cookie from request
    const projectIdForCookie = APPWRITE_PROJECT_ID.toLowerCase().replace(/-/g, '_')
    const sessionCookieName = `a_session_${projectIdForCookie}`
    const sessionCookie = request.cookies.get(sessionCookieName)?.value

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Create a client without API key to verify user session
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID)
      .setSession(sessionCookie)

    const account = new Account(client)

    // Verify the user's session
    let currentUser
    try {
      currentUser = await account.get()
    } catch (authError: any) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    if (!currentUser || !currentUser.$id) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Use admin client to check if user exists in admin_users collection
    const { databases } = await createAdminClient()

    try {
      const adminUsers = await databases.listDocuments(
        DATABASE_ID,
        ADMIN_USERS_COLLECTION_ID,
        [Query.equal('$id', currentUser.$id), Query.limit(1)]
      )

      if (adminUsers.documents.length === 0) {
        return NextResponse.json(
          { error: 'Access denied. Admin privileges required.' },
          { status: 403 }
        )
      }

      const adminUser = adminUsers.documents[0] as AdminUser

      // Check if admin account is active
      if (adminUser.status !== 'active') {
        return NextResponse.json(
          { error: 'Admin account is inactive' },
          { status: 403 }
        )
      }

      return {
        userId: currentUser.$id,
        adminUser
      }
    } catch (dbError: any) {
      console.error('Error checking admin_users collection:', dbError)
      return NextResponse.json(
        { error: 'Failed to verify admin status' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Admin verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify admin status' },
      { status: 500 }
    )
  }
}

/**
 * Higher-order function to wrap API route handlers with admin authorization
 * Usage: export const GET = withAdminAuth(async (request, admin) => { ... })
 */
export function withAdminAuth(
  handler: (request: NextRequest, admin: AuthenticatedAdmin) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await verifyAdmin(request)

    // If verification failed, return the error response
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Admin verification successful, call the handler
    try {
      return await handler(request, authResult)
    } catch (error) {
      console.error('Handler error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

