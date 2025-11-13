import { NextRequest, NextResponse } from 'next/server';
import { Databases } from 'node-appwrite';
import { createServerClient, DATABASE_ID, SETTINGS_COLLECTION_ID } from '@/lib/appwrite';

const DOC_ID = 'inventory_recalc_interval_ms';

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { intervalMs } = body || {};

    const ms = parseInt(String(intervalMs), 10);
    if (!ms || isNaN(ms) || ms < 5000 || ms > 10 * 60 * 1000) {
      return NextResponse.json({ error: 'intervalMs must be between 5000 and 600000 ms' }, { status: 400 });
    }

    const client = createServerClient();
    const db = new Databases(client);

    let doc;
    try {
      // Try update existing
      doc = await db.updateDocument(DATABASE_ID, SETTINGS_COLLECTION_ID, DOC_ID, { value: String(ms) });
    } catch {
      // Create if not exists
      doc = await db.createDocument(DATABASE_ID, SETTINGS_COLLECTION_ID, DOC_ID, { key: DOC_ID, value: String(ms) });
    }

    return NextResponse.json({ success: true, intervalMs: ms, doc });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to save setting' }, { status: 500 });
  }
};
