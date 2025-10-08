// Bundle Optimization Utilities
// Provides tools for code splitting, dynamic imports, and performance monitoring

import { lazy, ComponentType } from 'react';

// Dynamic Import Configuration
export const dynamicImports = {
  // Admin Components (loaded on demand)
  admin: {
    ColorPicker: () => import('@/components/admin/ColorPicker'),
    ProductVariationManager: () => import('@/components/admin/ProductVariationManager'),
    ImageUploadWithPreview: () => import('@/components/admin/ImageUploadWithPreview'),
    BrandLandingPageEditor: () => import('@/components/admin/BrandLandingPageEditor')
  },

  // Heavy UI Components
  ui: {
    LazyImage: () => import('@/components/ui/LazyImage'),
    LoadingStates: () => import('@/components/ui/LoadingStates')
  },

  // Services (loaded when needed)
  services: {
    imageService: () => import('@/lib/image-service'),
    brandLandingService: () => import('@/lib/brand-landing-service'),
    productVariationService: () => import('@/lib/product-variation-service'),
    imagePlaceholderService: () => import('@/lib/image-placeholder-service'),
    brandAutoGenerationService: () => import('@/lib/brand-auto-generation-service'),
    imageOptimizationPipeline: () => import('@/lib/image-optimization-pipeline'),
    imageCachingService: () => import('@/lib/image-caching-service')
  },

  // Pages (code-split by route)
  pages: {
    catalog: () => import('@/app/catalog/page'),
    productDetails: () => import('@/app/product/[slug]/page'),
    brandPage: () => import('@/app/brand/[slug]/page'),
    account: () => import('@/app/account/page'),
    checkout: () => import('@/app/checkout/page')
  }
};

// Lazy-loaded Components with Preloading
export function lazyLoadWithPreload<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(importFunc);

  // Add preload method
  const ComponentWithPreload = LazyComponent as typeof LazyComponent & {
    preload: () => void;
  };

  ComponentWithPreload.preload = importFunc;

  return ComponentWithPreload;
}

// Preload critical components
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be needed soon
  dynamicImports.ui.LazyImage();
  dynamicImports.services.imageService();
};

// Bundle Analysis Utilities
export interface BundleAnalysis {
  totalSize: number;
  chunks: Array<{
    name: string;
    size: number;
    files: string[];
  }>;
  largestChunks: Array<{
    name: string;
    size: number;
  }>;
  recommendations: string[];
}

export class BundleAnalyzer {
  private static instance: BundleAnalyzer;
  private analysisData: BundleAnalysis | null = null;

  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer();
    }
    return BundleAnalyzer.instance;
  }

  async analyzeBundle(): Promise<BundleAnalysis> {
    try {
      // In a real implementation, this would analyze the actual webpack bundle
      // For now, return mock data
      this.analysisData = {
        totalSize: 2.5 * 1024 * 1024, // 2.5MB
        chunks: [
          { name: 'main', size: 1.2 * 1024 * 1024, files: ['app', 'components'] },
          { name: 'admin', size: 800 * 1024, files: ['admin', 'forms'] },
          { name: 'vendor', size: 500 * 1024, files: ['react', 'next', 'tailwind'] }
        ],
        largestChunks: [
          { name: 'main', size: 1.2 * 1024 * 1024 },
          { name: 'admin', size: 800 * 1024 }
        ],
        recommendations: [
          'Consider code splitting for admin components',
          'Lazy load heavy UI libraries',
          'Optimize image imports',
          'Remove unused dependencies'
        ]
      };

      return this.analysisData;
    } catch (error) {
      console.error('Error analyzing bundle:', error);
      throw error;
    }
  }

  getAnalysis(): BundleAnalysis | null {
    return this.analysisData;
  }

  generateOptimizationReport(): string {
    if (!this.analysisData) {
      return 'No bundle analysis available';
    }

    const { totalSize, largestChunks, recommendations } = this.analysisData;
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

    let report = `Bundle Analysis Report\n`;
    report += `=====================\n\n`;
    report += `Total Bundle Size: ${totalSizeMB} MB\n\n`;
    report += `Largest Chunks:\n`;
    largestChunks.forEach(chunk => {
      const sizeMB = (chunk.size / (1024 * 1024)).toFixed(2);
      report += `- ${chunk.name}: ${sizeMB} MB\n`;
    });

    report += `\nRecommendations:\n`;
    recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });

    return report;
  }
}

// Performance Monitoring
export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  bundleSize: number;
  cacheHitRate: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring(): void {
    this.measureLoadTime();
    this.measureWebVitals();
    this.measureBundleSize();
  }

  stopMonitoring(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  getMetrics(): PerformanceMetrics {
    return this.metrics as PerformanceMetrics;
  }

  private measureLoadTime(): void {
    // Measure page load time
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.metrics.loadTime = loadTime;

      // Measure DOM content loaded
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      }
    });
  }

  private measureWebVitals(): void {
    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.largestContentfulPaint = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (error) {
      console.warn('LCP measurement not supported');
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (error) {
      console.warn('FID measurement not supported');
    }

    // Cumulative Layout Shift
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.cumulativeLayoutShift = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      console.warn('CLS measurement not supported');
    }
  }

  private measureBundleSize(): void {
    // Estimate bundle size from network requests
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let totalSize = 0;

      entries.forEach((entry) => {
        const resourceEntry = entry as PerformanceResourceTiming;
        if (resourceEntry.name.includes('.js') || resourceEntry.name.includes('.css')) {
          totalSize += resourceEntry.transferSize || 0;
        }
      });

      this.metrics.bundleSize = totalSize;
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      console.warn('Resource timing not supported');
    }
  }

  generatePerformanceReport(): string {
    const metrics = this.getMetrics();

    let report = `Performance Report\n`;
    report += `==================\n\n`;
    report += `Load Time: ${Math.round(metrics.loadTime || 0)}ms\n`;
    report += `DOM Content Loaded: ${Math.round(metrics.domContentLoaded || 0)}ms\n`;
    report += `Largest Contentful Paint: ${Math.round(metrics.largestContentfulPaint || 0)}ms\n`;
    report += `First Input Delay: ${Math.round(metrics.firstInputDelay || 0)}ms\n`;
    report += `Cumulative Layout Shift: ${(metrics.cumulativeLayoutShift || 0).toFixed(3)}\n`;
    report += `Bundle Size: ${((metrics.bundleSize || 0) / 1024).toFixed(2)} KB\n`;
    report += `Cache Hit Rate: ${Math.round(metrics.cacheHitRate || 0)}%\n`;

    return report;
  }
}

// Code Splitting Helper
export const createCodeSplitComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  return lazyLoadWithPreload(importFn);
};

// Resource Hints for Performance
export const addResourceHints = () => {
  const head = document.head;

  // Preload critical resources
  const preloadLink = document.createElement('link');
  preloadLink.rel = 'preload';
  preloadLink.as = 'font';
  preloadLink.href = '/fonts/roboto.woff2';
  preloadLink.crossOrigin = 'anonymous';
  head.appendChild(preloadLink);

  // DNS prefetch for external resources
  const dnsPrefetch = document.createElement('link');
  dnsPrefetch.rel = 'dns-prefetch';
  dnsPrefetch.href = '//cdn.devegypt.com';
  head.appendChild(dnsPrefetch);
};

// Bundle Optimization Strategies
export const optimizationStrategies = {
  // Tree shaking configuration
  treeShaking: {
    sideEffects: false,
    usedExports: true,
    innerGraph: true
  },

  // Module concatenation
  moduleConcatenation: {
    enable: true,
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: 10
      },
      admin: {
        test: /[\\/]src[\\/]components[\\/]admin[\\/]/,
        name: 'admin',
        chunks: 'all',
        priority: 5
      }
    }
  },

  // Compression settings
  compression: {
    gzip: true,
    brotli: true,
    algorithms: ['gzip', 'brotliCompress'],
    threshold: 10240,
    minRatio: 0.8
  }
};

// Memory Management
export class MemoryManager {
  private static instance: MemoryManager;

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  cleanup(): void {
    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }

    // Clear any cached data that's no longer needed
    this.clearCaches();
  }

  private clearCaches(): void {
    // Clear various caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
  }

  getMemoryUsage(): { used: number; total: number; percentage: number } {
    // In browsers, we can't get exact memory usage
    // This is a placeholder for memory monitoring
    return {
      used: 0,
      total: 0,
      percentage: 0
    };
  }
}

// Export singleton instances
export const bundleAnalyzer = BundleAnalyzer.getInstance();
export const performanceMonitor = PerformanceMonitor.getInstance();
export const memoryManager = MemoryManager.getInstance();

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  performanceMonitor.startMonitoring();
  addResourceHints();
}