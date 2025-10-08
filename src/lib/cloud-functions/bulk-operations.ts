// Appwrite Cloud Functions for Bulk Data Operations
// These functions handle bulk import/export and data migration

import { Client, Databases, Query, ID, Models } from 'appwrite';

// Types for function parameters and responses
export interface BulkOperationRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body?: any;
  pathParameters?: Record<string, string>;
  queryParameters?: Record<string, string>;
}

export interface BulkOperationResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
}

export interface ImportConfig {
  collection: string;
  data: any[];
  mapping?: Record<string, string>;
  skipDuplicates?: boolean;
  updateOnDuplicate?: boolean;
  validateData?: boolean;
}

export interface ExportConfig {
  collection: string;
  format: 'json' | 'csv' | 'excel';
  filters?: Record<string, any>;
  fields?: string[];
  limit?: number;
  offset?: number;
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
const ORDERS_COLLECTION_ID = 'orders';
const CUSTOMERS_COLLECTION_ID = 'customers';
const CATEGORIES_COLLECTION_ID = 'categories';

/**
 * Bulk import products from CSV/JSON data
 */
export async function bulkImportProducts(request: BulkOperationRequest): Promise<BulkOperationResponse> {
  try {
    const config: ImportConfig = request.body;

    if (!config.data || !Array.isArray(config.data) || config.data.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Data array is required for import'
        }
      };
    }

    const results = [];
    const errors = [];
    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (let i = 0; i < config.data.length; i++) {
      const item = config.data[i];

      try {
        // Validate required fields
        if (config.validateData !== false) {
          const validation = validateProductData(item);
          if (!validation.isValid) {
            errors.push({
              row: i + 1,
              errors: validation.errors
            });
            errorCount++;
            continue;
          }
        }

        // Check for duplicates if requested
        if (config.skipDuplicates !== false) {
          const existingProducts = await databases.listDocuments(
            DATABASE_ID,
            PRODUCTS_COLLECTION_ID,
            [Query.equal('sku', item.sku)]
          );

          if (existingProducts.documents.length > 0) {
            if (config.updateOnDuplicate) {
              // Update existing product
              const updatedProduct = await databases.updateDocument(
                DATABASE_ID,
                PRODUCTS_COLLECTION_ID,
                existingProducts.documents[0].$id,
                item
              );

              results.push({
                row: i + 1,
                action: 'updated',
                id: updatedProduct.$id,
                sku: item.sku
              });
              successCount++;
            } else {
              // Skip duplicate
              results.push({
                row: i + 1,
                action: 'skipped',
                reason: 'duplicate',
                sku: item.sku
              });
              duplicateCount++;
            }
            continue;
          }
        }

        // Generate slug if not provided
        if (!item.slug && item.name) {
          item.slug = item.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        }

        // Create new product
        const newProduct = await databases.createDocument(
          DATABASE_ID,
          PRODUCTS_COLLECTION_ID,
          ID.unique(),
          {
            ...item,
            status: item.status || 'draft',
            viewCount: 0,
            salesCount: 0,
            lowStockThreshold: item.lowStockThreshold || 5,
            trackInventory: item.trackInventory !== false
          }
        );

        results.push({
          row: i + 1,
          action: 'created',
          id: newProduct.$id,
          sku: item.sku
        });

        successCount++;
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: item
        });
        errorCount++;
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: errorCount === 0,
        data: {
          summary: {
            total: config.data.length,
            successful: successCount,
            duplicates: duplicateCount,
            errors: errorCount
          },
          results,
          errors
        }
      }
    };
  } catch (error) {
    console.error('Error bulk importing products:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to bulk import products',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Bulk import customers from CSV/JSON data
 */
export async function bulkImportCustomers(request: BulkOperationRequest): Promise<BulkOperationResponse> {
  try {
    const config: ImportConfig = request.body;

    if (!config.data || !Array.isArray(config.data) || config.data.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Data array is required for import'
        }
      };
    }

    const results = [];
    const errors = [];
    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (let i = 0; i < config.data.length; i++) {
      const item = config.data[i];

      try {
        // Validate required fields
        if (config.validateData !== false) {
          const validation = validateCustomerData(item);
          if (!validation.isValid) {
            errors.push({
              row: i + 1,
              errors: validation.errors
            });
            errorCount++;
            continue;
          }
        }

        // Check for duplicates if requested
        if (config.skipDuplicates !== false) {
          const existingCustomers = await databases.listDocuments(
            DATABASE_ID,
            CUSTOMERS_COLLECTION_ID,
            [Query.equal('email', item.email)]
          );

          if (existingCustomers.documents.length > 0) {
            if (config.updateOnDuplicate) {
              // Update existing customer
              const updatedCustomer = await databases.updateDocument(
                DATABASE_ID,
                CUSTOMERS_COLLECTION_ID,
                existingCustomers.documents[0].$id,
                item
              );

              results.push({
                row: i + 1,
                action: 'updated',
                id: updatedCustomer.$id,
                email: item.email
              });
              successCount++;
            } else {
              // Skip duplicate
              results.push({
                row: i + 1,
                action: 'skipped',
                reason: 'duplicate',
                email: item.email
              });
              duplicateCount++;
            }
            continue;
          }
        }

        // Create new customer
        const newCustomer = await databases.createDocument(
          DATABASE_ID,
          CUSTOMERS_COLLECTION_ID,
          ID.unique(),
          {
            ...item,
            status: item.status || 'active',
            emailVerified: false,
            ordersCount: 0,
            totalSpent: 0,
            averageOrderValue: 0,
            segment: 'regular',
            acceptsMarketing: item.acceptsMarketing || false,
            notes: []
          }
        );

        results.push({
          row: i + 1,
          action: 'created',
          id: newCustomer.$id,
          email: item.email
        });

        successCount++;
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: item
        });
        errorCount++;
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: errorCount === 0,
        data: {
          summary: {
            total: config.data.length,
            successful: successCount,
            duplicates: duplicateCount,
            errors: errorCount
          },
          results,
          errors
        }
      }
    };
  } catch (error) {
    console.error('Error bulk importing customers:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to bulk import customers',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Bulk export data from collections
 */
export async function bulkExportData(request: BulkOperationRequest): Promise<BulkOperationResponse> {
  try {
    const config: ExportConfig = request.body;

    if (!config.collection) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Collection name is required for export'
        }
      };
    }

    // Build queries
    const queries: string[] = [];

    if (config.filters) {
      Object.entries(config.filters).forEach(([key, value]) => {
        const queryValue = Array.isArray(value) ? value : [value];
        queries.push(Query.equal(key, queryValue));
      });
    }

    if (config.limit) {
      queries.push(Query.limit(config.limit));
    }

    if (config.offset) {
      queries.push(Query.offset(config.offset));
    }

    // Get data from collection
    const result = await databases.listDocuments(
      DATABASE_ID,
      config.collection,
      queries
    );

    let exportData = result.documents;

    // Filter fields if specified
    if (config.fields && config.fields.length > 0) {
      exportData = exportData.map((item: any) => {
        const filtered: any = {};
        config.fields!.forEach(field => {
          if (item.hasOwnProperty(field)) {
            filtered[field] = item[field];
          }
        });
        return filtered;
      });
    }

    // Return in requested format
    switch (config.format) {
      case 'csv':
        return generateCSVExport(exportData, config.collection);
      case 'excel':
        return generateExcelExport(exportData, config.collection);
      default:
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            success: true,
            data: {
              collection: config.collection,
              count: exportData.length,
              exportedAt: new Date().toISOString(),
              records: exportData
            }
          }
        };
    }
  } catch (error) {
    console.error('Error bulk exporting data:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to bulk export data',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Bulk update records in a collection
 */
export async function bulkUpdateRecords(request: BulkOperationRequest): Promise<BulkOperationResponse> {
  try {
    const { collection, updates, filters } = request.body;

    if (!collection || !updates) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Collection and updates are required'
        }
      };
    }

    // Build queries for filtering
    const queries = filters
      ? Object.entries(filters).map(([key, value]) => {
          const queryValue = Array.isArray(value) ? value : [value];
          return Query.equal(key, queryValue);
        })
      : [];

    // Get records to update
    const result = await databases.listDocuments(
      DATABASE_ID,
      collection,
      queries.length > 0 ? queries : [Query.limit(1000)]
    );

    const records = result.documents;
    const updateResults = [];

    // Update each record
    for (const record of records) {
      try {
        const updatedRecord = await databases.updateDocument(
          DATABASE_ID,
          collection,
          record.$id,
          updates
        );

        updateResults.push({
          id: record.$id,
          success: true,
          data: updatedRecord
        });
      } catch (error) {
        updateResults.push({
          id: record.$id,
          success: false,
          error: error instanceof Error ? error.message : 'Update failed'
        });
      }
    }

    const successCount = updateResults.filter(r => r.success).length;
    const failureCount = updateResults.length - successCount;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: failureCount === 0,
        data: {
          collection,
          summary: {
            total: updateResults.length,
            successful: successCount,
            failed: failureCount
          },
          results: updateResults
        }
      }
    };
  } catch (error) {
    console.error('Error bulk updating records:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to bulk update records',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Bulk delete records from a collection
 */
export async function bulkDeleteRecords(request: BulkOperationRequest): Promise<BulkOperationResponse> {
  try {
    const { collection, filters, recordIds } = request.body;

    if (!collection) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Collection is required'
        }
      };
    }

    let recordsToDelete = [];

    if (recordIds && Array.isArray(recordIds)) {
      // Delete specific records by IDs
      recordsToDelete = recordIds;
    } else if (filters) {
      // Get records matching filters
      const queries = Object.entries(filters).map(([key, value]) => {
        const queryValue = Array.isArray(value) ? value : [value];
        return Query.equal(key, queryValue);
      });

      const result = await databases.listDocuments(
        DATABASE_ID,
        collection,
        [...queries, Query.limit(1000)]
      );

      recordsToDelete = result.documents.map((doc: any) => doc.$id);
    } else {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Either recordIds or filters must be provided'
        }
      };
    }

    const deleteResults = [];

    // Delete each record
    for (const recordId of recordsToDelete) {
      try {
        await databases.deleteDocument(
          DATABASE_ID,
          collection,
          recordId
        );

        deleteResults.push({
          id: recordId,
          success: true
        });
      } catch (error) {
        deleteResults.push({
          id: recordId,
          success: false,
          error: error instanceof Error ? error.message : 'Delete failed'
        });
      }
    }

    const successCount = deleteResults.filter(r => r.success).length;
    const failureCount = deleteResults.length - successCount;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: failureCount === 0,
        data: {
          collection,
          summary: {
            total: deleteResults.length,
            successful: successCount,
            failed: failureCount
          },
          results: deleteResults
        }
      }
    };
  } catch (error) {
    console.error('Error bulk deleting records:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to bulk delete records',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Data migration between collections
 */
export async function migrateData(request: BulkOperationRequest): Promise<BulkOperationResponse> {
  try {
    const { sourceCollection, targetCollection, mapping, filters } = request.body;

    if (!sourceCollection || !targetCollection || !mapping) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'sourceCollection, targetCollection, and mapping are required'
        }
      };
    }

    // Get source data
    const queries = filters
      ? Object.entries(filters).map(([key, value]) => {
          const queryValue = Array.isArray(value) ? value : [value];
          return Query.equal(key, queryValue);
        })
      : [];

    const sourceResult = await databases.listDocuments(
      DATABASE_ID,
      sourceCollection,
      [...queries, Query.limit(1000)]
    );

    const sourceRecords = sourceResult.documents;
    const migrationResults = [];

    // Migrate each record
    for (const record of sourceRecords) {
      try {
        // Transform data according to mapping
        const transformedData: any = {};

        Object.entries(mapping).forEach(([sourceField, targetField]) => {
          if (record.hasOwnProperty(sourceField)) {
            transformedData[targetField as string] = (record as any)[sourceField];
          }
        });

        // Add metadata
        transformedData.migratedFrom = sourceCollection;
        transformedData.migratedAt = new Date().toISOString();
        transformedData.originalId = record.$id;

        const newRecord = await databases.createDocument(
          DATABASE_ID,
          targetCollection,
          ID.unique(),
          transformedData
        );

        migrationResults.push({
          originalId: record.$id,
          newId: newRecord.$id,
          success: true
        });
      } catch (error) {
        migrationResults.push({
          originalId: record.$id,
          success: false,
          error: error instanceof Error ? error.message : 'Migration failed'
        });
      }
    }

    const successCount = migrationResults.filter(r => r.success).length;
    const failureCount = migrationResults.length - successCount;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: failureCount === 0,
        data: {
          sourceCollection,
          targetCollection,
          summary: {
            total: migrationResults.length,
            successful: successCount,
            failed: failureCount
          },
          results: migrationResults
        }
      }
    };
  } catch (error) {
    console.error('Error migrating data:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to migrate data',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

// Helper functions for data validation

function validateProductData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Product name is required and must be a non-empty string');
  }

  if (!data.sku || typeof data.sku !== 'string' || data.sku.trim().length === 0) {
    errors.push('Product SKU is required and must be a non-empty string');
  }

  if (!data.price || typeof data.price !== 'number' || data.price <= 0) {
    errors.push('Product price is required and must be a positive number');
  }

  if (data.stockQuantity !== undefined && (typeof data.stockQuantity !== 'number' || data.stockQuantity < 0)) {
    errors.push('Stock quantity must be a non-negative number');
  }

  if (!data.categoryId || typeof data.categoryId !== 'string' || data.categoryId.trim().length === 0) {
    errors.push('Category ID is required and must be a non-empty string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateCustomerData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
    errors.push('Valid email address is required');
  }

  if (!data.firstName || typeof data.firstName !== 'string' || data.firstName.trim().length === 0) {
    errors.push('First name is required and must be a non-empty string');
  }

  if (!data.lastName || typeof data.lastName !== 'string' || data.lastName.trim().length === 0) {
    errors.push('Last name is required and must be a non-empty string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Export format generators

function generateCSVExport(data: any[], collection: string): BulkOperationResponse {
  if (data.length === 0) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${collection}-export-${new Date().toISOString().split('T')[0]}.csv"`
      },
      body: 'No data to export'
    };
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  data.forEach(item => {
    const row = headers.map(header => {
      const value = item[header];
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return `"${String(value || '').replace(/"/g, '""')}"`;
    });
    csvRows.push(row.join(','));
  });

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${collection}-export-${new Date().toISOString().split('T')[0]}.csv"`
    },
    body: csvRows.join('\n')
  };
}

function generateExcelExport(data: any[], collection: string): BulkOperationResponse {
  // For now, return CSV format as Excel
  // In a real implementation, you would generate actual Excel files using a library like 'exceljs'
  return generateCSVExport(data, collection);
}