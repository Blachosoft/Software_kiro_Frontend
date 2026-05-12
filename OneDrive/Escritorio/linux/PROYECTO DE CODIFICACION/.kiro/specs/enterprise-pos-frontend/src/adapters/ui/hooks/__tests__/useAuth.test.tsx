/**
 * useAuth Hook Tests
 * 
 * Component tests for useAuth hook using React Testing Library.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { useAuth } from '../useAuth';
import { AuthProvider } from '../../context/AuthContext';
import { AuthenticateUserUseCase } from '../../../../application/use-cases/AuthenticateUserUseCase';
import type { AuthenticationService, AuthResult } from '../../../../domain/ports/AuthenticationService';
import type { User, Permission } from '../../../../domain/entities/User';

describe('useAuth Hook', () => {
  let mockAuthService: AuthenticationService;
  let authenticateUserUseCase: AuthenticateUserUseCase;
  
  const mockUser: User = {
    id: 'user-1',
    username: 'testuser',
    role: 'cashier',
    createdAt: new Date(),
  };
  
  const mockAuthResult: AuthResult = {
    user: mockUser,
    token: 'test-token',
    expiresAt: new Date(Date.now() + 3600000),
  };
  
  beforeEach(() => {
    mockAuthService = {
      login: vi.fn(),
      logout: vi.fn(),
      getCurrentUser: vi.fn(),
      hasPermission: vi.fn(),
      refreshToken: vi.fn(),
      validateToken: vi.fn(),
    };
    
    authenticateUserUseCase = new AuthenticateUserUseCase(mockAuthService);
  });
  
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider enableSessionPersistence={false}>
      {children}
    </AuthProvider>
  );
  
  it('should throw error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useAuth({ authenticateUserUseCase }));
    }).toThrow('useAuth must be used within an AuthProvider');
    
    consoleError.mockRestore();
  });
  
  it('should return initial state', () => {
    const { result } = renderHook(() => useAuth({ authenticateUserUseCase }), { wrapper });
    
    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });
  
  it('should login successfully', async () => {
    vi.mocked(mockAuthService.login).mockResolvedValue(mockAuthResult);
    
    const { result } = renderHook(() => useAuth({ authenticateUserUseCase }), { wrapper });
    
    await act(async () => {
      await result.current.login('testuser', 'password');
    });
    
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });
  
  it('should handle login error', async () => {
    vi.mocked(mockAuthService.login).mockRejectedValue(new Error('Invalid credentials'));
    
    const { result } = renderHook(() => useAuth({ authenticateUserUseCase }), { wrapper });
    
    await act(async () => {
      await result.current.login('testuser', 'wrongpassword');
    });
    
    await waitFor(() => {
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe('Invalid username or password');
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  it('should logout successfully', async () => {
    vi.mocked(mockAuthService.login).mockResolvedValue(mockAuthResult);
    vi.mocked(mockAuthService.logout).mockResolvedValue();
    
    const { result } = renderHook(() => useAuth({ authenticateUserUseCase }), { wrapper });
    
    // First login
    await act(async () => {
      await result.current.login('testuser', 'password');
    });
    
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
    
    // Then logout
    await act(async () => {
      await result.current.logout();
    });
    
    await waitFor(() => {
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
  
  it('should check permissions for cashier role', async () => {
    vi.mocked(mockAuthService.login).mockResolvedValue(mockAuthResult);
    
    const { result } = renderHook(() => useAuth({ authenticateUserUseCase }), { wrapper });
    
    await act(async () => {
      await result.current.login('testuser', 'password');
    });
    
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
    
    // Cashier should have sales:create permission
    expect(result.current.hasPermission('sales:create')).toBe(true);
    
    // Cashier should not have inventory:update permission
    expect(result.current.hasPermission('inventory:update')).toBe(false);
  });
  
  it('should check permissions for manager role', async () => {
    const managerUser: User = {
      id: 'user-2',
      username: 'manager',
      role: 'manager',
      createdAt: new Date(),
    };
    
    const managerAuthResult: AuthResult = {
      user: managerUser,
      token: 'manager-token',
      expiresAt: new Date(Date.now() + 3600000),
    };
    
    vi.mocked(mockAuthService.login).mockResolvedValue(managerAuthResult);
    
    const { result } = renderHook(() => useAuth({ authenticateUserUseCase }), { wrapper });
    
    await act(async () => {
      await result.current.login('manager', 'password');
    });
    
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
    
    // Manager should have multiple permissions
    expect(result.current.hasPermission('sales:create')).toBe(true);
    expect(result.current.hasPermission('inventory:update')).toBe(true);
    expect(result.current.hasPermission('reports:view')).toBe(true);
    
    // Manager should not have customers:manage permission
    expect(result.current.hasPermission('customers:manage')).toBe(false);
  });
  
  it('should check permissions for admin role', async () => {
    const adminUser: User = {
      id: 'user-3',
      username: 'admin',
      role: 'admin',
      createdAt: new Date(),
    };
    
    const adminAuthResult: AuthResult = {
      user: adminUser,
      token: 'admin-token',
      expiresAt: new Date(Date.now() + 3600000),
    };
    
    vi.mocked(mockAuthService.login).mockResolvedValue(adminAuthResult);
    
    const { result } = renderHook(() => useAuth({ authenticateUserUseCase }), { wrapper });
    
    await act(async () => {
      await result.current.login('admin', 'password');
    });
    
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
    
    // Admin should have all permissions
    expect(result.current.hasPermission('sales:create')).toBe(true);
    expect(result.current.hasPermission('inventory:update')).toBe(true);
    expect(result.current.hasPermission('reports:view')).toBe(true);
    expect(result.current.hasPermission('customers:manage')).toBe(true);
  });
  
  it('should clear error', async () => {
    vi.mocked(mockAuthService.login).mockRejectedValue(new Error('Invalid credentials'));
    
    const { result } = renderHook(() => useAuth({ authenticateUserUseCase }), { wrapper });
    
    // Trigger an error
    await act(async () => {
      await result.current.login('testuser', 'wrongpassword');
    });
    
    await waitFor(() => {
      expect(result.current.error).toBe('Invalid username or password');
    });
    
    // Clear the error
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBe(null);
  });
  
  it('should set loading state during login', async () => {
    let resolveLogin: (value: AuthResult) => void;
    const loginPromise = new Promise<AuthResult>((resolve) => {
      resolveLogin = resolve;
    });
    
    vi.mocked(mockAuthService.login).mockReturnValue(loginPromise);
    
    const { result } = renderHook(() => useAuth({ authenticateUserUseCase }), { wrapper });
    
    act(() => {
      result.current.login('testuser', 'password');
    });
    
    // Should be loading
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });
    
    // Resolve the promise
    await act(async () => {
      resolveLogin(mockAuthResult);
      await loginPromise;
    });
    
    // Should no longer be loading
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  it('should handle logout error', async () => {
    vi.mocked(mockAuthService.login).mockResolvedValue(mockAuthResult);
    vi.mocked(mockAuthService.logout).mockRejectedValue(new Error('Logout failed'));
    
    const { result } = renderHook(() => useAuth({ authenticateUserUseCase }), { wrapper });
    
    // First login
    await act(async () => {
      await result.current.login('testuser', 'password');
    });
    
    // Then try to logout
    await act(async () => {
      await result.current.logout();
    });
    
    await waitFor(() => {
      expect(result.current.error).toBe('Logout failed');
    });
  });
  
  it('should validate empty username', async () => {
    const { result } = renderHook(() => useAuth({ authenticateUserUseCase }), { wrapper });
    
    await act(async () => {
      await result.current.login('', 'password');
    });
    
    await waitFor(() => {
      expect(result.current.error).toBe('Username is required');
    });
  });
  
  it('should validate empty password', async () => {
    const { result } = renderHook(() => useAuth({ authenticateUserUseCase }), { wrapper });
    
    await act(async () => {
      await result.current.login('testuser', '');
    });
    
    await waitFor(() => {
      expect(result.current.error).toBe('Password is required');
    });
  });
});
