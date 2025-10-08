import { NextResponse } from 'next/server';
import * as sdk from 'node-appwrite';

export async function GET() {
  try {
    console.log('=== Testing API Key Validity ===');
    
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    
    console.log('Configuration:', {
      endpoint,
      projectId,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length
    });
    
    if (!endpoint || !projectId || !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing configuration',
        config: { endpoint, projectId, hasApiKey: !!apiKey }
      }, { status: 500 });
    }
    
    // Create client
    const client = new sdk.Client();
    client
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);
    
    console.log('Client configured');
    
    // Try to list users (requires API key with users.read scope)
    const users = new sdk.Users(client);
    console.log('Users service created, attempting to list users...');
    
    const usersList = await users.list();
    console.log('Successfully listed users:', usersList.total);
    
    return NextResponse.json({
      success: true,
      message: 'API key is valid and working!',
      totalUsers: usersList.total,
      users: usersList.users.map(u => ({
        id: u.$id,
        email: u.email,
        name: u.name
      }))
    });
  } catch (error: any) {
    console.error('API key test error:', error);
    console.error('Full error details:', JSON.stringify({
      message: error.message,
      code: error.code,
      type: error.type,
      response: error.response
    }, null, 2));
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: {
        code: error.code,
        type: error.type,
        message: error.message,
        response: error.response
      }
    }, { status: 500 });
  }
}
