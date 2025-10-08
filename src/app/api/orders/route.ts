import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { databases, DATABASE_ID, ORDERS_COLLECTION_ID, createServerClient } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { Databases } from 'node-appwrite';

// GET /api/orders - Get user's orders
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    console.log('Fetching orders for user:', user.$id);

    // TODO: Implement orders database queries
    // This is a placeholder for the actual orders implementation
    const orders = [
      {
        id: 'order_1',
        userId: user.$id,
        status: 'pending',
        total: 59.98,
        items: [
          { productId: 'prod_1', name: 'Sample Product', quantity: 2, price: 29.99 }
        ],
        createdAt: new Date().toISOString(),
        shippingAddress: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345'
        }
      }
    ];

    return NextResponse.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
});

// POST /api/orders - Create new order (supports both authenticated and guest users)
export const POST = async (request: NextRequest) => {
  try {
    const { 
      customerId, 
      items, 
      shippingAddress, 
      billingAddress, 
      paymentMethod, 
      customerNote,
      shippingCost = 0,
      taxAmount = 0,
      discountAmount = 0
    } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    if (!billingAddress) {
      return NextResponse.json(
        { error: 'Billing address is required' },
        { status: 400 }
      );
    }

    console.log('Creating order for customer:', customerId);

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + shippingCost + taxAmount - discountAmount;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // Prepare order data for Appwrite
    const orderData = {
      orderNumber,
      customerId: customerId || 'guest',
      items: items.map(item => ({
        productId: item.productId,
        productName: `Product ${item.productId}`, // This should be fetched from product service
        productImage: '', // This should be fetched from product service
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      })),
      subtotal,
      shippingCost,
      taxAmount,
      discountAmount,
      total,
      status: 'pending',
      paymentStatus: 'pending',
      fulfillmentStatus: 'unfulfilled',
      paymentMethod,
      shippingAddress,
      billingAddress,
      customerNote: customerNote || '',
      internalNotes: [],
      timeline: [{
        status: 'pending',
        changedBy: 'system',
        changedAt: new Date().toISOString(),
        note: 'Order created'
      }]
    };

    // Create order in Appwrite database
    const serverClient = createServerClient();
    const serverDatabases = new Databases(serverClient);
    
    const order = await serverDatabases.createDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      ID.unique(),
      orderData
    );

    console.log('Order created successfully:', order.$id);

    return NextResponse.json({
      success: true,
      order: {
        id: order.$id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        ...order
      },
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
};