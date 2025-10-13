'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRelatedProducts } from '../../hooks/useProductQuery'
import { ProductCardSkeleton } from './LoadingStates'
import { Card, CardContent } from './card'
import { Badge } from './badge'
import { Button } from './button'
import { ShoppingCart, Heart, Star, ArrowRight } from 'lucide-react'
import { useCart } from '../../context/CartContext'

interface RelatedProductsProps {
  currentProductId: string
  categoryId?: string
  limit?: number
  className?: string
  showViewAll?: boolean
  viewAllHref?: string
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({
  currentProductId,
  categoryId,
  limit = 4,
  className = '',
  showViewAll = true,
  viewAllHref = '/catalog'
}) => {
  const { data: relatedProductsData, isLoading, error } = useRelatedProducts(
    currentProductId,
    categoryId,
    limit
  )

  const { addToCart } = useCart()

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">You May Also Like</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: limit }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !relatedProductsData?.products) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500 mb-4">Unable to load related products</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  const products = relatedProductsData.products.filter(
    (product: any) => product.$id !== currentProductId && product.is_active
  )

  if (products.length === 0) {
    return null
  }

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const cartProduct = {
      $id: product.$id,
      name: product.name,
      slug: product.slug,
      brand_id: product.brand_id,
      category_id: product.category_id,
      units: product.units || 1,
      price: product.discount_price > 0 ? product.discount_price : product.price,
      discount_price: 0,
      min_order_quantity: 1,
      description: product.description || '',
      is_active: true,
      is_new: false,
      is_featured: false,
      hasVariations: false,
      variations: '',
      colorOptions: '',
      sizeOptions: '',
      mainImageUrl: product.mainImageUrl || '/placeholder-product.png',
      media_id: product.mainImageId || '',
      $createdAt: product.$createdAt,
      $updatedAt: product.$updatedAt
    }

    addToCart(cartProduct, 1)
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">You May Also Like</h2>
        {showViewAll && (
          <Link href={viewAllHref}>
            <Button variant="outline" className="flex items-center">
              View All Products
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product: any) => (
          <Card key={product.$id} className="group hover:shadow-lg transition-shadow duration-200">
            <Link href={`/product/${product.slug}`}>
              <CardContent className="p-0">
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                  {product.mainImageUrl ? (
                    <Image
                      src={product.mainImageUrl}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.is_new && (
                      <Badge className="bg-green-100 text-green-800 text-xs">New</Badge>
                    )}
                    {product.is_featured && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">Featured</Badge>
                    )}
                    {product.discount_price > 0 && product.discount_price < product.price && (
                      <Badge className="bg-red-100 text-red-800 text-xs">
                        {Math.round(((product.price - product.discount_price) / product.price) * 100)}% Off
                      </Badge>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex flex-col gap-1">
                      <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50">
                        <Heart className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  {/* Brand */}
                  {product.brand_id && (
                    <p className="text-xs text-gray-500 mb-1">Brand Placeholder</p>
                  )}

                  {/* Name */}
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 ml-1">(24 reviews)</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-lg text-gray-900">
                        ${product.discount_price > 0 ? product.discount_price : product.price}
                      </span>
                      {product.discount_price > 0 && product.discount_price < product.price && (
                        <span className="text-sm text-gray-500 line-through">
                          ${product.price}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock Status */}
                  <div className="mb-3">
                    {product.units > 0 ? (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        In Stock ({product.units})
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 text-xs">
                        Out of Stock
                      </Badge>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={product.units === 0}
                    onClick={(e) => handleAddToCart(product, e)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {product.units > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* View All Link */}
      {showViewAll && products.length >= limit && (
        <div className="text-center mt-8">
          <Link href={viewAllHref}>
            <Button variant="outline" size="lg">
              View All Products
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default RelatedProducts