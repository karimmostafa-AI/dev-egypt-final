import { Client, Users, Databases, Storage, Account } from 'node-appwrite';

// Admin client configuration
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
  console.error('Missing Appwrite configuration:');
  console.error('APPWRITE_ENDPOINT:', APPWRITE_ENDPOINT ? '✓' : '✗');
  console.error('APPWRITE_PROJECT_ID:', APPWRITE_PROJECT_ID ? '✓' : '✗');
  console.error('APPWRITE_API_KEY:', APPWRITE_API_KEY ? '✓' : '✗');
}

// Create admin client with API key for server-side operations
export const createAdminClient = async () => {
  const client = new Client();

  client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  const users = new Users(client);
  const databases = new Databases(client);
  const storage = new Storage(client);
  const account = new Account(client);

  return {
    client,
    users,
    databases,
    storage,
    account,
  };
};

// Utility functions for admin operations
export const adminUtils = {
  // Get all users with pagination
  async getAllUsers(limit = 100, offset = 0, search = '') {
    const { users } = await createAdminClient();
    
    const queries = [];
    if (limit) queries.push(`limit(${limit})`);
    if (offset) queries.push(`offset(${offset})`);
    if (search) queries.push(`search("name", "${search}")`);
    
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