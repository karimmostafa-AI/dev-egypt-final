// Appwrite Database Schema Definition
// This file defines the structure for all collections in the e-commerce application

export interface CollectionDefinition {
  name: string;
  id: string;
  attributes: AttributeDefinition[];
  indexes?: IndexDefinition[];
}

export interface AttributeDefinition {
  key: string;
  type: 'string' | 'integer' | 'float' | 'boolean' | 'email' | 'url' | 'datetime' | 'json';
  required: boolean;
  default?: any;
  size?: number;
  array?: boolean;
}

export interface IndexDefinition {
  key: string;
  type: 'key' | 'unique' | 'fulltext';
  attributes: string[];
}

// Collection Definitions
export const COLLECTIONS: Record<string, CollectionDefinition> = {
  // Products Collection
  products: {
    name: 'Products',
    id: 'products',
    attributes: [
      // Basic Information
      { key: 'name', type: 'string', required: true, size: 255 },
      { key: 'slug', type: 'string', required: true, size: 255 },
      { key: 'description', type: 'string', required: true, size: 2000 },
      { key: 'shortDescription', type: 'string', required: false, size: 500 },

      // Pricing
      { key: 'price', type: 'float', required: true },
      { key: 'compareAtPrice', type: 'float', required: false },
      { key: 'costPerItem', type: 'float', required: false },

      // Inventory
      { key: 'sku', type: 'string', required: true, size: 100 },
      { key: 'stockQuantity', type: 'integer', required: true, default: 0 },
      { key: 'lowStockThreshold', type: 'integer', required: true, default: 5 },
      { key: 'trackInventory', type: 'boolean', required: true, default: true },

      // Organization
      { key: 'categoryId', type: 'string', required: true, size: 36 },
      { key: 'tags', type: 'string', required: false, array: true },
      { key: 'status', type: 'string', required: true, default: 'draft' },

      // Media
      { key: 'images', type: 'json', required: true },
      { key: 'featuredImageId', type: 'string', required: false, size: 36 },

      // SEO
      { key: 'seoTitle', type: 'string', required: false, size: 255 },
      { key: 'seoDescription', type: 'string', required: false, size: 500 },

      // Metadata
      { key: 'viewCount', type: 'integer', required: true, default: 0 },
      { key: 'salesCount', type: 'integer', required: true, default: 0 },
    ],
    indexes: [
      { key: 'name', type: 'fulltext', attributes: ['name', 'description'] },
      { key: 'slug', type: 'unique', attributes: ['slug'] },
      { key: 'sku', type: 'unique', attributes: ['sku'] },
      { key: 'category', type: 'key', attributes: ['categoryId'] },
      { key: 'status', type: 'key', attributes: ['status'] },
      { key: 'price', type: 'key', attributes: ['price'] },
    ]
  },

  // Categories Collection
  categories: {
    name: 'Categories',
    id: 'categories',
    attributes: [
      { key: 'name', type: 'string', required: true, size: 255 },
      { key: 'slug', type: 'string', required: true, size: 255 },
      { key: 'description', type: 'string', required: false, size: 1000 },
      { key: 'parentId', type: 'string', required: false, size: 36 },
      { key: 'imageId', type: 'string', required: false, size: 36 },
      { key: 'imageUrl', type: 'url', required: false },
      { key: 'position', type: 'integer', required: true, default: 0 },
      { key: 'status', type: 'string', required: true, default: 'active' },
      { key: 'productCount', type: 'integer', required: true, default: 0 },
    ],
    indexes: [
      { key: 'slug', type: 'unique', attributes: ['slug'] },
      { key: 'parent', type: 'key', attributes: ['parentId'] },
      { key: 'status', type: 'key', attributes: ['status'] },
    ]
  },

  // Orders Collection
  orders: {
    name: 'Orders',
    id: 'orders',
    attributes: [
      // Order Information
      { key: 'orderNumber', type: 'string', required: true, size: 100 },
      { key: 'customerId', type: 'string', required: true, size: 36 },

      // Items (stored as JSON for flexibility)
      { key: 'items', type: 'json', required: true },

      // Totals
      { key: 'subtotal', type: 'float', required: true },
      { key: 'shippingCost', type: 'float', required: true },
      { key: 'taxAmount', type: 'float', required: true },
      { key: 'discountAmount', type: 'float', required: true },
      { key: 'total', type: 'float', required: true },

      // Status
      { key: 'status', type: 'string', required: true, default: 'pending' },
      { key: 'paymentStatus', type: 'string', required: true, default: 'pending' },
      { key: 'fulfillmentStatus', type: 'string', required: true, default: 'unfulfilled' },

      // Payment
      { key: 'paymentMethod', type: 'string', required: true, size: 100 },
      { key: 'transactionId', type: 'string', required: false, size: 255 },

      // Addresses (stored as JSON)
      { key: 'shippingAddress', type: 'json', required: true },
      { key: 'billingAddress', type: 'json', required: true },

      // Shipping
      { key: 'trackingNumber', type: 'string', required: false, size: 255 },
      { key: 'carrier', type: 'string', required: false, size: 100 },
      { key: 'shippedAt', type: 'datetime', required: false },
      { key: 'deliveredAt', type: 'datetime', required: false },

      // Notes
      { key: 'customerNote', type: 'string', required: false, size: 1000 },
      { key: 'internalNotes', type: 'json', required: true },

      // Timeline (stored as JSON)
      { key: 'timeline', type: 'json', required: true },
    ],
    indexes: [
      { key: 'orderNumber', type: 'unique', attributes: ['orderNumber'] },
      { key: 'customer', type: 'key', attributes: ['customerId'] },
      { key: 'status', type: 'key', attributes: ['status'] },
      { key: 'paymentStatus', type: 'key', attributes: ['paymentStatus'] },
      { key: 'fulfillmentStatus', type: 'key', attributes: ['fulfillmentStatus'] },
      { key: 'createdAt', type: 'key', attributes: ['$createdAt'] },
    ]
  },

  // Customers Collection
  customers: {
    name: 'Customers',
    id: 'customers',
    attributes: [
      // Basic Information
      { key: 'email', type: 'email', required: true },
      { key: 'firstName', type: 'string', required: true, size: 100 },
      { key: 'lastName', type: 'string', required: true, size: 100 },
      { key: 'phone', type: 'string', required: false, size: 50 },

      // Addresses (stored as JSON array)
      { key: 'addresses', type: 'json', required: true },
      { key: 'defaultShippingAddressId', type: 'string', required: false, size: 36 },
      { key: 'defaultBillingAddressId', type: 'string', required: false, size: 36 },

      // Statistics
      { key: 'ordersCount', type: 'integer', required: true, default: 0 },
      { key: 'totalSpent', type: 'float', required: true, default: 0 },
      { key: 'averageOrderValue', type: 'float', required: true, default: 0 },
      { key: 'lastOrderDate', type: 'datetime', required: false },

      // Account
      { key: 'status', type: 'string', required: true, default: 'active' },
      { key: 'emailVerified', type: 'boolean', required: true, default: false },

      // Segmentation
      { key: 'tags', type: 'string', required: false, array: true },
      { key: 'segment', type: 'string', required: false },

      // Marketing
      { key: 'acceptsMarketing', type: 'boolean', required: true, default: false },

      // Notes (stored as JSON array)
      { key: 'notes', type: 'json', required: true },
    ],
    indexes: [
      { key: 'email', type: 'unique', attributes: ['email'] },
      { key: 'status', type: 'key', attributes: ['status'] },
      { key: 'segment', type: 'key', attributes: ['segment'] },
      { key: 'totalSpent', type: 'key', attributes: ['totalSpent'] },
      { key: 'lastOrderDate', type: 'key', attributes: ['lastOrderDate'] },
    ]
  },

  // Admin Users Collection
  adminUsers: {
    name: 'Admin Users',
    id: 'admin_users',
    attributes: [
      { key: 'email', type: 'email', required: true },
      { key: 'name', type: 'string', required: true, size: 255 },
      { key: 'role', type: 'string', required: true, default: 'staff' },
      { key: 'permissions', type: 'json', required: true },
      { key: 'status', type: 'string', required: true, default: 'active' },
      { key: 'lastLoginAt', type: 'datetime', required: false },
    ],
    indexes: [
      { key: 'email', type: 'unique', attributes: ['email'] },
      { key: 'role', type: 'key', attributes: ['role'] },
      { key: 'status', type: 'key', attributes: ['status'] },
    ]
  },

  // Users Collection
  users: {
    name: 'Users',
    id: 'users',
    attributes: [
      { key: 'userId', type: 'string', required: true, size: 36 },
      { key: 'name', type: 'string', required: true, size: 255 },
      { key: 'email', type: 'email', required: true },
      { key: 'prehashedPassword', type: 'string', required: true, size: 255 },
    ],
    indexes: [
      { key: 'userId', type: 'unique', attributes: ['userId'] },
      { key: 'email', type: 'unique', attributes: ['email'] },
    ]
  },

  // Store Settings Collection
  storeSettings: {
    name: 'Store Settings',
    id: 'store_settings',
    attributes: [
      // Store Information
      { key: 'storeName', type: 'string', required: true, size: 255 },
      { key: 'storeLogoId', type: 'string', required: false, size: 36 },
      { key: 'contactEmail', type: 'email', required: true },
      { key: 'contactPhone', type: 'string', required: true, size: 50 },
      { key: 'storeAddress', type: 'json', required: true },

      // Regional
      { key: 'currency', type: 'string', required: true, default: 'USD' },
      { key: 'timezone', type: 'string', required: true, default: 'UTC' },
      { key: 'dateFormat', type: 'string', required: true, default: 'MM/DD/YYYY' },
      { key: 'timeFormat', type: 'string', required: true, default: '12h' },

      // Notifications
      { key: 'lowStockThreshold', type: 'integer', required: true, default: 5 },
      { key: 'enableLowStockAlerts', type: 'boolean', required: true, default: true },
      { key: 'enableNewOrderNotifications', type: 'boolean', required: true, default: true },
      { key: 'enableCustomerRegistrationNotifications', type: 'boolean', required: true, default: true },
      { key: 'notificationEmails', type: 'string', required: false, array: true },
    ],
    indexes: []
  },

  // Payment Settings Collection
  paymentSettings: {
    name: 'Payment Settings',
    id: 'payment_settings',
    attributes: [
      { key: 'enabledMethods', type: 'string', required: true, array: true },
      { key: 'testMode', type: 'boolean', required: true, default: true },
    ],
    indexes: []
  },

  // Shipping Settings Collection
  shippingSettings: {
    name: 'Shipping Settings',
    id: 'shipping_settings',
    attributes: [
      { key: 'zones', type: 'json', required: true },
      { key: 'freeShippingThreshold', type: 'float', required: false },
      { key: 'handlingTime', type: 'integer', required: true, default: 1 },
    ],
    indexes: []
  },

  // Tax Settings Collection
  taxSettings: {
    name: 'Tax Settings',
    id: 'tax_settings',
    attributes: [
      { key: 'taxInclusivePricing', type: 'boolean', required: true, default: false },
      { key: 'automaticTaxCalculation', type: 'boolean', required: true, default: true },
      { key: 'rates', type: 'json', required: true },
    ],
    indexes: []
  },

  // Email Settings Collection
  emailSettings: {
    name: 'Email Settings',
    id: 'email_settings',
    attributes: [
      { key: 'smtpHost', type: 'string', required: true, size: 255 },
      { key: 'smtpPort', type: 'integer', required: true, default: 587 },
      { key: 'smtpUsername', type: 'string', required: true, size: 255 },
      { key: 'smtpPassword', type: 'string', required: true, size: 255 },
      { key: 'fromEmail', type: 'email', required: true },
      { key: 'fromName', type: 'string', required: true, size: 255 },
      { key: 'templates', type: 'json', required: true },
    ],
    indexes: []
  }
};

// Helper function to get collection by ID
export const getCollection = (id: string): CollectionDefinition | undefined => {
  return COLLECTIONS[id];
};

// Helper function to get all collection IDs
export const getCollectionIds = (): string[] => {
  return Object.keys(COLLECTIONS);
};

// Helper function to get collection name by ID
export const getCollectionName = (id: string): string => {
  const collection = COLLECTIONS[id];
  return collection ? collection.name : id;
};