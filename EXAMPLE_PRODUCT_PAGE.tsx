/**
 * Example Product Page with Live Tracking Integration
 * 
 * This shows how to integrate live visitor tracking and product view tracking
 * into your product pages.
 */

'use client'

import { useState } from 'react'
import { useAutoTrackProductView, useProductTracking } from '@/hooks/useProductTracking'

interface Product {
  $id: string
  name: string
  price: number
  category: string
  brand: string
  description: string
  images: string[]
  stock: number
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const { trackAddToCart, trackAddToWishlist } = useProductTracking()

  // Auto-track product view when page loads
  useAutoTrackProductView(product ? {
    product_id: product.$id,
    product_name: product.name,
    product_price: product.price,
    category: product.category,
    brand: product.brand,
  } : null)

  // Fetch product data
  // useEffect(() => {
  //   fetchProduct(params.id).then(setProduct)
  // }, [params.id])

  const handleAddToCart = async () => {
    if (!product) return

    // Track the add to cart event
    await trackAddToCart({
      product_id: product.$id,
      product_name: product.name,
      product_price: product.price,
      category: product.category,
      brand: product.brand,
    }, quantity)

    // Your actual cart logic here
    console.log('Added to cart:', product.name, 'x', quantity)
  }

  const handleAddToWishlist = async () => {
    if (!product) return

    // Track the wishlist addition
    await trackAddToWishlist({
      product_id: product.$id,
      product_name: product.name,
      product_price: product.price,
      category: product.category,
      brand: product.brand,
    })

    // Your actual wishlist logic here
    console.log('Added to wishlist:', product.name)
  }

  if (!product) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full rounded-lg"
          />
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-4">{product.brand}</p>
          <p className="text-2xl font-bold text-blue-600 mb-4">
            ${product.price.toFixed(2)}
          </p>

          <p className="text-gray-700 mb-6">{product.description}</p>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 mb-6">
            <label className="font-medium">Quantity:</label>
            <input
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="border rounded px-3 py-2 w-20"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Add to Cart
            </button>
            <button
              onClick={handleAddToWishlist}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              ♥ Wishlist
            </button>
          </div>

          {/* Product Info */}
          <div className="mt-8 pt-8 border-t">
            <p className="text-sm text-gray-600">
              <strong>Category:</strong> {product.category}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Brand:</strong> {product.brand}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Stock:</strong> {product.stock} available
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * WHAT GETS TRACKED AUTOMATICALLY:
 * 
 * 1. Page View - Tracked immediately when LiveVisitorTracker is active
 * 2. Product View - Tracked when useAutoTrackProductView hook runs
 * 3. Visitor Info - Updated every 10 seconds with:
 *    - Current page URL
 *    - Time on site
 *    - Location (country, city)
 *    - Device info (browser, OS, device type)
 * 4. Add to Cart - Tracked when user clicks "Add to Cart"
 * 5. Add to Wishlist - Tracked when user clicks "Wishlist"
 * 
 * ALL DATA IS VISIBLE IN:
 * - /admin/analytics - Main analytics dashboard
 * - Live Visitors Widget - Real-time visitor feed
 * - Appwrite Console - Raw data in collections
 */
