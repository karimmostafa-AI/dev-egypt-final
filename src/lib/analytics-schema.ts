// Analytics Collections Schema Definition
// Comprehensive analytics and tracking collections for e-commerce intelligence

export interface AnalyticsCollectionDefinition {
  name: string
  id: string
  attributes: AnalyticsAttributeDefinition[]
  indexes?: AnalyticsIndexDefinition[]
}

export interface AnalyticsAttributeDefinition {
  key: string
  type: 'string' | 'integer' | 'float' | 'boolean' | 'email' | 'url' | 'datetime'
  required: boolean
  default?: any
  size?: number
  array?: boolean
}

export interface AnalyticsIndexDefinition {
  key: string
  type: 'key' | 'unique' | 'fulltext'
  attributes: string[]
}

// Analytics Collections
export const ANALYTICS_COLLECTIONS: Record<string, AnalyticsCollectionDefinition> = {
  // Product Analytics - Daily aggregated metrics per product
  product_analytics: {
    name: 'Product Analytics',
    id: 'product_analytics',
    attributes: [
      { key: 'product_id', type: 'string', required: true, size: 36 },
      { key: 'date', type: 'datetime', required: true },
      { key: 'views', type: 'integer', required: false, default: 0 },
      { key: 'add_to_cart', type: 'integer', required: false, default: 0 },
      { key: 'purchases', type: 'integer', required: false, default: 0 },
      { key: 'returns', type: 'integer', required: false, default: 0 },
      { key: 'revenue', type: 'float', required: false, default: 0 },
      { key: 'discounted_sales', type: 'integer', required: false, default: 0 },
      { key: 'average_price', type: 'float', required: false, default: 0 },
      { key: 'conversion_rate', type: 'float', required: false, default: 0 },
      { key: 'wishlist_adds', type: 'integer', required: false, default: 0 },
    ],
    indexes: [
      { key: 'product_date_idx', type: 'key', attributes: ['product_id'] },
      { key: 'date_idx', type: 'key', attributes: ['date'] },
    ]
  },

  // Session Tracking - Visitor sessions similar to Google Analytics
  session_tracking: {
    name: 'Session Tracking',
    id: 'session_tracking',
    attributes: [
      { key: 'session_id', type: 'string', required: true, size: 100 },
      { key: 'user_id', type: 'string', required: false, size: 36 },
      { key: 'visitor_id', type: 'string', required: true, size: 100 },
      { key: 'ip_address', type: 'string', required: false, size: 45 },
      { key: 'country', type: 'string', required: false, size: 100 },
      { key: 'city', type: 'string', required: false, size: 100 },
      { key: 'device_type', type: 'string', required: false, size: 50 },
      { key: 'browser', type: 'string', required: false, size: 100 },
      { key: 'os', type: 'string', required: false, size: 100 },
      { key: 'referrer', type: 'string', required: false, size: 500 },
      { key: 'landing_page', type: 'string', required: false, size: 500 },
      { key: 'utm_source', type: 'string', required: false, size: 100 },
      { key: 'utm_medium', type: 'string', required: false, size: 100 },
      { key: 'utm_campaign', type: 'string', required: false, size: 100 },
      { key: 'session_start', type: 'datetime', required: true },
      { key: 'session_end', type: 'datetime', required: false },
      { key: 'pages_viewed', type: 'integer', required: true, default: 0 },
      { key: 'time_on_site', type: 'float', required: true, default: 0 },
      { key: 'converted', type: 'boolean', required: true, default: false },
      { key: 'order_id', type: 'string', required: false, size: 36 },
    ],
    indexes: [
      { key: 'session_idx', type: 'unique', attributes: ['session_id'] },
      { key: 'user_idx', type: 'key', attributes: ['user_id'] },
      { key: 'visitor_idx', type: 'key', attributes: ['visitor_id'] },
      { key: 'date_idx', type: 'key', attributes: ['session_start'] },
      { key: 'converted_idx', type: 'key', attributes: ['converted'] },
    ]
  },

  // Live Visitors - Real-time analytics
  live_visitors: {
    name: 'Live Visitors',
    id: 'live_visitors',
    attributes: [
      { key: 'visitor_id', type: 'string', required: true, size: 100 },
      { key: 'user_id', type: 'string', required: false, size: 36 },
      { key: 'session_id', type: 'string', required: true, size: 100 },
      { key: 'current_page', type: 'string', required: true, size: 500 },
      { key: 'device_type', type: 'string', required: false, size: 50 },
      { key: 'browser', type: 'string', required: false, size: 100 },
      { key: 'country', type: 'string', required: false, size: 100 },
      { key: 'city', type: 'string', required: false, size: 100 },
      { key: 'entered_at', type: 'datetime', required: true },
      { key: 'last_seen_at', type: 'datetime', required: true },
    ],
    indexes: [
      { key: 'visitor_idx', type: 'unique', attributes: ['visitor_id'] },
      { key: 'last_seen_idx', type: 'key', attributes: ['last_seen_at'] },
    ]
  },

  // Events Log - Generic event tracking
  events_log: {
    name: 'Events Log',
    id: 'events_log',
    attributes: [
      { key: 'event_type', type: 'string', required: true, size: 100 },
      { key: 'user_id', type: 'string', required: false, size: 36 },
      { key: 'session_id', type: 'string', required: false, size: 100 },
      { key: 'visitor_id', type: 'string', required: false, size: 100 },
      { key: 'product_id', type: 'string', required: false, size: 36 },
      { key: 'category_id', type: 'string', required: false, size: 36 },
      { key: 'brand_id', type: 'string', required: false, size: 36 },
      { key: 'order_id', type: 'string', required: false, size: 36 },
      { key: 'value', type: 'float', required: false },
      { key: 'metadata', type: 'string', required: false, size: 2000 },
      { key: 'page_url', type: 'string', required: false, size: 500 },
      { key: 'timestamp', type: 'datetime', required: true },
    ],
    indexes: [
      { key: 'event_type_idx', type: 'key', attributes: ['event_type'] },
      { key: 'user_idx', type: 'key', attributes: ['user_id'] },
      { key: 'session_idx', type: 'key', attributes: ['session_id'] },
      { key: 'timestamp_idx', type: 'key', attributes: ['timestamp'] },
      { key: 'product_idx', type: 'key', attributes: ['product_id'] },
    ]
  },

  // Customer Feedback - Reviews and ratings
  customer_feedback: {
    name: 'Customer Feedback',
    id: 'customer_feedback',
    attributes: [
      { key: 'user_id', type: 'string', required: true, size: 36 },
      { key: 'product_id', type: 'string', required: false, size: 36 },
      { key: 'order_id', type: 'string', required: false, size: 36 },
      { key: 'rating', type: 'integer', required: true },
      { key: 'comment', type: 'string', required: false, size: 2000 },
      { key: 'sentiment_score', type: 'float', required: false },
      { key: 'status', type: 'string', required: true, default: 'pending', size: 50 },
      { key: 'helpful_count', type: 'integer', required: true, default: 0 },
      { key: 'verified_purchase', type: 'boolean', required: true, default: false },
    ],
    indexes: [
      { key: 'user_idx', type: 'key', attributes: ['user_id'] },
      { key: 'product_idx', type: 'key', attributes: ['product_id'] },
      { key: 'rating_idx', type: 'key', attributes: ['rating'] },
      { key: 'status_idx', type: 'key', attributes: ['status'] },
    ]
  },

  // Financial Analytics - Daily aggregated financial data
  financial_analytics: {
    name: 'Financial Analytics',
    id: 'financial_analytics',
    attributes: [
      { key: 'date', type: 'datetime', required: true },
      { key: 'gross_revenue', type: 'float', required: true, default: 0 },
      { key: 'net_revenue', type: 'float', required: true, default: 0 },
      { key: 'total_orders', type: 'integer', required: true, default: 0 },
      { key: 'refunds', type: 'float', required: true, default: 0 },
      { key: 'cost_of_goods_sold', type: 'float', required: true, default: 0 },
      { key: 'operational_expense', type: 'float', required: true, default: 0 },
      { key: 'net_profit', type: 'float', required: true, default: 0 },
      { key: 'profit_margin', type: 'float', required: true, default: 0 },
      { key: 'average_order_value', type: 'float', required: true, default: 0 },
      { key: 'tax_collected', type: 'float', required: true, default: 0 },
      { key: 'shipping_collected', type: 'float', required: true, default: 0 },
      { key: 'discounts_given', type: 'float', required: true, default: 0 },
    ],
    indexes: [
      { key: 'date_idx', type: 'unique', attributes: ['date'] },
    ]
  },

  // Traffic Sources - Campaign and source performance
  traffic_sources: {
    name: 'Traffic Sources',
    id: 'traffic_sources',
    attributes: [
      { key: 'source', type: 'string', required: true, size: 100 },
      { key: 'medium', type: 'string', required: false, size: 100 },
      { key: 'campaign', type: 'string', required: false, size: 100 },
      { key: 'date', type: 'datetime', required: true },
      { key: 'clicks', type: 'integer', required: true, default: 0 },
      { key: 'sessions', type: 'integer', required: true, default: 0 },
      { key: 'conversions', type: 'integer', required: true, default: 0 },
      { key: 'revenue', type: 'float', required: true, default: 0 },
      { key: 'bounce_rate', type: 'float', required: true, default: 0 },
      { key: 'avg_session_duration', type: 'float', required: true, default: 0 },
    ],
    indexes: [
      { key: 'source_idx', type: 'key', attributes: ['source'] },
      { key: 'date_idx', type: 'key', attributes: ['date'] },
      { key: 'campaign_idx', type: 'key', attributes: ['campaign'] },
    ]
  },

  // Category Analytics - Performance by category
  category_analytics: {
    name: 'Category Analytics',
    id: 'category_analytics',
    attributes: [
      { key: 'category_id', type: 'string', required: true, size: 36 },
      { key: 'date', type: 'datetime', required: true },
      { key: 'views', type: 'integer', required: true, default: 0 },
      { key: 'orders', type: 'integer', required: true, default: 0 },
      { key: 'revenue', type: 'float', required: true, default: 0 },
      { key: 'units_sold', type: 'integer', required: true, default: 0 },
      { key: 'conversion_rate', type: 'float', required: true, default: 0 },
    ],
    indexes: [
      { key: 'category_date_idx', type: 'key', attributes: ['category_id'] },
      { key: 'date_idx', type: 'key', attributes: ['date'] },
    ]
  },

  // Brand Analytics - Performance by brand
  brand_analytics: {
    name: 'Brand Analytics',
    id: 'brand_analytics',
    attributes: [
      { key: 'brand_id', type: 'string', required: true, size: 36 },
      { key: 'date', type: 'datetime', required: true },
      { key: 'views', type: 'integer', required: true, default: 0 },
      { key: 'orders', type: 'integer', required: true, default: 0 },
      { key: 'revenue', type: 'float', required: true, default: 0 },
      { key: 'units_sold', type: 'integer', required: true, default: 0 },
      { key: 'conversion_rate', type: 'float', required: true, default: 0 },
      { key: 'return_rate', type: 'float', required: true, default: 0 },
    ],
    indexes: [
      { key: 'brand_date_idx', type: 'key', attributes: ['brand_id'] },
      { key: 'date_idx', type: 'key', attributes: ['date'] },
    ]
  },
}

// Event Types for events_log collection
export const EVENT_TYPES = {
  // Page Events
  PAGE_VIEW: 'page_view',
  PAGE_EXIT: 'page_exit',
  
  // Product Events
  PRODUCT_VIEW: 'product_view',
  PRODUCT_CLICK: 'product_click',
  PRODUCT_SEARCH: 'product_search',
  
  // Cart Events
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  CART_VIEW: 'cart_view',
  CART_ABANDON: 'cart_abandon',
  
  // Checkout Events
  CHECKOUT_START: 'checkout_start',
  CHECKOUT_COMPLETE: 'checkout_complete',
  PAYMENT_INFO_ENTERED: 'payment_info_entered',
  
  // Purchase Events
  PURCHASE: 'purchase',
  REFUND: 'refund',
  
  // Wishlist Events
  ADD_TO_WISHLIST: 'add_to_wishlist',
  REMOVE_FROM_WISHLIST: 'remove_from_wishlist',
  
  // User Events
  USER_REGISTER: 'user_register',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  
  // Engagement Events
  REVIEW_SUBMIT: 'review_submit',
  SHARE: 'share',
  EMAIL_SIGNUP: 'email_signup',
} as const

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES]
