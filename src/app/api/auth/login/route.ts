import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, account } from '@/lib/appwrite';
import { Account } from 'node-appwrite';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Login attempt for email:', email);

    // Create a fresh server client for this request
    const serverClient = createServerClient();
    const serverAccount = new Account(serverClient);

    // Create email session
    const session = await serverAccount.createEmailPasswordSession(email, password);
    console.log('Session created successfully on server');

    // Get user data
    const user = await serverAccount.get();
    console.log('User retrieved on server:', user.$id);

    return NextResponse.json({
      success: true,
      user,
      session
    });

  } catch (error: any) {
    console.error('Login API error:', error);
    console.error('Error code:', error?.code);
    console.error('Error type:', error?.type);

    // Handle specific Appwrite errors
    if (error.code === 401) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 400 }
    );
  }
}