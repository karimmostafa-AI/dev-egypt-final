import { NextRequest, NextResponse } from 'next/server'
import { upsertLiveVisitor, createSessionTracking } from '@/lib/analytics-helpers'
import { databases } from '@/lib/appwrite'
import { Query } from 'node-appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
const LIVE_VISITORS_COLLECTION_ID = '69153bd5000d1f8eae0b'
const SESSION_TRACKING_COLLECTION_ID = '69153bdf002a48c8f193'

interface VisitorPayload {
  visitor_id: string
  session_id: string
  current_page: string
  device_type: string
  browser: string
  os: string
  screen_resolution: string
  user_id?: string
  entered_at?: string
  last_seen_at: string
  session_end?: boolean
}

export async function POST(request: NextRequest) {
  try {
    // Handle both regular fetch and sendBeacon requests
    let payload: VisitorPayload
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      payload = await request.json()
    } else {
      // sendBeacon sends as text/plain, parse manually
      const text = await request.text()
      if (!text) {
        return NextResponse.json(
          { success: false, error: 'Empty request body' },
          { status: 400 }
        )
      }
      payload = JSON.parse(text)
    }
    
    // Get geolocation data from headers or IP
    const location = await getGeolocation(request)
    
    // Prepare visitor data with enriched location info
    const visitorData = {
      visitor_id: payload.visitor_id,
      user_id: payload.user_id,
      session_id: payload.session_id,
      current_page: payload.current_page,
      device_type: payload.device_type,
      browser: payload.browser,
      os: payload.os,
      country: location.country,
      city: location.city,
      ip_address: location.ip,
      entered_at: payload.entered_at,
      last_seen_at: payload.last_seen_at,
      referrer: request.headers.get('referer') || 'direct',
      screen_resolution: payload.screen_resolution,
    }

    // If this is a session end, finalize the session
    if (payload.session_end) {
      await finalizeSession(payload.session_id, payload.visitor_id, payload.entered_at, payload.last_seen_at)
      
      // Remove from live visitors
      try {
        const existingVisitors = await databases.listDocuments(
          DATABASE_ID,
          LIVE_VISITORS_COLLECTION_ID,
          [Query.equal('visitor_id', payload.visitor_id)]
        )
        
        if (existingVisitors.documents.length > 0) {
          await databases.deleteDocument(
            DATABASE_ID,
            LIVE_VISITORS_COLLECTION_ID,
            existingVisitors.documents[0].$id
          )
        }
      } catch (error) {
        console.error('Error removing live visitor:', error)
      }
      
      return NextResponse.json({ success: true, action: 'session_ended' })
    }

    // Upsert live visitor
    await upsertLiveVisitor(visitorData)
    
    // Update or create session tracking
    await updateSessionTracking(payload.session_id, visitorData)

    return NextResponse.json({ 
      success: true, 
      location: {
        country: location.country,
        city: location.city,
      }
    })
  } catch (error) {
    console.error('Error tracking live visitor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to track visitor' },
      { status: 500 }
    )
  }
}

async function getGeolocation(request: NextRequest): Promise<{
  country: string
  city: string
  ip: string
}> {
  // Try Vercel/Cloudflare headers first
  const country = request.headers.get('x-vercel-ip-country') || 
                  request.headers.get('cf-ipcountry') || 
                  'Unknown'
  
  const city = request.headers.get('x-vercel-ip-city') || 
               request.headers.get('cf-ipcity') || 
               'Unknown'
  
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown'

  // If we have detailed location from headers, use it
  if (country !== 'Unknown' && city !== 'Unknown') {
    return { country, city, ip }
  }

  // Development mode: Use sample location for localhost
  if (process.env.NODE_ENV === 'development' && (ip === 'unknown' || ip.includes('127.0.0.1') || ip.includes('::1'))) {
    return {
      country: 'Egypt',
      city: 'Cairo',
      ip: '127.0.0.1'
    }
  }
  
  // Fallback to IP geolocation API for development/self-hosted
  if (ip !== 'unknown' && !ip.includes('127.0.0.1') && !ip.includes('::1')) {
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,city`, {
        signal: AbortSignal.timeout(2000), // 2 second timeout
      })
      
      if (response.ok) {
        const data = await response.json()
        return {
          country: data.country || 'Unknown',
          city: data.city || 'Unknown',
          ip,
        }
      }
    } catch (error) {
      console.error('IP geolocation failed:', error)
    }
  }

  return { country, city, ip }
}

async function updateSessionTracking(
  sessionId: string,
  visitorData: any
): Promise<void> {
  try {
    // Check if session exists
    const existingSessions = await databases.listDocuments(
      DATABASE_ID,
      SESSION_TRACKING_COLLECTION_ID,
      [Query.equal('session_id', sessionId)]
    )

    const sessionData = {
      session_id: sessionId,
      visitor_id: visitorData.visitor_id,
      user_id: visitorData.user_id || null,
      start_time: visitorData.entered_at || new Date().toISOString(),
      last_activity: visitorData.last_seen_at,
      device_type: visitorData.device_type,
      browser: visitorData.browser,
      os: visitorData.os,
      country: visitorData.country,
      city: visitorData.city,
      referrer_url: visitorData.referrer,
      landing_page: visitorData.current_page,
    }

    if (existingSessions.documents.length > 0) {
      // Update existing session
      await databases.updateDocument(
        DATABASE_ID,
        SESSION_TRACKING_COLLECTION_ID,
        existingSessions.documents[0].$id,
        {
          last_activity: sessionData.last_activity,
          pages_visited: (existingSessions.documents[0].pages_visited || 0) + 1,
        }
      )
    } else {
      // Create new session
      await createSessionTracking(sessionData)
    }
  } catch (error) {
    console.error('Error updating session tracking:', error)
  }
}

async function finalizeSession(
  sessionId: string,
  visitorId: string,
  enteredAt: string | undefined,
  lastSeenAt: string
): Promise<void> {
  try {
    const existingSessions = await databases.listDocuments(
      DATABASE_ID,
      SESSION_TRACKING_COLLECTION_ID,
      [Query.equal('session_id', sessionId)]
    )

    if (existingSessions.documents.length > 0) {
      const session = existingSessions.documents[0]
      const startTime = new Date(session.start_time || enteredAt || lastSeenAt)
      const endTime = new Date(lastSeenAt)
      const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

      await databases.updateDocument(
        DATABASE_ID,
        SESSION_TRACKING_COLLECTION_ID,
        session.$id,
        {
          end_time: lastSeenAt,
          session_duration: durationSeconds,
        }
      )
    }
  } catch (error) {
    console.error('Error finalizing session:', error)
  }
}
