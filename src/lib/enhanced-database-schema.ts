// Enhanced Appwrite Database Schema for E-commerce Inventory Management & Analytics
// Production-ready schema with real-time tracking and advanced analytics support

export interface EnhancedCollectionDefinition {
  name: string;
  id: string;
  attributes: EnhancedAttributeDefinition[];
  indexes?: EnhancedIndexDefinition[];
  description?: string;
  realTimeEnabled?: boolean;
}

export interface EnhancedAttributeDefinition {
  key: string;
  type: 'string' | 'integer' | 'float' | 'boolean' | 'email' | 'url' | 'datetime' | 'json' | 'array' | 'relation';
  required: boolean;
  default?: any;
  size?: number;
  array?: boolean;
  relationCollection?: string;
  relationField?: string;
  description?: string;
}

export interface EnhancedIndexDefinition {
  key: string;
  type: 'key' | 'unique' | 'fulltext';
  attributes: string[];
  description?: string;
}

// Enhanced Products Collection - Core inventory tracking
export const ENHANCED_COLLECTIONS: Record<string, EnhancedCollectionDefinition> = {
  // ENHANCED PRODUCTS COLLECTION
  products: {
    name: 'Products',
    id: 'products',
    description: 'Enhanced products collection with comprehensive inventory tracking',
    realTimeEnabled: true,
    attributes: [
      // Basic Information
      { key: 'name', type: 'string', required: true, size: 255, description: 'Product name' },
      { key: 'slug', type: 'string', required: true, size: 255, description: 'URL slug' },
      { key: 'description', type: 'string', required: true, size: 2000, description: 'Product description' },

      // Pricing
      { key: 'price', type: 'float', required: true, description: 'Base price' },
      { key: 'discount_price', type: 'float', required: false, description: 'Discounted price' },
      { key: 'compare_at_price', type: 'float', required: false, description: 'Compare at price for display' },
      { key: 'cost_per_item', type: 'float', required: false, description: 'Cost price for margin calculation' },

      // Enhanced Inventory Management
      { key: 'units', type: 'integer', required: true, default: 0, description: 'Current stock quantity' },
      { key: 'reserved_units', type: 'integer', required: true, default: 0, description: 'Reserved stock for active carts' },
      { key: 'available_units', type: 'integer', required: true, default: 0, description: 'Available stock (units - reserved_units)' },
      { key: 'min_stock_level', type: 'integer', required: true, default: 5, description: 'Low stock threshold' },
      { key: 'max_stock_level', type: 'integer', required: false, description: 'Maximum stock level' },
      { key: 'reorder_point', type: 'integer', required: false, description: 'Reorder point level' },
      { key: 'safety_stock', type: 'integer', required: false, description: 'Safety stock buffer' },
      { key: 'stock_status', type: 'string', required: true, default: 'in_stock', description: 'stock_status: in_stock, low_stock, out_of_stock, discontinued' },
      { key: 'track_inventory', type: 'boolean', required: true, default: true, description: 'Whether to track inventory for this product' },
      { key: 'allow_backorder', type: 'boolean', required: true, default: false, description: 'Allow orders when out of stock' },

      // Organization
      { key: 'brand_id', type: 'string', required: true, size: 255, description: 'Brand association' },
      { key: 'category_id', type: 'string', required: true, size: 255, description: 'Category association' },
      { key: 'sku', type: 'string', required: false, size: 100, description: 'Stock keeping unit' },
      { key: 'barcode', type: 'string', required: false, size: 100, description: 'Product barcode' },

      // Status & Flags
      { key: 'is_active', type: 'boolean', required: true, default: true, description: 'Product is active' },
      { key: 'is_new', type: 'boolean', required: true, default: false, description: 'Mark as new product' },
      { key: 'is_featured', type: 'boolean', required: true, default: false, description: 'Featured product flag' },
      { key: 'has_variations', type: 'boolean', required: true, default: false, description: 'Product has variations' },
      { key: 'is_digital', type: 'boolean', required: true, default: false, description: 'Digital product (no shipping)' },

      // Performance Metrics
      { key: 'total_sold', type: 'integer', required: true, default: 0, description: 'Total units sold' },
      { key: 'total_revenue', type: 'float', required: true, default: 0, description: 'Total revenue generated' },
      { key: 'view_count', type: 'integer', required: true, default: 0, description: 'Product page views' },
      { key: 'conversion_rate', type: 'float', required: true, default: 0, description: 'Conversion rate percentage' },
      { key: 'return_rate', type: 'float', required: true, default: 0, description: 'Return rate percentage' },

      // Timing & Analytics
      { key: 'last_sold_at', type: 'datetime', required: false, description: 'Last sale timestamp' },
      { key: 'last_restocked_at', type: 'datetime', required: false, description: 'Last restock timestamp' },
      { key: 'last_viewed_at', type: 'datetime', required: false, description: 'Last product view' },
      { key: 'created_at', type: 'datetime', required: false, description: 'Product creation date' },
      { key: 'updated_at', type: 'datetime', required: false, description: 'Last update timestamp' },

      // SEO & Meta
      { key: 'meta_title', type: 'string', required: false, size: 255, description: 'SEO meta title' },
      { key: 'meta_description', type: 'string', required: false, size: 500, description: 'SEO meta description' },
      { key: 'meta_keywords', type: 'string', required: false, size: 1000, description: 'SEO keywords' },

      // Product Variations
      { key: 'variations', type: 'json', required: false, description: 'Product variations data' },
      { key: 'color_options', type: 'json', required: false, description: 'Available color options' },
      { key: 'size_options', type: 'json', required: false, description: 'Available size options' },

      // Images & Media
      { key: 'main_image_id', type: 'string', required: false, size: 36, description: 'Main product image ID' },
      { key: 'gallery_images', type: 'json', required: false, description: 'Product gallery images' },
      { key: 'image_variations', type: 'json', required: false, description: 'Images for different variations' },

      // Advanced Analytics
      { key: 'tags', type: 'array', required: false, description: 'Product tags for analytics' },
      { key: 'weight', type: 'float', required: false, description: 'Product weight for shipping' },
      { key: 'dimensions', type: 'json', required: false, description: 'Product dimensions' },
      { key: 'supplier_info', type: 'json', required: false, description: 'Supplier information' }
    ],
    indexes: [
      { key: 'name_search', type: 'fulltext', attributes: ['name', 'description'], description: 'Full-text search on name and description' },
      { key: 'slug_unique', type: 'unique', attributes: ['slug'], description: 'Unique product slug' },
      { key: 'brand_category', type: 'key', attributes: ['brand_id', 'category_id'], description: 'Filter by brand and category' },
      { key: 'active_products', type: 'key', attributes: ['is_active'], description: 'Filter active products' },
      { key: 'featured_products', type: 'key', attributes: ['is_featured'], description: 'Filter featured products' },
      { key: 'low_stock', type: 'key', attributes: ['stock_status'], description: 'Filter by stock status' },
      { key: 'price_range', type: 'key', attributes: ['price'], description: 'Price-based queries' },
      { key: 'performance', type: 'key', attributes: ['total_sold', 'view_count'], description: 'Performance analytics queries' },
      { key: 'timestamps', type: 'key', attributes: ['$createdAt', '$updatedAt'], description: 'Time-based queries' }
    ]
  },

  // STOCK MOVEMENTS COLLECTION - Real-time inventory tracking
  stock_movements: {
    name: 'Stock Movements',
    id: 'stock_movements',
    description: 'Real-time stock movement tracking for inventory audit trail',
    realTimeEnabled: true,
    attributes: [
      { key: 'product_id', type: 'string', required: true, size: 36, description: 'Product ID' },
      { key: 'movement_type', type: 'string', required: true, description: 'Type: sale, restock, adjustment, return, damage, transfer' },
      { key: 'quantity_change', type: 'integer', required: true, description: 'Positive for additions, negative for reductions' },
      { key: 'quantity_before', type: 'integer', required: true, description: 'Stock quantity before movement' },
      { key: 'quantity_after', type: 'integer', required: true, description: 'Stock quantity after movement' },
      { key: 'reference_id', type: 'string', required: false, size: 36, description: 'Order ID, Purchase ID, or adjustment reference' },
      { key: 'reference_type', type: 'string', required: false, description: 'order, purchase, manual, return, etc.' },
      { key: 'reason', type: 'string', required: false, size: 500, description: 'Reason for the movement' },
      { key: 'notes', type: 'string', required: false, size: 1000, description: 'Additional notes' },
      { key: 'user_id', type: 'string', required: false, size: 36, description: 'User who initiated the movement' },
      { key: 'admin_id', type: 'string', required: false, size: 36, description: 'Admin who made the change' },
      { key: 'cost_impact', type: 'float', required: false, description: 'Cost impact of the movement' },
      { key: 'location', type: 'string', required: false, description: 'Storage location' },
      { key: 'batch_number', type: 'string', required: false, description: 'Batch or lot number' },
      { key: 'expiry_date', type: 'datetime', required: false, description: 'Expiry date for perishable items' }
    ],
    indexes: [
      { key: 'product_movements', type: 'key', attributes: ['product_id'], description: 'All movements for a product' },
      { key: 'movement_type', type: 'key', attributes: ['movement_type'], description: 'Filter by movement type' },
      { key: 'reference_lookup', type: 'key', attributes: ['reference_id', 'reference_type'], description: 'Find movements by reference' },
      { key: 'date_range', type: 'key', attributes: ['$createdAt'], description: 'Time-based movement queries' },
      { key: 'user_actions', type: 'key', attributes: ['user_id', 'admin_id'], description: 'Track user/admin actions' }
    ]
  },

  // INVENTORY ALERTS COLLECTION - Low stock and alert management
  inventory_alerts: {
    name: 'Inventory Alerts',
    id: 'inventory_alerts',
    description: 'Inventory alerts and notifications system',
    realTimeEnabled: true,
    attributes: [
      { key: 'product_id', type: 'string', required: true, size: 36, description: 'Product ID' },
      { key: 'alert_type', type: 'string', required: true, description: 'low_stock, out_of_stock, overstock, expiry_warning' },
      { key: 'alert_level', type: 'string', required: true, description: 'warning, critical, info' },
      { key: 'current_stock', type: 'integer', required: true, description: 'Current stock level' },
      { key: 'threshold_value', type: 'integer', required: true, description: 'Alert threshold value' },
      { key: 'message', type: 'string', required: true, size: 1000, description: 'Alert message' },
      { key: 'is_active', type: 'boolean', required: true, default: true, description: 'Alert is active' },
      { key: 'is_acknowledged', type: 'boolean', required: true, default: false, description: 'Alert has been acknowledged' },
      { key: 'acknowledged_by', type: 'string', required: false, size: 36, description: 'User who acknowledged the alert' },
      { key: 'acknowledged_at', type: 'datetime', required: false, description: 'Acknowledgment timestamp' },
      { key: 'resolution_notes', type: 'string', required: false, size: 1000, description: 'Resolution notes' },
      { key: 'auto_resolve', type: 'boolean', required: true, default: false, description: 'Auto-resolve when stock normalizes' },
      { key: 'notification_sent', type: 'boolean', required: true, default: false, description: 'Notification has been sent' },
      { key: 'notification_channels', type: 'json', required: false, description: 'Channels where notification was sent' }
    ],
    indexes: [
      { key: 'active_alerts', type: 'key', attributes: ['is_active', 'alert_type'], description: 'Active alerts by type' },
      { key: 'product_alerts', type: 'key', attributes: ['product_id'], description: 'All alerts for a product' },
      { key: 'unacknowledged', type: 'key', attributes: ['is_acknowledged'], description: 'Unacknowledged alerts' },
      { key: 'alert_levels', type: 'key', attributes: ['alert_level'], description: 'Filter by alert severity' }
    ]
  },

  // ORDER ITEMS COLLECTION - Enhanced order line items
  order_items: {
    name: 'Order Items',
    id: 'order_items',
    description: 'Detailed order line items with inventory tracking',
    realTimeEnabled: true,
    attributes: [
      { key: 'order_id', type: 'string', required: true, size: 36, description: 'Order ID' },
      { key: 'product_id', type: 'string', required: true, size: 36, description: 'Product ID' },
      { key: 'product_name', type: 'string', required: true, size: 255, description: 'Product name at time of order' },
      { key: 'product_sku', type: 'string', required: false, size: 100, description: 'Product SKU at time of order' },
      { key: 'quantity', type: 'integer', required: true, description: 'Quantity ordered' },
      { key: 'unit_price', type: 'float', required: true, description: 'Unit price at time of order' },
      { key: 'total_price', type: 'float', required: true, description: 'Total price (quantity * unit_price)' },
      { key: 'discount_amount', type: 'float', required: true, default: 0, description: 'Discount applied to this item' },
      { key: 'tax_amount', type: 'float', required: true, default: 0, description: 'Tax amount for this item' },
      { key: 'variation_data', type: 'json', required: false, description: 'Product variation details (size, color, etc.)' },
      { key: 'stock_allocated', type: 'boolean', required: true, default: false, description: 'Stock has been allocated' },
      { key: 'stock_released', type: 'boolean', required: true, default: false, description: 'Stock has been released (for cancellations)' },
      { key: 'fulfillment_status', type: 'string', required: true, default: 'pending', description: 'pending, allocated, picked, packed, shipped, delivered' },
      { key: 'fulfillment_date', type: 'datetime', required: false, description: 'Fulfillment completion date' },
      { key: 'return_status', type: 'string', required: false, description: 'not_returned, return_requested, returned, refund_processed' },
      { key: 'return_date', type: 'datetime', required: false, description: 'Return date' },
      { key: 'refund_amount', type: 'float', required: false, description: 'Refund amount if returned' },
      { key: 'serial_numbers', type: 'array', required: false, description: 'Serial numbers for serialized products' },
      { key: 'weight', type: 'float', required: false, description: 'Item weight for shipping calculation' },
      { key: 'dimensions', type: 'json', required: false, description: 'Item dimensions' }
    ],
    indexes: [
      { key: 'order_items', type: 'key', attributes: ['order_id'], description: 'All items in an order' },
      { key: 'product_orders', type: 'key', attributes: ['product_id'], description: 'All orders containing a product' },
      { key: 'fulfillment_status', type: 'key', attributes: ['fulfillment_status'], description: 'Filter by fulfillment status' },
      { key: 'return_status', type: 'key', attributes: ['return_status'], description: 'Filter by return status' }
    ]
  },

  // ANALYTICS EVENTS COLLECTION - Customer behavior tracking
  analytics_events: {
    name: 'Analytics Events',
    id: 'analytics_events',
    description: 'Customer behavior and business analytics event tracking',
    realTimeEnabled: true,
    attributes: [
      { key: 'event_type', type: 'string', required: true, description: 'page_view, product_view, add_to_cart, purchase, search, etc.' },
      { key: 'user_id', type: 'string', required: false, size: 36, description: 'User ID (null for anonymous)' },
      { key: 'session_id', type: 'string', required: true, size: 36, description: 'Session identifier' },
      { key: 'product_id', type: 'string', required: false, size: 36, description: 'Related product ID' },
      { key: 'category_id', type: 'string', required: false, size: 36, description: 'Related category ID' },
      { key: 'brand_id', type: 'string', required: false, size: 36, description: 'Related brand ID' },
      { key: 'order_id', type: 'string', required: false, size: 36, description: 'Related order ID' },
      { key: 'value', type: 'float', required: false, description: 'Monetary value associated with event' },
      { key: 'properties', type: 'json', required: false, description: 'Additional event properties' },
      { key: 'source', type: 'string', required: false, description: 'Traffic source' },
      { key: 'medium', type: 'string', required: false, description: 'Marketing medium' },
      { key: 'campaign', type: 'string', required: false, description: 'Campaign name' },
      { key: 'referrer', type: 'string', required: false, description: 'Referrer URL' },
      { key: 'user_agent', type: 'string', required: false, description: 'User agent string' },
      { key: 'ip_address', type: 'string', required: false, description: 'IP address (hashed for privacy)' },
      { key: 'country', type: 'string', required: false, description: 'Country code' },
      { key: 'city', type: 'string', required: false, description: 'City name' },
      { key: 'device_type', type: 'string', required: false, description: 'mobile, tablet, desktop' },
      { key: 'browser', type: 'string', required: false, description: 'Browser name' },
      { key: 'os', type: 'string', required: false, description: 'Operating system' }
    ],
    indexes: [
      { key: 'event_type_date', type: 'key', attributes: ['event_type', '$createdAt'], description: 'Events by type and date' },
      { key: 'user_events', type: 'key', attributes: ['user_id'], description: 'All events for a user' },
      { key: 'product_events', type: 'key', attributes: ['product_id'], description: 'All events for a product' },
      { key: 'session_events', type: 'key', attributes: ['session_id'], description: 'Events in a session' },
      { key: 'conversion_events', type: 'key', attributes: ['order_id'], description: 'Purchase events' }
    ]
  },

  // SALES ANALYTICS COLLECTION - Aggregated sales data
  sales_analytics: {
    name: 'Sales Analytics',
    id: 'sales_analytics',
    description: 'Pre-aggregated sales analytics for performance',
    realTimeEnabled: true,
    attributes: [
      { key: 'period_type', type: 'string', required: true, description: 'hourly, daily, weekly, monthly, yearly' },
      { key: 'period_start', type: 'datetime', required: true, description: 'Start of period' },
      { key: 'period_end', type: 'datetime', required: true, description: 'End of period' },
      { key: 'total_orders', type: 'integer', required: true, default: 0, description: 'Total orders in period' },
      { key: 'total_revenue', type: 'float', required: true, default: 0, description: 'Total revenue in period' },
      { key: 'total_units_sold', type: 'integer', required: true, default: 0, description: 'Total units sold' },
      { key: 'average_order_value', type: 'float', required: true, default: 0, description: 'Average order value' },
      { key: 'new_customers', type: 'integer', required: true, default: 0, description: 'New customers in period' },
      { key: 'returning_customers', type: 'integer', required: true, default: 0, description: 'Returning customers' },
      { key: 'conversion_rate', type: 'float', required: true, default: 0, description: 'Conversion rate percentage' },
      { key: 'top_products', type: 'json', required: false, description: 'Top selling products' },
      { key: 'top_categories', type: 'json', required: false, description: 'Top selling categories' },
      { key: 'top_brands', type: 'json', required: false, description: 'Top selling brands' },
      { key: 'traffic_sources', type: 'json', required: false, description: 'Traffic source breakdown' },
      { key: 'geographic_data', type: 'json', required: false, description: 'Sales by location' },
      { key: 'device_breakdown', type: 'json', required: false, description: 'Device usage breakdown' },
      { key: 'return_rate', type: 'float', required: true, default: 0, description: 'Return rate percentage' },
      { key: 'refund_amount', type: 'float', required: true, default: 0, description: 'Total refunds' }
    ],
    indexes: [
      { key: 'period_lookup', type: 'key', attributes: ['period_type', 'period_start'], description: 'Query by period' },
      { key: 'date_range', type: 'key', attributes: ['period_start', 'period_end'], description: 'Date range queries' },
      { key: 'revenue_trends', type: 'key', attributes: ['total_revenue', 'total_orders'], description: 'Revenue trend analysis' }
    ]
  },

  // INVENTORY ANALYTICS COLLECTION - Inventory performance metrics
  inventory_analytics: {
    name: 'Inventory Analytics',
    id: 'inventory_analytics',
    description: 'Inventory performance and turnover analytics',
    realTimeEnabled: true,
    attributes: [
      { key: 'period_type', type: 'string', required: true, description: 'daily, weekly, monthly' },
      { key: 'period_start', type: 'datetime', required: true, description: 'Start of period' },
      { key: 'period_end', type: 'datetime', required: true, description: 'End of period' },
      { key: 'product_id', type: 'string', required: true, size: 36, description: 'Product ID' },
      { key: 'brand_id', type: 'string', required: false, size: 36, description: 'Brand ID' },
      { key: 'category_id', type: 'string', required: false, size: 36, description: 'Category ID' },
      { key: 'opening_stock', type: 'integer', required: true, description: 'Stock at start of period' },
      { key: 'closing_stock', type: 'integer', required: true, description: 'Stock at end of period' },
      { key: 'average_stock', type: 'float', required: true, description: 'Average stock level' },
      { key: 'units_sold', type: 'integer', required: true, default: 0, description: 'Units sold in period' },
      { key: 'units_restocked', type: 'integer', required: true, default: 0, description: 'Units restocked' },
      { key: 'stock_turnover_rate', type: 'float', required: true, default: 0, description: 'Stock turnover rate' },
      { key: 'days_of_inventory', type: 'float', required: true, default: 0, description: 'Days of inventory remaining' },
      { key: 'stockout_events', type: 'integer', required: true, default: 0, description: 'Number of stockout events' },
      { key: 'low_stock_days', type: 'integer', required: true, default: 0, description: 'Days spent below reorder point' },
      { key: 'excess_inventory_days', type: 'integer', required: true, default: 0, description: 'Days with excess inventory' },
      { key: 'carrying_cost', type: 'float', required: true, default: 0, description: 'Inventory carrying cost' },
      { key: 'revenue_generated', type: 'float', required: true, default: 0, description: 'Revenue from this product' },
      { key: 'gross_margin', type: 'float', required: true, default: 0, description: 'Gross margin percentage' },
      { key: 'abc_classification', type: 'string', required: false, description: 'A, B, or C classification' }
    ],
    indexes: [
      { key: 'product_analytics', type: 'key', attributes: ['product_id', 'period_type'], description: 'Analytics for a product' },
      { key: 'brand_analytics', type: 'key', attributes: ['brand_id', 'period_start'], description: 'Brand performance' },
      { key: 'category_analytics', type: 'key', attributes: ['category_id', 'period_start'], description: 'Category performance' },
      { key: 'turnover_analysis', type: 'key', attributes: ['stock_turnover_rate', 'days_of_inventory'], description: 'Turnover analysis' }
    ]
  },

  // CART RESERVATIONS COLLECTION - Real-time cart stock reservations
  cart_reservations: {
    name: 'Cart Reservations',
    id: 'cart_reservations',
    description: 'Real-time stock reservations for active shopping carts',
    realTimeEnabled: true,
    attributes: [
      { key: 'cart_id', type: 'string', required: true, size: 36, description: 'Shopping cart ID' },
      { key: 'session_id', type: 'string', required: true, size: 36, description: 'User session ID' },
      { key: 'user_id', type: 'string', required: false, size: 36, description: 'User ID if logged in' },
      { key: 'product_id', type: 'string', required: true, size: 36, description: 'Product ID' },
      { key: 'quantity_reserved', type: 'integer', required: true, description: 'Quantity reserved' },
      { key: 'reservation_expires_at', type: 'datetime', required: true, description: 'Reservation expiration time' },
      { key: 'product_price', type: 'float', required: true, description: 'Product price at time of reservation' },
      { key: 'variation_data', type: 'json', required: false, description: 'Product variation details' },
      { key: 'is_active', type: 'boolean', required: true, default: true, description: 'Reservation is active' },
      { key: 'converted_to_order', type: 'boolean', required: true, default: false, description: 'Converted to order' },
      { key: 'order_id', type: 'string', required: false, size: 36, description: 'Order ID if converted' },
      { key: 'ip_address', type: 'string', required: false, description: 'IP address for fraud prevention' },
      { key: 'user_agent', type: 'string', required: false, description: 'User agent for tracking' }
    ],
    indexes: [
      { key: 'active_reservations', type: 'key', attributes: ['is_active'], description: 'Active reservations' },
      { key: 'product_reservations', type: 'key', attributes: ['product_id'], description: 'Reservations for a product' },
      { key: 'session_reservations', type: 'key', attributes: ['session_id'], description: 'Reservations in a session' },
      { key: 'expired_reservations', type: 'key', attributes: ['reservation_expires_at'], description: 'Find expired reservations' }
    ]
  },

  // ENHANCED ORDERS COLLECTION
  orders: {
    name: 'Orders',
    id: 'orders',
    description: 'Enhanced orders collection with comprehensive order tracking',
    realTimeEnabled: true,
    attributes: [
      // Basic Order Information
      { key: 'order_number', type: 'string', required: true, size: 100, description: 'Human-readable order number' },
      { key: 'order_code', type: 'string', required: true, size: 100, description: 'System order code' },
      { key: 'customer_id', type: 'string', required: true, size: 36, description: 'Customer ID' },
      { key: 'customer_name', type: 'string', required: true, size: 255, description: 'Customer name' },
      { key: 'customer_email', type: 'email', required: true, description: 'Customer email' },
      { key: 'customer_phone', type: 'string', required: false, size: 50, description: 'Customer phone' },

      // Order Items and Pricing
      { key: 'items_count', type: 'integer', required: true, description: 'Number of different items' },
      { key: 'total_quantity', type: 'integer', required: true, description: 'Total quantity of all items' },
      { key: 'subtotal', type: 'float', required: true, description: 'Order subtotal' },
      { key: 'shipping_cost', type: 'float', required: true, default: 0, description: 'Shipping cost' },
      { key: 'tax_amount', type: 'float', required: true, default: 0, description: 'Tax amount' },
      { key: 'discount_amount', type: 'float', required: true, default: 0, description: 'Discount amount' },
      { key: 'total_amount', type: 'float', required: true, description: 'Total order amount' },

      // Status Tracking
      { key: 'order_status', type: 'string', required: true, default: 'pending', description: 'pending, processing, confirmed, shipped, delivered, cancelled, refunded' },
      { key: 'payment_status', type: 'string', required: true, default: 'pending', description: 'pending, paid, failed, refunded, partially_refunded' },
      { key: 'fulfillment_status', type: 'string', required: true, default: 'unfulfilled', description: 'unfulfilled, partial, fulfilled' },
      { key: 'payment_method', type: 'string', required: true, description: 'Payment method used' },
      { key: 'payment_reference', type: 'string', required: false, size: 255, description: 'Payment transaction reference' },

      // Addresses
      { key: 'shipping_address', type: 'json', required: true, description: 'Shipping address' },
      { key: 'billing_address', type: 'json', required: true, description: 'Billing address' },
      { key: 'same_as_billing', type: 'boolean', required: true, default: true, description: 'Shipping same as billing' },

      // Shipping and Delivery
      { key: 'shipping_method', type: 'string', required: false, description: 'Shipping method' },
      { key: 'tracking_number', type: 'string', required: false, size: 255, description: 'Tracking number' },
      { key: 'carrier', type: 'string', required: false, size: 100, description: 'Shipping carrier' },
      { key: 'estimated_delivery', type: 'datetime', required: false, description: 'Estimated delivery date' },
      { key: 'actual_delivery', type: 'datetime', required: false, description: 'Actual delivery date' },
      { key: 'shipped_at', type: 'datetime', required: false, description: 'Shipment date' },

      // Additional Information
      { key: 'customer_note', type: 'string', required: false, size: 1000, description: 'Customer order notes' },
      { key: 'admin_notes', type: 'string', required: false, size: 1000, description: 'Admin internal notes' },
      { key: 'gift_message', type: 'string', required: false, size: 500, description: 'Gift message' },
      { key: 'is_gift', type: 'boolean', required: true, default: false, description: 'Order is a gift' },
      { key: 'gift_wrap', type: 'boolean', required: true, default: false, description: 'Gift wrap requested' },

      // Analytics and Performance
      { key: 'source', type: 'string', required: false, description: 'Order source (web, mobile, etc.)' },
      { key: 'referrer', type: 'string', required: false, description: 'Referrer URL' },
      { key: 'coupon_code', type: 'string', required: false, size: 50, description: 'Applied coupon code' },
      { key: 'loyalty_points_used', type: 'integer', required: false, description: 'Loyalty points used' },
      { key: 'loyalty_points_earned', type: 'integer', required: false, description: 'Loyalty points earned' },

      // Timestamps
      { key: 'confirmed_at', type: 'datetime', required: false, description: 'Order confirmation time' },
      { key: 'paid_at', type: 'datetime', required: false, description: 'Payment confirmation time' },
      { key: 'cancelled_at', type: 'datetime', required: false, description: 'Cancellation time' },
      { key: 'refunded_at', type: 'datetime', required: false, description: 'Refund processing time' },

      // Geographic Information
      { key: 'shipping_country', type: 'string', required: false, size: 2, description: 'Shipping country code' },
      { key: 'shipping_state', type: 'string', required: false, size: 100, description: 'Shipping state/province' },
      { key: 'shipping_city', type: 'string', required: false, size: 100, description: 'Shipping city' },
      { key: 'shipping_postal_code', type: 'string', required: false, size: 20, description: 'Shipping postal code' },

      // System Fields
      { key: 'created_by', type: 'string', required: false, size: 36, description: 'User who created the order (for admin-created orders)' },
      { key: 'updated_by', type: 'string', required: false, size: 36, description: 'User who last updated the order' },
      { key: 'api_source', type: 'string', required: false, description: 'API source that created the order' },
      { key: 'version', type: 'integer', required: true, default: 1, description: 'Order record version for conflict resolution' }
    ],
    indexes: [
      { key: 'order_number_lookup', type: 'key', attributes: ['order_number'], description: 'Find order by order number' },
      { key: 'customer_orders', type: 'key', attributes: ['customer_id'], description: 'All orders for a customer' },
      { key: 'status_filtering', type: 'key', attributes: ['order_status', 'payment_status'], description: 'Filter by status' },
      { key: 'date_range', type: 'key', attributes: ['$createdAt'], description: 'Date range queries' },
      { key: 'geographic_sales', type: 'key', attributes: ['shipping_country', 'shipping_state'], description: 'Geographic sales analysis' },
      { key: 'revenue_analysis', type: 'key', attributes: ['total_amount', 'order_status'], description: 'Revenue analysis' }
    ]
  },

  // CUSTOMER ANALYTICS COLLECTION - Enhanced customer behavior tracking
  customer_analytics: {
    name: 'Customer Analytics',
    id: 'customer_analytics',
    description: 'Customer behavior and lifetime value analytics',
    realTimeEnabled: true,
    attributes: [
      { key: 'customer_id', type: 'string', required: true, size: 36, description: 'Customer ID' },
      { key: 'total_orders', type: 'integer', required: true, default: 0, description: 'Total number of orders' },
      { key: 'total_spent', type: 'float', required: true, default: 0, description: 'Total amount spent' },
      { key: 'average_order_value', type: 'float', required: true, default: 0, description: 'Average order value' },
      { key: 'lifetime_value', type: 'float', required: true, default: 0, description: 'Customer lifetime value' },
      { key: 'first_order_date', type: 'datetime', required: false, description: 'Date of first order' },
      { key: 'last_order_date', type: 'datetime', required: false, description: 'Date of last order' },
      { key: 'days_since_last_order', type: 'integer', required: true, default: 0, description: 'Days since last order' },
      { key: 'favorite_category', type: 'string', required: false, size: 36, description: 'Most purchased category' },
      { key: 'favorite_brand', type: 'string', required: false, size: 36, description: 'Most purchased brand' },
      { key: 'total_items_purchased', type: 'integer', required: true, default: 0, description: 'Total items purchased' },
      { key: 'returned_items_count', type: 'integer', required: true, default: 0, description: 'Number of returned items' },
      { key: 'return_rate', type: 'float', required: true, default: 0, description: 'Return rate percentage' },
      { key: 'discount_usage_count', type: 'integer', required: true, default: 0, description: 'Number of discount code uses' },
      { key: 'loyalty_tier', type: 'string', required: true, default: 'bronze', description: 'bronze, silver, gold, platinum' },
      { key: 'engagement_score', type: 'float', required: true, default: 0, description: 'Customer engagement score' },
      { key: 'acquisition_channel', type: 'string', required: false, description: 'How customer was acquired' },
      { key: 'churn_risk_score', type: 'float', required: true, default: 0, description: 'Churn risk score (0-1)' },
      { key: 'predicted_ltv', type: 'float', required: true, default: 0, description: 'Predicted lifetime value' },
      { key: 'customer_segment', type: 'string', required: false, description: 'Customer segment classification' }
    ],
    indexes: [
      { key: 'customer_lookup', type: 'key', attributes: ['customer_id'], description: 'Analytics for a specific customer' },
      { key: 'ltv_ranking', type: 'key', attributes: ['lifetime_value'], description: 'Rank customers by LTV' },
      { key: 'engagement_ranking', type: 'key', attributes: ['engagement_score'], description: 'Rank by engagement' },
      { key: 'segmentation', type: 'key', attributes: ['customer_segment', 'loyalty_tier'], description: 'Customer segmentation' }
    ]
  },

  // SYSTEM CONFIGURATION COLLECTION - Real-time system settings
  system_config: {
    name: 'System Configuration',
    id: 'system_config',
    description: 'Real-time system configuration and settings',
    realTimeEnabled: true,
    attributes: [
      { key: 'config_key', type: 'string', required: true, size: 100, description: 'Configuration key' },
      { key: 'config_value', type: 'json', required: true, description: 'Configuration value' },
      { key: 'config_type', type: 'string', required: true, description: 'string, number, boolean, object, array' },
      { key: 'category', type: 'string', required: true, description: 'inventory, analytics, notifications, general' },
      { key: 'is_active', type: 'boolean', required: true, default: true, description: 'Configuration is active' },
      { key: 'description', type: 'string', required: false, size: 500, description: 'Configuration description' },
      { key: 'validation_rules', type: 'json', required: false, description: 'Validation rules for the config' },
      { key: 'last_modified_by', type: 'string', required: false, size: 36, description: 'User who last modified' },
      { key: 'version', type: 'integer', required: true, default: 1, description: 'Configuration version' }
    ],
    indexes: [
      { key: 'config_lookup', type: 'key', attributes: ['config_key'], description: 'Find config by key' },
      { key: 'category_config', type: 'key', attributes: ['category'], description: 'Configs by category' }
    ]
  }
};

// Helper function to get enhanced collection by ID
export const getEnhancedCollection = (id: string): EnhancedCollectionDefinition | undefined => {
  return ENHANCED_COLLECTIONS[id];
};

// Helper function to get all enhanced collection IDs
export const getEnhancedCollectionIds = (): string[] => {
  return Object.keys(ENHANCED_COLLECTIONS);
};

// Helper function to get collection name by ID
export const getEnhancedCollectionName = (id: string): string => {
  const collection = ENHANCED_COLLECTIONS[id];
  return collection ? collection.name : id;
};

// Real-time subscription configuration
export const REALTIME_CONFIG = {
  collections: {
    products: {
      events: ['create', 'update', 'delete'],
      filters: ['is_active', 'stock_status', 'brand_id', 'category_id']
    },
    stock_movements: {
      events: ['create'],
      filters: ['product_id', 'movement_type', '$createdAt']
    },
    orders: {
      events: ['create', 'update'],
      filters: ['customer_id', 'order_status', 'payment_status', '$createdAt']
    },
    order_items: {
      events: ['create', 'update'],
      filters: ['order_id', 'product_id', 'fulfillment_status']
    },
    inventory_alerts: {
      events: ['create', 'update'],
      filters: ['product_id', 'alert_type', 'is_active']
    },
    cart_reservations: {
      events: ['create', 'update', 'delete'],
      filters: ['product_id', 'is_active', 'session_id']
    },
    analytics_events: {
      events: ['create'],
      filters: ['event_type', 'user_id', '$createdAt']
    },
    customer_analytics: {
      events: ['update'],
      filters: ['customer_id']
    }
  }
};

// Database migration helper
export const MIGRATION_SCRIPTS = {
  // Script to migrate existing products to new schema
  migrateProducts: `
    // Migration script to add new inventory fields to existing products
    // This should be run once to upgrade existing products
    
    // Add new inventory fields
    ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_units INTEGER DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS available_units INTEGER DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 5;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS max_stock_level INTEGER NULL;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_point INTEGER NULL;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS safety_stock INTEGER DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_status VARCHAR DEFAULT 'in_stock';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT true;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS allow_backorder BOOLEAN DEFAULT false;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS total_sold INTEGER DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5,2) DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS return_rate DECIMAL(5,2) DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS last_sold_at TIMESTAMP NULL;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS last_restocked_at TIMESTAMP NULL;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP NULL;
    
    // Update available_units based on existing units field
    UPDATE products SET available_units = units - COALESCE(reserved_units, 0);
    
    // Update stock_status based on available_units
    UPDATE products SET stock_status = 'out_of_stock' WHERE available_units <= 0;
    UPDATE products SET stock_status = 'low_stock' WHERE available_units > 0 AND available_units <= min_stock_level;
    UPDATE products SET stock_status = 'in_stock' WHERE available_units > min_stock_level;
  `
};