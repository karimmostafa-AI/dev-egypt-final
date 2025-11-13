import { ID, Query } from 'node-appwrite'
import { createAdminClient } from './appwrite-admin'

// Database configuration
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!

// Collection IDs
const LIVE_VISITORS_COLLECTION_ID = '69153bd5000d1f8eae0b'
const SESSION_TRACKING_COLLECTION_ID = '69153bdf002a48c8f193'
const EVENTS_LOG_COLLECTION_ID = '69153be80013cc5b1d8b'

// Type-safe analytics data insertion helpers with proper defaults

/**
 * Product Analytics - Daily aggregated metrics per product
 */
export async function createProductAnalytics(data: {
  product_id: string
  date: Date | string
  views?: number
  add_to_cart?: number
  purchases?: number
  returns?: number
  revenue?: number
  discounted_sales?: number
  average_price?: number
  conversion_rate?: number
  wishlist_adds?: number
}) {
  const { databases } = await createAdminClient()
  
  const record = {
    product_id: data.product_id,
    date: typeof data.date === 'string' ? data.date : data.date.toISOString(),
    views: data.views ?? 0,
    add_to_cart: data.add_to_cart ?? 0,
    purchases: data.purchases ?? 0,
    returns: data.returns ?? 0,
    revenue: data.revenue ?? 0,
    discounted_sales: data.discounted_sales ?? 0,
    average_price: data.average_price ?? 0,
    conversion_rate: data.conversion_rate ?? 0,
    wishlist_adds: data.wishlist_adds ?? 0,
  }

  return await databases.createDocument(
    DATABASE_ID,
    'product_analytics',
    ID.unique(),
    record
  )
}

/**
 * Session Tracking - Visitor sessions
 */
export async function createSessionTracking(data: {
  session_id: string
  visitor_id: string
  user_id?: string
  ip_address?: string
  country?: string
  city?: string
  device_type?: string
  browser?: string
  os?: string
  referrer?: string
  referrer_url?: string
  landing_page?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  start_time?: Date | string
  session_start?: Date | string
  session_end?: Date | string
  last_activity?: Date | string
  pages_visited?: number
  pages_viewed?: number
  time_on_site?: number
  session_duration?: number
  converted?: boolean
  order_id?: string
}) {
  const { databases } = await createAdminClient()
  
  // Handle flexible field names (start_time vs session_start, referrer_url vs referrer, etc.)
  const startTime = data.start_time || data.session_start
  const referrerValue = data.referrer_url || data.referrer
  const pagesValue = data.pages_visited || data.pages_viewed
  const durationValue = data.session_duration || data.time_on_site
  const lastActivityValue = data.last_activity
  
  const record = {
    session_id: data.session_id,
    visitor_id: data.visitor_id,
    user_id: data.user_id,
    ip_address: data.ip_address,
    country: data.country,
    city: data.city,
    device_type: data.device_type,
    browser: data.browser,
    os: data.os,
    referrer_url: referrerValue,
    landing_page: data.landing_page,
    utm_source: data.utm_source,
    utm_medium: data.utm_medium,
    utm_campaign: data.utm_campaign,
    start_time: startTime ? (typeof startTime === 'string' ? startTime : startTime.toISOString()) : new Date().toISOString(),
    end_time: data.session_end ? (typeof data.session_end === 'string' ? data.session_end : data.session_end.toISOString()) : undefined,
    last_activity: lastActivityValue ? (typeof lastActivityValue === 'string' ? lastActivityValue : lastActivityValue.toISOString()) : undefined,
    pages_visited: pagesValue ?? 0,
    session_duration: durationValue ?? 0,
    converted: data.converted ?? false,
    order_id: data.order_id,
  }

  return await databases.createDocument(
    DATABASE_ID,
    SESSION_TRACKING_COLLECTION_ID,
    ID.unique(),
    record
  )
}

/**
 * Live Visitors - Real-time tracking
 */
/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      if (error?.code === 'UND_ERR_CONNECT_TIMEOUT' || error?.code === 'UND_ERR_SOCKET') {
        // Connection errors - retry with exponential backoff
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
      } else if (error?.code === 'document_not_found' || error?.code === 'collection_not_found') {
        // Don't retry on not found errors
        throw error
      } else {
        // Other errors - retry with exponential backoff
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries')
}

export async function upsertLiveVisitor(data: {
  visitor_id: string
  user_id?: string
  session_id: string
  current_page: string
  device_type?: string
  browser?: string
  os?: string
  country?: string
  city?: string
  ip_address?: string
  referrer?: string
  screen_resolution?: string
  entered_at?: Date | string
  last_seen_at: Date | string
}) {
  try {
    const { databases } = await createAdminClient()
    
    const record = {
      visitor_id: data.visitor_id,
      user_id: data.user_id,
      session_id: data.session_id,
      current_page: data.current_page,
      device_type: data.device_type,
      browser: data.browser,
      os: data.os,
      country: data.country,
      city: data.city,
      ip_address: data.ip_address,
      referrer: data.referrer,
      screen_resolution: data.screen_resolution,
      entered_at: data.entered_at ? (typeof data.entered_at === 'string' ? data.entered_at : data.entered_at.toISOString()) : new Date().toISOString(),
      last_seen_at: typeof data.last_seen_at === 'string' ? data.last_seen_at : data.last_seen_at.toISOString(),
    }

    // Try to update existing visitor, or create new with retry logic
    try {
      const existing = await retryWithBackoff(async () => {
        return await databases.listDocuments(
          DATABASE_ID,
          LIVE_VISITORS_COLLECTION_ID,
          [Query.equal('visitor_id', data.visitor_id)]
        )
      }, 2, 500)

      if (existing.documents.length > 0) {
        return await retryWithBackoff(async () => {
          return await databases.updateDocument(
            DATABASE_ID,
            LIVE_VISITORS_COLLECTION_ID,
            existing.documents[0].$id,
            record
          )
        }, 2, 500)
      }
    } catch (error: any) {
      // Only create if document doesn't exist
      if (error?.code === 'document_not_found' || error?.code === 'collection_not_found') {
        // Document doesn't exist, proceed to create below
      } else {
        // Other errors - re-throw to outer catch
        throw error
      }
    }
    // Create new visitor with retry logic
    return await retryWithBackoff(async () => {
      return await databases.createDocument(
        DATABASE_ID,
        LIVE_VISITORS_COLLECTION_ID,
        ID.unique(),
        record
      )
    }, 2, 500)
  } catch (error: any) {
    // Log error but don't throw - live visitor tracking is non-critical
    console.error('Failed to upsert live visitor after retries:', {
      error: error?.message,
      code: error?.code,
      visitor_id: data.visitor_id,
      session_id: data.session_id
    })
    
    // Return a mock response to prevent breaking the API
    return {
      $id: 'error',
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      ...data
    } as any
  }
}

/**
 * Events Log - Track user events
 */
export async function logEvent(data: {
  event_type: string
  user_id?: string
  session_id?: string
  visitor_id?: string
  product_id?: string
  category_id?: string
  brand_id?: string
  order_id?: string
  value?: number
  metadata?: string | Record<string, any>
  page_url?: string
  timestamp?: Date | string
}) {
  const { databases } = await createAdminClient()
  
  const record = {
    event_type: data.event_type,
    user_id: data.user_id,
    session_id: data.session_id,
    visitor_id: data.visitor_id,
    product_id: data.product_id,
    category_id: data.category_id,
    brand_id: data.brand_id,
    order_id: data.order_id,
    value: data.value,
    metadata: typeof data.metadata === 'string' ? data.metadata : JSON.stringify(data.metadata || {}),
    page_url: data.page_url,
    timestamp: data.timestamp ? (typeof data.timestamp === 'string' ? data.timestamp : data.timestamp.toISOString()) : new Date().toISOString(),
  }

  return await databases.createDocument(
    DATABASE_ID,
    'events_log',
    ID.unique(),
    record
  )
}

/**
 * Customer Feedback - Reviews and ratings
 */
export async function createCustomerFeedback(data: {
  user_id: string
  product_id?: string
  order_id?: string
  rating: number
  comment?: string
  sentiment_score?: number
  status?: string
  helpful_count?: number
  verified_purchase?: boolean
}) {
  const { databases } = await createAdminClient()
  
  const record = {
    user_id: data.user_id,
    product_id: data.product_id,
    order_id: data.order_id,
    rating: data.rating,
    comment: data.comment,
    sentiment_score: data.sentiment_score,
    status: data.status ?? 'pending',
    helpful_count: data.helpful_count ?? 0,
    verified_purchase: data.verified_purchase ?? false,
  }

  return await databases.createDocument(
    DATABASE_ID,
    'customer_feedback',
    ID.unique(),
    record
  )
}

/**
 * Financial Analytics - Daily aggregated financial data
 */
export async function createFinancialAnalytics(data: {
  date: Date | string
  gross_revenue?: number
  net_revenue?: number
  total_orders?: number
  refunds?: number
  cost_of_goods_sold?: number
  operational_expense?: number
  net_profit?: number
  profit_margin?: number
  average_order_value?: number
  tax_collected?: number
  shipping_collected?: number
  discounts_given?: number
}) {
  const { databases } = await createAdminClient()
  
  const record = {
    date: typeof data.date === 'string' ? data.date : data.date.toISOString(),
    gross_revenue: data.gross_revenue ?? 0,
    net_revenue: data.net_revenue ?? 0,
    total_orders: data.total_orders ?? 0,
    refunds: data.refunds ?? 0,
    cost_of_goods_sold: data.cost_of_goods_sold ?? 0,
    operational_expense: data.operational_expense ?? 0,
    net_profit: data.net_profit ?? 0,
    profit_margin: data.profit_margin ?? 0,
    average_order_value: data.average_order_value ?? 0,
    tax_collected: data.tax_collected ?? 0,
    shipping_collected: data.shipping_collected ?? 0,
    discounts_given: data.discounts_given ?? 0,
  }

  return await databases.createDocument(
    DATABASE_ID,
    'financial_analytics',
    ID.unique(),
    record
  )
}

/**
 * Traffic Sources - Campaign and source performance
 */
export async function createTrafficSource(data: {
  source: string
  medium?: string
  campaign?: string
  date: Date | string
  clicks?: number
  sessions?: number
  conversions?: number
  revenue?: number
  bounce_rate?: number
  avg_session_duration?: number
}) {
  const { databases } = await createAdminClient()
  
  const record = {
    source: data.source,
    medium: data.medium,
    campaign: data.campaign,
    date: typeof data.date === 'string' ? data.date : data.date.toISOString(),
    clicks: data.clicks ?? 0,
    sessions: data.sessions ?? 0,
    conversions: data.conversions ?? 0,
    revenue: data.revenue ?? 0,
    bounce_rate: data.bounce_rate ?? 0,
    avg_session_duration: data.avg_session_duration ?? 0,
  }

  return await databases.createDocument(
    DATABASE_ID,
    'traffic_sources',
    ID.unique(),
    record
  )
}

/**
 * Category Analytics - Performance by category
 */
export async function createCategoryAnalytics(data: {
  category_id: string
  date: Date | string
  views?: number
  orders?: number
  revenue?: number
  units_sold?: number
  conversion_rate?: number
}) {
  const { databases } = await createAdminClient()
  
  const record = {
    category_id: data.category_id,
    date: typeof data.date === 'string' ? data.date : data.date.toISOString(),
    views: data.views ?? 0,
    orders: data.orders ?? 0,
    revenue: data.revenue ?? 0,
    units_sold: data.units_sold ?? 0,
    conversion_rate: data.conversion_rate ?? 0,
  }

  return await databases.createDocument(
    DATABASE_ID,
    'category_analytics',
    ID.unique(),
    record
  )
}

/**
 * Brand Analytics - Performance by brand
 */
export async function createBrandAnalytics(data: {
  brand_id: string
  date: Date | string
  views?: number
  orders?: number
  revenue?: number
  units_sold?: number
  conversion_rate?: number
  return_rate?: number
}) {
  const { databases } = await createAdminClient()
  
  const record = {
    brand_id: data.brand_id,
    date: typeof data.date === 'string' ? data.date : data.date.toISOString(),
    views: data.views ?? 0,
    orders: data.orders ?? 0,
    revenue: data.revenue ?? 0,
    units_sold: data.units_sold ?? 0,
    conversion_rate: data.conversion_rate ?? 0,
    return_rate: data.return_rate ?? 0,
  }

  return await databases.createDocument(
    DATABASE_ID,
    'brand_analytics',
    ID.unique(),
    record
  )
}

// Bulk operations for efficiency

/**
 * Batch insert events
 */
export async function logEventsBatch(events: Parameters<typeof logEvent>[0][]) {
  const results = await Promise.allSettled(
    events.map(event => logEvent(event))
  )
  
  return {
    succeeded: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
    results
  }
}

/**
 * Update product analytics counters
 */
export async function incrementProductMetrics(
  productId: string,
  date: Date | string,
  metrics: {
    views?: number
    add_to_cart?: number
    purchases?: number
    returns?: number
    revenue?: number
  }
) {
  const { databases } = await createAdminClient()
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
  
  try {
    // Try to find existing record
    const existing = await databases.listDocuments(
      DATABASE_ID,
      'product_analytics',
      [Query.equal('product_id', productId), Query.equal('date', dateStr)]
    )

    if (existing.documents.length > 0) {
      const current = existing.documents[0]
      
      // Increment existing values
      return await databases.updateDocument(
        DATABASE_ID,
        'product_analytics',
        current.$id,
        {
          views: (current.views || 0) + (metrics.views || 0),
          add_to_cart: (current.add_to_cart || 0) + (metrics.add_to_cart || 0),
          purchases: (current.purchases || 0) + (metrics.purchases || 0),
          returns: (current.returns || 0) + (metrics.returns || 0),
          revenue: (current.revenue || 0) + (metrics.revenue || 0),
        }
      )
    }
  } catch (error) {
    // Record doesn't exist, create new
  }

  // Create new record
  return await createProductAnalytics({
    product_id: productId,
    date: dateStr,
    ...metrics
  })
}
