// Appwrite Cloud Functions for Product Operations
// These functions handle server-side product business logic

import { Client, Databases, Query, ID } from 'appwrite';

// Types for function parameters and responses
export interface ProductFunctionRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body?: any;
  pathParameters?: Record<string, string>;
  queryParameters?: Record<string, string>;
}

export interface ProductFunctionResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
}

export interface ProductData {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stockQuantity: number;
  categoryId: string;
  images?: string[];
  tags?: string[];
  status?: 'draft' | 'active' | 'archived';
}

// Initialize Appwrite client (for cloud functions)
function initializeAppwrite(): Databases {
  const client = new Client();

  // Set configuration from environment variables
  const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_PROJECT_ID || '';

  client
    .setEndpoint(endpoint)
    .setProject(projectId);

  return new Databases(client);
}

// Initialize Appwrite services
const databases = initializeAppwrite();
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '';
const PRODUCTS_COLLECTION_ID = 'products';
const CATEGORIES_COLLECTION_ID = 'categories';

// Product CRUD Functions

/**
 * Get all products with filtering and pagination
 */
export async function getProducts(request: ProductFunctionRequest): Promise<ProductFunctionResponse> {
  try {

    const {
      search,
      category,
      status,
      limit = '25',
      offset = '0',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = request.queryParameters || {};

    const queries = [];

    // Add search query
    if (search) {
      queries.push(Query.search('name', search));
    }

    // Add category filter
    if (category) {
      queries.push(Query.equal('categoryId', category));
    }

    // Add status filter
    if (status) {
      queries.push(Query.equal('status', status));
    }

    // Add sorting
    if (sortOrder === 'desc') {
      queries.push(Query.orderDesc(sortBy));
    } else {
      queries.push(Query.orderAsc(sortBy));
    }

    // Add pagination
    queries.push(Query.limit(parseInt(limit)));
    queries.push(Query.offset(parseInt(offset)));

    const result = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      queries
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: {
          products: result.documents,
          total: result.total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    };
  } catch (error) {
    console.error('Error getting products:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to get products',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Get a single product by ID
 */
export async function getProduct(request: ProductFunctionRequest): Promise<ProductFunctionResponse> {
  try {
    const { productId } = request.pathParameters || {};

    if (!productId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Product ID is required'
        }
      };
    }

    const product = await databases.getDocument(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      productId
    );

    // Increment view count
    await databases.updateDocument(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      productId,
      {
        viewCount: (product.viewCount || 0) + 1
      }
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: product
      }
    };
  } catch (error) {
    console.error('Error getting product:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to get product',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Create a new product
 */
export async function createProduct(request: ProductFunctionRequest): Promise<ProductFunctionResponse> {
  try {
    const productData: ProductData = request.body;

    // Validate required fields
    if (!productData.name || !productData.sku || !productData.categoryId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Missing required fields: name, sku, categoryId'
        }
      };
    }

    // Generate slug from name
    const slug = productData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if SKU already exists
    const existingProducts = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      [Query.equal('sku', productData.sku)]
    );

    if (existingProducts.documents.length > 0) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'SKU already exists'
        }
      };
    }

    // Check if slug already exists
    const existingSlugs = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      [Query.equal('slug', slug)]
    );

    if (existingSlugs.documents.length > 0) {
      // Append random number to make slug unique
      const uniqueSlug = `${slug}-${Date.now()}`;
      productData.slug = uniqueSlug;
    } else {
      productData.slug = slug;
    }

    // Set default values
    const newProduct = {
      ...productData,
      status: productData.status || 'draft',
      viewCount: 0,
      salesCount: 0,
      lowStockThreshold: 5,
      trackInventory: true
    };

    const product = await databases.createDocument(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      ID.unique(),
      newProduct
    );

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: product
      }
    };
  } catch (error) {
    console.error('Error creating product:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to create product',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(request: ProductFunctionRequest): Promise<ProductFunctionResponse> {
  try {
    const { productId } = request.pathParameters || {};
    const updateData: Partial<ProductData> = request.body;

    if (!productId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Product ID is required'
        }
      };
    }

    // If updating SKU, check for uniqueness
    if (updateData.sku) {
      const existingProducts = await databases.listDocuments(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        [Query.equal('sku', updateData.sku), Query.notEqual('$id', productId)]
      );

      if (existingProducts.documents.length > 0) {
        return {
          statusCode: 409,
          headers: { 'Content-Type': 'application/json' },
          body: {
            success: false,
            error: 'SKU already exists'
          }
        };
      }
    }

    // If updating name, regenerate slug
    if (updateData.name) {
      const slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if slug already exists (excluding current product)
      const existingSlugs = await databases.listDocuments(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        [Query.equal('slug', slug), Query.notEqual('$id', productId)]
      );

      if (existingSlugs.documents.length > 0) {
        updateData.slug = `${slug}-${Date.now()}`;
      } else {
        updateData.slug = slug;
      }
    }

    const product = await databases.updateDocument(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      productId,
      updateData
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: product
      }
    };
  } catch (error) {
    console.error('Error updating product:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to update product',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(request: ProductFunctionRequest): Promise<ProductFunctionResponse> {
  try {
    const { productId } = request.pathParameters || {};

    if (!productId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Product ID is required'
        }
      };
    }

    // Check if product has any orders
    // In a real implementation, you would check the orders collection
    // const orders = await databases.listDocuments(
    //   DATABASE_ID,
    //   'orders',
    //   [Query.contains('items.productId', productId)]
    // );

    // if (orders.documents.length > 0) {
    //   return {
    //     statusCode: 409,
    //     headers: { 'Content-Type': 'application/json' },
    //     body: {
    //       success: false,
    //       error: 'Cannot delete product with existing orders'
    //     }
    //   };
    // }

    await databases.deleteDocument(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      productId
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        message: 'Product deleted successfully'
      }
    };
  } catch (error) {
    console.error('Error deleting product:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to delete product',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Update product stock
 */
export async function updateProductStock(request: ProductFunctionRequest): Promise<ProductFunctionResponse> {
  try {
    const { productId } = request.pathParameters || {};
    const { quantity, operation = 'set' } = request.body;

    if (!productId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Product ID is required'
        }
      };
    }

    if (typeof quantity !== 'number') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Quantity must be a number'
        }
      };
    }

    // Get current product
    const product = await databases.getDocument(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      productId
    );

    let newQuantity: number;

    switch (operation) {
      case 'add':
        newQuantity = product.stockQuantity + quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, product.stockQuantity - quantity);
        break;
      case 'set':
      default:
        newQuantity = quantity;
        break;
    }

    const updatedProduct = await databases.updateDocument(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      productId,
      { stockQuantity: newQuantity }
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: {
          productId,
          oldQuantity: product.stockQuantity,
          newQuantity,
          operation
        }
      }
    };
  } catch (error) {
    console.error('Error updating product stock:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to update product stock',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Get product statistics
 */
export async function getProductStats(request: ProductFunctionRequest): Promise<ProductFunctionResponse> {
  try {
    // Get all products for statistics
    const result = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      [Query.limit(1000)] // Adjust based on your needs
    );

    const products = result.documents;

    const stats = {
      totalProducts: products.length,
      activeProducts: products.filter((p: any) => p.status === 'active').length,
      draftProducts: products.filter((p: any) => p.status === 'draft').length,
      archivedProducts: products.filter((p: any) => p.status === 'archived').length,
      lowStockProducts: products.filter((p: any) =>
        p.stockQuantity > 0 && p.stockQuantity <= (p.lowStockThreshold || 5)
      ).length,
      outOfStockProducts: products.filter((p: any) => p.stockQuantity === 0).length,
      averagePrice: products.length > 0
        ? products.reduce((sum: number, p: any) => sum + p.price, 0) / products.length
        : 0,
      totalValue: products.reduce((sum: number, p: any) => sum + (p.price * p.stockQuantity), 0)
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: stats
      }
    };
  } catch (error) {
    console.error('Error getting product statistics:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to get product statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Bulk update products
 */
export async function bulkUpdateProducts(request: ProductFunctionRequest): Promise<ProductFunctionResponse> {
  try {
    const { productIds, updates } = request.body;

    if (!Array.isArray(productIds) || !updates) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'productIds array and updates object are required'
        }
      };
    }

    const results = [];

    for (const productId of productIds) {
      try {
        const updatedProduct = await databases.updateDocument(
          DATABASE_ID,
          PRODUCTS_COLLECTION_ID,
          productId,
          updates
        );

        results.push({
          productId,
          success: true,
          data: updatedProduct
        });
      } catch (error) {
        results.push({
          productId,
          success: false,
          error: error instanceof Error ? error.message : 'Update failed'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: failureCount === 0,
        data: {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failureCount
          }
        }
      }
    };
  } catch (error) {
    console.error('Error bulk updating products:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to bulk update products',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}