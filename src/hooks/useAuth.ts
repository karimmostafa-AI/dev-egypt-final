'use client';

import { useState, useEffect, useCallback } from 'react';
import { authService } from '../lib/auth-service';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  emailVerification?: boolean;
  phone?: string;
  phoneVerification?: boolean;
  status?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UseAuthReturn {
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

// Appwrite-integrated authentication hook
export const useAuth = (): UseAuthReturn => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start with loading true to check existing session
    error: null,
  });

  // Initialize auth state - check for existing session via HttpOnly cookie
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Only check for current user in browser environment
        if (typeof window === 'undefined') {
          setAuth(prev => ({
            ...prev,
            isLoading: false,
          }));
          return;
        }

        // Silently check for an authenticated user in the browser
        // Appwrite will manage session cookies automatically
        const userResponse = await authService.getCurrentUser();

        if (userResponse.success && userResponse.data) {
          const user: User = {
            id: userResponse.data.$id,
            email: userResponse.data.email,
            name: userResponse.data.name,
            role: userResponse.data.prefs?.role || 'customer',
            emailVerification: userResponse.data.emailVerification,
            phone: userResponse.data.phone,
            phoneVerification: userResponse.data.phoneVerification,
            status: userResponse.data.status,
          };

          setAuth({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          // No authenticated user - start as guest (normal state)
          setAuth(prev => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        // Silently handle auth errors - guest users are normal
        setAuth(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuth(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('Attempting login with authService...');
      const response = await authService.login({ email, password });
      console.log('Login response:', response);

      if (response.success && response.data) {
        const { user } = response.data;

        setAuth({
          user: {
            id: user.$id,
            email: user.email,
            name: user.name,
            role: user.prefs?.role || 'customer',
            emailVerification: user.emailVerification,
            phone: user.phone,
            phoneVerification: user.phoneVerification,
            status: user.status,
          },
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        console.log('Login successful, user state updated');
      } else {
        setAuth(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Login failed',
        }));
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuth(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
    }
  }, []);

  const logout = useCallback(async () => {
    setAuth(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await authService.logout();

      if (response.success) {
        setAuth({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      } else {
        setAuth(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Logout failed',
        }));
      }
    } catch (error) {
      setAuth(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      }));
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setAuth(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Step 1: Create the user account via API route
      console.log('Creating user account...');
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok || !registerData.success) {
        setAuth(prev => ({
          ...prev,
          isLoading: false,
          error: registerData.error || 'Registration failed',
        }));
        return;
      }

      console.log('Registration successful, now logging in with authService...');

      // Step 2: Check if there's already a session from registration
      // If not, create one via login
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser.success && currentUser.data) {
          // Already have a session from registration, just update state
          console.log('Session already exists from registration');
          const user: User = {
            id: currentUser.data.$id,
            email: currentUser.data.email,
            name: currentUser.data.name,
            role: currentUser.data.prefs?.role || 'customer',
            emailVerification: currentUser.data.emailVerification,
            phone: currentUser.data.phone,
            phoneVerification: currentUser.data.phoneVerification,
            status: currentUser.data.status,
          };

          setAuth({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          console.log('Using existing session from registration');
          return;
        }
      } catch (error) {
        // No session exists, proceed with login
        console.log('No existing session, creating new one');
      }

      // Step 3: Automatically log in the user using browser SDK
      const loginResponse = await authService.login({ email, password });
      console.log('Auto-login response:', loginResponse);

      if (loginResponse.success && loginResponse.data) {
        const { user } = loginResponse.data;

        setAuth({
          user: {
            id: user.$id,
            email: user.email,
            name: user.name,
            role: user.prefs?.role || 'customer',
            emailVerification: user.emailVerification,
            phone: user.phone,
            phoneVerification: user.phoneVerification,
            status: user.status,
          },
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        console.log('Auto-login successful after registration');
      } else {
        // Registration succeeded but login failed
        console.log('Registration succeeded but auto-login failed:', loginResponse.error);
        setAuth(prev => ({
          ...prev,
          isLoading: false,
          error: loginResponse.error || 'Auto-login failed. Please log in manually.',
        }));
      }
    } catch (error) {
      console.error('Registration error:', error);
      setAuth(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      }));
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      console.log('Refreshing user authentication...');
      const response = await authService.getCurrentUser();

      if (response.success && response.data) {
        const user: User = {
          id: response.data.$id,
          email: response.data.email,
          name: response.data.name,
          role: response.data.prefs?.role || 'customer',
          emailVerification: response.data.emailVerification,
          phone: response.data.phone,
          phoneVerification: response.data.phoneVerification,
          status: response.data.status,
        };

        console.log('User refreshed successfully:', user.email, 'Role:', user.role);
        setAuth(prev => ({
          ...prev,
          user,
          isAuthenticated: true,
          error: null,
        }));
      } else {
        console.log('User refresh failed - no authenticated user:', response.error);
        setAuth(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false,
          error: null, // Don't show error for normal unauthenticated state
        }));
      }
    } catch (error) {
      console.error('User refresh error:', error);
      setAuth(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Failed to refresh user',
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setAuth(prev => ({ ...prev, error: null }));
  }, []);

  return {
    auth,
    login,
    logout,
    register,
    clearError,
    refreshUser,
  };
};