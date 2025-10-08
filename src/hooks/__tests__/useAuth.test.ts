import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';

// Mock setTimeout for testing
vi.useFakeTimers();

describe('useAuth', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with unauthenticated state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.auth.user).toBeNull();
    expect(result.current.auth.isAuthenticated).toBe(false);
    expect(result.current.auth.isLoading).toBe(false);
    expect(result.current.auth.error).toBeNull();
  });

  it('should login successfully', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const promise = result.current.login('test@example.com', 'password');
      vi.advanceTimersByTime(1000);
      await promise;
    });

    expect(result.current.auth.isAuthenticated).toBe(true);
    expect(result.current.auth.user).toEqual({
      id: '1',
      email: 'test@example.com',
      name: 'test',
    });
    expect(result.current.auth.error).toBeNull();
  });

  it('should register successfully', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const promise = result.current.register('test@example.com', 'password', 'Test User');
      vi.advanceTimersByTime(1000);
      await promise;
    });

    expect(result.current.auth.isAuthenticated).toBe(true);
    expect(result.current.auth.user).toEqual({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    });
    expect(result.current.auth.error).toBeNull();
  });

  it('should logout successfully', async () => {
    const { result } = renderHook(() => useAuth());

    // Login first
    await act(async () => {
      const promise = result.current.login('test@example.com', 'password');
      vi.advanceTimersByTime(1000);
      await promise;
    });

    expect(result.current.auth.isAuthenticated).toBe(true);

    // Then logout
    await act(async () => {
      const promise = result.current.logout();
      vi.advanceTimersByTime(500);
      await promise;
    });

    expect(result.current.auth.isAuthenticated).toBe(false);
    expect(result.current.auth.user).toBeNull();
    expect(result.current.auth.error).toBeNull();
  });

  it('should handle loading states during login', async () => {
    const { result } = renderHook(() => useAuth());

    let loginPromise: Promise<void>;
    act(() => {
      loginPromise = result.current.login('test@example.com', 'password');
    });

    expect(result.current.auth.isLoading).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await loginPromise;
    });

    expect(result.current.auth.isLoading).toBe(false);
  });

  it('should handle loading states during registration', async () => {
    const { result } = renderHook(() => useAuth());

    let registerPromise: Promise<void>;
    act(() => {
      registerPromise = result.current.register('test@example.com', 'password', 'Test User');
    });

    expect(result.current.auth.isLoading).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await registerPromise;
    });

    expect(result.current.auth.isLoading).toBe(false);
  });

  it('should handle loading states during logout', async () => {
    const { result } = renderHook(() => useAuth());

    // Login first
    await act(async () => {
      const promise = result.current.login('test@example.com', 'password');
      vi.advanceTimersByTime(1000);
      await promise;
    });

    let logoutPromise: Promise<void>;
    act(() => {
      logoutPromise = result.current.logout();
    });

    expect(result.current.auth.isLoading).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(500);
      await logoutPromise;
    });

    expect(result.current.auth.isLoading).toBe(false);
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useAuth());

    // Manually set an error for testing
    act(() => {
      result.current.auth.error = 'Test error';
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.auth.error).toBeNull();
  });

  it('should extract name from email during login', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const promise = result.current.login('john.doe@example.com', 'password');
      vi.advanceTimersByTime(1000);
      await promise;
    });

    expect(result.current.auth.user?.name).toBe('john.doe');
  });

  it('should use provided name during registration', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const promise = result.current.register('test@example.com', 'password', 'John Doe');
      vi.advanceTimersByTime(1000);
      await promise;
    });

    expect(result.current.auth.user?.name).toBe('John Doe');
  });
});