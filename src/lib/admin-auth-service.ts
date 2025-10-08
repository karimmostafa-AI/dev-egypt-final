// Admin Authentication Service
// Handles admin-specific authentication and role-based access control

import { authService } from './auth-service';
import { adminUserService } from './appwrite-service';
import { ID } from 'appwrite';

export interface AdminUser {
  $id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'staff';
  permissions: Permission[];
  status: 'active' | 'inactive';
  lastLoginAt?: string;
}

export interface Permission {
  resource: 'products' | 'orders' | 'customers' | 'settings' | 'analytics' | 'categories' | 'reports' | 'dashboard';
  actions: ('view' | 'create' | 'update' | 'delete')[];
}

export interface AdminLoginCredentials {
  email: string;
  password: string;
}

export interface CreateAdminData {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'manager' | 'staff';
  permissions: Permission[];
}

export interface AdminAuthResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class AdminAuthServiceClass {
  // Admin login
  async login(credentials: AdminLoginCredentials): Promise<AdminAuthResponse<{ admin: AdminUser; session: any }>> {
    try {
      // First authenticate the user
      const authResponse = await authService.login(credentials);

      if (!authResponse.success || !authResponse.data) {
        return {
          success: false,
          error: authResponse.error || 'Authentication failed'
        };
      }

      // Check if user is admin
      const roleResponse = await authService.getUserRole();

      if (!roleResponse.success || roleResponse.data === 'customer') {
        // Logout the user since they're not an admin
        await authService.logout();

        return {
          success: false,
          error: 'Access denied. Admin privileges required.'
        };
      }

      // Get admin user details
      const currentUser = authResponse.data.user;
      const adminResponse = await adminUserService.get<AdminUser>(currentUser.$id);

      if (!adminResponse.success || !adminResponse.data) {
        // Logout the user since they're not in admin collection
        await authService.logout();

        return {
          success: false,
          error: 'Admin account not found'
        };
      }

      const admin = adminResponse.data;

      // Check if admin is active
      if (admin.status !== 'active') {
        await authService.logout();

        return {
          success: false,
          error: 'Admin account is inactive'
        };
      }

      // Update last login
      await adminUserService.update<AdminUser>(admin.$id, {
        lastLoginAt: new Date().toISOString()
      });

      return {
        success: true,
        data: {
          admin,
          session: authResponse.data.session
        }
      };
    } catch (error) {
      console.error('Admin login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Admin login failed'
      };
    }
  }

  // Create admin user
  async createAdmin(adminData: CreateAdminData): Promise<AdminAuthResponse<AdminUser>> {
    try {
      // First create the user account
      const authResponse = await authService.register({
        email: adminData.email,
        password: adminData.password,
        name: adminData.name
      });

      if (!authResponse.success || !authResponse.data) {
        return {
          success: false,
          error: authResponse.error || 'Failed to create admin account'
        };
      }

      // Create admin user record
      const adminUser: Omit<AdminUser, '$id' | '$createdAt' | '$updatedAt'> = {
        email: adminData.email,
        name: adminData.name,
        role: adminData.role,
        permissions: adminData.permissions,
        status: 'active',
        lastLoginAt: new Date().toISOString()
      };

      const adminResponse = await adminUserService.create<AdminUser>(adminUser);

      if (!adminResponse.success || !adminResponse.data) {
        return {
          success: false,
          error: adminResponse.error || 'Failed to create admin record'
        };
      }

      return {
        success: true,
        data: adminResponse.data
      };
    } catch (error) {
      console.error('Create admin error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create admin'
      };
    }
  }

  // Get current admin user
  async getCurrentAdmin(): Promise<AdminAuthResponse<AdminUser>> {
    try {
      // First check if user is authenticated
      const userResponse = await authService.getCurrentUser();

      if (!userResponse.success || !userResponse.data) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      // Check if user is admin
      const roleResponse = await authService.getUserRole();

      if (!roleResponse.success || roleResponse.data === 'customer') {
        return {
          success: false,
          error: 'Access denied. Admin privileges required.'
        };
      }

      // Get admin details
      const adminResponse = await adminUserService.get<AdminUser>(userResponse.data.$id);

      if (!adminResponse.success || !adminResponse.data) {
        return {
          success: false,
          error: 'Admin account not found'
        };
      }

      return {
        success: true,
        data: adminResponse.data
      };
    } catch (error) {
      console.error('Get current admin error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get current admin'
      };
    }
  }

  // Update admin permissions
  async updateAdminPermissions(
    adminId: string,
    permissions: Permission[]
  ): Promise<AdminAuthResponse<AdminUser>> {
    try {
      const response = await adminUserService.update<AdminUser>(adminId, {
        permissions
      });

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || 'Failed to update admin permissions'
        };
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Update admin permissions error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update admin permissions'
      };
    }
  }

  // Update admin role
  async updateAdminRole(
    adminId: string,
    role: 'admin' | 'manager' | 'staff'
  ): Promise<AdminAuthResponse<AdminUser>> {
    try {
      const response = await adminUserService.update<AdminUser>(adminId, {
        role
      });

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || 'Failed to update admin role'
        };
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Update admin role error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update admin role'
      };
    }
  }

  // Update admin status
  async updateAdminStatus(
    adminId: string,
    status: 'active' | 'inactive'
  ): Promise<AdminAuthResponse<AdminUser>> {
    try {
      const response = await adminUserService.update<AdminUser>(adminId, {
        status
      });

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || 'Failed to update admin status'
        };
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Update admin status error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update admin status'
      };
    }
  }

  // Delete admin user
  async deleteAdmin(adminId: string): Promise<AdminAuthResponse<void>> {
    try {
      // First delete admin record
      const adminResponse = await adminUserService.delete(adminId);

      if (!adminResponse.success) {
        return {
          success: false,
          error: adminResponse.error || 'Failed to delete admin record'
        };
      }

      // Note: We don't delete the actual user account as they might have customer data
      // In a real application, you might want to disable the account instead

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      console.error('Delete admin error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete admin'
      };
    }
  }

  // Check if current admin has permission for resource and action
  async hasPermission(
    resource: Permission['resource'],
    action: 'view' | 'create' | 'update' | 'delete'
  ): Promise<boolean> {
    try {
      const adminResponse = await this.getCurrentAdmin();

      if (!adminResponse.success || !adminResponse.data) {
        return false;
      }

      const admin = adminResponse.data;

      // Super admin has all permissions
      if (admin.role === 'admin') {
        return true;
      }

      // Check specific permissions
      const resourcePermission = admin.permissions.find(p => p.resource === resource);

      if (!resourcePermission) {
        return false;
      }

      return resourcePermission.actions.includes(action);
    } catch (error) {
      console.error('Check permission error:', error);
      return false;
    }
  }

  // Get all admin users
  async getAllAdmins() {
    try {
      return await adminUserService.list<AdminUser>();
    } catch (error) {
      console.error('Get all admins error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get admin users'
      };
    }
  }

  // Validate admin data
  validateAdminData(data: CreateAdminData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.email || !data.email.includes('@')) {
      errors.push('Valid email is required');
    }

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!data.password || data.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!['admin', 'manager', 'staff'].includes(data.role)) {
      errors.push('Invalid role specified');
    }

    if (!data.permissions || data.permissions.length === 0) {
      errors.push('At least one permission must be specified');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get default permissions for role
  getDefaultPermissions(role: 'admin' | 'manager' | 'staff'): Permission[] {
    switch (role) {
      case 'admin':
        return [
          { resource: 'products', actions: ['view', 'create', 'update', 'delete'] },
          { resource: 'orders', actions: ['view', 'create', 'update', 'delete'] },
          { resource: 'customers', actions: ['view', 'create', 'update', 'delete'] },
          { resource: 'settings', actions: ['view', 'create', 'update', 'delete'] },
          { resource: 'analytics', actions: ['view'] }
        ];

      case 'manager':
        return [
          { resource: 'products', actions: ['view', 'create', 'update'] },
          { resource: 'orders', actions: ['view', 'create', 'update'] },
          { resource: 'customers', actions: ['view', 'create', 'update'] },
          { resource: 'settings', actions: ['view', 'update'] },
          { resource: 'analytics', actions: ['view'] }
        ];

      case 'staff':
        return [
          { resource: 'products', actions: ['view'] },
          { resource: 'orders', actions: ['view', 'create', 'update'] },
          { resource: 'customers', actions: ['view'] },
          { resource: 'analytics', actions: ['view'] }
        ];

      default:
        return [];
    }
  }
}

// Export singleton instance
export const adminAuthService = new AdminAuthServiceClass();