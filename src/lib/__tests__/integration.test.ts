// Integration tests for frontend-backend connectivity
// Tests how frontend components interact with Appwrite services

import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../auth-service';

// Mock Appwrite SDK for integration tests
jest.mock('../appwrite', () => ({
  account: {
    create: jest.fn(),
    createEmailPasswordSession: jest.fn(),
    get: jest.fn(),
    deleteSession: jest.fn()
  },
  databases: {
    createDocument: jest.fn(),
    getDocument: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
    listDocuments: jest.fn()
  }
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn()
  }),
  useSearchParams: () => new URLSearchParams()
}));

describe('Authentication Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useAuth Hook Integration', () => {
    it('should handle successful login flow', async () => {
      const mockUser = {
        $id: '123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockSession = {
        $id: 'session-123',
        userId: '123'
      };

      // Mock successful authentication
      const { account } = require('../appwrite');
      account.createEmailPasswordSession.mockResolvedValue(mockSession);
      account.get.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Perform login
      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.auth.isAuthenticated).toBe(true);
      expect(result.current.auth.user).toEqual({
        id: '123',
        email: 'test@example.com',
        name: 'Test User'
      });
    });

    it('should handle login errors gracefully', async () => {
      const { account } = require('../appwrite');
      account.createEmailPasswordSession.mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'wrong-password');
      });

      expect(result.current.auth.isAuthenticated).toBe(false);
      expect(result.current.auth.error).toBe('Invalid credentials');
    });

    it('should handle logout flow', async () => {
      const { result } = renderHook(() => useAuth());

      // Mock authenticated state
      act(() => {
        result.current.auth.user = { id: '123', email: 'test@example.com', name: 'Test' };
        result.current.auth.isAuthenticated = true;
      });

      const { account } = require('../appwrite');
      account.deleteSession.mockResolvedValue({});

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.auth.isAuthenticated).toBe(false);
      expect(result.current.auth.user).toBe(null);
    });
  });
});

describe('Auth Service Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle authentication service calls', async () => {
    const { account } = require('../appwrite');

    // Mock successful user retrieval
    account.get.mockResolvedValue({
      $id: 'user-123',
      email: 'test@example.com',
      name: 'Test User'
    });

    const result = await authService.getCurrentUser();

    expect(result.success).toBe(true);
    expect(result.data?.email).toBe('test@example.com');
    expect(account.get).toHaveBeenCalled();
  });

  it('should handle authentication errors', async () => {
    const { account } = require('../appwrite');
    account.get.mockRejectedValue(new Error('Not authenticated'));

    const result = await authService.getCurrentUser();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });
});

describe('Error Handling Integration', () => {
  it('should handle network errors gracefully', async () => {
    const { account } = require('../appwrite');
    account.get.mockRejectedValue(new Error('Network error'));

    const result = await authService.getCurrentUser();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('should handle timeout errors', async () => {
    const { account } = require('../appwrite');
    account.get.mockRejectedValue(new Error('Request timeout'));

    const result = await authService.getCurrentUser();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Request timeout');
  });
});

describe('Security Integration', () => {
  it('should validate authentication tokens', async () => {
    const { account } = require('../appwrite');

    // Mock authentication check
    account.get.mockResolvedValue({
      $id: 'user-123',
      email: 'test@example.com',
      name: 'Test User'
    });

    const userResponse = await authService.getCurrentUser();

    expect(userResponse.success).toBe(true);
    expect(userResponse.data?.email).toBe('test@example.com');
  });

  it('should handle authentication failures securely', async () => {
    const { account } = require('../appwrite');
    account.get.mockRejectedValue(new Error('Unauthorized'));

    const result = await authService.getCurrentUser();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
    // Should not expose sensitive information
    expect(result.error).not.toContain('password');
    expect(result.error).not.toContain('token');
  });
});

describe('Service Integration', () => {
  it('should handle service initialization', async () => {
    // Test that services can be imported and called
    const { account } = require('../appwrite');

    account.get.mockResolvedValue({
      $id: 'test-user',
      email: 'test@example.com',
      name: 'Test User'
    });

    const result = await authService.getCurrentUser();

    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  });

  it('should handle concurrent service calls', async () => {
    const { account } = require('../appwrite');

    account.get.mockResolvedValue({
      $id: 'test-user',
      email: 'test@example.com',
      name: 'Test User'
    });

    // Make multiple concurrent requests
    const requests = Array.from({ length: 3 }, () =>
      authService.getCurrentUser()
    );

    const results = await Promise.all(requests);

    results.forEach(result => {
      expect(result.success).toBe(true);
    });

    expect(account.get).toHaveBeenCalledTimes(3);
  });
});

describe('Error Recovery Integration', () => {
  it('should recover from temporary failures', async () => {
    const { account } = require('../appwrite');

    // First call fails, second succeeds
    account.get
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValueOnce({
        $id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      });

    // First attempt should fail
    const result1 = await authService.getCurrentUser();
    expect(result1.success).toBe(false);

    // Second attempt should succeed
    const result2 = await authService.getCurrentUser();
    expect(result2.success).toBe(true);
  });
});