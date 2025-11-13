'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface VisitorData {
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
}

export function LiveVisitorTracker() {
  const pathname = usePathname()
  const sessionStartRef = useRef<Date | null>(null)
  const lastUpdateRef = useRef<Date>(new Date())
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize session on mount
  useEffect(() => {
    if (!sessionStartRef.current) {
      sessionStartRef.current = new Date()
    }
  }, [])

  // Update visitor data every 10 seconds
  useEffect(() => {
    const updateVisitor = async () => {
      try {
        const visitorData: VisitorData = {
          visitor_id: getVisitorId(),
          session_id: getSessionId(),
          current_page: pathname,
          device_type: getDeviceType(),
          browser: getBrowser(),
          os: getOS(),
          screen_resolution: getScreenResolution(),
          entered_at: sessionStartRef.current?.toISOString(),
          last_seen_at: new Date().toISOString(),
        }

        // Try to get user ID if logged in
        const userId = await getUserId()
        if (userId) {
          visitorData.user_id = userId
        }

        await fetch('/api/analytics/live-visitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(visitorData),
        })

        lastUpdateRef.current = new Date()
      } catch (error) {
        console.error('Failed to update live visitor:', error)
      }
    }

    // Initial update
    updateVisitor()

    // Set up interval for updates every 10 seconds
    updateIntervalRef.current = setInterval(updateVisitor, 10000)

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [pathname])

  // Track page view event
  useEffect(() => {
    const trackPageView = async () => {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'page_view',
            visitor_id: getVisitorId(),
            session_id: getSessionId(),
            page_url: pathname,
            timestamp: new Date().toISOString(),
          }),
        })
      } catch (error) {
        console.error('Failed to track page view:', error)
      }
    }

    trackPageView()
  }, [pathname])

  // Send final update on unmount
  useEffect(() => {
    return () => {
      // Use navigator.sendBeacon for reliable delivery on page unload
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const data = JSON.stringify({
          visitor_id: getVisitorId(),
          session_id: getSessionId(),
          current_page: pathname,
          last_seen_at: new Date().toISOString(),
          session_end: true,
        })
        
        // Create a Blob with proper content-type for sendBeacon
        const blob = new Blob([data], { type: 'application/json' })
        navigator.sendBeacon('/api/analytics/live-visitor', blob)
      }
    }
  }, [pathname])

  return null // This is a tracker component, no UI
}

// Helper functions

// In-memory fallback for private browsing
let inMemoryVisitorId: string | null = null
let inMemorySessionId: string | null = null

function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const storage = window[type]
    const testKey = '__storage_test__'
    storage.setItem(testKey, 'test')
    storage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

function getVisitorId(): string {
  if (typeof window === 'undefined') return ''
  
  // Try localStorage first
  if (isStorageAvailable('localStorage')) {
    let visitorId = localStorage.getItem('visitor_id')
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      try {
        localStorage.setItem('visitor_id', visitorId)
      } catch (e) {
        console.warn('Failed to save visitor_id to localStorage:', e)
      }
    }
    return visitorId
  }
  
  // Fallback to in-memory storage (for private browsing)
  if (!inMemoryVisitorId) {
    inMemoryVisitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  return inMemoryVisitorId
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  // Try sessionStorage first
  if (isStorageAvailable('sessionStorage')) {
    let sessionId = sessionStorage.getItem('session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      try {
        sessionStorage.setItem('session_id', sessionId)
      } catch (e) {
        console.warn('Failed to save session_id to sessionStorage:', e)
      }
    }
    return sessionId
  }
  
  // Fallback to in-memory storage (for private browsing)
  if (!inMemorySessionId) {
    inMemorySessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  return inMemorySessionId
}

async function getUserId(): Promise<string | null> {
  // Try to get user ID from your auth system
  // This is a placeholder - adjust based on your auth implementation
  try {
    const response = await fetch('/api/auth/session')
    if (response.ok) {
      const data = await response.json()
      return data.userId || null
    }
  } catch (error) {
    // User not logged in or error fetching
  }
  return null
}

function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown'
  
  const ua = navigator.userAgent
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile'
  }
  return 'desktop'
}

function getBrowser(): string {
  if (typeof window === 'undefined') return 'unknown'
  
  const ua = navigator.userAgent
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('Edg')) return 'Edge'
  if (ua.includes('MSIE') || ua.includes('Trident')) return 'IE'
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera'
  return 'Other'
}

function getOS(): string {
  if (typeof window === 'undefined') return 'unknown'
  
  const ua = navigator.userAgent
  if (ua.includes('Win')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  return 'Other'
}

function getScreenResolution(): string {
  if (typeof window === 'undefined') return 'unknown'
  return `${window.screen.width}x${window.screen.height}`
}
