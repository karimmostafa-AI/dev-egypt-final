import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/appwrite';
import { Account } from 'node-appwrite';

export async function POST(request: NextRequest) {
  try {
    const { userId, secret, password } = await request.json();

    if (!userId || !secret || !password) {
      return NextResponse.json(
        { error: 'User ID, secret, and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' },
        { status: 400 }
      );
    }

    console.log('Processing password reset for user:', userId);

    // Create server-side Appwrite client
    const serverClient = createServerClient();
    const serverAccount = new Account(serverClient);

    try {
      // Confirm password reset using Appwrite
      await serverAccount.updateRecovery(userId, secret, password);

      console.log('Password reset successfully for user:', userId);

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (appwriteError: any) {
      console.error('Appwrite password reset error:', appwriteError);

      // Handle specific Appwrite errors
      if (appwriteError.code === 401) {
        return NextResponse.json(
          { error: 'Invalid or expired reset link. Please request a new password reset.' },
          { status: 401 }
        );
      }

      if (appwriteError.code === 404) {
        return NextResponse.json(
          { error: 'User not found. Please request a new password reset.' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to reset password. The reset link may have expired.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}