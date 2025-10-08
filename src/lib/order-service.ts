// Order Service
// Specialized service for order-related operations

import { orderService } from './appwrite-service';
import { Query } from 'appwrite';
import type { Order, OrderItem, Address } from '../types/admin';

export interface OrderFilters {
  search?: string;
  status?: Order['status'][];
  paymentStatus?: Order['paymentStatus'][];
  fulfillmentStatus?: Order['fulfillmentStatus'][];
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  minTotal?: number;
  maxTotal?: number;
}

export interface OrderListOptions {
  filters?: OrderFilters;
  sortBy?: 'createdAt' | 'total' | 'orderNumber';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
}

export interface CreateOrderData {
  customerId: string;
  items: Omit<OrderItem, 'productName' | 'productImage'>[];
  shippingAddress: Address;
  billingAddress: Address;
  customerNote?: string;
  paymentMethod: string;
  shippingCost?: number;
  taxAmount?: number;
  discountAmount?: number;
}

export class OrderServiceClass {
  // Get orders with advanced filtering and sorting
  async getOrders(options: OrderListOptions = {}) {
    try {
      const queries: string[] = [];

      // Apply filters
      if (options.filters) {
        const { filters } = options;

        if (filters.search) {
          queries.push(Query.search('orderNumber', filters.search));
        }

        if (filters.status && filters.status.length > 0) {
          queries.push(Query.equal('status', filters.status[0]));
        }

        if (filters.paymentStatus && filters.paymentStatus.length > 0) {
          queries.push(Query.equal('paymentStatus', filters.paymentStatus[0]));
        }

        if (filters.fulfillmentStatus && filters.fulfillmentStatus.length > 0) {
          queries.push(Query.equal('fulfillmentStatus', filters.fulfillmentStatus[0]));
        }

        if (filters.dateFrom) {
          queries.push(Query.greaterThanEqual('$createdAt', filters.dateFrom));
        }

        if (filters.dateTo) {
          queries.push(Query.lessThanEqual('$createdAt', filters.dateTo));
        }

        if (filters.customerId) {
          queries.push(Query.equal('customerId', filters.customerId));
        }

        if (filters.minTotal !== undefined) {
          queries.push(Query.greaterThanEqual('total', filters.minTotal));
        }

        if (filters.maxTotal !== undefined) {
          queries.push(Query.lessThanEqual('total', filters.maxTotal));
        }
      }

      // Apply sorting
      if (options.sortBy) {
        const order = options.sortOrder === 'desc' ? 'DESC' : 'ASC';
        queries.push(Query.orderDesc(options.sortBy));
      } else {
        // Default sort by creation date, newest first
        queries.push(Query.orderDesc('$createdAt'));
      }

      // Apply pagination
      if (options.limit) {
        queries.push(Query.limit(options.limit));
      }
      if (options.offset) {
        queries.push(Query.offset(options.offset));
      }

      return await orderService.list<Order>({
        queries,
        limit: options.limit,
        offset: options.offset
      });
    } catch (error) {
      console.error('Error getting orders:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get orders'
      };
    }
  }

  // Get a single order by ID
  async getOrder(orderId: string) {
    return await orderService.get<Order>(orderId);
  }

  // Create a new order
  async createOrder(orderData: CreateOrderData) {
    try {
      // Calculate totals
      const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shippingCost = orderData.shippingCost || 0;
      const taxAmount = orderData.taxAmount || 0;
      const discountAmount = orderData.discountAmount || 0;
      const total = subtotal + shippingCost + taxAmount - discountAmount;

      // Generate order number (you might want to use a more sophisticated numbering system)
      const orderNumber = `ORD-${Date.now()}`;

      // Create order items with product details (you'd fetch these from the product service)
      const itemsWithDetails: OrderItem[] = orderData.items.map(item => ({
        ...item,
        productName: `Product ${item.productId}`, // This should be fetched from product service
        productImage: '', // This should be fetched from product service
        total: item.price * item.quantity
      }));

      const order: Omit<Order, '$id' | '$createdAt' | '$updatedAt'> = {
        orderNumber,
        customerId: orderData.customerId,
        items: itemsWithDetails,
        subtotal,
        shippingCost,
        taxAmount,
        discountAmount,
        total,
        status: 'pending',
        paymentStatus: 'pending',
        fulfillmentStatus: 'unfulfilled',
        paymentMethod: orderData.paymentMethod,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        customerNote: orderData.customerNote || '',
        internalNotes: [],
        timeline: [{
          status: 'pending',
          changedBy: 'system',
          changedAt: new Date().toISOString(),
          note: 'Order created'
        }]
      };

      return await orderService.create<Order>(order);
    } catch (error) {
      console.error('Error creating order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order'
      };
    }
  }

  // Update order status
  async updateOrderStatus(
    orderId: string,
    status: Order['status'],
    note?: string,
    changedBy: string = 'admin'
  ) {
    try {
      const orderResponse = await orderService.get<Order>(orderId);

      if (!orderResponse.success || !orderResponse.data) {
        return {
          success: false,
          error: 'Order not found'
        };
      }

      const order = orderResponse.data;
      const newTimeline = [...order.timeline, {
        status,
        changedBy,
        changedAt: new Date().toISOString(),
        note
      }];

      return await orderService.update<Order>(orderId, {
        status,
        timeline: newTimeline,
        // Update timestamp
        $updatedAt: new Date().toISOString()
      } as any);
    } catch (error) {
      console.error('Error updating order status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update order status'
      };
    }
  }

  // Update payment status
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: Order['paymentStatus'],
    transactionId?: string
  ) {
    return await orderService.update<Order>(orderId, {
      paymentStatus,
      transactionId,
      // Update timestamp
      $updatedAt: new Date().toISOString()
    } as any);
  }

  // Update fulfillment status
  async updateFulfillmentStatus(
    orderId: string,
    fulfillmentStatus: Order['fulfillmentStatus'],
    trackingNumber?: string,
    carrier?: string
  ) {
    const updateData: any = {
      fulfillmentStatus,
      // Update timestamp
      $updatedAt: new Date().toISOString()
    };

    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (carrier) updateData.carrier = carrier;

    // Set shipping dates based on status
    if (fulfillmentStatus === 'fulfilled') {
      updateData.deliveredAt = new Date().toISOString();
    }

    return await orderService.update<Order>(orderId, updateData);
  }

  // Get order statistics
  async getOrderStats(): Promise<{ success: boolean; data?: OrderStats; error?: string }> {
    try {
      // Get all orders for statistics calculation
      const allOrdersResponse = await orderService.list<Order>({
        limit: 1000 // Get all orders (adjust based on your needs)
      });

      if (!allOrdersResponse.success || !allOrdersResponse.data) {
        return {
          success: false,
          error: 'Failed to fetch orders for statistics'
        };
      }

      const orders = allOrdersResponse.data.documents;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const stats: OrderStats = {
        totalOrders: orders.length,
        totalRevenue: orders
          .filter(o => o.paymentStatus === 'paid')
          .reduce((sum, o) => sum + o.total, 0),
        averageOrderValue: orders.length > 0
          ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length
          : 0,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        processingOrders: orders.filter(o => o.status === 'processing').length,
        shippedOrders: orders.filter(o => o.status === 'shipped').length,
        deliveredOrders: orders.filter(o => o.status === 'delivered').length,
        cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
        paidOrders: orders.filter(o => o.paymentStatus === 'paid').length,
        unpaidOrders: orders.filter(o => o.paymentStatus === 'pending').length,
        ordersToday: orders.filter(o => new Date(o.$createdAt) >= today).length,
        ordersThisWeek: orders.filter(o => new Date(o.$createdAt) >= weekAgo).length,
        ordersThisMonth: orders.filter(o => new Date(o.$createdAt) >= monthAgo).length
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error getting order statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get order statistics'
      };
    }
  }

  // Get orders by customer
  async getOrdersByCustomer(customerId: string, options: { limit?: number; offset?: number } = {}) {
    return await orderService.list<Order>({
      queries: [Query.equal('customerId', customerId)],
      limit: options.limit,
      offset: options.offset
    });
  }

  // Get recent orders
  async getRecentOrders(limit: number = 10) {
    return await orderService.list<Order>({
      queries: [Query.orderDesc('$createdAt'), Query.limit(limit)]
    });
  }

  // Cancel order
  async cancelOrder(orderId: string, reason?: string, cancelledBy: string = 'admin') {
    return await this.updateOrderStatus(orderId, 'cancelled', reason, cancelledBy);
  }

  // Refund order
  async refundOrder(orderId: string, reason?: string, refundedBy: string = 'admin') {
    try {
      // First update order status to refunded
      const statusResult = await this.updateOrderStatus(orderId, 'refunded', reason, refundedBy);

      if (!statusResult.success) {
        return statusResult;
      }

      // Update payment status to refunded
      return await this.updatePaymentStatus(orderId, 'refunded');
    } catch (error) {
      console.error('Error refunding order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refund order'
      };
    }
  }

  // Add internal note to order
  async addInternalNote(orderId: string, note: string, addedBy: string = 'admin') {
    try {
      const orderResponse = await orderService.get<Order>(orderId);

      if (!orderResponse.success || !orderResponse.data) {
        return {
          success: false,
          error: 'Order not found'
        };
      }

      const order = orderResponse.data;
      const newNote = {
        $id: `note_${Date.now()}`,
        note,
        userId: addedBy,
        userName: addedBy,
        createdAt: new Date().toISOString()
      };

      const updatedNotes = [...order.internalNotes, newNote];

      return await orderService.update<Order>(orderId, {
        internalNotes: updatedNotes,
        // Update timestamp
        $updatedAt: new Date().toISOString()
      } as any);
    } catch (error) {
      console.error('Error adding internal note:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add internal note'
      };
    }
  }
}

// Export singleton instance
export const orderServiceFunctions = new OrderServiceClass();