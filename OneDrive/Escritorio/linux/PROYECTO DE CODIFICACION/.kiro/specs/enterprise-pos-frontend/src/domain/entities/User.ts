/**
 * User Entity
 * 
 * Represents a system user with authentication and authorization information.
 * Used for access control and audit trails.
 */

/**
 * User role type
 * - cashier: Can process sales
 * - manager: Can manage inventory and view reports
 * - admin: Full system access
 */
export type UserRole = 'cashier' | 'manager' | 'admin';

/**
 * Permission type
 * Defines specific actions users can perform
 */
export type Permission =
  | 'sales:create'
  | 'sales:view'
  | 'inventory:update'
  | 'inventory:view'
  | 'reports:view'
  | 'reports:export'
  | 'customers:manage'
  | 'customers:view'
  | 'users:manage';

/**
 * User Entity
 * Represents an authenticated system user
 */
export interface User {
  readonly id: string;
  readonly username: string;
  readonly role: UserRole;
  readonly permissions?: Permission[];
  readonly createdAt: Date;
  readonly lastLoginAt?: Date;
}

/**
 * Role-based permission mapping
 * Defines default permissions for each role
 */
export const RolePermissions: Record<UserRole, Permission[]> = {
  cashier: ['sales:create', 'sales:view', 'inventory:view', 'customers:view'],
  manager: [
    'sales:create',
    'sales:view',
    'inventory:update',
    'inventory:view',
    'reports:view',
    'reports:export',
    'customers:manage',
    'customers:view',
  ],
  admin: [
    'sales:create',
    'sales:view',
    'inventory:update',
    'inventory:view',
    'reports:view',
    'reports:export',
    'customers:manage',
    'customers:view',
    'users:manage',
  ],
};
