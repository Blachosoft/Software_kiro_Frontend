/**
 * AuthenticateUserUseCase
 * 
 * Application use case for user authentication and authorization.
 * Handles login, logout, session management, and permission checking.
 * 
 * Follows hexagonal architecture - depends only on domain ports.
 */

import type { AuthenticationService, AuthResult } from '../../domain/ports/AuthenticationService';
import type { User, Permission } from '../../domain/entities/User';
import { ValidationError, UnauthorizedError } from '../../domain/errors/DomainError';

/**
 * Use case for authenticating users and managing sessions
 */
export class AuthenticateUserUseCase {
  constructor(private readonly authService: AuthenticationService) {}

  /**
   * Authenticates a user with username and password
   * @param username - The username
   * @param password - The password
   * @returns Promise resolving to authentication result
   * @throws ValidationError if username or password is empty
   * @throws UnauthorizedError if credentials are invalid
   */
  async login(username: string, password: string): Promise<AuthResult> {
    // Validate inputs
    if (!username || username.trim() === '') {
      throw new ValidationError('Username is required');
    }

    if (!password || password.trim() === '') {
      throw new ValidationError('Password is required');
    }

    try {
      const result = await this.authService.login(username.trim(), password);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedError('Invalid username or password');
      }
      throw error;
    }
  }

  /**
   * Logs out the current user
   * @returns Promise resolving when logout is complete
   */
  async logout(): Promise<void> {
    await this.authService.logout();
  }

  /**
   * Gets the currently authenticated user
   * @returns Promise resolving to the current user or null if not authenticated
   */
  async getCurrentUser(): Promise<User | null> {
    return await this.authService.getCurrentUser();
  }

  /**
   * Checks if the current user has a specific permission
   * @param permission - The permission to check
   * @returns Promise resolving to true if user has permission
   * @throws ValidationError if permission is empty
   */
  async checkPermission(permission: Permission): Promise<boolean> {
    if (!permission) {
      throw new ValidationError('Permission is required');
    }

    return await this.authService.hasPermission(permission);
  }

  /**
   * Refreshes the authentication token
   * @param token - The current token
   * @returns Promise resolving to new authentication result
   * @throws ValidationError if token is empty
   * @throws UnauthorizedError if token is invalid or expired
   */
  async refreshToken(token: string): Promise<AuthResult> {
    if (!token || token.trim() === '') {
      throw new ValidationError('Token is required');
    }

    try {
      const result = await this.authService.refreshToken(token.trim());
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedError('Invalid or expired token');
      }
      throw error;
    }
  }

  /**
   * Validates a token
   * @param token - The token to validate
   * @returns Promise resolving to true if token is valid
   * @throws ValidationError if token is empty
   */
  async validateToken(token: string): Promise<boolean> {
    if (!token || token.trim() === '') {
      throw new ValidationError('Token is required');
    }

    return await this.authService.validateToken(token.trim());
  }

  /**
   * Checks if a user is authenticated
   * @returns Promise resolving to true if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}
