import { Databases, ID, Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-admin';

// Constants from central Appwrite config
import { DATABASE_ID, PRODUCTS_COLLECTION_ID, PRODUCT_VARIATIONS_COLLECTION_ID, INVENTORY_TRANSACTIONS_COLLECTION_ID } from '@/lib/appwrite';

// Types
export interface CartItem {
  productId: string;
  variationId?: string;
  quantity: number;
  name?: string;
  price?: number;
  color?: string;
  size?: string;
}

export interface OrderItem {
  product_id: string;
  variation_id?: string;
  quantity: number;
  name: string;
  price: number;
}

export interface StockCheckResult {
  available: boolean;
  unavailableItems: Array<{
    productId: string;
    variationId?: string;
    requested: number;
    available: number;
    name: string;
  }>;
}

export interface InventoryTransaction {
  $id: string;
  product_id: string;
  variation_id?: string;
  order_id?: string;
  transaction_type: 'sale' | 'return' | 'adjustment' | 'restock';
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  notes?: string;
  created_by?: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface StockUpdate {
  variationId: string;
  quantity: number;
  reason?: string;
}

export interface LowStockProduct {
  $id: string;
  name: string;
  currentStock: number;
  threshold: number;
  status: 'low' | 'critical' | 'out';
}

/**
 * InventoryService - Handles all inventory-related operations
 * - Stock validation
 * - Stock reservation/deduction
 * - Transaction logging
 * - Stock adjustments
 */
export class InventoryService {
  private databases: Databases;

  constructor(databases?: Databases) {
    if (databases) {
      this.databases = databases;
    } else {
      // Create admin client if no databases instance provided
      const initDatabases = async () => {
        const { databases } = await createAdminClient();
        return databases;
      };
      // This is a workaround - in practice, always pass databases instance
      throw new Error('Databases instance required. Use createAdminClient() to get one.');
    }
  }

  /**
   * Check if sufficient stock is available for all items in cart
   */
  async checkStockAvailability(items: CartItem[]): Promise<StockCheckResult> {
    const unavailableItems: StockCheckResult['unavailableItems'] = [];

    try {
      for (const item of items) {
        let currentStock = 0;
        let productName = '';

        if (item.variationId) {
          // Check variation stock
          try {
            const variation = await this.databases.getDocument(
              DATABASE_ID,
              PRODUCT_VARIATIONS_COLLECTION_ID,
              item.variationId
            );
            currentStock = variation.stock_quantity || 0;
            
            // Get product name
            const product = await this.databases.getDocument(
              DATABASE_ID,
              PRODUCTS_COLLECTION_ID,
              variation.product_id
            );
            productName = `${product.name} (${variation.variation_value})`;
          } catch (error) {
            console.error(`Error fetching variation ${item.variationId}:`, error);
            unavailableItems.push({
              productId: item.productId,
              variationId: item.variationId,
              requested: item.quantity,
              available: 0,
              name: item.name || 'Unknown Product'
            });
            continue;
          }
        } else {
          // Check product stock (for products without variations)
          try {
            const product = await this.databases.getDocument(
              DATABASE_ID,
              PRODUCTS_COLLECTION_ID,
              item.productId
            );
            currentStock = product.units || 0;
            productName = product.name;
          } catch (error) {
            console.error(`Error fetching product ${item.productId}:`, error);
            unavailableItems.push({
              productId: item.productId,
              requested: item.quantity,
              available: 0,
              name: item.name || 'Unknown Product'
            });
            continue;
          }
        }

        // Check if requested quantity is available
        if (currentStock < item.quantity) {
          unavailableItems.push({
            productId: item.productId,
            variationId: item.variationId,
            requested: item.quantity,
            available: currentStock,
            name: productName
          });
        }
      }

      return {
        available: unavailableItems.length === 0,
        unavailableItems
      };
    } catch (error) {
      console.error('Error checking stock availability:', error);
      throw new Error('Failed to check stock availability');
    }
  }

  /**
   * Reserve stock when order is placed (reduces available quantity)
   */
  async reserveStock(orderId: string, items: OrderItem[], createdBy?: string): Promise<void> {
    console.log(`📦 Reserving stock for order ${orderId}...`);

    try {
      for (const item of items) {
        if (item.variation_id) {
          // Update variation stock
          await this.updateVariationStock(
            item.variation_id,
            -item.quantity,
            orderId,
            'sale',
            `Stock reserved for order ${orderId}`,
            createdBy
          );
        } else {
          // Update product stock (for products without variations)
          await this.updateProductStock(
            item.product_id,
            -item.quantity,
            orderId,
            'sale',
            `Stock reserved for order ${orderId}`,
            createdBy
          );
        }
      }

      console.log(`✅ Stock reserved successfully for order ${orderId}`);
    } catch (error) {
      console.error(`❌ Error reserving stock for order ${orderId}:`, error);
      throw new Error('Failed to reserve stock');
    }
  }

  /**
   * Release reserved stock if order is cancelled
   */
  async releaseStock(orderId: string, items: OrderItem[], createdBy?: string): Promise<void> {
    console.log(`🔄 Releasing stock for cancelled order ${orderId}...`);

    try {
      for (const item of items) {
        if (item.variation_id) {
          await this.updateVariationStock(
            item.variation_id,
            item.quantity, // Positive to add back
            orderId,
            'return',
            `Stock released from cancelled order ${orderId}`,
            createdBy
          );
        } else {
          await this.updateProductStock(
            item.product_id,
            item.quantity,
            orderId,
            'return',
            `Stock released from cancelled order ${orderId}`,
            createdBy
          );
        }
      }

      console.log(`✅ Stock released successfully for order ${orderId}`);
    } catch (error) {
      console.error(`❌ Error releasing stock for order ${orderId}:`, error);
      throw new Error('Failed to release stock');
    }
  }

  /**
   * Update stock for a variation
   */
  private async updateVariationStock(
    variationId: string,
    quantityChange: number,
    orderId?: string,
    transactionType: 'sale' | 'return' | 'adjustment' | 'restock' = 'adjustment',
    notes?: string,
    createdBy?: string
  ): Promise<void> {
    try {
      // Get current stock
      const variation = await this.databases.getDocument(
        DATABASE_ID,
        PRODUCT_VARIATIONS_COLLECTION_ID,
        variationId
      );

      const previousQuantity = variation.stock_quantity || 0;
      const newQuantity = Math.max(0, previousQuantity + quantityChange);

      // Update stock
      await this.databases.updateDocument(
        DATABASE_ID,
        PRODUCT_VARIATIONS_COLLECTION_ID,
        variationId,
        { stock_quantity: newQuantity }
      );

      // Log transaction
      await this.logTransaction({
        product_id: variation.product_id,
        variation_id: variationId,
        order_id: orderId,
        transaction_type: transactionType,
        quantity_change: quantityChange,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        notes,
        created_by: createdBy
      });

      // Update product-level aggregates (available/reserved/status)
      await this.updateProductAggregates(variation.product_id, quantityChange, transactionType);

      console.log(`📊 Variation ${variationId} stock updated: ${previousQuantity} → ${newQuantity}`);
    } catch (error) {
      console.error(`Error updating variation stock for ${variationId}:`, error);
      throw error;
    }
  }

  /**
   * Update stock for a product (without variations)
   */
  private async updateProductStock(
    productId: string,
    quantityChange: number,
    orderId?: string,
    transactionType: 'sale' | 'return' | 'adjustment' | 'restock' = 'adjustment',
    notes?: string,
    createdBy?: string
  ): Promise<void> {
    try {
      // Get current stock
      const product = await this.databases.getDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        productId
      );

      const previousQuantity = product.units || 0;
      const newQuantity = Math.max(0, previousQuantity + quantityChange);

      // Compute product-level aggregates
      const prevAvail = this.parseNumber(product.available_units ?? product.units);
      const prevRes = this.parseNumber(product.reserved_units);
      const newAvail = Math.max(0, prevAvail + quantityChange);
      let newRes = prevRes;
      if (transactionType === 'sale') {
        newRes = Math.max(0, prevRes + Math.abs(quantityChange));
      } else if (transactionType === 'return') {
        newRes = Math.max(0, prevRes - quantityChange);
      }
      const minQty = this.parseNumber(product.min_order_quantity ?? 1);
      const stockStatus = newAvail <= 0 ? 'out_of_stock' : (newAvail <= Math.max(1, minQty) ? 'low_stock' : 'in_stock');
      const extra: any = { stock_status: stockStatus, available_units: String(newAvail), reserved_units: String(newRes) };
      if (transactionType === 'restock') {
        extra.last_restocked_at = new Date().toISOString();
      }

      // Update stock and aggregates
      await this.databases.updateDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        productId,
        { units: newQuantity, ...extra }
      );

      // Log transaction
      await this.logTransaction({
        product_id: productId,
        order_id: orderId,
        transaction_type: transactionType,
        quantity_change: quantityChange,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        notes,
        created_by: createdBy
      });

      console.log(`📊 Product ${productId} stock updated: ${previousQuantity} → ${newQuantity}`);
    } catch (error) {
      console.error(`Error updating product stock for ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Manual stock adjustment (admin only)
   */
  async adjustStock(
    productId: string,
    variationId: string | undefined,
    quantityChange: number,
    reason: string,
    createdBy: string
  ): Promise<void> {
    console.log(`🔧 Adjusting stock: ${quantityChange} units (Reason: ${reason})`);

    try {
      if (variationId) {
        await this.updateVariationStock(
          variationId,
          quantityChange,
          undefined,
          'adjustment',
          reason,
          createdBy
        );
      } else {
        await this.updateProductStock(
          productId,
          quantityChange,
          undefined,
          'adjustment',
          reason,
          createdBy
        );
      }

      console.log(`✅ Stock adjusted successfully`);
    } catch (error) {
      console.error('Error adjusting stock:', error);
      throw new Error('Failed to adjust stock');
    }
  }

  private parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const n = parseFloat(value);
      return isNaN(n) ? 0 : n;
    }
    return 0;
  }

  private async updateProductAggregates(
    productId: string,
    quantityChange: number,
    transactionType: 'sale' | 'return' | 'adjustment' | 'restock'
  ): Promise<void> {
    try {
      const product = await this.databases.getDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        productId
      );
      const prevAvail = this.parseNumber(product.available_units ?? product.units);
      const prevRes = this.parseNumber(product.reserved_units);
      const newAvail = Math.max(0, prevAvail + quantityChange);
      let newRes = prevRes;
      if (transactionType === 'sale') {
        newRes = Math.max(0, prevRes + Math.abs(quantityChange));
      } else if (transactionType === 'return') {
        newRes = Math.max(0, prevRes - quantityChange);
      }
      const minQty = this.parseNumber(product.min_order_quantity ?? 1);
      const stockStatus = newAvail <= 0 ? 'out_of_stock' : (newAvail <= Math.max(1, minQty) ? 'low_stock' : 'in_stock');
      const updates: any = {
        available_units: String(newAvail),
        reserved_units: String(newRes),
        stock_status: stockStatus
      };
      if (transactionType === 'restock') {
        updates.last_restocked_at = new Date().toISOString();
      }
      await this.databases.updateDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        productId,
        updates
      );
    } catch (e) {
      console.warn('Failed to update product aggregates', { productId, e });
    }
  }

  /**
   * Log inventory transaction
   */
  private async logTransaction(data: {
    product_id: string;
    variation_id?: string;
    order_id?: string;
    transaction_type: 'sale' | 'return' | 'adjustment' | 'restock';
    quantity_change: number;
    previous_quantity: number;
    new_quantity: number;
    notes?: string;
    created_by?: string;
  }): Promise<void> {
    try {
      await this.databases.createDocument(
        DATABASE_ID,
        INVENTORY_TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          product_id: data.product_id,
          variation_id: data.variation_id || null,
          order_id: data.order_id || null,
          transaction_type: data.transaction_type,
          quantity_change: data.quantity_change,
          previous_quantity: data.previous_quantity,
          new_quantity: data.new_quantity,
          notes: data.notes || '',
          created_by: data.created_by || 'system'
        }
      );
    } catch (error) {
      console.error('Error logging inventory transaction:', error);
      // Don't throw - transaction logging failure shouldn't stop the operation
    }
  }

  /**
   * Get inventory history for a product
   */
  async getInventoryHistory(
    productId: string,
    variationId?: string,
    limit: number = 50
  ): Promise<InventoryTransaction[]> {
    try {
      const queries = [
        Query.equal('product_id', productId),
        Query.orderDesc('$createdAt'),
        Query.limit(limit)
      ];

      if (variationId) {
        queries.push(Query.equal('variation_id', variationId));
      }

      const response = await this.databases.listDocuments(
        DATABASE_ID,
        INVENTORY_TRANSACTIONS_COLLECTION_ID,
        queries
      );

      return response.documents as unknown as InventoryTransaction[];
    } catch (error) {
      console.error('Error fetching inventory history:', error);
      return [];
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(threshold: number = 10): Promise<LowStockProduct[]> {
    try {
      const lowStockProducts: LowStockProduct[] = [];

      // Get all active products
      const productsResponse = await this.databases.listDocuments(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        [
          Query.equal('is_active', true),
          Query.limit(1000)
        ]
      );

      for (const product of productsResponse.documents) {
        const currentStock = product.units || 0;
        const minQuantity = product.min_order_quantity || threshold;

        if (currentStock <= minQuantity) {
          let status: 'low' | 'critical' | 'out' = 'low';
          if (currentStock === 0) status = 'out';
          else if (currentStock <= minQuantity / 2) status = 'critical';

          lowStockProducts.push({
            $id: product.$id,
            name: product.name,
            currentStock,
            threshold: minQuantity,
            status
          });
        }
      }

      // Also check variations
      const variationsResponse = await this.databases.listDocuments(
        DATABASE_ID,
        PRODUCT_VARIATIONS_COLLECTION_ID,
        [
          Query.equal('is_active', true),
          Query.limit(1000)
        ]
      );

      for (const variation of variationsResponse.documents) {
        const currentStock = variation.stock_quantity || 0;
        
        if (currentStock <= threshold) {
          // Get product name
          const product = await this.databases.getDocument(
            DATABASE_ID,
            PRODUCTS_COLLECTION_ID,
            variation.product_id
          );

          let status: 'low' | 'critical' | 'out' = 'low';
          if (currentStock === 0) status = 'out';
          else if (currentStock <= threshold / 2) status = 'critical';

          lowStockProducts.push({
            $id: variation.$id,
            name: `${product.name} (${variation.variation_value})`,
            currentStock,
            threshold,
            status
          });
        }
      }

      return lowStockProducts.sort((a, b) => a.currentStock - b.currentStock);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      return [];
    }
  }

  /**
   * Bulk update stock for multiple variations
   */
  async bulkUpdateStock(
    updates: StockUpdate[],
    createdBy: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    console.log(`📦 Bulk updating stock for ${updates.length} items...`);

    for (const update of updates) {
      try {
        const variation = await this.databases.getDocument(
          DATABASE_ID,
          PRODUCT_VARIATIONS_COLLECTION_ID,
          update.variationId
        );

        await this.adjustStock(
          variation.product_id,
          update.variationId,
          update.quantity,
          update.reason || 'Bulk update',
          createdBy
        );

        success++;
      } catch (error) {
        failed++;
        const errorMsg = `Failed to update ${update.variationId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    console.log(`✅ Bulk update complete: ${success} success, ${failed} failed`);

    return { success, failed, errors };
  }
}

// Helper function to create inventory service with admin client
export async function createInventoryService(): Promise<InventoryService> {
  const { databases } = await createAdminClient();
  return new InventoryService(databases);
}
