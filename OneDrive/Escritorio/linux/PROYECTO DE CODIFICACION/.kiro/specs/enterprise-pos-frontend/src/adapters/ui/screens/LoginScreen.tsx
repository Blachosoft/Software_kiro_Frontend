/**
 * LoginScreen Component
 * 
 * Screen for user authentication.
 * Provides login form with validation and error display.
 * Integrates with useAuth hook for authentication operations.
 * 
 * **Validates: Requirements 9.2, 11.1, 14.1, 14.2, 15.3**
 */

'use client';

import { useState, useCallback } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import type { UseAuthReturn } from '../hooks/useAuth';

/**
 * LoginScreen Props
 */
export interface LoginScreenProps {
  auth: UseAuthReturn;
  onLoginSuccess?: () => void;
}

/**
 * LoginScreen Component
 * 
 * Provides authentication interface with:
 * - Login form with validation
 * - Error display for failed authentication
 * - Loading states
 * - Accessibility attributes
 * - Keyboard navigation support
 */
export function LoginScreen({ auth, onLoginSuccess }: LoginScreenProps) {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Handle field change
   */
  const handleFieldChange = useCallback(
    (field: keyof typeof credentials, value: string) => {
      setCredentials((prev) => ({ ...prev, [field]: value }));
      // Clear validation error for this field
      if (validationErrors[field]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
      // Clear auth error when user starts typing
      if (auth.error) {
        auth.clearError();
      }
    },
    [validationErrors, auth]
  );

  /**
   * Validate form
   */
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!credentials.username.trim()) {
      errors.username = 'Username is required';
    }

    if (!credentials.password) {
      errors.password = 'Password is required';
    } else if (credentials.password.length < 4) {
      errors.password = 'Password must be at least 4 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [credentials]);

  /**
   * Handle login submit
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      try {
        await auth.login(credentials.username.trim(), credentials.password);
        // Call success callback if provided
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } catch (error) {
        // Error is handled by the auth hook
        console.error('Login failed:', error);
      }
    },
    [validateForm, credentials, auth, onLoginSuccess]
  );

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <ErrorBoundary>
      <div className="login-screen min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            {/* Logo/Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">POS System</h1>
              <p className="text-gray-600 mt-1">Sign in to your account</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => handleFieldChange('username', e.target.value)}
                  autoComplete="username"
                  autoFocus
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.username
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  aria-invalid={!!validationErrors.username}
                  aria-describedby={
                    validationErrors.username ? 'username-error' : undefined
                  }
                  disabled={auth.isLoading}
                />
                {validationErrors.username && (
                  <p
                    id="username-error"
                    className="mt-1 text-sm text-red-600"
                    role="alert"
                  >
                    {validationErrors.username}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    autoComplete="current-password"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                      validationErrors.password
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    aria-invalid={!!validationErrors.password}
                    aria-describedby={
                      validationErrors.password ? 'password-error' : undefined
                    }
                    disabled={auth.isLoading}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={auth.isLoading}
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p
                    id="password-error"
                    className="mt-1 text-sm text-red-600"
                    role="alert"
                  >
                    {validationErrors.password}
                  </p>
                )}
              </div>

              {/* Authentication Error */}
              {auth.error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-800">
                        Authentication Failed
                      </h3>
                      <p className="text-sm text-red-700 mt-1">{auth.error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={auth.isLoading}
                className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {auth.isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Additional Info */}
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Need help? Contact your system administrator</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>© 2024 POS System. All rights reserved.</p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
