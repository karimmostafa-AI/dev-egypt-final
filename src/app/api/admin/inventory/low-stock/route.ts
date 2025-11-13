import { NextRequest, NextResponse } from 'next/server';
import { createInventoryService } from '@/lib/services/InventoryService';

/**
 * GET /api/admin/inventory/low-stock
 * Get products with low stock levels
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const threshold = parseInt(searchParams.get('threshold') || '10');

    const inventoryService = await createInventoryService();
    const lowStockProducts = await inventoryService.getLowStockProducts(threshold);

    // Group by status
    const grouped = {
      critical: lowStockProducts.filter(p => p.status === 'critical'),
      low: lowStockProducts.filter(p => p.status === 'low'),
      out: lowStockProducts.filter(p => p.status === 'out')
    };

    return NextResponse.json({
      success: true,
      products: lowStockProducts,
      grouped,
      summary: {
        total: lowStockProducts.length,
        critical: grouped.critical.length,
        low: grouped.low.length,
        out: grouped.out.length
      }
    });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch low stock products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
