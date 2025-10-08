// Appwrite Cloud Functions for Analytics and Dashboard Metrics
// These functions handle server-side analytics and reporting

import { Client, Databases, Query } from 'appwrite';

// Types for function parameters and responses
export interface AnalyticsFunctionRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body?: any;
  pathParameters?: Record<string, string>;
  queryParameters?: Record<string, string>;
}

export interface AnalyticsFunctionResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
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
 * Get dashboard overview metrics
 */
export async function getDashboardMetrics(request: AnalyticsFunctionRequest): Promise<AnalyticsFunctionResponse> {
  try {
    const { period = '30' } = request.queryParameters || {};
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Get orders for the period
    const ordersResult = await databases.listDocuments(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      [
        Query.greaterThanEqual('$createdAt', startDate),
        Query.limit(1000)
      ]
    );

    const orders = ordersResult.documents;

    // Get customers for the period
    const customersResult = await databases.listDocuments(
      DATABASE_ID,
      CUSTOMERS_COLLECTION_ID,
      [
        Query.greaterThanEqual('$createdAt', startDate),
        Query.limit(1000)
      ]
    );

    const customers = customersResult.documents;

    // Get products
    const productsResult = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      [Query.limit(1000)]
    );

    const products = productsResult.documents;

    // Calculate metrics
    const totalRevenue = orders
      .filter(order => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + order.total, 0);

    const totalOrders = orders.length;
    const totalCustomers = customers.length;
    const totalProducts = products.length;

    // Previous period for comparison
    const prevStartDate = new Date(Date.now() - (days * 2) * 24 * 60 * 60 * 1000).toISOString();
    const prevEndDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const prevOrdersResult = await databases.listDocuments(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      [
        Query.greaterThanEqual('$createdAt', prevStartDate),
        Query.lessThanEqual('$createdAt', prevEndDate),
        Query.limit(1000)
      ]
    );

    const prevOrders = prevOrdersResult.documents;
    const prevRevenue = prevOrders
      .filter(order => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + order.total, 0);

    // Calculate growth rates
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const ordersGrowth = prevOrders.length > 0 ? ((totalOrders - prevOrders.length) / prevOrders.length) * 100 : 0;
    const customersGrowth = 0; // Would need previous customers count

    const metrics = {
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      conversionRate: totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0,
      growth: {
        revenue: revenueGrowth,
        orders: ordersGrowth,
        customers: customersGrowth
      },
      period: {
        days,
        startDate,
        endDate: new Date().toISOString()
      }
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: metrics
      }
    };
  } catch (error) {
    console.error('Error getting dashboard metrics:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to get dashboard metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Get revenue analytics with chart data
 */
export async function getRevenueAnalytics(request: AnalyticsFunctionRequest): Promise<AnalyticsFunctionResponse> {
  try {
    const { period = '30', groupBy = 'day' } = request.queryParameters || {};
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get orders for the period
    const ordersResult = await databases.listDocuments(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      [
        Query.greaterThanEqual('$createdAt', startDate.toISOString()),
        Query.equal('paymentStatus', 'paid'),
        Query.limit(1000)
      ]
    );

    const orders = ordersResult.documents;

    // Group orders by date
    const groupedData: Record<string, number> = {};

    orders.forEach(order => {
      const orderDate = new Date(order.$createdAt);
      let key: string;

      switch (groupBy) {
        case 'week':
          const weekStart = new Date(orderDate);
          weekStart.setDate(orderDate.getDate() - orderDate.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'day':
        default:
          key = orderDate.toISOString().split('T')[0];
          break;
      }

      groupedData[key] = (groupedData[key] || 0) + order.total;
    });

    // Fill in missing dates with zero values
    const chartData: ChartDataPoint[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= new Date()) {
      let key: string;

      switch (groupBy) {
        case 'week':
          const weekStart = new Date(currentDate);
          weekStart.setDate(currentDate.getDate() - currentDate.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'day':
        default:
          key = currentDate.toISOString().split('T')[0];
          break;
      }

      chartData.push({
        date: key,
        value: groupedData[key] || 0,
        label: new Date(key).toLocaleDateString()
      });

      // Increment date based on groupBy
      switch (groupBy) {
        case 'week':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'month':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'day':
        default:
          currentDate.setDate(currentDate.getDate() + 1);
          break;
      }
    }

    // Calculate summary statistics
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const averageDailyRevenue = totalRevenue / Math.max(1, chartData.length);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: {
          chartData,
          summary: {
            totalRevenue,
            averageDailyRevenue,
            period: `${days} days`,
            dataPoints: chartData.length
          }
        }
      }
    };
  } catch (error) {
    console.error('Error getting revenue analytics:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to get revenue analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Get top products by sales
 */
export async function getTopProducts(request: AnalyticsFunctionRequest): Promise<AnalyticsFunctionResponse> {
  try {
    const { limit = '10' } = request.queryParameters || {};

    // Get all orders to analyze product performance
    const ordersResult = await databases.listDocuments(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      [
        Query.equal('paymentStatus', 'paid'),
        Query.limit(1000)
      ]
    );

    const orders = ordersResult.documents;

    // Aggregate product sales
    const productSales: Record<string, {
      productId: string;
      productName: string;
      quantity: number;
      revenue: number;
      orderCount: number;
    }> = {};

    orders.forEach(order => {
      order.items.forEach((item: any) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            quantity: 0,
            revenue: 0,
            orderCount: 0
          };
        }

        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.total;
        productSales[item.productId].orderCount += 1;
      });
    });

    // Convert to array and sort by revenue
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, parseInt(limit))
      .map(product => ({
        ...product,
        averageOrderValue: product.orderCount > 0 ? product.revenue / product.orderCount : 0
      }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: topProducts
      }
    };
  } catch (error) {
    console.error('Error getting top products:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to get top products',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Get customer analytics
 */
export async function getCustomerAnalytics(request: AnalyticsFunctionRequest): Promise<AnalyticsFunctionResponse> {
  try {
    const { period = '30' } = request.queryParameters || {};
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Get customers for the period
    const customersResult = await databases.listDocuments(
      DATABASE_ID,
      CUSTOMERS_COLLECTION_ID,
      [
        Query.greaterThanEqual('$createdAt', startDate),
        Query.limit(1000)
      ]
    );

    const customers = customersResult.documents;

    // Get orders for the period
    const ordersResult = await databases.listDocuments(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      [
        Query.greaterThanEqual('$createdAt', startDate),
        Query.limit(1000)
      ]
    );

    const orders = ordersResult.documents;

    // Calculate customer metrics
    const newCustomers = customers.length;
    const totalOrders = orders.length;
    const uniqueCustomersWithOrders = new Set(orders.map(order => order.customerId)).size;

    // Customer acquisition over time
    const acquisitionData: ChartDataPoint[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= new Date()) {
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const customersOnDay = customers.filter(customer =>
        new Date(customer.$createdAt) >= currentDate &&
        new Date(customer.$createdAt) <= dayEnd
      ).length;

      acquisitionData.push({
        date: currentDate.toISOString().split('T')[0],
        value: customersOnDay,
        label: currentDate.toLocaleDateString()
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Customer segments
    const allCustomersResult = await databases.listDocuments(
      DATABASE_ID,
      CUSTOMERS_COLLECTION_ID,
      [Query.limit(1000)]
    );

    const allCustomers = allCustomersResult.documents;
    const segmentDistribution = {
      vip: allCustomers.filter(c => c.segment === 'vip').length,
      regular: allCustomers.filter(c => c.segment === 'regular').length,
      'at-risk': allCustomers.filter(c => c.segment === 'at-risk').length,
      inactive: allCustomers.filter(c => c.segment === 'inactive').length
    };

    const analytics = {
      overview: {
        newCustomers,
        totalOrders,
        uniqueCustomersWithOrders,
        conversionRate: newCustomers > 0 ? (uniqueCustomersWithOrders / newCustomers) * 100 : 0
      },
      acquisitionTrend: acquisitionData,
      segmentDistribution,
      topCustomers: allCustomers
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10)
        .map(customer => ({
          id: customer.$id,
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          totalSpent: customer.totalSpent,
          ordersCount: customer.ordersCount,
          segment: customer.segment,
          lastOrderDate: customer.lastOrderDate
        }))
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: analytics
      }
    };
  } catch (error) {
    console.error('Error getting customer analytics:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to get customer analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Get inventory analytics
 */
export async function getInventoryAnalytics(request: AnalyticsFunctionRequest): Promise<AnalyticsFunctionResponse> {
  try {
    // Get all products
    const productsResult = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      [Query.limit(1000)]
    );

    const products = productsResult.documents;

    // Calculate inventory metrics
    const totalProducts = products.length;
    const totalInventoryValue = products.reduce((sum, product) =>
      sum + (product.price * product.stockQuantity), 0
    );

    const lowStockProducts = products.filter(product =>
      product.stockQuantity > 0 && product.stockQuantity <= (product.lowStockThreshold || 5)
    );

    const outOfStockProducts = products.filter(product => product.stockQuantity === 0);

    const inventoryByCategory: Record<string, {
      category: string;
      productCount: number;
      totalValue: number;
      lowStockCount: number;
      outOfStockCount: number;
    }> = {};

    products.forEach(product => {
      const categoryId = product.categoryId;

      if (!inventoryByCategory[categoryId]) {
        inventoryByCategory[categoryId] = {
          category: categoryId,
          productCount: 0,
          totalValue: 0,
          lowStockCount: 0,
          outOfStockCount: 0
        };
      }

      inventoryByCategory[categoryId].productCount++;
      inventoryByCategory[categoryId].totalValue += product.price * product.stockQuantity;

      if (product.stockQuantity === 0) {
        inventoryByCategory[categoryId].outOfStockCount++;
      } else if (product.stockQuantity <= (product.lowStockThreshold || 5)) {
        inventoryByCategory[categoryId].lowStockCount++;
      }
    });

    const analytics = {
      overview: {
        totalProducts,
        totalInventoryValue,
        averageProductValue: totalProducts > 0 ? totalInventoryValue / totalProducts : 0,
        lowStockProducts: lowStockProducts.length,
        outOfStockProducts: outOfStockProducts.length,
        lowStockPercentage: totalProducts > 0 ? (lowStockProducts.length / totalProducts) * 100 : 0,
        outOfStockPercentage: totalProducts > 0 ? (outOfStockProducts.length / totalProducts) * 100 : 0
      },
      alerts: {
        lowStock: lowStockProducts.slice(0, 10).map(product => ({
          id: product.$id,
          name: product.name,
          sku: product.sku,
          currentStock: product.stockQuantity,
          threshold: product.lowStockThreshold || 5
        })),
        outOfStock: outOfStockProducts.slice(0, 10).map(product => ({
          id: product.$id,
          name: product.name,
          sku: product.sku,
          daysOutOfStock: Math.floor(
            (Date.now() - new Date(product.$updatedAt).getTime()) / (1000 * 60 * 60 * 24)
          )
        }))
      },
      byCategory: Object.values(inventoryByCategory),
      topProductsByValue: products
        .sort((a, b) => (b.price * b.stockQuantity) - (a.price * a.stockQuantity))
        .slice(0, 10)
        .map(product => ({
          id: product.$id,
          name: product.name,
          sku: product.sku,
          stockQuantity: product.stockQuantity,
          unitPrice: product.price,
          totalValue: product.price * product.stockQuantity
        }))
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: analytics
      }
    };
  } catch (error) {
    console.error('Error getting inventory analytics:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to get inventory analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Generate sales report
 */
export async function generateSalesReport(request: AnalyticsFunctionRequest): Promise<AnalyticsFunctionResponse> {
  try {
    const { startDate, endDate, format = 'json' } = request.body || {};

    if (!startDate || !endDate) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'startDate and endDate are required'
        }
      };
    }

    // Get orders for the date range
    const ordersResult = await databases.listDocuments(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      [
        Query.greaterThanEqual('$createdAt', startDate),
        Query.lessThanEqual('$createdAt', endDate),
        Query.limit(1000)
      ]
    );

    const orders = ordersResult.documents;

    // Generate report data
    const report = {
      period: {
        startDate,
        endDate,
        totalDays: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
      },
      summary: {
        totalOrders: orders.length,
        totalRevenue: orders
          .filter(order => order.paymentStatus === 'paid')
          .reduce((sum, order) => sum + order.total, 0),
        averageOrderValue: orders.length > 0
          ? orders.filter(order => order.paymentStatus === 'paid')
              .reduce((sum, order) => sum + order.total, 0) / orders.filter(order => order.paymentStatus === 'paid').length
          : 0,
        paidOrders: orders.filter(order => order.paymentStatus === 'paid').length,
        pendingOrders: orders.filter(order => order.status === 'pending').length,
        completedOrders: orders.filter(order => order.status === 'delivered').length
      },
      orders: orders.map(order => ({
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.$createdAt,
        items: order.items.map((item: any) => ({
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        }))
      })),
      generatedAt: new Date().toISOString()
    };

    // Return in requested format
    if (format === 'csv') {
      // Generate CSV format
      const csvData = generateCSV(report);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="sales-report-${startDate}-to-${endDate}.csv"`
        },
        body: csvData
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: report
      }
    };
  } catch (error) {
    console.error('Error generating sales report:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to generate sales report',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Helper function to generate CSV from report data
 */
function generateCSV(report: any): string {
  const headers = [
    'Order Number',
    'Customer ID',
    'Total',
    'Status',
    'Payment Status',
    'Created At',
    'Product Name',
    'SKU',
    'Quantity',
    'Unit Price',
    'Line Total'
  ];

  const csvRows = [headers.join(',')];

  report.orders.forEach((order: any) => {
    order.items.forEach((item: any) => {
      const row = [
        order.orderNumber,
        order.customerId,
        order.total,
        order.status,
        order.paymentStatus,
        order.createdAt,
        `"${item.productName}"`,
        item.sku,
        item.quantity,
        item.price,
        item.total
      ];
      csvRows.push(row.join(','));
    });
  });

  return csvRows.join('\n');
}