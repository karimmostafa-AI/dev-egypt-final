/**
 * Login Page Test Suite
 * Tests login functionality, validation, and user interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoginPage from '../page';
import { useAuth } from '@/hooks/useAuth';

// Mock the useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock MainLayout component
vi.mock('@/components/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>,
}));

describe('LoginPage', () => {
  const mockLogin = vi.fn();
  const mockUseAuth = useAuth as any;

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      auth: {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      },
      login: mockLogin,
    });
  });

  describe('Initial Render', () => {
    it('renders login form correctly', () => {
      render(<LoginPage />);

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your account to continue shopping')).toBeInTheDocument();
      expect(screen.getAllByText('Sign In')).toHaveLength(2); // Card title and button
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('displays forgot password link', () => {
      render(<LoginPage />);

      expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    });

    it('displays registration link', () => {
      render(<LoginPage />);

      expect(screen.getByText(/Don't have an account?/i)).toBeInTheDocument();
      expect(screen.getByText(/Create one here/i)).toBeInTheDocument();
    });

    it('displays guest checkout option', () => {
      render(<LoginPage />);

      expect(screen.getByText(/Shopping without an account?/i)).toBeInTheDocument();
      expect(screen.getByText(/Continue as guest/i)).toBeInTheDocument();
    });
  });

  describe('Form Elements', () => {
    it('has proper form structure', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('has required field validation', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toBeRequired();
      expect(passwordInput).toBeRequired();
    });
  });

  describe('Authentication Integration', () => {
    it('shows loading state when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        auth: {
          user: null,
          isAuthenticated: false,
          isLoading: true,
          error: null,
        },
        login: mockLogin,
      });

      render(<LoginPage />);

      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
    });

    it('displays authentication errors', () => {
      mockUseAuth.mockReturnValue({
        auth: {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Invalid credentials',
        },
        login: mockLogin,
      });

      render(<LoginPage />);

      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('has proper input types', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('UI Components', () => {
    it('renders main layout wrapper', () => {
      render(<LoginPage />);

      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(<LoginPage />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome Back');
    });
  });
});