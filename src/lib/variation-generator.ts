// Variation Generator Utility
// Auto-generates product variations from color and size combinations

import { ColorOption, SizeOption, ProductVariation } from '@/types/product-variations'

export interface GenerateVariationsOptions {
  productId: string
  productName: string
  basePrice: number
  colors: ColorOption[]
  sizes: SizeOption[]
}

/**
 * Generates all possible product variations from colors and sizes
 * Creates a cartesian product (color × size matrix)
 */
export function generateProductVariations({
  productId,
  productName,
  basePrice,
  colors,
  sizes
}: GenerateVariationsOptions): ProductVariation[] {
  const variations: ProductVariation[] = []

  // Validate inputs
  if (!colors || colors.length === 0) {
    console.warn('No colors provided for variation generation')
    return variations
  }

  if (!sizes || sizes.length === 0) {
    console.warn('No sizes provided for variation generation')
    return variations
  }

  // Generate all combinations
  for (const color of colors.filter(c => c.isActive)) {
    for (const size of sizes.filter(s => s.isActive)) {
      const variation: ProductVariation = {
        id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        colorId: color.id,
        sizeId: size.id,
        sku: generateSKU(productId, color.name, size.name),
        stock: size.stock, // Initial stock from size
        price: basePrice + (size.priceModifier || 0),
        mainImageUrl: color.mainImageUrl,
        backImageUrl: color.backImageUrl,
        isActive: color.isActive && size.isActive
      }

      variations.push(variation)
    }
  }

  console.log(`✓ Generated ${variations.length} variations (${colors.length} colors × ${sizes.length} sizes)`)
  
  return variations
}

/**
 * Generates a unique SKU for a variation
 * Format: PRODUCT_ID-COLOR-SIZE
 */
export function generateSKU(productId: string, colorName: string, sizeName: string): string {
  const productCode = productId.substring(0, 8).toUpperCase()
  const colorCode = colorName.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  const sizeCode = sizeName.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  return `${productCode}-${colorCode}-${sizeCode}`
}

/**
 * Updates stock for a specific variation
 */
export function updateVariationStock(
  variations: ProductVariation[],
  variationId: string,
  newStock: number
): ProductVariation[] {
  return variations.map(v => 
    v.id === variationId ? { ...v, stock: newStock } : v
  )
}

/**
 * Gets total stock across all variations
 */
export function getTotalVariationStock(variations: ProductVariation[]): number {
  return variations
    .filter(v => v.isActive)
    .reduce((total, v) => total + v.stock, 0)
}

/**
 * Gets variations for a specific color
 */
export function getVariationsByColor(
  variations: ProductVariation[],
  colorId: string
): ProductVariation[] {
  return variations.filter(v => v.colorId === colorId && v.isActive)
}

/**
 * Gets variations for a specific size
 */
export function getVariationsBySize(
  variations: ProductVariation[],
  sizeId: string
): ProductVariation[] {
  return variations.filter(v => v.sizeId === sizeId && v.isActive)
}

/**
 * Gets a specific variation by color and size
 */
export function getVariationByColorAndSize(
  variations: ProductVariation[],
  colorId: string,
  sizeId: string
): ProductVariation | undefined {
  return variations.find(v => 
    v.colorId === colorId && v.sizeId === sizeId && v.isActive
  )
}

/**
 * Validates variations data
 */
export function validateVariations(
  variations: ProductVariation[],
  colors: ColorOption[],
  sizes: SizeOption[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check if we have the expected number of variations
  const activeColors = colors.filter(c => c.isActive).length
  const activeSizes = sizes.filter(s => s.isActive).length
  const expectedCount = activeColors * activeSizes
  const actualCount = variations.filter(v => v.isActive).length

  if (actualCount !== expectedCount) {
    errors.push(
      `Expected ${expectedCount} variations (${activeColors} colors × ${activeSizes} sizes), ` +
      `but got ${actualCount}`
    )
  }

  // Check if all variations have required fields
  variations.forEach((v, index) => {
    if (!v.mainImageUrl) {
      errors.push(`Variation ${index + 1} is missing mainImageUrl`)
    }
    if (!v.backImageUrl) {
      errors.push(`Variation ${index + 1} is missing backImageUrl`)
    }
    if (!v.sku) {
      errors.push(`Variation ${index + 1} is missing SKU`)
    }
    if (v.stock < 0) {
      errors.push(`Variation ${index + 1} has negative stock`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Formats variation display name
 */
export function getVariationDisplayName(
  variation: ProductVariation,
  colors: ColorOption[],
  sizes: SizeOption[]
): string {
  const color = colors.find(c => c.id === variation.colorId)
  const size = sizes.find(s => s.id === variation.sizeId)

  if (!color || !size) {
    return 'Unknown Variation'
  }

  return `${color.name} - ${size.name}`
}

/**
 * Checks if a variation is in stock
 */
export function isVariationInStock(variation: ProductVariation): boolean {
  return variation.isActive && variation.stock > 0
}

/**
 * Gets low stock variations (threshold: 5 or less)
 */
export function getLowStockVariations(
  variations: ProductVariation[],
  threshold: number = 5
): ProductVariation[] {
  return variations.filter(v => 
    v.isActive && v.stock > 0 && v.stock <= threshold
  )
}

/**
 * Gets out of stock variations
 */
export function getOutOfStockVariations(
  variations: ProductVariation[]
): ProductVariation[] {
  return variations.filter(v => v.isActive && v.stock === 0)
}
