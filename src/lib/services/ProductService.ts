import { Storage, Databases } from 'appwrite';
import {
  ProductData,
  ProductVariation,
  ProductImage,
  IProductRepository,
  createProductRepository
} from '@/lib/repositories/ProductRepository';

// Business logic models for the service layer
export interface ProductDetailsResult {
  product: ProductData | null;
  loading: boolean;
  error: string | null;
}

export interface ProductVariationSelection {
  color?: string;
  size?: string;
  style?: string;
  material?: string;
}

export interface ProductPricingInfo {
  basePrice: number;
  discountPrice: number;
  compareAtPrice: number;
  savings: number;
  savingsPercent: number;
  variationPriceModifier: number;
  finalPrice: number;
}

export interface ProductAvailabilityInfo {
  isAvailable: boolean;
  stockQuantity: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  availableVariations: ProductVariation[];
}

// Service interface for dependency injection and testing
export interface IProductService {
  getProductDetails(slug: string): Promise<ProductDetailsResult>;
  calculatePricing(
    product: ProductData,
    selectedVariations: ProductVariationSelection,
    quantity: number
  ): ProductPricingInfo;
  getAvailabilityInfo(product: ProductData, selectedVariations: ProductVariationSelection): ProductAvailabilityInfo;
  getProductImages(product: ProductData, selectedVariations: ProductVariationSelection): ProductImage[];
  validateVariationSelection(
    product: ProductData,
    variations: ProductVariationSelection
  ): { isValid: boolean; errors: string[] };
}

// Implementation of the product service
export class ProductService implements IProductService {
  private repository: IProductRepository;

  constructor(databases: Databases, storage: Storage) {
    this.repository = createProductRepository(databases, storage);
  }

  async getProductDetails(slug: string): Promise<ProductDetailsResult> {
    try {
      const product = await this.repository.findBySlug(slug);

      return {
        product,
        loading: false,
        error: null
      };
    } catch (error) {
      console.error('Error in ProductService.getProductDetails:', error);

      return {
        product: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load product details'
      };
    }
  }

  calculatePricing(
    product: ProductData,
    selectedVariations: ProductVariationSelection,
    quantity: number
  ): ProductPricingInfo {
    const basePrice = product.discount_price > 0 ? product.discount_price : product.price;
    const compareAtPrice = product.compareAtPrice || product.price;

    // Calculate variation price modifier
    let variationPriceModifier = 0;
    if (selectedVariations && product.variations) {
      Object.values(selectedVariations).forEach(variationValue => {
        const variation = product.variations.find(v => v.variation_value === variationValue);
        if (variation) {
          variationPriceModifier += variation.price_modifier;
        }
      });
    }

    const finalPrice = (basePrice + variationPriceModifier) * quantity;
    const savings = (compareAtPrice - basePrice) * quantity;
    const savingsPercent = compareAtPrice > 0 ? Math.round((savings / (compareAtPrice * quantity)) * 100) : 0;

    return {
      basePrice,
      discountPrice: product.discount_price,
      compareAtPrice,
      savings,
      savingsPercent,
      variationPriceModifier,
      finalPrice
    };
  }

  getAvailabilityInfo(
    product: ProductData,
    selectedVariations: ProductVariationSelection
  ): ProductAvailabilityInfo {
    const availableVariations = product.variations.filter(v => v.is_active);

    // Filter variations based on selection
    if (selectedVariations) {
      Object.entries(selectedVariations).forEach(([type, value]) => {
        if (value) {
          // This would filter available variations based on current selection
          // For example, if a color is selected, only show sizes available for that color
        }
      });
    }

    const stockQuantity = selectedVariations
      ? this.getVariationStock(product, selectedVariations)
      : product.stockQuantity;

    return {
      isAvailable: stockQuantity > 0,
      stockQuantity,
      minOrderQuantity: product.min_order_quantity,
      maxOrderQuantity: stockQuantity,
      availableVariations
    };
  }

  getProductImages(
    product: ProductData,
    selectedVariations: ProductVariationSelection
  ): ProductImage[] {
    if (!product.images || product.images.length === 0) {
      return [];
    }

    // If no variations selected, return main and gallery images
    if (!selectedVariations || Object.keys(selectedVariations).length === 0) {
      return product.images
        .filter(img => img.image_type === 'main' || img.image_type === 'gallery')
        .sort((a, b) => a.sort_order - b.sort_order);
    }

    // Return images for selected variations using variation_id relationship
    const variationImages = product.images.filter(img => {
      if (img.image_type !== 'variation') return false;

      // Check if this image matches the selected variations
      return Object.entries(selectedVariations).every(([type, value]) => {
        // Find the variation to get its ID
        const variation = product.variations.find(v =>
          v.variation_type === type && v.variation_value === value
        );
        return variation && img.variation_id === variation.id;
      });
    });

    // If no specific variation images found, return main images
    if (variationImages.length === 0) {
      return product.images
        .filter(img => img.image_type === 'main' || img.image_type === 'gallery')
        .sort((a, b) => a.sort_order - b.sort_order);
    }

    return variationImages.sort((a, b) => a.sort_order - b.sort_order);
  }

  validateVariationSelection(
    product: ProductData,
    variations: ProductVariationSelection
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!product.hasVariations || !product.variations || product.variations.length === 0) {
      return { isValid: true, errors: [] };
    }

    // Check if selected variations exist and are available
    Object.entries(variations).forEach(([type, value]) => {
      if (value) {
        const availableOptions = product.variations.filter(v =>
          v.variation_type === type &&
          v.is_active &&
          v.stock_quantity > 0
        );

        const optionExists = availableOptions.some(v => v.variation_value === value);

        if (!optionExists) {
          errors.push(`Selected ${type} "${value}" is not available`);
        }
      }
    });

    // Check stock availability for selected combination
    if (Object.keys(variations).length > 0) {
      const stockQuantity = this.getVariationStock(product, variations);
      if (stockQuantity <= 0) {
        errors.push('Selected variation combination is out of stock');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private getVariationStock(
    product: ProductData,
    selectedVariations: ProductVariationSelection
  ): number {
    if (!selectedVariations || Object.keys(selectedVariations).length === 0) {
      // Calculate total stock from all variations
      return product.variations.reduce((total, variation) => total + variation.stock_quantity, 0);
    }

    // Find the specific variation combination
    const variation = product.variations.find(v => {
      return Object.entries(selectedVariations).every(([type, value]) => {
        return v.variation_type === type && v.variation_value === value;
      });
    });

    return variation ? variation.stock_quantity : 0;
  }
}

// Factory function for creating service instances
export const createProductService = (
  databases: Databases,
  storage: Storage
): IProductService => {
  return new ProductService(databases, storage);
};