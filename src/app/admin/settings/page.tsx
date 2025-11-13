"use client"

import { useEffect, useState } from "react"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [intervalSec, setIntervalSec] = useState<number>(30)
  const [savingInterval, setSavingInterval] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/settings/inventory-recalc', { cache: 'no-store' })
        const json = await res.json()
        if (!cancelled && typeof json?.intervalMs === 'number') {
          setIntervalSec(Math.max(5, Math.min(600, Math.round(json.intervalMs / 1000))))
        }
      } catch {}
    }
    load()
    return () => { cancelled = true }
  }, [])

  const saveInterval = async () => {
    setSavingInterval(true)
    try {
      const ms = Math.max(5, Math.min(600, intervalSec)) * 1000
      const res = await fetch('/api/admin/settings/inventory-recalc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalMs: ms })
      })
      if (!res.ok) throw new Error('Failed to save interval')
    } catch (error) {
      console.error('Error saving interval:', error)
    } finally {
      setSavingInterval(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Placeholder for other settings
      await new Promise(resolve => setTimeout(resolve, 300))
      console.log('Settings saved')
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-gray-600">
            Manage your store settings and configuration
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Store Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue="Dev-Egypt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue="admin@dev-egypt.com"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Inventory</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Recalculation interval (seconds)
                </label>
                <p className="text-sm text-gray-500">
                  How often to recompute available stock per product automatically. Min 5s, Max 600s.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={5}
                  max={600}
                  value={intervalSec}
                  onChange={(e) => setIntervalSec(Number(e.target.value))}
                  className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
                <button
                  onClick={saveInterval}
                  disabled={savingInterval}
                  className="px-3 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
                >
                  {savingInterval ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}