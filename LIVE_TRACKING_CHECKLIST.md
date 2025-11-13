# ✅ Live Visitor Tracking - Integration Checklist

## 📦 Files Created

### Client Components
- ✅ `/src/components/LiveVisitorTracker.tsx` - Tracks all visitors automatically
- ✅ `/src/components/analytics/LiveVisitorsWidget.tsx` - Dashboard widget
- ✅ `/src/hooks/useProductTracking.ts` - Product tracking hooks

### API Routes
- ✅ `/src/app/api/analytics/live-visitor/route.ts` - Update visitor data
- ✅ `/src/app/api/analytics/track/route.ts` - Log events
- ✅ `/src/app/api/analytics/live-visitors/route.ts` - Fetch active visitors

### Documentation
- ✅ `LIVE_TRACKING_GUIDE.md` - Complete guide
- ✅ `EXAMPLE_PRODUCT_PAGE.tsx` - Integration example
- ✅ `LIVE_TRACKING_CHECKLIST.md` - This file

---

## 🚀 Integration Steps (Do This Now)

### Step 1: Add Tracker to Root Layout (REQUIRED)

Open your root layout file and add the tracker:

**File:** `/src/app/layout.tsx`

```tsx
import { LiveVisitorTracker } from '@/components/LiveVisitorTracker'

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en">
      <body>
        {children}
        
        {/* Add this line - tracks all visitors automatically */}
        <LiveVisitorTracker />
      </body>
    </html>
  )
}
```

### Step 2: Add Widget to Analytics Dashboard (RECOMMENDED)

**File:** `/src/app/admin/analytics/page.tsx`

```tsx
import { LiveVisitorsWidget } from '@/components/analytics/LiveVisitorsWidget'

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Add the live visitors widget */}
      <LiveVisitorsWidget />
      
      {/* Your other analytics components */}
    </div>
  )
}
```

### Step 3: Add Product Tracking (OPTIONAL BUT RECOMMENDED)

**In your product page:**

```tsx
'use client'

import { useAutoTrackProductView } from '@/hooks/useProductTracking'

export default function ProductPage({ product }) {
  // This automatically tracks when someone views the product
  useAutoTrackProductView(product ? {
    product_id: product.$id,
    product_name: product.name,
    product_price: product.price,
    category: product.category,
    brand: product.brand,
  } : null)

  return <div>{/* Your product page */}</div>
}
```

**In your product cards/buttons:**

```tsx
'use client'

import { useProductTracking } from '@/hooks/useProductTracking'

export function ProductCard({ product }) {
  const { trackAddToCart, trackAddToWishlist } = useProductTracking()

  return (
    <div>
      <button onClick={() => trackAddToCart(product, 1)}>
        Add to Cart
      </button>
      <button onClick={() => trackAddToWishlist(product)}>
        Wishlist
      </button>
    </div>
  )
}
```

---

## 🧪 Testing

### 1. Test Visitor Tracking

1. Start your dev server: `npm run dev`
2. Open your site in a browser
3. Check browser console - should see no errors
4. Wait 10 seconds
5. Check Appwrite Console → Database → `live_visitors` collection
6. You should see your visitor record with:
   - ✅ visitor_id
   - ✅ current_page
   - ✅ device_type, browser, os
   - ✅ country, city (may be "Unknown" in development)

### 2. Test Dashboard Widget

1. Navigate to `/admin/analytics`
2. You should see the "Live Visitors" widget
3. It should show "1 online" (you)
4. Open the site in another browser/incognito
5. Widget should update to "2 online"

### 3. Test Product Tracking

1. Navigate to a product page with tracking enabled
2. Check browser console - should see tracking requests
3. Check Appwrite Console → `events_log` collection
4. You should see a `product_view` event

### 4. Test Session Duration

1. Stay on the site for 1-2 minutes
2. Navigate between pages
3. Check the widget - time on site should increase
4. Close the tab
5. Wait 30 seconds
6. Widget should show visitor as gone

---

## 🎯 What You Get

### Real-Time Data
- ✅ Who's online right now
- ✅ Where they're from (country, city)
- ✅ What device they're using
- ✅ What page they're viewing
- ✅ How long they've been browsing

### Historical Data
- ✅ Complete session records
- ✅ Product views
- ✅ Add to cart events
- ✅ Wishlist additions
- ✅ Page views

### Collections Used
- `live_visitors` - Active visitors (updated every 10s)
- `session_tracking` - Complete session records
- `events_log` - All events (views, clicks, etc.)

---

## 📊 View Your Data

### In Appwrite Console
1. Go to your Appwrite Console
2. Select your project
3. Go to Databases → Select your database
4. View collections:
   - `live_visitors` - See who's online now
   - `session_tracking` - See all sessions
   - `events_log` - See all tracked events

### In Your Dashboard
- Navigate to `/admin/analytics`
- View the Live Visitors Widget
- See real-time updates

---

## 🐛 Troubleshooting

### No visitors showing up?

**Check:**
1. ✅ `LiveVisitorTracker` added to root layout?
2. ✅ No console errors in browser?
3. ✅ API routes working? Check Network tab
4. ✅ Appwrite credentials correct in `.env.local`?

**Try:**
```bash
# Test the API directly
curl http://localhost:3000/api/analytics/live-visitors
```

### Geolocation showing "Unknown"?

**This is normal in development!**
- Localhost IPs always return "Unknown"
- Deploy to Vercel/Cloudflare for real geolocation
- Or set up a paid IP geolocation service

### Widget not updating?

**Check:**
1. ✅ Component is client-side (`'use client'`)
2. ✅ No errors in browser console
3. ✅ API endpoint returns data
4. ✅ At least one visitor exists in database

---

## 🎓 Next Steps

### Immediate (Recommended)
1. ✅ Add `LiveVisitorTracker` to root layout
2. ✅ Add `LiveVisitorsWidget` to analytics dashboard
3. ✅ Test with multiple browsers
4. ✅ Verify data in Appwrite Console

### Short Term
- Add product tracking to product pages
- Add tracking to cart buttons
- Customize widget appearance
- Add more tracking events

### Long Term
- Create visitor insights dashboard
- Add geographic heat map
- Set up traffic alerts
- Implement A/B testing based on visitor data
- Create visitor segments

---

## 📚 Documentation

- **Complete Guide:** `LIVE_TRACKING_GUIDE.md`
- **Example Page:** `EXAMPLE_PRODUCT_PAGE.tsx`
- **Analytics Docs:** `ANALYTICS_COMPLETE.md`

---

## ⚡ Quick Commands

```bash
# Start dev server
npm run dev

# View logs
npm run dev | grep analytics

# Test API endpoints
curl http://localhost:3000/api/analytics/live-visitors
curl -X POST http://localhost:3000/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{"event_type":"page_view","visitor_id":"test","session_id":"test","timestamp":"2024-01-01T00:00:00Z"}'
```

---

**Need help?** Check `LIVE_TRACKING_GUIDE.md` for detailed documentation and troubleshooting.
