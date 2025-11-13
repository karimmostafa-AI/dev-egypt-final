import { NextRequest, NextResponse } from 'next/server';
import { Databases, Query } from 'node-appwrite';
import { createServerClient, DATABASE_ID, SETTINGS_COLLECTION_ID } from '@/lib/appwrite';

const DEFAULT_INTERVAL = 30000;
const DOC_ID = 'inventory_recalc_interval_ms';

export const GET = async () => {
  try {
    const client = createServerClient();
    const db = new Databases(client);
    try {
      const setting = await db.getDocument(DATABASE_ID, SETTINGS_COLLECTION_ID, DOC_ID);
      const ms = parseInt(String((setting as any).value ?? DEFAULT_INTERVAL), 10);
      return NextResponse.json({ intervalMs: isNaN(ms) ? DEFAULT_INTERVAL : ms });
    } catch {
      // Not found or no settings collection
      return NextResponse.json({ intervalMs: DEFAULT_INTERVAL });
    }
  } catch (e) {
    return NextResponse.json({ intervalMs: DEFAULT_INTERVAL, warning: 'fallback' });
  }
};
