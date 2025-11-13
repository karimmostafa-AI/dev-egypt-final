import { Client, Account, Databases, Storage } from 'appwrite';
import * as sdk from 'node-appwrite';

// Provide defaults for required environment variables
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';

// Initialize client with validation
const client = new Client();

// Function to create/recreate client (useful after login)
export const createClient = () => {
  const newClient = new Client();

  if (endpoint && projectId && endpoint !== 'disabled' && projectId !== 'disabled' && endpoint !== '' && projectId !== '') {
    try {
      newClient
        .setEndpoint(endpoint)
        .setProject(projectId);
      
      console.log('✅ Appwrite client configured');
    } catch (error) {
      console.warn('Failed to configure client:', error);
    }
  }

  return newClient;
};

// Configure client for both browser and server environments
console.log('🔧 Configuring Appwrite client...');
console.log('Environment variables:', {
  NEXT_PUBLIC_APPWRITE_ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  endpoint,
  projectId
});

if (endpoint && projectId && endpoint !== 'disabled' && projectId !== 'disabled' && endpoint !== '' && projectId !== '') {
  try {
    client
      .setEndpoint(endpoint)
      .setProject(projectId);

    console.log('✅ Appwrite client configured successfully:');
    console.log('  Endpoint:', endpoint);
    console.log('  Project ID:', projectId);
  } catch (error) {
    console.error('❌ Failed to configure Appwrite client:', error);
  }
} else {
  console.warn('⚠️ Appwrite configuration disabled or missing. Running in fallback mode.');
  console.warn('Missing configuration:', {
    endpoint: !endpoint || endpoint === '',
    projectId: !projectId || projectId === '',
    endpointValue: endpoint,
    projectIdValue: projectId
  });
}

// Browser-specific configuration
if (typeof window !== 'undefined') {
  console.log('Browser environment detected - configuring for session management');
  
  // Check if we have a session token in localStorage (for debugging)
  try {
    const sessionToken = window.localStorage.getItem('appwrite-session');
    if (sessionToken) {
      console.log('Found existing session token in localStorage');
    } else {
      console.log('No session token found in localStorage');
    }
  } catch (error) {
    console.warn('Could not access localStorage:', error);
  }
} else {
  console.log('Server-side environment detected - using server client configuration');
}

// Server-side client for API routes (using node-appwrite SDK)
export const createServerClient = () => {
  const serverClient = new sdk.Client();
  const apiKey = process.env.APPWRITE_API_KEY;

  if (endpoint && projectId && endpoint !== 'disabled' && projectId !== 'disabled' && endpoint !== '' && projectId !== '') {
    try {
      serverClient
        .setEndpoint(endpoint)
        .setProject(projectId);
      
      // Set API key for server-side operations (user creation, admin tasks)
      if (apiKey && apiKey !== 'disabled' && apiKey !== '') {
        serverClient.setKey(apiKey);
        console.log('Server client configured with API key');
      } else {
        console.warn('APPWRITE_API_KEY disabled - server operations will use fallback mode');
      }
    } catch (error) {
      console.warn('Failed to configure server client:', error);
    }
  } else {
    console.warn('Appwrite disabled - all operations will use fallback mode');
  }

  return serverClient;
};

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Database and Collection IDs with safe defaults
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
export const PRODUCTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID || 'products';
export const ORDERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID || 'orders';
export const CUSTOMERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CUSTOMERS_COLLECTION_ID || 'customers';
export const CATEGORIES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CATEGORIES_COLLECTION_ID || 'categories';
export const SETTINGS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID || 'settings';
export const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || 'users';
// Additional collection IDs based on exported Appwrite schema
export const PRODUCT_VARIATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_VARIATIONS_COLLECTION_ID || 'product_variations';
export const PRODUCT_IMAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_IMAGES_COLLECTION_ID || 'product_images';
export const INVENTORY_TRANSACTIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_INVENTORY_TRANSACTIONS_COLLECTION_ID || 'inventory_transactions';

// Storage Bucket IDs
export const PRODUCT_IMAGES_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_IMAGES_BUCKET_ID || 'product-images';
export const STORE_ASSETS_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_STORE_ASSETS_BUCKET_ID || 'store-assets';

// Utility function to check if we're in a browser environment
export const isBrowser = typeof window !== 'undefined';

// Session management utilities for debugging
export const getSessionToken = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem('appwrite-session');
  }
  return null;
};

export const setSessionToken = (token: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('appwrite-session', token);
  }
};

export { client };