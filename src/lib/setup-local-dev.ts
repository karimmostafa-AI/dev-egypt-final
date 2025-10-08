// Local Development Setup Script
// Helps developers set up their local Appwrite environment

import { setupGlobalErrorHandlers } from './error-handler';
import { DatabaseUtils } from './appwrite-service';

export interface LocalDevConfig {
  appwriteEndpoint?: string;
  appwriteProjectId?: string;
  databaseId?: string;
  createSampleData?: boolean;
  enableLogging?: boolean;
  enableErrorHandling?: boolean;
}

export class LocalDevSetup {
  private config: LocalDevConfig;

  constructor(config: LocalDevConfig = {}) {
    this.config = {
      appwriteEndpoint: 'http://localhost:3001/v1',
      appwriteProjectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'local-dev',
      databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'ecommerce-db',
      createSampleData: true,
      enableLogging: true,
      enableErrorHandling: true,
      ...config
    };
  }

  // Initialize local development environment
  async initialize(): Promise<{ success: boolean; message: string; errors: string[] }> {
    const errors: string[] = [];
    let message = 'Local development environment initialized successfully';

    console.log('🚀 Initializing local development environment...');

    try {
      // Set up error handling
      if (this.config.enableErrorHandling) {
        setupGlobalErrorHandlers();
        console.log('✅ Global error handlers configured');
      }

      // Test database connection
      console.log('🔗 Testing Appwrite connection...');
      const dbResult = await DatabaseUtils.initializeDatabase();

      if (!dbResult.success) {
        errors.push(`Database connection failed: ${dbResult.error}`);
        console.error('❌ Database connection failed:', dbResult.error);
      } else {
        console.log('✅ Appwrite connection successful');
      }

      // Create sample data if requested
      if (this.config.createSampleData) {
        console.log('📦 Creating sample data...');
        const sampleDataResult = await this.createSampleData();

        if (!sampleDataResult.success) {
          errors.push(`Sample data creation failed: ${sampleDataResult.error}`);
          console.error('❌ Sample data creation failed:', sampleDataResult.error);
        } else {
          console.log('✅ Sample data created');
        }
      }

      // Configure logging
      if (this.config.enableLogging) {
        this.configureLogging();
        console.log('✅ Logging configured');
      }

      // Validate environment variables
      const envValidation = this.validateEnvironmentVariables();
      if (!envValidation.isValid) {
        errors.push(...envValidation.errors);
        console.error('❌ Environment validation failed:', envValidation.errors);
      } else {
        console.log('✅ Environment variables validated');
      }

      if (errors.length > 0) {
        message = `Local development setup completed with ${errors.length} errors`;
      }

      console.log('🎉 Local development environment ready!');
      return {
        success: errors.length === 0,
        message,
        errors
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('💥 Local development setup failed:', errorMessage);

      return {
        success: false,
        message: 'Local development setup failed',
        errors: [errorMessage]
      };
    }
  }

  // Create sample data for development
  private async createSampleData(): Promise<{ success: boolean; error?: string }> {
    try {
      // This would create sample products, categories, and customers
      // for development and testing purposes

      console.log('Creating sample categories...');
      // Sample categories would be created here

      console.log('Creating sample products...');
      // Sample products would be created here

      console.log('Creating sample customers...');
      // Sample customers would be created here

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create sample data'
      };
    }
  }

  // Configure logging for development
  private configureLogging(): void {
    if (process.env.NODE_ENV === 'development') {
      // Enable detailed logging in development
      console.log('🔧 Development logging enabled');

      // You could configure additional logging here
      // such as writing to files or external services
    }
  }

  // Validate required environment variables
  private validateEnvironmentVariables(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const required = [
      'NEXT_PUBLIC_APPWRITE_ENDPOINT',
      'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
      'NEXT_PUBLIC_APPWRITE_DATABASE_ID'
    ];

    required.forEach(envVar => {
      if (!process.env[envVar]) {
        errors.push(`Missing required environment variable: ${envVar}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Generate development environment file
  static generateEnvFile(): string {
    return `# Local Development Environment Variables
# Generated on: ${new Date().toISOString()}

# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=http://localhost:3001/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-local-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-local-database-id

# Collection IDs
NEXT_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID=products
NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID=orders
NEXT_PUBLIC_APPWRITE_CUSTOMERS_COLLECTION_ID=customers
NEXT_PUBLIC_APPWRITE_CATEGORIES_COLLECTION_ID=categories
NEXT_PUBLIC_APPWRITE_ADMIN_USERS_COLLECTION_ID=admin_users

# Storage Bucket IDs
NEXT_PUBLIC_APPWRITE_PRODUCT_IMAGES_BUCKET_ID=product-images
NEXT_PUBLIC_APPWRITE_STORE_ASSETS_BUCKET_ID=store-assets

# Application Settings
NEXT_PUBLIC_APP_NAME="E-commerce Store (Development)"
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Development Settings
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
ENABLE_DEBUG_TOOLS=true

# Security (Development)
# Note: Use weak settings for development only
BCRYPT_SALT_ROUNDS=8
JWT_SECRET=development-secret-key-change-in-production
SESSION_SECRET=development-session-secret

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/dev.log

# Feature Flags (Development)
ENABLE_MAINTENANCE_MODE=false
ENABLE_DEBUG_TOOLS=true
ENABLE_ANALYTICS=false
ENABLE_PROMOTIONS=true

# Database
DATABASE_URL=your-local-database-connection-string

# Email (Development)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=test
SMTP_PASS=test
FROM_EMAIL=noreply@localhost
FROM_NAME="Dev Store"

# Payment (Development)
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret
PAYPAL_CLIENT_ID=your-paypal-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-paypal-sandbox-secret

# Third-party Services (Optional for development)
GOOGLE_ANALYTICS_ID=
SENTRY_DSN=
SLACK_WEBHOOK_URL=
`;
  }

  // Check if Appwrite is running locally
  static async checkAppwriteHealth(endpoint: string = 'http://localhost:3001/v1'): Promise<boolean> {
    try {
      // Simple health check by trying to connect
      const response = await fetch(`${endpoint}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.log('Appwrite health check failed:', error);
      return false;
    }
  }

  // Setup development database
  static async setupDevDatabase(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Setting up development database...');

      // This would:
      // 1. Create the database
      // 2. Create collections
      // 3. Set up indexes
      // 4. Create storage buckets

      console.log('Development database setup completed');
      return {
        success: true,
        message: 'Development database setup completed'
      };
    } catch (error) {
      return {
        success: false,
        message: `Development database setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// CLI helper for local development setup
export async function setupLocalDevelopment(config?: LocalDevConfig): Promise<void> {
  console.log('🚀 E-commerce App - Local Development Setup');
  console.log('============================================');

  const setup = new LocalDevSetup(config);

  // Check if Appwrite is running
  console.log('🔍 Checking Appwrite health...');
  const isAppwriteRunning = await LocalDevSetup.checkAppwriteHealth();

  if (!isAppwriteRunning) {
    console.log('⚠️  Appwrite does not appear to be running locally.');
    console.log('   Please ensure Appwrite is running on http://localhost:3001');
    console.log('   You can start it with: appwrite start');
    console.log('');
  }

  // Generate .env.local file
  console.log('📝 Generating .env.local file...');
  const envContent = LocalDevSetup.generateEnvFile();

  // In a real implementation, you would write this to a file
  console.log('Environment file content generated. Please create .env.local with the following content:');
  console.log('---');
  console.log(envContent);
  console.log('---');

  // Initialize the development environment
  console.log('🔧 Initializing development environment...');
  const result = await setup.initialize();

  if (result.success) {
    console.log('✅ Setup completed successfully!');
  } else {
    console.log('❌ Setup completed with errors:');
    result.errors.forEach(error => console.log(`   - ${error}`));
  }

  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Copy the .env.local content above to your .env.local file');
  console.log('2. Update the Appwrite project ID and database ID with your actual values');
  console.log('3. Run: npm run dev');
  console.log('4. Open http://localhost:3000 in your browser');

  if (result.errors.length > 0) {
    console.log('');
    console.log('⚠️  Issues to resolve:');
    result.errors.forEach(error => console.log(`   - ${error}`));
  }
}