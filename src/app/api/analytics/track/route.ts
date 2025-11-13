import { NextRequest, NextResponse } from 'next/server'
import { logEvent, logEventsBatch } from '@/lib/analytics-helpers'

interface EventPayload {
  event_type: string
  visitor_id: string
  session_id: string
  user_id?: string
  page_url?: string
  product_id?: string
  product_name?: string
  product_price?: number
  category?: string
  quantity?: number
  cart_value?: number
  search_query?: string
  custom_data?: Record<string, any>
  timestamp: string
}

interface BatchEventPayload {
  events: EventPayload[]
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    // Handle batch events
    if ('events' in payload && Array.isArray(payload.events)) {
      const batchPayload = payload as BatchEventPayload
      const eventData = batchPayload.events.map(event => prepareEventData(event, request))
      await logEventsBatch(eventData)
      
      return NextResponse.json({ 
        success: true, 
        count: eventData.length 
      })
    }

    // Handle single event
    const eventPayload = payload as EventPayload
    const eventData = prepareEventData(eventPayload, request)
    await logEvent(eventData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to track event' },
      { status: 500 }
    )
  }
}

function prepareEventData(payload: EventPayload, request: NextRequest) {
  const referer = request.headers.get('referer') || undefined
  const userAgent = request.headers.get('user-agent') || undefined

  return {
    event_type: payload.event_type,
    visitor_id: payload.visitor_id,
    session_id: payload.session_id,
    user_id: payload.user_id,
    page_url: payload.page_url,
    product_id: payload.product_id,
    product_name: payload.product_name,
    product_price: payload.product_price,
    category: payload.category,
    quantity: payload.quantity,
    cart_value: payload.cart_value,
    search_query: payload.search_query,
    referrer_url: referer,
    user_agent: userAgent,
    custom_data: payload.custom_data ? JSON.stringify(payload.custom_data) : undefined,
    timestamp: payload.timestamp,
  }
}
