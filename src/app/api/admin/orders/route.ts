import { NextRequest, NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { createAdminClient } from "@/lib/appwrite-admin"
import { withAdminAuth } from "@/lib/admin-middleware"

// Get database ID from environment
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
const ORDERS_COLLECTION_ID = 'orders'

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")
    const search = searchParams.get("search") || ""
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")
    const status = searchParams.get("status")
    const paymentStatus = searchParams.get("paymentStatus")
    const fulfillmentStatus = searchParams.get("fulfillmentStatus")

    // Create admin client
    const { databases } = await createAdminClient()

    // If orderId is provided, fetch single order
    if (orderId) {
      const order = await databases.getDocument(DATABASE_ID, ORDERS_COLLECTION_ID, orderId)
      return NextResponse.json({ order })
    }

    // Build queries
    const queries = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc('$createdAt')
    ]

    // Add search query if provided
    if (search) {
      queries.push(Query.search("order_number", search))
    }

    // Add filters
    if (status && status !== "all") {
      queries.push(Query.equal("status", status))
    }

    if (paymentStatus && paymentStatus !== "all") {
      queries.push(Query.equal("payment_status", paymentStatus))
    }

    if (fulfillmentStatus && fulfillmentStatus !== "all") {
      queries.push(Query.equal("fulfillment_status", fulfillmentStatus))
    }

    // Fetch orders
    const result = await databases.listDocuments(DATABASE_ID, ORDERS_COLLECTION_ID, queries)

    // Calculate stats
    const allOrders = await databases.listDocuments(DATABASE_ID, ORDERS_COLLECTION_ID, [Query.limit(1000)])
    const orders = allOrders.documents

    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === "pending" || o.status === "processing").length,
      shipped: orders.filter(o => o.status === "shipped").length,
      delivered: orders.filter(o => o.status === "delivered").length,
      totalRevenue: orders
        .filter(o => o.payment_status === "paid")
        .reduce((sum, o) => sum + (o.total_amount || 0), 0)
    }

    return NextResponse.json({
      orders: result.documents,
      total: result.total,
      stats,
    })

  } catch (error: any) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch orders" },
      { status: 500 }
    )
  }
})

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()

    // Create admin client
    const { databases } = await createAdminClient()

    // Validate required fields
    const requiredFields = ['customer_id', 'items', 'total', 'shipping_address']
    for (const field of requiredFields) {
      if (!orderData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Generate order number
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    // Set default values
    const orderToCreate = {
      order_number: orderNumber,
      customer_id: orderData.customer_id,
      customer_name: orderData.customer_name || '',
      customer_email: orderData.customer_email || '',
      items: JSON.stringify(orderData.items), // Store as JSON string
      total: parseFloat(orderData.total),
      subtotal: parseFloat(orderData.subtotal || orderData.total),
      tax_amount: parseFloat(orderData.tax_amount || 0),
      shipping_amount: parseFloat(orderData.shipping_amount || 0),
      discount_amount: parseFloat(orderData.discount_amount || 0),
      status: orderData.status || 'pending',
      payment_status: orderData.payment_status || 'pending',
      fulfillment_status: orderData.fulfillment_status || 'unfulfilled',
      payment_method: orderData.payment_method || '',
      shipping_address: JSON.stringify(orderData.shipping_address),
      billing_address: JSON.stringify(orderData.billing_address || orderData.shipping_address),
      notes: orderData.notes || '',
      tracking_number: orderData.tracking_number || '',
      carrier: orderData.carrier || '',
      shipped_at: orderData.shipped_at || null,
      delivered_at: orderData.delivered_at || null
    }

    // Create the order
    const order = await databases.createDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      'unique()',
      orderToCreate
    )

    return NextResponse.json({ order }, { status: 201 })

  } catch (error: any) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")
    const updateData = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      )
    }

    // Create admin client
    const { databases } = await createAdminClient()

    // Prepare update data (only include fields that are provided)
    const allowedFields = [
      'status', 'payment_status', 'fulfillment_status', 'tracking_number', 'carrier',
      'notes', 'shipped_at', 'delivered_at', 'customer_name', 'customer_email'
    ]
    const filteredUpdateData: any = {}

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'shipped_at' || field === 'delivered_at') {
          filteredUpdateData[field] = updateData[field] ? new Date(updateData[field]).toISOString() : null
        } else {
          filteredUpdateData[field] = updateData[field]
        }
      }
    })

    // Update the order
    const updatedOrder = await databases.updateDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      orderId,
      filteredUpdateData
    )

    return NextResponse.json({ order: updatedOrder })

  } catch (error: any) {
    console.error("Error updating order:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update order" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      )
    }

    // Create admin client
    const { databases } = await createAdminClient()

    // Delete the order
    await databases.deleteDocument(DATABASE_ID, ORDERS_COLLECTION_ID, orderId)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Error deleting order:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete order" },
      { status: 500 }
    )
  }
}
