import { NextRequest, NextResponse } from 'next/server';
import { withAuth, getAuthenticatedUser } from '@/lib/auth-middleware';

export const GET = withAuth(async (request: NextRequest, user) => {
  console.log('Auth check API called for user:', user.email);

  // User is already authenticated by the withAuth wrapper
  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.$id,
      email: user.email,
      name: user.name,
    }
  });
});

// Also provide a simple endpoint for optional authentication checks
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (user) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.$id,
          email: user.email,
          name: user.name,
        }
      });
    } else {
      return NextResponse.json({
        authenticated: false,
        message: 'User not authenticated'
      });
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Authentication check failed' },
      { status: 500 }
    );
  }
}