import { config } from 'dotenv'
import { Client, Databases, ID } from 'node-appwrite'
import { ANALYTICS_COLLECTIONS, AnalyticsCollectionDefinition } from '../lib/analytics-schema'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Configuration
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1'
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || ''
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || ''

// Initialize Appwrite Client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY)

const databases = new Databases(client)

// Helper function to map attribute types
function getAppwriteAttributeType(type: string): string {
  const typeMap: Record<string, string> = {
    'string': 'string',
    'integer': 'integer',
    'float': 'float',
    'boolean': 'boolean',
    'email': 'email',
    'url': 'url',
    'datetime': 'datetime',
  }
  return typeMap[type] || 'string'
}

// Create a single collection
async function createCollection(collectionDef: AnalyticsCollectionDefinition) {
  const { id, name, attributes, indexes } = collectionDef

  try {
    console.log(`\n📦 Creating collection: ${name} (${id})`)
    
    // Create the collection
    await databases.createCollection(
      APPWRITE_DATABASE_ID,
      id,
      name
    )
    
    console.log(`✅ Collection created: ${name}`)

    // Add attributes
    for (const attr of attributes) {
      try {
        const attrType = getAppwriteAttributeType(attr.type)
        
        console.log(`  Adding attribute: ${attr.key} (${attrType})`)

        switch (attrType) {
          case 'string':
          case 'email':
          case 'url':
            await databases.createStringAttribute(
              APPWRITE_DATABASE_ID,
              id,
              attr.key,
              attr.size || 255,
              attr.required,
              attr.default,
              attr.array
            )
            break

          case 'integer':
            await databases.createIntegerAttribute(
              APPWRITE_DATABASE_ID,
              id,
              attr.key,
              attr.required,
              undefined,
              undefined,
              attr.default
            )
            break

          case 'float':
            await databases.createFloatAttribute(
              APPWRITE_DATABASE_ID,
              id,
              attr.key,
              attr.required,
              undefined,
              undefined,
              attr.default
            )
            break

          case 'boolean':
            await databases.createBooleanAttribute(
              APPWRITE_DATABASE_ID,
              id,
              attr.key,
              attr.required,
              attr.default
            )
            break

          case 'datetime':
            await databases.createDatetimeAttribute(
              APPWRITE_DATABASE_ID,
              id,
              attr.key,
              attr.required,
              attr.default
            )
            break
        }

        console.log(`    ✓ ${attr.key} added`)
        
        // Wait a bit to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error: any) {
        console.error(`    ✗ Failed to add attribute ${attr.key}:`, error.message)
      }
    }

    // Add indexes
    if (indexes && indexes.length > 0) {
      console.log(`\n  Adding indexes...`)
      
      for (const index of indexes) {
        try {
          await databases.createIndex(
            APPWRITE_DATABASE_ID,
            id,
            index.key,
            index.type,
            index.attributes
          )
          console.log(`    ✓ Index ${index.key} created`)
          
          // Wait to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300))
        } catch (error: any) {
          console.error(`    ✗ Failed to create index ${index.key}:`, error.message)
        }
      }
    }

    console.log(`\n✅ Successfully created collection: ${name}\n`)
    return true
  } catch (error: any) {
    if (error.code === 409) {
      console.log(`⚠️  Collection ${name} already exists, skipping...`)
      return false
    }
    console.error(`❌ Failed to create collection ${name}:`, error.message)
    return false
  }
}

// Update existing collections with analytics fields
async function updateExistingCollections() {
  console.log('\n🔄 Updating existing collections with analytics fields...\n')

  // Update products collection
  try {
    console.log('📦 Updating products collection...')
    
    const productsUpdates = [
      { key: 'views_count', type: 'integer', required: false, default: 0 },
      { key: 'total_sales', type: 'integer', required: false, default: 0 },
      { key: 'total_revenue', type: 'float', required: false, default: 0 },
      { key: 'average_rating', type: 'float', required: false, default: 0 },
      { key: 'reviews_count', type: 'integer', required: false, default: 0 },
      { key: 'last_purchased_at', type: 'datetime', required: false },
    ]

    for (const attr of productsUpdates) {
      try {
        if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            APPWRITE_DATABASE_ID,
            'products',
            attr.key,
            attr.required || false,
            undefined,
            undefined,
            attr.default
          )
        } else if (attr.type === 'float') {
          await databases.createFloatAttribute(
            APPWRITE_DATABASE_ID,
            'products',
            attr.key,
            attr.required || false,
            undefined,
            undefined,
            attr.default
          )
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            APPWRITE_DATABASE_ID,
            'products',
            attr.key,
            attr.required || false
          )
        }
        console.log(`  ✓ Added ${attr.key} to products`)
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error: any) {
        if (error.code === 409) {
          console.log(`  ⚠️  ${attr.key} already exists in products`)
        } else {
          console.error(`  ✗ Failed to add ${attr.key}:`, error.message)
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Failed to update products collection:', error.message)
  }

  // Update orders collection
  try {
    console.log('\n📦 Updating orders collection...')
    
    const ordersUpdates = [
      { key: 'device_type', type: 'string', required: false, size: 50 },
      { key: 'source', type: 'string', required: false, size: 100 },
      { key: 'referrer', type: 'string', required: false, size: 500 },
      { key: 'session_id', type: 'string', required: false, size: 100 },
      { key: 'utm_source', type: 'string', required: false, size: 100 },
      { key: 'utm_medium', type: 'string', required: false, size: 100 },
      { key: 'utm_campaign', type: 'string', required: false, size: 100 },
    ]

    for (const attr of ordersUpdates) {
      try {
        await databases.createStringAttribute(
          APPWRITE_DATABASE_ID,
          'orders',
          attr.key,
          attr.size || 255,
          attr.required || false
        )
        console.log(`  ✓ Added ${attr.key} to orders`)
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error: any) {
        if (error.code === 409) {
          console.log(`  ⚠️  ${attr.key} already exists in orders`)
        } else {
          console.error(`  ✗ Failed to add ${attr.key}:`, error.message)
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Failed to update orders collection:', error.message)
  }

  // Update customers collection if it exists
  try {
    console.log('\n📦 Updating customers collection...')
    
    const customersUpdates = [
      { key: 'country', type: 'string', required: false, size: 100 },
      { key: 'city', type: 'string', required: false, size: 100 },
      { key: 'device', type: 'string', required: false, size: 100 },
      { key: 'browser', type: 'string', required: false, size: 100 },
      { key: 'os', type: 'string', required: false, size: 100 },
      { key: 'last_active', type: 'datetime', required: false },
      { key: 'lifetime_value', type: 'float', required: false, default: 0 },
      { key: 'loyalty_points', type: 'integer', required: false, default: 0 },
      { key: 'referral_source', type: 'string', required: false, size: 100 },
    ]

    for (const attr of customersUpdates) {
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            APPWRITE_DATABASE_ID,
            'customers',
            attr.key,
            attr.size || 255,
            attr.required || false
          )
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            APPWRITE_DATABASE_ID,
            'customers',
            attr.key,
            attr.required || false,
            undefined,
            undefined,
            attr.default
          )
        } else if (attr.type === 'float') {
          await databases.createFloatAttribute(
            APPWRITE_DATABASE_ID,
            'customers',
            attr.key,
            attr.required || false,
            undefined,
            undefined,
            attr.default
          )
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            APPWRITE_DATABASE_ID,
            'customers',
            attr.key,
            attr.required || false
          )
        }
        console.log(`  ✓ Added ${attr.key} to customers`)
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error: any) {
        if (error.code === 409) {
          console.log(`  ⚠️  ${attr.key} already exists in customers`)
        } else {
          console.error(`  ✗ Failed to add ${attr.key}:`, error.message)
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Failed to update customers collection:', error.message)
  }

  console.log('\n✅ Finished updating existing collections\n')
}

// Main migration function
async function migrateAnalyticsCollections() {
  console.log('🚀 Starting Analytics Collections Migration\n')
  console.log(`📍 Endpoint: ${APPWRITE_ENDPOINT}`)
  console.log(`📍 Project: ${APPWRITE_PROJECT_ID}`)
  console.log(`📍 Database: ${APPWRITE_DATABASE_ID}\n`)

  if (!APPWRITE_API_KEY) {
    console.error('❌ APPWRITE_API_KEY is not set in environment variables')
    process.exit(1)
  }

  let successCount = 0
  let skipCount = 0
  let failCount = 0

  // Create all analytics collections
  for (const [key, collection] of Object.entries(ANALYTICS_COLLECTIONS)) {
    const result = await createCollection(collection)
    if (result === true) successCount++
    else if (result === false) skipCount++
    else failCount++
    
    // Wait between collections to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // Update existing collections
  await updateExistingCollections()

  console.log('\n' + '='.repeat(60))
  console.log('📊 Migration Summary')
  console.log('='.repeat(60))
  console.log(`✅ Created: ${successCount} collections`)
  console.log(`⚠️  Skipped: ${skipCount} collections (already exist)`)
  console.log(`❌ Failed: ${failCount} collections`)
  console.log('='.repeat(60))
  console.log('\n✨ Analytics migration completed!\n')
}

// Run migration
migrateAnalyticsCollections()
  .then(() => {
    console.log('✅ Migration script finished successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error)
    process.exit(1)
  })
