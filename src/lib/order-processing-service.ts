// Real-time Order Processing Service - Core order management with inventory automation
// Handles the complete order lifecycle with automatic inventory updates

import { ID } from 'appwrite';
import { realtimeManager, OrderUpdateEvent } from './realtime-subscriptions';
import { inventoryService } from './inventory-management-service';

// Database configuration
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const ORDERS_COLLECTION_ID = 'orders';
const ORDER_ITEMS_COLLECTION_ID = 'order_items';
const ANALYTICS_EVENTS_COLLECTION_ID = 'analytics_events';

// Types for order processing
interface OrderItem {
  product_id: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  variation_data?: any;
  reservation_id?: string;
  stock_before_order?: number;
  stock_after_order?: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  fulfillment_status: 'unfulfilled' | 'partial' | 'fulfilled';
  items: OrderItem[];
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  payment_method: string;
  payment_transaction_id?: string;
  shipping_address: {
    name: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
    phone?: string;
  };
  billing_address: {
    name: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
  };
  notes?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  tracking_number?: string;
  carrier?: string;
  metadata?: Record<string, any>;
}

interface OrderProcessingResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  errors: Array<{
    code: string;
    message: string;
    itemIndex?: number;
    productId?: string;
  }>;
  inventoryUpdates: Array<{
    productId: string;
    stockChange: number;
    previousStock: number;
    newStock: number;
  }>;
  warnings: string[];
}

interface InventoryReservation {
  reservationId: string;
  productId: string;
  quantity: number;
  cartId: string;
  sessionId: string;
}

class OrderProcessingService {
  private static instance: OrderProcessingService;
  private isInitialized: boolean = false;
  private activeOrders: Map<string, Order> = new Map();

  static getInstance(): OrderProcessingService {
    if (!OrderProcessingService.instance) {
      OrderProcessingService.instance = new OrderProcessingService();
    }
    return OrderProcessingService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔄 Initializing Order Processing Service...');
      
      // Set up real-time subscriptions
      this.setupRealtimeSubscriptions();
      
      // Initialize inventory service
      await inventoryService.initialize();
      
      this.isInitialized = true;
      console.log('✅ Order Processing Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Order Processing Service:', error);
      throw error;
    }
  }

  private setupRealtimeSubscriptions(): void {
    // Subscribe to order updates for status changes
    realtimeManager.subscribe('orders', 'update', (event) => {
      this.handleOrderStatusChange(event as OrderUpdateEvent);
    });

    // Subscribe to inventory updates to keep order status in sync
    realtimeManager.subscribe('products', 'update', (event) => {
      this.handleInventoryChange(event);
    });
  }

  // Main order processing methods

  /**
   * Process a complete order from cart to completion
   * This is the critical method that fixes the inventory update issue
   */
  public async processOrder(
    orderData: Omit<Order, 'id' | 'order_number' | 'status' | 'created_at' | 'updated_at'>
  ): Promise<OrderProcessingResult> {
    const result: OrderProcessingResult = {
      success: false,
      errors: [],
      inventoryUpdates: [],
      warnings: []
    };

    try {
      console.log('🛍️ Starting order processing...', {
        customer: orderData.customer_email,
        items: orderData.items.length,
        total: orderData.total_amount
      });

      // Step 1: Validate order data
      const validationResult = this.validateOrderData(orderData);
      if (!validationResult.success) {
        result.errors = validationResult.errors;
        return result;
      }

      // Step 2: Generate order ID and number
      const orderId = ID.unique();
      const orderNumber = this.generateOrderNumber(new Date().toISOString());

      // Step 3: Create order record
      const order: Order = {
        ...orderData,
        id: orderId,
        order_number: orderNumber,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Step 4: Process inventory for each item
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        
        try {
          // Check and reserve inventory
          const inventoryResult = await this.processInventoryForOrderItem(
            item,
            order,
            i
          );

          if (!inventoryResult.success) {
            result.errors.push(...inventoryResult.errors);
            if (inventoryResult.errors.some(e => e.code === 'INSUFFICIENT_STOCK')) {
              // Critical error - insufficient stock
              throw new Error(`Insufficient stock for product ${item.product_id}`);
            }
          } else {
            result.inventoryUpdates.push(...inventoryResult.inventoryUpdates);
          }

        } catch (error) {
          console.error(`Error processing inventory for item ${i}:`, error);
          result.errors.push({
            code: 'INVENTORY_PROCESSING_ERROR',
            message: `Failed to process inventory for item: ${item.product_name}`,
            itemIndex: i,
            productId: item.product_id
          });
        }
      }

      // Step 5: If there are critical errors, rollback and fail
      if (result.errors.some(e => e.code === 'INSUFFICIENT_STOCK')) {
        await this.rollbackInventoryUpdates(result.inventoryUpdates);
        console.log('❌ Order processing failed due to insufficient stock');
        return result;
      }

      // Step 6: Create order in database
      try {
        // In a real implementation, this would create the order in Appwrite
        console.log('📝 Creating order in database:', orderNumber);
        this.activeOrders.set(orderId, order);
        
        result.orderId = orderId;
        result.orderNumber = orderNumber;
        result.success = true;
        
        console.log('✅ Order processed successfully:', orderNumber);
        
        // Step 7: Broadcast real-time update
        await this.broadcastOrderUpdate({
          type: 'order_created',
          order,
          inventoryUpdates: result.inventoryUpdates
        });

        // Step 8: Log analytics event
        await this.logOrderAnalyticsEvent('order_created', order);

      } catch (error) {
        console.error('Error creating order in database:', error);
        // Rollback inventory updates on database error
        await this.rollbackInventoryUpdates(result.inventoryUpdates);
        result.errors.push({
          code: 'DATABASE_ERROR',
          message: 'Failed to create order in database'
        });
        return result;
      }

      // Step 9: Send confirmation (in real implementation)
      console.log('📧 Order confirmation would be sent here');

      return result;

    } catch (error) {
      console.error('❌ Critical error in order processing:', error);
      result.errors.push({
        code: 'CRITICAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      // Attempt to rollback any partial updates
      await this.rollbackInventoryUpdates(result.inventoryUpdates);
      
      return result;
    }
  }

  /**
   * Process inventory updates for a single order item
   */
  private async processInventoryForOrderItem(
    item: OrderItem,
    order: Order,
    itemIndex: number
  ): Promise<{
    success: boolean;
    errors: Array<{code: string; message: string; itemIndex?: number; productId?: string}>;
    inventoryUpdates: Array<{
      productId: string;
      stockChange: number;
      previousStock: number;
      newStock: number;
    }>;
  }> {
    const result = {
      success: false,
      errors: [] as Array<{code: string; message: string; itemIndex?: number; productId?: string}>,
      inventoryUpdates: [] as Array<{
        productId: string;
        stockChange: number;
        previousStock: number;
        newStock: number;
      }>
    };

    try {
      // Get current stock level
      const currentStock = await inventoryService.getProductStock(item.product_id);
      item.stock_before_order = currentStock;

      // Check if sufficient stock
      if (currentStock < item.quantity) {
        result.errors.push({
          code: 'INSUFFICIENT_STOCK',
          message: `Insufficient stock for ${item.product_name}. Available: ${currentStock}, Required: ${item.quantity}`,
          itemIndex,
          productId: item.product_id
        });
        return result;
      }

      // Calculate new stock level
      const newStock = currentStock - item.quantity;
      const stockChange = -item.quantity; // Negative for sales

      // Update inventory
      const stockUpdate = await inventoryService.updateProductStock(item.product_id, {
        available_units: newStock,
        stock_status: newStock === 0 ? 'out_of_stock' : 
                     newStock <= 5 ? 'low_stock' : 'in_stock'
      });

      item.stock_after_order = newStock;

      // Record the inventory update
      result.inventoryUpdates.push({
        productId: item.product_id,
        stockChange,
        previousStock: currentStock,
        newStock
      });

      console.log(`📦 Updated inventory for ${item.product_name}: ${currentStock} → ${newStock} (${stockChange})`);

      // Create stock movement record
      const movement = {
        product_id: item.product_id,
        movement_type: 'sale' as const,
        quantity_change: stockChange,
        quantity_before: currentStock,
        quantity_after: newStock,
        reference_id: order.id,
        reference_type: 'order' as const,
        reason: `Sale - Order ${order.order_number}`,
        notes: `Order item: ${item.product_name} x${item.quantity}`,
        created_at: new Date().toISOString()
      };

      await inventoryService.createStockMovement(movement);

      result.success = true;
      return result;

    } catch (error) {
      console.error(`Error processing inventory for item ${item.product_id}:`, error);
      result.errors.push({
        code: 'INVENTORY_UPDATE_ERROR',
        message: `Failed to update inventory for ${item.product_name}`,
        itemIndex,
        productId: item.product_id
      });
      return result;
    }
  }

  /**
   * Update order status and handle inventory accordingly
   */
  public async updateOrderStatus(
    orderId: string,
    newStatus: Order['status'],
    notes?: string
  ): Promise<{success: boolean; error?: string}> {
    try {
      const order = this.activeOrders.get(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      const oldStatus = order.status;
      order.status = newStatus;
      order.updated_at = new Date().toISOString();
      
      if (notes) {
        order.internal_notes = (order.internal_notes || '') + `\n[${new Date().toISOString()}] ${notes}`;
      }

      console.log(`📋 Order status updated: ${order.order_number} (${oldStatus} → ${newStatus})`);

      // Handle status-specific actions
      switch (newStatus) {
        case 'confirmed':
          order.processed_at = new Date().toISOString();
          break;
        case 'shipped':
          order.shipped_at = new Date().toISOString();
          break;
        case 'delivered':
          order.delivered_at = new Date().toISOString();
          order.fulfillment_status = 'fulfilled';
          break;
        case 'cancelled':
          await this.handleOrderCancellation(order);
          break;
        case 'refunded':
          await this.handleOrderRefund(order);
          break;
      }

      // Broadcast real-time update
      await this.broadcastOrderUpdate({
        type: 'order_status_changed',
        order,
        oldStatus,
        newStatus
      });

      return { success: true };

    } catch (error) {
      console.error('Error updating order status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Handle order cancellation - release inventory
   */
  private async handleOrderCancellation(order: Order): Promise<void> {
    console.log('🚫 Handling order cancellation:', order.order_number);
    
    try {
      for (const item of order.items) {
        if (item.stock_after_order !== undefined) {
          // Restore the stock
          const restoredStock = item.stock_after_order + item.quantity;
          
          await inventoryService.updateProductStock(item.product_id, {
            available_units: restoredStock,
            stock_status: restoredStock === 0 ? 'out_of_stock' : 
                         restoredStock <= 5 ? 'low_stock' : 'in_stock'
          });

          // Create restock movement
          const movement = {
            product_id: item.product_id,
            movement_type: 'return' as const,
            quantity_change: item.quantity,
            quantity_before: item.stock_after_order,
            quantity_after: restoredStock,
            reference_id: order.id,
            reference_type: 'order' as const,
            reason: `Order cancelled - ${order.order_number}`,
            notes: `Restored inventory for cancelled order`,
            created_at: new Date().toISOString()
          };

          await inventoryService.createStockMovement(movement);

          console.log(`↩️ Restored ${item.quantity} units of ${item.product_name} to inventory`);
        }
      }

      // Update fulfillment status
      order.fulfillment_status = 'unfulfilled';
      
      // Log analytics event
      await this.logOrderAnalyticsEvent('order_cancelled', order);

    } catch (error) {
      console.error('Error handling order cancellation:', error);
    }
  }

  /**
   * Handle order refund - similar to cancellation
   */
  private async handleOrderRefund(order: Order): Promise<void> {
    console.log('💰 Handling order refund:', order.order_number);
    
    try {
      // Similar to cancellation but might have different handling
      for (const item of order.items) {
        if (item.stock_after_order !== undefined) {
          const restoredStock = item.stock_after_order + item.quantity;
          
          await inventoryService.updateProductStock(item.product_id, {
            available_units: restoredStock,
            stock_status: restoredStock === 0 ? 'out_of_stock' : 
                         restoredStock <= 5 ? 'low_stock' : 'in_stock'
          });
        }
      }

      order.fulfillment_status = 'unfulfilled';
      await this.logOrderAnalyticsEvent('order_refunded', order);

    } catch (error) {
      console.error('Error handling order refund:', error);
    }
  }

  // Utility methods

  private validateOrderData(orderData: any): { success: boolean; errors: Array<{code: string; message: string}> } {
    const errors: Array<{code: string; message: string}> = [];

    if (!orderData.customer_email) {
      errors.push({ code: 'MISSING_EMAIL', message: 'Customer email is required' });
    }

    if (!orderData.items || orderData.items.length === 0) {
      errors.push({ code: 'NO_ITEMS', message: 'Order must contain at least one item' });
    }

    if (orderData.total_amount <= 0) {
      errors.push({ code: 'INVALID_TOTAL', message: 'Order total must be greater than zero' });
    }

    // Validate each item
    if (orderData.items) {
      orderData.items.forEach((item: OrderItem, index: number) => {
        if (!item.product_id) {
          errors.push({ code: 'MISSING_PRODUCT_ID', message: `Item ${index + 1}: Product ID is required` });
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push({ code: 'INVALID_QUANTITY', message: `Item ${index + 1}: Quantity must be greater than zero` });
        }
        if (!item.unit_price || item.unit_price <= 0) {
          errors.push({ code: 'INVALID_PRICE', message: `Item ${index + 1}: Unit price must be greater than zero` });
        }
      });
    }

    return { success: errors.length === 0, errors };
  }

  private generateOrderNumber(createdAt: string): string {
    const date = new Date(createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const time = String(date.getTime()).slice(-6); // Last 6 digits of timestamp
    
    return `ORD-${year}${month}${day}-${time}`;
  }

  private async rollbackInventoryUpdates(updates: Array<{
    productId: string;
    stockChange: number;
    previousStock: number;
    newStock: number;
  }>): Promise<void> {
    console.log('🔄 Rolling back inventory updates...');
    
    for (const update of updates) {
      try {
        await inventoryService.updateProductStock(update.productId, {
          available_units: update.previousStock,
          stock_status: update.previousStock === 0 ? 'out_of_stock' : 
                       update.previousStock <= 5 ? 'low_stock' : 'in_stock'
        });
        console.log(`↩️ Rolled back inventory for product ${update.productId}: ${update.newStock} → ${update.previousStock}`);
      } catch (error) {
        console.error(`Failed to rollback inventory for product ${update.productId}:`, error);
      }
    }
  }

  private async broadcastOrderUpdate(data: any): Promise<void> {
    const event: OrderUpdateEvent = {
      event: 'update',
      collection: 'orders',
      document: data.order || { order_id: data.orderId, order_status: data.newStatus },
      timestamp: new Date().toISOString(),
      subscriptionId: 'order-processing'
    };

    console.log('📡 Broadcasting order update:', data.type);
  }

  private async logOrderAnalyticsEvent(eventType: string, order: Order): Promise<void> {
    try {
      // In a real implementation, this would create an analytics event
      console.log('📊 Logging analytics event:', {
        eventType,
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        itemCount: order.items.length
      });
    } catch (error) {
      console.error('Error logging analytics event:', error);
    }
  }

  // Real-time event handlers
  private async handleOrderStatusChange(event: OrderUpdateEvent): Promise<void> {
    console.log('📋 Order status change event:', event.document);
    // Handle real-time order status changes
  }

  private async handleInventoryChange(event: any): Promise<void> {
    console.log('📦 Inventory change event:', event.document);
    // Handle inventory changes that might affect order fulfillment
  }

  // Query methods
  public getActiveOrders(): Order[] {
    return Array.from(this.activeOrders.values());
  }

  public getOrderById(orderId: string): Order | undefined {
    return this.activeOrders.get(orderId);
  }

  public getOrderByNumber(orderNumber: string): Order | undefined {
    return Array.from(this.activeOrders.values()).find(order => order.order_number === orderNumber);
  }

  public getOrdersByStatus(status: Order['status']): Order[] {
    return Array.from(this.activeOrders.values()).filter(order => order.status === status);
  }
}

// Singleton instance
export const orderProcessingService = OrderProcessingService.getInstance();

// Auto-initialize service
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    orderProcessingService.initialize().catch((error: Error) => {
      console.error('Failed to initialize order processing service:', error);
    });
  });
}

export type { Order, OrderItem, OrderProcessingResult, InventoryReservation };
export { OrderProcessingService };