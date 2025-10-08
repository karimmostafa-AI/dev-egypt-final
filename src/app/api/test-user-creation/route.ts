import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/appwrite';
import { Account, ID, Users } from 'node-appwrite';

export async function GET() {
  try {
    console.log('=== Testing User Creation ===');
    
    // Create server client
    const serverClient = createServerClient();
    console.log('Server client created');
    
    // Try using Users service instead of Account (for server-side user creation)
    const users = new Users(serverClient);
    console.log('Users service created');
    
    // Generate test user data
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testName = 'Test User';
    
    console.log('Attempting to create user:', { email: testEmail, name: testName });
    
    // Create user using Users service (this is the correct way for server-side)
    const user = await users.create(
      ID.unique(),
      testEmail,
      undefined, // phone
      testPassword,
      testName
    );
    
    console.log('User created successfully:', user.$id);
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully!',
      user: {
        id: user.$id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error: any) {
    console.error('User creation test error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      type: error.type,
      response: error.response
    });
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: {
        code: error.code,
        type: error.type,
        response: error.response
      }
    }, { status: 500 });
  }
}
