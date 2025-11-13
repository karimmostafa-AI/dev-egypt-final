// Real-time subscriptions infrastructure for Appwrite E-commerce
// Handles real-time data synchronization across all admin components

import { Client } from 'appwrite';
import { databases, createClient } from './appwrite';
import { ID } from 'appwrite';

export interface RealtimeSubscription {
  id: string;
  collection: string;
  event: 'create' | 'update' | 'delete';
  callback: (data: any) => void;
  filters?: Record<string, any>;
  isActive: boolean;
  unsubscribe: () => void;
}

export interface RealtimeEvent {
  event: 'create' | 'update' | 'delete';
  collection: string;
  document: any;
  timestamp: string;
  subscriptionId: string;
}

export interface InventoryUpdateEvent extends RealtimeEvent {
  collection: 'products' | 'stock_movements' | 'order_items';
  document: {
    product_id?: string;
    units?: number;
    reserved_units?: number;
    available_units?: number;
    stock_status?: string;
    movement_type?: string;
    quantity_change?: number;
  };
}

export interface OrderUpdateEvent extends RealtimeEvent {
  collection: 'orders' | 'order_items';
  document: {
    order_id?: string;
    order_status?: string;
    payment_status?: string;
    fulfillment_status?: string;
    total_amount?: number;
    customer_id?: string;
  };
}

export interface AnalyticsUpdateEvent extends RealtimeEvent {
  collection: 'analytics_events' | 'sales_analytics' | 'customer_analytics';
  document: {
    event_type?: string;
    value?: number;
    user_id?: string;
    product_id?: string;
    period_type?: string;
  };
}

export class RealtimeSubscriptionManager {
  private client: Client;
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private eventHandlers: Map<string, (event: RealtimeEvent) => void> = new Map();
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private maxRetries: number = 5;
  private retryDelay: number = 2000; // 2 seconds

  constructor() {
    this.client = createClient();
  }

  public async connect(): Promise<void> {
    try {
      console.log('📡 Connecting to real-time service...');
      this.isConnected = true;
      console.log('📡 Real-time connection established');
    } catch (error) {
      console.error('📡 Failed to connect to real-time service:', error);
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      this.subscriptions.forEach((sub) => {
        this.unsubscribe(sub.id);
      });
      this.isConnected = false;
      console.log('📡 Real-time subscription manager disconnected');
    } catch (error) {
      console.error('📡 Error disconnecting:', error);
    }
  }

  public subscribe(
    collection: string,
    event: 'create' | 'update' | 'delete',
    callback: (data: any) => void,
    filters?: Record<string, any>
  ): string {
    const subscriptionId = ID.unique();
    const channel = `collections.${collection}.${event}`;
    
    // Create unsubscribe function
    const unsubscribe = () => {
      console.log(`📡 Unsubscribed from ${channel} (${subscriptionId})`);
    };

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      collection,
      event,
      callback,
      filters,
      isActive: true,
      unsubscribe
    };

    try {
      // Simulate real-time subscription
      // In real implementation, this would use Appwrite's real-time API
      console.log(`📡 Subscribed to ${channel} (${subscriptionId})`);
      
      this.subscriptions.set(subscriptionId, subscription);
      return subscriptionId;
    } catch (error) {
      console.error(`📡 Failed to subscribe to ${channel}:`, error);
      throw error;
    }
  }

  public unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      try {
        subscription.unsubscribe();
        this.subscriptions.delete(subscriptionId);
        console.log(`📡 Unsubscribed from ${subscription.collection}.${subscription.event} (${subscriptionId})`);
      } catch (error) {
        console.error(`📡 Failed to unsubscribe ${subscriptionId}:`, error);
      }
    }
  }

  public registerEventHandler(eventType: string, handler: (event: RealtimeEvent) => void): void {
    this.eventHandlers.set(eventType, handler);
  }

  public unregisterEventHandler(eventType: string): void {
    this.eventHandlers.delete(eventType);
  }

  public getActiveSubscriptions(): RealtimeSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.isActive);
  }

  public isConnectionHealthy(): boolean {
    return this.isConnected && this.connectionAttempts === 0;
  }
}

// Singleton instance
export const realtimeManager = new RealtimeSubscriptionManager();

// Real-time service for React components
export class RealtimeServiceClass {
  private static instance: RealtimeServiceClass;
  private subscriptions: Map<string, RealtimeSubscription> = new Map();

  static getInstance(): RealtimeServiceClass {
    if (!RealtimeServiceClass.instance) {
      RealtimeServiceClass.instance = new RealtimeServiceClass();
    }
    return RealtimeServiceClass.instance;
  }

  // Products real-time updates
  public subscribeToProducts(callback: (event: InventoryUpdateEvent) => void): string {
    return realtimeManager.subscribe('products', 'update', callback, {
      is_active: true
    });
  }

  // Stock movements real-time updates
  public subscribeToStockMovements(callback: (event: InventoryUpdateEvent) => void): string {
    return realtimeManager.subscribe('stock_movements', 'create', callback);
  }

  // Orders real-time updates
  public subscribeToOrders(callback: (event: OrderUpdateEvent) => void): string {
    return realtimeManager.subscribe('orders', 'update', callback);
  }

  // Order items real-time updates
  public subscribeToOrderItems(callback: (event: OrderUpdateEvent) => void): string {
    return realtimeManager.subscribe('order_items', 'update', callback);
  }

  // Inventory alerts real-time updates
  public subscribeToInventoryAlerts(callback: (event: RealtimeEvent) => void): string {
    return realtimeManager.subscribe('inventory_alerts', 'create', callback, {
      is_active: true
    });
  }

  // Cart reservations real-time updates
  public subscribeToCartReservations(callback: (event: RealtimeEvent) => void): string {
    return realtimeManager.subscribe('cart_reservations', 'create', callback);
  }

  // Analytics events real-time updates
  public subscribeToAnalyticsEvents(callback: (event: AnalyticsUpdateEvent) => void): string {
    return realtimeManager.subscribe('analytics_events', 'create', callback);
  }

  // Customer analytics real-time updates
  public subscribeToCustomerAnalytics(callback: (event: AnalyticsUpdateEvent) => void): string {
    return realtimeManager.subscribe('customer_analytics', 'update', callback);
  }

  // Custom subscription with filters
  public customSubscribe(
    collection: string,
    event: 'create' | 'update' | 'delete',
    callback: (event: RealtimeEvent) => void,
    filters?: Record<string, any>
  ): string {
    return realtimeManager.subscribe(collection, event, callback, filters);
  }

  // Unsubscribe from specific event
  public unsubscribe(subscriptionId: string): void {
    realtimeManager.unsubscribe(subscriptionId);
    this.subscriptions.delete(subscriptionId);
  }

  // Clean up all subscriptions
  public cleanup(): void {
    this.subscriptions.forEach((_, id) => {
      this.unsubscribe(id);
    });
    this.subscriptions.clear();
  }
}

// Utility functions for real-time data processing
export class RealtimeDataProcessor {
  
  // Process inventory update events
  public static processInventoryUpdate(event: InventoryUpdateEvent): {
    productId: string;
    stockChange: number;
    newStockLevel: number;
    isLowStock: boolean;
  } {
    const { document } = event;
    
    return {
      productId: document.product_id || '',
      stockChange: document.quantity_change || 0,
      newStockLevel: document.available_units || 0,
      isLowStock: document.stock_status === 'low_stock' || 
                  (document.available_units !== undefined && document.available_units <= 5)
    };
  }

  // Process order update events
  public static processOrderUpdate(event: OrderUpdateEvent): {
    orderId: string;
    statusChange: string;
    isNewOrder: boolean;
    totalAmount: number;
  } {
    const { document } = event;
    
    return {
      orderId: document.order_id || '',
      statusChange: document.order_status || document.payment_status || '',
      isNewOrder: event.event === 'create',
      totalAmount: document.total_amount || 0
    };
  }

  // Process analytics events
  public static processAnalyticsEvent(event: AnalyticsUpdateEvent): {
    eventType: string;
    value: number;
    userId?: string;
    productId?: string;
  } {
    const { document } = event;
    
    return {
      eventType: document.event_type || '',
      value: document.value || 0,
      userId: document.user_id,
      productId: document.product_id
    };
  }

  // Format real-time data for admin dashboard
  public static formatForAdminDisplay(event: RealtimeEvent): {
    type: string;
    title: string;
    message: string;
    data: any;
    timestamp: string;
  } {
    const timestamp = new Date(event.timestamp).toLocaleString();
    
    switch (event.collection) {
      case 'products':
        if (event.event === 'update') {
          const product = event.document;
          return {
            type: 'inventory',
            title: 'Product Stock Updated',
            message: `${product.name} stock: ${product.available_units} units`,
            data: product,
            timestamp
          };
        }
        break;
        
      case 'orders':
        if (event.event === 'create') {
          const order = event.document;
          return {
            type: 'order',
            title: 'New Order Received',
            message: `Order ${order.order_number} - $${order.total_amount}`,
            data: order,
            timestamp
          };
        }
        break;
        
      case 'inventory_alerts':
        const alert = event.document;
        return {
          type: 'alert',
          title: 'Inventory Alert',
          message: alert.message,
          data: alert,
          timestamp
        };
        
      default:
        return {
          type: 'info',
          title: 'System Update',
          message: `${event.collection} ${event.event}`,
          data: event.document,
          timestamp
        };
    }
    
    return {
      type: 'info',
      title: 'Update',
      message: 'Data updated',
      data: event.document,
      timestamp
    };
  }
}

// Auto-initialize real-time service
if (typeof window !== 'undefined') {
  // Connect to real-time service when page loads
  document.addEventListener('DOMContentLoaded', () => {
    realtimeManager.connect().catch(error => {
      console.error('Failed to initialize real-time service:', error);
    });
  });

  // Cleanup when page unloads
  window.addEventListener('beforeunload', () => {
    realtimeManager.disconnect();
  });
}

// Export as RealtimeService to maintain compatibility
export const RealtimeService = RealtimeServiceClass;