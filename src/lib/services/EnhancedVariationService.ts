import { Databases, Storage, Query } from 'appwrite';

// Enhanced variation interfaces
export interface VariationOption {
  id: string;
  value: string;
  label: string;
  available: boolean;
  stockCount: number;
  priceModifier: number;
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

export interface OrganizedVariations {
  colors: VariationGroup;
  sizes: VariationGroup;
  styles?: VariationGroup;
  materials?: VariationGroup;
}

export interface VariationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StockCalculationResult {
  availableStock: number;
  reservedStock: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  isAvailable: boolean;
}

export interface VariationServiceConfig {
  databases: Databases;
  storage: Storage;
  enableStockTracking?: boolean;
  enablePriceCalculation?: boolean;
  fallbackToLegacyFormat?: boolean;
}

export class EnhancedVariationService {
  private config: VariationServiceConfig;

  constructor(config: VariationServiceConfig) {
    this.config = config;
  }

  /**
   * Get all variations for a product organized by type
   */
  async getProductVariations(productId: string): Promise<OrganizedVariations> {
    try {
      // Try to fetch from variations collection first
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'default';
      const variationsQuery = await this.config.databases.listDocuments(
        databaseId,
        'product_variations',
        [
          Query.equal('product_id', productId),
          Query.equal('is_active', true),
          Query.orderAsc('sort_order')
        ]
      );

      const variations = variationsQuery.documents as any[];

      return this.organizeVariationsByType(variations);
    } catch (error) {
      console.warn('Variations collection not found, using fallback method');
      if (this.config.fallbackToLegacyFormat) {
        return this.getLegacyVariations(productId);
      }
      throw error;
    }
  }

  /**
   * Get available variations for current selection
   */
  async getAvailableVariations(
    productId: string,
    currentSelections: Record<string, string>
  ): Promise<VariationGroup[]> {
    const allVariations = await this.getProductVariations(productId);

    // Filter variations based on current selections
    const availableGroups: VariationGroup[] = [];

    // Process color variations
    if (allVariations.colors) {
      const availableColors = await this.filterAvailableOptions(
        allVariations.colors,
        currentSelections,
        productId
      );
      if (availableColors.options.length > 0) {
        availableGroups.push(availableColors);
      }
    }

    // Process size variations
    if (allVariations.sizes) {
      const availableSizes = await this.filterAvailableOptions(
        allVariations.sizes,
        currentSelections,
        productId
      );
      if (availableSizes.options.length > 0) {
        availableGroups.push(availableSizes);
      }
    }

    return availableGroups;
  }

  /**
   * Calculate stock for variation combination
   */
  async calculateVariationStock(
    productId: string,
    variations: Record<string, string>
  ): Promise<StockCalculationResult> {
    if (!this.config.enableStockTracking) {
      return {
        availableStock: 999,
        reservedStock: 0,
        minOrderQuantity: 1,
        maxOrderQuantity: 999,
        isAvailable: true
      };
    }

    try {
      // Find the specific variation combination
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'default';
      const query = [
        Query.equal('product_id', productId),
        Query.equal('is_active', true)
      ];

      // Add filters for each variation type
      Object.entries(variations).forEach(([type, value]) => {
        query.push(Query.equal(`variation_${type}`, value));
      });

      const variationQuery = await this.config.databases.listDocuments(
        databaseId,
        'product_variations',
        query
      );

      if (variationQuery.documents.length === 0) {
        return {
          availableStock: 0,
          reservedStock: 0,
          minOrderQuantity: 1,
          maxOrderQuantity: 0,
          isAvailable: false
        };
      }

      const variation = variationQuery.documents[0] as any;

      return {
        availableStock: variation.stock_quantity || 0,
        reservedStock: variation.reserved_quantity || 0,
        minOrderQuantity: variation.min_order_quantity || 1,
        maxOrderQuantity: (variation.stock_quantity || 0) - (variation.reserved_quantity || 0),
        isAvailable: (variation.stock_quantity || 0) > (variation.reserved_quantity || 0)
      };
    } catch (error) {
      console.warn('Error calculating variation stock:', error);
      return {
        availableStock: 0,
        reservedStock: 0,
        minOrderQuantity: 1,
        maxOrderQuantity: 0,
        isAvailable: false
      };
    }
  }

  /**
   * Validate variation combination
   */
  async validateVariationCombination(
    productId: string,
    variations: Record<string, string>
  ): Promise<VariationValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if all required variations are selected
    const allVariations = await this.getProductVariations(productId);

    const requiredGroups = Object.values(allVariations).filter(group => group.required);
    const selectedTypes = Object.keys(variations);

    requiredGroups.forEach(group => {
      if (!selectedTypes.includes(group.type)) {
        errors.push(`${group.name} is required`);
      }
    });

    // Check stock availability
    const stockResult = await this.calculateVariationStock(productId, variations);

    if (!stockResult.isAvailable) {
      errors.push('Selected combination is out of stock');
    } else if (stockResult.availableStock < 5) {
      warnings.push(`Only ${stockResult.availableStock} items left in stock`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get variation-specific images
   */
  async getVariationImages(
    productId: string,
    color?: string,
    size?: string
  ): Promise<string[]> {
    try {
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'default';
      const query = [
        Query.equal('product_id', productId),
        Query.equal('is_active', true),
        Query.equal('image_type', 'variation')
      ];

      if (color) query.push(Query.equal('variation_value', color));
      if (size) query.push(Query.equal('variation_value', size));

      const imagesQuery = await this.config.databases.listDocuments(
        databaseId,
        'product_images',
        query
      );

      return imagesQuery.documents.map((doc: any) => doc.url).filter(Boolean);
    } catch (error) {
      console.warn('Error fetching variation images:', error);
      return [];
    }
  }

  /**
   * Organize variations by type
   */
  private organizeVariationsByType(variations: any[]): OrganizedVariations {
    const organized: OrganizedVariations = {
      colors: { id: 'color', name: 'Color', type: 'color', required: true, options: [] },
      sizes: { id: 'size', name: 'Size', type: 'size', required: true, options: [] },
      styles: { id: 'style', name: 'Style', type: 'style', required: false, options: [] },
      materials: { id: 'material', name: 'Material', type: 'material', required: false, options: [] }
    };

    variations.forEach(variation => {
      const option: VariationOption = {
        id: variation.$id,
        value: variation.variation_value,
        label: variation.variation_label,
        available: variation.stock_quantity > 0,
        stockCount: variation.stock_quantity,
        priceModifier: variation.price_modifier,
        image: variation.image_id ? `/api/storage/files/${variation.image_id}/view` : undefined,
        sku: variation.sku_suffix
      };

      switch (variation.variation_type) {
        case 'color':
          organized.colors.options.push(option);
          break;
        case 'size':
          organized.sizes.options.push(option);
          break;
        case 'style':
          organized.styles!.options.push(option);
          break;
        case 'material':
          organized.materials!.options.push(option);
          break;
      }
    });

    return organized;
  }

  /**
   * Filter available options based on current selections
   */
  private async filterAvailableOptions(
    group: VariationGroup,
    currentSelections: Record<string, string>,
    productId: string
  ): Promise<VariationGroup> {
    // For now, return all options - in a full implementation,
    // this would check availability based on current selections
    return group;
  }

  /**
   * Get legacy variations (fallback method)
   */
  private async getLegacyVariations(productId: string): Promise<OrganizedVariations> {
    // This would parse the legacy JSON format from the product document
    // For now, return empty structure
    return {
      colors: { id: 'color', name: 'Color', type: 'color', required: true, options: [] },
      sizes: { id: 'size', name: 'Size', type: 'size', required: true, options: [] }
    };
  }
}

// Factory function
export const createEnhancedVariationService = (config: VariationServiceConfig): EnhancedVariationService => {
  return new EnhancedVariationService(config);
};