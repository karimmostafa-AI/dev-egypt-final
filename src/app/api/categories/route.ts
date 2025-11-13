import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-admin';
import { DATABASE_ID, CATEGORIES_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'node-appwrite';

/**
 * GET /api/categories
 * Fetch all categories
 */
export async function GET(request: NextRequest) {
  try {
    const { databases } = await createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build queries
    const queries: string[] = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderAsc('name')
    ];
    
    // Fetch categories
    const response = await databases.listDocuments(
      DATABASE_ID,
      CATEGORIES_COLLECTION_ID,
      queries
    );
    
    console.log(`📂 Fetched ${response.documents.length} categories`);
    
    return NextResponse.json({
      success: true,
      categories: response.documents,
      total: response.total
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
