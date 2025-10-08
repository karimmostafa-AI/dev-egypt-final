import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/appwrite';
import { Account } from 'node-appwrite';

export async function GET() {
  try {
    console.log('=== Testing Appwrite Configuration ===');
    
    // Check environment variables
    const hasEndpoint = !!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const hasProjectId = !!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const hasApiKey = !!process.env.APPWRITE_API_KEY;
    
    console.log('Environment check:', { hasEndpoint, hasProjectId, hasApiKey });
    
    // Try to create server client
    const serverClient = createServerClient();
    console.log('Server client created successfully');
    
    // Try to create Account service
    const account = new Account(serverClient);
    console.log('Account service created successfully');
    
    return NextResponse.json({
      success: true,
      configuration: {
        endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
        projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
        hasApiKey: hasApiKey,
        apiKeyPreview: hasApiKey ? process.env.APPWRITE_API_KEY?.substring(0, 30) + '...' : 'NOT SET'
      },
      message: 'Appwrite configuration looks good!'
    });
  } catch (error: any) {
    console.error('Configuration test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: {
        message: error.message,
        code: error.code,
        type: error.type
      }
    }, { status: 500 });
  }
}
