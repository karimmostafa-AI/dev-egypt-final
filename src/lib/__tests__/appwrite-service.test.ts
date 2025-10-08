// Unit tests for Appwrite Service Layer

import { AppwriteService, DatabaseUtils } from '../appwrite-service';
import { databases } from '../appwrite';

// Mock Appwrite SDK
jest.mock('../appwrite', () => ({
  databases: {
    createDocument: jest.fn(),
    getDocument: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
    listDocuments: jest.fn()
  }
}));

const mockDatabases = databases as jest.Mocked<typeof databases>;

// Helper function to create mock documents
const createMockDocument = (data: any) => ({
  $id: data.$id || '123',
  $createdAt: data.$createdAt || '2023-01-01T00:00:00.000Z',
  $updatedAt: data.$updatedAt || '2023-01-01T00:00:00.000Z',
  $collectionId: data.$collectionId || 'products',
  $databaseId: data.$databaseId || 'test-db',
  $permissions: data.$permissions || ['read', 'write'],
  ...data
});

describe('AppwriteService', () => {
  let productService: AppwriteService;

  beforeEach(() => {
    jest.clearAllMocks();
    productService = new AppwriteService('test-db', 'products');
  });

  describe('create', () => {
    it('should create a document successfully', async () => {
      const mockDocument = createMockDocument({
        $id: '123',
        name: 'Test Product',
        price: 100
      });

      mockDatabases.createDocument.mockResolvedValue(mockDocument as any);

      const result = await productService.create({
        name: 'Test Product',
        price: 100
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDocument);
      expect(mockDatabases.createDocument).toHaveBeenCalledWith(
        'test-db',
        'products',
        expect.any(String),
        { name: 'Test Product', price: 100 },
        expect.any(Array)
      );
    });

    it('should handle creation errors', async () => {
      const mockError = new Error('Creation failed');
      mockDatabases.createDocument.mockRejectedValue(mockError);

      const result = await productService.create({
        name: 'Test Product',
        price: 100
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Creation failed');
    });
  });

  describe('get', () => {
    it('should get a document successfully', async () => {
      const mockDocument = createMockDocument({
        $id: '123',
        name: 'Test Product',
        price: 100
      });

      mockDatabases.getDocument.mockResolvedValue(mockDocument as any);

      const result = await productService.get('123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDocument);
      expect(mockDatabases.getDocument).toHaveBeenCalledWith(
        'test-db',
        'products',
        '123'
      );
    });

    it('should handle get errors', async () => {
      const mockError = new Error('Document not found');
      mockDatabases.getDocument.mockRejectedValue(mockError);

      const result = await productService.get('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Document not found');
    });
  });

  describe('update', () => {
    it('should update a document successfully', async () => {
      const mockDocument = createMockDocument({
        $id: '123',
        name: 'Updated Product',
        price: 150
      });

      mockDatabases.updateDocument.mockResolvedValue(mockDocument as any);

      const result = await productService.update('123', {
        name: 'Updated Product',
        price: 150
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDocument);
    });

    it('should handle update errors', async () => {
      const mockError = new Error('Update failed');
      mockDatabases.updateDocument.mockRejectedValue(mockError);

      const result = await productService.update('123', {
        name: 'Updated Product'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete a document successfully', async () => {
      mockDatabases.deleteDocument.mockResolvedValue({} as any);

      const result = await productService.delete('123');

      expect(result.success).toBe(true);
      expect(mockDatabases.deleteDocument).toHaveBeenCalledWith(
        'test-db',
        'products',
        '123'
      );
    });

    it('should handle delete errors', async () => {
      const mockError = new Error('Delete failed');
      mockDatabases.deleteDocument.mockRejectedValue(mockError);

      const result = await productService.delete('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });
  });

  describe('list', () => {
    it('should list documents successfully', async () => {
      const mockDocuments = [
        createMockDocument({ $id: '1', name: 'Product 1' }),
        createMockDocument({ $id: '2', name: 'Product 2' })
      ];

      const mockResponse = {
        documents: mockDocuments,
        total: 2
      };

      mockDatabases.listDocuments.mockResolvedValue(mockResponse as any);

      const result = await productService.list({
        limit: 10,
        offset: 0
      });

      expect(result.success).toBe(true);
      expect(result.data?.documents).toEqual(mockDocuments);
      expect(result.data?.total).toBe(2);
    });

    it('should handle list errors', async () => {
      const mockError = new Error('List failed');
      mockDatabases.listDocuments.mockRejectedValue(mockError);

      const result = await productService.list();

      expect(result.success).toBe(false);
      expect(result.error).toBe('List failed');
    });
  });

  describe('search', () => {
    it('should search documents successfully', async () => {
      const mockDocuments = [
        createMockDocument({ $id: '1', name: 'Search Result 1' })
      ];

      const mockResponse = {
        documents: mockDocuments,
        total: 1
      };

      mockDatabases.listDocuments.mockResolvedValue(mockResponse as any);

      const result = await productService.search('test query');

      expect(result.success).toBe(true);
      expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
        'test-db',
        'products',
        expect.arrayContaining([
          expect.stringContaining('search')
        ])
      );
    });
  });
});

describe('DatabaseUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeDatabase', () => {
    it('should initialize database successfully', async () => {
      mockDatabases.listDocuments.mockResolvedValue({
        documents: [],
        total: 0
      });

      const result = await DatabaseUtils.initializeDatabase();

      expect(result.success).toBe(true);
    });

    it('should handle initialization errors', async () => {
      const mockError = new Error('Database connection failed');
      mockDatabases.listDocuments.mockRejectedValue(mockError);

      const result = await DatabaseUtils.initializeDatabase();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });
  });
});