import { NextResponse } from 'next/server';
import * as sdk from 'node-appwrite';

export async function GET() {
  const results = {
    config: {} as any,
    tests: [] as any[]
  };
  
  try {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    
    results.config = {
      endpoint,
      projectId,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
      apiKeyPrefix: apiKey?.substring(0, 20) + '...'
    };
    
    if (!endpoint || !projectId || !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing configuration',
        results
      });
    }
    
    // Create client
    const client = new sdk.Client();
    client
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);
    
    // Test 1: Health check (no auth required)
    try {
      const health = new sdk.Health(client);
      const status = await health.get();
      results.tests.push({
        name: 'Health Check',
        success: true,
        message: 'Server is reachable',
        data: { status: status.status }
      });
    } catch (e: any) {
      results.tests.push({
        name: 'Health Check',
        success: false,
        error: e.message
      });
    }
    
    // Test 2: List databases (requires databases.read or all scopes)
    try {
      const databases = new sdk.Databases(client);
      const dbList = await databases.list();
      results.tests.push({
        name: 'List Databases',
        success: true,
        message: `Found ${dbList.total} database(s)`,
        data: { total: dbList.total }
      });
    } catch (e: any) {
      results.tests.push({
        name: 'List Databases',
        success: false,
        error: e.message,
        code: e.code,
        type: e.type
      });
    }
    
    // Test 3: List users (requires users.read)
    try {
      const users = new sdk.Users(client);
      const usersList = await users.list();
      results.tests.push({
        name: 'List Users',
        success: true,
        message: `Found ${usersList.total} user(s)`,
        data: { total: usersList.total }
      });
    } catch (e: any) {
      results.tests.push({
        name: 'List Users',
        success: false,
        error: e.message,
        code: e.code,
        type: e.type
      });
    }
    
    // Test 4: Create test user (requires users.write)
    try {
      const users = new sdk.Users(client);
      const testEmail = `diagnose-${Date.now()}@test.local`;
      const testUser = await users.create(
        sdk.ID.unique(),
        testEmail,
        undefined,
        'TestPassword123!',
        'Diagnostic Test User'
      );
      results.tests.push({
        name: 'Create User',
        success: true,
        message: 'Successfully created test user',
        data: { userId: testUser.$id, email: testUser.email }
      });
      
      // Clean up - delete the test user
      try {
        await users.delete(testUser.$id);
        results.tests.push({
          name: 'Delete Test User',
          success: true,
          message: 'Test user cleaned up'
        });
      } catch (e) {
        // Ignore cleanup errors
      }
    } catch (e: any) {
      results.tests.push({
        name: 'Create User',
        success: false,
        error: e.message,
        code: e.code,
        type: e.type
      });
    }
    
    const allSuccess = results.tests.every(t => t.success);
    
    return NextResponse.json({
      success: allSuccess,
      message: allSuccess ? 'All tests passed!' : 'Some tests failed',
      results
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      results
    }, { status: 500 });
  }
}
