// Appwrite Cloud Functions for Report Generation
// These functions handle report generation and export functionality

import { Client, Databases, Query } from 'appwrite';

// Types for function parameters and responses
export interface ReportFunctionRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body?: any;
  pathParameters?: Record<string, string>;
  queryParameters?: Record<string, string>;
}

export interface ReportFunctionResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
}

export interface ReportConfig {
  type: 'sales' | 'inventory' | 'customers' | 'products' | 'financial';
  format: 'json' | 'csv' | 'excel';
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  filters?: Record<string, any>;
  includeCharts?: boolean;
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
 * Generate comprehensive sales report
 */
export async function generateSalesReport(request: ReportFunctionRequest): Promise<ReportFunctionResponse> {
  try {
    const config: ReportConfig = request.body;

    if (!config.dateRange) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Date range is required for sales report'
        }
      };
    }

    // Get orders for the date range
    const ordersResult = await databases.listDocuments(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      [
        Query.greaterThanEqual('$createdAt', config.dateRange.startDate),
        Query.lessThanEqual('$createdAt', config.dateRange.endDate),
        Query.limit(1000)
      ]
    );

    const orders = ordersResult.documents;

    // Generate report data
    const reportData = {
      metadata: {
        type: 'Sales Report',
        period: config.dateRange,
        generatedAt: new Date().toISOString(),
        totalOrders: orders.length
      },
      summary: {
        totalRevenue: orders
          .filter(order => order.paymentStatus === 'paid')
          .reduce((sum, order) => sum + order.total, 0),
        totalOrders: orders.length,
        paidOrders: orders.filter(order => order.paymentStatus === 'paid').length,
        pendingOrders: orders.filter(order => order.status === 'pending').length,
        averageOrderValue: orders.length > 0
          ? orders.filter(order => order.paymentStatus === 'paid')
              .reduce((sum, order) => sum + order.total, 0) / orders.filter(order => order.paymentStatus === 'paid').length
          : 0
      },
      orders: orders.map((order: any) => ({
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        createdAt: order.$createdAt,
        items: order.items.map((item: any) => ({
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        }))
      })),
      dailyBreakdown: generateDailyBreakdown(orders),
      paymentMethodBreakdown: generatePaymentMethodBreakdown(orders),
      topProducts: await generateTopProductsFromOrders(orders)
    };

    // Return in requested format
    switch (config.format) {
      case 'csv':
        return generateCSVReport(reportData, 'sales');
      case 'excel':
        return generateExcelReport(reportData, 'sales');
      default:
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            success: true,
            data: reportData
          }
        };
    }
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
 * Generate inventory report
 */
export async function generateInventoryReport(request: ReportFunctionRequest): Promise<ReportFunctionResponse> {
  try {
    const config: ReportConfig = request.body;

    // Get all products
    const productsResult = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      [Query.limit(1000)]
    );

    const products = productsResult.documents;

    // Generate report data
    const reportData = {
      metadata: {
        type: 'Inventory Report',
        generatedAt: new Date().toISOString(),
        totalProducts: products.length
      },
      summary: {
        totalProducts: products.length,
        totalInventoryValue: products.reduce((sum, product) =>
          sum + (product.price * product.stockQuantity), 0),
        averageProductValue: products.length > 0
          ? products.reduce((sum, product) => sum + (product.price * product.stockQuantity), 0) / products.length
          : 0,
        lowStockProducts: products.filter(product =>
          product.stockQuantity > 0 && product.stockQuantity <= (product.lowStockThreshold || 5)
        ).length,
        outOfStockProducts: products.filter(product => product.stockQuantity === 0).length
      },
      products: products.map((product: any) => ({
        id: product.$id,
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId,
        price: product.price,
        stockQuantity: product.stockQuantity,
        stockValue: product.price * product.stockQuantity,
        status: product.status,
        lowStockThreshold: product.lowStockThreshold || 5,
        salesCount: product.salesCount || 0,
        viewCount: product.viewCount || 0
      })),
      lowStockAlerts: products
        .filter(product => product.stockQuantity <= (product.lowStockThreshold || 5))
        .map((product: any) => ({
          name: product.name,
          sku: product.sku,
          currentStock: product.stockQuantity,
          threshold: product.lowStockThreshold || 5,
          status: product.stockQuantity === 0 ? 'Out of Stock' : 'Low Stock'
        })),
      categoryBreakdown: generateCategoryBreakdown(products)
    };

    // Return in requested format
    switch (config.format) {
      case 'csv':
        return generateCSVReport(reportData, 'inventory');
      case 'excel':
        return generateExcelReport(reportData, 'inventory');
      default:
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            success: true,
            data: reportData
          }
        };
    }
  } catch (error) {
    console.error('Error generating inventory report:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to generate inventory report',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Generate customer report
 */
export async function generateCustomerReport(request: ReportFunctionRequest): Promise<ReportFunctionResponse> {
  try {
    const config: ReportConfig = request.body;

    // Get all customers
    const customersResult = await databases.listDocuments(
      DATABASE_ID,
      CUSTOMERS_COLLECTION_ID,
      [Query.limit(1000)]
    );

    const customers = customersResult.documents;

    // Generate report data
    const reportData = {
      metadata: {
        type: 'Customer Report',
        generatedAt: new Date().toISOString(),
        totalCustomers: customers.length
      },
      summary: {
        totalCustomers: customers.length,
        activeCustomers: customers.filter(customer => customer.status === 'active').length,
        vipCustomers: customers.filter(customer => customer.segment === 'vip').length,
        regularCustomers: customers.filter(customer => customer.segment === 'regular').length,
        atRiskCustomers: customers.filter(customer => customer.segment === 'at-risk').length,
        inactiveCustomers: customers.filter(customer => customer.segment === 'inactive').length,
        averageOrdersPerCustomer: customers.length > 0
          ? customers.reduce((sum, customer) => sum + customer.ordersCount, 0) / customers.length
          : 0,
        averageLifetimeValue: customers.length > 0
          ? customers.reduce((sum, customer) => sum + customer.totalSpent, 0) / customers.length
          : 0
      },
      customers: customers.map((customer: any) => ({
        id: customer.$id,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phone,
        status: customer.status,
        segment: customer.segment,
        ordersCount: customer.ordersCount,
        totalSpent: customer.totalSpent,
        averageOrderValue: customer.averageOrderValue,
        lastOrderDate: customer.lastOrderDate,
        acceptsMarketing: customer.acceptsMarketing,
        createdAt: customer.$createdAt
      })),
      segmentDistribution: {
        vip: customers.filter(c => c.segment === 'vip').length,
        regular: customers.filter(c => c.segment === 'regular').length,
        'at-risk': customers.filter(c => c.segment === 'at-risk').length,
        inactive: customers.filter(c => c.segment === 'inactive').length
      },
      topCustomers: customers
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 20)
        .map((customer: any) => ({
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          totalSpent: customer.totalSpent,
          ordersCount: customer.ordersCount,
          segment: customer.segment
        }))
    };

    // Return in requested format
    switch (config.format) {
      case 'csv':
        return generateCSVReport(reportData, 'customers');
      case 'excel':
        return generateExcelReport(reportData, 'customers');
      default:
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            success: true,
            data: reportData
          }
        };
    }
  } catch (error) {
    console.error('Error generating customer report:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to generate customer report',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Generate financial report
 */
export async function generateFinancialReport(request: ReportFunctionRequest): Promise<ReportFunctionResponse> {
  try {
    const config: ReportConfig = request.body;

    if (!config.dateRange) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Date range is required for financial report'
        }
      };
    }

    // Get orders for the period
    const ordersResult = await databases.listDocuments(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      [
        Query.greaterThanEqual('$createdAt', config.dateRange.startDate),
        Query.lessThanEqual('$createdAt', config.dateRange.endDate),
        Query.equal('paymentStatus', 'paid'),
        Query.limit(1000)
      ]
    );

    const orders = ordersResult.documents;

    // Calculate financial metrics
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalShipping = orders.reduce((sum, order) => sum + order.shippingCost, 0);
    const totalTax = orders.reduce((sum, order) => sum + order.taxAmount, 0);
    const totalDiscounts = orders.reduce((sum, order) => sum + order.discountAmount, 0);

    // Get products for cost calculation (simplified)
    const productsResult = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      [Query.limit(1000)]
    );

    const products = productsResult.documents;
    const totalCostOfGoods = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum: number, item: any) => {
        const product = products.find((p: any) => p.$id === item.productId);
        return itemSum + ((product?.costPerItem || 0) * item.quantity);
      }, 0);
    }, 0);

    const grossProfit = totalRevenue - totalCostOfGoods;
    const netProfit = grossProfit - totalShipping - totalTax;

    const reportData = {
      metadata: {
        type: 'Financial Report',
        period: config.dateRange,
        generatedAt: new Date().toISOString()
      },
      summary: {
        totalRevenue,
        totalCostOfGoods,
        grossProfit,
        totalShipping,
        totalTax,
        totalDiscounts,
        netProfit,
        profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
      },
      breakdown: {
        daily: generateDailyFinancialBreakdown(orders),
        byPaymentMethod: generatePaymentMethodFinancialBreakdown(orders)
      },
      metrics: {
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        totalOrders: orders.length,
        costPerOrder: orders.length > 0 ? totalCostOfGoods / orders.length : 0,
        shippingCostPercentage: totalRevenue > 0 ? (totalShipping / totalRevenue) * 100 : 0,
        taxPercentage: totalRevenue > 0 ? (totalTax / totalRevenue) * 100 : 0
      }
    };

    // Return in requested format
    switch (config.format) {
      case 'csv':
        return generateCSVReport(reportData, 'financial');
      case 'excel':
        return generateExcelReport(reportData, 'financial');
      default:
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            success: true,
            data: reportData
          }
        };
    }
  } catch (error) {
    console.error('Error generating financial report:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to generate financial report',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

// Helper functions for data processing

function generateDailyBreakdown(orders: any[]): Array<{ date: string; orders: number; revenue: number }> {
  const daily: Record<string, { orders: number; revenue: number }> = {};

  orders.forEach(order => {
    const date = order.$createdAt.split('T')[0];

    if (!daily[date]) {
      daily[date] = { orders: 0, revenue: 0 };
    }

    daily[date].orders++;
    daily[date].revenue += order.total;
  });

  return Object.entries(daily).map(([date, data]) => ({
    date,
    ...data
  }));
}

function generatePaymentMethodBreakdown(orders: any[]): Array<{ method: string; orders: number; revenue: number }> {
  const methods: Record<string, { orders: number; revenue: number }> = {};

  orders.forEach(order => {
    const method = order.paymentMethod;

    if (!methods[method]) {
      methods[method] = { orders: 0, revenue: 0 };
    }

    methods[method].orders++;
    methods[method].revenue += order.total;
  });

  return Object.entries(methods).map(([method, data]) => ({
    method,
    ...data
  }));
}

async function generateTopProductsFromOrders(orders: any[]): Promise<Array<{
  productName: string;
  sku: string;
  quantity: number;
  revenue: number;
  orderCount: number;
}>> {
  const productStats: Record<string, {
    productName: string;
    sku: string;
    quantity: number;
    revenue: number;
    orderCount: number;
  }> = {};

  for (const order of orders) {
    for (const item of order.items) {
      const key = item.productId;

      if (!productStats[key]) {
        productStats[key] = {
          productName: item.productName,
          sku: item.sku,
          quantity: 0,
          revenue: 0,
          orderCount: 0
        };
      }

      productStats[key].quantity += item.quantity;
      productStats[key].revenue += item.total;
      productStats[key].orderCount++;
    }
  }

  return Object.values(productStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

function generateCategoryBreakdown(products: any[]): Array<{
  categoryId: string;
  productCount: number;
  totalValue: number;
  averageValue: number;
}> {
  const categories: Record<string, {
    productCount: number;
    totalValue: number;
  }> = {};

  products.forEach(product => {
    const categoryId = product.categoryId;

    if (!categories[categoryId]) {
      categories[categoryId] = { productCount: 0, totalValue: 0 };
    }

    categories[categoryId].productCount++;
    categories[categoryId].totalValue += product.price * product.stockQuantity;
  });

  return Object.entries(categories).map(([categoryId, data]) => ({
    categoryId,
    ...data,
    averageValue: data.productCount > 0 ? data.totalValue / data.productCount : 0
  }));
}

function generateDailyFinancialBreakdown(orders: any[]): Array<{
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}> {
  const daily: Record<string, { revenue: number; orders: number }> = {};

  orders.forEach(order => {
    const date = order.$createdAt.split('T')[0];

    if (!daily[date]) {
      daily[date] = { revenue: 0, orders: 0 };
    }

    daily[date].revenue += order.total;
    daily[date].orders++;
  });

  return Object.entries(daily).map(([date, data]) => ({
    date,
    ...data,
    averageOrderValue: data.orders > 0 ? data.revenue / data.orders : 0
  }));
}

function generatePaymentMethodFinancialBreakdown(orders: any[]): Array<{
  method: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}> {
  const methods: Record<string, { revenue: number; orders: number }> = {};

  orders.forEach(order => {
    const method = order.paymentMethod;

    if (!methods[method]) {
      methods[method] = { revenue: 0, orders: 0 };
    }

    methods[method].revenue += order.total;
    methods[method].orders++;
  });

  return Object.entries(methods).map(([method, data]) => ({
    method,
    ...data,
    averageOrderValue: data.orders > 0 ? data.revenue / data.orders : 0
  }));
}

// Report format generators

function generateCSVReport(data: any, type: string): ReportFunctionResponse {
  let csvContent = '';

  switch (type) {
    case 'sales':
      csvContent = generateSalesCSV(data);
      break;
    case 'inventory':
      csvContent = generateInventoryCSV(data);
      break;
    case 'customers':
      csvContent = generateCustomersCSV(data);
      break;
    case 'financial':
      csvContent = generateFinancialCSV(data);
      break;
    default:
      csvContent = 'Type,Value\nUnknown,Report';
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.csv"`
    },
    body: csvContent
  };
}

function generateExcelReport(data: any, type: string): ReportFunctionResponse {
  // For now, return CSV format as Excel
  // In a real implementation, you would generate actual Excel files
  return generateCSVReport(data, type);
}

function generateSalesCSV(data: any): string {
  const rows = ['Order Number,Customer ID,Total,Status,Payment Status,Created At,Product Name,SKU,Quantity,Unit Price,Line Total'];

  data.orders.forEach((order: any) => {
    order.items.forEach((item: any) => {
      rows.push([
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
      ].join(','));
    });
  });

  return rows.join('\n');
}

function generateInventoryCSV(data: any): string {
  const rows = ['Product ID,Name,SKU,Category,Price,Stock Quantity,Stock Value,Status'];

  data.products.forEach((product: any) => {
    rows.push([
      product.id,
      `"${product.name}"`,
      product.sku,
      product.categoryId,
      product.price,
      product.stockQuantity,
      product.stockValue,
      product.status
    ].join(','));
  });

  return rows.join('\n');
}

function generateCustomersCSV(data: any): string {
  const rows = ['Customer ID,Name,Email,Phone,Status,Segment,Orders Count,Total Spent,Average Order Value'];

  data.customers.forEach((customer: any) => {
    rows.push([
      customer.id,
      `"${customer.name}"`,
      customer.email,
      customer.phone,
      customer.status,
      customer.segment,
      customer.ordersCount,
      customer.totalSpent,
      customer.averageOrderValue
    ].join(','));
  });

  return rows.join('\n');
}

function generateFinancialCSV(data: any): string {
  const rows = [
    'Metric,Value',
    `Total Revenue,${data.summary.totalRevenue}`,
    `Total Cost of Goods,${data.summary.totalCostOfGoods}`,
    `Gross Profit,${data.summary.grossProfit}`,
    `Total Shipping,${data.summary.totalShipping}`,
    `Total Tax,${data.summary.totalTax}`,
    `Net Profit,${data.summary.netProfit}`,
    `Profit Margin,${data.summary.profitMargin}%`,
    '',
    'Daily Breakdown:',
    'Date,Revenue,Orders,Average Order Value'
  ];

  data.breakdown.daily.forEach((day: any) => {
    rows.push(`${day.date},${day.revenue},${day.orders},${day.averageOrderValue}`);
  });

  return rows.join('\n');
}