/**
 * MockAuthService - Servicio de autenticación mock para desarrollo
 */

import type { AuthenticationService, AuthResult } from '../../domain/ports/AuthenticationService';
import type { User, Permission } from '../../domain/entities/User';
import { RolePermissions } from '../../domain/entities/User';

export class MockAuthService implements AuthenticationService {
  private currentUser: User | null = null;
  
  // Usuarios de prueba
  private users = [
    {
      id: 'user-1',
      username: 'admin',
      password: 'admin123',
      role: 'admin' as const,
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 'user-2',
      username: 'manager',
      password: 'manager123',
      role: 'manager' as const,
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 'user-3',
      username: 'cashier',
      password: 'cashier123',
      role: 'cashier' as const,
      createdAt: new Date('2024-01-01'),
    },
  ];

  async login(username: string, password: string): Promise<AuthResult> {
    await this.delay(500);
    
    const user = this.users.find(
      u => u.username === username && u.password === password
    );
    
    if (!user) {
      throw new Error('Invalid username or password');
    }
    
    this.currentUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      permissions: RolePermissions[user.role],
      createdAt: user.createdAt,
      lastLoginAt: new Date(),
    };
    
    // Guardar en localStorage para persistencia
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_user', JSON.stringify(this.currentUser));
      localStorage.setItem('mock_token', 'mock-jwt-token-' + Date.now());
    }
    
    return {
      user: this.currentUser,
      token: 'mock-jwt-token-' + Date.now(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
    };
  }

  async logout(): Promise<void> {
    await this.delay(200);
    this.currentUser = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock_user');
      localStorage.removeItem('mock_token');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    await this.delay(100);
    
    // Intentar recuperar de localStorage
    if (!this.currentUser && typeof window !== 'undefined') {
      const stored = localStorage.getItem('mock_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Convertir fechas de string a Date y crear nuevo objeto
          this.currentUser = {
            ...parsed,
            createdAt: new Date(parsed.createdAt),
            lastLoginAt: parsed.lastLoginAt ? new Date(parsed.lastLoginAt) : undefined,
          };
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
    }
    
    return this.currentUser;
  }

  async hasPermission(permission: Permission): Promise<boolean> {
    await this.delay(50);
    
    if (!this.currentUser) {
      return false;
    }
    
    const permissions = RolePermissions[this.currentUser.role];
    return permissions.includes(permission);
  }

  async refreshToken(token: string): Promise<AuthResult> {
    await this.delay(300);
    
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }
    
    return {
      user: this.currentUser,
      token: 'mock-jwt-token-' + Date.now(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  async validateToken(token: string): Promise<boolean> {
    await this.delay(100);
    return token.startsWith('mock-jwt-token-');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
