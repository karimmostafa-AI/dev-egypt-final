import { NextRequest, NextResponse } from 'next/server';
import { Databases, Query } from 'node-appwrite';
import { createServerClient, DATABASE_ID, PRODUCTS_COLLECTION_ID, PRODUCT_VARIATIONS_COLLECTION_ID } from '@/lib/appwrite';

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { productId } = body || {};

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const serverClient = createServerClient();
    const db = new Databases(serverClient);

    // Load product
    const product = await db.getDocument(DATABASE_ID, PRODUCTS_COLLECTION_ID, productId);

    // Sum variation stock
    const variations = await db.listDocuments(
      DATABASE_ID,
      PRODUCT_VARIATIONS_COLLECTION_ID,
      [Query.equal('product_id', productId), Query.limit(1000)]
    );

    const totalVariationStock = (variations.documents || []).reduce((sum: number, v: any) => {
      const q = typeof v.stock_quantity === 'number' ? v.stock_quantity : parseFloat(String(v.stock_quantity || 0));
      return sum + (isNaN(q) ? 0 : q);
    }, 0);

    // Compute aggregates
    const prevAvail = parseFloat(String(product.available_units ?? product.units ?? 0)) || 0;
    const minQty = parseFloat(String(product.min_order_quantity ?? 1)) || 1;
    const newAvail = Math.max(0, totalVariationStock);
    const stockStatus = newAvail <= 0 ? 'out_of_stock' : (newAvail <= Math.max(1, minQty) ? 'low_stock' : 'in_stock');

    // Update product
    const updated = await db.updateDocument(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      productId,
      {
        available_units: String(newAvail),
        stock_status: stockStatus,
      }
    );

    return NextResponse.json({
      success: true,
      productId,
      aggregates: {
        available_units: newAvail,
        reserved_units: product.reserved_units ?? null,
        stock_status: stockStatus,
      },
      updated,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to recalculate' }, { status: 500 });
  }
};
