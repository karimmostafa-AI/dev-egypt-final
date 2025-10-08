import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, databases, DATABASE_ID, USERS_COLLECTION_ID } from '@/lib/appwrite';
import { Users, ID } from 'node-appwrite';
import { createHash } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Registration Request Started ===');
    const { email, password, name } = await request.json();
    console.log('Request data:', { email, name, passwordLength: password?.length });

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Create server-side Appwrite client
    console.log('Creating server client...');
    const serverClient = createServerClient();
    console.log('Creating Users service for server-side user creation...');
    const users = new Users(serverClient);
    console.log('About to create user account...');

    // Create user account using Users service (for server-side with API key)
    const user = await users.create(
      ID.unique(),
      email,
      undefined, // phone (optional)
      password,
      name
    );

    // Set user role preference to 'customer'
    try {
      await users.updatePrefs(user.$id, { role: 'customer' });
      console.log('Set user role to customer in preferences');
    } catch (prefsError) {
      console.error('Failed to set user preferences:', prefsError);
      // Continue even if preferences fail - can be set later
    }

    // Hash the password for storage in custom users collection
    const hashedPassword = createHash('sha256').update(password).digest('hex');

    // Create document in custom users collection
    try {
      await databases.createDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        user.$id,
        {
          userId: user.$id,
          name: name,
          email: email,
          prehashedPassword: hashedPassword,
        }
      );
      console.log('Successfully created user document in custom users collection');
    } catch (collectionError: any) {
      console.error('Failed to create user document in custom collection:', collectionError);
      // Continue with registration even if custom collection creation fails
      // The user account was created successfully in Appwrite Auth
    }

    console.log('User created successfully:', user.$id);

    // Return success - the frontend will handle login
    return NextResponse.json({
      success: true,
      user: {
        $id: user.$id,
        email: user.email,
        name: user.name,
        emailVerification: user.emailVerification,
        status: user.status
      },
      message: 'Account created successfully! Logging you in...'
    });

  } catch (error: any) {
    console.error('Register API error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      type: error.type,
      response: error.response,
      stack: error.stack
    });

    // Handle specific Appwrite errors
    if (error.code === 409) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Registration failed',
        details: process.env.NODE_ENV === 'development' ? {
          code: error.code,
          type: error.type
        } : undefined
      },
      { status: 400 }
    );
  }
}