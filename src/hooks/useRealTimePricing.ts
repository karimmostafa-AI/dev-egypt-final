'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

export interface PricingRule {
  id: string
  name: string
  type: 'discount' | 'markup' | 'shipping' | 'tax'
  conditions: {
    variation_type?: string
    variation_value?: string
    quantity_min?: number
    quantity_max?: number
    user_type?: string
    time_range?: {
      start: string
      end: string
    }
  }
  calculation: {
    type: 'percentage' | 'fixed_amount' | 'formula'
    value: number
    formula?: string
  }
  priority: number
  is_active: boolean
}

export interface ShippingEstimate {
  method: string
  cost: number
  estimated_days: number
  carrier: string
  is_free: boolean
}

export interface PriceBreakdown {
  basePrice: number
  variationModifiers: Array<{
    variation_type: string
    variation_value: string
    modifier: number
    reason: string
  }>
  quantityDiscounts: Array<{
    quantity: number
    discount: number
    reason: string
  }>
  promotionalDiscounts: Array<{
    promotion_id: string
    name: string
    discount: number
    reason: string
  }>
  shipping: ShippingEstimate[]
  taxes: Array<{
    name: string
    rate: number
    amount: number
  }>
  subtotal: number
  totalDiscount: number
  totalTax: number
  totalShipping: number
  finalPrice: number
  currency: string
}

export interface AvailabilityInfo {
  isAvailable: boolean
  stockCount: number
  reservedCount: number
  availableCount: number
  nextRestockDate?: string
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder' | 'backorder'
  location?: string
  variations?: Array<{
    variation_type: string
    variation_value: string
    stock_count: number
    is_available: boolean
  }>
}

interface UseRealTimePricingProps {
  productId: string
  selectedVariations: Record<string, string>
  quantity: number
  zipCode?: string
  userLocation?: {
    country: string
    state: string
    city: string
  }
}

export function useRealTimePricing({
  productId,
  selectedVariations,
  quantity,
  zipCode,
  userLocation
}: UseRealTimePricingProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Fetch pricing rules
  const { data: pricingRules = [] } = useQuery({
    queryKey: ['pricing-rules', productId],
    queryFn: async () => {
      // In a real app, this would fetch from your pricing API
      const response = await fetch(`/api/products/${productId}/pricing-rules`)
      if (!response.ok) return []
      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Fetch current availability
  const { data: availability, refetch: refetchAvailability } = useQuery({
    queryKey: ['product-availability', productId, selectedVariations],
    queryFn: async (): Promise<AvailabilityInfo> => {
      const params = new URLSearchParams()
      Object.entries(selectedVariations).forEach(([type, value]) => {
        params.append(`variation_${type}`, value)
      })

      const response = await fetch(`/api/products/${productId}/availability?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch availability')
      }
      return response.json()
    },
    enabled: Object.keys(selectedVariations).length > 0,
    staleTime: 30 * 1000, // 30 seconds for availability
    refetchInterval: 60 * 1000, // Refetch every minute
  })

  // Calculate price breakdown
  const priceBreakdown: PriceBreakdown = useMemo(() => {
    const basePrice = 45.99 // This would come from product data
    const variationModifiers: PriceBreakdown['variationModifiers'] = []
    const quantityDiscounts: PriceBreakdown['quantityDiscounts'] = []
    const promotionalDiscounts: PriceBreakdown['promotionalDiscounts'] = []
    const taxes = []
    const shipping: ShippingEstimate[] = []

    // Calculate variation modifiers
    Object.entries(selectedVariations).forEach(([type, value]) => {
      // Apply variation-specific pricing
      if (type === 'size' && ['2X', '3X', '4X', '5X'].includes(value)) {
        variationModifiers.push({
          variation_type: type,
          variation_value: value,
          modifier: 3.00,
          reason: 'Plus size upcharge'
        })
      }
    })

    // Calculate quantity discounts
    if (quantity >= 5) {
      const discount = Math.floor(quantity / 5) * 2 // $2 off per 5 items
      quantityDiscounts.push({
        quantity: Math.floor(quantity / 5) * 5,
        discount,
        reason: 'Bulk discount'
      })
    }

    // Calculate taxes (example: 8.5% sales tax)
    const subtotal = basePrice + variationModifiers.reduce((sum, mod) => sum + mod.modifier, 0)
    const totalDiscount = quantityDiscounts.reduce((sum, disc) => sum + disc.discount, 0)
    const discountedSubtotal = subtotal - totalDiscount
    const taxAmount = discountedSubtotal * 0.085

    taxes.push({
      name: 'Sales Tax',
      rate: 0.085,
      amount: taxAmount
    })

    // Calculate shipping
    let shippingCost = 0
    if (discountedSubtotal < 50) {
      shippingCost = 7.99
    }

    shipping.push({
      method: 'Standard Shipping',
      cost: shippingCost,
      estimated_days: 3,
      carrier: 'UPS',
      is_free: shippingCost === 0
    })

    const totalShipping = shipping.reduce((sum, ship) => sum + ship.cost, 0)
    const totalTax = taxes.reduce((sum, tax) => sum + tax.amount, 0)
    const finalPrice = discountedSubtotal + totalTax + totalShipping

    return {
      basePrice,
      variationModifiers,
      quantityDiscounts,
      promotionalDiscounts,
      shipping,
      taxes,
      subtotal,
      totalDiscount,
      totalTax,
      totalShipping,
      finalPrice,
      currency: 'USD'
    }
  }, [selectedVariations, quantity])

  // Auto-refresh availability when variations change
  useEffect(() => {
    if (Object.keys(selectedVariations).length > 0) {
      refetchAvailability()
      setLastUpdate(new Date())
    }
  }, [selectedVariations, refetchAvailability])

  // Simulate real-time updates (in production, this would use WebSocket or Server-Sent Events)
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance of update every interval
        refetchAvailability()
        setLastUpdate(new Date())
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [refetchAvailability])

  return {
    priceBreakdown,
    availability,
    pricingRules,
    lastUpdate,
    isLoading: !availability,
    refetchAvailability
  }
}