import { NextResponse } from 'next/server'
import { databases } from '@/lib/appwrite'
import { Query } from 'node-appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
const LIVE_VISITORS_COLLECTION_ID = '69153bd5000d1f8eae0b'

// Consider visitors inactive after 30 seconds of no activity
const INACTIVE_THRESHOLD_MS = 30000

export async function GET() {
  try {
    // Fetch all live visitors
    const response = await databases.listDocuments(
      DATABASE_ID,
      LIVE_VISITORS_COLLECTION_ID,
      [
        Query.limit(100), // Limit to 100 most recent visitors
      ]
    )

    const now = new Date()
    // Sort by last_seen_at desc in memory to avoid requiring a DB index
    const sortedDocs = [...response.documents].sort((a: any, b: any) => {
      const at = new Date(a.last_seen_at).getTime()
      const bt = new Date(b.last_seen_at).getTime()
      return bt - at
    })

    const activeVisitors: any[] = []
    const staleVisitorIds: string[] = []

    // Filter out stale visitors
    for (const visitor of sortedDocs) {
      const lastSeen = new Date(visitor.last_seen_at)
      const timeSinceLastSeen = now.getTime() - lastSeen.getTime()

      if (timeSinceLastSeen > INACTIVE_THRESHOLD_MS) {
        staleVisitorIds.push(visitor.$id)
      } else {
        activeVisitors.push(visitor)
      }
    }

    // Cleanup stale visitors in background (don't await)
    if (staleVisitorIds.length > 0) {
      cleanupStaleVisitors(staleVisitorIds).catch(error => {
        console.error('Error cleaning up stale visitors:', error)
      })
    }

    return NextResponse.json({
      visitors: activeVisitors,
      total: activeVisitors.length,
      cleaned: staleVisitorIds.length,
    })
  } catch (error) {
    console.error('Error fetching live visitors:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch live visitors' },
      { status: 500 }
    )
  }
}

async function cleanupStaleVisitors(visitorIds: string[]): Promise<void> {
  // Delete stale visitors in batches
  const batchSize = 10
  for (let i = 0; i < visitorIds.length; i += batchSize) {
    const batch = visitorIds.slice(i, i + batchSize)
    await Promise.all(
      batch.map(id =>
        databases.deleteDocument(
          DATABASE_ID,
          LIVE_VISITORS_COLLECTION_ID,
          id
        ).catch(error => {
          console.error(`Failed to delete visitor ${id}:`, error)
        })
      )
    )
  }
}
