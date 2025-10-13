'use client'

import React from 'react'

export interface PWAInstallPrompt extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface PWABeforeInstallPromptEvent extends Event {
  platforms: string[]
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  prompt: () => Promise<void>
}

export class PWAService {
  private static instance: PWAService
  private installPrompt: PWABeforeInstallPromptEvent | null = null
  private isInstalled = false
  private isOnline = typeof window !== 'undefined' ? navigator.onLine : true
  private registration: ServiceWorkerRegistration | null = null

  static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService()
    }
    return PWAService.instance
  }

  private constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.init()
    }
  }

  private init() {
    // Ensure we're on client side
    if (typeof window === 'undefined') return

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.installPrompt = e as PWABeforeInstallPromptEvent
    })

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true
      this.installPrompt = null
    })

    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })

    // Register service worker
    this.registerServiceWorker()
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered successfully')
      } catch (error) {
        console.warn('Service Worker registration failed:', error)
      }
    }
  }

  /**
   * Check if PWA installation is available
   */
  canInstall(): boolean {
    return !!this.installPrompt && !this.isInstalled
  }

  /**
   * Show install prompt
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.installPrompt) {
      return false
    }

    try {
      this.installPrompt.prompt()
      const choice = await this.installPrompt.userChoice

      if (choice.outcome === 'accepted') {
        this.isInstalled = true
        this.installPrompt = null
        return true
      }

      return false
    } catch (error) {
      console.warn('Install prompt failed:', error)
      return false
    }
  }

  /**
   * Check if app is installed
   */
  getIsInstalled(): boolean {
    if (typeof window === 'undefined') return false
    return this.isInstalled || window.matchMedia('(display-mode: standalone)').matches
  }

  /**
   * Check if app is online
   */
  getIsOnline(): boolean {
    return this.isOnline
  }

  /**
   * Get service worker registration
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration
  }

  /**
   * Update service worker
   */
  async updateServiceWorker(): Promise<void> {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  /**
   * Cache resources for offline use
   */
  async cacheResources(resources: string[]): Promise<void> {
    if (!this.registration) return

    try {
      const cache = await caches.open('pwa-cache-v1')
      await cache.addAll(resources)
    } catch (error) {
      console.warn('Failed to cache resources:', error)
    }
  }

  /**
   * Clear old caches
   */
  async clearOldCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys()
      const oldCaches = cacheNames.filter(name => name !== 'pwa-cache-v1')

      await Promise.all(
        oldCaches.map(name => caches.delete(name))
      )
    } catch (error) {
      console.warn('Failed to clear old caches:', error)
    }
  }

  /**
   * Get cached resource
   */
  async getCachedResource(url: string): Promise<Response | null> {
    try {
      const cache = await caches.open('pwa-cache-v1')
      const response = await cache.match(url)
      return response || null
    } catch (error) {
      console.warn('Failed to get cached resource:', error)
      return null
    }
  }

  /**
   * Background sync for cart operations
   */
  async syncCart(cartData: any): Promise<void> {
    if (typeof window === 'undefined') return

    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready
        await (registration as any).sync.register('cart-sync')
      } catch (error) {
        console.warn('Background sync not supported:', error)
      }
    }
  }
}

// Export singleton instance
export const pwaService = PWAService.getInstance()

// React hook for PWA functionality
export function usePWA() {
  const [canInstall, setCanInstall] = React.useState(false)
  const [isInstalled, setIsInstalled] = React.useState(false)
  const [isOnline, setIsOnline] = React.useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  )

  React.useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const checkInstallStatus = () => {
      setCanInstall(pwaService.canInstall())
      setIsInstalled(pwaService.getIsInstalled())
      setIsOnline(pwaService.getIsOnline())
    }

    checkInstallStatus()

    // Listen for install prompt availability
    const handleBeforeInstallPrompt = () => {
      setCanInstall(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
    }

    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('offline', handleOnlineStatus)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnlineStatus)
      window.removeEventListener('offline', handleOnlineStatus)
    }
  }, [])

  const showInstallPrompt = React.useCallback(async () => {
    return await pwaService.showInstallPrompt()
  }, [])

  const updateServiceWorker = React.useCallback(async () => {
    await pwaService.updateServiceWorker()
  }, [])

  const cacheResources = React.useCallback(async (resources: string[]) => {
    await pwaService.cacheResources(resources)
  }, [])

  const clearOldCaches = React.useCallback(async () => {
    await pwaService.clearOldCaches()
  }, [])

  return {
    canInstall,
    isInstalled,
    isOnline,
    showInstallPrompt,
    updateServiceWorker,
    cacheResources,
    clearOldCaches
  }
}