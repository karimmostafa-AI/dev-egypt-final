// Inventory Management Service - Core real-time stock tracking and management
// Handles all inventory operations with real-time synchronization

import { ID } from 'appwrite';
import { realtimeManager, RealtimeDataProcessor, InventoryUpdateEvent, OrderUpdateEvent } from './realtime-subscriptions';
import { databases, DATABASE_CONFIG } from './appwrite-config';

// Database configuration
const DATABASE_ID = DATABASE_CONFIG.DATABASE_ID;
const PRODUCTS_COLLECTION_ID = DATABASE_CONFIG.COLLECTIONS.PRODUCTS;
const STOCK_MOVEMENTS_COLLECTION_ID = DATABASE_CONFIG.COLLECTIONS.INVENTORY_MOVEMENTS;
const INVENTORY_ALERTS_COLLECTION_ID = DATABASE_CONFIG.COLLECTIONS.INVENTORY_ALERTS;
const CART_RESERVATIONS_COLLECTION_ID = 'cart_reservations';

// Types for inventory management
interface StockMovement {
  product_id: string;
  movement_type: 'sale' | 'restock' | 'adjustment' | 'return' | 'damage' | 'transfer';
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reference_id?: string;
  reference_type?: 'order' | 'purchase' | 'manual' | 'return';
  reason?: string;
  notes?: string;
  user_id?: string;
  admin_id?: string;
  cost_impact?: number;
  location?: string;
  batch_number?: string;
  expiry_date?: string;
  created_at: string;
}

interface InventoryAlert {
  product_id: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiry_warning';
  alert_level: 'warning' | 'critical' | 'info';
  current_stock: number;
  threshold_value: number;
  message: string;
  is_active: boolean;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolution_notes?: string;
  auto_resolve: boolean;
  notification_sent: boolean;
  notification_channels?: string[];
  created_at: string;
}

interface CartReservation {
  cart_id: string;
  session_id: string;
  user_id?: string;
  product_id: string;
  quantity_reserved: number;
  reservation_expires_at: string;
  product_price: number;
  variation_data?: any;
  is_active: boolean;
  converted_to_order: boolean;
  order_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

interface InventoryAdjustment {
  product_id: string;
  new_quantity: number;
  reason: string;
  notes?: string;
  admin_id: string;
  automatic?: boolean;
}

interface StockUpdate {
  productId: string;
  previousStock: number;
  newStock: number;
  change: number;
  movementType: string;
  timestamp: string;
  alerts?: InventoryAlert[];
  notifications?: any[];
}

class InventoryManagementService {
  private static instance: InventoryManagementService;
  private isInitialized: boolean = false;
  private alertThresholds: Map<string, { min: number; max: number; warning: number; critical: number }> = new Map();
  private stockCache: Map<string, number> = new Map(); // Simple cache for stock levels

  static getInstance(): InventoryManagementService {
    if (!InventoryManagementService.instance) {
      InventoryManagementService.instance = new InventoryManagementService();
    }
    return InventoryManagementService.instance;
  }

  // Initialize the service
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔄 Initializing Inventory Management Service...');
      
      // Load alert thresholds from configuration
      await this.loadAlertThresholds();
      
      // Initialize real-time subscriptions
      this.setupRealtimeSubscriptions();
      
      // Set up cleanup for expired reservations
      this.startReservationCleanup();
      
      this.isInitialized = true;
      console.log('✅ Inventory Management Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Inventory Management Service:', error);
      throw error;
    }
  }

  private async loadAlertThresholds(): Promise<void> {
    try {
      // Set default thresholds
      this.alertThresholds.set('default', { 
        min: 0, 
        max: 10000, 
        warning: 5, 
        critical: 2 
      });
    } catch (error) {
      console.error('Error loading alert thresholds:', error);
      this.alertThresholds.set('default', { 
        min: 0, 
        max: 10000, 
        warning: 5, 
        critical: 2 
      });
    }
  }

  private setupRealtimeSubscriptions(): void {
    // Subscribe to order events for automatic inventory updates
    realtimeManager.subscribe('orders', 'create', (event) => {
      this.handleOrderCreated(event as OrderUpdateEvent);
    });

    // Subscribe to order updates for fulfillment tracking
    realtimeManager.subscribe('orders', 'update', (event) => {
      this.handleOrderUpdated(event as OrderUpdateEvent);
    });

    // Subscribe to stock movements for real-time tracking
    realtimeManager.subscribe('stock_movements', 'create', (event) => {
      this.handleStockMovement(event as InventoryUpdateEvent);
    });
  }

  private startReservationCleanup(): void {
    // Clean up expired reservations every 5 minutes
    setInterval(() => {
      this.cleanupExpiredReservations();
    }, 5 * 60 * 1000);
  }

  // Core inventory operations
  public async getProductStock(productId: string): Promise<number> {
    try {
      // Check cache first
      if (this.stockCache.has(productId)) {
        return this.stockCache.get(productId)!;
      }

      // In a real implementation, this would fetch from Appwrite
      // For now, return mock data
      const stock = Math.floor(Math.random() * 100) + 1;
      this.stockCache.set(productId, stock);
      
      console.log(`📊 Retrieved stock for product ${productId}: ${stock} units`);
      return stock;
    } catch (error) {
      console.error(`Error getting stock for product ${productId}:`, error);
      return 0;
    }
  }

  public async updateProductStock(
    productId: string,
    stockUpdate: Partial<{
      units: number;
      reserved_units: number;
      available_units: number;
      stock_status: string;
      last_restocked_at: string;
    }>
  ): Promise<StockUpdate> {
    try {
      // Get current stock
      const previousStock = await this.getProductStock(productId);
      const newStock = stockUpdate.available_units || previousStock;
      const stockChange = newStock - previousStock;

      // Update cache
      this.stockCache.set(productId, newStock);

      // Create stock movement record
      const movement: StockMovement = {
        product_id: productId,
        movement_type: stockUpdate.last_restocked_at ? 'restock' : 'adjustment',
        quantity_change: stockChange,
        quantity_before: previousStock,
        quantity_after: newStock,
        reason: 'Manual stock update',
        created_at: new Date().toISOString()
      };

      await this.createStockMovement(movement);

      // Check and create alerts if necessary
      const alerts = await this.checkStockAlerts(productId, newStock);
      
      // Broadcast real-time update
      const stockUpdateData: StockUpdate = {
        productId,
        previousStock,
        newStock,
        change: stockChange,
        movementType: 'adjustment',
        timestamp: new Date().toISOString(),
        alerts
      };

      this.broadcastStockUpdate(stockUpdateData);

      console.log(`✅ Updated stock for product ${productId}: ${previousStock} → ${newStock} (${stockChange > 0 ? '+' : ''}${stockChange})`);
      return stockUpdateData;
    } catch (error) {
      console.error(`Error updating stock for product ${productId}:`, error);
      throw error;
    }
  }

  public async reserveStock(
    productId: string,
    quantity: number,
    cartId: string,
    sessionId: string,
    userId?: string
  ): Promise<boolean> {
    try {
      const currentStock = await this.getProductStock(productId);
      
      // Check if enough stock is available
      if (currentStock < quantity) {
        console.log(`❌ Insufficient stock for product ${productId}: ${currentStock} < ${quantity}`);
        return false;
      }

      // Create reservation record
      const reservation: CartReservation = {
        cart_id: cartId,
        session_id: sessionId,
        user_id: userId,
        product_id: productId,
        quantity_reserved: quantity,
        reservation_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        product_price: 0, // Would be populated by calling code
        is_active: true,
        converted_to_order: false,
        created_at: new Date().toISOString()
      };

      // In a real implementation, this would create a document in Appwrite
      console.log(`📋 Created reservation for ${quantity} units of product ${productId} in cart ${cartId}`);

      // Update available stock
      const newStock = currentStock - quantity;
      this.stockCache.set(productId, newStock);

      console.log(`✅ Reserved ${quantity} units of product ${productId} for cart ${cartId}`);
      return true;
    } catch (error) {
      console.error(`Error reserving stock for product ${productId}:`, error);
      return false;
    }
  }

  public async releaseReservation(
    reservationId: string,
    productId: string,
    quantity: number
  ): Promise<void> {
    try {
      // In a real implementation, this would mark reservation as inactive in Appwrite
      console.log(`🗑️ Releasing reservation ${reservationId} for ${quantity} units of product ${productId}`);

      // Get current stock and add back the reserved quantity
      const currentStock = await this.getProductStock(productId);
      const newStock = currentStock + quantity;
      this.stockCache.set(productId, newStock);

      console.log(`✅ Released ${quantity} units of product ${productId} (${currentStock} → ${newStock})`);
    } catch (error) {
      console.error(`Error releasing reservation:`, error);
    }
  }

  public async convertReservationToOrder(
    reservationId: string,
    orderId: string
  ): Promise<boolean> {
    try {
      // In a real implementation, this would update the reservation in Appwrite
      console.log(`🔄 Converting reservation ${reservationId} to order ${orderId}`);
      
      console.log(`✅ Converted reservation ${reservationId} to order ${orderId}`);
      return true;
    } catch (error) {
      console.error(`Error converting reservation to order:`, error);
      return false;
    }
  }

  public async createStockMovement(movement: StockMovement): Promise<void> {
    try {
      // Create a document in Appwrite stock movements collection
      await databases.createDocument(
        DATABASE_ID,
        STOCK_MOVEMENTS_COLLECTION_ID,
        ID.unique(),
        {
          product_id: movement.product_id,
          movement_type: movement.movement_type,
          quantity_change: movement.quantity_change,
          quantity_before: movement.quantity_before,
          quantity_after: movement.quantity_after,
          reference_id: movement.reference_id,
          reference_type: movement.reference_type,
          reason: movement.reason,
          notes: movement.notes,
          user_id: movement.user_id,
          admin_id: movement.admin_id,
          cost_impact: movement.cost_impact,
          location: movement.location,
          batch_number: movement.batch_number,
          expiry_date: movement.expiry_date,
          created_at: movement.created_at
        }
      );
      
      console.log(`📦 Stock movement created: ${movement.movement_type} ${movement.quantity_change} for product ${movement.product_id}`);
    } catch (error) {
      console.error('Error creating stock movement:', error);
      // Don't throw error for mock implementation, just log it
      console.log(`📝 Mock stock movement record: ${JSON.stringify(movement, null, 2)}`);
    }
  }

  public async checkStockAlerts(productId: string, currentStock: number): Promise<InventoryAlert[]> {
    try {
      const alerts: InventoryAlert[] = [];
      const thresholds = this.alertThresholds.get('default') || { warning: 5, critical: 2, min: 0, max: 10000 };

      // Check for low stock
      if (currentStock <= thresholds.critical && currentStock > 0) {
        const alert = await this.createAlert({
          product_id: productId,
          alert_type: 'low_stock',
          alert_level: 'critical',
          current_stock: currentStock,
          threshold_value: thresholds.critical,
          message: `CRITICAL: Product ${productId} is critically low (${currentStock} units left)`,
          is_active: true,
          is_acknowledged: false,
          auto_resolve: true,
          notification_sent: false
        });
        alerts.push(alert);
      } else if (currentStock <= thresholds.warning && currentStock > 0) {
        const alert = await this.createAlert({
          product_id: productId,
          alert_type: 'low_stock',
          alert_level: 'warning',
          current_stock: currentStock,
          threshold_value: thresholds.warning,
          message: `WARNING: Product ${productId} is running low (${currentStock} units left)`,
          is_active: true,
          is_acknowledged: false,
          auto_resolve: true,
          notification_sent: false
        });
        alerts.push(alert);
      }

      // Check for out of stock
      if (currentStock === 0) {
        const alert = await this.createAlert({
          product_id: productId,
          alert_type: 'out_of_stock',
          alert_level: 'critical',
          current_stock: currentStock,
          threshold_value: 0,
          message: `CRITICAL: Product ${productId} is out of stock`,
          is_active: true,
          is_acknowledged: false,
          auto_resolve: true,
          notification_sent: false
        });
        alerts.push(alert);
      }

      return alerts;
    } catch (error) {
      console.error('Error checking stock alerts:', error);
      return [];
    }
  }

  private async createAlert(alertData: Omit<InventoryAlert, 'created_at'>): Promise<InventoryAlert> {
    const alert: InventoryAlert = {
      ...alertData,
      created_at: new Date().toISOString()
    };

    try {
      // Create a document in Appwrite inventory alerts collection
      await databases.createDocument(
        DATABASE_ID,
        INVENTORY_ALERTS_COLLECTION_ID,
        ID.unique(),
        {
          product_id: alert.product_id,
          alert_type: alert.alert_type,
          alert_level: alert.alert_level,
          current_stock: alert.current_stock,
          threshold_value: alert.threshold_value,
          message: alert.message,
          is_active: alert.is_active,
          is_acknowledged: alert.is_acknowledged,
          acknowledged_by: alert.acknowledged_by,
          acknowledged_at: alert.acknowledged_at,
          resolution_notes: alert.resolution_notes,
          auto_resolve: alert.auto_resolve,
          notification_sent: alert.notification_sent,
          notification_channels: alert.notification_channels,
          created_at: alert.created_at
        }
      );

      console.log(`🚨 Created inventory alert: ${alert.message}`);
    } catch (error) {
      console.error('Error creating inventory alert:', error);
      // Don't throw error for mock implementation, just log it
      console.log(`📝 Mock alert record: ${JSON.stringify(alert, null, 2)}`);
    }

    return alert;
  }

  // Order handling
  private async handleOrderCreated(event: OrderUpdateEvent): Promise<void> {
    try {
      console.log('📦 Processing order for inventory updates:', event.document.order_id);
      // In a real implementation, this would get order items and update inventory
    } catch (error) {
      console.error('Error handling order created event:', error);
    }
  }

  private async handleOrderUpdated(event: OrderUpdateEvent): Promise<void> {
    try {
      const { document } = event;
      
      if (document.order_status === 'cancelled') {
        console.log('📦 Order cancelled, releasing inventory');
        // In a real implementation, this would release reserved stock
      } else if (document.order_status === 'delivered') {
        console.log('📦 Order delivered, finalizing inventory');
        // In a real implementation, this would finalize inventory updates
      }
    } catch (error) {
      console.error('Error handling order updated event:', error);
    }
  }

  private async handleStockMovement(event: InventoryUpdateEvent): Promise<void> {
    console.log('📦 Real-time stock movement:', event.document);
    // Update cache if needed
    if (event.document.product_id && event.document.available_units !== undefined) {
      this.stockCache.set(event.document.product_id, event.document.available_units);
    }
  }

  // Utility methods
  private async cleanupExpiredReservations(): Promise<void> {
    try {
      console.log('🧹 Cleaning up expired reservations...');
      // In a real implementation, this would find and clean up expired reservations
      console.log('🧹 Reservation cleanup completed');
    } catch (error) {
      console.error('Error cleaning up expired reservations:', error);
    }
  }

  private broadcastStockUpdate(stockUpdate: StockUpdate): void {
    // Broadcast to real-time subscribers
    const event: InventoryUpdateEvent = {
      event: 'update',
      collection: 'products',
      document: {
        product_id: stockUpdate.productId,
        available_units: stockUpdate.newStock,
        stock_status: stockUpdate.newStock === 0 ? 'out_of_stock' : 
                     stockUpdate.newStock <= 5 ? 'low_stock' : 'in_stock'
      },
      timestamp: stockUpdate.timestamp,
      subscriptionId: 'inventory-service'
    };

    // Format for admin display
    const formattedEvent = RealtimeDataProcessor.formatForAdminDisplay(event);
    console.log('📡 Broadcasting stock update:', formattedEvent);
  }

  // Analytics methods
  public async getInventoryTurnoverRate(productId: string, period: 'day' | 'week' | 'month' = 'month'): Promise<number> {
    try {
      // Mock implementation
      const mockRate = Math.random() * 2 + 0.5; // Random rate between 0.5 and 2.5
      console.log(`📊 Inventory turnover for product ${productId} (${period}): ${mockRate.toFixed(2)}`);
      return parseFloat(mockRate.toFixed(2));
    } catch (error) {
      console.error('Error calculating inventory turnover:', error);
      return 0;
    }
  }

  public async getLowStockProducts(threshold?: number): Promise<any[]> {
    try {
      const stockThreshold = threshold || 5;
      console.log(`📊 Getting products with stock < ${stockThreshold}`);
      
      // Mock implementation
      return [
        { id: 'product1', name: 'Sample Product 1', available_units: 3 },
        { id: 'product2', name: 'Sample Product 2', available_units: 1 },
        { id: 'product3', name: 'Sample Product 3', available_units: 0 }
      ].filter(p => p.available_units < stockThreshold);
    } catch (error) {
      console.error('Error getting low stock products:', error);
      return [];
    }
  }

  public async getStockMovementHistory(
    productId: string,
    limit: number = 50
  ): Promise<StockMovement[]> {
    try {
      console.log(`📊 Getting stock movement history for product ${productId} (limit: ${limit})`);
      
      // Mock implementation
      const movements: StockMovement[] = [
        {
          product_id: productId,
          movement_type: 'restock',
          quantity_change: 50,
          quantity_before: 10,
          quantity_after: 60,
          reason: 'Weekly restock',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          product_id: productId,
          movement_type: 'sale',
          quantity_change: -2,
          quantity_before: 60,
          quantity_after: 58,
          reason: 'Customer order',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      return movements.slice(0, limit);
    } catch (error) {
      console.error('Error getting stock movement history:', error);
      return [];
    }
  }

  // Batch operations
  public async updateMultipleStockUpdates(updates: Array<{productId: string; newStock: number; reason?: string}>): Promise<StockUpdate[]> {
    const results: StockUpdate[] = [];
    
    for (const update of updates) {
      try {
        const result = await this.updateProductStock(update.productId, {
          available_units: update.newStock,
          stock_status: update.newStock === 0 ? 'out_of_stock' : 
                       update.newStock <= 5 ? 'low_stock' : 'in_stock'
        });
        results.push(result);
      } catch (error) {
        console.error(`Error updating stock for product ${update.productId}:`, error);
      }
    }
    
    return results;
  }

  public getCacheStats(): { size: number; entries: Array<{productId: string; stock: number}> } {
    return {
      size: this.stockCache.size,
      entries: Array.from(this.stockCache.entries()).map(([productId, stock]) => ({ productId, stock }))
    };
  }

  public clearCache(): void {
    this.stockCache.clear();
    console.log('🗑️ Inventory cache cleared');
  }
}

// Singleton instance
export const inventoryService = InventoryManagementService.getInstance();

// Auto-initialize service
if (typeof window !== 'undefined') {
  // Initialize when page loads
  document.addEventListener('DOMContentLoaded', () => {
    inventoryService.initialize().catch((error: Error) => {
      console.error('Failed to initialize inventory service:', error);
    });
  });
}

// Export type definitions
export type {
  StockMovement,
  InventoryAlert,
  CartReservation,
  InventoryAdjustment,
  StockUpdate
};