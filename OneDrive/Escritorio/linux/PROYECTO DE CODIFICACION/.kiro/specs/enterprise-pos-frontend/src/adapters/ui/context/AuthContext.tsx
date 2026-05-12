'use client';

/**
 * AuthContext - React Context for Authentication State Management
 * 
 * Provides authentication state management using React Context and useReducer.
 * Manages user session, authentication status, and permissions.
 * Includes session persistence and restoration.
 * 
 * **Validates: Requirements 9.2, 9.6, 10.1, 10.3**
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { User, Permission } from '../../../domain/entities/User';

/**
 * AuthState Interface
 * Represents the complete authentication state
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  permissions: Permission[];
  isLoading: boolean;
  error: string | null;
}

/**
 * AuthAction Union Type
 * All possible state transitions for authentication
 */
export type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; permissions: Permission[] } }
  | { type: 'LOGIN_FAILURE'; payload: { error: string } }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_SESSION'; payload: { user: User; permissions: Permission[] } }
  | { type: 'UPDATE_USER'; payload: { user: User } }
  | { type: 'SET_ERROR'; payload: { error: string | null } };

/**
 * Initial State
 */
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  permissions: [],
  isLoading: false,
  error: null,
};

/**
 * Auth Reducer
 * Handles all authentication state transitions
 */
export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        permissions: action.payload.permissions,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        permissions: [],
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };

    case 'LOGOUT':
      return {
        ...initialState,
      };

    case 'RESTORE_SESSION':
      return {
        ...state,
        user: action.payload.user,
        permissions: action.payload.permissions,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload.user,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload.error,
        isLoading: false,
      };

    default:
      return state;
  }
}

/**
 * Session Storage Keys
 */
const SESSION_STORAGE_KEY = 'pos_auth_session';
const SESSION_EXPIRY_KEY = 'pos_auth_expiry';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Session Data Interface
 */
interface SessionData {
  user: User;
  permissions: Permission[];
  expiresAt: number;
}

/**
 * Session Persistence Utilities
 */
export const SessionStorage = {
  /**
   * Save session to localStorage
   */
  save(user: User, permissions: Permission[]): void {
    const expiresAt = Date.now() + SESSION_TIMEOUT_MS;
    const sessionData: SessionData = {
      user,
      permissions,
      expiresAt,
    };
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      localStorage.setItem(SESSION_EXPIRY_KEY, expiresAt.toString());
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  },

  /**
   * Restore session from localStorage
   */
  restore(): SessionData | null {
    try {
      const sessionJson = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionJson) {
        return null;
      }

      const sessionData: SessionData = JSON.parse(sessionJson);

      // Check if session has expired
      if (Date.now() > sessionData.expiresAt) {
        this.clear();
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error('Failed to restore session:', error);
      return null;
    }
  },

  /**
   * Clear session from localStorage
   */
  clear(): void {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(SESSION_EXPIRY_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  },

  /**
   * Check if session is expired
   */
  isExpired(): boolean {
    try {
      const expiryStr = localStorage.getItem(SESSION_EXPIRY_KEY);
      if (!expiryStr) {
        return true;
      }
      const expiresAt = parseInt(expiryStr, 10);
      return Date.now() > expiresAt;
    } catch (error) {
      return true;
    }
  },

  /**
   * Refresh session expiry time
   */
  refresh(): void {
    try {
      const sessionJson = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionJson) {
        return;
      }

      const sessionData: SessionData = JSON.parse(sessionJson);
      const newExpiresAt = Date.now() + SESSION_TIMEOUT_MS;
      sessionData.expiresAt = newExpiresAt;

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      localStorage.setItem(SESSION_EXPIRY_KEY, newExpiresAt.toString());
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  },
};

/**
 * AuthContext
 */
export interface AuthContextValue {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  login: (user: User, permissions: Permission[]) => void;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  refreshSession: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * AuthProvider Component
 * Provides authentication state to the component tree
 * Handles session persistence and restoration
 */
export interface AuthProviderProps {
  children: ReactNode;
  initialState?: Partial<AuthState>;
  enableSessionPersistence?: boolean;
}

export function AuthProvider({
  children,
  initialState: customInitialState,
  enableSessionPersistence = true,
}: AuthProviderProps) {
  const [state, dispatch] = useReducer(
    authReducer,
    customInitialState ? { ...initialState, ...customInitialState } : initialState
  );

  // Restore session on mount
  useEffect(() => {
    if (!enableSessionPersistence) {
      return;
    }

    const sessionData = SessionStorage.restore();
    if (sessionData) {
      dispatch({
        type: 'RESTORE_SESSION',
        payload: {
          user: sessionData.user,
          permissions: sessionData.permissions,
        },
      });
    }
  }, [enableSessionPersistence]);

  // Set up session timeout check
  useEffect(() => {
    if (!enableSessionPersistence || !state.isAuthenticated) {
      return;
    }

    const checkInterval = setInterval(() => {
      if (SessionStorage.isExpired()) {
        dispatch({ type: 'LOGOUT' });
        SessionStorage.clear();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [enableSessionPersistence, state.isAuthenticated]);

  // Refresh session on user activity
  useEffect(() => {
    if (!enableSessionPersistence || !state.isAuthenticated) {
      return;
    }

    const handleActivity = () => {
      SessionStorage.refresh();
    };

    // Listen for user activity
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [enableSessionPersistence, state.isAuthenticated]);

  /**
   * Login function
   * Saves session to localStorage
   */
  const login = (user: User, permissions: Permission[]) => {
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user, permissions },
    });

    if (enableSessionPersistence) {
      SessionStorage.save(user, permissions);
    }
  };

  /**
   * Logout function
   * Clears session from localStorage
   */
  const logout = () => {
    dispatch({ type: 'LOGOUT' });

    if (enableSessionPersistence) {
      SessionStorage.clear();
    }
  };

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    return state.permissions.includes(permission);
  };

  /**
   * Manually refresh session expiry
   */
  const refreshSession = () => {
    if (enableSessionPersistence && state.isAuthenticated) {
      SessionStorage.refresh();
    }
  };

  const contextValue: AuthContextValue = {
    state,
    dispatch,
    login,
    logout,
    hasPermission,
    refreshSession,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 * Custom hook to access auth context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
