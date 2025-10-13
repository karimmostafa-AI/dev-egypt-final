import { NextResponse } from 'next/server';
import { createServerClient, DATABASE_ID, PRODUCTS_COLLECTION_ID } from '@/lib/appwrite';
import { Databases, Query } from 'node-appwrite';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || 'yellow-shirt';

    console.log('=== Testing Product Query ===');
    console.log('Slug:', slug);
    console.log('Database ID:', DATABASE_ID);
    console.log('Collection ID:', PRODUCTS_COLLECTION_ID);

    const serverClient = createServerClient();
    const databases = new Databases(serverClient);

    // Test product query
    const productResponse = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      [
        Query.equal('slug', slug),
        Query.equal('is_active', true),
        Query.limit(1)
      ]
    );

    console.log('Product query result:', {
      total: productResponse.total,
      documentsCount: productResponse.documents.length,
      documents: productResponse.documents.map((doc: any) => ({
        id: doc.$id,
        name: doc.name,
        slug: doc.slug,
        is_active: doc.is_active
      }))
    });

    return NextResponse.json({
      success: true,
      slug,
      found: productResponse.documents.length > 0,
      total: productResponse.total,
      products: productResponse.documents.map((doc: any) => ({
        id: doc.$id,
        name: doc.name,
        slug: doc.slug,
        is_active: doc.is_active
      }))
    });

  } catch (error: any) {
    console.error('Product test error:', error);
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