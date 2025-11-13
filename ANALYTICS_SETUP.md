# 📊 E-commerce Analytics System Setup

## Overview

This document describes the comprehensive analytics system that has been added to your e-commerce platform. The system includes:

- **9 new analytics collections** in Appwrite
- **Enhanced existing collections** with analytics fields
- **Full-stack dashboard** with Recharts visualizations
- **Event tracking system** for behavioral analytics
- **Real-time visitor tracking**

---

## 🗄️ **New Collections Added**

### 1. **product_analytics**
Daily aggregated metrics per product.

**Fields:**
- `product_id` - Product reference
- `date` - Analytics date
- `views` - Product page views
- `add_to_cart` - Times added to cart
- `purchases` - Purchase count
- `returns` - Return count
- `revenue` - Total revenue
- `discounted_sales` - Sales with discounts
- `average_price` - Average selling price
- `conversion_rate` - View to purchase rate
- `wishlist_adds` - Wishlist additions

**Use Cases:**
- Track product performance over time
- Identify best/worst performers
- Calculate conversion rates per product
- Revenue attribution

---

### 2. **session_tracking**
Visitor session tracking (Google Analytics-style).

**Fields:**
- `session_id` - Unique session identifier
- `user_id` - Logged-in user (if any)
- `visitor_id` - Anonymous visitor ID
- `ip_address`, `country`, `city` - Geo data
- `device_type`, `browser`, `os` - Device info
- `referrer` - Where they came from
- `landing_page` - First page visited
- `utm_source`, `utm_medium`, `utm_campaign` - Marketing attribution
- `session_start`, `session_end` - Session timestamps
- `pages_viewed` - Number of pages
- `time_on_site` - Session duration
- `converted` - Whether they purchased
- `order_id` - Resulting order (if converted)

**Use Cases:**
- Attribution modeling
- User journey analysis
- Conversion funnel tracking
- Campaign performance

---

### 3. **live_visitors**
Real-time visitor tracking.

**Fields:**
- `visitor_id` - Unique visitor
- `user_id` - User if logged in
- `session_id` - Current session
- `current_page` - Page they're on
- `device_type`, `browser` - Device info
- `country`, `city` - Location
- `entered_at` - When they arrived
- `last_seen_at` - Last activity timestamp

**Use Cases:**
- Live dashboard widgets ("54 users online")
- Real-time map visualization
- Live product popularity

---

### 4. **events_log**
Generic event tracking for all user actions.

**Fields:**
- `event_type` - Event name (see EVENT_TYPES constant)
- `user_id`, `session_id`, `visitor_id` - Identity
- `product_id`, `category_id`, `brand_id`, `order_id` - Context
- `value` - Numeric value (e.g., cart value)
- `metadata` - JSON for additional data
- `page_url` - Where event occurred
- `timestamp` - When it happened

**Event Types:**
```typescript
PAGE_VIEW, PRODUCT_VIEW, ADD_TO_CART, REMOVE_FROM_CART, 
CHECKOUT_START, PURCHASE, ADD_TO_WISHLIST, USER_LOGIN, etc.
```

**Use Cases:**
- Behavioral analytics
- Funnel analysis
- User engagement tracking
- Custom event tracking

---

### 5. **customer_feedback**
Product reviews and ratings.

**Fields:**
- `user_id` - Reviewer
- `product_id`, `order_id` - What they reviewed
- `rating` - 1-5 stars
- `comment` - Review text
- `sentiment_score` - AI sentiment analysis (optional)
- `status` - pending/approved/rejected
- `helpful_count` - Upvotes
- `verified_purchase` - Did they buy it?

**Use Cases:**
- Product ratings aggregation
- Review moderation
- Sentiment analysis
- Social proof

---

### 6. **financial_analytics**
Daily financial summaries.

**Fields:**
- `date` - Date of record
- `gross_revenue` - Total sales
- `net_revenue` - After refunds
- `total_orders` - Order count
- `refunds` - Refund amount
- `cost_of_goods_sold` - COGS
- `operational_expense` - Operating costs
- `net_profit` - Bottom line
- `profit_margin` - Percentage
- `average_order_value` - AOV
- `tax_collected`, `shipping_collected`, `discounts_given`

**Use Cases:**
- P&L reports
- Daily financial dashboards
- Profitability analysis
- Tax reporting

---

### 7. **traffic_sources**
Campaign and channel performance.

**Fields:**
- `source` - Traffic source (Google, Facebook, etc.)
- `medium` - Medium (organic, cpc, email, etc.)
- `campaign` - Campaign name
- `date` - Date of data
- `clicks` - Click count
- `sessions` - Session count
- `conversions` - Conversion count
- `revenue` - Revenue generated
- `bounce_rate`, `avg_session_duration`

**Use Cases:**
- Marketing ROI
- Channel performance
- Campaign attribution
- Budget allocation

---

### 8. **category_analytics**
Performance metrics per category.

**Fields:**
- `category_id` - Category reference
- `date` - Analytics date
- `views`, `orders`, `revenue`, `units_sold`
- `conversion_rate`

**Use Cases:**
- Category performance comparison
- Inventory planning
- Merchandising decisions

---

### 9. **brand_analytics**
Performance metrics per brand.

**Fields:**
- `brand_id` - Brand reference
- `date` - Analytics date
- `views`, `orders`, `revenue`, `units_sold`
- `conversion_rate`, `return_rate`

**Use Cases:**
- Brand performance tracking
- Vendor negotiations
- Assortment planning

---

## 🔧 **Enhanced Existing Collections**

### **products** (Enhanced)
New fields:
- `views_count` - Total views
- `total_sales` - Units sold
- `total_revenue` - Revenue generated
- `average_rating` - Avg review rating
- `reviews_count` - Number of reviews
- `last_purchased_at` - Most recent purchase

### **orders** (Enhanced)
New fields:
- `device_type` - Device used
- `source` - Traffic source
- `referrer` - Referring URL
- `session_id` - Session reference
- `utm_source`, `utm_medium`, `utm_campaign` - Attribution

### **customers** (Enhanced)
New fields:
- `country`, `city` - Location
- `device`, `browser`, `os` - Device info
- `last_active` - Last activity
- `lifetime_value` - CLV
- `loyalty_points` - Loyalty program
- `referral_source` - How they found you

---

## 🚀 **Running the Migration**

### **Step 1: Verify Environment**

Make sure your `.env.local` file contains:
```bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=68dbeba80017571a1581
NEXT_PUBLIC_APPWRITE_DATABASE_ID=68dbeceb003bf10d9498
APPWRITE_API_KEY=your_api_key_here
```

### **Step 2: Run the Migration**

```bash
npm run migrate:analytics
```

**What it does:**
1. Creates all 9 new analytics collections
2. Adds all attributes and indexes
3. Updates existing collections with new fields
4. Handles conflicts gracefully (skips existing items)

**Expected Output:**
```
🚀 Starting Analytics Collections Migration

📦 Creating collection: Product Analytics (product_analytics)
✅ Collection created: Product Analytics
  Adding attribute: product_id (string)
    ✓ product_id added
  Adding attribute: date (datetime)
    ✓ date added
...

📊 Migration Summary
============================================================
✅ Created: 9 collections
⚠️  Skipped: 0 collections (already exist)
❌ Failed: 0 collections
============================================================

✨ Analytics migration completed!
```

### **Step 3: Verify in Appwrite Console**

1. Go to https://fra.cloud.appwrite.io/console
2. Navigate to your project
3. Click "Databases" → Your database
4. You should see the new collections

---

## 📊 **Analytics Dashboard**

The analytics dashboard is located at:
```
/admin/analytics
```

### **Current Features:**
✅ 6 KPI summary cards with trend indicators  
✅ Sales over time (line chart)  
✅ Orders by channel (pie chart)  
✅ Top products (bar chart)  
✅ Customer growth (area chart)  
✅ Traffic sources (progress bars)  
✅ Recent orders table (paginated)  
✅ Framer Motion animations  
✅ Dark mode support  
✅ Responsive design  

### **Currently Using Mock Data**
The dashboard currently displays mock data from `/src/lib/mockData.ts`

---

## 🔌 **Integrating Real Data**

### **Option 1: Direct Database Queries**

Update `page.tsx` to fetch from Appwrite:

```typescript
import { createAdminClient } from '@/lib/appwrite-admin'
import { Query } from 'node-appwrite'

export default async function AnalyticsPage() {
  const { databases } = await createAdminClient()
  
  // Fetch product analytics
  const productAnalytics = await databases.listDocuments(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
    'product_analytics',
    [
      Query.greaterThan('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      Query.orderDesc('date')
    ]
  )
  
  // Transform and pass to components
  return <AnalyticsDashboard data={productAnalytics} />
}
```

### **Option 2: API Routes**

Create `/app/api/analytics/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite-admin'

export async function GET(request: Request) {
  const { databases } = await createAdminClient()
  
  const analytics = await databases.listDocuments(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
    'product_analytics'
  )
  
  return NextResponse.json(analytics)
}
```

Then fetch client-side:
```typescript
const { data } = await fetch('/api/analytics').then(r => r.json())
```

---

## 📈 **Event Tracking Setup**

### **Client-Side Tracking Script**

Create `/src/lib/analytics-tracker.ts`:

```typescript
import { EVENT_TYPES } from './analytics-schema'

export async function trackEvent(
  eventType: string,
  data: {
    productId?: string
    value?: number
    metadata?: Record<string, any>
  }
) {
  const sessionId = getSessionId() // From cookie/localStorage
  const visitorId = getVisitorId() // Anonymous ID
  
  await fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: eventType,
      session_id: sessionId,
      visitor_id: visitorId,
      timestamp: new Date().toISOString(),
      page_url: window.location.href,
      ...data
    })
  })
}

// Usage:
trackEvent(EVENT_TYPES.PRODUCT_VIEW, { productId: 'abc123' })
trackEvent(EVENT_TYPES.ADD_TO_CART, { productId: 'abc123', value: 49.99 })
```

### **API Route for Tracking**

Create `/app/api/analytics/track/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite-admin'
import { ID } from 'node-appwrite'

export async function POST(request: Request) {
  const body = await request.json()
  const { databases } = await createAdminClient()
  
  await databases.createDocument(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
    'events_log',
    ID.unique(),
    body
  )
  
  return NextResponse.json({ success: true })
}
```

---

## 🔴 **Real-Time Visitor Tracking**

Use Appwrite Realtime to track live visitors:

```typescript
import { client } from '@/lib/appwrite'

// Update live visitor status
async function updateLiveVisitor() {
  const visitorId = getVisitorId()
  
  await fetch('/api/analytics/live', {
    method: 'POST',
    body: JSON.stringify({
      visitor_id: visitorId,
      current_page: window.location.pathname,
      last_seen_at: new Date().toISOString()
    })
  })
}

// Update every 10 seconds
setInterval(updateLiveVisitor, 10000)

// Subscribe to real-time updates
client.subscribe('databases.*.collections.live_visitors.documents', (response) => {
  console.log('Live visitor update:', response)
})
```

---

## 📊 **Aggregation Strategy**

### **Daily Aggregation Job**

Use Appwrite Functions or a cron job to aggregate daily data:

```typescript
// Run daily at midnight
async function aggregateDailyAnalytics() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  
  // Aggregate product analytics
  const events = await fetchEvents(yesterday)
  
  const productStats = {}
  events.forEach(event => {
    if (!productStats[event.product_id]) {
      productStats[event.product_id] = {
        views: 0,
        add_to_cart: 0,
        purchases: 0,
        revenue: 0
      }
    }
    
    if (event.event_type === 'product_view') productStats[event.product_id].views++
    if (event.event_type === 'add_to_cart') productStats[event.product_id].add_to_cart++
    if (event.event_type === 'purchase') {
      productStats[event.product_id].purchases++
      productStats[event.product_id].revenue += event.value
    }
  })
  
  // Save to product_analytics collection
  for (const [productId, stats] of Object.entries(productStats)) {
    await databases.createDocument(
      APPWRITE_DATABASE_ID,
      'product_analytics',
      ID.unique(),
      {
        product_id: productId,
        date: yesterday.toISOString(),
        ...stats
      }
    )
  }
}
```

---

## 🎯 **Next Steps**

1. ✅ **Run the migration** (`npm run migrate:analytics`)
2. ⏳ **Integrate event tracking** on key pages
3. ⏳ **Connect dashboard to real data**
4. ⏳ **Set up daily aggregation job**
5. ⏳ **Add real-time visitor tracking**
6. ⏳ **Build additional analytics pages** (Traffic, Customers, Products)

---

## 📚 **Additional Resources**

- **Appwrite Databases Docs:** https://appwrite.io/docs/products/databases
- **Appwrite Realtime:** https://appwrite.io/docs/apis/realtime
- **Recharts Documentation:** https://recharts.org/
- **Analytics Schema:** `/src/lib/analytics-schema.ts`
- **Mock Data:** `/src/lib/mockData.ts`

---

## 🆘 **Troubleshooting**

### **Migration fails with "API key invalid"**
- Verify `APPWRITE_API_KEY` in `.env.local`
- Make sure API key has full permissions

### **Rate limiting errors**
- The script includes delays (300ms) between operations
- If you still hit limits, increase the delays in `migrate-analytics-collections.ts`

### **Collection already exists**
- Safe to ignore - script will skip and continue
- To recreate, manually delete from Appwrite Console first

### **TypeScript errors**
- Run `npm install` to ensure all dependencies are installed
- Check that `node-appwrite` is version `^19.1.0` or higher

---

**🎉 Your analytics system is ready to track everything!**
