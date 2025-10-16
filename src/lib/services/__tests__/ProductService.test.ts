import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductService } from '../ProductService';
import { ProductData, ProductVariation } from '@/lib/repositories/ProductRepository';

// Mock data for testing
const mockProduct: ProductData = {
  id: 'test-id',
  name: 'Test Product',
  slug: 'test-product',
  description: 'A test product',
  price: 100,
  discount_price: 80,
  compareAtPrice: 120,
  sku: 'TEST-001',
  stockQuantity: 50,
  min_order_quantity: 1,
  is_active: true,
  hasVariations: true,
  variations: [
    {
      id: 'color-red',
      product_id: 'test-id',
      variation_type: 'color',
      variation_value: 'red',
      variation_label: 'Red',
      stock_quantity: 20,
      price_modifier: 0,
      sku: 'TEST-001-RED',
      is_active: true,
      sort_order: 1
    },
    {
      id: 'color-blue',
      product_id: 'test-id',
      variation_type: 'color',
      variation_value: 'blue',
      variation_label: 'Blue',
      stock_quantity: 30,
      price_modifier: 5,
      sku: 'TEST-001-BLUE',
      is_active: true,
      sort_order: 2
    },
    {
      id: 'size-small',
      product_id: 'test-id',
      variation_type: 'size',
      variation_value: 'small',
      variation_label: 'Small',
      stock_quantity: 15,
      price_modifier: -5,
      sku: 'TEST-001-SMALL',
      is_active: true,
      sort_order: 1
    }
  ],
  images: [],
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z'
};

describe('ProductService', () => {
  let productService: ProductService;
  let mockDatabases: any;
  let mockStorage: any;

  beforeEach(() => {
    mockDatabases = {};
    mockStorage = {};
    productService = new ProductService(mockDatabases, mockStorage);
  });

  describe('calculatePricing', () => {
    it('should calculate base pricing correctly without variations', () => {
      const pricing = productService.calculatePricing(mockProduct, {}, 1);

      expect(pricing.basePrice).toBe(80); // discount_price
      expect(pricing.compareAtPrice).toBe(120);
      expect(pricing.savings).toBe(40);
      expect(pricing.savingsPercent).toBe(33);
      expect(pricing.variationPriceModifier).toBe(0);
      expect(pricing.finalPrice).toBe(80);
    });

    it('should calculate pricing with variations', () => {
      const variations = { color: 'blue', size: 'small' };
      const pricing = productService.calculatePricing(mockProduct, variations, 2);

      expect(pricing.variationPriceModifier).toBe(0); // 5 + (-5) = 0
      expect(pricing.finalPrice).toBe(160); // (80 + 0) * 2
    });

    it('should handle quantity correctly', () => {
      const pricing = productService.calculatePricing(mockProduct, {}, 3);

      expect(pricing.finalPrice).toBe(240); // 80 * 3
      expect(pricing.savings).toBe(120); // 40 * 3
    });
  });

  describe('getAvailabilityInfo', () => {
    it('should return correct availability for base product', () => {
      const availability = productService.getAvailabilityInfo(mockProduct, {});

      expect(availability.isAvailable).toBe(true);
      expect(availability.stockQuantity).toBe(50);
      expect(availability.minOrderQuantity).toBe(1);
      expect(availability.maxOrderQuantity).toBe(50);
      expect(availability.availableVariations.length).toBe(3);
    });

    it('should filter availability by selected variations', () => {
      const availability = productService.getAvailabilityInfo(mockProduct, { color: 'red' });

      // Should only return size variations since color is selected
      const sizeVariations = availability.availableVariations.filter(v => v.variation_type === 'size');
      expect(sizeVariations.length).toBe(1);
    });
  });

  describe('validateVariationSelection', () => {
    it('should validate correct variation selection', () => {
      const variations = { color: 'red', size: 'small' };
      const result = productService.validateVariationSelection(mockProduct, variations);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid variation selection', () => {
      const variations = { color: 'invalid-color', size: 'small' };
      const result = productService.validateVariationSelection(mockProduct, variations);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Selected color "invalid-color" is not available');
    });

    it('should validate stock availability', () => {
      // Create a product with no stock for specific variation combination
      const outOfStockProduct = {
        ...mockProduct,
        variations: [
          {
            ...mockProduct.variations[0],
            stock_quantity: 0
          }
        ]
      };

      const variations = { color: 'red' };
      const result = productService.validateVariationSelection(outOfStockProduct, variations);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('out of stock'))).toBe(true);
    });
  });

  describe('getProductImages', () => {
    const productWithImages: ProductData = {
      ...mockProduct,
      images: [
        {
          id: 'main-1',
          product_id: 'test-id',
          image_type: 'main' as const,
          image_url: '/main.jpg',
          image_id: 'main-file',
          file_id: 'main-file',
          url: '/main.jpg',
          alt_text: 'Main image',
          sort_order: 1,
          is_primary: true,
          is_active: true
        },
        {
          id: 'gallery-1',
          product_id: 'test-id',
          image_type: 'gallery' as const,
          image_url: '/gallery.jpg',
          image_id: 'gallery-file',
          file_id: 'gallery-file',
          url: '/gallery.jpg',
          alt_text: 'Gallery image',
          sort_order: 2,
          is_primary: false,
          is_active: true
        }
      ]
    };

    it('should return main and gallery images when no variations selected', () => {
      const images = productService.getProductImages(productWithImages, {});

      expect(images.length).toBe(2);
      expect(images.every(img => img.image_type === 'main' || img.image_type === 'gallery')).toBe(true);
    });

    it('should return empty array when no images available', () => {
      const images = productService.getProductImages(mockProduct, {});

      expect(images).toHaveLength(0);
    });
  });
});