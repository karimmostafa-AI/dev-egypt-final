import { NextRequest, NextResponse } from 'next/server';
import { createInventoryService } from '@/lib/services/InventoryService';

/**
 * GET /api/admin/inventory/history
 * Get inventory transaction history for a product or variation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const variationId = searchParams.get('variationId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    const inventoryService = await createInventoryService();

    const history = await inventoryService.getInventoryHistory(
      productId,
      variationId,
      limit
    );

    // Calculate summary stats
    const summary = {
      totalTransactions: history.length,
      sales: history.filter(t => t.transaction_type === 'sale').length,
      returns: history.filter(t => t.transaction_type === 'return').length,
      adjustments: history.filter(t => t.transaction_type === 'adjustment').length,
      restocks: history.filter(t => t.transaction_type === 'restock').length,
      totalSold: history
        .filter(t => t.transaction_type === 'sale')
        .reduce((sum, t) => sum + Math.abs(t.quantity_change), 0),
      totalReturned: history
        .filter(t => t.transaction_type === 'return')
        .reduce((sum, t) => sum + t.quantity_change, 0),
      currentStock: history.length > 0 ? history[0].new_quantity : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        history,
        summary
      }
    });
  } catch (error) {
    console.error('Error fetching inventory history:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch inventory history',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
