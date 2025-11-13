import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-admin';
import { DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'node-appwrite';

// Brands collection ID
const BRANDS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_BRANDS_COLLECTION_ID || 'brands';

/**
 * GET /api/brands
 * Fetch all brands
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
    
    // Fetch brands
    const response = await databases.listDocuments(
      DATABASE_ID,
      BRANDS_COLLECTION_ID,
      queries
    );
    
    console.log(`🏷️ Fetched ${response.documents.length} brands`);
    
    return NextResponse.json({
      success: true,
      brands: response.documents,
      total: response.total
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch brands',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
