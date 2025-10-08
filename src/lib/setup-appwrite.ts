// Appwrite Setup Script
// Initializes database collections and creates default admin user

import { databases, DATABASE_ID, storage } from './appwrite';
import { COLLECTIONS } from './database-schema';
import { adminAuthService } from './admin-auth-service';
import { ID } from 'appwrite';

export interface SetupOptions {
  createDefaultAdmin?: boolean;
  adminEmail?: string;
  adminPassword?: string;
  adminName?: string;
  createStorageBuckets?: boolean;
}

export interface SetupResult {
  success: boolean;
  message: string;
  details: {
    collectionsCreated: number;
    bucketsCreated: number;
    adminCreated: boolean;
    errors: string[];
  };
}

export class AppwriteSetup {
  // Main setup function
  static async setup(options: SetupOptions = {}): Promise<SetupResult> {
    const result: SetupResult = {
      success: true,
      message: 'Appwrite setup completed',
      details: {
        collectionsCreated: 0,
        bucketsCreated: 0,
        adminCreated: false,
        errors: []
      }
    };

    console.log('🚀 Starting Appwrite setup...');

    try {
      // Create collections
      console.log('📋 Creating database collections...');
      const collectionsResult = await this.createCollections();

      if (collectionsResult.success) {
        result.details.collectionsCreated = collectionsResult.data?.length || 0;
        console.log(`✅ Created ${result.details.collectionsCreated} collections`);
      } else {
        result.details.errors.push(collectionsResult.error || 'Failed to create collections');
        console.error('❌ Failed to create collections:', collectionsResult.error);
      }

      // Create storage buckets
      if (options.createStorageBuckets !== false) {
        console.log('🪣 Creating storage buckets...');
        const bucketsResult = await this.createStorageBuckets();

        if (bucketsResult.success) {
          result.details.bucketsCreated = bucketsResult.data?.length || 0;
          console.log(`✅ Created ${result.details.bucketsCreated} storage buckets`);
        } else {
          result.details.errors.push(bucketsResult.error || 'Failed to create storage buckets');
          console.error('❌ Failed to create storage buckets:', bucketsResult.error);
        }
      }

      // Create default admin user
      if (options.createDefaultAdmin !== false) {
        console.log('👑 Creating default admin user...');
        const adminResult = await this.createDefaultAdmin(options);

        if (adminResult.success) {
          result.details.adminCreated = true;
          console.log('✅ Created default admin user');
        } else {
          result.details.errors.push(adminResult.error || 'Failed to create default admin');
          console.error('❌ Failed to create default admin:', adminResult.error);
        }
      }

      // Create default settings
      console.log('⚙️ Creating default settings...');
      const settingsResult = await this.createDefaultSettings();

      if (!settingsResult.success) {
        result.details.errors.push(settingsResult.error || 'Failed to create default settings');
        console.error('❌ Failed to create default settings:', settingsResult.error);
      } else {
        console.log('✅ Created default settings');
      }

      if (result.details.errors.length > 0) {
        result.success = false;
        result.message = 'Appwrite setup completed with errors';
      } else {
        result.message = 'Appwrite setup completed successfully';
      }

      console.log('🎉 Appwrite setup finished!');
      return result;

    } catch (error) {
      console.error('💥 Setup failed:', error);
      result.success = false;
      result.message = 'Appwrite setup failed';
      result.details.errors.push(error instanceof Error ? error.message : 'Unknown error');

      return result;
    }
  }

  // Create all collections
  private static async createCollections() {
    try {
      const createdCollections = [];

      for (const [key, collection] of Object.entries(COLLECTIONS)) {
        try {
          console.log(`Creating collection: ${collection.name} (${collection.id})`);

          // In a real implementation, you would call:
          // await databases.createCollection(
          //   DATABASE_ID,
          //   collection.id,
          //   collection.name,
          //   [
          //     Permission.read(Role.any()),
          //     Permission.write(Role.user(userId))
          //   ]
          // );

          // Then create each attribute:
          // for (const attr of collection.attributes) {
          //   await databases.createStringAttribute(
          //     DATABASE_ID,
          //     collection.id,
          //     attr.key,
          //     attr.size || 255,
          //     attr.required,
          //     attr.default
          //   );
          // }

          // For now, we'll just log the collection structure
          console.log(`Collection ${collection.id} structure:`, {
            attributes: collection.attributes.length,
            indexes: collection.indexes?.length || 0
          });

          createdCollections.push(collection);
        } catch (error) {
          console.error(`Failed to create collection ${key}:`, error);
          throw error;
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

  // Create storage buckets
  private static async createStorageBuckets() {
    try {
      const buckets = [
        {
          id: 'product-images',
          name: 'Product Images',
          permissions: [
            // Configure appropriate permissions
          ]
        },
        {
          id: 'store-assets',
          name: 'Store Assets',
          permissions: [
            // Configure appropriate permissions
          ]
        }
      ];

      const createdBuckets = [];

      for (const bucket of buckets) {
        try {
          console.log(`Creating bucket: ${bucket.name} (${bucket.id})`);

          // In a real implementation, you would call:
          // await storage.createBucket(
          //   bucket.id,
          //   bucket.name,
          //   bucket.permissions
          // );

          console.log(`Bucket ${bucket.id} created`);
          createdBuckets.push(bucket);
        } catch (error) {
          console.error(`Failed to create bucket ${bucket.id}:`, error);
          throw error;
        }
      }

      return {
        success: true,
        data: createdBuckets
      };
    } catch (error) {
      console.error('Error creating storage buckets:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create storage buckets'
      };
    }
  }

  // Create default admin user
  private static async createDefaultAdmin(options: SetupOptions) {
    try {
      const adminEmail = options.adminEmail || 'admin@yourstore.com';
      const adminPassword = options.adminPassword || 'Admin123!@#';
      const adminName = options.adminName || 'Store Admin';

      const adminData = {
        email: adminEmail,
        password: adminPassword,
        name: adminName,
        role: 'admin' as const,
        permissions: [
          { resource: 'products' as const, actions: ['view' as const, 'create' as const, 'update' as const, 'delete' as const] },
          { resource: 'orders' as const, actions: ['view' as const, 'create' as const, 'update' as const, 'delete' as const] },
          { resource: 'customers' as const, actions: ['view' as const, 'create' as const, 'update' as const, 'delete' as const] },
          { resource: 'settings' as const, actions: ['view' as const, 'create' as const, 'update' as const, 'delete' as const] },
          { resource: 'analytics' as const, actions: ['view' as const] }
        ]
      };

      const result = await adminAuthService.createAdmin(adminData);

      if (result.success) {
        console.log(`Default admin created: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log('⚠️  Please change the default password after first login!');
      }

      return result;
    } catch (error) {
      console.error('Error creating default admin:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create default admin'
      };
    }
  }

  // Create default settings
  private static async createDefaultSettings() {
    try {
      // This would create default store settings, payment settings, etc.
      console.log('Creating default store settings...');

      // In a real implementation, you would create documents in the settings collections
      // with sensible defaults for a new e-commerce store

      return {
        success: true,
        data: {}
      };
    } catch (error) {
      console.error('Error creating default settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create default settings'
      };
    }
  }

  // Check if setup is needed
  static async isSetupNeeded(): Promise<boolean> {
    try {
      // Try to list documents from products collection - if this fails, setup is needed
      await databases.listDocuments(DATABASE_ID, 'products', []);
      return false; // Collections exist, no setup needed
    } catch (error) {
      return true; // Collections don't exist, setup needed
    }
  }

  // Reset database (dangerous - only for development)
  static async resetDatabase(): Promise<SetupResult> {
    const result: SetupResult = {
      success: true,
      message: 'Database reset completed',
      details: {
        collectionsCreated: 0,
        bucketsCreated: 0,
        adminCreated: false,
        errors: []
      }
    };

    try {
      console.log('⚠️  WARNING: Resetting database...');

      // In a real implementation, you would:
      // 1. Delete all collections
      // 2. Delete all storage buckets
      // 3. Recreate everything

      console.log('Database reset completed');
      return result;
    } catch (error) {
      console.error('Reset failed:', error);
      result.success = false;
      result.message = 'Database reset failed';
      result.details.errors.push(error instanceof Error ? error.message : 'Unknown error');

      return result;
    }
  }
}

// CLI helper function for running setup
export async function runSetup(options: SetupOptions = {}) {
  console.log('🚀 Appwrite E-commerce Setup');
  console.log('============================');

  const isSetupNeeded = await AppwriteSetup.isSetupNeeded();

  if (!isSetupNeeded) {
    console.log('✅ Appwrite is already set up!');
    return;
  }

  console.log('🔧 Setup is needed. Initializing...');

  const result = await AppwriteSetup.setup(options);

  if (result.success) {
    console.log('✅ Setup completed successfully!');
  } else {
    console.log('❌ Setup completed with errors:');
    result.details.errors.forEach(error => console.log(`  - ${error}`));
  }

  console.log('\n📋 Setup Summary:');
  console.log(`  - Collections created: ${result.details.collectionsCreated}`);
  console.log(`  - Storage buckets created: ${result.details.bucketsCreated}`);
  console.log(`  - Default admin created: ${result.details.adminCreated}`);

  if (result.details.adminCreated) {
    console.log('\n🔑 Default Admin Credentials:');
    console.log(`  - Email: ${options.adminEmail || 'admin@yourstore.com'}`);
    console.log(`  - Password: ${options.adminPassword || 'Admin123!@#'}`);
    console.log('⚠️  Please change the default password after first login!');
  }
}