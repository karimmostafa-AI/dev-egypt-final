/**
 * Performance monitoring utilities for the product catalog
 */

// Performance metrics interface
interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime?: number;
  bundleSize?: number;
}

// Performance observer for monitoring
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Mark the start of a performance measurement
  markStart(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${name}-start`);
    }
  }

  // Mark the end of a performance measurement
  markEnd(name: string): number {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = performance.getEntriesByName(name)[0];
      const duration = measure?.duration || 0;
      
      // Store metrics
      const existing = this.metrics.get(name) || {} as PerformanceMetrics;
      this.metrics.set(name, {
        ...existing,
        loadTime: duration
      });
      
      return duration;
    }
    return 0;
  }

  // Get performance metrics
  getMetrics(name?: string): PerformanceMetrics | Map<string, PerformanceMetrics> {
    if (name) {
      return this.metrics.get(name) || {} as PerformanceMetrics;
    }
    return this.metrics;
  }

  // Log performance metrics to console (development only)
  logMetrics(name?: string): void {
    if (process.env.NODE_ENV === 'development') {
      if (name) {
        const metrics = this.metrics.get(name);
        if (metrics) {
          console.log(`Performance metrics for ${name}:`, metrics);
        }
      } else {
        console.log('All performance metrics:', Object.fromEntries(this.metrics));
      }
    }
  }

  // Clear metrics
  clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }
}

// Hook for measuring component render performance
export const usePerformanceMonitor = (componentName: string) => {
  const monitor = PerformanceMonitor.getInstance();
  
  const startMeasurement = () => {
    monitor.markStart(componentName);
  };
  
  const endMeasurement = () => {
    return monitor.markEnd(componentName);
  };
  
  const getMetrics = () => {
    return monitor.getMetrics(componentName);
  };
  
  return {
    startMeasurement,
    endMeasurement,
    getMetrics,
    logMetrics: () => monitor.logMetrics(componentName)
  };
};

// Web Vitals monitoring
export const measureWebVitals = () => {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint (LCP)
  const observeLCP = () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      if (process.env.NODE_ENV === 'development') {
        console.log('LCP:', lastEntry.startTime);
      }
      
      // In production, send to analytics
      if (process.env.NODE_ENV === 'production') {
        // Example: analytics.track('LCP', { value: lastEntry.startTime });
      }
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  };

  // First Input Delay (FID)
  const observeFID = () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const fid = (entry as any).processingStart - entry.startTime;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('FID:', fid);
        }
        
        // In production, send to analytics
        if (process.env.NODE_ENV === 'production') {
          // Example: analytics.track('FID', { value: fid });
        }
      });
    });
    
    observer.observe({ entryTypes: ['first-input'] });
  };

  // Cumulative Layout Shift (CLS)
  const observeCLS = () => {
    let clsValue = 0;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('CLS:', clsValue);
      }
    });
    
    observer.observe({ entryTypes: ['layout-shift'] });
  };

  // Initialize observers
  try {
    observeLCP();
    observeFID();
    observeCLS();
  } catch (error) {
    console.warn('Performance monitoring not supported:', error);
  }
};

// Bundle size analyzer (development only)
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // Estimate bundle size based on loaded scripts
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    let totalSize = 0;
    
    scripts.forEach((script: any) => {
      if (script.src && script.src.includes('/_next/')) {
        // This is a rough estimate - in production you'd use actual bundle analysis
        totalSize += 100; // Placeholder KB
      }
    });
    
    console.log(`Estimated bundle size: ${totalSize}KB`);
    return totalSize;
  }
  return 0;
};

export default PerformanceMonitor;