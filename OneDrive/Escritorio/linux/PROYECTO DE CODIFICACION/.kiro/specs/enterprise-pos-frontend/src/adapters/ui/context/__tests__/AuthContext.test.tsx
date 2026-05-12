/**
 * AuthContext Unit Tests
 * 
 * Tests for auth reducer logic and session management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authReducer, AuthState, AuthAction, SessionStorage } from '../AuthContext';
import type { User, Permission } from '../../../../domain/entities/User';

describe('AuthContext - authReducer', () => {
  const mockUser: User = {
    id: 'user-1',
    username: 'testuser',
    role: 'cashier',
    createdAt: new Date('2024-01-01'),
  };

  const mockPermissions: Permission[] = ['sales:create', 'sales:view'];

  const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    permissions: [],
    isLoading: false,
    error: null,
  };

  describe('LOGIN_START', () => {
    it('should set loading to true and clear error', () => {
      const stateWithError: AuthState = {
        ...initialState,
        error: 'Previous error',
      };

      const action: AuthAction = {
        type: 'LOGIN_START',
      };

      const newState = authReducer(stateWithError, action);

      expect(newState.isLoading).toBe(true);
      expect(newState.error).toBeNull();
    });
  });

  describe('LOGIN_SUCCESS', () => {
    it('should set user, permissions, and authenticated state', () => {
      const action: AuthAction = {
        type: 'LOGIN_SUCCESS',
        payload: {
          user: mockUser,
          permissions: mockPermissions,
        },
      };

      const newState = authReducer(initialState, action);

      expect(newState.user).toEqual(mockUser);
      expect(newState.permissions).toEqual(mockPermissions);
      expect(newState.isAuthenticated).toBe(true);
      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBeNull();
    });

    it('should clear loading and error states', () => {
      const stateWithLoadingAndError: AuthState = {
        ...initialState,
        isLoading: true,
        error: 'Some error',
      };

      const action: AuthAction = {
        type: 'LOGIN_SUCCESS',
        payload: {
          user: mockUser,
          permissions: mockPermissions,
        },
      };

      const newState = authReducer(stateWithLoadingAndError, action);

      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBeNull();
    });
  });

  describe('LOGIN_FAILURE', () => {
    it('should set error and clear user data', () => {
      const stateWithUser: AuthState = {
        ...initialState,
        user: mockUser,
        permissions: mockPermissions,
        isAuthenticated: true,
        isLoading: true,
      };

      const action: AuthAction = {
        type: 'LOGIN_FAILURE',
        payload: {
          error: 'Invalid credentials',
        },
      };

      const newState = authReducer(stateWithUser, action);

      expect(newState.user).toBeNull();
      expect(newState.permissions).toEqual([]);
      expect(newState.isAuthenticated).toBe(false);
      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBe('Invalid credentials');
    });
  });

  describe('LOGOUT', () => {
    it('should reset state to initial values', () => {
      const authenticatedState: AuthState = {
        user: mockUser,
        permissions: mockPermissions,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

      const action: AuthAction = {
        type: 'LOGOUT',
      };

      const newState = authReducer(authenticatedState, action);

      expect(newState).toEqual(initialState);
    });
  });

  describe('RESTORE_SESSION', () => {
    it('should restore user and permissions from session', () => {
      const action: AuthAction = {
        type: 'RESTORE_SESSION',
        payload: {
          user: mockUser,
          permissions: mockPermissions,
        },
      };

      const newState = authReducer(initialState, action);

      expect(newState.user).toEqual(mockUser);
      expect(newState.permissions).toEqual(mockPermissions);
      expect(newState.isAuthenticated).toBe(true);
      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBeNull();
    });
  });

  describe('UPDATE_USER', () => {
    it('should update user data', () => {
      const authenticatedState: AuthState = {
        ...initialState,
        user: mockUser,
        isAuthenticated: true,
      };

      const updatedUser: User = {
        ...mockUser,
        username: 'updateduser',
      };

      const action: AuthAction = {
        type: 'UPDATE_USER',
        payload: {
          user: updatedUser,
        },
      };

      const newState = authReducer(authenticatedState, action);

      expect(newState.user).toEqual(updatedUser);
      expect(newState.isAuthenticated).toBe(true);
    });
  });

  describe('SET_ERROR', () => {
    it('should set error message and stop loading', () => {
      const stateWithLoading: AuthState = {
        ...initialState,
        isLoading: true,
      };

      const action: AuthAction = {
        type: 'SET_ERROR',
        payload: {
          error: 'Network error',
        },
      };

      const newState = authReducer(stateWithLoading, action);

      expect(newState.error).toBe('Network error');
      expect(newState.isLoading).toBe(false);
    });

    it('should clear error when payload is null', () => {
      const stateWithError: AuthState = {
        ...initialState,
        error: 'Previous error',
      };

      const action: AuthAction = {
        type: 'SET_ERROR',
        payload: {
          error: null,
        },
      };

      const newState = authReducer(stateWithError, action);

      expect(newState.error).toBeNull();
    });
  });
});

describe('SessionStorage', () => {
  const mockUser: User = {
    id: 'user-1',
    username: 'testuser',
    role: 'cashier',
    createdAt: new Date('2024-01-01'),
  };

  const mockPermissions: Permission[] = ['sales:create', 'sales:view'];

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Mock Date.now for consistent testing
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('save', () => {
    it('should save session data to localStorage', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      SessionStorage.save(mockUser, mockPermissions);

      const savedSession = localStorage.getItem('pos_auth_session');
      const savedExpiry = localStorage.getItem('pos_auth_expiry');

      expect(savedSession).toBeTruthy();
      expect(savedExpiry).toBeTruthy();

      const sessionData = JSON.parse(savedSession!);
      expect(sessionData.user.id).toBe(mockUser.id);
      expect(sessionData.user.username).toBe(mockUser.username);
      expect(sessionData.user.role).toBe(mockUser.role);
      expect(sessionData.permissions).toEqual(mockPermissions);
      expect(sessionData.expiresAt).toBe(now + 30 * 60 * 1000);
    });
  });

  describe('restore', () => {
    it('should restore valid session from localStorage', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      SessionStorage.save(mockUser, mockPermissions);

      const restoredSession = SessionStorage.restore();

      expect(restoredSession).toBeTruthy();
      expect(restoredSession?.user.id).toBe(mockUser.id);
      expect(restoredSession?.user.username).toBe(mockUser.username);
      expect(restoredSession?.user.role).toBe(mockUser.role);
      expect(restoredSession?.permissions).toEqual(mockPermissions);
    });

    it('should return null if no session exists', () => {
      const restoredSession = SessionStorage.restore();

      expect(restoredSession).toBeNull();
    });

    it('should return null and clear session if expired', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      SessionStorage.save(mockUser, mockPermissions);

      // Advance time by 31 minutes (past expiry)
      vi.setSystemTime(now + 31 * 60 * 1000);

      const restoredSession = SessionStorage.restore();

      expect(restoredSession).toBeNull();
      expect(localStorage.getItem('pos_auth_session')).toBeNull();
    });

    it('should handle corrupted session data', () => {
      localStorage.setItem('pos_auth_session', 'invalid json');

      const restoredSession = SessionStorage.restore();

      expect(restoredSession).toBeNull();
    });
  });

  describe('clear', () => {
    it('should remove session data from localStorage', () => {
      SessionStorage.save(mockUser, mockPermissions);

      expect(localStorage.getItem('pos_auth_session')).toBeTruthy();
      expect(localStorage.getItem('pos_auth_expiry')).toBeTruthy();

      SessionStorage.clear();

      expect(localStorage.getItem('pos_auth_session')).toBeNull();
      expect(localStorage.getItem('pos_auth_expiry')).toBeNull();
    });
  });

  describe('isExpired', () => {
    it('should return false for valid session', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      SessionStorage.save(mockUser, mockPermissions);

      expect(SessionStorage.isExpired()).toBe(false);
    });

    it('should return true for expired session', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      SessionStorage.save(mockUser, mockPermissions);

      // Advance time by 31 minutes
      vi.setSystemTime(now + 31 * 60 * 1000);

      expect(SessionStorage.isExpired()).toBe(true);
    });

    it('should return true if no session exists', () => {
      expect(SessionStorage.isExpired()).toBe(true);
    });
  });

  describe('refresh', () => {
    it('should extend session expiry time', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      SessionStorage.save(mockUser, mockPermissions);

      // Advance time by 15 minutes
      vi.setSystemTime(now + 15 * 60 * 1000);

      SessionStorage.refresh();

      const savedExpiry = localStorage.getItem('pos_auth_expiry');
      const expiresAt = parseInt(savedExpiry!, 10);

      // Should be 30 minutes from current time (15 + 30 = 45 minutes from original)
      expect(expiresAt).toBe(now + 45 * 60 * 1000);
    });

    it('should handle missing session gracefully', () => {
      expect(() => SessionStorage.refresh()).not.toThrow();
    });
  });
});
