'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Button } from './button';
import { ImageSkeleton } from './LoadingStates';

export interface VariationOption {
  id: string;
  value: string;
  label: string;
  available: boolean;
  stockCount?: number;
  priceModifier?: number;
  image?: string;
  sku?: string;
}

export interface VariationGroup {
  id: string;
  name: string;
  type: 'color' | 'size' | 'style' | 'material';
  required: boolean;
  options: VariationOption[];
}

// Enhanced interfaces for better stock and price handling
export interface EnhancedVariationOption extends VariationOption {
  reservedCount?: number;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  leadTime?: number; // in days
  isPreorder?: boolean;
  preorderDate?: string;
}

export interface EnhancedVariationGroup extends VariationGroup {
  options: EnhancedVariationOption[];
  maxStock?: number;
  showStockCount?: boolean;
  enablePriceDisplay?: boolean;
  allowBackorder?: boolean;
}

export interface StockInfo {
  availableStock: number;
  reservedStock: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  isAvailable: boolean;
  isLowStock: boolean;
  isPreorder: boolean;
  preorderDate?: string;
}

export interface PriceInfo {
  basePrice: number;
  finalPrice: number;
  priceModifier: number;
  discountAmount: number;
  discountPercent: number;
  currency: string;
}

interface ProductVariationsProps {
  variations: VariationGroup[];
  selectedVariations: Record<string, string>;
  onVariationChange: (groupId: string, optionId: string) => void;
  maxStock?: number;
  className?: string;

  // Enhanced props for better stock and price handling
  stockInfo?: StockInfo;
  priceInfo?: PriceInfo;
  showStockCount?: boolean;
  showPriceModifiers?: boolean;
  enableBackorder?: boolean;
  onStockInfoChange?: (stockInfo: StockInfo) => void;
  onPriceInfoChange?: (priceInfo: PriceInfo) => void;
}

interface StockStatus {
  isAvailable: boolean;
  stockCount: number;
  reason?: string;
}

export const ProductVariations: React.FC<ProductVariationsProps> = ({
  variations,
  selectedVariations,
  onVariationChange,
  maxStock = 999,
  className = '',
  stockInfo,
  priceInfo,
  showStockCount = true,
  showPriceModifiers = true,
  enableBackorder = false,
  onStockInfoChange,
  onPriceInfoChange
}) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Enhanced stock status calculation
  const stockStatus: StockStatus = useMemo(() => {
    // Use provided stock info if available
    if (stockInfo) {
      return {
        isAvailable: stockInfo.isAvailable,
        stockCount: stockInfo.availableStock,
        reason: stockInfo.isAvailable ? undefined : 'Out of stock'
      };
    }

    // Fallback to legacy calculation
    const selectedOptions = variations
      .map(group => {
        const selectedOptionId = selectedVariations[group.id];
        return group.options.find(opt => opt.id === selectedOptionId);
      })
      .filter(Boolean) as VariationOption[];

    // Check if all required variations are selected
    const requiredGroups = variations.filter(group => group.required);
    const hasAllRequired = requiredGroups.every(group =>
      selectedVariations[group.id] && selectedVariations[group.id] !== ''
    );

    if (!hasAllRequired) {
      return {
        isAvailable: false,
        stockCount: 0,
        reason: 'Please select all required options'
      };
    }

    // Check availability of selected options
    const unavailableOptions = selectedOptions.filter(option => !option.available);

    if (unavailableOptions.length > 0) {
      return {
        isAvailable: false,
        stockCount: 0,
        reason: `${unavailableOptions.map(opt => opt.label).join(', ')} unavailable`
      };
    }

    // Calculate total available stock
    const availableOptions = selectedOptions.filter(option => option.available);
    const minStock = Math.min(...availableOptions.map(opt => opt.stockCount || maxStock));

    return {
      isAvailable: minStock > 0,
      stockCount: minStock
    };
  }, [variations, selectedVariations, maxStock, stockInfo]);

  const handleVariationSelect = useCallback(async (groupId: string, optionId: string) => {
    setLoadingStates(prev => ({ ...prev, [groupId]: true }));

    // Simulate API call delay for better UX
    await new Promise(resolve => setTimeout(resolve, 100));

    onVariationChange(groupId, optionId);
    setLoadingStates(prev => ({ ...prev, [groupId]: false }));
  }, [onVariationChange]);

  const getOptionButtonClass = (group: VariationGroup, option: VariationOption, isSelected: boolean) => {
    const baseClasses = "relative text-sm font-normal transition-all duration-200 border rounded-base px-4 py-3";

    if (!option.available) {
      return `${baseClasses} border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50`;
    }

    if (isSelected) {
      return `${baseClasses} bg-primary text-white shadow-lg transform scale-105 border-primary`;
    }

    return `${baseClasses} border-neutral-light bg-neutral-light hover:bg-neutral-background hover:border-primary text-black`;
  };

  const renderVariationGroup = (group: VariationGroup) => {
    const selectedOptionId = selectedVariations[group.id];
    const isLoading = loadingStates[group.id];

    return (
      <div key={group.id} className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-black uppercase tracking-wide">
            {group.name}: {group.required && <span className="text-red-500">*</span>}
          </label>
          {group.type === 'size' && (
            <button className="text-sm font-normal text-black underline hover:text-primary">
              Size Chart
            </button>
          )}
        </div>

        {/* Size Grid for Size Variations */}
        {group.type === 'size' && (
          <div className="space-y-2">
            {/* Regular Sizes */}
            <div className="grid grid-cols-5 gap-2">
              {group.options
                .filter(option => !['2X', '3X', '4X', '5X'].includes(option.value))
                .map(option => (
                  <Button
                    key={option.id}
                    variant="secondary"
                    className={getOptionButtonClass(group, option, selectedOptionId === option.id)}
                    onClick={() => handleVariationSelect(group.id, option.id)}
                    disabled={!option.available || isLoading}
                  >
                    {option.value}
                  </Button>
                ))}
            </div>

            {/* Plus Sizes */}
            <div className="flex gap-2">
              {group.options
                .filter(option => ['2X', '3X', '4X', '5X'].includes(option.value))
                .map(option => (
                  <Button
                    key={option.id}
                    variant="secondary"
                    className={getOptionButtonClass(group, option, selectedOptionId === option.id)}
                    onClick={() => handleVariationSelect(group.id, option.id)}
                    disabled={!option.available || isLoading}
                  >
                    {option.value}
                  </Button>
                ))}
            </div>
          </div>
        )}

        {/* Color Swatches for Color Variations */}
        {group.type === 'color' && (
          <div className="flex flex-wrap gap-2">
            {group.options.map(option => (
              <button
                key={option.id}
                onClick={() => handleVariationSelect(group.id, option.id)}
                disabled={!option.available || isLoading}
                className={`relative w-11 h-11 rounded-full overflow-hidden border-2 transition-all duration-200 ${
                  selectedOptionId === option.id
                    ? 'border-primary ring-2 ring-primary ring-opacity-50'
                    : 'border-transparent hover:border-primary'
                } ${!option.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                aria-label={`Select ${option.label} color`}
                title={option.label}
              >
                {option.image ? (
                  <Image
                    src={option.image}
                    alt={option.label}
                    width={44}
                    height={44}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: option.value.toLowerCase() }}
                  />
                )}

                {/* Stock indicator */}
                {!option.available && (
                  <div className="absolute inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Generic Options for Other Types */}
        {group.type !== 'size' && group.type !== 'color' && (
          <div className="grid grid-cols-2 gap-2">
            {group.options.map(option => (
              <Button
                key={option.id}
                variant="secondary"
                className={getOptionButtonClass(group, option, selectedOptionId === option.id)}
                onClick={() => handleVariationSelect(group.id, option.id)}
                disabled={!option.available || isLoading}
              >
                {option.label}
              </Button>
            ))}
          </div>
        )}

        {/* Low Stock Warning Only - No out of stock messages */}
        {selectedOptionId && stockStatus.isAvailable && stockStatus.stockCount <= 5 && stockStatus.stockCount > 0 && (
          <div className="mt-2 p-3 rounded-lg border bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm text-yellow-800 font-medium">
                Only {stockStatus.stockCount} left in stock - Order soon!
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {variations.map(renderVariationGroup)}

      {/* Enhanced Stock and Price Information */}
      <div className="space-y-3">
        {/* Overall Stock Status - Only show when available, remove stock count */}
        {stockStatus.isAvailable && stockStatus.stockCount > 5 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-green-800 font-medium">
                In Stock
              </p>
            </div>
          </div>
        )}

        {/* Price Information */}
        {priceInfo && showPriceModifiers && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Price:</span>
              <div className="text-right">
                {priceInfo.discountAmount > 0 ? (
                  <div>
                    <span className="font-semibold text-green-600">
                      {priceInfo.currency} {priceInfo.finalPrice.toFixed(2)}
                    </span>
                    <div className="text-xs text-gray-500">
                      Was {priceInfo.currency} {priceInfo.basePrice.toFixed(2)}
                      <span className="text-green-600 ml-1">
                        ({priceInfo.discountPercent}% off)
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="font-semibold">
                    {priceInfo.currency} {priceInfo.finalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            {priceInfo.priceModifier !== 0 && (
              <div className="mt-2 text-xs text-gray-500">
                {priceInfo.priceModifier > 0 ? '+' : ''}
                {priceInfo.currency} {priceInfo.priceModifier.toFixed(2)} from variations
              </div>
            )}
          </div>
        )}

        {/* Low Stock Warning */}
        {stockStatus.isAvailable && stockStatus.stockCount <= 5 && stockStatus.stockCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm text-yellow-800">
                Only {stockStatus.stockCount} left in stock - order soon!
              </p>
            </div>
          </div>
        )}

        {/* Backorder Option */}
        {!stockStatus.isAvailable && enableBackorder && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-purple-800">
                Available for backorder - ships in 2-3 weeks
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductVariations;