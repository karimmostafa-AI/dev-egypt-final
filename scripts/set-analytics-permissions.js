/**
 * Set Analytics Collection Permissions
 * 
 * This grants read/write access to the analytics collections
 * Usage: node scripts/set-analytics-permissions.js
 */

const { Client, Databases, Permission, Role } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

// Collection IDs from the setup script
const LIVE_VISITORS_COLLECTION_ID = '69153bd5000d1f8eae0b';
const SESSION_TRACKING_COLLECTION_ID = '69153bdf002a48c8f193';
const EVENTS_LOG_COLLECTION_ID = '69153be80013cc5b1d8b';

async function setCollectionPermissions(collectionId, collectionName) {
  console.log(`\n🔐 Setting permissions for ${collectionName}...`);
  
  try {
    await databases.updateCollection(
      DATABASE_ID,
      collectionId,
      collectionName,
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ],
      false, // documentSecurity
      true   // enabled
    );
    
    console.log(`✅ Permissions set for ${collectionName}`);
  } catch (error) {
    console.error(`❌ Error setting permissions for ${collectionName}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Setting Analytics Collection Permissions\n');
  console.log('Database ID:', DATABASE_ID);
  console.log('Endpoint:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
  console.log('');

  await setCollectionPermissions(LIVE_VISITORS_COLLECTION_ID, 'live_visitors');
  await setCollectionPermissions(SESSION_TRACKING_COLLECTION_ID, 'session_tracking');
  await setCollectionPermissions(EVENTS_LOG_COLLECTION_ID, 'events_log');

  console.log('\n✅ All permissions set successfully!');
  console.log('\n💡 Collections now allow:');
  console.log('  - Any user can read, create, update, and delete documents');
  console.log('  - Perfect for analytics tracking from client-side');
}

main();
