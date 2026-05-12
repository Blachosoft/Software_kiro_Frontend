/**
 * ErrorBoundary Component Tests
 * 
 * Tests error catching, logging, and user-friendly error display.
 * 
 * **Validates: Requirements 12.5, 14.1, 14.2, 15.3**
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';
import type { LoggingService } from '../../../../domain/ports/LoggingService';

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  let mockLoggingService: LoggingService;

  beforeEach(() => {
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {});

    mockLoggingService = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      setUser: vi.fn(),
      clearUser: vi.fn(),
      flush: vi.fn().mockResolvedValue(undefined),
    };
  });

  describe('Error Catching', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should catch errors and display error page', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(
        screen.getByText(/We're sorry for the inconvenience/i)
      ).toBeInTheDocument();
    });

    it('should display custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Error Logging', () => {
    it('should log error to logging service when provided', () => {
      render(
        <ErrorBoundary loggingService={mockLoggingService}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(mockLoggingService.error).toHaveBeenCalledWith(
        'Uncaught error in component tree',
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
          errorBoundary: 'ErrorBoundary',
        })
      );
    });

    it('should call custom onError handler when provided', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('should log to console when no logging service provided', () => {
      const consoleSpy = vi.spyOn(console, 'error');

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert" on error page', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should have aria-live="assertive" for immediate announcement', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have aria-atomic="true" for complete announcement', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toHaveAttribute('aria-atomic', 'true');
    });

    it('should have accessible button labels', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByLabelText('Try again')).toBeInTheDocument();
      expect(screen.getByLabelText('Reload page')).toBeInTheDocument();
    });

    it('should hide decorative icon from screen readers', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const icon = screen.getByRole('alert').querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Error Recovery', () => {
    it('should display Try Again button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should display Reload Page button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Reload Page')).toBeInTheDocument();
    });
  });

  describe('Development Mode', () => {
    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true, configurable: true });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Error Details/i)).toBeInTheDocument();
      expect(screen.getByText(/Test error/i)).toBeInTheDocument();

      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true, configurable: true });
    });
  });

  describe('User-Friendly Messages', () => {
    it('should display user-friendly error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/We're sorry for the inconvenience/i)
      ).toBeInTheDocument();
    });

    it('should not expose technical details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true, configurable: true });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText(/Test error/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument();

      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true, configurable: true });
    });
  });
});
