// Appwrite Cloud Functions for Order Management
// These functions handle server-side order business logic

import { Client, Databases, Query, ID } from 'appwrite';

// Types for function parameters and responses
export interface OrderFunctionRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body?: any;
  pathParameters?: Record<string, string>;
  queryParameters?: Record<string, string>;
}

export interface OrderFunctionResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
}

export interface CreateOrderData {
  customerId: string;
  items: Array<{
    productId: string;
    productName: string;
    productImage?: string;
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
    phone?: string;
  };
  billingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  customerNote?: string;
  paymentMethod: string;
  shippingCost?: number;
  taxAmount?: number;
  discountAmount?: number;
}

export interface OrderStatusUpdate {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  note?: string;
  trackingNumber?: string;
  carrier?: string;
}

// Initialize Appwrite client (for cloud functions)
function initializeAppwrite(): Databases {
  const client = new Client();

  // Set configuration from environment variables
  const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_PROJECT_ID || '';

  client
    .setEndpoint(endpoint)
    .setProject(projectId);

  return new Databases(client);
}

// Initialize Appwrite services
const databases = initializeAppwrite();
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '';
const ORDERS_COLLECTION_ID = 'orders';
const PRODUCTS_COLLECTION_ID = 'products';
const CUSTOMERS_COLLECTION_ID = 'customers';

/**
 * Create a new order
 */
export async function createOrder(request: OrderFunctionRequest): Promise<OrderFunctionResponse> {
  try {
    const orderData: CreateOrderData = request.body;

    // Validate required fields
    if (!orderData.customerId || !orderData.items || orderData.items.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Missing required fields: customerId, items'
        }
      };
    }

    // Validate and update product stock
    for (const item of orderData.items) {
      const product = await databases.getDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        item.productId
      );

      if (product.stockQuantity < item.quantity) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: {
            success: false,
            error: `Insufficient stock for product: ${item.productName}`
          }
        };
      }
    }

    // Calculate totals
    const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = orderData.shippingCost || 0;
    const taxAmount = orderData.taxAmount || 0;
    const discountAmount = orderData.discountAmount || 0;
    const total = subtotal + shippingCost + taxAmount - discountAmount;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create order items with totals
    const itemsWithTotals = orderData.items.map(item => ({
      ...item,
      total: item.price * item.quantity
    }));

    // Create the order
    const order = {
      orderNumber,
      customerId: orderData.customerId,
      items: itemsWithTotals,
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
        changedBy: 'customer',
        changedAt: new Date().toISOString(),
        note: 'Order created'
      }]
    };

    const createdOrder = await databases.createDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      ID.unique(),
      order
    );

    // Update product stock quantities
    for (const item of orderData.items) {
      const product = await databases.getDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        item.productId
      );

      await databases.updateDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        item.productId,
        {
          stockQuantity: product.stockQuantity - item.quantity,
          salesCount: (product.salesCount || 0) + item.quantity
        }
      );
    }

    // Update customer statistics
    try {
      const customer = await databases.getDocument(
        DATABASE_ID,
        CUSTOMERS_COLLECTION_ID,
        orderData.customerId
      );

      await databases.updateDocument(
        DATABASE_ID,
        CUSTOMERS_COLLECTION_ID,
        orderData.customerId,
        {
          ordersCount: customer.ordersCount + 1,
          totalSpent: customer.totalSpent + total,
          averageOrderValue: (customer.totalSpent + total) / (customer.ordersCount + 1),
          lastOrderDate: new Date().toISOString()
        }
      );
    } catch (error) {
      // Customer might not exist yet, that's okay for now
      console.log('Customer not found for statistics update:', orderData.customerId);
    }

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: createdOrder
      }
    };
  } catch (error) {
    console.error('Error creating order:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to create order',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Get order by ID
 */
export async function getOrder(request: OrderFunctionRequest): Promise<OrderFunctionResponse> {
  try {
    const { orderId } = request.pathParameters || {};

    if (!orderId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Order ID is required'
        }
      };
    }

    const order = await databases.getDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      orderId
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: order
      }
    };
  } catch (error) {
    console.error('Error getting order:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to get order',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(request: OrderFunctionRequest): Promise<OrderFunctionResponse> {
  try {
    const { orderId } = request.pathParameters || {};
    const { status, note, changedBy = 'admin' }: OrderStatusUpdate & { changedBy?: string } = request.body;

    if (!orderId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Order ID is required'
        }
      };
    }

    if (!status) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Status is required'
        }
      };
    }

    // Get current order
    const order = await databases.getDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      orderId
    );

    // Create new timeline entry
    const newTimelineEntry = {
      status,
      changedBy,
      changedAt: new Date().toISOString(),
      note
    };

    const updatedOrder = await databases.updateDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      orderId,
      {
        status,
        timeline: [...order.timeline, newTimelineEntry],
        // Set shipping/delivery dates based on status
        ...(status === 'shipped' && { shippedAt: new Date().toISOString() }),
        ...(status === 'delivered' && { deliveredAt: new Date().toISOString() })
      }
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: updatedOrder
      }
    };
  } catch (error) {
    console.error('Error updating order status:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to update order status',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(request: OrderFunctionRequest): Promise<OrderFunctionResponse> {
  try {
    const { orderId } = request.pathParameters || {};
    const { paymentStatus, transactionId }: { paymentStatus: string; transactionId?: string } = request.body;

    if (!orderId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Order ID is required'
        }
      };
    }

    if (!paymentStatus) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Payment status is required'
        }
      };
    }

    // Get current order
    const order = await databases.getDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      orderId
    );

    const updatedOrder = await databases.updateDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      orderId,
      {
        paymentStatus,
        ...(transactionId && { transactionId })
      }
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: updatedOrder
      }
    };
  } catch (error) {
    console.error('Error updating payment status:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to update payment status',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Update fulfillment status
 */
export async function updateFulfillmentStatus(request: OrderFunctionRequest): Promise<OrderFunctionResponse> {
  try {
    const { orderId } = request.pathParameters || {};
    const { fulfillmentStatus, trackingNumber, carrier }: {
      fulfillmentStatus: string;
      trackingNumber?: string;
      carrier?: string;
    } = request.body;

    if (!orderId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Order ID is required'
        }
      };
    }

    if (!fulfillmentStatus) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Fulfillment status is required'
        }
      };
    }

    // Get current order
    const order = await databases.getDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      orderId
    );

    const updateData: any = {
      fulfillmentStatus
    };

    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (carrier) updateData.carrier = carrier;

    // Set dates based on status
    if (fulfillmentStatus === 'shipped') {
      updateData.shippedAt = new Date().toISOString();
    } else if (fulfillmentStatus === 'delivered') {
      updateData.deliveredAt = new Date().toISOString();
    }

    const updatedOrder = await databases.updateDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      orderId,
      updateData
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: updatedOrder
      }
    };
  } catch (error) {
    console.error('Error updating fulfillment status:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to update fulfillment status',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Cancel order
 */
export async function cancelOrder(request: OrderFunctionRequest): Promise<OrderFunctionResponse> {
  try {
    const { orderId } = request.pathParameters || {};
    const { reason, cancelledBy = 'admin' } = request.body;

    if (!orderId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Order ID is required'
        }
      };
    }

    // Get current order
    const order = await databases.getDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      orderId
    );

    // Check if order can be cancelled
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Order cannot be cancelled in current status'
        }
      };
    }

    // If order was paid, you might want to process refund here
    if (order.paymentStatus === 'paid') {
      // Process refund logic would go here
      console.log('Processing refund for cancelled order:', orderId);
    }

    // Restore product stock
    for (const item of order.items) {
      const product = await databases.getDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        item.productId
      );

      await databases.updateDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        item.productId,
        {
          stockQuantity: product.stockQuantity + item.quantity,
          salesCount: Math.max(0, (product.salesCount || 0) - item.quantity)
        }
      );
    }

    // Update order status
    const newTimelineEntry = {
      status: 'cancelled',
      changedBy: cancelledBy,
      changedAt: new Date().toISOString(),
      note: reason || 'Order cancelled'
    };

    const updatedOrder = await databases.updateDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      orderId,
      {
        status: 'cancelled',
        timeline: [...order.timeline, newTimelineEntry]
      }
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: updatedOrder
      }
    };
  } catch (error) {
    console.error('Error cancelling order:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to cancel order',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Get orders with filtering and pagination
 */
export async function getOrders(request: OrderFunctionRequest): Promise<OrderFunctionResponse> {
  try {
    const {
      status,
      paymentStatus,
      fulfillmentStatus,
      customerId,
      limit = '25',
      offset = '0',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = request.queryParameters || {};

    const queries = [];

    // Add filters
    if (status) {
      queries.push(Query.equal('status', status));
    }

    if (paymentStatus) {
      queries.push(Query.equal('paymentStatus', paymentStatus));
    }

    if (fulfillmentStatus) {
      queries.push(Query.equal('fulfillmentStatus', fulfillmentStatus));
    }

    if (customerId) {
      queries.push(Query.equal('customerId', customerId));
    }

    // Add sorting
    if (sortOrder === 'desc') {
      queries.push(Query.orderDesc(sortBy));
    } else {
      queries.push(Query.orderAsc(sortBy));
    }

    // Add pagination
    queries.push(Query.limit(parseInt(limit)));
    queries.push(Query.offset(parseInt(offset)));

    const result = await databases.listDocuments(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      queries
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: {
          orders: result.documents,
          total: result.total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    };
  } catch (error) {
    console.error('Error getting orders:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to get orders',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Get order statistics
 */
export async function getOrderStats(request: OrderFunctionRequest): Promise<OrderFunctionResponse> {
  try {
    // Get all orders for statistics
    const result = await databases.listDocuments(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      [Query.limit(1000)]
    );

    const orders = result.documents;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders
        .filter((o: any) => o.paymentStatus === 'paid')
        .reduce((sum: number, o: any) => sum + o.total, 0),
      averageOrderValue: orders.length > 0
        ? orders.reduce((sum: number, o: any) => sum + o.total, 0) / orders.length
        : 0,
      pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
      processingOrders: orders.filter((o: any) => o.status === 'processing').length,
      shippedOrders: orders.filter((o: any) => o.status === 'shipped').length,
      deliveredOrders: orders.filter((o: any) => o.status === 'delivered').length,
      cancelledOrders: orders.filter((o: any) => o.status === 'cancelled').length,
      paidOrders: orders.filter((o: any) => o.paymentStatus === 'paid').length,
      unpaidOrders: orders.filter((o: any) => o.paymentStatus === 'pending').length,
      ordersToday: orders.filter((o: any) => new Date(o.$createdAt) >= today).length,
      ordersThisWeek: orders.filter((o: any) => new Date(o.$createdAt) >= weekAgo).length,
      ordersThisMonth: orders.filter((o: any) => new Date(o.$createdAt) >= monthAgo).length
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: stats
      }
    };
  } catch (error) {
    console.error('Error getting order statistics:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to get order statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Process payment for order
 */
export async function processPayment(request: OrderFunctionRequest): Promise<OrderFunctionResponse> {
  try {
    const { orderId } = request.pathParameters || {};
    const { paymentMethod, transactionId, amount } = request.body;

    if (!orderId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Order ID is required'
        }
      };
    }

    // Get order
    const order = await databases.getDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      orderId
    );

    // Verify amount matches order total
    if (amount && Math.abs(amount - order.total) > 0.01) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Payment amount does not match order total'
        }
      };
    }

    // Process payment based on payment method
    const paymentResult = { success: false, transactionId: transactionId || `txn_${Date.now()}` };

    switch (paymentMethod) {
      case 'stripe':
        // Stripe payment processing would go here
        paymentResult.success = true;
        break;
      case 'paypal':
        // PayPal payment processing would go here
        paymentResult.success = true;
        break;
      default:
        // Mock payment processing
        paymentResult.success = true;
        break;
    }

    if (!paymentResult.success) {
      return {
        statusCode: 402,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Payment failed'
        }
      };
    }

    // Update order payment status
    const updatedOrder = await databases.updateDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      orderId,
      {
        paymentStatus: 'paid',
        transactionId: paymentResult.transactionId
      }
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: {
          order: updatedOrder,
          transactionId: paymentResult.transactionId
        }
      }
    };
  } catch (error) {
    console.error('Error processing payment:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to process payment',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}