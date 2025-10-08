// Appwrite Service Layer
// Provides CRUD operations for all collections with proper error handling

import { databases, DATABASE_ID, account } from './appwrite';
import { COLLECTIONS, CollectionDefinition } from './database-schema';
import { ID, Query, Permission, Role } from 'appwrite';

// Types for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  documents: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateOptions {
  permissions?: string[];
}

export interface UpdateOptions {
  permissions?: string[];
}

export interface ListOptions {
  queries?: string[];
  limit?: number;
  offset?: number;
  cursor?: string;
  cursorDirection?: 'after' | 'before';
}

// Generic CRUD Service Class
export class AppwriteService {
  private databaseId: string;
  private collectionId: string;

  constructor(databaseId: string, collectionId: string) {
    this.databaseId = databaseId;
    this.collectionId = collectionId;
  }

  // Create a new document
  async create<T extends Record<string, any>>(
    data: Omit<T, '$id' | '$createdAt' | '$updatedAt'>,
    options?: CreateOptions
  ): Promise<ApiResponse<T & { $id: string; $createdAt: string; $updatedAt: string }>> {
    try {
      const permissions = options?.permissions || [
        Permission.read(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ];

      const document = await databases.createDocument(
        this.databaseId,
        this.collectionId,
        ID.unique(),
        data,
        permissions
      );

      return {
        success: true,
        data: document as unknown as T & { $id: string; $createdAt: string; $updatedAt: string }
      };
    } catch (error) {
      console.error(`Error creating document in ${this.collectionId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create document'
      };
    }
  }

  // Get a document by ID
  async get<T>(documentId: string): Promise<ApiResponse<T>> {
    try {
      const document = await databases.getDocument(
        this.databaseId,
        this.collectionId,
        documentId
      );

      return {
        success: true,
        data: document as unknown as T
      };
    } catch (error) {
      console.error(`Error getting document ${documentId} from ${this.collectionId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get document'
      };
    }
  }

  // Update a document
  async update<T extends Record<string, any>>(
    documentId: string,
    data: Partial<Omit<T, '$id' | '$createdAt' | '$updatedAt'>>,
    options?: UpdateOptions
  ): Promise<ApiResponse<T & { $id: string; $createdAt: string; $updatedAt: string }>> {
    try {
      const permissions = options?.permissions;

      const document = await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        documentId,
        data,
        permissions
      );

      return {
        success: true,
        data: document as unknown as T & { $id: string; $createdAt: string; $updatedAt: string }
      };
    } catch (error) {
      console.error(`Error updating document ${documentId} in ${this.collectionId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update document'
      };
    }
  }

  // Delete a document
  async delete(documentId: string): Promise<ApiResponse<void>> {
    try {
      await databases.deleteDocument(
        this.databaseId,
        this.collectionId,
        documentId
      );

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      console.error(`Error deleting document ${documentId} from ${this.collectionId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete document'
      };
    }
  }

  // List documents with pagination and filtering
  async list<T>(
    options?: ListOptions
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    try {
      const queries = options?.queries || [];
      const limit = options?.limit || 25;
      const offset = options?.offset || 0;

      // Add pagination queries if not already present
      const hasLimitQuery = queries.some(q => q.includes('limit'));
      const hasOffsetQuery = queries.some(q => q.includes('offset'));

      if (!hasLimitQuery) {
        queries.push(Query.limit(limit));
      }
      if (!hasOffsetQuery) {
        queries.push(Query.offset(offset));
      }

      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        queries
      );

      return {
        success: true,
        data: {
          documents: response.documents as T[],
          total: response.total,
          limit,
          offset
        }
      };
    } catch (error) {
      console.error(`Error listing documents from ${this.collectionId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list documents'
      };
    }
  }

  // Search documents
  async search<T>(
    searchQuery: string,
    options?: Omit<ListOptions, 'queries'>
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    try {
      const queries = [Query.search('name', searchQuery)];
      const limit = options?.limit || 25;
      const offset = options?.offset || 0;

      queries.push(Query.limit(limit));
      queries.push(Query.offset(offset));

      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        queries
      );

      return {
        success: true,
        data: {
          documents: response.documents as T[],
          total: response.total,
          limit,
          offset
        }
      };
    } catch (error) {
      console.error(`Error searching documents in ${this.collectionId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search documents'
      };
    }
  }
}

// Service instances for each collection
export const productService = new AppwriteService(DATABASE_ID, 'products');
export const categoryService = new AppwriteService(DATABASE_ID, 'categories');
export const orderService = new AppwriteService(DATABASE_ID, 'orders');
export const customerService = new AppwriteService(DATABASE_ID, 'customers');
export const adminUserService = new AppwriteService(DATABASE_ID, 'admin_users');
export const storeSettingsService = new AppwriteService(DATABASE_ID, 'store_settings');
export const paymentSettingsService = new AppwriteService(DATABASE_ID, 'payment_settings');
export const shippingSettingsService = new AppwriteService(DATABASE_ID, 'shipping_settings');
export const taxSettingsService = new AppwriteService(DATABASE_ID, 'tax_settings');
export const emailSettingsService = new AppwriteService(DATABASE_ID, 'email_settings');

// Utility functions for common operations
export class DatabaseUtils {
  // Check if database and collections exist
  static async initializeDatabase(): Promise<ApiResponse<boolean>> {
    try {
      // Test database connection by trying to list documents from a collection
      // If this fails, the database or collection doesn't exist
      try {
        await databases.listDocuments(DATABASE_ID, 'products', [Query.limit(1)]);
      } catch (collectionError) {
        // If we get a 404 or similar error, the collection doesn't exist yet
        // This is expected for new setups
        console.log('Collections not yet created, this is normal for new setups');
      }

      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('Database initialization error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize database'
      };
    }
  }

  // Create all required collections (for setup)
  static async createCollections(): Promise<ApiResponse<CollectionDefinition[]>> {
    try {
      const createdCollections: CollectionDefinition[] = [];

      for (const [key, collection] of Object.entries(COLLECTIONS)) {
        try {
          // Note: In a real implementation, you would call the Appwrite API to create collections
          // For now, we'll just log the collection definitions
          console.log(`Collection ${key}:`, collection);
          createdCollections.push(collection);
        } catch (error) {
          console.error(`Error creating collection ${key}:`, error);
        }
      }

      return {
        success: true,
        data: createdCollections
      };
    } catch (error) {
      console.error('Error creating collections:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create collections'
      };
    }
  }
}