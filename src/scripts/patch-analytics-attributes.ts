import { Client, Databases } from 'node-appwrite'

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

// Fix: Add missing attributes with correct constraints (required: false for attributes with defaults)
async function patchAnalyticsAttributes() {
  console.log('🔧 Patching Analytics Collections\n')

  // Collection ID to attributes mapping
  const patches = {
    product_analytics: [
      { key: 'views', type: 'integer', default: 0 },
      { key: 'add_to_cart', type: 'integer', default: 0 },
      { key: 'purchases', type: 'integer', default: 0 },
      { key: 'returns', type: 'integer', default: 0 },
      { key: 'revenue', type: 'float', default: 0 },
      { key: 'discounted_sales', type: 'integer', default: 0 },
      { key: 'average_price', type: 'float', default: 0 },
      { key: 'conversion_rate', type: 'float', default: 0 },
      { key: 'wishlist_adds', type: 'integer', default: 0 },
    ],
    session_tracking: [
      { key: 'pages_viewed', type: 'integer', default: 0 },
      { key: 'time_on_site', type: 'float', default: 0 },
      { key: 'converted', type: 'boolean', default: false },
    ],
    customer_feedback: [
      { key: 'status', type: 'string', default: 'pending', size: 50 },
      { key: 'helpful_count', type: 'integer', default: 0 },
      { key: 'verified_purchase', type: 'boolean', default: false },
    ],
    financial_analytics: [
      { key: 'gross_revenue', type: 'float', default: 0 },
      { key: 'net_revenue', type: 'float', default: 0 },
      { key: 'total_orders', type: 'integer', default: 0 },
      { key: 'refunds', type: 'float', default: 0 },
      { key: 'cost_of_goods_sold', type: 'float', default: 0 },
      { key: 'operational_expense', type: 'float', default: 0 },
      { key: 'net_profit', type: 'float', default: 0 },
      { key: 'profit_margin', type: 'float', default: 0 },
      { key: 'average_order_value', type: 'float', default: 0 },
      { key: 'tax_collected', type: 'float', default: 0 },
      { key: 'shipping_collected', type: 'float', default: 0 },
      { key: 'discounts_given', type: 'float', default: 0 },
    ],
    traffic_sources: [
      { key: 'clicks', type: 'integer', default: 0 },
      { key: 'sessions', type: 'integer', default: 0 },
      { key: 'conversions', type: 'integer', default: 0 },
      { key: 'revenue', type: 'float', default: 0 },
      { key: 'bounce_rate', type: 'float', default: 0 },
      { key: 'avg_session_duration', type: 'float', default: 0 },
    ],
    category_analytics: [
      { key: 'views', type: 'integer', default: 0 },
      { key: 'orders', type: 'integer', default: 0 },
      { key: 'revenue', type: 'float', default: 0 },
      { key: 'units_sold', type: 'integer', default: 0 },
      { key: 'conversion_rate', type: 'float', default: 0 },
    ],
    brand_analytics: [
      { key: 'views', type: 'integer', default: 0 },
      { key: 'orders', type: 'integer', default: 0 },
      { key: 'revenue', type: 'float', default: 0 },
      { key: 'units_sold', type: 'integer', default: 0 },
      { key: 'conversion_rate', type: 'float', default: 0 },
      { key: 'return_rate', type: 'float', default: 0 },
    ],
  }

  let totalAdded = 0
  let totalSkipped = 0

  for (const [collectionId, attributes] of Object.entries(patches)) {
    console.log(`\n📦 Patching ${collectionId}...`)

    for (const attr of attributes) {
      try {
        if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            APPWRITE_DATABASE_ID,
            collectionId,
            attr.key,
            false, // required = false
            undefined,
            undefined,
            attr.default
          )
        } else if (attr.type === 'float') {
          await databases.createFloatAttribute(
            APPWRITE_DATABASE_ID,
            collectionId,
            attr.key,
            false,
            undefined,
            undefined,
            attr.default
          )
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            APPWRITE_DATABASE_ID,
            collectionId,
            attr.key,
            false,
            attr.default
          )
        } else if (attr.type === 'string') {
          await databases.createStringAttribute(
            APPWRITE_DATABASE_ID,
            collectionId,
            attr.key,
            (attr as any).size || 255,
            false,
            attr.default
          )
        }

        console.log(`  ✓ Added ${attr.key}`)
        totalAdded++
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error: any) {
        if (error.code === 409) {
          console.log(`  ⚠️  ${attr.key} already exists`)
          totalSkipped++
        } else {
          console.error(`  ✗ Failed to add ${attr.key}:`, error.message)
        }
      }
    }
  }

  // Add missing indexes
  console.log('\n\n📑 Adding missing indexes...')

  const indexes = [
    { collection: 'session_tracking', key: 'converted_idx', type: 'key' as const, attributes: ['converted'] },
    { collection: 'customer_feedback', key: 'status_idx', type: 'key' as const, attributes: ['status'] },
  ]

  for (const index of indexes) {
    try {
      await databases.createIndex(
        APPWRITE_DATABASE_ID,
        index.collection,
        index.key,
        index.type,
        index.attributes
      )
      console.log(`  ✓ Index ${index.key} created on ${index.collection}`)
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (error: any) {
      if (error.code === 409) {
        console.log(`  ⚠️  Index ${index.key} already exists`)
      } else {
        console.error(`  ✗ Failed to create index ${index.key}:`, error.message)
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Patch Summary')
  console.log('='.repeat(60))
  console.log(`✅ Added: ${totalAdded} attributes`)
  console.log(`⚠️  Skipped: ${totalSkipped} attributes (already exist)`)
  console.log('='.repeat(60))
  console.log('\n✨ Patching completed!\n')
}

// Run patch
patchAnalyticsAttributes()
  .then(() => {
    console.log('✅ Patch script finished successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Patch script failed:', error)
    process.exit(1)
  })
