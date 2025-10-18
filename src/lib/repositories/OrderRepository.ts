import { Databases, ID, Query, Permission, Role } from 'appwrite';
import { DATABASE_ID, ORDERS_COLLECTION_ID } from '../appwrite';

export interface OrderData {
  $id?: string;
  orderNumber: string;
  customerId: string;
  items: string; // JSON array of order items
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  fulfillmentStatus: 'unfulfilled' | 'partial' | 'fulfilled' | 'cancelled';
  paymentMethod: string;
  shippingAddress: string; // JSON object with address details
  billingAddress: string; // JSON object with address details
  customerNote?: string;
  internalNotes?: string; // JSON array of internal notes
  timeline: string; // JSON array of status changes
  transactionId?: string;
  trackingNumber?: string;
  carrier?: string;
  shippedAt?: string;
  deliveredAt?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface CreateOrderInput {
  customer_id: string;
  items: Array<{
    productId: string;
    sku: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  billingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: 'cash_on_delivery' | 'credit_card' | 'debit_card' | 'paypal';
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  couponCode?: string;
  customerNote?: string;
}

export class OrderRepository {
  constructor(private readonly databases: Databases) {}

  /**
   * Generate a unique order code
   */
  private generateOrderCode(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${year}${month}${day}-${random}`;
  }

  /**
  /**
   * Create a new order
   */
  async createOrder(input: CreateOrderInput): Promise<OrderData> {
    try {
      console.log('🛒 Creating order for customer:', input.customer_id);

      const orderNumber = this.generateOrderCode();
      const total = input.subtotal + input.shippingCost + input.taxAmount - input.discountAmount;

      // Create initial timeline entry
      const timeline = [
        {
          timestamp: new Date().toISOString(),
          status: 'pending',
          note: 'Order created'
        }
      ];

      // Prepare order data according to Appwrite schema
      const orderData = {
        orderNumber,
        customerId: input.customer_id,
        items: JSON.stringify(input.items),
        subtotal: input.subtotal,
        shippingCost: input.shippingCost,
        taxAmount: input.taxAmount,
        discountAmount: input.discountAmount,
        total,
        status: 'pending' as const,
        paymentStatus: input.paymentMethod === 'cash_on_delivery' ? 'pending' as const : 'pending' as const,
        fulfillmentStatus: 'unfulfilled' as const,
        paymentMethod: input.paymentMethod,
        shippingAddress: JSON.stringify(input.shippingAddress),
        billingAddress: JSON.stringify(input.billingAddress),
        customerNote: input.customerNote || '',
        internalNotes: JSON.stringify([]),
        timeline: JSON.stringify(timeline)
      };

      console.log('📝 Order data prepared:', { orderNumber, total, status: 'pending' });

      // Create the order document with user-specific permissions
      const order = await this.databases.createDocument(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        ID.unique(),
        orderData,
        [
          Permission.read(Role.user(input.customer_id)),
          Permission.update(Role.user(input.customer_id)),
          Permission.delete(Role.user(input.customer_id))
        ]
      );

      console.log('✅ Order created successfully:', order.$id);

      return order as OrderData;
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw new Error(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  /**
   * Get order by ID
   */
  async getOrderById(orderId: string, userId: string): Promise<OrderData | null> {
    try {
      const order = await this.databases.getDocument(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        orderId
      );

      // Verify the order belongs to the user
      if (order.customerId !== userId) {
        throw new Error('Unauthorized access to order');
      }

      return order as OrderData;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }

  /**
   * Get all orders for a user
   */
  async getUserOrders(userId: string, limit: number = 50): Promise<OrderData[]> {
    try {
      const response = await this.databases.listDocuments(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        [
          Query.equal('customerId', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(limit)
        ]
      );

      return response.documents as OrderData[];
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderData['status'],
    userId: string
  ): Promise<OrderData | null> {
    try {
      // Verify ownership first
      const existingOrder = await this.getOrderById(orderId, userId);
      if (!existingOrder) {
        throw new Error('Order not found or unauthorized');
      }

      const updatedOrder = await this.databases.updateDocument(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        orderId,
        { status }
      );

      return updatedOrder as OrderData;
    } catch (error) {
      console.error('Error updating order status:', error);
      return null;
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: OrderData['paymentStatus'],
    userId: string
  ): Promise<OrderData | null> {
    try {
      // Verify ownership first
      const existingOrder = await this.getOrderById(orderId, userId);
      if (!existingOrder) {
        throw new Error('Order not found or unauthorized');
      }

      const updatedOrder = await this.databases.updateDocument(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        orderId,
        { paymentStatus }
      );

      return updatedOrder as OrderData;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return null;
    }
  }
}

// Factory function to create OrderRepository
export const createOrderRepository = (databases: Databases): OrderRepository => {
  return new OrderRepository(databases);
};
