'use client'

export interface AccessibilityOptions {
  enableScreenReader?: boolean
  enableKeyboardNavigation?: boolean
  enableFocusManagement?: boolean
  enableColorContrast?: boolean
  enableReducedMotion?: boolean
  announceLiveRegions?: boolean
}

export class AccessibilityService {
  private static instance: AccessibilityService
  private options: AccessibilityOptions
  private announcedElements = new Set<string>()
  private focusableElements: HTMLElement[] = []
  private currentFocusIndex = 0

  static getInstance(options: AccessibilityOptions = {}): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService(options)
    }
    return AccessibilityService.instance
  }

  private constructor(options: AccessibilityOptions) {
    this.options = {
      enableScreenReader: true,
      enableKeyboardNavigation: true,
      enableFocusManagement: true,
      enableColorContrast: true,
      enableReducedMotion: true,
      announceLiveRegions: true,
      ...options
    }

    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.init()
    }
  }

  private init() {
    if (this.options.enableReducedMotion) {
      this.handleReducedMotion()
    }

    if (this.options.enableKeyboardNavigation) {
      this.setupKeyboardNavigation()
    }

    if (this.options.enableFocusManagement) {
      this.setupFocusManagement()
    }
  }

  private handleReducedMotion() {
    if (typeof window === 'undefined') return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      // Disable animations and transitions
      const style = document.createElement('style')
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `
      document.head.appendChild(style)
    }
  }

  private setupKeyboardNavigation() {
    if (typeof window === 'undefined') return

    document.addEventListener('keydown', (e) => {
      // Escape key handling
      if (e.key === 'Escape') {
        this.handleEscapeKey()
      }

      // Tab navigation enhancement
      if (e.key === 'Tab') {
        this.enhanceTabNavigation(e)
      }

      // Arrow key navigation for custom components
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.handleArrowNavigation(e)
      }
    })
  }

  private setupFocusManagement() {
    if (typeof window === 'undefined') return

    // Track focusable elements
    this.updateFocusableElements()

    // Update on DOM changes
    const observer = new MutationObserver(() => {
      this.updateFocusableElements()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Handle focus trapping for modals
    document.addEventListener('focusin', (e) => {
      this.handleFocusIn(e)
    })
  }

  private updateFocusableElements() {
    if (typeof window === 'undefined') return

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    this.focusableElements = Array.from(
      document.querySelectorAll(focusableSelectors)
    ) as HTMLElement[]
  }

  private handleEscapeKey() {
    // Close modals, dropdowns, etc.
    const escapeEvent = new CustomEvent('accessibility:escape')
    document.dispatchEvent(escapeEvent)
  }

  private enhanceTabNavigation(e: KeyboardEvent) {
    // Ensure proper tab order and skip hidden elements
    const currentElement = document.activeElement as HTMLElement

    if (currentElement && currentElement.hasAttribute('data-skip-tab')) {
      e.preventDefault()
      const direction = e.shiftKey ? -1 : 1
      this.focusNextElement(direction)
    }
  }

  private handleArrowNavigation(e: KeyboardEvent) {
    const target = e.target as HTMLElement

    // Handle custom arrow navigation for specific components
    if (target.closest('[data-arrow-navigation]')) {
      e.preventDefault()
      const navigationType = target.closest('[data-arrow-navigation]')?.getAttribute('data-arrow-navigation')

      switch (navigationType) {
        case 'gallery':
          this.navigateGallery(e.key)
          break
        case 'menu':
          this.navigateMenu(e.key)
          break
      }
    }
  }

  private focusNextElement(direction: number) {
    const currentIndex = this.focusableElements.indexOf(document.activeElement as HTMLElement)
    const nextIndex = currentIndex + direction

    if (nextIndex >= 0 && nextIndex < this.focusableElements.length) {
      this.focusableElements[nextIndex].focus()
    }
  }

  private handleFocusIn(e: FocusEvent) {
    const target = e.target as HTMLElement

    // Skip focus management for certain elements
    if (target.hasAttribute('data-no-focus-manage')) {
      return
    }

    // Update current focus index
    this.currentFocusIndex = this.focusableElements.indexOf(target)
  }

  private navigateGallery(key: string) {
    // Custom gallery navigation logic
    const galleryEvent = new CustomEvent('accessibility:gallery-navigate', {
      detail: { key }
    })
    document.dispatchEvent(galleryEvent)
  }

  private navigateMenu(key: string) {
    // Custom menu navigation logic
    const menuEvent = new CustomEvent('accessibility:menu-navigate', {
      detail: { key }
    })
    document.dispatchEvent(menuEvent)
  }

  /**
   * Announce content changes to screen readers
   */
  announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.options.enableScreenReader || typeof window === 'undefined') return

    const id = `sr-announce-${Date.now()}-${Math.random()}`
    this.announcedElements.add(id)

    // Create or update live region
    let liveRegion = document.getElementById('sr-live-region')
    if (!liveRegion) {
      liveRegion = document.createElement('div')
      liveRegion.id = 'sr-live-region'
      liveRegion.setAttribute('aria-live', priority)
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.className = 'sr-only'
      document.body.appendChild(liveRegion)
    }

    liveRegion.textContent = message

    // Clear announcement after a delay
    setTimeout(() => {
      if (liveRegion && liveRegion.textContent === message) {
        liveRegion.textContent = ''
      }
      this.announcedElements.delete(id)
    }, 1000)
  }

  /**
   * Generate accessible IDs for elements
   */
  generateAccessibleId(prefix: string = 'accessible'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Check color contrast ratio
   */
  checkColorContrast(foreground: string, background: string): number {
    if (!this.options.enableColorContrast) return 1

    // Simple contrast ratio calculation
    // In a real implementation, you'd use a proper color library
    const getLuminance = (color: string): number => {
      // Simplified luminance calculation
      return 0.5 // Placeholder
    }

    const l1 = getLuminance(foreground)
    const l2 = getLuminance(background)

    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)

    return (lighter + 0.05) / (darker + 0.05)
  }

  /**
   * Ensure minimum color contrast
   */
  ensureColorContrast(element: HTMLElement, minRatio: number = 4.5) {
    if (!this.options.enableColorContrast) return

    const styles = window.getComputedStyle(element)
    const foreground = styles.color
    const background = styles.backgroundColor

    const ratio = this.checkColorContrast(foreground, background)

    if (ratio < minRatio) {
      console.warn(`Color contrast ratio ${ratio.toFixed(2)} is below WCAG AA standard (${minRatio})`, element)
    }
  }

  /**
   * Setup focus trap for modal dialogs
   */
  setupFocusTrap(container: HTMLElement) {
    if (typeof window === 'undefined') return () => {}

    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }

  /**
   * Create accessible button props
   */
  getAccessibleButtonProps(options: {
    onClick?: () => void
    disabled?: boolean
    ariaLabel?: string
    ariaDescribedBy?: string
  } = {}) {
    return {
      onClick: options.onClick,
      disabled: options.disabled,
      'aria-label': options.ariaLabel,
      'aria-describedby': options.ariaDescribedBy,
      role: 'button'
    }
  }

  /**
   * Create accessible form props
   */
  getAccessibleFormProps(options: {
    onSubmit?: () => void
    ariaLabel?: string
    ariaDescribedBy?: string
  } = {}) {
    return {
      onSubmit: options.onSubmit,
      'aria-label': options.ariaLabel,
      'aria-describedby': options.ariaDescribedBy,
      role: 'form'
    }
  }

  /**
   * Create accessible modal props
   */
  getAccessibleModalProps(options: {
    isOpen: boolean
    onClose?: () => void
    ariaLabel?: string
    ariaDescribedBy?: string
  }) {
    return {
      'aria-hidden': !options.isOpen,
      'aria-label': options.ariaLabel,
      'aria-describedby': options.ariaDescribedBy,
      'aria-modal': options.isOpen,
      role: 'dialog'
    }
  }

  /**
   * Announce price changes for screen readers
   */
  announcePriceChange(oldPrice: number, newPrice: number, currency: string = 'USD') {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    })

    const message = `Price updated from ${formatter.format(oldPrice)} to ${formatter.format(newPrice)}`
    this.announceToScreenReader(message, 'assertive')
  }

  /**
   * Announce stock changes for screen readers
   */
  announceStockChange(availableCount: number, productName: string) {
    const message = `${productName} now has ${availableCount} items available`
    this.announceToScreenReader(message, 'polite')
  }

  /**
   * Setup accessible carousel
   */
  setupAccessibleCarousel(carouselElement: HTMLElement) {
    const slides = carouselElement.querySelectorAll('[data-slide]')
    const indicators = carouselElement.querySelectorAll('[data-slide-indicator]')

    slides.forEach((slide, index) => {
      slide.setAttribute('aria-label', `Slide ${index + 1} of ${slides.length}`)
      slide.setAttribute('role', 'group')
    })

    indicators.forEach((indicator, index) => {
      indicator.setAttribute('aria-label', `Go to slide ${index + 1}`)
      indicator.setAttribute('aria-controls', `slide-${index}`)
    })
  }

  /**
   * Setup accessible image gallery
   */
  setupAccessibleImageGallery(galleryElement: HTMLElement) {
    const images = galleryElement.querySelectorAll('img')
    const navigationButtons = galleryElement.querySelectorAll('[data-gallery-nav]')

    images.forEach((img, index) => {
      img.setAttribute('aria-label', `Product image ${index + 1} of ${images.length}`)
    })

    navigationButtons.forEach(button => {
      const direction = button.getAttribute('data-gallery-nav')
      button.setAttribute('aria-label', `View ${direction} image`)
    })
  }
}

// Export singleton instance
export const accessibilityService = AccessibilityService.getInstance()

// React hook for accessibility features
export function useAccessibility(options?: AccessibilityOptions) {
  const service = AccessibilityService.getInstance(options)

  return {
    announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') =>
      service.announceToScreenReader(message, priority),

    generateAccessibleId: (prefix?: string) =>
      service.generateAccessibleId(prefix),

    checkColorContrast: (foreground: string, background: string) =>
      service.checkColorContrast(foreground, background),

    setupFocusTrap: (container: HTMLElement) =>
      service.setupFocusTrap(container),

    getAccessibleButtonProps: (options: any) =>
      service.getAccessibleButtonProps(options),

    getAccessibleFormProps: (options: any) =>
      service.getAccessibleFormProps(options),

    getAccessibleModalProps: (options: any) =>
      service.getAccessibleModalProps(options),

    announcePriceChange: (oldPrice: number, newPrice: number, currency?: string) =>
      service.announcePriceChange(oldPrice, newPrice, currency),

    announceStockChange: (availableCount: number, productName: string) =>
      service.announceStockChange(availableCount, productName),

    setupAccessibleCarousel: (element: HTMLElement) =>
      service.setupAccessibleCarousel(element),

    setupAccessibleImageGallery: (element: HTMLElement) =>
      service.setupAccessibleImageGallery(element)
  }
}