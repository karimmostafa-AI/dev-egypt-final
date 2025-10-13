'use client'

import React from 'react'
import Image from 'next/image'
import { Button } from './button'
import { useProductVariations, VariationGroup, VariationOption } from '../../hooks/useProductVariations'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'

interface EnhancedProductVariationsProps {
  productId: string
  variations: VariationGroup[]
  onVariationChange?: (groupId: string, optionId: string) => void
  onStockChange?: (stockInfo: any) => void
  className?: string
}

export const EnhancedProductVariations: React.FC<EnhancedProductVariationsProps> = ({
  productId,
  variations,
  onVariationChange,
  onStockChange,
  className = ''
}) => {
  const {
    variationGroups,
    selectedVariations,
    stockInfo,
    isLoading,
    totalPriceModifier,
    handleVariationChange,
    isVariationSelected,
    getSelectedOption,
    hasAllVariationsSelected
  } = useProductVariations({
    productId,
    initialVariations: variations,
    onVariationChange,
    onStockChange
  })

  const getOptionButtonClass = (group: VariationGroup, option: VariationOption, isSelected: boolean) => {
    const baseClasses = "relative text-sm font-medium transition-all duration-200 border rounded-lg px-3 py-2"

    if (!option.available) {
      return `${baseClasses} border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50`
    }

    if (isSelected) {
      return `${baseClasses} bg-blue-600 text-white shadow-md border-blue-600`
    }

    return `${baseClasses} border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-400 text-gray-900`
  }

  const renderVariationGroup = (group: VariationGroup) => {
    const selectedOptionId = selectedVariations[group.id]
    const selectedOption = getSelectedOption(group.id)

    return (
      <div key={group.id} className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-900">
            {group.name} {group.required && <span className="text-red-500">*</span>}
          </label>
          {group.variation_type === 'size' && (
            <button className="text-xs text-blue-600 hover:text-blue-800 underline">
              Size Guide
            </button>
          )}
        </div>

        {/* Size Grid for Size Variations */}
        {group.variation_type === 'size' && (
          <div className="space-y-2">
            {/* Regular Sizes */}
            <div className="grid grid-cols-5 gap-2">
              {group.options
                .filter(option => !['2X', '3X', '4X', '5X'].includes(option.variation_value))
                .map(option => (
                  <Button
                    key={option.id}
                    variant="outline"
                    className={getOptionButtonClass(group, option, selectedOptionId === option.id)}
                    onClick={() => handleVariationChange(group.id, option.id)}
                    disabled={!option.available || isLoading}
                  >
                    {option.variation_value}
                  </Button>
                ))}
            </div>

            {/* Plus Sizes */}
            {group.options.some(option => ['2X', '3X', '4X', '5X'].includes(option.variation_value)) && (
              <div className="flex gap-2">
                {group.options
                  .filter(option => ['2X', '3X', '4X', '5X'].includes(option.variation_value))
                  .map(option => (
                    <Button
                      key={option.id}
                      variant="outline"
                      className={getOptionButtonClass(group, option, selectedOptionId === option.id)}
                      onClick={() => handleVariationChange(group.id, option.id)}
                      disabled={!option.available || isLoading}
                    >
                      {option.variation_value}
                    </Button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Color Swatches for Color Variations */}
        {group.variation_type === 'color' && (
          <div className="flex flex-wrap gap-2">
            {group.options.map(option => (
              <button
                key={option.id}
                onClick={() => handleVariationChange(group.id, option.id)}
                disabled={!option.available || isLoading}
                className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all duration-200 ${
                  selectedOptionId === option.id
                    ? 'border-blue-600 ring-2 ring-blue-600 ring-opacity-50'
                    : 'border-gray-300 hover:border-blue-400'
                } ${!option.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                aria-label={`Select ${option.label} color`}
                title={option.label}
              >
                {option.image ? (
                  <Image
                    src={option.image}
                    alt={option.label}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: option.variation_value.toLowerCase() }}
                  />
                )}

                {/* Stock indicator */}
                {!option.available && (
                  <div className="absolute inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Selected indicator */}
                {selectedOptionId === option.id && (
                  <div className="absolute inset-0 bg-blue-600 bg-opacity-20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Generic Options for Other Types (Material, Style) */}
        {group.variation_type !== 'size' && group.variation_type !== 'color' && (
          <div className="grid grid-cols-2 gap-2">
            {group.options.map(option => (
              <Button
                key={option.id}
                variant="outline"
                className={getOptionButtonClass(group, option, selectedOptionId === option.id)}
                onClick={() => handleVariationChange(group.id, option.id)}
                disabled={!option.available || isLoading}
              >
                {option.label}
                {option.priceModifier && option.priceModifier > 0 && (
                  <span className="ml-1 text-xs text-green-600">
                    +${option.priceModifier}
                  </span>
                )}
              </Button>
            ))}
          </div>
        )}

        {/* Selection Summary */}
        {selectedOption && (
          <div className={`p-3 rounded-lg border text-sm ${
            stockInfo.isAvailable
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <span>
                Selected: {selectedOption.label}
                {selectedOption.priceModifier && selectedOption.priceModifier > 0 && (
                  <span className="ml-1 font-medium">
                    (+${selectedOption.priceModifier})
                  </span>
                )}
              </span>
              {stockInfo.isAvailable ? (
                <span className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Available
                </span>
              ) : (
                <span className="flex items-center text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Unavailable
                </span>
              )}
            </div>
            {stockInfo.stockCount > 0 && stockInfo.stockCount < 10 && (
              <p className="mt-1 text-xs font-medium text-orange-600">
                Only {stockInfo.stockCount} left in stock!
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  if (variationGroups.length === 0) {
    return null
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm text-gray-600">Updating availability...</span>
        </div>
      )}

      {/* Variation Groups */}
      {variationGroups.map(renderVariationGroup)}

      {/* Overall Selection Summary */}
      {hasAllVariationsSelected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Complete Selection
              </p>
              <p className="text-xs text-blue-700">
                {stockInfo.isAvailable
                  ? `${stockInfo.stockCount} available`
                  : 'Currently unavailable'
                }
              </p>
            </div>
            {totalPriceModifier > 0 && (
              <p className="text-sm font-semibold text-blue-900">
                +${totalPriceModifier} total
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {!stockInfo.isAvailable && hasAllVariationsSelected && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-red-900">
                Selection Unavailable
              </p>
              <p className="text-xs text-red-700">
                {stockInfo.reason || 'This combination is currently out of stock'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedProductVariations