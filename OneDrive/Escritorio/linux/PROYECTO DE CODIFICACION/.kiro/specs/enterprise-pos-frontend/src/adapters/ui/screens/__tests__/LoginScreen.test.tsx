/**
 * LoginScreen Component Tests
 * 
 * Tests for the LoginScreen component including:
 * - Component rendering
 * - Login form validation
 * - Authentication
 * - Error handling
 * - Password visibility toggle
 * - Accessibility features
 * - Keyboard navigation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginScreen } from '../LoginScreen';
import type { UseAuthReturn } from '../../hooks/useAuth';

describe('LoginScreen', () => {
  let mockAuth: UseAuthReturn;
  let mockOnLoginSuccess: () => void;

  beforeEach(() => {
    mockOnLoginSuccess = vi.fn() as unknown as () => void;

    mockAuth = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
      hasPermission: vi.fn().mockReturnValue(false),
      clearError: vi.fn(),
    };
  });

  describe('Rendering', () => {
    it('should render the login screen', () => {
      render(<LoginScreen auth={mockAuth} />);

      expect(screen.getByRole('heading', { name: /pos system/i })).toBeInTheDocument();
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    });

    it('should render username and password fields', () => {
      render(<LoginScreen auth={mockAuth} />);

      expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });

    it('should render sign in button', () => {
      render(<LoginScreen auth={mockAuth} />);

      expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
    });

    it('should render password visibility toggle', () => {
      render(<LoginScreen auth={mockAuth} />);

      expect(
        screen.getByRole('button', { name: /show password/i })
      ).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required username', async () => {
      render(<LoginScreen auth={mockAuth} />);

      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      fireEvent.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      });

      expect(mockAuth.login).not.toHaveBeenCalled();
    });

    it('should validate required password', async () => {
      render(<LoginScreen auth={mockAuth} />);

      const usernameInput = screen.getByLabelText(/^username$/i);
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });

      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      fireEvent.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      expect(mockAuth.login).not.toHaveBeenCalled();
    });

    it('should validate password minimum length', async () => {
      render(<LoginScreen auth={mockAuth} />);

      const usernameInput = screen.getByLabelText(/^username$/i);
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });

      const passwordInput = screen.getByLabelText(/^password$/i);
      fireEvent.change(passwordInput, { target: { value: '123' } });

      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      fireEvent.click(signInButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 4 characters/i)
        ).toBeInTheDocument();
      });

      expect(mockAuth.login).not.toHaveBeenCalled();
    });

    it('should clear validation errors when field is corrected', async () => {
      render(<LoginScreen auth={mockAuth} />);

      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      fireEvent.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      });

      const usernameInput = screen.getByLabelText(/^username$/i);
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });

      await waitFor(() => {
        expect(screen.queryByText(/username is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Authentication', () => {
    it('should call login with valid credentials', async () => {
      render(<LoginScreen auth={mockAuth} />);

      const usernameInput = screen.getByLabelText(/^username$/i);
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });

      const passwordInput = screen.getByLabelText(/^password$/i);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      fireEvent.click(signInButton);

      await waitFor(() => {
        expect(mockAuth.login).toHaveBeenCalledWith('testuser', 'password123');
      });
    });

    it('should call onLoginSuccess callback after successful login', async () => {
      render(<LoginScreen auth={mockAuth} onLoginSuccess={mockOnLoginSuccess} />);

      const usernameInput = screen.getByLabelText(/^username$/i);
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });

      const passwordInput = screen.getByLabelText(/^password$/i);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      fireEvent.click(signInButton);

      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalled();
      });
    });

    it('should trim username before login', async () => {
      render(<LoginScreen auth={mockAuth} />);

      const usernameInput = screen.getByLabelText(/^username$/i);
      fireEvent.change(usernameInput, { target: { value: '  testuser  ' } });

      const passwordInput = screen.getByLabelText(/^password$/i);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      fireEvent.click(signInButton);

      await waitFor(() => {
        expect(mockAuth.login).toHaveBeenCalledWith('testuser', 'password123');
      });
    });
  });

  describe('Password Visibility', () => {
    it('should toggle password visibility', () => {
      render(<LoginScreen auth={mockAuth} />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      const toggleButton = screen.getByRole('button', { name: /show password/i });
      fireEvent.click(toggleButton);

      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(
        screen.getByRole('button', { name: /hide password/i })
      ).toBeInTheDocument();

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Loading States', () => {
    it('should show loading state during authentication', () => {
      mockAuth.isLoading = true;
      render(<LoginScreen auth={mockAuth} />);

      expect(screen.getByRole('button', { name: /signing in\.\.\./i })).toBeInTheDocument();
    });

    it('should disable form during authentication', () => {
      mockAuth.isLoading = true;
      render(<LoginScreen auth={mockAuth} />);

      const usernameInput = screen.getByLabelText(/^username$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const signInButton = screen.getByRole('button', { name: /signing in\.\.\./i });

      expect(usernameInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(signInButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display authentication error', () => {
      mockAuth.error = 'Invalid username or password';
      render(<LoginScreen auth={mockAuth} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
      expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
    });

    it('should clear error when user starts typing', () => {
      mockAuth.error = 'Invalid username or password';
      render(<LoginScreen auth={mockAuth} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();

      const usernameInput = screen.getByLabelText(/^username$/i);
      fireEvent.change(usernameInput, { target: { value: 'test' } });

      expect(mockAuth.clearError).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<LoginScreen auth={mockAuth} />);

      expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });

    it('should mark invalid fields with aria-invalid', async () => {
      render(<LoginScreen auth={mockAuth} />);

      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      fireEvent.click(signInButton);

      await waitFor(() => {
        const usernameInput = screen.getByLabelText(/^username$/i);
        const passwordInput = screen.getByLabelText(/^password$/i);

        expect(usernameInput).toHaveAttribute('aria-invalid', 'true');
        expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should have aria-describedby for error messages', async () => {
      render(<LoginScreen auth={mockAuth} />);

      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      fireEvent.click(signInButton);

      await waitFor(() => {
        const usernameInput = screen.getByLabelText(/^username$/i);
        expect(usernameInput).toHaveAttribute('aria-describedby', 'username-error');
      });
    });

    it('should announce errors to screen readers', () => {
      mockAuth.error = 'Invalid username or password';
      render(<LoginScreen auth={mockAuth} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have autocomplete attributes', () => {
      render(<LoginScreen auth={mockAuth} />);

      const usernameInput = screen.getByLabelText(/^username$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);

      expect(usernameInput).toHaveAttribute('autocomplete', 'username');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should autofocus username field', () => {
      render(<LoginScreen auth={mockAuth} />);

      const usernameInput = screen.getByLabelText(/^username$/i);
      expect(usernameInput).toHaveAttribute('autofocus');
    });

    it('should submit form on Enter key', async () => {
      render(<LoginScreen auth={mockAuth} />);

      const usernameInput = screen.getByLabelText(/^username$/i);
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });

      const passwordInput = screen.getByLabelText(/^password$/i);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      fireEvent.submit(screen.getByRole('button', { name: /^sign in$/i }).closest('form')!);

      await waitFor(() => {
        expect(mockAuth.login).toHaveBeenCalledWith('testuser', 'password123');
      });
    });
  });

  describe('Integration', () => {
    it('should handle complete login flow', async () => {
      render(<LoginScreen auth={mockAuth} onLoginSuccess={mockOnLoginSuccess} />);

      // Fill in credentials
      const usernameInput = screen.getByLabelText(/^username$/i);
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });

      const passwordInput = screen.getByLabelText(/^password$/i);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Submit form
      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      fireEvent.click(signInButton);

      // Verify login was called
      await waitFor(() => {
        expect(mockAuth.login).toHaveBeenCalledWith('testuser', 'password123');
        expect(mockOnLoginSuccess).toHaveBeenCalled();
      });
    });

    it('should handle failed login attempt', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAuth.login = vi.fn().mockRejectedValue(new Error('Login failed'));

      render(<LoginScreen auth={mockAuth} />);

      const usernameInput = screen.getByLabelText(/^username$/i);
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });

      const passwordInput = screen.getByLabelText(/^password$/i);
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      fireEvent.click(signInButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });
});
