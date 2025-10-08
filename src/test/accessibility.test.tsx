/**
 * Accessibility tests for product catalog components
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import type { AxeMatchers } from 'vitest-axe/matchers';
import * as matchers from 'vitest-axe/matchers';
import { FocusTrap, ScreenReaderAnnouncer, KeyboardNavigation, AriaHelpers } from '@/utils/accessibility';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export interface Assertion<T = any> extends AxeMatchers {}
  export interface AsymmetricMatchersContaining extends AxeMatchers {}
}

expect.extend(matchers);


describe('Accessibility Utils', () => {
  describe('FocusTrap', () => {
    let container: HTMLElement;
    let focusTrap: FocusTrap;

    beforeEach(() => {
      container = document.createElement('div');
      container.innerHTML = `
        <button id="btn1">Button 1</button>
        <input id="input1" type="text" />
        <button id="btn2">Button 2</button>
      `;
      document.body.appendChild(container);
      focusTrap = new FocusTrap(container);
    });

    afterEach(() => {
      focusTrap.deactivate();
      document.body.removeChild(container);
    });

    it('should focus first element when activated', () => {
      focusTrap.activate();
      expect(document.activeElement?.id).toBe('btn1');
    });

    it('should trap focus within container', () => {
      focusTrap.activate();
      
      const btn1 = document.getElementById('btn1')!;
      const btn2 = document.getElementById('btn2')!;
      
      btn2.focus();
      
      // Tab from last element should go to first
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(document.activeElement?.id).toBe('btn1');
      
      // Shift+Tab from first element should go to last
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      expect(document.activeElement?.id).toBe('btn2');
    });

    it('should restore focus when deactivated', () => {
      const originalFocus = document.createElement('button');
      document.body.appendChild(originalFocus);
      originalFocus.focus();
      
      focusTrap.activate();
      focusTrap.deactivate();
      
      expect(document.activeElement).toBe(originalFocus);
      document.body.removeChild(originalFocus);
    });
  });

  describe('ScreenReaderAnnouncer', () => {
    let announcer: ScreenReaderAnnouncer;

    beforeEach(() => {
      announcer = ScreenReaderAnnouncer.getInstance();
    });

    it('should create live region in DOM', () => {
      const liveRegion = document.getElementById('screen-reader-announcer');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('should announce messages', async () => {
      announcer.announce('Test message');
      
      const liveRegion = document.getElementById('screen-reader-announcer');
      expect(liveRegion?.textContent).toBe('Test message');
      
      // Should clear after timeout
      await waitFor(() => {
        expect(liveRegion?.textContent).toBe('');
      }, { timeout: 1500 });
    });

    it('should support different priority levels', () => {
      const liveRegion = document.getElementById('screen-reader-announcer');
      
      announcer.announce('Assertive message', 'assertive');
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
      
      announcer.announce('Polite message', 'polite');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('KeyboardNavigation', () => {
    describe('handleGridNavigation', () => {
      const mockNavigate = vi.fn();
      
      beforeEach(() => {
        mockNavigate.mockClear();
      });

      it('should handle arrow key navigation', () => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        
        const result = KeyboardNavigation.handleGridNavigation(
          event,
          0, // current index
          9, // total items
          3, // columns per row
          mockNavigate
        );
        
        expect(result).toBe(true);
        expect(mockNavigate).toHaveBeenCalledWith(1);
      });

      it('should handle grid down navigation', () => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
        
        KeyboardNavigation.handleGridNavigation(
          event,
          0, // current index
          9, // total items
          3, // columns per row
          mockNavigate
        );
        
        expect(mockNavigate).toHaveBeenCalledWith(3);
      });

      it('should handle home and end keys', () => {
        const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
        const endEvent = new KeyboardEvent('keydown', { key: 'End' });
        
        KeyboardNavigation.handleGridNavigation(homeEvent, 5, 9, 3, mockNavigate);
        expect(mockNavigate).toHaveBeenCalledWith(0);
        
        mockNavigate.mockClear();
        
        KeyboardNavigation.handleGridNavigation(endEvent, 5, 9, 3, mockNavigate);
        expect(mockNavigate).toHaveBeenCalledWith(8);
      });

      it('should respect boundaries', () => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
        
        const result = KeyboardNavigation.handleGridNavigation(
          event,
          0, // already at start
          9,
          3,
          mockNavigate
        );
        
        expect(result).toBe(false);
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });

  describe('AriaHelpers', () => {
    it('should create expandable attributes', () => {
      const expanded = AriaHelpers.expandable(true, 'content-id');
      expect(expanded).toEqual({
        'aria-expanded': true,
        'aria-controls': 'content-id'
      });

      const collapsed = AriaHelpers.expandable(false);
      expect(collapsed).toEqual({
        'aria-expanded': false
      });
    });

    it('should create validation attributes', () => {
      const invalid = AriaHelpers.validation(true, 'error-id');
      expect(invalid).toEqual({
        'aria-invalid': true,
        'aria-describedby': 'error-id'
      });

      const valid = AriaHelpers.validation(false);
      expect(valid).toEqual({
        'aria-invalid': false
      });
    });

    it('should create loading attributes', () => {
      const loading = AriaHelpers.loading(true, 'Loading products');
      expect(loading).toEqual({
        'aria-busy': true,
        'aria-label': 'Loading products'
      });

      const notLoading = AriaHelpers.loading(false);
      expect(notLoading).toEqual({
        'aria-busy': false
      });
    });

    it('should create selection attributes', () => {
      const selected = AriaHelpers.selection(true, false);
      expect(selected).toEqual({
        'aria-selected': true
      });

      const multiSelected = AriaHelpers.selection(true, true);
      expect(multiSelected).toEqual({
        'aria-selected': true,
        'aria-checked': true
      });
    });
  });
});

// Mock component for testing accessibility
const MockAccessibleComponent = ({ hasError = false }: { hasError?: boolean }) => (
  <div>
    <h1>Test Component</h1>
    <button aria-label="Test button">Click me</button>
    <input 
      type="text" 
      aria-label="Test input"
      {...AriaHelpers.validation(hasError, hasError ? 'error-msg' : undefined)}
    />
    {hasError && <div id="error-msg" role="alert">Error message</div>}
  </div>
);

describe('Component Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<MockAccessibleComponent />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('should handle error states accessibly', async () => {
    const { container } = render(<MockAccessibleComponent hasError={true} />);
    expect(await axe(container)).toHaveNoViolations();
    
    const input = screen.getByLabelText('Test input');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'error-msg');
    
    const errorMsg = screen.getByRole('alert');
    expect(errorMsg).toBeInTheDocument();
  });
});

// Keyboard navigation integration tests
describe('Keyboard Navigation Integration', () => {
  const TestGridComponent = () => {
    const [focusedIndex, setFocusedIndex] = React.useState(0);
    
    const handleKeyDown = (event: React.KeyboardEvent) => {
      KeyboardNavigation.handleGridNavigation(
        event.nativeEvent,
        focusedIndex,
        9,
        3,
        setFocusedIndex
      );
    };

    return (
      <div onKeyDown={handleKeyDown} role="grid">
        {Array.from({ length: 9 }, (_, i) => (
          <button
            key={i}
            role="gridcell"
            tabIndex={i === focusedIndex ? 0 : -1}
            data-testid={`grid-item-${i}`}
          >
            Item {i}
          </button>
        ))}
      </div>
    );
  };

  it('should navigate grid with arrow keys', async () => {
    const user = userEvent.setup();
    render(<TestGridComponent />);
    
    const firstItem = screen.getByTestId('grid-item-0');
    firstItem.focus();
    
    // Navigate right
    await user.keyboard('{ArrowRight}');
    expect(screen.getByTestId('grid-item-1')).toHaveFocus();
    
    // Navigate down
    await user.keyboard('{ArrowDown}');
    expect(screen.getByTestId('grid-item-4')).toHaveFocus();
  });
});
