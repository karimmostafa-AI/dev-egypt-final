import { NextRequest, NextResponse } from 'next/server';
import { createInventoryService } from '@/lib/services/InventoryService';

/**
 * GET /api/admin/inventory
 * Get low stock products and inventory overview
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threshold = parseInt(searchParams.get('threshold') || '10');
    const action = searchParams.get('action'); // 'low-stock' or 'overview'

    const inventoryService = await createInventoryService();

    if (action === 'low-stock') {
      // Get low stock products
      const lowStockProducts = await inventoryService.getLowStockProducts(threshold);

      return NextResponse.json({
        success: true,
        data: {
          lowStockProducts,
          count: lowStockProducts.length,
          threshold
        }
      });
    }

    // Default: Return overview with low stock products
    const lowStockProducts = await inventoryService.getLowStockProducts(threshold);

    // Group by status
    const outOfStock = lowStockProducts.filter(p => p.status === 'out');
    const critical = lowStockProducts.filter(p => p.status === 'critical');
    const low = lowStockProducts.filter(p => p.status === 'low');

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalLowStock: lowStockProducts.length,
          outOfStock: outOfStock.length,
          critical: critical.length,
          low: low.length
        },
        products: {
          outOfStock,
          critical,
          low
        }
      }
    });
  } catch (error) {
    console.error('Error fetching inventory data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch inventory data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/inventory
 * Adjust stock for a product or variation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId,
      variationId,
      quantityChange,
      reason,
      createdBy = 'admin'
    } = body;

    // Validation
    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    if (typeof quantityChange !== 'number') {
      return NextResponse.json(
        { error: 'quantityChange must be a number' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 }
      );
    }

    const inventoryService = await createInventoryService();

    await inventoryService.adjustStock(
      productId,
      variationId,
      quantityChange,
      reason,
      createdBy
    );

    return NextResponse.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: {
        productId,
        variationId,
        quantityChange,
        reason
      }
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    return NextResponse.json(
      {
        error: 'Failed to adjust stock',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/inventory
 * Bulk update stock for multiple variations
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates, createdBy = 'admin' } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'updates array is required' },
        { status: 400 }
      );
    }

    // Validate each update
    for (const update of updates) {
      if (!update.variationId) {
        return NextResponse.json(
          { error: 'Each update must have a variationId' },
          { status: 400 }
        );
      }
      if (typeof update.quantity !== 'number') {
        return NextResponse.json(
          { error: 'Each update must have a numeric quantity' },
          { status: 400 }
        );
      }
    }

    const inventoryService = await createInventoryService();

    const result = await inventoryService.bulkUpdateStock(updates, createdBy);

    return NextResponse.json({
      success: true,
      message: `Bulk update complete: ${result.success} succeeded, ${result.failed} failed`,
      data: result
    });
  } catch (error) {
    console.error('Error bulk updating stock:', error);
    return NextResponse.json(
      {
        error: 'Failed to bulk update stock',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
