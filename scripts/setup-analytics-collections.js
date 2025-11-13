/**
 * Setup Analytics Collections in Appwrite
 * 
 * Run this script to create the required analytics collections
 * Usage: node scripts/setup-analytics-collections.js
 */

const { Client, Databases, ID } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

async function createLiveVisitorsCollection() {
  console.log('📊 Creating Live Visitors collection...');
  
  try {
    const collection = await databases.createCollection(
      DATABASE_ID,
      ID.unique(),
      'live_visitors',
      [],
      false
    );

    const collectionId = collection.$id;
    console.log(`✅ Collection created with ID: ${collectionId}`);
    
    // Create attributes
    const attributes = [
      { key: 'visitor_id', type: 'string', size: 255, required: true },
      { key: 'user_id', type: 'string', size: 255, required: false },
      { key: 'session_id', type: 'string', size: 255, required: true },
      { key: 'current_page', type: 'string', size: 500, required: true },
      { key: 'device_type', type: 'string', size: 50, required: false },
      { key: 'browser', type: 'string', size: 100, required: false },
      { key: 'os', type: 'string', size: 100, required: false },
      { key: 'country', type: 'string', size: 100, required: false },
      { key: 'city', type: 'string', size: 100, required: false },
      { key: 'ip_address', type: 'string', size: 100, required: false },
      { key: 'referrer', type: 'string', size: 500, required: false },
      { key: 'screen_resolution', type: 'string', size: 50, required: false },
      { key: 'entered_at', type: 'datetime', required: false },
      { key: 'last_seen_at', type: 'datetime', required: true },
    ];

    for (const attr of attributes) {
      try {
        if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.required
          );
        } else {
          await databases.createStringAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.size,
            attr.required
          );
        }
        console.log(`  ✓ Created attribute: ${attr.key}`);
      } catch (error) {
        console.error(`  ✗ Error creating attribute ${attr.key}:`, error.message);
      }
    }

    // Create indexes for better query performance
    console.log('📑 Creating indexes...');
    try {
      await databases.createIndex(
        DATABASE_ID,
        collectionId,
        'visitor_id_idx',
        'key',
        ['visitor_id']
      );
      console.log('  ✓ Created visitor_id index');
    } catch (error) {
      console.error('  ✗ Error creating index:', error.message);
    }

    return collectionId;
  } catch (error) {
    console.error('❌ Error creating Live Visitors collection:', error.message);
    throw error;
  }
}

async function createSessionTrackingCollection() {
  console.log('\n📊 Creating Session Tracking collection...');
  
  try {
    const collection = await databases.createCollection(
      DATABASE_ID,
      ID.unique(),
      'session_tracking',
      [],
      false
    );

    const collectionId = collection.$id;
    console.log(`✅ Collection created with ID: ${collectionId}`);
    
    // Create attributes
    const attributes = [
      { key: 'session_id', type: 'string', size: 255, required: true },
      { key: 'visitor_id', type: 'string', size: 255, required: true },
      { key: 'user_id', type: 'string', size: 255, required: false },
      { key: 'ip_address', type: 'string', size: 100, required: false },
      { key: 'country', type: 'string', size: 100, required: false },
      { key: 'city', type: 'string', size: 100, required: false },
      { key: 'device_type', type: 'string', size: 50, required: false },
      { key: 'browser', type: 'string', size: 100, required: false },
      { key: 'os', type: 'string', size: 100, required: false },
      { key: 'referrer_url', type: 'string', size: 500, required: false },
      { key: 'landing_page', type: 'string', size: 500, required: false },
      { key: 'utm_source', type: 'string', size: 100, required: false },
      { key: 'utm_medium', type: 'string', size: 100, required: false },
      { key: 'utm_campaign', type: 'string', size: 100, required: false },
      { key: 'start_time', type: 'datetime', required: false },
      { key: 'end_time', type: 'datetime', required: false },
      { key: 'last_activity', type: 'datetime', required: false },
      { key: 'pages_visited', type: 'integer', required: false },
      { key: 'session_duration', type: 'integer', required: false },
      { key: 'converted', type: 'boolean', required: false },
      { key: 'order_id', type: 'string', size: 255, required: false },
    ];

    for (const attr of attributes) {
      try {
        if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.required
          );
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.required
          );
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.required
          );
        } else {
          await databases.createStringAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.size,
            attr.required
          );
        }
        console.log(`  ✓ Created attribute: ${attr.key}`);
      } catch (error) {
        console.error(`  ✗ Error creating attribute ${attr.key}:`, error.message);
      }
    }

    // Create indexes
    console.log('📑 Creating indexes...');
    try {
      await databases.createIndex(
        DATABASE_ID,
        collectionId,
        'session_id_idx',
        'key',
        ['session_id']
      );
      console.log('  ✓ Created session_id index');
    } catch (error) {
      console.error('  ✗ Error creating index:', error.message);
    }

    return collectionId;
  } catch (error) {
    console.error('❌ Error creating Session Tracking collection:', error.message);
    throw error;
  }
}

async function createEventsLogCollection() {
  console.log('\n📊 Creating Events Log collection...');
  
  try {
    const collection = await databases.createCollection(
      DATABASE_ID,
      ID.unique(),
      'events_log',
      [],
      false
    );

    const collectionId = collection.$id;
    console.log(`✅ Collection created with ID: ${collectionId}`);
    
    // Create attributes
    const attributes = [
      { key: 'event_type', type: 'string', size: 100, required: true },
      { key: 'user_id', type: 'string', size: 255, required: false },
      { key: 'session_id', type: 'string', size: 255, required: false },
      { key: 'visitor_id', type: 'string', size: 255, required: false },
      { key: 'product_id', type: 'string', size: 255, required: false },
      { key: 'category_id', type: 'string', size: 255, required: false },
      { key: 'brand_id', type: 'string', size: 255, required: false },
      { key: 'order_id', type: 'string', size: 255, required: false },
      { key: 'value', type: 'float', required: false },
      { key: 'metadata', type: 'string', size: 10000, required: false },
      { key: 'page_url', type: 'string', size: 500, required: false },
      { key: 'timestamp', type: 'datetime', required: false },
    ];

    for (const attr of attributes) {
      try {
        if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.required
          );
        } else if (attr.type === 'float') {
          await databases.createFloatAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.required
          );
        } else {
          await databases.createStringAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.size,
            attr.required
          );
        }
        console.log(`  ✓ Created attribute: ${attr.key}`);
      } catch (error) {
        console.error(`  ✗ Error creating attribute ${attr.key}:`, error.message);
      }
    }

    return collectionId;
  } catch (error) {
    console.error('❌ Error creating Events Log collection:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Setting up Analytics Collections in Appwrite\n');
  console.log('Database ID:', DATABASE_ID);
  console.log('Endpoint:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
  console.log('Project ID:', process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
  console.log('');

  try {
    const liveVisitorsId = await createLiveVisitorsCollection();
    console.log('\n⏳ Waiting for collection to be ready...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const sessionTrackingId = await createSessionTrackingCollection();
    console.log('\n⏳ Waiting for collection to be ready...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const eventsLogId = await createEventsLogCollection();

    console.log('\n\n✅ All collections created successfully!\n');
    console.log('📝 Update these collection IDs in your code:\n');
    console.log(`LIVE_VISITORS_COLLECTION_ID = '${liveVisitorsId}'`);
    console.log(`SESSION_TRACKING_COLLECTION_ID = '${sessionTrackingId}'`);
    console.log(`EVENTS_LOG_COLLECTION_ID = '${eventsLogId}'`);
    console.log('\n💡 Update these in:');
    console.log('  - src/lib/analytics-helpers.ts');
    console.log('  - src/app/api/analytics/live-visitor/route.ts');
    console.log('  - src/app/api/analytics/live-visitors/route.ts');
    console.log('  - src/app/api/analytics/track/route.ts');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
