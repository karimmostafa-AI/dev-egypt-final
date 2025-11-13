import { NextRequest, NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { createAdminClient } from "@/lib/appwrite-admin"

// Get database ID from environment
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
const PRODUCTS_COLLECTION_ID = 'products'
const ORDERS_COLLECTION_ID = 'orders'
const SESSION_TRACKING_COLLECTION_ID = 'session_tracking'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30" // days
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Create admin client
    const { databases, users } = await createAdminClient()

    // Calculate date range
    const now = new Date()
    const periodDays = parseInt(period)
    const fromDate = startDate ? new Date(startDate) : new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000))
    const toDate = endDate ? new Date(endDate) : now

    // Fetch data in parallel
    const [
      ordersResult,
      productsResult,
      usersResult,
      sessionsResult
    ] = await Promise.all([
      // Orders in date range
      databases.listDocuments(DATABASE_ID, ORDERS_COLLECTION_ID, [
        Query.limit(1000),
        Query.greaterThanEqual('$createdAt', fromDate.toISOString()),
        Query.lessThanEqual('$createdAt', toDate.toISOString()),
        Query.orderDesc('$createdAt')
      ]).catch(() => ({ documents: [], total: 0 })),
      
      // All products for analysis
      databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION_ID, [
        Query.limit(1000)
      ]).catch(() => ({ documents: [], total: 0 })),
      
      // All users for customer analysis
      users.list([Query.limit(1000)]).catch(() => ({ users: [], total: 0 })),
      
      // Session tracking for traffic sources (if collection exists)
      databases.listDocuments(DATABASE_ID, SESSION_TRACKING_COLLECTION_ID, [
        Query.limit(1000),
        Query.greaterThanEqual('session_start', fromDate.toISOString()),
        Query.lessThanEqual('session_start', toDate.toISOString())
      ]).catch(() => ({ documents: [], total: 0 }))
    ])

    const orders = ordersResult.documents || []
    const products = productsResult.documents || []
    const customers = usersResult.users || []
    const sessions = sessionsResult.documents || []

    // Calculate revenue over time (daily)
    const revenueByDay: { [key: string]: number } = {}
    const ordersByDay: { [key: string]: number } = {}
    
    orders.forEach(order => {
      if (order.payment_status === 'paid') {
        const date = new Date(order.$createdAt).toISOString().split('T')[0]
        revenueByDay[date] = (revenueByDay[date] || 0) + (order.total_amount || order.payable_amount || 0)
        ordersByDay[date] = (ordersByDay[date] || 0) + 1
      }
    })

    // Create daily series data
    const dailyData = []
    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      dailyData.push({
        date: dateStr,
        revenue: revenueByDay[dateStr] || 0,
        orders: ordersByDay[dateStr] || 0
      })
    }

    // Top products by sales
    const productSales: { [key: string]: { name: string, revenue: number, quantity: number } } = {}
    
    orders.forEach(order => {
      if (order.payment_status === 'paid' && order.items) {
        try {
          const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              const productId = item.product_id || item.id
              if (productId) {
                if (!productSales[productId]) {
                  const product = products.find(p => p.$id === productId)
                  productSales[productId] = {
                    name: product?.name || `Product ${productId}`,
                    revenue: 0,
                    quantity: 0
                  }
                }
                productSales[productId].revenue += (item.price || 0) * (item.quantity || 1)
                productSales[productId].quantity += item.quantity || 1
              }
            })
          }
        } catch (error) {
          console.error('Error parsing order items:', error)
        }
      }
    })

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Customer analytics
    const newCustomersInPeriod = customers.filter(customer => {
      const registrationDate = new Date(customer.registration)
      return registrationDate >= fromDate && registrationDate <= toDate
    }).length

    // Order status distribution
    const orderStatusDistribution = {
      pending: orders.filter(o => o.order_status === 'pending').length,
      processing: orders.filter(o => o.order_status === 'processing').length,
      shipped: orders.filter(o => o.order_status === 'shipped').length,
      delivered: orders.filter(o => o.order_status === 'delivered').length,
      cancelled: orders.filter(o => o.order_status === 'cancelled').length,
    }

    // Payment method distribution
    const paymentMethods: { [key: string]: number } = {}
    orders.forEach(order => {
      const method = order.payment_method || 'unknown'
      paymentMethods[method] = (paymentMethods[method] || 0) + 1
    })

    // Calculate metrics for the period
    const totalRevenue = orders
      .filter(order => order.payment_status === 'paid')
      .reduce((sum, order) => sum + (order.total_amount || order.payable_amount || 0), 0)

    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Customer lifetime value (simplified)
    const customerOrderCounts: { [key: string]: number } = {}
    const customerRevenueMap: { [key: string]: number } = {}
    
    orders.forEach(order => {
      if (order.customer_id && order.payment_status === 'paid') {
        customerOrderCounts[order.customer_id] = (customerOrderCounts[order.customer_id] || 0) + 1
        customerRevenueMap[order.customer_id] = (customerRevenueMap[order.customer_id] || 0) + (order.total_amount || order.payable_amount || 0)
      }
    })

    const avgCustomerLifetimeValue = Object.keys(customerRevenueMap).length > 0
      ? Object.values(customerRevenueMap).reduce((sum, val) => sum + val, 0) / Object.keys(customerRevenueMap).length
      : 0

    // Calculate Orders by Payment Method
    const ordersByPaymentMethod: { [key: string]: { orders: number, revenue: number } } = {}
    const paidOrders = orders.filter(o => o.payment_status === 'paid')
    const totalOrdersForPaymentMethod = paidOrders.length
    
    paidOrders.forEach(order => {
      const paymentMethod = order.payment_method || 'unknown'
      if (!ordersByPaymentMethod[paymentMethod]) {
        ordersByPaymentMethod[paymentMethod] = { orders: 0, revenue: 0 }
      }
      ordersByPaymentMethod[paymentMethod].orders += 1
      ordersByPaymentMethod[paymentMethod].revenue += (order.total_amount || order.payable_amount || 0)
    })

    // Convert to array format with percentages
    const paymentMethodArray = Object.entries(ordersByPaymentMethod).map(([method, data]) => ({
      paymentMethod: method === 'card' ? 'Card Payment' : method === 'cash' ? 'Cash on Delivery' : method,
      orders: data.orders,
      revenue: data.revenue,
      percentage: totalOrdersForPaymentMethod > 0 ? Math.round((data.orders / totalOrdersForPaymentMethod) * 100) : 0
    }))
    // Calculate Customer Growth over time (daily)
    const customerGrowthByDay: { [key: string]: { newCustomers: number, returningCustomers: number, totalCustomers: number } } = {}
    let runningTotalCustomers = 0

    // Initialize all days
    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      customerGrowthByDay[dateStr] = { newCustomers: 0, returningCustomers: 0, totalCustomers: 0 }
    }

    // Count new customers per day
    customers.forEach(customer => {
      const registrationDate = new Date(customer.registration)
      if (registrationDate >= fromDate && registrationDate <= toDate) {
        const dateStr = registrationDate.toISOString().split('T')[0]
        if (customerGrowthByDay[dateStr]) {
          customerGrowthByDay[dateStr].newCustomers += 1
        }
      }
    })

    // Count returning customers (customers with multiple orders)
    const customerFirstOrderDate: { [key: string]: Date } = {}
    const customerOrderDates: { [key: string]: Date[] } = {}
    
    orders.forEach(order => {
      if (order.customer_id) {
        const orderDate = new Date(order.$createdAt)
        if (!customerFirstOrderDate[order.customer_id]) {
          customerFirstOrderDate[order.customer_id] = orderDate
        }
        if (!customerOrderDates[order.customer_id]) {
          customerOrderDates[order.customer_id] = []
        }
        customerOrderDates[order.customer_id].push(orderDate)
      }
    })

    // Mark returning customers per day
    Object.entries(customerOrderDates).forEach(([customerId, orderDates]) => {
      const firstOrderDate = customerFirstOrderDate[customerId]
      orderDates.forEach(orderDate => {
        if (orderDate > firstOrderDate && orderDate >= fromDate && orderDate <= toDate) {
          const dateStr = orderDate.toISOString().split('T')[0]
          if (customerGrowthByDay[dateStr]) {
            customerGrowthByDay[dateStr].returningCustomers += 1
          }
        }
      })
    })

    // Calculate running total
    let cumulativeTotal = customers.filter(c => new Date(c.registration) < fromDate).length
    const customerGrowthArray = []
    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const dayData = customerGrowthByDay[dateStr] || { newCustomers: 0, returningCustomers: 0, totalCustomers: 0 }
      cumulativeTotal += dayData.newCustomers
      customerGrowthArray.push({
        date: dateStr,
        newCustomers: dayData.newCustomers,
        returningCustomers: dayData.returningCustomers,
        totalCustomers: cumulativeTotal
      })
    }

    // Calculate Traffic Sources from session_tracking or orders
    // Calculate Traffic Sources from session_tracking or orders
    // Calculate Traffic Sources from session_tracking or orders
    const trafficSources: { [key: string]: { visits: number, conversions: number } } = {}    
    if (sessions.length > 0) {
      // Use session_tracking data if available
      sessions.forEach(session => {
        const source = session.utm_source || session.referrer || 'Direct'
        if (!trafficSources[source]) {
          trafficSources[source] = { visits: 0, conversions: 0 }
        }
        trafficSources[source].visits += 1
        if (session.converted) {
          trafficSources[source].conversions += 1
        }
      })
    } else {
      // Fallback: use order referrer or default sources
      const defaultSources = ['Organic Search', 'Direct', 'Social Media', 'Email Campaign', 'Paid Ads', 'Referral']
      defaultSources.forEach(source => {
        trafficSources[source] = { visits: 0, conversions: 0 }
      })
      
      // Estimate from orders (if we had referrer data)
      orders.forEach(order => {
        const source = 'Direct' // Default since we don't have referrer in orders
        if (!trafficSources[source]) {
          trafficSources[source] = { visits: 0, conversions: 0 }
        }
        trafficSources[source].conversions += 1
      })
    }

    const trafficSourcesArray = Object.entries(trafficSources).map(([source, data]) => ({
      source,
      visits: data.visits,
      conversions: data.conversions,
      conversionRate: data.visits > 0 ? Math.round((data.conversions / data.visits) * 100 * 10) / 10 : 0
    }))
    .filter(item => item.visits > 0 || item.conversions > 0) // Only show sources with data
    .sort((a, b) => b.visits - a.visits)
    
    // Get Recent Orders (last 20 orders)
    const recentOrders = orders.slice(0, 20).map(order => {
      // Try to get customer name from users list
      const customer = order.customer_id ? customers.find(c => c.$id === order.customer_id) : null
      const customerName = customer?.name || customer?.email || `Customer ${order.customer_id?.substring(0, 8) || 'Unknown'}`

      // Map order_status to component status
      let status: 'pending' | 'processing' | 'completed' | 'cancelled' = 'pending'
      if (order.order_status === 'delivered' || order.order_status === 'completed') {
        status = 'completed'
      } else if (order.order_status === 'processing' || order.order_status === 'shipped') {
        status = 'processing'
      } else if (order.order_status === 'cancelled') {
        status = 'cancelled'
      }

      return {
        id: order.order_code || order.$id,
        customer: customerName,
        total: order.total_amount || order.payable_amount || 0,
        status,
        date: order.$createdAt
      }
    })

    const analyticsData = {
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        days: periodDays
      },
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        newCustomers: newCustomersInPeriod,
        avgCustomerLifetimeValue: Math.round(avgCustomerLifetimeValue * 100) / 100
      },
      charts: {
        dailyRevenue: dailyData,
        topProducts,
        orderStatusDistribution,
        paymentMethodDistribution: Object.entries(paymentMethods).map(([method, count]) => ({
          method,
          count
        })),
        ordersByPaymentMethod: paymentMethodArray,
        customerGrowth: customerGrowthArray,
        trafficSources: trafficSourcesArray,
        recentOrders
      },
      insights: {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.is_active).length,
        lowStockProducts: products.filter(p => (p.units || 0) <= (p.min_order_quantity || 5)).length,
        totalCustomers: customers.length,
        repeatCustomers: Object.values(customerOrderCounts).filter(count => count > 1).length
      }
    }

    return NextResponse.json(analyticsData)

  } catch (error: any) {
    console.error("Error fetching analytics data:", error)
    return NextResponse.json(
      { 
        error: error.message || "Failed to fetch analytics data",
        period: { from: null, to: null, days: 0 },
        summary: {
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          newCustomers: 0,
          avgCustomerLifetimeValue: 0
        },
        charts: {
          dailyRevenue: [],
          topProducts: [],
          orderStatusDistribution: {},
          paymentMethodDistribution: [],
          ordersByPaymentMethod: [],
          customerGrowth: [],
          trafficSources: [],
          recentOrders: []
        },
        insights: {
          totalProducts: 0,
          activeProducts: 0,
          lowStockProducts: 0,
          totalCustomers: 0,
          repeatCustomers: 0
        }
      },
      { status: 500 }
    )
  }
}
