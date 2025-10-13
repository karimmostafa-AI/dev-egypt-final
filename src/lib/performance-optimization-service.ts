'use client'

import React from 'react'

export interface PerformanceMetrics {
  lcp: number
  fid: number
  cls: number
  fcp: number
  ttfb: number
}

export interface WebVitalsScore {
  lcp: 'good' | 'needs-improvement' | 'poor'
  fid: 'good' | 'needs-improvement' | 'poor'
  cls: 'good' | 'needs-improvement' | 'poor'
  overall: 'good' | 'needs-improvement' | 'poor'
}

export class PerformanceOptimizationService {
  private static instance: PerformanceOptimizationService
  private observers: PerformanceObserver[] = []
  private metrics: Partial<PerformanceMetrics> = {}

  static getInstance(): PerformanceOptimizationService {
    if (!PerformanceOptimizationService.instance) {
      PerformanceOptimizationService.instance = new PerformanceOptimizationService()
    }
    return PerformanceOptimizationService.instance
  }

  private constructor() {
    this.init()
  }

  private init() {
    this.setupPerformanceObservers()
    this.optimizeInitialLoad()
  }

  private setupPerformanceObservers() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        this.metrics.lcp = lastEntry.startTime
        this.logMetric('LCP', lastEntry.startTime)
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(lcpObserver)

      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        this.metrics.fcp = lastEntry.startTime
        this.logMetric('FCP', lastEntry.startTime)
      })
      fcpObserver.observe({ entryTypes: ['paint'] })
      this.observers.push(fcpObserver)

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime
          this.logMetric('FID', entry.processingStart - entry.startTime)
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.push(fidObserver)

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0
        const entries = list.getEntries()

        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })

        this.metrics.cls = clsValue
        this.logMetric('CLS', clsValue)
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(clsObserver)

    } catch (error) {
      console.warn('Performance observers not supported:', error)
    }
  }

  private optimizeInitialLoad() {
    // Preload critical resources
    this.preloadCriticalResources()

    // Optimize font loading
    this.optimizeFontLoading()

    // Setup resource hints
    this.setupResourceHints()

    // Optimize images
    this.optimizeImages()
  }

  private preloadCriticalResources() {
    const criticalResources = [
      '/manifest.json',
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png'
    ]

    criticalResources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = resource
      link.as = resource.endsWith('.png') ? 'image' : 'fetch'
      document.head.appendChild(link)
    })
  }

  private optimizeFontLoading() {
    // Add font-display: swap to Google Fonts
    const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]')
    fontLinks.forEach(link => {
      const href = (link as HTMLLinkElement).href
      if (href && !href.includes('display=swap')) {
        const url = new URL(href)
        url.searchParams.set('display', 'swap')
        ;(link as HTMLLinkElement).href = url.toString()
      }
    })
  }

  private setupResourceHints() {
    // DNS prefetch for external domains
    const domains = [
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ]

    domains.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'dns-prefetch'
      link.href = `//${domain}`
      document.head.appendChild(link)
    })

    // Preconnect to critical origins
    const origins = [
      'https://cloud.appwrite.io'
    ]

    origins.forEach(origin => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = origin
      document.head.appendChild(link)
    })
  }

  private optimizeImages() {
    // Add intersection observer for images
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            if (img.dataset.src) {
              img.src = img.dataset.src
              img.removeAttribute('data-src')
              imageObserver.unobserve(img)
            }
          }
        })
      }, { rootMargin: '50px' })

      // Observe all images with data-src
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img)
      })
    }
  }

  private logMetric(name: string, value: number) {
    console.log(`Web Vitals - ${name}:`, value)

    // Send to analytics service in production
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: name,
        value: Math.round(value),
        non_interaction: true,
      })
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics }
  }

  /**
   * Get Web Vitals scores
   */
  getWebVitalsScore(): WebVitalsScore {
    const { lcp = 0, fid = 0, cls = 0 } = this.metrics

    const lcpScore = lcp <= 2500 ? 'good' : lcp <= 4000 ? 'needs-improvement' : 'poor'
    const fidScore = fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor'
    const clsScore = cls <= 0.1 ? 'good' : cls <= 0.25 ? 'needs-improvement' : 'poor'

    const scores = [lcpScore, fidScore, clsScore]
    const poorCount = scores.filter(score => score === 'poor').length
    const needsImprovementCount = scores.filter(score => score === 'needs-improvement').length

    let overall: WebVitalsScore['overall'] = 'good'
    if (poorCount > 0) {
      overall = 'poor'
    } else if (needsImprovementCount > 0) {
      overall = 'needs-improvement'
    }

    return {
      lcp: lcpScore,
      fid: fidScore,
      cls: clsScore,
      overall
    }
  }

  /**
   * Optimize component for better performance
   */
  optimizeComponent(componentName: string, optimizations: string[]) {
    console.log(`Optimizing ${componentName} with:`, optimizations)
  }

  /**
   * Preload next page resources
   */
  preloadPageResources(url: string) {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    document.head.appendChild(link)
  }

  /**
   * Optimize bundle splitting
   */
  setupBundleOptimization() {
    // Dynamic imports for heavy components
    if (typeof window !== 'undefined') {
      // Lazy load non-critical components
      const lazyLoadComponents = () => {
        import('../components/ui/RelatedProducts')
        import('../components/ui/RealTimePriceDisplay')
      }

      // Load after initial page render
      if (document.readyState === 'complete') {
        lazyLoadComponents()
      } else {
        window.addEventListener('load', lazyLoadComponents)
      }
    }
  }

  /**
   * Optimize layout stability
   */
  preventLayoutShift() {
    // Set explicit dimensions for images
    document.querySelectorAll('img').forEach(img => {
      if (!img.width || !img.height) {
        img.style.aspectRatio = img.naturalWidth && img.naturalHeight
          ? `${img.naturalWidth}/${img.naturalHeight}`
          : '1'
      }
    })

    // Reserve space for dynamic content
    document.querySelectorAll('[data-dynamic-content]').forEach(element => {
      const minHeight = element.getAttribute('data-min-height')
      if (minHeight) {
        ;(element as HTMLElement).style.minHeight = minHeight
      }
    })
  }

  /**
   * Optimize JavaScript execution
   */
  optimizeJavaScript() {
    // Defer non-critical JavaScript
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Load non-critical features
        this.setupAnalytics()
        this.setupNonCriticalFeatures()
      })
    }
  }

  private setupAnalytics() {
    // Initialize analytics after page load
    if (typeof window !== 'undefined' && (window as any).gtag) {
      console.log('Analytics initialized')
    }
  }

  private setupNonCriticalFeatures() {
    // Setup features that don't affect initial render
    this.setupProgressiveEnhancement()
  }

  private setupProgressiveEnhancement() {
    // Add progressive enhancement features
    document.querySelectorAll('[data-progressive]').forEach(element => {
      const feature = element.getAttribute('data-progressive')
      if (feature) {
        this.loadProgressiveFeature(feature, element)
      }
    })
  }

  private loadProgressiveFeature(feature: string, element: Element) {
    // Load features progressively
    switch (feature) {
      case 'tooltip':
        import('../components/ui/tooltip').then(({ Tooltip }) => {
          // Initialize tooltip
        })
        break
      case 'modal':
        // Modal component doesn't exist yet, skip for now
        console.log('Modal feature requested but not implemented')
        break
    }
  }

  /**
   * Monitor performance and report issues
   */
  monitorPerformance() {
    const score = this.getWebVitalsScore()

    if (score.overall !== 'good') {
      console.warn('Performance issues detected:', score)

      // Report to monitoring service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        ;(window as any).gtag('event', 'performance_issue', {
          event_category: 'Performance',
          event_label: score.overall,
          value: score.overall === 'poor' ? 3 : 2
        })
      }
    }
  }

  /**
   * Cleanup observers
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// Export singleton instance
export const performanceOptimizationService = PerformanceOptimizationService.getInstance()

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  React.useEffect(() => {
    const service = PerformanceOptimizationService.getInstance()

    // Monitor performance after component mount
    const timer = setTimeout(() => {
      service.monitorPerformance()
    }, 5000)

    return () => {
      clearTimeout(timer)
    }
  }, [])
}