/**
 * AuthenticationService Port
 * 
 * Defines the contract for user authentication and authorization.
 * This is a port interface in hexagonal architecture - implementations
 * are provided by adapters in the infrastructure layer.
 * 
 * NO framework dependencies allowed in this file.
 */

import type { User, Permission } from '../entities/User';

/**
 * Authentication result
 * Returned after successful login
 */
export interface AuthResult {
  readonly user: User;
  readonly token: string;
  readonly expiresAt: Date;
}

/**
 * Service interface for authentication and authorization
 * Defines operations for user authentication and permission checking
 */
export interface AuthenticationService {
  /**
   * Authenticates a user with username and password
   * @param username - The username
   * @param password - The password
   * @returns Promise resolving to authentication result
   * @throws Error if credentials are invalid
   */
  login(username: string, password: string): Promise<AuthResult>;

  /**
   * Logs out the current user
   * @returns Promise resolving when logout is complete
   */
  logout(): Promise<void>;

  /**
   * Gets the currently authenticated user
   * @returns Promise resolving to the current user or null if not authenticated
   */
  getCurrentUser(): Promise<User | null>;

  /**
   * Checks if the current user has a specific permission
   * @param permission - The permission to check
   * @returns Promise resolving to true if user has permission
   */
  hasPermission(permission: Permission): Promise<boolean>;

  /**
   * Refreshes the authentication token
   * @param token - The current token
   * @returns Promise resolving to new authentication result
   * @throws Error if token is invalid or expired
   */
  refreshToken(token: string): Promise<AuthResult>;

  /**
   * Validates a token
   * @param token - The token to validate
   * @returns Promise resolving to true if token is valid
   */
  validateToken(token: string): Promise<boolean>;
}
