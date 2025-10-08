/**
 * Accessibility utilities for the product catalog
 */

/**
 * Manages focus trap for modal dialogs and drawers
 */
export class FocusTrap {
  private element: HTMLElement;
  private focusableElements: HTMLElement[];
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;
  private previousActiveElement: Element | null = null;

  constructor(element: HTMLElement) {
    this.element = element;
    this.focusableElements = [];
    this.updateFocusableElements();
  }

  private updateFocusableElements() {
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    this.focusableElements = Array.from(
      this.element.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];

    this.firstFocusable = this.focusableElements[0] || null;
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1] || null;
  }

  activate() {
    this.previousActiveElement = document.activeElement;
    this.updateFocusableElements();
    
    if (this.firstFocusable) {
      this.firstFocusable.focus();
    }

    document.addEventListener('keydown', this.handleKeyDown);
  }

  deactivate() {
    document.removeEventListener('keydown', this.handleKeyDown);
    
    if (this.previousActiveElement && 'focus' in this.previousActiveElement) {
      (this.previousActiveElement as HTMLElement).focus();
    }
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    if (this.focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstFocusable) {
        event.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === this.lastFocusable) {
        event.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  };
}

/**
 * Announces messages to screen readers
 */
export class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer;
  private liveRegion: HTMLElement;

  private constructor() {
    this.liveRegion = this.createLiveRegion();
  }

  static getInstance(): ScreenReaderAnnouncer {
    if (!ScreenReaderAnnouncer.instance) {
      ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer();
    }
    return ScreenReaderAnnouncer.instance;
  }

  private createLiveRegion(): HTMLElement {
    const existing = document.getElementById('screen-reader-announcer');
    if (existing) return existing;

    const liveRegion = document.createElement('div');
    liveRegion.id = 'screen-reader-announcer';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    
    document.body.appendChild(liveRegion);
    return liveRegion;
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;
    
    // Clear after announcement to allow repeated messages
    setTimeout(() => {
      this.liveRegion.textContent = '';
    }, 1000);
  }
}

/**
 * Keyboard navigation utilities
 */
export const KeyboardNavigation = {
  /**
   * Handle arrow key navigation in a grid
   */
  handleGridNavigation: (
    event: KeyboardEvent,
    currentIndex: number,
    totalItems: number,
    columnsPerRow: number,
    onNavigate: (newIndex: number) => void
  ) => {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
        newIndex = Math.min(currentIndex + 1, totalItems - 1);
        break;
      case 'ArrowLeft':
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'ArrowDown':
        newIndex = Math.min(currentIndex + columnsPerRow, totalItems - 1);
        break;
      case 'ArrowUp':
        newIndex = Math.max(currentIndex - columnsPerRow, 0);
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = totalItems - 1;
        break;
      default:
        return false;
    }

    if (newIndex !== currentIndex) {
      event.preventDefault();
      onNavigate(newIndex);
      return true;
    }

    return false;
  },

  /**
   * Handle list navigation (up/down arrows)
   */
  handleListNavigation: (
    event: KeyboardEvent,
    currentIndex: number,
    totalItems: number,
    onNavigate: (newIndex: number) => void
  ) => {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        newIndex = Math.min(currentIndex + 1, totalItems - 1);
        break;
      case 'ArrowUp':
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = totalItems - 1;
        break;
      default:
        return false;
    }

    if (newIndex !== currentIndex) {
      event.preventDefault();
      onNavigate(newIndex);
      return true;
    }

    return false;
  }
};

/**
 * Generate unique IDs for accessibility
 */
export const generateId = (() => {
  let counter = 0;
  return (prefix: string = 'id') => `${prefix}-${++counter}`;
})();

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Debounce function for accessibility announcements
 */
export const debounceAnnouncement = (() => {
  let timeoutId: NodeJS.Timeout;
  
  return (message: string, delay: number = 500) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      ScreenReaderAnnouncer.getInstance().announce(message);
    }, delay);
  };
})();

/**
 * ARIA attributes helpers
 */
export const AriaHelpers = {
  /**
   * Create ARIA attributes for expandable sections
   */
  expandable: (isExpanded: boolean, controlsId?: string) => ({
    'aria-expanded': isExpanded,
    ...(controlsId && { 'aria-controls': controlsId })
  }),

  /**
   * Create ARIA attributes for form validation
   */
  validation: (isInvalid: boolean, errorId?: string) => ({
    'aria-invalid': isInvalid,
    ...(isInvalid && errorId && { 'aria-describedby': errorId })
  }),

  /**
   * Create ARIA attributes for loading states
   */
  loading: (isLoading: boolean, label?: string) => ({
    'aria-busy': isLoading,
    ...(isLoading && label && { 'aria-label': label })
  }),

  /**
   * Create ARIA attributes for selected items
   */
  selection: (isSelected: boolean, isMultiple: boolean = false) => ({
    'aria-selected': isSelected,
    ...(isMultiple && { 'aria-checked': isSelected })
  })
};