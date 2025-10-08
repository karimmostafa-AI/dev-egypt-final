import { NextRequest, NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { createAdminClient } from "@/lib/appwrite-admin"

// Get database ID from environment
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
const PRODUCTS_COLLECTION_ID = 'products'
const ORDERS_COLLECTION_ID = 'orders'
const CATEGORIES_COLLECTION_ID = 'categories'

export async function GET(request: NextRequest) {
  try {
    // Create admin client
    const { databases, users } = await createAdminClient()

    // Get current date and last month for comparison
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Fetch all data in parallel for better performance
    const [
      ordersResult,
      productsResult,
      usersResult,
      lastMonthOrdersResult
    ] = await Promise.all([
      // Current orders
      databases.listDocuments(DATABASE_ID, ORDERS_COLLECTION_ID, [
        Query.limit(1000),
        Query.orderDesc('$createdAt')
      ]).catch(() => ({ documents: [], total: 0 })),
      
      // Products
      databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION_ID, [
        Query.limit(1000)
      ]).catch(() => ({ documents: [], total: 0 })),
      
      // Users (customers)
      users.list([Query.limit(1000)]).catch(() => ({ users: [], total: 0 })),
      
      // Last month orders for comparison
      databases.listDocuments(DATABASE_ID, ORDERS_COLLECTION_ID, [
        Query.limit(1000),
        Query.greaterThanEqual('$createdAt', lastMonth.toISOString()),
        Query.lessThan('$createdAt', currentMonth.toISOString())
      ]).catch(() => ({ documents: [], total: 0 }))
    ])

    const orders = ordersResult.documents || []
    const products = productsResult.documents || []
    const customers = usersResult.users || []
    const lastMonthOrders = lastMonthOrdersResult.documents || []

    // Calculate current month orders
    const currentMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.$createdAt)
      return orderDate >= currentMonth
    })

    // Calculate total revenue
    const totalRevenue = orders
      .filter(order => order.payment_status === 'paid')
      .reduce((sum, order) => sum + (order.total || 0), 0)

    // Calculate last month revenue
    const lastMonthRevenue = lastMonthOrders
      .filter(order => order.payment_status === 'paid')
      .reduce((sum, order) => sum + (order.total || 0), 0)

    // Calculate current month revenue
    const currentMonthRevenue = currentMonthOrders
      .filter(order => order.payment_status === 'paid')
      .reduce((sum, order) => sum + (order.total || 0), 0)

    // Calculate average order value
    const paidOrders = orders.filter(order => order.payment_status === 'paid')
    const averageOrderValue = paidOrders.length > 0 
      ? totalRevenue / paidOrders.length 
      : 0

    const lastMonthPaidOrders = lastMonthOrders.filter(order => order.payment_status === 'paid')
    const lastMonthAOV = lastMonthPaidOrders.length > 0 
      ? lastMonthRevenue / lastMonthPaidOrders.length 
      : 0

    // Calculate changes (month over month)
    const revenueChange = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0

    const ordersChange = lastMonthOrders.length > 0 
      ? ((currentMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100 
      : 0

    // Get customers from last month
    const lastMonthCustomers = customers.filter(customer => {
      const registrationDate = new Date(customer.registration)
      return registrationDate >= lastMonth && registrationDate < currentMonth
    })

    const currentMonthCustomers = customers.filter(customer => {
      const registrationDate = new Date(customer.registration)
      return registrationDate >= currentMonth
    })

    const customersChange = lastMonthCustomers.length > 0 
      ? ((currentMonthCustomers.length - lastMonthCustomers.length) / lastMonthCustomers.length) * 100 
      : 0

    const aovChange = lastMonthAOV > 0 
      ? ((averageOrderValue - lastMonthAOV) / lastMonthAOV) * 100 
      : 0

    // Get recent orders (last 10)
    const recentOrders = orders.slice(0, 10).map(order => ({
      $id: order.$id,
      order_number: order.order_number,
      customer_name: order.customer_name || 'Unknown',
      customer_email: order.customer_email || '',
      total: order.total || 0,
      status: order.status || 'pending',
      payment_status: order.payment_status || 'pending',
      $createdAt: order.$createdAt
    }))

    // Get low stock products
    const lowStockProducts = products
      .filter(product => {
        const stock = product.units || 0
        const threshold = product.min_order_quantity || 5
        return stock <= threshold && product.is_active
      })
      .slice(0, 10)
      .map(product => ({
        $id: product.$id,
        name: product.name,
        stock: product.units || 0,
        threshold: product.min_order_quantity || 5,
        price: product.price || 0
      }))

    // Calculate order status distribution
    const orderStatuses = {
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    }

    // Calculate product statistics
    const productStats = {
      total: products.length,
      active: products.filter(p => p.is_active).length,
      inactive: products.filter(p => !p.is_active).length,
      featured: products.filter(p => p.is_featured).length,
      lowStock: lowStockProducts.length,
      outOfStock: products.filter(p => (p.units || 0) === 0).length,
    }

    const dashboardData = {
      metrics: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders: orders.length,
        totalCustomers: customers.length,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        revenueChange: Math.round(revenueChange * 10) / 10,
        ordersChange: Math.round(ordersChange * 10) / 10,
        customersChange: Math.round(customersChange * 10) / 10,
        aovChange: Math.round(aovChange * 10) / 10,
      },
      recentOrders,
      lowStockProducts,
      orderStatuses,
      productStats,
      summary: {
        totalProducts: products.length,
        totalUsers: customers.length,
        totalOrders: orders.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        currentMonthOrders: currentMonthOrders.length,
        currentMonthRevenue: Math.round(currentMonthRevenue * 100) / 100,
      }
    }

    return NextResponse.json(dashboardData)

  } catch (error: any) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json(
      { 
        error: error.message || "Failed to fetch dashboard data",
        metrics: {
          totalRevenue: 0,
          totalOrders: 0,
          totalCustomers: 0,
          averageOrderValue: 0,
          revenueChange: 0,
          ordersChange: 0,
          customersChange: 0,
          aovChange: 0,
        },
        recentOrders: [],
        lowStockProducts: [],
        orderStatuses: {
          pending: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
        },
        productStats: {
          total: 0,
          active: 0,
          inactive: 0,
          featured: 0,
          lowStock: 0,
          outOfStock: 0,
        }
      },
      { status: 500 }
    )
  }
}
