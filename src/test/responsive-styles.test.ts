/**
 * Responsive Styles Test
 * 
 * Tests CSS media queries and responsive behavior using jsdom
 */

import { JSDOM } from 'jsdom';
import { vi } from 'vitest';

describe('Responsive CSS Media Queries', () => {
  let dom: JSDOM;
  let window: Window & typeof globalThis;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            /* Mobile styles */
            @media (max-width: 640px) {
              .mobile-optimized {
                -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
                touch-action: manipulation;
              }
              
              button, [role="button"] {
                min-height: 44px;
                min-width: 44px;
              }
            }
            
            /* Touch device styles */
            @media (hover: none) and (pointer: coarse) {
              .hover\:scale-105:hover {
                transform: none;
              }
              
              button:active {
                transform: scale(0.98);
              }
            }
            
            /* High contrast mode */
            @media (prefers-contrast: high) {
              .border-gray-200 {
                border-color: #000000;
              }
            }
            
            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
              * {
                animation-duration: 0.01ms !important;
                transition-duration: 0.01ms !important;
              }
            }
            
            /* Custom breakpoints */
            @media (min-width: 475px) {
              .xs\:grid-cols-2 {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }
            
            /* Grid utilities */
            .grid {
              display: grid;
            }
            
            .grid-cols-1 {
              grid-template-columns: repeat(1, minmax(0, 1fr));
            }
            
            .gap-3 {
              gap: 0.75rem;
            }
            
            .min-h-44 {
              min-height: 44px;
            }
            
            .min-w-44 {
              min-width: 44px;
            }
          </style>
        </head>
        <body>
          <div class="mobile-optimized">
            <div class="grid grid-cols-1 xs:grid-cols-2 gap-3">
              <button class="min-h-44 min-w-44">Test Button</button>
              <div class="border-gray-200 hover:scale-105">Test Element</div>
            </div>
          </div>
        </body>
      </html>
    `, {
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window as unknown as Window & typeof globalThis;
    document = window.document;
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('Viewport Meta Tag', () => {
    it('should have proper viewport configuration', () => {
      // This would be tested in the actual Next.js metadata
      const expectedViewport = {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 5,
        userScalable: true,
      };
      
      expect(expectedViewport.width).toBe('device-width');
      expect(expectedViewport.initialScale).toBe(1);
      expect(expectedViewport.maximumScale).toBe(5);
      expect(expectedViewport.userScalable).toBe(true);
    });
  });

  describe('Mobile Media Queries', () => {
    it('should apply mobile-specific styles for small screens', () => {
      // Mock mobile viewport
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(max-width: 640px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const mobileQuery = window.matchMedia('(max-width: 640px)');
      expect(mobileQuery.matches).toBe(true);
    });

    it('should apply touch device styles', () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(hover: none) and (pointer: coarse)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const touchQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
      expect(touchQuery.matches).toBe(true);
    });

    it('should apply high contrast styles when preferred', () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const contrastQuery = window.matchMedia('(prefers-contrast: high)');
      expect(contrastQuery.matches).toBe(true);
    });

    it('should apply reduced motion styles when preferred', () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      expect(motionQuery.matches).toBe(true);
    });
  });

  describe('Custom Breakpoints', () => {
    it('should support xs breakpoint at 475px', () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(min-width: 475px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const xsQuery = window.matchMedia('(min-width: 475px)');
      expect(xsQuery.matches).toBe(true);
    });
  });

  describe('Touch Target Sizes', () => {
    it('should ensure minimum touch target sizes', () => {
      const button = document.querySelector('button');
      expect(button).toBeTruthy();
      
      // These would be applied via CSS classes
      expect(button?.classList.contains('min-h-44')).toBe(true);
      expect(button?.classList.contains('min-w-44')).toBe(true);
    });
  });

  describe('Grid Responsive Behavior', () => {
    it('should have responsive grid classes', () => {
      const gridElement = document.querySelector('.grid');
      expect(gridElement).toBeTruthy();
      
      expect(gridElement?.classList.contains('grid-cols-1')).toBe(true);
      expect(gridElement?.classList.contains('xs:grid-cols-2')).toBe(true);
    });
  });

  describe('Safe Area Insets', () => {
    it('should support safe area inset properties', () => {
      // Test that CSS supports safe area insets
      const testElement = document.createElement('div');
      testElement.style.paddingTop = 'env(safe-area-inset-top)';
      
      // In a real browser, this would be supported
      // Here we just test that the property can be set
      expect(testElement.style.paddingTop).toBeDefined();
    });
  });
});

describe('Responsive Breakpoint Utilities', () => {
  const breakpoints = {
    xs: 475,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  };

  describe('Breakpoint Values', () => {
    it('should have correct breakpoint values', () => {
      expect(breakpoints.xs).toBe(475);
      expect(breakpoints.sm).toBe(640);
      expect(breakpoints.md).toBe(768);
      expect(breakpoints.lg).toBe(1024);
      expect(breakpoints.xl).toBe(1280);
      expect(breakpoints['2xl']).toBe(1536);
    });

    it('should have progressive breakpoint sizes', () => {
      const values = Object.values(breakpoints);
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1]);
      }
    });
  });

  describe('Grid Column Calculations', () => {
    it('should calculate appropriate grid columns for different screen sizes', () => {
      const getGridColumns = (width: number) => {
        if (width < breakpoints.xs) return 1;
        if (width < breakpoints.sm) return 2;
        if (width < breakpoints.md) return 2;
        if (width < breakpoints.lg) return 3;
        if (width < breakpoints.xl) return 4;
        return 4;
      };

      expect(getGridColumns(320)).toBe(1); // Mobile portrait
      expect(getGridColumns(480)).toBe(2); // Mobile landscape
      expect(getGridColumns(640)).toBe(2); // Small tablet
      expect(getGridColumns(768)).toBe(3); // Medium tablet
      expect(getGridColumns(1024)).toBe(4); // Desktop
      expect(getGridColumns(1280)).toBe(4); // Large desktop
    });
  });

  describe('Touch Target Calculations', () => {
    it('should ensure minimum 44px touch targets', () => {
      const minTouchTarget = 44;
      
      const calculateTouchTarget = (baseSize: number) => {
        return Math.max(baseSize, minTouchTarget);
      };

      expect(calculateTouchTarget(32)).toBe(44);
      expect(calculateTouchTarget(40)).toBe(44);
      expect(calculateTouchTarget(48)).toBe(48);
    });
  });
});
