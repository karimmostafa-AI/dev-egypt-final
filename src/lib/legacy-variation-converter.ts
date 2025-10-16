/**
 * Legacy Variation Converter
 * Converts old variation format to new ColorOption/SizeOption format
 * Ensures backwards compatibility with existing Appwrite products
 */

import { ColorOption, SizeOption, ProductVariation } from '@/types/product-variations'

export interface LegacyVariation {
  id: string
  color?: string
  colorName?: string
  size?: string
  imageUrl: string
  imageSource: 'device' | 'url'
  type: 'color' | 'size' | 'both'
}

/**
 * Convert legacy variations array to ColorOption[] and SizeOption[]
 */
export function convertLegacyVariations(
  legacyVariations: LegacyVariation[],
  basePrice: number = 0
): {
  colors: ColorOption[]
  sizes: SizeOption[]
  hasColors: boolean
  hasSizes: boolean
} {
  const colors: ColorOption[] = []
  const sizes: SizeOption[] = []

  // Extract unique colors
  const colorVariations = legacyVariations.filter(v => v.type === 'color')
  colorVariations.forEach((variation, index) => {
    if (variation.color && variation.colorName) {
      colors.push({
        id: variation.id || `legacy_color_${index}`,
        name: variation.colorName,
        hexCode: variation.color,
        mainImageUrl: variation.imageUrl || '',
        backImageUrl: '', // Legacy format doesn't have back images
        isActive: true,
        order: index
      })
    }
  })

  // Extract unique sizes
  const sizeVariations = legacyVariations.filter(v => v.type === 'size')
  sizeVariations.forEach((variation, index) => {
    if (variation.size) {
      sizes.push({
        id: variation.id || `legacy_size_${index}`,
        name: variation.size,
        sku: `LEGACY-${variation.id || index}`, // Default SKU for legacy products
        stock: 100, // Default stock for legacy products
        priceModifier: 0, // No price modifier in legacy format
        isActive: true,
        order: index
      })
    }
  })

  return {
    colors,
    sizes,
    hasColors: colors.length > 0,
    hasSizes: sizes.length > 0
  }
}

/**
 * Parse Appwrite product variations field (handles string, array, or compact summary object)
 */
export function parseProductVariations(
  variationsField: string | any[] | any | undefined
): LegacyVariation[] | any {
  if (!variationsField) return []

  try {
    if (typeof variationsField === 'string') {
      const parsed = JSON.parse(variationsField)
      // Return as-is (could be array or object)
      return parsed
    }
    if (Array.isArray(variationsField)) {
      return variationsField
    }
    if (typeof variationsField === 'object') {
      // Could be compact summary object
      return variationsField
    }
  } catch (error) {
    console.warn('Failed to parse variations:', error)
  }

  return []
}

/**
 * Parse Appwrite colorOptions field (handles both compact and full format)
 */
export function parseColorOptions(
  colorOptionsField: string | any[] | undefined
): ColorOption[] {
  if (!colorOptionsField) return []

  try {
    if (typeof colorOptionsField === 'string') {
      const parsed = JSON.parse(colorOptionsField)
      if (!Array.isArray(parsed)) return []
      
      // Check if it's compact format (has 'i' instead of 'id')
      if (parsed.length > 0 && parsed[0].i) {
        // Expand compact format
        return parsed.map((c, index) => ({
          id: c.i,
          name: c.n,
          hexCode: c.h,
          mainImageUrl: c.f || '',
          backImageUrl: c.b || '',
          isActive: true,
          order: index
        }))
      }
      
      // Already full format
      return parsed
    }
    if (Array.isArray(colorOptionsField)) {
      return colorOptionsField
    }
  } catch (error) {
    console.warn('Failed to parse colorOptions:', error)
  }

  return []
}

/**
 * Parse Appwrite sizeOptions field (handles both compact and full format)
 */
export function parseSizeOptions(
  sizeOptionsField: string | any[] | undefined
): SizeOption[] {
  if (!sizeOptionsField) return []

  try {
    if (typeof sizeOptionsField === 'string') {
      const parsed = JSON.parse(sizeOptionsField)
      if (!Array.isArray(parsed)) return []
      
      // Check if it's compact format (has 'i' instead of 'id')
      if (parsed.length > 0 && parsed[0].i) {
        // Expand compact format
        return parsed.map((s, index) => ({
          id: s.i,
          name: s.n,
          sku: `COMPACT-${s.i}`,
          stock: s.s,
          priceModifier: s.p,
          isActive: true,
          order: index
        }))
      }
      
      // Already full format
      return parsed
    }
    if (Array.isArray(sizeOptionsField)) {
      return sizeOptionsField
    }
  } catch (error) {
    console.warn('Failed to parse sizeOptions:', error)
  }

  return []
}

/**
 * Main function to get normalized product variations from Appwrite product
 */
export function normalizeProductVariations(product: any): {
  colors: ColorOption[]
  sizes: SizeOption[]
  variations: ProductVariation[]
  hasVariations: boolean
  isLegacyFormat: boolean
} {
  // Try to get new format data first
  let colors = parseColorOptions(product.colorOptions)
  let sizes = parseSizeOptions(product.sizeOptions)
  
  // Parse variations (could be legacy, compact summary, or new format)
  let variationsData: any = parseProductVariations(product.variations)
  
  // Check if variationsData is an array (legacy/new format) or object (compact summary)
  const isArray = Array.isArray(variationsData)
  const isCompactSummary = !isArray && variationsData && typeof variationsData === 'object' && variationsData.count !== undefined
  
  // If compact summary, we already have colors and sizes, no need to process variations
  if (isCompactSummary) {
    // Colors and sizes are already parsed from colorOptions and sizeOptions
    return {
      colors,
      sizes,
      variations: [], // Variations will be generated on-demand
      hasVariations: colors.length > 0 || sizes.length > 0,
      isLegacyFormat: false
    }
  }
  
  // Convert to array if not already
  if (!isArray) {
    variationsData = []
  }
  
  // Check if this is legacy format (has color/size type variations)
  const isLegacyFormat = variationsData.length > 0 && variationsData.some((v: any) => 
    v.type === 'color' || v.type === 'size'
  )

  // If legacy format and no colors/sizes parsed, convert legacy variations
  if (isLegacyFormat && colors.length === 0 && sizes.length === 0) {
    const converted = convertLegacyVariations(
      variationsData as LegacyVariation[],
      product.price
    )
    colors = converted.colors
    sizes = converted.sizes
  }

  // Check for new format variations (with productId, colorId, sizeId, sku)
  const isNewFormat = variationsData.length > 0 && variationsData.some((v: any) => 
    v.productId && v.colorId && v.sizeId && v.sku
  )

  const hasVariations = 
    product.hasVariations === true ||
    colors.length > 0 ||
    sizes.length > 0 ||
    variationsData.length > 0

  return {
    colors,
    sizes,
    variations: isNewFormat ? variationsData : [],
    hasVariations,
    isLegacyFormat
  }
}

/**
 * Enhance Appwrite product with normalized variation data
 */
export function enhanceProductWithVariations(product: any): any {
  const normalized = normalizeProductVariations(product)

  return {
    ...product,
    colorOptions: normalized.colors,
    sizeOptions: normalized.sizes,
    variations: normalized.variations,
    hasVariations: normalized.hasVariations,
    _isLegacyFormat: normalized.isLegacyFormat
  }
}

/**
 * Get display-ready color swatches for product card
 */
export function getProductColorSwatches(product: any): Array<{
  id: string
  name: string
  hexCode: string
  imageUrl?: string
}> {
  const normalized = normalizeProductVariations(product)
  
  return normalized.colors.map(color => ({
    id: color.id,
    name: color.name,
    hexCode: color.hexCode,
    imageUrl: color.mainImageUrl
  }))
}

/**
 * Get available sizes for product
 */
export function getProductSizes(product: any): SizeOption[] {
  const normalized = normalizeProductVariations(product)
  return normalized.sizes
}

/**
 * Check if product has variations in any format
 */
export function productHasVariations(product: any): boolean {
  const normalized = normalizeProductVariations(product)
  return normalized.hasVariations
}
