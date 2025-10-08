import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Only apply middleware to admin API routes
  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    // Check for admin session cookie or authorization header
    const adminSession = request.cookies.get("admin-session")
    const authHeader = request.headers.get("authorization")
    
    // For now, we'll rely on the API routes themselves to validate admin access
    // since they use the Appwrite admin client which requires proper API keys
    // This middleware can be enhanced later with additional security checks
    
    // You can add additional security checks here such as:
    // - Rate limiting
    // - IP whitelisting
    // - Additional authentication validation
    
    console.log("Admin API access attempt:", {
      path: request.nextUrl.pathname,
      hasAdminSession: !!adminSession,
      hasAuthHeader: !!authHeader,
      userAgent: request.headers.get("user-agent"),
      ip: request.ip || request.headers.get("x-forwarded-for")
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/api/admin/:path*",
    // You can add other protected routes here
  ],
}
