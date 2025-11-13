# Debug Live Visitor Tracking

## What I Fixed

1. ✅ **Query Format**: Changed from old string-based queries to `Query.equal()`
2. ✅ **Collection IDs**: Fixed collection names to use correct IDs instead of names
3. ✅ **Missing Fields**: Added `os`, `ip_address`, `referrer`, `screen_resolution` to upsertLiveVisitor
4. ✅ **Field Mappings**: Fixed createSessionTracking to handle flexible field names
5. ✅ **Private Browsing**: Added fallback for localStorage/sessionStorage

## Test Steps

### 1. Restart Your Dev Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### 2. Open Browser Console (F12)
Visit `http://localhost:3000` and open DevTools Console

### 3. Check for Errors
Look for any errors related to:
- ❌ Failed to update live visitor
- ❌ Failed to fetch live visitors
- ❌ Appwrite database errors

### 4. Check Network Tab
1. Go to Network tab in DevTools
2. Filter by "XHR" or "Fetch"
3. Look for requests to:
   - `/api/analytics/live-visitor` (should be called every 10 seconds)
   - `/api/analytics/live-visitors` (when viewing admin page)

### 5. Manual Test
Paste this in the browser console:
```javascript
// Test visitor tracking
fetch('/api/analytics/live-visitor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    visitor_id: 'test_' + Date.now(),
    session_id: 'session_' + Date.now(),
    current_page: '/',
    device_type: 'desktop',
    browser: 'Chrome',
    os: 'Windows',
    screen_resolution: '1920x1080',
    entered_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
  })
}).then(r => r.json()).then(d => {
  console.log('✅ Tracking response:', d)
})

// Wait 3 seconds, then check visitors
setTimeout(() => {
  fetch('/api/analytics/live-visitors')
    .then(r => r.json())
    .then(d => {
      console.log('✅ Live visitors:', d)
      console.log(`   Total: ${d.total} visitors`)
    })
}, 3000)
```

### 6. Check Admin Dashboard
1. Open a new tab/window: `http://localhost:3000/admin/analytics`
2. Wait 15 seconds (widget refreshes every 15 seconds)
3. You should see at least 1 visitor (yourself)

## Common Issues

### Still showing 0 visitors?

**Check Appwrite Connection:**
```javascript
// In browser console
fetch('/api/analytics/live-visitors')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Expected response:
```json
{
  "visitors": [...],
  "total": 1,
  "cleaned": 0
}
```

### Error: "Failed to fetch live visitors"

1. Check `.env.local` for correct Appwrite credentials:
   - `NEXT_PUBLIC_APPWRITE_ENDPOINT`
   - `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
   - `NEXT_PUBLIC_APPWRITE_DATABASE_ID`
   - `APPWRITE_API_KEY`

2. Verify collections exist in Appwrite:
   - Live Visitors: `68dbf13d00096b0e2e70`
   - Session Tracking: `68dbf14a0008b61ce7f9`

### Tracker not sending data?

Check if `LiveVisitorTracker` is in your layout:
```bash
# Search for LiveVisitorTracker
grep -r "LiveVisitorTracker" src/app/layout.tsx
```

Should see: `<LiveVisitorTracker />`

## Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
APPWRITE_API_KEY=your_api_key
```

## Logs to Check

### Server Logs (Terminal)
Look for:
- ✅ `POST /api/analytics/live-visitor 200`
- ✅ `GET /api/analytics/live-visitors 200`
- ❌ Any 500 errors

### Browser Console
Look for:
- ✅ No errors about localStorage/sessionStorage
- ❌ "Failed to update live visitor"
- ❌ Network errors (CORS, 404, 500)

## Success Indicators

✅ Network tab shows requests to `/api/analytics/live-visitor` every 10 seconds
✅ No errors in browser console
✅ `/api/analytics/live-visitors` returns `total > 0`
✅ Admin dashboard shows your visitor after 15 seconds

## Still Not Working?

Share:
1. Browser console errors (screenshot)
2. Network tab showing failed requests
3. Server terminal logs showing errors
