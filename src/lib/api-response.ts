import { NextResponse } from 'next/server'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Consistent API response utility for authentication and other errors
 */
export class ApiResponses {
  /**
   * Success response with data
   */
  static success<T>(data: T, message?: string): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      data,
      ...(message && { message })
    }
    return NextResponse.json(response)
  }

  /**
   * Authentication error response
   */
  static unauthorized(message = 'Authentication required'): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: 'UNAUTHORIZED',
      message
    }
    return NextResponse.json(response, { status: 401 })
  }

  /**
   * Forbidden error response (authenticated but not allowed)
   */
  static forbidden(message = 'Access denied'): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: 'FORBIDDEN',
      message
    }
    return NextResponse.json(response, { status: 403 })
  }

  /**
   * Bad request error response
   */
  static badRequest(message = 'Invalid request'): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: 'BAD_REQUEST',
      message
    }
    return NextResponse.json(response, { status: 400 })
  }

  /**
   * Not found error response
   */
  static notFound(message = 'Resource not found'): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: 'NOT_FOUND',
      message
    }
    return NextResponse.json(response, { status: 404 })
  }

  /**
   * Server error response
   */
  static serverError(message = 'Internal server error'): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: 'SERVER_ERROR',
      message
    }
    return NextResponse.json(response, { status: 500 })
  }

  /**
   * Validation error response
   */
  static validationError(errors: Record<string, string[]> | string): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: 'VALIDATION_ERROR',
      message: typeof errors === 'string' ? errors : 'Validation failed',
      ...(typeof errors === 'object' && { data: errors })
    }
    return NextResponse.json(response, { status: 422 })
  }
}

/**
 * Authentication error handler for API routes
 * Provides consistent error responses for auth failures
 */
export function handleAuthError(error: any): NextResponse {
  console.error('Authentication error:', error)

  // Handle specific Appwrite authentication errors
  if (error?.code === 401) {
    if (error?.type === 'general_unauthorized_scope') {
      return ApiResponses.unauthorized('Session expired or invalid')
    }
    return ApiResponses.unauthorized('Authentication required')
  }

  if (error?.code === 403) {
    return ApiResponses.forbidden('Access denied')
  }

  // Handle network or other errors
  if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    return ApiResponses.serverError('Network error occurred')
  }

  // Default server error
  return ApiResponses.serverError('Authentication service unavailable')
}