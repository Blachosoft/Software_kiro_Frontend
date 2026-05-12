/**
 * ErrorBoundary Component
 * 
 * React error boundary that catches JavaScript errors anywhere in the child
 * component tree, logs those errors, and displays a fallback UI.
 * 
 * **Validates: Requirements 12.5, 14.1, 14.2, 15.3**
 */

'use client';

import { Component, ReactNode } from 'react';
import type { LoggingService } from '../../../domain/ports/LoggingService';

/**
 * ErrorBoundary Props
 */
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  loggingService?: LoggingService;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * ErrorBoundary State
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary Component
 * 
 * Catches errors in child components and displays a user-friendly error page.
 * Logs errors via LoggingService port for debugging.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Log error when caught
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to logging service if provided
    if (this.props.loggingService) {
      this.props.loggingService.error(
        'Uncaught error in component tree',
        error,
        {
          componentStack: errorInfo.componentStack,
          errorBoundary: 'ErrorBoundary',
        }
      );
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Fallback to console if no logging service
    if (!this.props.loggingService) {
      console.error('Uncaught error:', error, errorInfo);
    }
  }

  /**
   * Reset error state
   */
  private handleReset = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  /**
   * Reload the page
   */
  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error page
      return (
        <div
          className="min-h-screen flex items-center justify-center bg-gray-50 px-4"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1
              className="text-2xl font-bold text-gray-900 text-center mb-2"
              id="error-title"
            >
              Something went wrong
            </h1>

            <p className="text-gray-600 text-center mb-6" id="error-description">
              We&apos;re sorry for the inconvenience. An unexpected error occurred.
              Please try refreshing the page or contact support if the problem persists.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 p-4 bg-gray-100 rounded text-sm">
                <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs text-gray-600 overflow-auto">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                aria-label="Try again"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                aria-label="Reload page"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
