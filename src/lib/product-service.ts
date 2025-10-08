// Product Service
// Specialized service for product-related operations

import { productService } from './appwrite-service';
import { Query } from 'appwrite';
import type { Product } from '../types/admin';

export interface ProductFilters {
  search?: string;
  category?: string;
  status?: Product['status'];
  stockStatus?: 'in-stock' | 'low-stock' | 'out-of-stock';
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
}

export interface ProductListOptions {
  filters?: ProductFilters;
  sortBy?: 'name' | 'price' | 'createdAt' | 'stockQuantity' | 'salesCount';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  archivedProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  averagePrice: number;
  totalValue: number;
}

export class ProductServiceClass {
  // Get products with advanced filtering and sorting
  async getProducts(options: ProductListOptions = {}) {
    try {
      const queries: string[] = [];

      // Apply filters
      if (options.filters) {
        const { filters } = options;

        if (filters.search) {
          queries.push(Query.search('name', filters.search));
        }

        if (filters.category) {
          queries.push(Query.equal('categoryId', filters.category));
        }

        if (filters.status) {
          queries.push(Query.equal('status', filters.status));
        }

        if (filters.stockStatus) {
          switch (filters.stockStatus) {
            case 'in-stock':
              queries.push(Query.greaterThan('stockQuantity', 0));
              break;
            case 'low-stock':
              queries.push(Query.between('stockQuantity', 1, 5));
              break;
            case 'out-of-stock':
              queries.push(Query.equal('stockQuantity', 0));
              break;
          }
        }

        if (filters.tags && filters.tags.length > 0) {
          // Note: Appwrite doesn't support array contains queries directly
          // This would need to be implemented differently or use a search approach
        }

        if (filters.priceMin !== undefined) {
          queries.push(Query.greaterThanEqual('price', filters.priceMin));
        }

        if (filters.priceMax !== undefined) {
          queries.push(Query.lessThanEqual('price', filters.priceMax));
        }
      }

      // Apply sorting
      if (options.sortBy) {
        const order = options.sortOrder === 'desc' ? 'DESC' : 'ASC';
        queries.push(Query.orderDesc(options.sortBy));
      }

      // Apply pagination
      if (options.limit) {
        queries.push(Query.limit(options.limit));
      }
      if (options.offset) {
        queries.push(Query.offset(options.offset));
      }

      return await productService.list<Product>({
        queries,
        limit: options.limit,
        offset: options.offset
      });
    } catch (error) {
      console.error('Error getting products:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get products'
      };
    }
  }

  // Get a single product by ID
  async getProduct(productId: string) {
    return await productService.get<Product>(productId);
  }

  // Create a new product
  async createProduct(productData: Omit<Product, '$id' | '$createdAt' | '$updatedAt'>) {
    return await productService.create<Product>(productData);
  }

  // Update a product
  async updateProduct(productId: string, productData: Partial<Omit<Product, '$id' | '$createdAt' | '$updatedAt'>>) {
    return await productService.update<Product>(productId, productData);
  }

  // Delete a product
  async deleteProduct(productId: string) {
    return await productService.delete(productId);
  }

  // Update product stock
  async updateStock(productId: string, newQuantity: number) {
    return await productService.update<Product>(productId, {
      stockQuantity: newQuantity,
      // Update timestamp
      $updatedAt: new Date().toISOString()
    } as any);
  }

  // Get product statistics
  async getProductStats(): Promise<{ success: boolean; data?: ProductStats; error?: string }> {
    try {
      // Get all products for statistics calculation
      const allProductsResponse = await productService.list<Product>({
        limit: 1000 // Get all products (adjust based on your needs)
      });

      if (!allProductsResponse.success || !allProductsResponse.data) {
        return {
          success: false,
          error: 'Failed to fetch products for statistics'
        };
      }

      const products = allProductsResponse.data.documents;

      const stats: ProductStats = {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.status === 'active').length,
        draftProducts: products.filter(p => p.status === 'draft').length,
        archivedProducts: products.filter(p => p.status === 'archived').length,
        lowStockProducts: products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold).length,
        outOfStockProducts: products.filter(p => p.stockQuantity === 0).length,
        averagePrice: products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0,
        totalValue: products.reduce((sum, p) => sum + (p.price * p.stockQuantity), 0)
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error getting product statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get product statistics'
      };
    }
  }

  // Search products
  async searchProducts(searchQuery: string, options: { limit?: number; offset?: number } = {}) {
    return await productService.search<Product>(searchQuery, options);
  }

  // Get products by category
  async getProductsByCategory(categoryId: string, options: { limit?: number; offset?: number } = {}) {
    return await productService.list<Product>({
      queries: [Query.equal('categoryId', categoryId)],
      limit: options.limit,
      offset: options.offset
    });
  }

  // Get featured products
  async getFeaturedProducts(limit: number = 10) {
    return await productService.list<Product>({
      queries: [
        Query.equal('status', 'active'),
        Query.orderDesc('viewCount'),
        Query.limit(limit)
      ]
    });
  }

  // Get products on sale
  async getSaleProducts(limit: number = 20) {
    return await productService.list<Product>({
      queries: [
        Query.equal('status', 'active'),
        Query.greaterThan('compareAtPrice', 0),
        Query.limit(limit)
      ]
    });
  }

  // Bulk update products
  async bulkUpdateProducts(
    productIds: string[],
    updates: Partial<Omit<Product, '$id' | '$createdAt' | '$updatedAt'>>
  ) {
    try {
      const results = [];

      for (const productId of productIds) {
        const result = await productService.update<Product>(productId, updates);
        results.push({ productId, result });
      }

      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('Error bulk updating products:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to bulk update products'
      };
    }
  }

  // Validate product data
  validateProductData(data: Partial<Product>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Product name is required');
    }

    if (!data.price || data.price <= 0) {
      errors.push('Product price must be greater than 0');
    }

    if (!data.sku || data.sku.trim().length === 0) {
      errors.push('Product SKU is required');
    }

    if (data.stockQuantity !== undefined && data.stockQuantity < 0) {
      errors.push('Stock quantity cannot be negative');
    }

    if (!data.categoryId || data.categoryId.trim().length === 0) {
      errors.push('Product category is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const productServiceFunctions = new ProductServiceClass();