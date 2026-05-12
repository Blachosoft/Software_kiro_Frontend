/**
 * Unit tests for AuthenticateUserUseCase
 * 
 * Tests authentication and authorization logic with mocked AuthenticationService.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthenticateUserUseCase } from '../AuthenticateUserUseCase';
import type { AuthenticationService, AuthResult } from '../../../domain/ports/AuthenticationService';
import type { User, Permission } from '../../../domain/entities/User';
import { ValidationError, UnauthorizedError } from '../../../domain/errors/DomainError';

describe('AuthenticateUserUseCase', () => {
  let useCase: AuthenticateUserUseCase;
  let mockAuthService: AuthenticationService;

  const mockUser: User = {
    id: 'user-1',
    username: 'testuser',
    role: 'cashier',
    permissions: ['sales:create', 'sales:view'],
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2024-01-15'),
  };

  const mockAuthResult: AuthResult = {
    user: mockUser,
    token: 'mock-jwt-token',
    expiresAt: new Date('2024-01-16'),
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

    useCase = new AuthenticateUserUseCase(mockAuthService);
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      vi.mocked(mockAuthService.login).mockResolvedValue(mockAuthResult);

      const result = await useCase.login('testuser', 'password123');

      expect(result).toEqual(mockAuthResult);
      expect(mockAuthService.login).toHaveBeenCalledWith('testuser', 'password123');
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });

    it('should trim username before login', async () => {
      vi.mocked(mockAuthService.login).mockResolvedValue(mockAuthResult);

      await useCase.login('  testuser  ', 'password123');

      expect(mockAuthService.login).toHaveBeenCalledWith('testuser', 'password123');
    });

    it('should throw ValidationError if username is empty', async () => {
      await expect(useCase.login('', 'password123')).rejects.toThrow(ValidationError);
      await expect(useCase.login('', 'password123')).rejects.toThrow('Username is required');
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if username is only whitespace', async () => {
      await expect(useCase.login('   ', 'password123')).rejects.toThrow(ValidationError);
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if password is empty', async () => {
      await expect(useCase.login('testuser', '')).rejects.toThrow(ValidationError);
      await expect(useCase.login('testuser', '')).rejects.toThrow('Password is required');
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if password is only whitespace', async () => {
      await expect(useCase.login('testuser', '   ')).rejects.toThrow(ValidationError);
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if credentials are invalid', async () => {
      vi.mocked(mockAuthService.login).mockRejectedValue(new Error('Invalid credentials'));

      await expect(useCase.login('testuser', 'wrongpassword')).rejects.toThrow(UnauthorizedError);
      await expect(useCase.login('testuser', 'wrongpassword')).rejects.toThrow(
        'Invalid username or password'
      );
    });

    it('should handle service errors gracefully', async () => {
      vi.mocked(mockAuthService.login).mockRejectedValue(new Error('Service unavailable'));

      await expect(useCase.login('testuser', 'password123')).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      vi.mocked(mockAuthService.logout).mockResolvedValue(undefined);

      await useCase.logout();

      expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
    });

    it('should handle logout errors', async () => {
      vi.mocked(mockAuthService.logout).mockRejectedValue(new Error('Logout failed'));

      await expect(useCase.logout()).rejects.toThrow('Logout failed');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', async () => {
      vi.mocked(mockAuthService.getCurrentUser).mockResolvedValue(mockUser);

      const user = await useCase.getCurrentUser();

      expect(user).toEqual(mockUser);
      expect(mockAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('should return null when not authenticated', async () => {
      vi.mocked(mockAuthService.getCurrentUser).mockResolvedValue(null);

      const user = await useCase.getCurrentUser();

      expect(user).toBeNull();
      expect(mockAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      vi.mocked(mockAuthService.getCurrentUser).mockRejectedValue(
        new Error('Service unavailable')
      );

      await expect(useCase.getCurrentUser()).rejects.toThrow('Service unavailable');
    });
  });

  describe('checkPermission', () => {
    it('should return true when user has permission', async () => {
      vi.mocked(mockAuthService.hasPermission).mockResolvedValue(true);

      const hasPermission = await useCase.checkPermission('sales:create');

      expect(hasPermission).toBe(true);
      expect(mockAuthService.hasPermission).toHaveBeenCalledWith('sales:create');
      expect(mockAuthService.hasPermission).toHaveBeenCalledTimes(1);
    });

    it('should return false when user does not have permission', async () => {
      vi.mocked(mockAuthService.hasPermission).mockResolvedValue(false);

      const hasPermission = await useCase.checkPermission('users:manage');

      expect(hasPermission).toBe(false);
      expect(mockAuthService.hasPermission).toHaveBeenCalledWith('users:manage');
    });

    it('should throw ValidationError if permission is empty', async () => {
      await expect(useCase.checkPermission('' as Permission)).rejects.toThrow(ValidationError);
      await expect(useCase.checkPermission('' as Permission)).rejects.toThrow(
        'Permission is required'
      );
      expect(mockAuthService.hasPermission).not.toHaveBeenCalled();
    });

    it('should check multiple permissions independently', async () => {
      vi.mocked(mockAuthService.hasPermission)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const hasSalesCreate = await useCase.checkPermission('sales:create');
      const hasUsersManage = await useCase.checkPermission('users:manage');

      expect(hasSalesCreate).toBe(true);
      expect(hasUsersManage).toBe(false);
      expect(mockAuthService.hasPermission).toHaveBeenCalledTimes(2);
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      const newAuthResult: AuthResult = {
        ...mockAuthResult,
        token: 'new-jwt-token',
        expiresAt: new Date('2024-01-17'),
      };
      vi.mocked(mockAuthService.refreshToken).mockResolvedValue(newAuthResult);

      const result = await useCase.refreshToken('old-jwt-token');

      expect(result).toEqual(newAuthResult);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('old-jwt-token');
      expect(mockAuthService.refreshToken).toHaveBeenCalledTimes(1);
    });

    it('should trim token before refresh', async () => {
      vi.mocked(mockAuthService.refreshToken).mockResolvedValue(mockAuthResult);

      await useCase.refreshToken('  token-with-spaces  ');

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('token-with-spaces');
    });

    it('should throw ValidationError if token is empty', async () => {
      await expect(useCase.refreshToken('')).rejects.toThrow(ValidationError);
      await expect(useCase.refreshToken('')).rejects.toThrow('Token is required');
      expect(mockAuthService.refreshToken).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if token is only whitespace', async () => {
      await expect(useCase.refreshToken('   ')).rejects.toThrow(ValidationError);
      expect(mockAuthService.refreshToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if token is invalid', async () => {
      vi.mocked(mockAuthService.refreshToken).mockRejectedValue(new Error('Invalid token'));

      await expect(useCase.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedError);
      await expect(useCase.refreshToken('invalid-token')).rejects.toThrow(
        'Invalid or expired token'
      );
    });

    it('should throw UnauthorizedError if token is expired', async () => {
      vi.mocked(mockAuthService.refreshToken).mockRejectedValue(new Error('Token expired'));

      await expect(useCase.refreshToken('expired-token')).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('validateToken', () => {
    it('should return true for valid token', async () => {
      vi.mocked(mockAuthService.validateToken).mockResolvedValue(true);

      const isValid = await useCase.validateToken('valid-token');

      expect(isValid).toBe(true);
      expect(mockAuthService.validateToken).toHaveBeenCalledWith('valid-token');
      expect(mockAuthService.validateToken).toHaveBeenCalledTimes(1);
    });

    it('should return false for invalid token', async () => {
      vi.mocked(mockAuthService.validateToken).mockResolvedValue(false);

      const isValid = await useCase.validateToken('invalid-token');

      expect(isValid).toBe(false);
      expect(mockAuthService.validateToken).toHaveBeenCalledWith('invalid-token');
    });

    it('should trim token before validation', async () => {
      vi.mocked(mockAuthService.validateToken).mockResolvedValue(true);

      await useCase.validateToken('  token-with-spaces  ');

      expect(mockAuthService.validateToken).toHaveBeenCalledWith('token-with-spaces');
    });

    it('should throw ValidationError if token is empty', async () => {
      await expect(useCase.validateToken('')).rejects.toThrow(ValidationError);
      await expect(useCase.validateToken('')).rejects.toThrow('Token is required');
      expect(mockAuthService.validateToken).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if token is only whitespace', async () => {
      await expect(useCase.validateToken('   ')).rejects.toThrow(ValidationError);
      expect(mockAuthService.validateToken).not.toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', async () => {
      vi.mocked(mockAuthService.getCurrentUser).mockResolvedValue(mockUser);

      const isAuth = await useCase.isAuthenticated();

      expect(isAuth).toBe(true);
      expect(mockAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('should return false when user is not authenticated', async () => {
      vi.mocked(mockAuthService.getCurrentUser).mockResolvedValue(null);

      const isAuth = await useCase.isAuthenticated();

      expect(isAuth).toBe(false);
      expect(mockAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete login flow', async () => {
      vi.mocked(mockAuthService.login).mockResolvedValue(mockAuthResult);
      vi.mocked(mockAuthService.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(mockAuthService.hasPermission).mockResolvedValue(true);

      // Login
      const authResult = await useCase.login('testuser', 'password123');
      expect(authResult.user).toEqual(mockUser);

      // Check authentication
      const isAuth = await useCase.isAuthenticated();
      expect(isAuth).toBe(true);

      // Check permission
      const hasPermission = await useCase.checkPermission('sales:create');
      expect(hasPermission).toBe(true);
    });

    it('should handle complete logout flow', async () => {
      vi.mocked(mockAuthService.logout).mockResolvedValue(undefined);
      vi.mocked(mockAuthService.getCurrentUser).mockResolvedValue(null);

      // Logout
      await useCase.logout();

      // Check authentication after logout
      const isAuth = await useCase.isAuthenticated();
      expect(isAuth).toBe(false);
    });

    it('should handle token refresh flow', async () => {
      const newAuthResult: AuthResult = {
        ...mockAuthResult,
        token: 'new-token',
        expiresAt: new Date('2024-01-17'),
      };

      vi.mocked(mockAuthService.validateToken).mockResolvedValue(false);
      vi.mocked(mockAuthService.refreshToken).mockResolvedValue(newAuthResult);

      // Token is invalid
      const isValid = await useCase.validateToken('old-token');
      expect(isValid).toBe(false);

      // Refresh token
      const result = await useCase.refreshToken('old-token');
      expect(result.token).toBe('new-token');
    });
  });
});
