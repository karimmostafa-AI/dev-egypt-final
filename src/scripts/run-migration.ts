// Migration Runner Script
// Run this script to fix the hasVariations field issue

import { runMigrations } from '../lib/database-migration';

async function main() {
  console.log('🚀 Starting database migration...\n');

  try {
    await runMigrations();

    console.log('\n✅ Migration completed!');
    console.log('\nYou can now try creating products again.');
    console.log('The hasVariations field should now be available in your Appwrite collection.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('\nIf the migration failed, you may need to:');
    console.log('1. Manually add the hasVariations field to your products collection in Appwrite');
    console.log('2. Or run the migration again after checking your Appwrite configuration');
  }
}

// Run the migration
main().catch(console.error);