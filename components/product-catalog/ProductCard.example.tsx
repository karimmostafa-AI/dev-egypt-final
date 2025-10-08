// Example usage of ProductCard component
import ProductCard from './ProductCard'
import type { Product } from '@/types/product-catalog'

// Example product data
const exampleProduct: Product = {
  id: 'example-product-1',
  name: 'Classic Scrub Top - Comfortable Fit',
  price: 29.99,
  salePrice: 24.99,
  images: [
    { url: '/images/scrub-navy.jpg', alt: 'Navy scrub top', colorName: 'Navy' },
    { url: '/images/scrub-white.jpg', alt: 'White scrub top', colorName: 'White' },
    { url: '/images/scrub-royal.jpg', alt: 'Royal blue scrub top', colorName: 'Royal Blue' }
  ],
  colors: [
    { name: 'Navy', hex: '#1e3a8a', imageUrl: '/images/scrub-navy.jpg' },
    { name: 'White', hex: '#ffffff', imageUrl: '/images/scrub-white.jpg' },
    { name: 'Royal Blue', hex: '#2563eb', imageUrl: '/images/scrub-royal.jpg' }
  ],
  sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  brand: 'Dev Egypt',
  rating: 4.5,
  reviewCount: 128,
  isOnSale: true,
  category: 'scrub-tops'
}

// Example handlers
const handleAddToCart = (productId: string) => {
  console.log('Adding product to cart:', productId)
  // Implement cart logic here
}

const handleAddToWishlist = (productId: string) => {
  console.log('Adding product to wishlist:', productId)
  // Implement wishlist logic here
}

const handleColorChange = (productId: string, colorName: string) => {
  console.log('Color changed for product:', productId, 'to:', colorName)
  // Implement color change logic here
}

// Example component usage
export default function ProductCardExample() {
  return (
    <div className="p-8 bg-gray-50">
      <h2 className="text-2xl font-bold mb-6">ProductCard Component Example</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic usage */}
        <ProductCard
          product={exampleProduct}
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
          onColorChange={handleColorChange}
        />
        
        {/* With custom className */}
        <ProductCard
          product={exampleProduct}
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
          onColorChange={handleColorChange}
          className="shadow-xl border-2 border-blue-200"
        />
        
        {/* Product not on sale */}
        <ProductCard
          product={{
            ...exampleProduct,
            id: 'example-product-2',
            isOnSale: false,
            salePrice: undefined
          }}
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
          onColorChange={handleColorChange}
        />
      </div>
    </div>
  )
}