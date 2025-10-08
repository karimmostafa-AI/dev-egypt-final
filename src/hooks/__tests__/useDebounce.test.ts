import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebouncedCallback, useDebouncedState } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('useDebounce', () => {
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 500));
      expect(result.current).toBe('initial');
    });

    it('should debounce value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      expect(result.current).toBe('initial');

      // Change value
      rerender({ value: 'updated', delay: 500 });
      expect(result.current).toBe('initial'); // Should still be initial

      // Fast forward time but not enough
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current).toBe('initial');

      // Fast forward past delay
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current).toBe('updated');
    });

    it('should reset timer on rapid changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      // Rapid changes
      rerender({ value: 'change1', delay: 500 });
      act(() => {
        vi.advanceTimersByTime(300);
      });

      rerender({ value: 'change2', delay: 500 });
      act(() => {
        vi.advanceTimersByTime(300);
      });

      rerender({ value: 'final', delay: 500 });
      
      // Should still be initial since timer keeps resetting
      expect(result.current).toBe('initial');

      // Now let it complete
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe('final');
    });

    it('should handle different delay values', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 100 } }
      );

      rerender({ value: 'updated', delay: 100 });
      
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current).toBe('updated');

      // Change delay
      rerender({ value: 'updated2', delay: 1000 });
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe('updated'); // Should not have changed yet

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe('updated2');
    });
  });

  describe('useDebouncedCallback', () => {
    it('should debounce callback execution', () => {
      const mockCallback = vi.fn();
      const { result } = renderHook(() => 
        useDebouncedCallback(mockCallback, 500)
      );

      // Call multiple times rapidly
      act(() => {
        result.current('arg1');
        result.current('arg2');
        result.current('arg3');
      });

      // Should not have been called yet
      expect(mockCallback).not.toHaveBeenCalled();

      // Fast forward time
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should have been called only once with last arguments
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith('arg3');
    });

    it('should update callback reference', () => {
      const mockCallback1 = vi.fn();
      const mockCallback2 = vi.fn();

      const { result, rerender } = renderHook(
        ({ callback }) => useDebouncedCallback(callback, 500),
        { initialProps: { callback: mockCallback1 } }
      );

      act(() => {
        result.current('test');
      });

      // Change callback before timer expires
      rerender({ callback: mockCallback2 });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should call the new callback
      expect(mockCallback1).not.toHaveBeenCalled();
      expect(mockCallback2).toHaveBeenCalledWith('test');
    });

    it('should cleanup timeout on unmount', () => {
      const mockCallback = vi.fn();
      const { result, unmount } = renderHook(() => 
        useDebouncedCallback(mockCallback, 500)
      );

      act(() => {
        result.current('test');
      });

      unmount();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should not have been called after unmount
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should handle different delay values', () => {
      const mockCallback = vi.fn();
      const { result, rerender } = renderHook(
        ({ delay }) => useDebouncedCallback(mockCallback, delay),
        { initialProps: { delay: 100 } }
      );

      act(() => {
        result.current('test1');
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(mockCallback).toHaveBeenCalledWith('test1');

      // Change delay
      rerender({ delay: 1000 });

      act(() => {
        result.current('test2');
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockCallback).toHaveBeenCalledTimes(1); // Should not have been called again

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenLastCalledWith('test2');
    });
  });

  describe('useDebouncedState', () => {
    it('should return debounced value, setter, and immediate value', () => {
      const { result } = renderHook(() => 
        useDebouncedState('initial', 500)
      );

      const [debouncedValue, setValue, immediateValue] = result.current;

      expect(debouncedValue).toBe('initial');
      expect(immediateValue).toBe('initial');
      expect(typeof setValue).toBe('function');
    });

    it('should update immediate value immediately and debounced value after delay', () => {
      const { result } = renderHook(() => 
        useDebouncedState('initial', 500)
      );

      act(() => {
        const [, setValue] = result.current;
        setValue('updated');
      });

      // Check immediate update
      const [debouncedValue1, , immediateValue1] = result.current;
      expect(immediateValue1).toBe('updated');
      expect(debouncedValue1).toBe('initial'); // Should still be initial

      // Fast forward time
      act(() => {
        vi.advanceTimersByTime(500);
      });

      const [debouncedValue2, , immediateValue2] = result.current;
      expect(debouncedValue2).toBe('updated');
      expect(immediateValue2).toBe('updated');
    });

    it('should handle rapid state changes', () => {
      const { result } = renderHook(() => 
        useDebouncedState('initial', 500)
      );

      act(() => {
        const [, setValue] = result.current;
        setValue('change1');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      act(() => {
        const [, setValue] = result.current;
        setValue('change2');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      act(() => {
        const [, setValue] = result.current;
        setValue('final');
      });

      // Immediate value should be the latest
      const [debouncedValue1, , immediateValue1] = result.current;
      expect(immediateValue1).toBe('final');
      expect(debouncedValue1).toBe('initial'); // Should still be initial

      // Complete the debounce
      act(() => {
        vi.advanceTimersByTime(500);
      });

      const [debouncedValue2, , immediateValue2] = result.current;
      expect(debouncedValue2).toBe('final');
      expect(immediateValue2).toBe('final');
    });

    it('should work with different data types', () => {
      // Test with numbers
      const { result: numberResult } = renderHook(() => 
        useDebouncedState(0, 500)
      );

      act(() => {
        const [, setValue] = numberResult.current;
        setValue(42);
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      const [numberValue] = numberResult.current;
      expect(numberValue).toBe(42);

      // Test with objects
      const { result: objectResult } = renderHook(() => 
        useDebouncedState({ count: 0 }, 500)
      );

      act(() => {
        const [, setValue] = objectResult.current;
        setValue({ count: 5 });
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      const [objectValue] = objectResult.current;
      expect(objectValue).toEqual({ count: 5 });

      // Test with arrays
      const { result: arrayResult } = renderHook(() => 
        useDebouncedState([] as string[], 500)
      );

      act(() => {
        const [, setValue] = arrayResult.current;
        setValue(['item1', 'item2']);
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      const [arrayValue] = arrayResult.current;
      expect(arrayValue).toEqual(['item1', 'item2']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero delay', () => {
      const { result } = renderHook(() => useDebounce('initial', 0));

      expect(result.current).toBe('initial');
    });

    it('should handle negative delay', () => {
      const mockCallback = vi.fn();
      const { result } = renderHook(() => 
        useDebouncedCallback(mockCallback, -100)
      );

      act(() => {
        result.current('test');
      });

      // Should still work (setTimeout handles negative delays as 0)
      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(mockCallback).toHaveBeenCalledWith('test');
    });

    it('should handle very large delays', () => {
      const { result } = renderHook(() => useDebounce('initial', 999999));

      // Should not cause any issues
      expect(result.current).toBe('initial');
    });
  });
});