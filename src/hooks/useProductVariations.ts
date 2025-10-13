'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export interface VariationOption {
  id: string
  variation_value: string
  label: string
  available: boolean
  stockCount?: number
  priceModifier?: number
  image?: string
  sku?: string
  stock_quantity?: number
  price_modifier?: number
  sku_suffix?: string
}

export interface VariationGroup {
  id: string
  name: string
  variation_type: 'color' | 'size' | 'style' | 'material'
  required: boolean
  options: VariationOption[]
}

interface UseProductVariationsProps {
  productId: string
  initialVariations?: VariationGroup[]
  onVariationChange?: (groupId: string, optionId: string) => void
  onStockChange?: (stockInfo: StockInfo) => void
}

export interface StockInfo {
  isAvailable: boolean
  stockCount: number
  sku?: string
  reason?: string
}

export interface VariationSelection {
  [groupId: string]: string
}

export function useProductVariations({
  productId,
  initialVariations = [],
  onVariationChange,
  onStockChange
}: UseProductVariationsProps) {
  const [selectedVariations, setSelectedVariations] = useState<VariationSelection>({})
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  // Transform API variations to component format
  const variationGroups: VariationGroup[] = useMemo(() => {
    if (!initialVariations || initialVariations.length === 0) return []

    return initialVariations.map(group => ({
      id: group.id || `${group.variation_type}-${productId}`,
      name: group.name || group.variation_type.charAt(0).toUpperCase() + group.variation_type.slice(1),
      variation_type: group.variation_type,
      required: true, // Assume all variations are required for now
      options: group.options.map(option => ({
        id: option.id || `${group.variation_type}-${option.variation_value}`,
        variation_value: option.variation_value,
        label: option.variation_value,
        available: (option.stock_quantity || 0) > 0,
        stockCount: option.stock_quantity,
        priceModifier: option.price_modifier,
        sku: `${productId}-${option.sku_suffix || option.variation_value}`
      }))
    }))
  }, [initialVariations, productId])

  // Calculate current stock status
  const stockInfo: StockInfo = useMemo(() => {
    const selectedOptions = variationGroups
      .map(group => {
        const selectedOptionId = selectedVariations[group.id]
        return group.options.find(opt => opt.id === selectedOptionId)
      })
      .filter(Boolean) as VariationOption[]

    // Check if all required variations are selected
    const requiredGroups = variationGroups.filter(group => group.required)
    const hasAllRequired = requiredGroups.every(group =>
      selectedVariations[group.id] && selectedVariations[group.id] !== ''
    )

    if (!hasAllRequired) {
      return {
        isAvailable: false,
        stockCount: 0,
        reason: 'Please select all required options'
      }
    }

    // Check availability of selected options
    const unavailableOptions = selectedOptions.filter(option => !option.available)

    if (unavailableOptions.length > 0) {
      return {
        isAvailable: false,
        stockCount: 0,
        reason: `${unavailableOptions.map(opt => opt.label).join(', ')} unavailable`
      }
    }

    // Calculate total available stock and generate SKU
    const availableOptions = selectedOptions.filter(option => option.available)
    const minStock = Math.min(...availableOptions.map(opt => opt.stockCount || 999))

    // Generate SKU from selected variations
    const skuParts = availableOptions.map(opt => opt.sku?.split('-').pop()).filter(Boolean)
    const sku = skuParts.length > 0 ? `${productId}-${skuParts.join('-')}` : undefined

    return {
      isAvailable: minStock > 0,
      stockCount: minStock,
      sku
    }
  }, [variationGroups, selectedVariations, productId])

  // Notify parent of stock changes
  useEffect(() => {
    onStockChange?.(stockInfo)
  }, [stockInfo, onStockChange])

  // Handle variation selection with loading state
  const handleVariationChange = useCallback(async (groupId: string, optionId: string) => {
    setIsLoading(true)

    try {
      // Update local state
      setSelectedVariations(prev => ({
        ...prev,
        [groupId]: optionId
      }))

      // Notify parent component
      onVariationChange?.(groupId, optionId)

      // Invalidate related queries to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: ['product', productId]
      })

      // Simulate network delay for better UX feedback
      await new Promise(resolve => setTimeout(resolve, 150))

    } catch (error) {
      console.error('Error updating variation:', error)
    } finally {
      setIsLoading(false)
    }
  }, [onVariationChange, queryClient, productId])

  // Reset all variations
  const resetVariations = useCallback(() => {
    setSelectedVariations({})
  }, [])

  // Check if a specific variation option is selected
  const isVariationSelected = useCallback((groupId: string, optionId: string) => {
    return selectedVariations[groupId] === optionId
  }, [selectedVariations])

  // Get selected option for a group
  const getSelectedOption = useCallback((groupId: string) => {
    const group = variationGroups.find(g => g.id === groupId)
    if (!group) return null

    const selectedOptionId = selectedVariations[groupId]
    return group.options.find(opt => opt.id === selectedOptionId) || null
  }, [variationGroups, selectedVariations])

  // Calculate total price modifier from selected variations
  const totalPriceModifier = useMemo(() => {
    const selectedOptions = variationGroups
      .map(group => {
        const selectedOptionId = selectedVariations[group.id]
        return group.options.find(opt => opt.id === selectedOptionId)
      })
      .filter(Boolean) as VariationOption[]

    return selectedOptions.reduce((total, option) => total + (option.priceModifier || 0), 0)
  }, [variationGroups, selectedVariations])

  return {
    variationGroups,
    selectedVariations,
    stockInfo,
    isLoading,
    totalPriceModifier,
    handleVariationChange,
    resetVariations,
    isVariationSelected,
    getSelectedOption,
    hasAllVariationsSelected: variationGroups.every(group => selectedVariations[group.id])
  }
}