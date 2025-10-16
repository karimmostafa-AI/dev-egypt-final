import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/appwrite';
import { Account } from 'node-appwrite';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    console.log('Processing password reset for email:', email);

    // Create server-side Appwrite client
    const serverClient = createServerClient();
    const serverAccount = new Account(serverClient);

    try {
      // Send password reset email using Appwrite
      await serverAccount.createRecovery(
        email,
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`
      );

      console.log('Password reset email sent successfully');

      return NextResponse.json({
        success: true,
        message: 'Password reset email sent successfully'
      });

    } catch (appwriteError: any) {
      console.error('Appwrite password reset error:', appwriteError);

      // Handle specific Appwrite errors
      if (appwriteError.code === 404) {
        return NextResponse.json(
          { error: 'No account found with this email address' },
          { status: 404 }
        );
      }

      if (appwriteError.code === 429) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to send password reset email. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Forgot password API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}