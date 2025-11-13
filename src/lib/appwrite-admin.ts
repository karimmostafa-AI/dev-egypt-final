import { Client, Users, Databases, Storage, Account, Query } from 'node-appwrite';

// Admin client configuration
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
  console.error('Missing Appwrite configuration:');
  console.error('APPWRITE_ENDPOINT:', APPWRITE_ENDPOINT || 'Missing');
  console.error('APPWRITE_PROJECT_ID:', APPWRITE_PROJECT_ID || 'Missing');
  console.error('APPWRITE_API_KEY:', APPWRITE_API_KEY ? 'Present' : 'Missing');
  
  // Don't throw error in development, use fallback
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Appwrite configuration is incomplete');
  }
}

// Create admin client with API key for server-side operations
export const createAdminClient = async () => {
  try {
    const client = new Client();

    if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID) {
      throw new Error('Missing Appwrite endpoint or project ID');
    }

    client
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID);

    // Only set API key if available
    if (APPWRITE_API_KEY && APPWRITE_API_KEY !== '') {
      client.setKey(APPWRITE_API_KEY);
    } else {
      console.warn('⚠️ No API key provided - limited functionality available');
    }

    // Set timeout for requests (10 seconds)
    // Note: node-appwrite uses undici internally, timeout is handled at the fetch level
    // The retry logic in analytics-helpers will handle connection timeouts

    const users = new Users(client);
    const databases = new Databases(client);
    const storage = new Storage(client);
    const account = new Account(client);

    // Only log in development to avoid spam
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Admin client created successfully');
    }

    return {
      client,
      users,
      databases,
      storage,
      account,
    };
  } catch (error) {
    console.error('❌ Failed to create admin client:', error);
    throw error;
  }
};

// Utility functions for admin operations
export const adminUtils = {
  // Get all users with pagination
  async getAllUsers(limit = 100, offset = 0, search = '') {
    const { users } = await createAdminClient();
    
    const queries = [];
    if (limit) queries.push(Query.limit(limit));
    if (offset) queries.push(Query.offset(offset));
    if (search) queries.push(Query.search('name', search));
    
    return await users.list(queries);
  },

  // Create a new user
  async createUser(email: string, password: string, name?: string) {
    const { users } = await createAdminClient();
    return await users.create('unique()', email, undefined, password, name);
  },

  // Delete a user
  async deleteUser(userId: string) {
    const { users } = await createAdminClient();
    return await users.delete(userId);
  },

  // Update user status
  async updateUserStatus(userId: string, status: boolean) {
    const { users } = await createAdminClient();
    return await users.updateStatus(userId, status);
  },

  // Get user by ID
  async getUser(userId: string) {
    const { users } = await createAdminClient();
    return await users.get(userId);
  },

  // Update user email verification
  async updateEmailVerification(userId: string, emailVerification: boolean) {
    const { users } = await createAdminClient();
    return await users.updateEmailVerification(userId, emailVerification);
  },

  // Update user phone verification
  async updatePhoneVerification(userId: string, phoneVerification: boolean) {
    const { users } = await createAdminClient();
    return await users.updatePhoneVerification(userId, phoneVerification);
  },
};

export default createAdminClient;