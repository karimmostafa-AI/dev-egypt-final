# 📊 Analytics Usage Guide

This guide shows you how to use the analytics system with code-based defaults.

---

## 🎯 Quick Start

All analytics functions are in `/src/lib/analytics-helpers.ts` with proper TypeScript types and automatic defaults.

---

## 📝 Basic Usage Examples

### 1. **Track Product Views**

```typescript
import { logEvent } from '@/lib/analytics-helpers'
import { EVENT_TYPES } from '@/lib/analytics-schema'

// On product page view
await logEvent({
  event_type: EVENT_TYPES.PRODUCT_VIEW,
  product_id: 'abc123',
  visitor_id: getVisitorId(),
  session_id: getSessionId(),
  page_url: '/product/abc123'
})
```

### 2. **Track Add to Cart**

```typescript
import { logEvent } from '@/lib/analytics-helpers'
import { EVENT_TYPES } from '@/lib/analytics-schema'

// When user adds to cart
await logEvent({
  event_type: EVENT_TYPES.ADD_TO_CART,
  product_id: 'abc123',
  user_id: userId,
  session_id: sessionId,
  value: 49.99,
  metadata: {
    quantity: 2,
    variant: 'blue-large'
  }
})
```

### 3. **Track Purchase**

```typescript
import { logEvent } from '@/lib/analytics-helpers'
import { EVENT_TYPES } from '@/lib/analytics-schema'

// After successful order
await logEvent({
  event_type: EVENT_TYPES.PURCHASE,
  order_id: 'ORD-123',
  user_id: userId,
  session_id: sessionId,
  value: 149.99,
  metadata: {
    items_count: 3,
    payment_method: 'card'
  }
})
```

### 4. **Create Session**

```typescript
import { createSessionTracking } from '@/lib/analytics-helpers'

// On page load/session start
await createSessionTracking({
  session_id: generateSessionId(),
  visitor_id: getVisitorId(),
  user_id: user?.$id,
  ip_address: req.ip,
  country: geoData.country,
  city: geoData.city,
  device_type: getDeviceType(req.headers),
  browser: getBrowser(req.headers),
  landing_page: window.location.href,
  referrer: document.referrer,
  utm_source: urlParams.get('utm_source'),
  utm_medium: urlParams.get('utm_medium'),
  utm_campaign: urlParams.get('utm_campaign'),
  session_start: new Date()
})
```

### 5. **Track Live Visitor**

```typescript
import { upsertLiveVisitor } from '@/lib/analytics-helpers'

// Update every 10 seconds
await upsertLiveVisitor({
  visitor_id: getVisitorId(),
  session_id: getSessionId(),
  current_page: window.location.pathname,
  device_type: 'desktop',
  browser: 'Chrome',
  country: 'US',
  last_seen_at: new Date()
})
```

### 6. **Submit Product Review**

```typescript
import { createCustomerFeedback } from '@/lib/analytics-helpers'

// After review submission
await createCustomerFeedback({
  user_id: userId,
  product_id: 'abc123',
  order_id: 'ORD-123',
  rating: 5,
  comment: 'Great product!',
  verified_purchase: true
  // status defaults to 'pending'
  // helpful_count defaults to 0
})
```

### 7. **Daily Product Metrics**

```typescript
import { incrementProductMetrics } from '@/lib/analytics-helpers'

// Increment today's metrics for a product
await incrementProductMetrics('product-123', new Date(), {
  views: 1,
  add_to_cart: 0,
  purchases: 0
})
```

---

## 🔧 Integration Points

### **Product Page Component**

```typescript
// src/app/product/[slug]/page.tsx
import { logEvent, incrementProductMetrics } from '@/lib/analytics-helpers'
import { EVENT_TYPES } from '@/lib/analytics-schema'

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug)
  
  // Log product view (server-side)
  await logEvent({
    event_type: EVENT_TYPES.PRODUCT_VIEW,
    product_id: product.$id,
    page_url: `/product/${params.slug}`
  })
  
  // Increment daily metrics
  await incrementProductMetrics(product.$id, new Date(), {
    views: 1
  })
  
  return <ProductDetails product={product} />
}
```

### **Cart Actions**

```typescript
// src/app/api/cart/add/route.ts
import { logEvent } from '@/lib/analytics-helpers'
import { EVENT_TYPES } from '@/lib/analytics-schema'

export async function POST(request: Request) {
  const { productId, quantity, price } = await request.json()
  
  // Add to cart logic...
  
  // Track event
  await logEvent({
    event_type: EVENT_TYPES.ADD_TO_CART,
    product_id: productId,
    value: price * quantity,
    metadata: { quantity }
  })
  
  return Response.json({ success: true })
}
```

### **Checkout Success**

```typescript
// src/app/api/orders/create/route.ts
import { logEvent, createSessionTracking } from '@/lib/analytics-helpers'
import { EVENT_TYPES } from '@/lib/analytics-schema'

export async function POST(request: Request) {
  const orderData = await request.json()
  
  // Create order...
  const order = await createOrder(orderData)
  
  // Track purchase event
  await logEvent({
    event_type: EVENT_TYPES.PURCHASE,
    order_id: order.$id,
    user_id: orderData.userId,
    value: order.total,
    metadata: {
      items_count: order.items.length,
      payment_method: order.paymentMethod
    }
  })
  
  // Mark session as converted
  await updateSession(sessionId, {
    converted: true,
    order_id: order.$id
  })
  
  return Response.json({ order })
}
```

---

## 📈 Aggregation Example

### **Daily Aggregation Job**

```typescript
// src/scripts/aggregate-daily-analytics.ts
import { createProductAnalytics, createFinancialAnalytics } from '@/lib/analytics-helpers'

export async function aggregateDailyAnalytics() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  
  // Get all events from yesterday
  const events = await getEventsByDate(yesterday)
  
  // Aggregate by product
  const productMetrics: Record<string, any> = {}
  
  events.forEach(event => {
    if (!event.product_id) return
    
    if (!productMetrics[event.product_id]) {
      productMetrics[event.product_id] = {
        views: 0,
        add_to_cart: 0,
        purchases: 0,
        revenue: 0
      }
    }
    
    if (event.event_type === 'product_view') {
      productMetrics[event.product_id].views++
    }
    if (event.event_type === 'add_to_cart') {
      productMetrics[event.product_id].add_to_cart++
    }
    if (event.event_type === 'purchase') {
      productMetrics[event.product_id].purchases++
      productMetrics[event.product_id].revenue += event.value || 0
    }
  })
  
  // Save aggregated data
  for (const [productId, metrics] of Object.entries(productMetrics)) {
    await createProductAnalytics({
      product_id: productId,
      date: yesterday,
      ...metrics,
      conversion_rate: metrics.views > 0 ? (metrics.purchases / metrics.views) * 100 : 0
    })
  }
  
  // Aggregate financial data
  const orders = await getOrdersByDate(yesterday)
  const financialMetrics = {
    gross_revenue: orders.reduce((sum, o) => sum + o.subtotal, 0),
    net_revenue: orders.reduce((sum, o) => sum + o.total, 0),
    total_orders: orders.length,
    tax_collected: orders.reduce((sum, o) => sum + o.taxAmount, 0),
    shipping_collected: orders.reduce((sum, o) => sum + o.shippingCost, 0),
    discounts_given: orders.reduce((sum, o) => sum + o.discountAmount, 0)
  }
  
  await createFinancialAnalytics({
    date: yesterday,
    ...financialMetrics,
    average_order_value: financialMetrics.total_orders > 0 
      ? financialMetrics.gross_revenue / financialMetrics.total_orders 
      : 0
  })
}
```

---

## 🚀 Client-Side Tracking

### **Universal Tracker Component**

```typescript
// src/components/AnalyticsTracker.tsx
'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function AnalyticsTracker() {
  const pathname = usePathname()
  
  useEffect(() => {
    // Track page view
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'page_view',
        page_url: pathname,
        visitor_id: getVisitorId(),
        timestamp: new Date().toISOString()
      })
    })
  }, [pathname])
  
  useEffect(() => {
    // Update live visitor every 10 seconds
    const interval = setInterval(async () => {
      await fetch('/api/analytics/live', {
        method: 'POST',
        body: JSON.stringify({
          visitor_id: getVisitorId(),
          current_page: pathname,
          last_seen_at: new Date().toISOString()
        })
      })
    }, 10000)
    
    return () => clearInterval(interval)
  }, [pathname])
  
  return null
}

// Helper to get/create visitor ID
function getVisitorId() {
  let visitorId = localStorage.getItem('visitor_id')
  if (!visitorId) {
    visitorId = crypto.randomUUID()
    localStorage.setItem('visitor_id', visitorId)
  }
  return visitorId
}
```

### **API Route for Client Tracking**

```typescript
// src/app/api/analytics/track/route.ts
import { NextResponse } from 'next/server'
import { logEvent } from '@/lib/analytics-helpers'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    await logEvent({
      event_type: data.event_type,
      visitor_id: data.visitor_id,
      user_id: data.user_id,
      product_id: data.product_id,
      session_id: data.session_id,
      page_url: data.page_url,
      value: data.value,
      metadata: data.metadata,
      timestamp: data.timestamp
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}
```

---

## 🎨 Dashboard Integration

Once you have real data, connect the dashboard:

```typescript
// src/app/admin/analytics/page.tsx
import { createAdminClient } from '@/lib/appwrite-admin'
import { Query } from 'node-appwrite'

export default async function AnalyticsPage() {
  const { databases } = await createAdminClient()
  
  // Fetch last 30 days of product analytics
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const productAnalytics = await databases.listDocuments(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
    'product_analytics',
    [
      Query.greaterThan('date', thirtyDaysAgo.toISOString()),
      Query.orderDesc('date'),
      Query.limit(100)
    ]
  )
  
  // Transform data for charts
  const salesData = productAnalytics.documents.map(doc => ({
    date: doc.date,
    revenue: doc.revenue,
    orders: doc.purchases
  }))
  
  return <AnalyticsDashboard data={salesData} />
}
```

---

## ✅ Benefits of Code-Based Defaults

1. **Type Safety** - Full TypeScript intellisense
2. **Centralized** - All defaults in one place
3. **Flexible** - Easy to change defaults
4. **Clear** - Explicit in code, not hidden in DB
5. **Testable** - Easy to mock and test

---

## 🎯 Next Steps

1. ✅ Start tracking events on key pages
2. ✅ Set up daily aggregation job
3. ✅ Connect dashboard to real data
4. ✅ Add real-time visitor tracking

---

## 📚 Reference

- **Helpers:** `/src/lib/analytics-helpers.ts`
- **Schema:** `/src/lib/analytics-schema.ts`
- **Types:** `/src/types/analytics.ts`
- **Setup Guide:** `ANALYTICS_SETUP.md`

---

**🎉 Your analytics system is ready to track everything!**
