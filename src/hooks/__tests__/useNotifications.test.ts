import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../useNotifications';

// Mock setTimeout for testing
vi.useFakeTimers();

describe('useNotifications', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with empty notifications', () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.notifications).toEqual([]);
  });

  it('should add notification', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        type: 'success',
        title: 'Test Notification',
        message: 'This is a test message',
      });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      type: 'success',
      title: 'Test Notification',
      message: 'This is a test message',
    });
    expect(result.current.notifications[0].id).toBeDefined();
    expect(result.current.notifications[0].createdAt).toBeInstanceOf(Date);
  });

  it('should add multiple notifications', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        type: 'success',
        title: 'First Notification',
      });
      result.current.addNotification({
        type: 'error',
        title: 'Second Notification',
      });
    });

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.notifications[0].title).toBe('First Notification');
    expect(result.current.notifications[1].title).toBe('Second Notification');
  });

  it('should remove notification by id', () => {
    const { result } = renderHook(() => useNotifications());

    let notificationId: string;

    act(() => {
      result.current.addNotification({
        type: 'info',
        title: 'Test Notification',
      });
      notificationId = result.current.notifications[0].id;
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      result.current.removeNotification(notificationId);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should clear all notifications', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        type: 'success',
        title: 'First Notification',
      });
      result.current.addNotification({
        type: 'error',
        title: 'Second Notification',
      });
    });

    expect(result.current.notifications).toHaveLength(2);

    act(() => {
      result.current.clearNotifications();
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should auto-remove notification after default duration', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        type: 'success',
        title: 'Auto Remove Test',
      });
    });

    expect(result.current.notifications).toHaveLength(1);

    // Fast-forward time by default duration (5000ms)
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should auto-remove notification after custom duration', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        type: 'success',
        title: 'Custom Duration Test',
        duration: 2000,
      });
    });

    expect(result.current.notifications).toHaveLength(1);

    // Fast-forward time by custom duration (2000ms)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should handle multiple notifications with different durations', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        type: 'success',
        title: 'Short Duration',
        duration: 1000,
      });
      result.current.addNotification({
        type: 'error',
        title: 'Long Duration',
        duration: 3000,
      });
    });

    expect(result.current.notifications).toHaveLength(2);

    // Fast-forward by 1000ms - first notification should be removed
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe('Long Duration');

    // Fast-forward by another 2000ms - second notification should be removed
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should generate unique ids for notifications', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        type: 'success',
        title: 'First Notification',
      });
      result.current.addNotification({
        type: 'success',
        title: 'Second Notification',
      });
    });

    const ids = result.current.notifications.map(n => n.id);
    expect(ids[0]).not.toBe(ids[1]);
    expect(ids[0]).toBeTruthy();
    expect(ids[1]).toBeTruthy();
  });

  it('should handle notification without message', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        type: 'info',
        title: 'Title Only',
      });
    });

    expect(result.current.notifications[0].message).toBeUndefined();
    expect(result.current.notifications[0].title).toBe('Title Only');
  });

  it('should handle all notification types', () => {
    const { result } = renderHook(() => useNotifications());

    const types = ['success', 'error', 'info', 'warning'] as const;

    act(() => {
      types.forEach(type => {
        result.current.addNotification({
          type,
          title: `${type} notification`,
        });
      });
    });

    expect(result.current.notifications).toHaveLength(4);
    types.forEach((type, index) => {
      expect(result.current.notifications[index].type).toBe(type);
    });
  });
});