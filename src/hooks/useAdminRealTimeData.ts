// Real-time Admin Dashboard Integration
// Provides live data synchronization across all admin panel components

import { useEffect, useState, useCallback, useRef } from 'react';
import { realtimeManager } from '../lib/realtime-subscriptions';
import { mockInventoryService } from '../lib/inventory-types';
import { orderProcessingService, Order } from '../lib/order-processing-service';

// Real-time Products page data
export interface ProductData {
  id: string;
  name: string;
  sku?: string;
  price: number;
  discount_price?: number;
  available_units: number;
  reserved_units: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  category_id: string;
  brand_id: string;
  is_active: boolean;
  is_featured: boolean;
  sales_count: number;
  last_restocked_at?: string;
  low_stock_threshold: number;
  image_url?: string;
  updated_at: string;
}

// Real-time Orders page data
export interface OrderData {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: Order['status'];
  payment_status: Order['payment_status'];
  fulfillment_status: Order['fulfillment_status'];
  total_amount: number;
  currency: string;
  item_count: number;
  created_at: string;
  updated_at: string;
  payment_method: string;
  shipping_address: {
    city: string;
    country: string;
  };
}

// Real-time Analytics data
export interface AnalyticsData {
  sales_today: number;
  orders_today: number;
  revenue_this_month: number;
  revenue_last_month: number;
  average_order_value: number;
  conversion_rate: number;
  total_customers: number;
  low_stock_products: number;
  out_of_stock_products: number;
  top_selling_products: Array<{
    product_id: string;
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  recent_orders: OrderData[];
  inventory_alerts: Array<{
    product_id: string;
    product_name: string;
    alert_type: 'low_stock' | 'out_of_stock';
    current_stock: number;
    threshold: number;
  }>;
}

// Admin Real-time Data Hook
export function useAdminRealTimeData() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Store subscription IDs for cleanup
  const subscriptionIdsRef = useRef<string[]>([]);
  // Track if subscriptions are already set up to prevent duplicates
  const subscriptionsSetupRef = useRef(false);

  // Analytics update methods
  const updateAnalyticsFromOrderCreate = useCallback((order: OrderData) => {
    setAnalytics(prev => {
      if (!prev) return null;

      const updated = { ...prev };
      const today = new Date().toDateString();
      const orderDate = new Date(order.created_at).toDateString();
      
      if (today === orderDate) {
        updated.orders_today = (updated.orders_today || 0) + 1;
        updated.sales_today = (updated.sales_today || 0) + order.total_amount;
      }

      // Add to recent orders
      updated.recent_orders = [order, ...updated.recent_orders.slice(0, 9)];

      // Update monthly revenue and recalculate average order value
      updated.revenue_this_month = (updated.revenue_this_month || 0) + order.total_amount;
      // Note: You'll need to track orders_this_month in AnalyticsData interface
      // For now, this calculation is removed until proper monthly order tracking is added

      return updated;
    });
  }, []);

  // Stock movement handler
  const handleStockMovement = useCallback((movement: any) => {
    console.log('📦 Stock movement recorded:', movement);
    // Could trigger additional UI updates or notifications
  }, []);

  // Inventory alert handler
  const handleInventoryAlert = useCallback((alert: any) => {
    console.log('🚨 Inventory alert:', alert.message);
    // Update analytics to show new alerts
    setAnalytics(prev => prev ? {
      ...prev,
      inventory_alerts: [alert, ...prev.inventory_alerts.slice(0, 9)] // Keep last 10 alerts
    } : null);
  }, []);

  // Product event handlers
  const handleProductUpdate = useCallback((product: any) => {
    setProducts(prev => {
      const index = prev.findIndex(p => p.id === product.product_id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          available_units: product.available_units || updated[index].available_units,
          stock_status: product.stock_status || updated[index].stock_status,
          updated_at: product.updated_at || new Date().toISOString()
        };
        return updated;
      }
      return prev;
    });

    // Update analytics inline to avoid dependency
    setAnalytics(prev => {
      if (!prev || !product.stock_status) return prev;
      
      const updated = { ...prev };
      switch (product.stock_status) {
        case 'low_stock':
          updated.low_stock_products = (updated.low_stock_products || 0) + 1;
          break;
        case 'out_of_stock':
          updated.out_of_stock_products = (updated.out_of_stock_products || 0) + 1;
          break;
      }
      return updated;
    });
  }, []);

  const handleProductCreate = useCallback((product: any) => {
    const newProduct: ProductData = {
      id: product.product_id,
      name: product.name,
      price: product.price,
      available_units: product.available_units || 0,
      reserved_units: product.reserved_units || 0,
      stock_status: product.stock_status || 'in_stock',
      category_id: product.category_id,
      brand_id: product.brand_id,
      is_active: product.is_active || false,
      is_featured: product.is_featured || false,
      sales_count: 0,
      low_stock_threshold: 5,
      updated_at: product.created_at || new Date().toISOString()
    };

    setProducts(prev => [newProduct, ...prev]);
  }, []);

  // Order event handlers
  const handleOrderCreate = useCallback((order: any) => {
    const orderData: OrderData = {
      id: order.order_id,
      order_number: order.order_number,
      customer_name: order.customer_name || 'Guest',
      customer_email: order.customer_email,
      status: order.order_status,
      payment_status: order.payment_status,
      fulfillment_status: order.fulfillment_status,
      total_amount: order.total_amount,
      currency: order.currency || 'USD',
      item_count: order.items?.length || 0,
      created_at: order.created_at,
      updated_at: order.created_at,
      payment_method: order.payment_method,
      shipping_address: order.shipping_address
    };

    setOrders(prev => [orderData, ...prev]);
    updateAnalyticsFromOrderCreate(orderData);
  }, [updateAnalyticsFromOrderCreate]);

  const handleOrderUpdate = useCallback((order: any) => {
    setOrders(prev => {
      const index = prev.findIndex(o => o.id === order.order_id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: order.order_status || updated[index].status,
          payment_status: order.payment_status || updated[index].payment_status,
          fulfillment_status: order.fulfillment_status || updated[index].fulfillment_status,
          updated_at: order.updated_at || new Date().toISOString()
        };
        return updated;
      }
      return prev;
    });
  }, []);

  const cleanup = useCallback(() => {
    // Unsubscribe from all real-time subscriptions
    subscriptionIdsRef.current.forEach(subscriptionId => {
      try {
        realtimeManager.unsubscribe(subscriptionId);
      } catch (error) {
        console.error('Error unsubscribing from subscription:', error);
      }
    });
    // Clear the subscription IDs array
    subscriptionIdsRef.current = [];
    
    // Reset subscription state
    subscriptionsSetupRef.current = false;
    // Don't modify isInitialized here as it causes re-renders
    
    console.log('🧹 Cleaned up all admin real-time subscriptions');
  }, []);

  const setupRealTimeSubscriptions = useCallback(() => {
    // Prevent duplicate subscriptions
    if (subscriptionsSetupRef.current) {
      return;
    }

    // Subscribe to product updates
    const productUpdateSubId = realtimeManager.subscribe('products', 'update', (event) => {
      handleProductUpdate(event.document);
    });
    subscriptionIdsRef.current.push(productUpdateSubId);

    const productCreateSubId = realtimeManager.subscribe('products', 'create', (event) => {
      handleProductCreate(event.document);
    });
    subscriptionIdsRef.current.push(productCreateSubId);

    // Subscribe to order updates
    const orderCreateSubId = realtimeManager.subscribe('orders', 'create', (event) => {
      handleOrderCreate(event.document);
    });
    subscriptionIdsRef.current.push(orderCreateSubId);

    const orderUpdateSubId = realtimeManager.subscribe('orders', 'update', (event) => {
      handleOrderUpdate(event.document);
    });
    subscriptionIdsRef.current.push(orderUpdateSubId);

    // Subscribe to stock movements for real-time updates
    const stockMovementSubId = realtimeManager.subscribe('stock_movements', 'create', (event) => {
      handleStockMovement(event.document);
    });
    subscriptionIdsRef.current.push(stockMovementSubId);

    // Subscribe to inventory alerts
    const inventoryAlertSubId = realtimeManager.subscribe('inventory_alerts', 'create', (event) => {
      handleInventoryAlert(event.document);
    });
    subscriptionIdsRef.current.push(inventoryAlertSubId);

    // Mark subscriptions as setup
    subscriptionsSetupRef.current = true;
  }, [handleProductUpdate, handleProductCreate, handleOrderCreate, handleOrderUpdate, handleStockMovement, handleInventoryAlert]);

  // Initialize data and subscriptions only once
  useEffect(() => {
    loadInitialData();
    setupRealTimeSubscriptions();
    setIsInitialized(true);
    
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load products with real-time inventory data
      const productsData = await loadProductsData();
      setProducts(productsData);

      // Load orders
      const ordersData = await loadOrdersData();
      setOrders(ordersData);

      // Load analytics with already-loaded orders data to avoid duplicate API calls
      const analyticsData = await loadAnalyticsData(ordersData);
      setAnalytics(analyticsData);

    } catch (err) {
      console.error('Error loading admin data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Data loading methods
  const loadProductsData = async (): Promise<ProductData[]> => {
    try {
      // Fetch real data from Appwrite
      const response = await fetch('/api/admin/products?limit=1000');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      
      // Transform Appwrite products to ProductData format
      const products: ProductData[] = (data.products || []).map((product: any) => ({
        id: product.$id,
        name: product.name || 'Unnamed Product',
        sku: product.sku || '',
        price: parseFloat(product.price) || 0,
        discount_price: product.discount_price ? parseFloat(product.discount_price) : undefined,
        available_units: parseFloat(product.available_units || product.units || '0'),
        reserved_units: parseFloat(product.reserved_units || '0'),
        stock_status: product.stock_status || 'in_stock',
        category_id: product.category_id || '',
        brand_id: product.brand_id || '',
        is_active: product.is_active !== false,
        is_featured: product.is_featured || false,
        sales_count: product.sales_count || 0,
        last_restocked_at: product.last_restocked_at,
        low_stock_threshold: product.min_order_quantity || 5,
        image_url: product.image_url,
        updated_at: product.$updatedAt || product.$createdAt || new Date().toISOString()
      }));

      console.log(`📦 Loaded ${products.length} products from Appwrite`);
      return products;
    } catch (error) {
      console.error('Error loading products data:', error);
      return [];
    }
  };

  const loadOrdersData = async (): Promise<OrderData[]> => {
    try {
      // Fetch real orders from Appwrite via admin endpoint
      const response = await fetch('/api/admin/orders?limit=1000');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      
      // Transform Appwrite orders to OrderData format
      const orders: OrderData[] = (data.orders || []).map((order: any) => ({
        id: order.$id,
        order_number: order.order_number || order.order_code || order.$id,
        customer_name: order.customer_name || 'Guest',
        customer_email: order.customer_email || '',
        status: order.order_status || order.status || 'pending',
        payment_status: order.payment_status || 'pending',
        fulfillment_status: order.fulfillment_status || 'unfulfilled',
        total_amount: parseFloat(order.total_amount || order.payable_amount || '0'),
        currency: order.currency || 'USD',
        item_count: order.item_count || (order.items ? (Array.isArray(order.items) ? order.items.length : 0) : 0),
        created_at: order.$createdAt || order.created_at || new Date().toISOString(),
        updated_at: order.$updatedAt || order.updated_at || order.$createdAt || new Date().toISOString(),
        payment_method: order.payment_method || 'unknown',
        shipping_address: {
          city: order.shipping_city || order.shipping_address?.city || '',
          country: order.shipping_country || order.shipping_address?.country || ''
        }
      }));

      console.log(`📋 Loaded ${orders.length} orders from Appwrite`);
      return orders;
    } catch (error) {
      console.error('Error loading orders data:', error);
      return [];
    }
  };

  const loadAnalyticsData = async (ordersData: OrderData[]): Promise<AnalyticsData> => {
    try {
      // Calculate real analytics from actual orders data
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const thisMonth = today.getMonth();
      const thisYear = today.getFullYear();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
      
      // Filter orders by date
      const todaysOrders = ordersData.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= today;
      });
      
      const thisMonthsOrders = ordersData.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear;
      });
      
      const lastMonthsOrders = ordersData.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastMonthYear;
      });
      
      // Calculate paid orders only for revenue
      const paidTodaysOrders = todaysOrders.filter(o => o.payment_status === 'paid');
      const paidThisMonthOrders = thisMonthsOrders.filter(o => o.payment_status === 'paid');
      const paidLastMonthOrders = lastMonthsOrders.filter(o => o.payment_status === 'paid');
      
      // Calculate metrics
      const sales_today = paidTodaysOrders.reduce((sum, order) => sum + order.total_amount, 0);
      const orders_today = todaysOrders.length;
      const revenue_this_month = paidThisMonthOrders.reduce((sum, order) => sum + order.total_amount, 0);
      const revenue_last_month = paidLastMonthOrders.reduce((sum, order) => sum + order.total_amount, 0);
      const average_order_value = paidThisMonthOrders.length > 0 
        ? revenue_this_month / paidThisMonthOrders.length 
        : 0;
      
      // Calculate unique customers
      const uniqueCustomers = new Set(
        ordersData
          .filter(o => o.customer_email && o.customer_email !== '')
          .map(o => o.customer_email)
      );
      const total_customers = uniqueCustomers.size;
      
      // Get low stock and out of stock products
      const response = await fetch('/api/admin/inventory/low-stock?threshold=10');
      const inventoryData = response.ok ? await response.json() : { grouped: { low: [], critical: [], out: [] } };
      
      const low_stock_products = (inventoryData.grouped?.low?.length || 0) + (inventoryData.grouped?.critical?.length || 0);
      const out_of_stock_products = inventoryData.grouped?.out?.length || 0;
      
      // Calculate top selling products (by sales count from product data)
      const productsResponse = await fetch('/api/products?limit=1000');
      const productsData = productsResponse.ok ? await productsResponse.json() : { products: [] };
      const top_selling_products = (productsData.products || [])
        .filter((p: any) => p.sales_count > 0)
        .sort((a: any, b: any) => (b.sales_count || 0) - (a.sales_count || 0))
        .slice(0, 5)
        .map((p: any) => ({
          product_id: p.$id,
          product_name: p.name,
          quantity_sold: p.sales_count || 0,
          revenue: (p.sales_count || 0) * (parseFloat(p.discount_price || p.price) || 0)
        }));
      
      // Generate inventory alerts from low stock products
      const inventory_alerts = [
        ...(inventoryData.grouped?.critical || []).map((p: any) => ({
          product_id: p.$id,
          product_name: p.name,
          alert_type: 'low_stock' as const,
          current_stock: p.currentStock,
          threshold: p.threshold
        })),
        ...(inventoryData.grouped?.out || []).map((p: any) => ({
          product_id: p.$id,
          product_name: p.name,
          alert_type: 'out_of_stock' as const,
          current_stock: p.currentStock,
          threshold: p.threshold
        }))
      ].slice(0, 10);
      
      console.log('📊 Calculated real analytics:', {
        sales_today,
        orders_today,
        revenue_this_month,
        total_customers,
        low_stock_products,
        out_of_stock_products
      });
      
      return {
        sales_today,
        orders_today,
        revenue_this_month,
        revenue_last_month,
        average_order_value,
        conversion_rate: 0, // Would need page view data to calculate
        total_customers,
        low_stock_products,
        out_of_stock_products,
        top_selling_products,
        recent_orders: ordersData.slice(0, 10),
        inventory_alerts
      };
    } catch (error) {
      console.error('Error loading analytics data:', error);
      // Return default analytics
      return {
        sales_today: 0,
        orders_today: 0,
        revenue_this_month: 0,
        revenue_last_month: 0,
        average_order_value: 0,
        conversion_rate: 0,
        total_customers: 0,
        low_stock_products: 0,
        out_of_stock_products: 0,
        top_selling_products: [],
        recent_orders: ordersData.slice(0, 10),
        inventory_alerts: []
      };
    }
  };

  return {
    products,
    orders,
    analytics,
    loading,
    error,
    refetch: loadInitialData
  };
}

// Real-time notification system for admin
export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }>>([]);

  // Map to store timeout IDs keyed by notification ID for proper cleanup
  const timeoutsMapRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    // Subscribe to all real-time events for notifications
    const createNotificationHandlers = () => {
      // For now, use simple event handlers that don't require complex subscription management
      console.log('🔔 Admin notifications subsystem initialized');
    };

    createNotificationHandlers();

    // Cleanup: clear all pending timeouts on unmount to prevent memory leaks
    return () => {
      timeoutsMapRef.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeoutsMapRef.current.clear();
      console.log('🧹 Cleaned up all notification timeouts');
    };
  }, []);

  const addNotification = useCallback((
    type: 'info' | 'warning' | 'error' | 'success',
    title: string,
    message: string
  ) => {
    // Generate truly unique ID using crypto.randomUUID()
    const notificationId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const notification = {
      id: notificationId,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50 notifications

    // Auto-remove after 10 seconds for non-error notifications
    if (type !== 'error') {
      const timeoutId = setTimeout(() => {
        removeNotification(notificationId);
      }, 10000);
      
      // Store timeout ID in Map for later cleanup
      timeoutsMapRef.current.set(notificationId, timeoutId);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    // Clear and remove any pending timeout for this notification
    const timeoutId = timeoutsMapRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsMapRef.current.delete(id);
    }
    
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const clearAll = useCallback(() => {
    // Clear all pending timeouts before clearing notifications
    timeoutsMapRef.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    timeoutsMapRef.current.clear();
    
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    clearAll
  };
}

export default useAdminRealTimeData;