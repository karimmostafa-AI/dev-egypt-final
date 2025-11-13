import { NextRequest, NextResponse } from 'next/server';
import { createInventoryService, StockUpdate } from '@/lib/services/InventoryService';

/**
 * POST /api/admin/inventory/bulk-update
 * Bulk update stock for multiple variations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates, createdBy } = body as { updates: StockUpdate[]; createdBy: string };

    // Validation
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Updates array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate each update
    for (const update of updates) {
      if (!update.variationId) {
        return NextResponse.json(
          { success: false, error: 'Each update must have a variationId' },
          { status: 400 }
        );
      }
      if (update.quantity === undefined || update.quantity === null) {
        return NextResponse.json(
          { success: false, error: 'Each update must have a quantity' },
          { status: 400 }
        );
      }
    }

    // Perform bulk update
    const inventoryService = await createInventoryService();
    const result = await inventoryService.bulkUpdateStock(
      updates,
      createdBy || 'admin'
    );

    return NextResponse.json({
      success: true,
      message: 'Bulk stock update completed',
      result: {
        total: updates.length,
        success: result.success,
        failed: result.failed,
        errors: result.errors
      }
    });
  } catch (error) {
    console.error('Error in bulk stock update:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform bulk update',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
