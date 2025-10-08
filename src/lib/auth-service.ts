// Authentication Service
// Integrates with Appwrite's authentication system

import { account, databases, DATABASE_ID } from './appwrite';
import { ID } from 'appwrite';

// Utility to suppress console errors temporarily
const suppressConsoleError = async <T>(fn: () => Promise<T>): Promise<T> => {
  const originalError = console.error;
  console.error = () => {}; // Suppress errors
  try {
    return await fn();
  } finally {
    console.error = originalError; // Restore console.error
  }
};

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthUser {
  $id: string;
  email: string;
  name: string;
  emailVerification: boolean;
  phone?: string;
  phoneVerification?: boolean;
  registration?: string;
  status?: boolean;
  passwordUpdate?: string;
  prefs?: Record<string, any>;
}

export interface AuthSession {
  $id: string;
  userId: string;
  provider: string;
  providerUid?: string;
  providerAccessToken?: string;
  providerAccessTokenExpiry?: string;
  providerRefreshToken?: string;
  ip?: string;
  osCode?: string;
  osName?: string;
  osVersion?: string;
  clientCode?: string;
  clientName?: string;
  clientVersion?: string;
  clientEngine?: string;
  clientEngineVersion?: string;
  deviceName?: string;
  deviceBrand?: string;
  deviceModel?: string;
  countryCode?: string;
  countryName?: string;
  current: boolean;
  factors?: string[];
  secret?: string;
  mfaUpdatedAt?: string;
}

export interface AuthResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class AuthServiceClass {

  // Login with email and password
  async login(credentials: LoginCredentials): Promise<AuthResponse<{ user: AuthUser; session: AuthSession }>> {
    try {
      console.log('Attempting login for email:', credentials.email);
      
      // Check if there's already an active session
      try {
        const existingUser = await account.get();
        if (existingUser && existingUser.email === credentials.email) {
          console.log('Session already exists for this user');
          const session = await account.getSession('current');
          return {
            success: true,
            data: { user: existingUser, session }
          };
        } else if (existingUser) {
          // Different user is logged in, delete existing session first
          console.log('Different user logged in, deleting old session');
          await account.deleteSession('current');
        }
      } catch (error) {
        // No active session, continue with login
        console.log('No active session found, proceeding with login');
      }
      
      // Create email session
      const session = await account.createEmailPasswordSession(
        credentials.email,
        credentials.password
      );
      console.log('Session created successfully:', session.$id);

      // Get current user
      const user = await account.get();
      console.log('User retrieved after login:', user.$id);

      return {
        success: true,
        data: { user, session }
      };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error code:', (error as any)?.code);
      console.error('Error type:', (error as any)?.type);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  // Register new user
  async register(userData: RegisterData): Promise<AuthResponse<{ user: AuthUser; session: AuthSession }>> {
    try {
      // Create user account
      const user = await account.create(
        ID.unique(),
        userData.email,
        userData.password,
        userData.name
      );

      // Create email session
      const session = await account.createEmailPasswordSession(
        userData.email,
        userData.password
      );

      return {
        success: true,
        data: { user, session }
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  // Logout current user
  async logout(): Promise<AuthResponse<void>> {
    try {
      await account.deleteSession('current');
      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      };
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AuthResponse<AuthUser>> {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return {
          success: false,
          error: 'Cannot get current user in server environment'
        };
      }

      // Get current user - Appwrite handles HttpOnly cookie automatically
      // Suppress console errors since guest/unauthenticated state is normal
      const user = await suppressConsoleError(() => account.get());

      return {
        success: true,
        data: user
      };
    } catch (error: any) {
      // Handle authentication errors gracefully - including missing scopes for guests
      // These are normal for unauthenticated users, so don't log them as errors
      if (error?.code === 401 || error?.message?.includes('missing scopes') || error?.message?.includes('User (role: guests)')) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      // Only log unexpected errors
      console.error('Unexpected error getting current user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get current user'
      };
    }
  }

  // Get current session
  async getCurrentSession(): Promise<AuthResponse<AuthSession>> {
    try {
      const session = await account.getSession('current');
      return {
        success: true,
        data: session
      };
    } catch (error) {
      console.error('Get current session error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get current session'
      };
    }
  }

  // Update user email
  async updateEmail(newEmail: string, password: string): Promise<AuthResponse<AuthUser>> {
    try {
      const user = await account.updateEmail({ email: newEmail, password });
      return {
        success: true,
        data: user
      };
    } catch (error) {
      console.error('Update email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update email'
      };
    }
  }

  // Update user password
  async updatePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResponse<void>> {
    try {
      await account.updatePassword(newPassword);
      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      console.error('Update password error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update password'
      };
    }
  }

  // Update user name
  async updateName(name: string): Promise<AuthResponse<AuthUser>> {
    try {
      const user = await account.updateName(name);
      return {
        success: true,
        data: user
      };
    } catch (error) {
      console.error('Update name error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update name'
      };
    }
  }

  // Update user preferences
  async updatePrefs(prefs: Record<string, any>): Promise<AuthResponse<AuthUser>> {
    try {
      const user = await account.updatePrefs(prefs);
      return {
        success: true,
        data: user
      };
    } catch (error) {
      console.error('Update preferences error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update preferences'
      };
    }
  }

  // Send email verification
  async sendEmailVerification(): Promise<AuthResponse<void>> {
    try {
      await account.createVerification(`${window.location.origin}/verify-email`);
      return {
        success: true,
        data: undefined,
        message: 'Verification email sent'
      };
    } catch (error) {
      console.error('Send email verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send verification email'
      };
    }
  }

  // Confirm email verification
  async confirmEmailVerification(userId: string, secret: string): Promise<AuthResponse<AuthUser>> {
    try {
      const user = await account.updateVerification(userId, secret);
      return {
        success: true,
        data: user as unknown as AuthUser
      };
    } catch (error) {
      console.error('Confirm email verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm email verification'
      };
    }
  }

  // Send password reset email
  async sendPasswordReset(email: string): Promise<AuthResponse<void>> {
    try {
      await account.createRecovery(email, `${window.location.origin}/reset-password`);
      return {
        success: true,
        data: undefined,
        message: 'Password reset email sent'
      };
    } catch (error) {
      console.error('Send password reset error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send password reset email'
      };
    }
  }

  // Confirm password reset
  async confirmPasswordReset(
    userId: string,
    secret: string,
    newPassword: string
  ): Promise<AuthResponse<AuthUser>> {
    try {
      const user = await account.updateRecovery(userId, secret, newPassword);
      return {
        success: true,
        data: user as unknown as AuthUser
      };
    } catch (error) {
      console.error('Confirm password reset error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm password reset'
      };
    }
  }

  // List user sessions
  async listSessions(): Promise<AuthResponse<AuthSession[]>> {
    try {
      const sessions = await account.listSessions();
      return {
        success: true,
        data: sessions.sessions
      };
    } catch (error) {
      console.error('List sessions error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list sessions'
      };
    }
  }

  // Delete session
  async deleteSession(sessionId: string): Promise<AuthResponse<void>> {
    try {
      await account.deleteSession(sessionId);
      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      console.error('Delete session error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete session'
      };
    }
  }

  // Delete all sessions
  async deleteAllSessions(): Promise<AuthResponse<void>> {
    try {
      await account.deleteSessions();
      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      console.error('Delete all sessions error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete all sessions'
      };
    }
  }

  // Create JWT token for user
  async createJWT(): Promise<AuthResponse<{ jwt: string }>> {
    try {
      const token = await account.createJWT();

      return {
        success: true,
        data: { jwt: token.jwt }
      };
    } catch (error) {
      console.error('Create JWT error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create JWT'
      };
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      // Only check authentication in browser environment
      if (typeof window === 'undefined') {
        return false;
      }

      // Try to get current user - Appwrite handles HttpOnly cookie validation
      const userResponse = await this.getCurrentUser();
      return userResponse.success && userResponse.data !== undefined;
    } catch (error: any) {
      // Handle authentication errors gracefully - guests are not authenticated
      return false;
    }
  }

  // Get user role (admin, customer, etc.) from Appwrite preferences
  async getUserRole(userId?: string): Promise<AuthResponse<string>> {
    try {
      const user = await account.get();
      
      // Get role from user preferences
      const role = user.prefs?.role || 'customer';
      
      return {
        success: true,
        data: role
      };
    } catch (error: any) {
      // Handle authentication errors gracefully - including missing scopes for guests
      if (error?.code === 401 || error?.message?.includes('missing scopes') || error?.message?.includes('User (role: guests)')) {
        return {
          success: true,
          data: 'customer'
        };
      }

      console.error('Unexpected error getting user role:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user role'
      };
    }
  }

  // Check if current user is admin
  async isAdmin(): Promise<boolean> {
    const roleResponse = await this.getUserRole();
    return roleResponse.success && roleResponse.data === 'admin';
  }

  // Check if current user is manager
  async isManager(): Promise<boolean> {
    const roleResponse = await this.getUserRole();
    return roleResponse.success && (roleResponse.data === 'admin' || roleResponse.data === 'manager');
  }
}

// Export singleton instance
export const authService = new AuthServiceClass();