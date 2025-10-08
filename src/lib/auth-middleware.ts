import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from './appwrite'
import { Account } from 'node-appwrite'
import { ApiResponses, handleAuthError } from './api-response'

export interface AuthenticatedUser {
  $id: string
  email: string
  name: string
  emailVerification?: boolean
  phone?: string
  status?: boolean
}

/**
 * Authentication middleware utility for API routes
 * Validates user session and returns user data or throws 401 error
 */
export async function authenticateUser(request: NextRequest): Promise<AuthenticatedUser | NextResponse> {
  try {
    const client = createServerClient()
    const account = new Account(client)

    // Get user session - this validates the HttpOnly cookie automatically
    const user = await account.get()

    return {
      $id: user.$id,
      email: user.email,
      name: user.name,
      emailVerification: user.emailVerification,
      phone: user.phone,
      status: user.status,
    }
  } catch (error: any) {
    console.error('Authentication failed:', error)
    return handleAuthError(error)
  }
}

/**
 * Higher-order function to wrap API route handlers with authentication
 * Usage: export const GET = withAuth(async (request, user) => { ... })
 */
export function withAuth(handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await authenticateUser(request)

    // If authentication failed, return the error response
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Authentication successful, call the handler with user data
    try {
      return await handler(request, authResult)
    } catch (error) {
      console.error('Handler error:', error)
      return NextResponse.json(
        { error: 'Internal server error', message: 'Request processing failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Optional authentication - doesn't fail if user not authenticated
 * Returns user data or null
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const client = createServerClient()
    const account = new Account(client)
    const user = await account.get()

    return {
      $id: user.$id,
      email: user.email,
      name: user.name,
      emailVerification: user.emailVerification,
      phone: user.phone,
      status: user.status,
    }
  } catch (error) {
    // User not authenticated, return null instead of throwing
    return null
  }
}