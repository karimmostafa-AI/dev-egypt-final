# 🔴 Live Visitor Tracking System

Complete real-time visitor tracking for your e-commerce platform. Track who's browsing, where they're from, what devices they're using, and which products they're viewing.

## 📦 What's Included

### Core Components
- **LiveVisitorTracker** - Client-side component that tracks visitors every 10 seconds
- **LiveVisitorsWidget** - Dashboard widget showing real-time active visitors
- **useProductTracking** - Hook for tracking product views and interactions
- **API Routes** - Backend endpoints for tracking and retrieving data

### Features
✅ Real-time visitor tracking (updates every 10 seconds)
✅ Geolocation detection (country + city)
✅ Device/browser/OS detection
✅ Session duration tracking
✅ Product view tracking
✅ Page navigation tracking
✅ Automatic cleanup of inactive visitors (after 30 seconds)
✅ Beautiful animated dashboard widget

## 🚀 Quick Start (3 Steps)

### 1. Add the tracker to your root layout

```tsx path=/src/app/layout.tsx start=null
import { LiveVisitorTracker } from '@/components/LiveVisitorTracker'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <LiveVisitorTracker />
      </body>
    </html>
  )
}
```

### 2. Add the widget to your admin dashboard

```tsx path=/src/app/admin/analytics/page.tsx start=null
import { LiveVisitorsWidget } from '@/components/analytics/LiveVisitorsWidget'

export default function AnalyticsPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Other analytics components */}
      
      <div className="lg:col-span-1">
        <LiveVisitorsWidget />
      </div>
    </div>
  )
}
```

### 3. Track product views in product pages

```tsx path=/src/app/products/[id]/page.tsx start=null
'use client'

import { useAutoTrackProductView } from '@/hooks/useProductTracking'

export default function ProductPage({ product }) {
  // Auto-track when product is viewed
  useAutoTrackProductView(product ? {
    product_id: product.$id,
    product_name: product.name,
    product_price: product.price,
    category: product.category,
    brand: product.brand,
  } : null)

  return (
    <div>
      {/* Your product page content */}
    </div>
  )
}
```

That's it! Your live tracking is now active. 🎉

## 📊 Dashboard Widget

The `LiveVisitorsWidget` shows:
- ✅ Number of active visitors
- ✅ Visitor location (city, country)
- ✅ Device type (desktop, mobile, tablet)
- ✅ Browser and OS
- ✅ Time spent on site
- ✅ Current page being viewed
- ✅ Real-time animations

## 🎯 Tracking Product Interactions

### Manual Tracking

```tsx path=null start=null
'use client'

import { useProductTracking } from '@/hooks/useProductTracking'

export function ProductCard({ product }) {
  const { trackProductView, trackAddToCart, trackAddToWishlist } = useProductTracking()

  return (
    <div>
      <button onClick={() => trackAddToCart(product, 1)}>
        Add to Cart
      </button>
      
      <button onClick={() => trackAddToWishlist(product)}>
        Add to Wishlist
      </button>
    </div>
  )
}
```

### Available Tracking Methods

```typescript path=null start=null
const {
  trackProductView,      // Track when product is viewed
  trackAddToCart,        // Track add to cart with quantity
  trackAddToWishlist,    // Track wishlist addition
  trackSearch,           // Track search queries
} = useProductTracking()
```

## 🔧 API Routes

### POST `/api/analytics/live-visitor`
Updates or creates live visitor record.

**Payload:**
```json
{
  "visitor_id": "visitor_1234567890_abc",
  "session_id": "session_1234567890_xyz",
  "current_page": "/products/laptop-123",
  "device_type": "desktop",
  "browser": "Chrome",
  "os": "Windows",
  "screen_resolution": "1920x1080",
  "user_id": "user_123",
  "entered_at": "2024-01-15T10:30:00Z",
  "last_seen_at": "2024-01-15T10:35:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "location": {
    "country": "United States",
    "city": "New York"
  }
}
```

### POST `/api/analytics/track`
Logs visitor events (product views, add to cart, etc.).

**Payload:**
```json
{
  "event_type": "product_view",
  "visitor_id": "visitor_1234567890_abc",
  "session_id": "session_1234567890_xyz",
  "page_url": "/products/laptop-123",
  "product_id": "prod_456",
  "product_name": "Gaming Laptop",
  "product_price": 1299.99,
  "category": "Electronics",
  "timestamp": "2024-01-15T10:35:00Z"
}
```

### GET `/api/analytics/live-visitors`
Retrieves active visitors (last seen < 30 seconds ago).

**Response:**
```json
{
  "visitors": [
    {
      "$id": "doc_123",
      "visitor_id": "visitor_1234567890_abc",
      "session_id": "session_1234567890_xyz",
      "current_page": "/products/laptop-123",
      "device_type": "desktop",
      "browser": "Chrome",
      "os": "Windows",
      "country": "United States",
      "city": "New York",
      "entered_at": "2024-01-15T10:30:00Z",
      "last_seen_at": "2024-01-15T10:35:00Z"
    }
  ],
  "total": 5,
  "cleaned": 2
}
```

## 🌍 Geolocation Detection

The system uses a multi-tier approach:

1. **Vercel/Cloudflare Headers** (Production)
   - `x-vercel-ip-country`, `x-vercel-ip-city`
   - `cf-ipcountry`, `cf-ipcity`

2. **IP Geolocation API** (Fallback for development)
   - Uses `ip-api.com` (free, no API key required)
   - 2-second timeout
   - Graceful fallback to "Unknown"

3. **Development Mode**
   - Localhost IPs return "Unknown"
   - No external API calls for `127.0.0.1` or `::1`

## 🎨 Customization

### Change Update Frequency

In `LiveVisitorTracker.tsx`:
```tsx path=null start=null
// Change from 10 seconds to 5 seconds
updateIntervalRef.current = setInterval(updateVisitor, 5000)
```

### Change Inactive Threshold

In `/api/analytics/live-visitors/route.ts`:
```typescript path=null start=null
// Change from 30 seconds to 60 seconds
const INACTIVE_THRESHOLD_MS = 60000
```

### Customize Widget Appearance

The widget uses Tailwind CSS and is fully customizable. Edit `LiveVisitorsWidget.tsx`:

```tsx path=null start=null
// Change colors, spacing, layout, etc.
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
```

## 📈 Data Collected

### Live Visitors Collection
- `visitor_id` - Unique visitor identifier (localStorage)
- `session_id` - Session identifier (sessionStorage)
- `user_id` - Logged-in user ID (if authenticated)
- `current_page` - Page URL visitor is viewing
- `device_type` - desktop, mobile, or tablet
- `browser` - Chrome, Firefox, Safari, etc.
- `os` - Windows, macOS, iOS, Android, etc.
- `country` - Country from IP geolocation
- `city` - City from IP geolocation
- `ip_address` - Visitor's IP address
- `entered_at` - Session start timestamp
- `last_seen_at` - Last activity timestamp
- `screen_resolution` - Screen dimensions (e.g., 1920x1080)
- `referrer` - Referrer URL or 'direct'

### Session Tracking Collection
- All visitor data plus:
- `start_time` - Session start
- `end_time` - Session end
- `session_duration` - Total time in seconds
- `pages_visited` - Number of pages viewed
- `landing_page` - First page visited

### Events Log Collection
- `event_type` - page_view, product_view, add_to_cart, etc.
- `product_id`, `product_name`, `product_price`
- `quantity`, `cart_value`
- `search_query`
- `custom_data` - Additional event metadata

## 🔐 Privacy Considerations

### Anonymous Tracking
- Visitor IDs are randomly generated
- No personally identifiable information collected
- User IDs only tracked if user is logged in

### GDPR Compliance
To make this system GDPR compliant:

1. Add cookie consent banner
2. Only initialize tracker after consent
3. Provide opt-out mechanism
4. Add data deletion endpoint

Example:
```tsx path=null start=null
{hasConsent && <LiveVisitorTracker />}
```

## 🐛 Troubleshooting

### Visitors not showing up?

1. Check that `LiveVisitorTracker` is in your root layout
2. Verify API routes are accessible
3. Check browser console for errors
4. Ensure Appwrite credentials are correct

### Geolocation showing "Unknown"?

1. In development, this is expected (localhost)
2. Deploy to Vercel/Cloudflare for automatic geo headers
3. Check that `ip-api.com` is not blocked
4. Verify IP headers in request

### Widget not updating?

1. Check browser console for fetch errors
2. Verify `/api/analytics/live-visitors` endpoint works
3. Check that data exists in Appwrite collection
4. Ensure visitors are active (last seen < 30 seconds)

### Product views not tracked?

1. Verify product page is using `useAutoTrackProductView` or manual tracking
2. Check `/api/analytics/track` endpoint
3. Verify `events_log` collection exists
4. Check browser console for tracking errors

## 🎯 Next Steps

1. **Add real-time updates with Appwrite Realtime**
   ```tsx path=null start=null
   import { client } from '@/lib/appwrite'
   
   client.subscribe('databases.*.collections.*.documents', (response) => {
     // Update widget in real-time
   })
   ```

2. **Create visitor insights dashboard**
   - Top countries by visitors
   - Device breakdown chart
   - Peak traffic hours
   - Popular pages

3. **Add heatmap tracking**
   - Click tracking
   - Scroll depth
   - Hover tracking

4. **Set up alerts**
   - Email when traffic spikes
   - Slack notification for new visitors
   - Alert on unusual behavior

## 📚 Related Documentation

- [Analytics Complete Guide](./ANALYTICS_COMPLETE.md)
- [Analytics Usage Guide](./ANALYTICS_USAGE_GUIDE.md)
- [Analytics Schema Reference](./src/lib/analytics-schema.ts)

---

**Need help?** Check the troubleshooting section or review the source code in:
- `/src/components/LiveVisitorTracker.tsx`
- `/src/hooks/useProductTracking.ts`
- `/src/app/api/analytics/`
