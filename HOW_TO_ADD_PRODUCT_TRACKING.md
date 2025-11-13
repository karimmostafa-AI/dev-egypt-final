# 🎯 How to Add Product Tracking to Your Product Pages

## Quick Integration (Copy & Paste)

### For Product Detail Pages

When you create a product detail page, add this code:

```tsx
'use client'

import { useAutoTrackProductView } from '@/hooks/useProductTracking'

export default function ProductPage({ product }) {
  // ✅ This automatically tracks when someone views the product
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

### For Add to Cart Buttons

In any component with an "Add to Cart" button:

```tsx
'use client'

import { useProductTracking } from '@/hooks/useProductTracking'

export function ProductCard({ product }) {
  const { trackAddToCart, trackAddToWishlist } = useProductTracking()

  const handleAddToCart = () => {
    // Track the event
    trackAddToCart({
      product_id: product.$id,
      product_name: product.name,
      product_price: product.price,
      category: product.category,
      brand: product.brand,
    }, 1) // quantity = 1

    // Your actual cart logic here
    // addToCart(product)
  }

  return (
    <div>
      <button onClick={handleAddToCart}>
        Add to Cart
      </button>
    </div>
  )
}
```

### For Wishlist Buttons

```tsx
'use client'

import { useProductTracking } from '@/hooks/useProductTracking'

export function WishlistButton({ product }) {
  const { trackAddToWishlist } = useProductTracking()

  const handleWishlist = () => {
    trackAddToWishlist({
      product_id: product.$id,
      product_name: product.name,
      product_price: product.price,
      category: product.category,
    })

    // Your wishlist logic here
  }

  return (
    <button onClick={handleWishlist}>
      ♥ Add to Wishlist
    </button>
  )
}
```

### For Search Functionality

```tsx
'use client'

import { useProductTracking } from '@/hooks/useProductTracking'

export function SearchBar() {
  const { trackSearch } = useProductTracking()

  const handleSearch = (query: string) => {
    // Track the search
    trackSearch(query)

    // Your search logic here
  }

  return (
    <input
      type="search"
      onChange={(e) => handleSearch(e.target.value)}
      placeholder="Search products..."
    />
  )
}
```

## What Gets Tracked?

### Automatically (No Code Needed)
- ✅ Page views (every page navigation)
- ✅ Visitor location (country, city)
- ✅ Device info (browser, OS, device type)
- ✅ Session duration
- ✅ Current page being viewed

### With Product Tracking (Add to Product Pages)
- 🎯 Product views
- 🛒 Add to cart events
- ❤️ Wishlist additions
- 🔍 Search queries

## Where to See the Data?

1. **Real-Time**: `/admin/analytics` → Live Visitors Widget
2. **Appwrite Console**: 
   - `live_visitors` collection
   - `session_tracking` collection
   - `events_log` collection

## Complete Example

Here's a full product page with all tracking:

```tsx
'use client'

import { useState } from 'react'
import { useAutoTrackProductView, useProductTracking } from '@/hooks/useProductTracking'

interface Product {
  $id: string
  name: string
  price: number
  category: string
  brand: string
}

export default function ProductDetailPage({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1)
  const { trackAddToCart, trackAddToWishlist } = useProductTracking()

  // ✅ Auto-track product view
  useAutoTrackProductView(product ? {
    product_id: product.$id,
    product_name: product.name,
    product_price: product.price,
    category: product.category,
    brand: product.brand,
  } : null)

  const handleAddToCart = () => {
    trackAddToCart({
      product_id: product.$id,
      product_name: product.name,
      product_price: product.price,
      category: product.category,
      brand: product.brand,
    }, quantity)
    
    // Your cart logic
  }

  const handleAddToWishlist = () => {
    trackAddToWishlist({
      product_id: product.$id,
      product_name: product.name,
      product_price: product.price,
      category: product.category,
    })
    
    // Your wishlist logic
  }

  return (
    <div className="product-page">
      <h1>{product.name}</h1>
      <p>${product.price}</p>
      
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(parseInt(e.target.value))}
      />
      
      <button onClick={handleAddToCart}>
        Add to Cart
      </button>
      
      <button onClick={handleAddToWishlist}>
        ♥ Wishlist
      </button>
    </div>
  )
}
```

## Testing

1. Navigate to your product page
2. Open browser console (F12)
3. You should see tracking requests
4. Go to `/admin/analytics`
5. You should see yourself in the Live Visitors widget
6. Check Appwrite Console → `events_log` collection for product view events

## Need Help?

- Full guide: `LIVE_TRACKING_GUIDE.md`
- Checklist: `LIVE_TRACKING_CHECKLIST.md`
- Example: `EXAMPLE_PRODUCT_PAGE.tsx`
