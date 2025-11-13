'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, MapPin, Monitor, Clock, Eye } from 'lucide-react'

interface LiveVisitor {
  $id: string
  visitor_id: string
  user_id?: string
  session_id: string
  current_page: string
  device_type: string
  browser: string
  os: string
  country: string
  city: string
  entered_at: string
  last_seen_at: string
  screen_resolution?: string
}

export function LiveVisitorsWidget() {
  const [visitors, setVisitors] = useState<LiveVisitor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLiveVisitors()
    
    // Refresh every 15 seconds
    const interval = setInterval(fetchLiveVisitors, 15000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchLiveVisitors = async () => {
    try {
      const response = await fetch('/api/analytics/live-visitors')
      if (response.ok) {
        const data = await response.json()
        setVisitors(data.visitors)
      }
    } catch (error) {
      console.error('Failed to fetch live visitors:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeOnSite = (enteredAt: string, lastSeenAt: string): string => {
    const entered = new Date(enteredAt)
    const lastSeen = new Date(lastSeenAt)
    const seconds = Math.floor((lastSeen.getTime() - entered.getTime()) / 1000)
    
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  const getDeviceIcon = (deviceType: string) => {
    return <Monitor className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            Live Visitors
          </h3>
          <div className="animate-pulse flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-20 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-green-500" />
          Live Visitors
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            {visitors.length} online
          </span>
        </div>
      </div>

      {visitors.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No visitors online right now</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {visitors.map((visitor) => (
              <motion.div
                key={visitor.$id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {visitor.visitor_id.substring(8, 10).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Visitor {visitor.visitor_id.substring(8, 12)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <MapPin className="w-3 h-3" />
                        {visitor.city}, {visitor.country}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    {getTimeOnSite(visitor.entered_at, visitor.last_seen_at)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    {getDeviceIcon(visitor.device_type)}
                    <span>{visitor.device_type}</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    {visitor.browser} · {visitor.os}
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded p-2">
                  <Eye className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span className="truncate">{visitor.current_page}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
