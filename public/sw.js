// Service Worker for Dev Egypt PWA
const CACHE_NAME = 'pwa-cache-v1'
const RUNTIME_CACHE = 'pwa-runtime-v1'

// Resources to cache on install
const PRECACHE_RESOURCES = [
  '/',
  '/catalog',
  '/cart',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/products\/\w+/,
  /\/api\/products\/\w+\/reviews/,
  /\/api\/admin\/products/
]

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing')

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching essential resources')
        // Use Promise.allSettled to handle missing resources gracefully
        return Promise.allSettled(
          PRECACHE_RESOURCES.map(url => cache.add(url))
        ).then(results => {
          // Log any failures but don't fail the entire cache operation
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              console.warn('Failed to cache resource:', PRECACHE_RESOURCES[index], result.reason)
            }
          })
          return cache
        })
      })
      .then(() => {
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating')

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle API requests
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle page requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request))
    return
  }

  // Handle static assets
  event.respondWith(handleStaticAssetRequest(request))
})

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log('API request failed, trying cache:', error)

    // Fallback to cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline response for API requests
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This content is not available offline'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle navigation requests with cache-first strategy
async function handleNavigationRequest(request) {
  try {
    // Try cache first for faster loading
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Fallback to network
    const networkResponse = await fetch(request)

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log('Navigation request failed:', error)

    // Return offline page
    return caches.match('/') || new Response('Offline', { status: 503 })
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAssetRequest(request) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log('Static asset request failed:', error)
    return new Response('Not Found', { status: 404 })
  }
}

// Background sync for cart operations
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag)

  if (event.tag === 'cart-sync') {
    event.waitUntil(syncCartData())
  }
})

// Sync cart data when back online
async function syncCartData() {
  try {
    // Get pending cart operations from IndexedDB
    const pendingCartOps = await getPendingCartOperations()

    for (const operation of pendingCartOps) {
      try {
        await fetch('/api/cart/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(operation)
        })

        // Remove from pending operations on success
        await removePendingCartOperation(operation.id)
      } catch (error) {
        console.error('Failed to sync cart operation:', error)
      }
    }
  } catch (error) {
    console.error('Cart sync failed:', error)
  }
}

// IndexedDB helpers for offline cart storage
function openCartDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CartDB', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('pendingOperations')) {
        db.createObjectStore('pendingOperations', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

async function getPendingCartOperations() {
  try {
    const db = await openCartDB()
    const transaction = db.transaction(['pendingOperations'], 'readonly')
    const store = transaction.objectStore('pendingOperations')

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  } catch (error) {
    console.error('Failed to get pending cart operations:', error)
    return []
  }
}

async function removePendingCartOperation(id) {
  try {
    const db = await openCartDB()
    const transaction = db.transaction(['pendingOperations'], 'readwrite')
    const store = transaction.objectStore('pendingOperations')

    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  } catch (error) {
    console.error('Failed to remove pending cart operation:', error)
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received')

  if (!event.data) return

  try {
    const data = event.data.json()

    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: data.tag || 'general',
      data: data.url,
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/icon-48x48.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  } catch (error) {
    console.error('Push notification error:', error)
  }
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action)

  event.notification.close()

  if (event.action === 'view' && event.notification.data) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    )
  }
})

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CACHE_RESOURCES') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE)
        .then(cache => cache.addAll(event.data.resources))
    )
  }
})