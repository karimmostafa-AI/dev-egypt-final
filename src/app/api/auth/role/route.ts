import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/appwrite';
import { Account } from 'node-appwrite';

export async function GET(request: NextRequest) {
  try {
    // Create server client
    const serverClient = createServerClient();
    const account = new Account(serverClient);

    // Get user data including preferences
    const user = await account.get();

    // Extract role from preferences
    const role = user.prefs?.role || 'customer';

    return NextResponse.json({
      success: true,
      role,
      userId: user.$id,
      email: user.email
    });
  } catch (error: any) {
    console.error('Get role API error:', error);

    // Handle authentication errors
    if (error.code === 401) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated', role: 'guest' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get user role', role: 'guest' },
      { status: 400 }
    );
  }
}
