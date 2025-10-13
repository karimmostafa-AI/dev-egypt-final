'use client'

import React from 'react'
import { useRealTimePricing, PriceBreakdown, AvailabilityInfo } from '../../hooks/useRealTimePricing'
import { Badge } from './badge'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Truck, Clock, Package, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react'

interface RealTimePriceDisplayProps {
  productId: string
  selectedVariations: Record<string, string>
  quantity: number
  zipCode?: string
  className?: string
}

export const RealTimePriceDisplay: React.FC<RealTimePriceDisplayProps> = ({
  productId,
  selectedVariations,
  quantity,
  zipCode,
  className = ''
}) => {
  const { priceBreakdown, availability, lastUpdate, isLoading } = useRealTimePricing({
    productId,
    selectedVariations,
    quantity,
    zipCode
  })

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: priceBreakdown.currency
    }).format(amount)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800'
      case 'low_stock': return 'bg-yellow-100 text-yellow-800'
      case 'out_of_stock': return 'bg-red-100 text-red-800'
      case 'preorder': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStockStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock': return <CheckCircle className="w-4 h-4" />
      case 'low_stock': return <AlertTriangle className="w-4 h-4" />
      case 'out_of_stock': return <AlertTriangle className="w-4 h-4" />
      case 'preorder': return <Clock className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Price Display */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Price Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Base Price */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Base Price:</span>
            <span className="font-medium">{formatCurrency(priceBreakdown.basePrice)}</span>
          </div>

          {/* Variation Modifiers */}
          {priceBreakdown.variationModifiers.length > 0 && (
            <div className="space-y-1">
              {priceBreakdown.variationModifiers.map((modifier, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{modifier.reason}:</span>
                  <span className="text-green-600">+{formatCurrency(modifier.modifier)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quantity Discounts */}
          {priceBreakdown.quantityDiscounts.length > 0 && (
            <div className="space-y-1">
              {priceBreakdown.quantityDiscounts.map((discount, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 flex items-center">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    {discount.reason}:
                  </span>
                  <span className="text-green-600">-{formatCurrency(discount.discount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Subtotal */}
          <div className="border-t pt-2">
            <div className="flex justify-between items-center font-medium">
              <span>Subtotal:</span>
              <span>{formatCurrency(priceBreakdown.subtotal)}</span>
            </div>
          </div>

          {/* Shipping */}
          {priceBreakdown.shipping.map((ship, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-gray-600 flex items-center">
                <Truck className="w-3 h-3 mr-1" />
                {ship.method} ({ship.estimated_days} days):
              </span>
              <span className={ship.is_free ? 'text-green-600' : ''}>
                {ship.is_free ? 'FREE' : formatCurrency(ship.cost)}
              </span>
            </div>
          ))}

          {/* Tax */}
          {priceBreakdown.taxes.map((tax, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{tax.name} ({(tax.rate * 100).toFixed(1)}%):</span>
              <span>{formatCurrency(tax.amount)}</span>
            </div>
          ))}

          {/* Final Price */}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span className="text-blue-600">{formatCurrency(priceBreakdown.finalPrice)}</span>
            </div>
            {priceBreakdown.totalDiscount > 0 && (
              <div className="text-sm text-green-600 mt-1">
                You save {formatCurrency(priceBreakdown.totalDiscount)}!
              </div>
            )}
          </div>

          {/* Last Updated */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Prices updated: {formatTime(lastUpdate)}
          </div>
        </CardContent>
      </Card>

      {/* Availability Information */}
      {availability && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Stock Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStockStatusIcon(availability.stockStatus)}
                <span className="font-medium capitalize">
                  {availability.stockStatus.replace('_', ' ')}
                </span>
              </div>
              <Badge className={getStockStatusColor(availability.stockStatus)}>
                {availability.stockCount} available
              </Badge>
            </div>

            {/* Stock Details */}
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>In Stock:</span>
                <span>{availability.availableCount}</span>
              </div>
              {availability.reservedCount > 0 && (
                <div className="flex justify-between">
                  <span>Reserved:</span>
                  <span>{availability.reservedCount}</span>
                </div>
              )}
              {availability.nextRestockDate && (
                <div className="flex justify-between">
                  <span>Next Restock:</span>
                  <span>{new Date(availability.nextRestockDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Location Info */}
            {availability.location && (
              <div className="text-xs text-gray-500">
                Available at: {availability.location}
              </div>
            )}

            {/* Variation Stock */}
            {availability.variations && availability.variations.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Stock by Variation:</p>
                <div className="grid grid-cols-2 gap-2">
                  {availability.variations.map((variation, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span className="capitalize">{variation.variation_type}:</span>
                      <div className="flex items-center space-x-1">
                        <span>{variation.variation_value}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            variation.is_available
                              ? 'border-green-300 text-green-700'
                              : 'border-red-300 text-red-700'
                          }`}
                        >
                          {variation.stock_count}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Real-time Indicator */}
      <div className="flex items-center justify-center text-xs text-gray-500">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
        Real-time updates active
      </div>
    </div>
  )
}

export default RealTimePriceDisplay