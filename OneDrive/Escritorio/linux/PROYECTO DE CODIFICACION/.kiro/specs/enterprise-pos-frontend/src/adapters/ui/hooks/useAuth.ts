/**
 * useAuth Hook
 * 
 * Custom hook for authentication operations that consumes AuthContext.
 * Provides methods for login, logout, and permission checking.
 * Integrates with AuthenticateUserUseCase for business logic.
 * 
 * **Validates: Requirements 2.3, 4.3, 9.2, 9.3, 10.2, 15.4**
 */

'use client';

import { useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import type { User, Permission } from '../../../domain/entities/User';
import { AuthenticateUserUseCase } from '../../../application/use-cases/AuthenticateUserUseCase';

/**
 * useAuth Hook Return Type
 */
export interface UseAuthReturn {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  clearError: () => void;
}

/**
 * useAuth Hook Configuration
 */
export interface UseAuthConfig {
  authenticateUserUseCase: AuthenticateUserUseCase;
}

/**
 * useAuth Hook
 * 
 * Provides access to authentication state and operations.
 * Must be used within an AuthProvider.
 * 
 * @param config - Configuration with use case instance
 * @returns Auth state and operations
 * @throws Error if used outside AuthProvider
 */
export function useAuth(config: UseAuthConfig): UseAuthReturn {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  const { state, dispatch, login: contextLogin, logout: contextLogout, hasPermission: contextHasPermission } = context;
  const { authenticateUserUseCase } = config;
  
  /**
   * Login user
   */
  const login = useCallback(async (username: string, password: string) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const authResult = await authenticateUserUseCase.login(username, password);
      
      // Extract permissions from user role
      // In a real implementation, this would come from the backend
      const permissions: Permission[] = [];
      if (authResult.user.role === 'admin') {
        permissions.push('sales:create', 'inventory:update', 'reports:view', 'customers:manage');
      } else if (authResult.user.role === 'manager') {
        permissions.push('sales:create', 'inventory:update', 'reports:view');
      } else if (authResult.user.role === 'cashier') {
        permissions.push('sales:create');
      }
      
      contextLogin(authResult.user, permissions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: { error: errorMessage } });
    }
  }, [dispatch, contextLogin, authenticateUserUseCase]);
  
  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      await authenticateUserUseCase.logout();
      contextLogout();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      dispatch({ type: 'SET_ERROR', payload: { error: errorMessage } });
    }
  }, [contextLogout, dispatch, authenticateUserUseCase]);
  
  /**
   * Check if user has permission
   */
  const hasPermission = useCallback((permission: Permission): boolean => {
    return contextHasPermission(permission);
  }, [contextHasPermission]);
  
  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: { error: null } });
  }, [dispatch]);
  
  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    logout,
    hasPermission,
    clearError,
  };
}
