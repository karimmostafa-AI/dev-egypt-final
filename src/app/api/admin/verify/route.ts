import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/appwrite-admin"
import { Client, Account, Databases, Query } from "node-appwrite"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
const ADMIN_USERS_COLLECTION_ID = 'admin_users'
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || ''

/**
 * Server-side admin verification endpoint
 * Verifies that the user is authenticated and exists in the admin_users collection
 * This is secure because it uses server-side Appwrite SDK with API key
 * and checks against the database, not user preferences
 */
export async function GET(request: NextRequest) {
  try {
    // Extract session cookie from request
    // Appwrite session cookies follow the pattern: a_session_{project_id}
    const projectIdForCookie = APPWRITE_PROJECT_ID.toLowerCase().replace(/-/g, '_')
    const sessionCookieName = `a_session_${projectIdForCookie}`
    const sessionCookie = request.cookies.get(sessionCookieName)?.value

    if (!sessionCookie) {
      return NextResponse.json(
        { 
          isAdmin: false, 
          error: 'No session found',
          authenticated: false 
        },
        { status: 401 }
      )
    }

    // Create a client without API key to verify user session from cookies
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID)
      .setSession(sessionCookie)
      // Don't set API key - we want to use the user's session cookie

    const account = new Account(client)

    // Verify the user's session and get their user ID
    let currentUser
    try {
      currentUser = await account.get()
    } catch (authError: any) {
      return NextResponse.json(
        { 
          isAdmin: false, 
          error: 'Invalid or expired session',
          authenticated: false 
        },
        { status: 401 }
      )
    }

    if (!currentUser || !currentUser.$id) {
      return NextResponse.json(
        { 
          isAdmin: false, 
          error: 'User not found',
          authenticated: false 
        },
        { status: 401 }
      )
    }

    // Use admin client to check if user exists in admin_users collection
    const { databases } = await createAdminClient()

    try {
      // Query admin_users collection for this user ID
      const adminUsers = await databases.listDocuments(
        DATABASE_ID,
        ADMIN_USERS_COLLECTION_ID,
        [Query.equal('$id', currentUser.$id), Query.limit(1)]
      )

      if (adminUsers.documents.length === 0) {
        return NextResponse.json(
          { 
            isAdmin: false, 
            authenticated: true,
            userId: currentUser.$id,
            error: 'User is not an admin' 
          },
          { status: 403 }
        )
      }

      const adminUser = adminUsers.documents[0]

      // Check if admin account is active
      if (adminUser.status !== 'active') {
        return NextResponse.json(
          { 
            isAdmin: false, 
            authenticated: true,
            userId: currentUser.$id,
            error: 'Admin account is inactive' 
          },
          { status: 403 }
        )
      }

      // User is verified as admin
      return NextResponse.json({
        isAdmin: true,
        authenticated: true,
        userId: currentUser.$id,
        adminRole: adminUser.role || 'admin',
        adminData: {
          role: adminUser.role,
          status: adminUser.status,
          permissions: adminUser.permissions || []
        }
      })

    } catch (dbError: any) {
      console.error('Error checking admin_users collection:', dbError)
      return NextResponse.json(
        { 
          isAdmin: false, 
          authenticated: true,
          userId: currentUser.$id,
          error: 'Failed to verify admin status' 
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Admin verification error:', error)
    return NextResponse.json(
      { 
        isAdmin: false, 
        error: error.message || 'Failed to verify admin status',
        authenticated: false 
      },
      { status: 500 }
    )
  }
}

