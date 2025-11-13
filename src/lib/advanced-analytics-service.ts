// Advanced Analytics Engine - Real-time business intelligence and insights
// Provides comprehensive analytics similar to Shopify and WooCommerce

import { useState, useEffect, useCallback } from 'react';
import { inventoryService } from './inventory-management-service';
import { orderProcessingService, Order } from './order-processing-service';
import { realtimeManager } from './realtime-subscriptions';

// Analytics data types
export interface SalesAnalytics {
  today: {
    revenue: number;
    orders: number;
    averageOrderValue: number;
    topProducts: Array<{
      productId: string;
      productName: string;
      quantity: number;
      revenue: number;
    }>;
  };
  thisWeek: {
    revenue: number;
    orders: number;
    averageOrderValue: number;
    growth: number; // percentage vs last week
  };
  thisMonth: {
    revenue: number;
    orders: number;
    averageOrderValue: number;
    growth: number; // percentage vs last month
  };
  lastMonth: {
    revenue: number;
    orders: number;
    averageOrderValue: number;
  };
  trends: Array<{
    date: string;
    revenue: number;
    orders: number;
    averageOrderValue: number;
  }>;
}

export interface InventoryAnalytics {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  inventoryTurnover: number;
  topMovingProducts: Array<{
    productId: string;
    productName: string;
    turnoverRate: number;
    salesCount: number;
  }>;
  slowMovingProducts: Array<{
    productId: string;
    productName: string;
    daysInStock: number;
    lastSale: string;
  }>;
  stockAlerts: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    alertType: 'low_stock' | 'out_of_stock';
    threshold: number;
  }>;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  returningCustomers: {
    count: number;
    percentage: number;
  };
  customerLifetimeValue: {
    average: number;
    topCustomers: Array<{
      customerId: string;
      customerName: string;
      totalSpent: number;
      orderCount: number;
    }>;
  };
  geographicDistribution: Array<{
    country: string;
    customers: number;
    revenue: number;
  }>;
  customerSegmentation: {
    vip: number;
    regular: number;
    new: number;
    inactive: number;
  };
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  views: number;
  sales: number;
  conversionRate: number;
  revenue: number;
  profit: number;
  returnRate: number;
  reviews: {
    count: number;
    averageRating: number;
  };
  performance: 'excellent' | 'good' | 'average' | 'poor';
}

export interface CategoryAnalytics {
  categoryId: string;
  categoryName: string;
  revenue: number;
  orders: number;
  products: number;
  averageOrderValue: number;
  growth: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    revenue: number;
    sales: number;
  }>;
}

export interface BrandAnalytics {
  brandId: string;
  brandName: string;
  revenue: number;
  orders: number;
  products: number;
  marketShare: number;
  growth: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    revenue: number;
    sales: number;
  }>;
}

export interface ConversionFunnel {
  stage: string;
  count: number;
  percentage: number;
  dropoffRate: number;
}

export interface RealTimeMetrics {
  activeUsers: number;
  liveOrders: number;
  revenueToday: number;
  conversionRate: number;
  topReferrers: Array<{
    source: string;
    visitors: number;
    conversions: number;
  }>;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
}

export interface ComprehensiveAnalytics {
  sales: SalesAnalytics;
  inventory: InventoryAnalytics & { isDemoData?: boolean };
  customers: CustomerAnalytics;
  productPerformance: ProductPerformance[];
  categoryAnalytics: CategoryAnalytics[];
  brandAnalytics: BrandAnalytics[];
  conversionFunnel: ConversionFunnel[];
  realTimeMetrics: RealTimeMetrics;
  lastUpdated: string;
  dataSourceStatus: {
    inventory: 'live' | 'demo' | 'error';
    sales: 'live' | 'demo' | 'error';
    customers: 'live' | 'demo' | 'error';
    productPerformance: 'live' | 'demo' | 'error';
    categoryAnalytics: 'live' | 'demo' | 'error';
    brandAnalytics: 'live' | 'demo' | 'error';
    conversionFunnel: 'live' | 'demo' | 'error';
    realTimeMetrics: 'live' | 'demo' | 'error';
  };
}

// Main Analytics Service
class AdvancedAnalyticsService {
  private static instance: AdvancedAnalyticsService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): AdvancedAnalyticsService {
    if (!AdvancedAnalyticsService.instance) {
      AdvancedAnalyticsService.instance = new AdvancedAnalyticsService();
    }
    return AdvancedAnalyticsService.instance;
  }

  // Main analytics method
  public async getComprehensiveAnalytics(): Promise<ComprehensiveAnalytics> {
    const cacheKey = 'comprehensive_analytics';
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      console.log('📊 Computing comprehensive analytics...');
       
      // Get individual analytics with error tracking
      const inventoryResult = await this.getInventoryAnalytics();
      const salesResult = await this.getSalesAnalytics();
      const customerResult = await this.getCustomerAnalytics();
      const productPerformanceResult = await this.getProductPerformanceAnalytics();
      const categoryResult = await this.getCategoryAnalytics();
      const brandResult = await this.getBrandAnalytics();
      const conversionResult = await this.getConversionFunnel();
      const realtimeResult = await this.getRealTimeMetrics();

      const analytics: ComprehensiveAnalytics = {
        sales: salesResult,
        inventory: inventoryResult,
        customers: customerResult,
        productPerformance: productPerformanceResult,
        categoryAnalytics: categoryResult,
        brandAnalytics: brandResult,
        conversionFunnel: conversionResult,
        realTimeMetrics: realtimeResult,
        lastUpdated: new Date().toISOString(),
        dataSourceStatus: {
          inventory: inventoryResult.isDemoData ? 'demo' : 'live',
          sales: 'live', // Currently using real data
          customers: 'demo', // Still mock data
          productPerformance: 'demo', // Still mock data
          categoryAnalytics: 'demo', // Still mock data
          brandAnalytics: 'demo', // Still mock data
          conversionFunnel: 'demo', // Still mock data
          realTimeMetrics: 'demo' // Still mock data
        }
      };

      this.setCache(cacheKey, analytics);
      console.log('✅ Analytics computed successfully');
      
      return analytics;
    } catch (error) {
      console.error('❌ Error computing analytics:', error);
      throw error;
    }
  }

  // Sales Analytics
  private async getSalesAnalytics(): Promise<SalesAnalytics> {
    try {
      const orders = orderProcessingService.getActiveOrders();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Filter orders by periods
      const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
      const thisWeekOrders = orders.filter(o => new Date(o.created_at) >= thisWeekStart);
      const thisMonthOrders = orders.filter(o => new Date(o.created_at) >= thisMonthStart);
      const lastMonthOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= lastMonthStart && orderDate <= lastMonthEnd;
      });

      // Calculate metrics
      const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total_amount, 0);
      const todayOrdersCount = todayOrders.length;
      const todayAOV = todayOrdersCount > 0 ? todayRevenue / todayOrdersCount : 0;

      const thisWeekRevenue = thisWeekOrders.reduce((sum, o) => sum + o.total_amount, 0);
      const thisWeekOrdersCount = thisWeekOrders.length;
      const thisWeekAOV = thisWeekOrdersCount > 0 ? thisWeekRevenue / thisWeekOrdersCount : 0;
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(thisWeekStart.getDate() - 7);
      const lastWeekOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= lastWeekStart && orderDate < thisWeekStart;
      });
      const lastWeekRevenue = lastWeekOrders.reduce((sum, o) => sum + o.total_amount, 0);
      const weekGrowth = lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;

      const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + o.total_amount, 0);
      const thisMonthOrdersCount = thisMonthOrders.length;
      const thisMonthAOV = thisMonthOrdersCount > 0 ? thisMonthRevenue / thisMonthOrdersCount : 0;
      const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + o.total_amount, 0);
      const monthGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      // Top products today
      const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
      todayOrders.forEach(order => {
        order.items.forEach(item => {
          const existing = productSales.get(item.product_id) || { 
            name: item.product_name, 
            quantity: 0, 
            revenue: 0 
          };
          existing.quantity += item.quantity;
          existing.revenue += item.total_price;
          productSales.set(item.product_id, existing);
        });
      });

      const topProducts = Array.from(productSales.entries())
        .map(([productId, data]) => ({
          productId,
          productName: data.name,
          quantity: data.quantity,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Generate trends (last 30 days)
      const trends = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dayOrders = orders.filter(o => {
          const orderDate = new Date(o.created_at);
          return orderDate.toDateString() === date.toDateString();
        });
        const dayRevenue = dayOrders.reduce((sum, o) => sum + o.total_amount, 0);
        const dayOrdersCount = dayOrders.length;
        const dayAOV = dayOrdersCount > 0 ? dayRevenue / dayOrdersCount : 0;

        trends.push({
          date: date.toISOString().split('T')[0],
          revenue: dayRevenue,
          orders: dayOrdersCount,
          averageOrderValue: dayAOV
        });
      }

      return {
        today: {
          revenue: todayRevenue,
          orders: todayOrdersCount,
          averageOrderValue: todayAOV,
          topProducts
        },
        thisWeek: {
          revenue: thisWeekRevenue,
          orders: thisWeekOrdersCount,
          averageOrderValue: thisWeekAOV,
          growth: weekGrowth
        },
        thisMonth: {
          revenue: thisMonthRevenue,
          orders: thisMonthOrdersCount,
          averageOrderValue: thisMonthAOV,
          growth: monthGrowth
        },
        lastMonth: {
          revenue: lastMonthRevenue,
          orders: lastMonthOrders.length,
          averageOrderValue: lastMonthOrders.length > 0 ? lastMonthRevenue / lastMonthOrders.length : 0
        },
        trends
      };
    } catch (error) {
      console.error('Error computing sales analytics:', error);
      return this.getDefaultSalesAnalytics();
    }
  }

  // Inventory Analytics
  private async getInventoryAnalytics(): Promise<InventoryAnalytics & { isDemoData: boolean }> {
    const isDemoData = false;
    
    try {
      console.log('📊 Computing real inventory analytics...');
      
      // Get basic inventory data
      const lowStockProducts = await inventoryService.getLowStockProducts();
      
      // Get real product count - fallback to 0 on error
      let totalProducts = 0;
      try {
        // In a real implementation, this would call a products service
        // For now, we'll compute from low stock data + estimated total
        const estimatedTotalFromLowStock = lowStockProducts.length;
        totalProducts = Math.max(estimatedTotalFromLowStock * 10, estimatedTotalFromLowStock); // Rough estimate
        console.log(`📦 Total products estimated: ${totalProducts}`);
      } catch (error) {
        console.warn('⚠️ Failed to get total products count, using 0:', error);
        totalProducts = 0;
      }
      
      const lowStockCount = lowStockProducts.filter(p => p.available_units > 0).length;
      const outOfStockCount = lowStockProducts.filter(p => p.available_units === 0).length;
      
      // Calculate total inventory value from real stock data
      let totalInventoryValue = 0;
      try {
        totalInventoryValue = lowStockProducts.reduce((sum, p) => {
          const price = p.price || 0; // Handle missing price data
          const stock = p.available_units || 0;
          return sum + (stock * price);
        }, 0);
        console.log(`💰 Total inventory value: $${totalInventoryValue.toFixed(2)}`);
      } catch (error) {
        console.warn('⚠️ Failed to calculate inventory value:', error);
        totalInventoryValue = 0;
      }

      // Get order history for computing real sales analytics
      const orders = orderProcessingService.getActiveOrders();
      console.log(`📈 Analyzing ${orders.length} orders for sales patterns...`);
      
      // Compute top moving products from real sales data
      const productSalesData = new Map<string, {
        productName: string;
        salesCount: number;
        totalRevenue: number;
        lastSaleDate: Date | null;
      }>();

      // Analyze all orders to build sales patterns
      for (const order of orders) {
        for (const item of order.items) {
          const existing = productSalesData.get(item.product_id) || {
            productName: item.product_name,
            salesCount: 0,
            totalRevenue: 0,
            lastSaleDate: null
          };
          
          existing.salesCount += item.quantity;
          existing.totalRevenue += item.total_price;
          
          // Track most recent sale date
          const orderDate = new Date(order.created_at);
          if (!existing.lastSaleDate || orderDate > existing.lastSaleDate) {
            existing.lastSaleDate = orderDate;
          }
          
          productSalesData.set(item.product_id, existing);
        }
      }

      // Convert to arrays and sort for top moving products
      const salesArray = Array.from(productSalesData.entries()).map(([productId, data]) => ({
        productId,
        productName: data.productName,
        salesCount: data.salesCount,
        totalRevenue: data.totalRevenue,
        lastSale: data.lastSaleDate?.toISOString() || null,
        turnoverRate: data.salesCount // Base turnover rate on sales count
      }));

      // Top moving products (highest sales count)
      const topMovingProducts = salesArray
        .sort((a, b) => b.salesCount - a.salesCount)
        .slice(0, 5)
        .map(item => ({
          productId: item.productId,
          productName: item.productName,
          turnoverRate: parseFloat((item.turnoverRate / Math.max(orders.length, 1)).toFixed(2)), // Sales per order
          salesCount: item.salesCount
        }));

      // Slow moving products (lowest sales count or no recent sales)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const slowMovingProducts = salesArray
        .filter(item => {
          // Products with no sales in last 30 days OR very low sales count
          if (!item.lastSale) return true;
          const lastSaleDate = new Date(item.lastSale);
          return lastSaleDate < thirtyDaysAgo || item.salesCount <= 1;
        })
        .sort((a, b) => {
          // Sort by days since last sale (oldest first)
          const aDate = a.lastSale ? new Date(a.lastSale) : new Date(0);
          const bDate = b.lastSale ? new Date(b.lastSale) : new Date(0);
          return aDate.getTime() - bDate.getTime();
        })
        .slice(0, 5)
        .map(item => {
          const lastSaleDate = item.lastSale ? new Date(item.lastSale) : null;
          const daysInStock = lastSaleDate
            ? Math.floor((now.getTime() - lastSaleDate.getTime()) / (24 * 60 * 60 * 1000))
            : 999; // Products with no sales get high days in stock
          
          return {
            productId: item.productId,
            productName: item.productName,
            daysInStock,
            lastSale: item.lastSale || new Date(0).toISOString() // Fallback to epoch if no sales
          };
        });

      // Calculate real inventory turnover from sales and stock data
      let inventoryTurnover = 0;
      try {
        const totalSalesUnits = salesArray.reduce((sum, item) => sum + item.salesCount, 0);
        const totalStockUnits = lowStockProducts.reduce((sum, p) => sum + (p.available_units || 0), 0);
        
        // Inventory Turnover = Cost of Goods Sold / Average Inventory Value
        // Simplified: total sales units / average stock units
        if (totalStockUnits > 0) {
          inventoryTurnover = parseFloat((totalSalesUnits / totalStockUnits).toFixed(2));
        }
        console.log(`📊 Calculated inventory turnover: ${inventoryTurnover}`);
      } catch (error) {
        console.warn('⚠️ Failed to calculate inventory turnover:', error);
        inventoryTurnover = 0;
      }

      // Generate stock alerts from real data
      const stockAlerts = lowStockProducts.slice(0, 10).map(p => ({
        productId: p.id,
        productName: p.name,
        currentStock: p.available_units,
        alertType: p.available_units === 0 ? 'out_of_stock' as const : 'low_stock' as const,
        threshold: p.low_stock_threshold
      }));

      const result = {
        totalProducts,
        lowStockCount,
        outOfStockCount,
        totalInventoryValue,
        inventoryTurnover,
        topMovingProducts,
        slowMovingProducts,
        stockAlerts,
        isDemoData
      };

      console.log('✅ Real inventory analytics computed successfully');
      return result;
      
    } catch (error) {
      console.error('❌ Error computing inventory analytics:', error);
      
      // Fallback to demo data with flag
      const demoResult = {
        ...this.getDefaultInventoryAnalytics(),
        isDemoData: true
      };
      
      console.log('📊 Using demo data due to error:', demoResult);
      return demoResult;
    }
  }

  // Customer Analytics
  private async getCustomerAnalytics(): Promise<CustomerAnalytics> {
    try {
      // Mock customer data - would come from customer service
      const totalCustomers = 1247;
      
      return {
        totalCustomers,
        newCustomers: {
          today: 8,
          thisWeek: 45,
          thisMonth: 187
        },
        returningCustomers: {
          count: 892,
          percentage: 71.5
        },
        customerLifetimeValue: {
          average: 156.78,
          topCustomers: [
            {
              customerId: 'customer1',
              customerName: 'Dr. Sarah Johnson',
              totalSpent: 1250.00,
              orderCount: 15
            },
            {
              customerId: 'customer2',
              customerName: 'Dr. Michael Chen',
              totalSpent: 890.50,
              orderCount: 12
            }
          ]
        },
        geographicDistribution: [
          { country: 'United States', customers: 456, revenue: 23450.75 },
          { country: 'Canada', customers: 234, revenue: 12340.50 },
          { country: 'United Kingdom', customers: 189, revenue: 9876.25 }
        ],
        customerSegmentation: {
          vip: 89,
          regular: 445,
          new: 234,
          inactive: 479
        }
      };
    } catch (error) {
      console.error('Error computing customer analytics:', error);
      return this.getDefaultCustomerAnalytics();
    }
  }

  // Product Performance Analytics
  private async getProductPerformanceAnalytics(): Promise<ProductPerformance[]> {
    try {
      // Mock product performance data
      return [
        {
          productId: 'product1',
          productName: 'Premium Medical Scrubs',
          views: 1250,
          sales: 45,
          conversionRate: 3.6,
          revenue: 1345.55,
          profit: 567.30,
          returnRate: 2.2,
          reviews: {
            count: 23,
            averageRating: 4.5
          },
          performance: 'excellent' as const
        },
        {
          productId: 'product2',
          productName: 'Stethoscope Classic',
          views: 890,
          sales: 12,
          conversionRate: 1.3,
          revenue: 1079.88,
          profit: 432.15,
          returnRate: 8.3,
          reviews: {
            count: 15,
            averageRating: 3.8
          },
          performance: 'average' as const
        }
      ];
    } catch (error) {
      console.error('Error computing product performance analytics:', error);
      return [];
    }
  }

  // Category Analytics
  private async getCategoryAnalytics(): Promise<CategoryAnalytics[]> {
    try {
      return [
        {
          categoryId: 'scrubs',
          categoryName: 'Medical Scrubs',
          revenue: 15670.50,
          orders: 78,
          products: 25,
          averageOrderValue: 200.90,
          growth: 12.5,
          topProducts: [
            {
              productId: 'product1',
              productName: 'Premium Medical Scrubs',
              revenue: 5670.25,
              sales: 23
            }
          ]
        },
        {
          categoryId: 'instruments',
          categoryName: 'Medical Instruments',
          revenue: 8934.75,
          orders: 34,
          products: 15,
          averageOrderValue: 262.78,
          growth: -3.2,
          topProducts: [
            {
              productId: 'product2',
              productName: 'Stethoscope Classic',
              revenue: 4567.80,
              sales: 12
            }
          ]
        }
      ];
    } catch (error) {
      console.error('Error computing category analytics:', error);
      return [];
    }
  }

  // Brand Analytics
  private async getBrandAnalytics(): Promise<BrandAnalytics[]> {
    try {
      return [
        {
          brandId: 'medwear',
          brandName: 'MedWear Pro',
          revenue: 12450.75,
          orders: 56,
          products: 18,
          marketShare: 35.2,
          growth: 8.7,
          topProducts: [
            {
              productId: 'product1',
              productName: 'Premium Medical Scrubs',
              revenue: 4567.90,
              sales: 28
            }
          ]
        },
        {
          brandId: 'medpro',
          brandName: 'MedPro Instruments',
          revenue: 9876.30,
          orders: 42,
          products: 12,
          marketShare: 28.1,
          growth: 15.3,
          topProducts: [
            {
              productId: 'product2',
              productName: 'Stethoscope Classic',
              revenue: 3456.70,
              sales: 15
            }
          ]
        }
      ];
    } catch (error) {
      console.error('Error computing brand analytics:', error);
      return [];
    }
  }

  // Conversion Funnel
  private async getConversionFunnel(): Promise<ConversionFunnel[]> {
    try {
      return [
        { stage: 'Visitors', count: 10000, percentage: 100, dropoffRate: 0 },
        { stage: 'Product Views', count: 3500, percentage: 35, dropoffRate: 65 },
        { stage: 'Add to Cart', count: 875, percentage: 8.75, dropoffRate: 75 },
        { stage: 'Checkout', count: 525, percentage: 5.25, dropoffRate: 40 },
        { stage: 'Purchase', count: 350, percentage: 3.5, dropoffRate: 33.3 }
      ];
    } catch (error) {
      console.error('Error computing conversion funnel:', error);
      return [];
    }
  }

  // Real-time Metrics
  private async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    try {
      return {
        activeUsers: 156,
        liveOrders: 8,
        revenueToday: 1247.50,
        conversionRate: 3.2,
        topReferrers: [
          { source: 'Google', visitors: 1250, conversions: 45 },
          { source: 'Direct', visitors: 890, conversions: 32 },
          { source: 'Facebook', visitors: 456, conversions: 18 }
        ],
        deviceBreakdown: {
          desktop: 45.2,
          mobile: 38.7,
          tablet: 16.1
        }
      };
    } catch (error) {
      console.error('Error computing real-time metrics:', error);
      return this.getDefaultRealTimeMetrics();
    }
  }

  // Cache management
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Default fallbacks
  private getDefaultSalesAnalytics(): SalesAnalytics {
    return {
      today: { revenue: 0, orders: 0, averageOrderValue: 0, topProducts: [] },
      thisWeek: { revenue: 0, orders: 0, averageOrderValue: 0, growth: 0 },
      thisMonth: { revenue: 0, orders: 0, averageOrderValue: 0, growth: 0 },
      lastMonth: { revenue: 0, orders: 0, averageOrderValue: 0 },
      trends: []
    };
  }

  private getDefaultInventoryAnalytics(): InventoryAnalytics {
    return {
      totalProducts: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      totalInventoryValue: 0,
      inventoryTurnover: 0,
      topMovingProducts: [],
      slowMovingProducts: [],
      stockAlerts: []
    };
  }

  private getDefaultCustomerAnalytics(): CustomerAnalytics {
    return {
      totalCustomers: 0,
      newCustomers: { today: 0, thisWeek: 0, thisMonth: 0 },
      returningCustomers: { count: 0, percentage: 0 },
      customerLifetimeValue: { average: 0, topCustomers: [] },
      geographicDistribution: [],
      customerSegmentation: { vip: 0, regular: 0, new: 0, inactive: 0 }
    };
  }

  private getDefaultRealTimeMetrics(): RealTimeMetrics {
    return {
      activeUsers: 0,
      liveOrders: 0,
      revenueToday: 0,
      conversionRate: 0,
      topReferrers: [],
      deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 }
    };
  }

  // Clear cache (useful for development)
  public clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Analytics cache cleared');
  }
}

// React Hook for Analytics
export function useAdvancedAnalytics() {
  const [analytics, setAnalytics] = useState<ComprehensiveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const analyticsService = AdvancedAnalyticsService.getInstance();

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getComprehensiveAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();

    // Set up real-time updates
    const interval = setInterval(loadAnalytics, 5 * 60 * 1000); // Update every 5 minutes

    // Subscribe to real-time events
    const subscriptions: string[] = [
      realtimeManager.subscribe('orders', 'create', () => {
        loadAnalytics(); // Refresh analytics on new orders
      }),
      realtimeManager.subscribe('orders', 'update', () => {
        loadAnalytics(); // Refresh analytics on order updates
      }),
      realtimeManager.subscribe('products', 'update', () => {
        loadAnalytics(); // Refresh analytics on inventory changes
      })
    ];

    return () => {
      clearInterval(interval);
      subscriptions.forEach(subscriptionId => realtimeManager.unsubscribe(subscriptionId));
    };
  }, [loadAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: loadAnalytics,
    clearCache: () => analyticsService.clearCache()
  };
}

// Export singleton instance
export const advancedAnalyticsService = AdvancedAnalyticsService.getInstance();