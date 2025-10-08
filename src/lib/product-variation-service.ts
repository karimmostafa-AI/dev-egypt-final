// Product Variation Service
// This service handles product variations, colors, sizes, and image associations

import { ID, Databases } from 'appwrite';

// Types for product variations
export interface ProductColor {
  id: string;
  name: string;           // e.g., "Navy Blue"
  hexCode: string;        // e.g., "#1e3a8a"
  images: string[];       // Image IDs for this color
  isActive: boolean;
  order: number;
  sku?: string;          // Color-specific SKU
  stock?: number;        // Stock for this color
}

export interface ProductSize {
  id: string;
  name: string;           // e.g., "Small", "Medium", "Large"
  sku: string;           // Size-specific SKU
  stock: number;         // Stock for this size
  price?: number;        // Size-specific pricing
  isActive: boolean;
  order: number;
}

export interface ProductVariation {
  id: string;
  colorId: string;
  sizeId: string;
  sku: string;
  stock: number;
  price?: number;
  images: string[];
  isActive: boolean;
}

export interface ProductImageVariation {
  imageId: string;
  colorId?: string;
  isMainImage: boolean;
  isBackImage: boolean;
  order: number;
  altText?: string;
}

export interface ProductVariationService {
  // Color management
  addProductColor(productId: string, color: Omit<ProductColor, 'id'>): Promise<ProductColor>;
  updateProductColor(productId: string, colorId: string, updates: Partial<ProductColor>): Promise<ProductColor>;
  deleteProductColor(productId: string, colorId: string): Promise<void>;
  reorderProductColors(productId: string, colorIds: string[]): Promise<void>;

  // Size management
  addProductSize(productId: string, size: Omit<ProductSize, 'id'>): Promise<ProductSize>;
  updateProductSize(productId: string, sizeId: string, updates: Partial<ProductSize>): Promise<ProductSize>;
  deleteProductSize(productId: string, sizeId: string): Promise<void>;
  reorderProductSizes(productId: string, sizeIds: string[]): Promise<void>;

  // Variation management
  generateVariations(productId: string): Promise<ProductVariation[]>;
  updateVariation(productId: string, variationId: string, updates: Partial<ProductVariation>): Promise<ProductVariation>;
  deleteVariation(productId: string, variationId: string): Promise<void>;

  // Image management
  assignImageToColor(productId: string, imageId: string, colorId: string): Promise<void>;
  setMainImage(productId: string, imageId: string): Promise<void>;
  setBackImage(productId: string, imageId: string): Promise<void>;
  getImagesForColor(productId: string, colorId: string): Promise<string[]>;

  // Color palette
  getPredefinedColors(): ColorOption[];
  saveCustomColor(color: ColorOption): Promise<void>;
  getBrandColors(brandId: string): Promise<ColorOption[]>;

  // Stock management
  updateStock(productId: string, variationId: string, newStock: number): Promise<void>;
  getTotalStock(productId: string): Promise<number>;
}

export interface ColorOption {
  id: string;
  name: string;
  hexCode: string;
  category?: string;
  isCustom?: boolean;
}

export interface ColorPaletteService {
  getPredefinedColors(): ColorOption[];
  openColorPicker(currentColor?: string): Promise<ColorResult>;
  validateColorContrast(hexColor: string): boolean;
  suggestAccessibleColors(baseColor: string): string[];
  saveCustomColor(color: ColorOption): Promise<void>;
  getBrandColors(brandId: string): Promise<ColorOption[]>;
}

export interface ColorResult {
  hex: string;
  name?: string;
  source: 'picker' | 'predefined' | 'custom';
}

class ProductVariationManager implements ProductVariationService {
  private databases: Databases;
  private readonly DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
  private readonly PRODUCTS_COLLECTION_ID = 'products';

  // Predefined color palette
  private readonly predefinedColors: ColorOption[] = [
    { id: 'navy-blue', name: 'Navy Blue', hexCode: '#1e3a8a', category: 'blue' },
    { id: 'royal-blue', name: 'Royal Blue', hexCode: '#2563eb', category: 'blue' },
    { id: 'sky-blue', name: 'Sky Blue', hexCode: '#0ea5e9', category: 'blue' },
    { id: 'white', name: 'White', hexCode: '#ffffff', category: 'neutral' },
    { id: 'black', name: 'Black', hexCode: '#000000', category: 'neutral' },
    { id: 'gray', name: 'Gray', hexCode: '#6b7280', category: 'neutral' },
    { id: 'red', name: 'Red', hexCode: '#dc2626', category: 'red' },
    { id: 'green', name: 'Green', hexCode: '#16a34a', category: 'green' },
    { id: 'yellow', name: 'Yellow', hexCode: '#eab308', category: 'yellow' },
    { id: 'purple', name: 'Purple', hexCode: '#9333ea', category: 'purple' },
    { id: 'pink', name: 'Pink', hexCode: '#ec4899', category: 'pink' },
    { id: 'orange', name: 'Orange', hexCode: '#f97316', category: 'orange' },
    { id: 'brown', name: 'Brown', hexCode: '#92400e', category: 'brown' },
    { id: 'beige', name: 'Beige', hexCode: '#f5f5dc', category: 'neutral' },
    { id: 'cream', name: 'Cream', hexCode: '#fef7ed', category: 'neutral' }
  ];

  constructor(databases: Databases) {
    this.databases = databases;
  }

  async addProductColor(productId: string, color: Omit<ProductColor, 'id'>): Promise<ProductColor> {
    try {
      const newColor: ProductColor = {
        id: ID.unique(),
        ...color
      };

      // Get current product
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      // Add color to product
      if (!product.colorOptions) {
        product.colorOptions = [];
      }
      product.colorOptions.push(newColor);

      // Update product
      await this.databases.updateDocument(
        this.DATABASE_ID,
        this.PRODUCTS_COLLECTION_ID,
        productId,
        {
          colorOptions: product.colorOptions
        }
      );

      return newColor;
    } catch (error) {
      console.error('Error adding product color:', error);
      throw error;
    }
  }

  async updateProductColor(productId: string, colorId: string, updates: Partial<ProductColor>): Promise<ProductColor> {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      const colorIndex = product.colorOptions?.findIndex((c: ProductColor) => c.id === colorId);
      if (colorIndex === undefined || colorIndex === -1) {
        throw new Error(`Color not found: ${colorId}`);
      }

      // Update color
      if (product.colorOptions) {
        product.colorOptions[colorIndex] = { ...product.colorOptions[colorIndex], ...updates };
      }

      // Save changes
      await this.databases.updateDocument(
        this.DATABASE_ID,
        this.PRODUCTS_COLLECTION_ID,
        productId,
        {
          colorOptions: product.colorOptions
        }
      );

      return product.colorOptions![colorIndex];
    } catch (error) {
      console.error('Error updating product color:', error);
      throw error;
    }
  }

  async deleteProductColor(productId: string, colorId: string): Promise<void> {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      if (product.colorOptions) {
        product.colorOptions = product.colorOptions.filter((c: ProductColor) => c.id !== colorId);
      }

      await this.databases.updateDocument(
        this.DATABASE_ID,
        this.PRODUCTS_COLLECTION_ID,
        productId,
        {
          colorOptions: product.colorOptions
        }
      );
    } catch (error) {
      console.error('Error deleting product color:', error);
      throw error;
    }
  }

  async reorderProductColors(productId: string, colorIds: string[]): Promise<void> {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      if (product.colorOptions) {
        // Reorder colors based on provided IDs
        const reorderedColors = colorIds.map((id, index) => {
          const color = product.colorOptions!.find((c: ProductColor) => c.id === id);
          if (color) {
            return { ...color, order: index + 1 };
          }
          return null;
        }).filter(Boolean) as ProductColor[];

        product.colorOptions = reorderedColors;
      }

      await this.databases.updateDocument(
        this.DATABASE_ID,
        this.PRODUCTS_COLLECTION_ID,
        productId,
        {
          colorOptions: product.colorOptions
        }
      );
    } catch (error) {
      console.error('Error reordering product colors:', error);
      throw error;
    }
  }

  async addProductSize(productId: string, size: Omit<ProductSize, 'id'>): Promise<ProductSize> {
    try {
      const newSize: ProductSize = {
        id: ID.unique(),
        ...size
      };

      // Get current product
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      // Add size to product
      if (!product.sizeOptions) {
        product.sizeOptions = [];
      }
      product.sizeOptions.push(newSize);

      // Update product
      await this.databases.updateDocument(
        this.DATABASE_ID,
        this.PRODUCTS_COLLECTION_ID,
        productId,
        {
          sizeOptions: product.sizeOptions
        }
      );

      return newSize;
    } catch (error) {
      console.error('Error adding product size:', error);
      throw error;
    }
  }

  async updateProductSize(productId: string, sizeId: string, updates: Partial<ProductSize>): Promise<ProductSize> {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      const sizeIndex = product.sizeOptions?.findIndex((s: ProductSize) => s.id === sizeId);
      if (sizeIndex === undefined || sizeIndex === -1) {
        throw new Error(`Size not found: ${sizeId}`);
      }

      // Update size
      if (product.sizeOptions) {
        product.sizeOptions[sizeIndex] = { ...product.sizeOptions[sizeIndex], ...updates };
      }

      // Save changes
      await this.databases.updateDocument(
        this.DATABASE_ID,
        this.PRODUCTS_COLLECTION_ID,
        productId,
        {
          sizeOptions: product.sizeOptions
        }
      );

      return product.sizeOptions![sizeIndex];
    } catch (error) {
      console.error('Error updating product size:', error);
      throw error;
    }
  }

  async deleteProductSize(productId: string, sizeId: string): Promise<void> {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      if (product.sizeOptions) {
        product.sizeOptions = product.sizeOptions.filter((s: ProductSize) => s.id !== sizeId);
      }

      await this.databases.updateDocument(
        this.DATABASE_ID,
        this.PRODUCTS_COLLECTION_ID,
        productId,
        {
          sizeOptions: product.sizeOptions
        }
      );
    } catch (error) {
      console.error('Error deleting product size:', error);
      throw error;
    }
  }

  async reorderProductSizes(productId: string, sizeIds: string[]): Promise<void> {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      if (product.sizeOptions) {
        // Reorder sizes based on provided IDs
        const reorderedSizes = sizeIds.map((id, index) => {
          const size = product.sizeOptions!.find((s: ProductSize) => s.id === id);
          if (size) {
            return { ...size, order: index + 1 };
          }
          return null;
        }).filter(Boolean) as ProductSize[];

        product.sizeOptions = reorderedSizes;
      }

      await this.databases.updateDocument(
        this.DATABASE_ID,
        this.PRODUCTS_COLLECTION_ID,
        productId,
        {
          sizeOptions: product.sizeOptions
        }
      );
    } catch (error) {
      console.error('Error reordering product sizes:', error);
      throw error;
    }
  }

  async generateVariations(productId: string): Promise<ProductVariation[]> {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      const variations: ProductVariation[] = [];

      // Generate variations for each color-size combination
      if (product.colorOptions && product.sizeOptions) {
        for (const color of product.colorOptions.filter((c: ProductColor) => c.isActive)) {
          for (const size of product.sizeOptions.filter((s: ProductSize) => s.isActive)) {
            const variation: ProductVariation = {
              id: ID.unique(),
              colorId: color.id,
              sizeId: size.id,
              sku: `${product.sku}-${color.name.toLowerCase().replace(' ', '-')}-${size.name.toLowerCase()}`,
              stock: (color.stock || 0) + (size.stock || 0), // Combine stocks or use individual
              price: size.price || product.price,
              images: color.images || [],
              isActive: true
            };
            variations.push(variation);
          }
        }
      }

      // Update product with variations
      await this.databases.updateDocument(
        this.DATABASE_ID,
        this.PRODUCTS_COLLECTION_ID,
        productId,
        {
          variations,
          hasVariations: variations.length > 0
        }
      );

      return variations;
    } catch (error) {
      console.error('Error generating variations:', error);
      throw error;
    }
  }

  async updateVariation(productId: string, variationId: string, updates: Partial<ProductVariation>): Promise<ProductVariation> {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      const variationIndex = product.variations?.findIndex((v: ProductVariation) => v.id === variationId);
      if (variationIndex === undefined || variationIndex === -1) {
        throw new Error(`Variation not found: ${variationId}`);
      }

      // Update variation
      if (product.variations) {
        product.variations[variationIndex] = { ...product.variations[variationIndex], ...updates };
      }

      // Save changes
      await this.databases.updateDocument(
        this.DATABASE_ID,
        this.PRODUCTS_COLLECTION_ID,
        productId,
        {
          variations: product.variations
        }
      );

      return product.variations![variationIndex];
    } catch (error) {
      console.error('Error updating variation:', error);
      throw error;
    }
  }

  async deleteVariation(productId: string, variationId: string): Promise<void> {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      if (product.variations) {
        product.variations = product.variations.filter((v: ProductVariation) => v.id !== variationId);
      }

      await this.databases.updateDocument(
        this.DATABASE_ID,
        this.PRODUCTS_COLLECTION_ID,
        productId,
        {
          variations: product.variations
        }
      );
    } catch (error) {
      console.error('Error deleting variation:', error);
      throw error;
    }
  }

  async assignImageToColor(productId: string, imageId: string, colorId: string): Promise<void> {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      const color = product.colorOptions?.find((c: ProductColor) => c.id === colorId);
      if (!color) {
        throw new Error(`Color not found: ${colorId}`);
      }

      // Add image to color if not already present
      if (!color.images.includes(imageId)) {
        color.images.push(imageId);
      }

      // Update product
      await this.databases.updateDocument(
        this.DATABASE_ID,
        this.PRODUCTS_COLLECTION_ID,
        productId,
        {
          colorOptions: product.colorOptions
        }
      );
    } catch (error) {
      console.error('Error assigning image to color:', error);
      throw error;
    }
  }

  async setMainImage(productId: string, imageId: string): Promise<void> {
    try {
      await this.databases.updateDocument(
        this.DATABASE_ID,
        this.PRODUCTS_COLLECTION_ID,
        productId,
        {
          mainImageId: imageId
        }
      );
    } catch (error) {
      console.error('Error setting main image:', error);
      throw error;
    }
  }

  async setBackImage(productId: string, imageId: string): Promise<void> {
    try {
      await this.databases.updateDocument(
        this.DATABASE_ID,
        this.PRODUCTS_COLLECTION_ID,
        productId,
        {
          backImageId: imageId
        }
      );
    } catch (error) {
      console.error('Error setting back image:', error);
      throw error;
    }
  }

  async getImagesForColor(productId: string, colorId: string): Promise<string[]> {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      const color = product.colorOptions?.find((c: ProductColor) => c.id === colorId);
      return color?.images || [];
    } catch (error) {
      console.error('Error getting images for color:', error);
      return [];
    }
  }

  getPredefinedColors(): ColorOption[] {
    return this.predefinedColors;
  }

  async saveCustomColor(color: ColorOption): Promise<void> {
    try {
      // In a real implementation, this would save to a custom colors collection
      console.log('Saving custom color:', color);
    } catch (error) {
      console.error('Error saving custom color:', error);
      throw error;
    }
  }

  async getBrandColors(brandId: string): Promise<ColorOption[]> {
    try {
      // In a real implementation, this would fetch brand-specific colors
      return this.predefinedColors;
    } catch (error) {
      console.error('Error getting brand colors:', error);
      return [];
    }
  }

  async updateStock(productId: string, variationId: string, newStock: number): Promise<void> {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      const variation = product.variations?.find((v: ProductVariation) => v.id === variationId);
      if (!variation) {
        throw new Error(`Variation not found: ${variationId}`);
      }

      variation.stock = newStock;

      await this.databases.updateDocument(
        this.DATABASE_ID,
        this.PRODUCTS_COLLECTION_ID,
        productId,
        {
          variations: product.variations
        }
      );
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  async getTotalStock(productId: string): Promise<number> {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      return product.variations?.reduce((total: number, variation: ProductVariation) => total + variation.stock, 0) || 0;
    } catch (error) {
      console.error('Error getting total stock:', error);
      return 0;
    }
  }

  private async getProductById(productId: string): Promise<any> {
    try {
      const result = await this.databases.getDocument(
        this.DATABASE_ID,
        this.PRODUCTS_COLLECTION_ID,
        productId
      );

      return result;
    } catch (error) {
      console.error('Error getting product by ID:', error);
      return null;
    }
  }
}

// Factory function to create the service
export const createProductVariationService = (databases: Databases): ProductVariationService => {
  return new ProductVariationManager(databases);
};