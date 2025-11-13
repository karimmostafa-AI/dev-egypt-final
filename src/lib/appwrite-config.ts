// Appwrite Configuration - Updated with correct database ID
import { Databases, Client } from 'appwrite';

export const DATABASE_CONFIG = {
  // Use the actual database ID from the Appwrite instance
  DATABASE_ID: '68dbeceb003bf10d9498',
  
  // Collection IDs
  COLLECTIONS: {
    PRODUCTS: 'products',
    CATEGORIES: 'categories', 
    BRANDS: 'brands',
    ORDERS: 'orders',
    PRODUCT_VARIATIONS: 'product_variations',
    PRODUCT_IMAGES: 'product_images',
    INVENTORY_MOVEMENTS: 'stock_movements',
    INVENTORY_ALERTS: 'inventory_alerts',
    INVENTORY_AUDIT_ITEMS: 'inventory_audit_items'
  }
};

// Initialize client with proper configuration
export const initializeAppwriteClient = () => {
  const client = new Client();
  
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  
  client
    .setEndpoint(endpoint)
    .setProject(projectId);
    
  return client;
};

// Create databases instance
export const databases = new Databases(initializeAppwriteClient());

export default {
  DATABASE_CONFIG,
  databases
};