import { NextRequest, NextResponse } from 'next/server';
import { createInventoryService } from '@/lib/services/InventoryService';

/**
 * POST /api/admin/inventory/adjust
 * Manually adjust stock for a product or variation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, variationId, quantityChange, reason, createdBy } = body;

    // Validation
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (quantityChange === undefined || quantityChange === null) {
      return NextResponse.json(
        { success: false, error: 'Quantity change is required' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Reason is required for stock adjustments' },
        { status: 400 }
      );
    }

    // Create inventory service and adjust stock
    const inventoryService = await createInventoryService();
    await inventoryService.adjustStock(
      productId,
      variationId || undefined,
      quantityChange,
      reason,
      createdBy || 'admin'
    );

    return NextResponse.json({
      success: true,
      message: 'Stock adjusted successfully',
      adjustment: {
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
        success: false, 
        error: 'Failed to adjust stock',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
