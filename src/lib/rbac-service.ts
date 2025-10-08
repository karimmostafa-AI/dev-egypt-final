// Role-Based Access Control (RBAC) Service
// Manages permissions and access control throughout the application

import { adminAuthService, type Permission } from './admin-auth-service';

export type Resource = 'products' | 'orders' | 'customers' | 'settings' | 'analytics' | 'categories' | 'reports' | 'dashboard';
export type Action = 'view' | 'create' | 'update' | 'delete';

export interface RBACRule {
  resource: Resource;
  action: Action;
  roles: ('admin' | 'manager' | 'staff' | 'customer')[];
  conditions?: {
    ownership?: boolean; // User can only access their own resources
    status?: string[]; // Resource must have specific status
    custom?: (context: any) => boolean; // Custom condition function
  };
}

export interface AccessContext {
  userId?: string;
  userRole?: 'admin' | 'manager' | 'staff' | 'customer';
  resourceId?: string;
  resourceOwnerId?: string;
  resourceStatus?: string;
  additionalData?: Record<string, any>;
}

// Default RBAC rules for the e-commerce application
const DEFAULT_RBAC_RULES: RBACRule[] = [
  // Products
  { resource: 'products', action: 'view', roles: ['admin', 'manager', 'staff', 'customer'] },
  { resource: 'products', action: 'create', roles: ['admin', 'manager'] },
  { resource: 'products', action: 'update', roles: ['admin', 'manager'] },
  { resource: 'products', action: 'delete', roles: ['admin'] },

  // Orders
  { resource: 'orders', action: 'view', roles: ['admin', 'manager', 'staff'] },
  { resource: 'orders', action: 'create', roles: ['admin', 'manager', 'staff'] },
  { resource: 'orders', action: 'update', roles: ['admin', 'manager', 'staff'] },
  { resource: 'orders', action: 'delete', roles: ['admin'] },

  // Customers
  { resource: 'customers', action: 'view', roles: ['admin', 'manager', 'staff'] },
  { resource: 'customers', action: 'create', roles: ['admin', 'manager'] },
  { resource: 'customers', action: 'update', roles: ['admin', 'manager', 'staff'] },
  { resource: 'customers', action: 'delete', roles: ['admin'] },

  // Categories
  { resource: 'categories', action: 'view', roles: ['admin', 'manager', 'staff', 'customer'] },
  { resource: 'categories', action: 'create', roles: ['admin', 'manager'] },
  { resource: 'categories', action: 'update', roles: ['admin', 'manager'] },
  { resource: 'categories', action: 'delete', roles: ['admin'] },

  // Settings
  { resource: 'settings', action: 'view', roles: ['admin', 'manager', 'staff'] },
  { resource: 'settings', action: 'create', roles: ['admin'] },
  { resource: 'settings', action: 'update', roles: ['admin', 'manager'] },
  { resource: 'settings', action: 'delete', roles: ['admin'] },

  // Analytics
  { resource: 'analytics', action: 'view', roles: ['admin', 'manager', 'staff'] },

  // Reports
  { resource: 'reports', action: 'view', roles: ['admin', 'manager', 'staff'] },
  { resource: 'reports', action: 'create', roles: ['admin', 'manager'] },

  // Dashboard
  { resource: 'dashboard', action: 'view', roles: ['admin', 'manager', 'staff'] }
];

export class RBACService {
  private rules: RBACRule[] = [...DEFAULT_RBAC_RULES];

  // Check if user has permission for resource and action
  async hasPermission(
    resource: Resource,
    action: Action,
    context?: AccessContext
  ): Promise<boolean> {
    try {
      // Get current user role
      const roleResponse = await adminAuthService.getCurrentAdmin();

      if (!roleResponse.success || !roleResponse.data) {
        // User is not authenticated as admin, check if they're a customer
        return this.checkCustomerPermission(resource, action);
      }

      const userRole = roleResponse.data.role;
      const userPermissions = roleResponse.data.permissions;

      // Check role-based rules
      const rule = this.rules.find(r => r.resource === resource && r.action === action);

      if (!rule) {
        return false; // No rule defined for this resource/action
      }

      // Check if user's role is allowed
      if (!rule.roles.includes(userRole)) {
        return false;
      }

      // Check conditions if specified
      if (rule.conditions && context) {
        return this.checkConditions(rule.conditions, context);
      }

      // For non-admin roles, also check specific permissions
      if (userRole !== 'admin') {
        return this.checkSpecificPermissions(userPermissions, resource, action);
      }

      return true;
    } catch (error) {
      console.error('RBAC permission check error:', error);
      return false;
    }
  }

  // Check permissions for customer users
  private checkCustomerPermission(resource: Resource, action: Action): boolean {
    // Define what customers can access
    const customerPermissions: Record<Resource, Action[]> = {
      products: ['view'],
      orders: ['view', 'create', 'update'], // Can view/create/update their own orders
      customers: [], // Cannot access customer management
      settings: [], // Cannot access settings
      analytics: [], // Cannot access analytics
      categories: ['view'], // Can view categories
      reports: [], // Cannot access reports
      dashboard: [] // Cannot access admin dashboard
    };

    const allowedActions = customerPermissions[resource] || [];
    return allowedActions.includes(action);
  }

  // Check specific permissions for non-admin roles
  private checkSpecificPermissions(
    userPermissions: Permission[],
    resource: Resource,
    action: Action
  ): boolean {
    const resourcePermission = userPermissions.find(p => p.resource === resource);
    return resourcePermission ? resourcePermission.actions.includes(action) : false;
  }

  // Check rule conditions
  private checkConditions(conditions: RBACRule['conditions'], context: AccessContext): boolean {
    if (!conditions || !context) return true;

    // Check ownership condition
    if (conditions.ownership && context.resourceOwnerId) {
      if (context.userId !== context.resourceOwnerId) {
        return false;
      }
    }

    // Check status condition
    if (conditions.status && context.resourceStatus) {
      if (!conditions.status.includes(context.resourceStatus)) {
        return false;
      }
    }

    // Check custom condition
    if (conditions.custom) {
      try {
        return conditions.custom(context);
      } catch (error) {
        console.error('Custom RBAC condition error:', error);
        return false;
      }
    }

    return true;
  }

  // Get all permissions for a user role
  getPermissionsForRole(role: 'admin' | 'manager' | 'staff' | 'customer'): Permission[] {
    const permissions: Permission[] = [];

    for (const rule of this.rules) {
      if (rule.roles.includes(role)) {
        const existingPermission = permissions.find(p => p.resource === rule.resource);

        if (existingPermission) {
          if (!existingPermission.actions.includes(rule.action as any)) {
            existingPermission.actions.push(rule.action as any);
          }
        } else {
          permissions.push({
            resource: rule.resource,
            actions: [rule.action as any]
          });
        }
      }
    }

    return permissions;
  }

  // Add custom RBAC rule
  addRule(rule: RBACRule): void {
    // Remove existing rule for same resource/action if exists
    this.rules = this.rules.filter(r => !(r.resource === rule.resource && r.action === rule.action));

    // Add new rule
    this.rules.push(rule);
  }

  // Remove RBAC rule
  removeRule(resource: Resource, action: Action): void {
    this.rules = this.rules.filter(r => !(r.resource === resource && r.action === action));
  }

  // Get all rules
  getAllRules(): RBACRule[] {
    return [...this.rules];
  }

  // Check if user can access resource (any action)
  async canAccessResource(resource: Resource, context?: AccessContext): Promise<boolean> {
    const actions: Action[] = ['view', 'create', 'update', 'delete'];

    for (const action of actions) {
      if (await this.hasPermission(resource, action, context)) {
        return true;
      }
    }

    return false;
  }

  // Get accessible resources for current user
  async getAccessibleResources(): Promise<Resource[]> {
    const accessibleResources: Resource[] = [];

    const resources: Resource[] = ['products', 'orders', 'customers', 'settings', 'analytics', 'categories', 'reports', 'dashboard'];

    for (const resource of resources) {
      if (await this.canAccessResource(resource)) {
        accessibleResources.push(resource);
      }
    }

    return accessibleResources;
  }

  // Validate if a set of permissions is valid for a role
  validatePermissionsForRole(role: 'admin' | 'manager' | 'staff', permissions: Permission[]): {
    isValid: boolean;
    errors: string[]
  } {
    const errors: string[] = [];
    const allowedPermissions = this.getPermissionsForRole(role);

    for (const permission of permissions) {
      const allowedPermission = allowedPermissions.find(p => p.resource === permission.resource);

      if (!allowedPermission) {
        errors.push(`Role ${role} cannot have permission for resource ${permission.resource}`);
        continue;
      }

      for (const action of permission.actions) {
        if (!allowedPermission.actions.includes(action)) {
          errors.push(`Role ${role} cannot perform action ${action} on resource ${permission.resource}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Middleware function for protecting API routes
export function requirePermission(resource: Resource, action: Action) {
  return async (context: AccessContext) => {
    const rbacService = new RBACService();
    const hasPermission = await rbacService.hasPermission(resource, action, context);

    if (!hasPermission) {
      throw new Error(`Access denied: ${action} permission required for ${resource}`);
    }
  };
}

// Decorator for protecting methods/functions
export function requiresPermission(resource: Resource, action: Action) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const rbacService = new RBACService();

      // Extract context from arguments or create default context
      const context: AccessContext = args[0] || {};

      const hasPermission = await rbacService.hasPermission(resource, action, context);

      if (!hasPermission) {
        throw new Error(`Access denied: ${action} permission required for ${resource}`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Export singleton instance
export const rbacService = new RBACService();