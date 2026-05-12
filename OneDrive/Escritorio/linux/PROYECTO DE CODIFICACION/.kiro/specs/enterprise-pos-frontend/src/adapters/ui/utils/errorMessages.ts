/**
 * Error Message Utilities
 * 
 * Utilities for converting domain errors into user-friendly messages
 * and determining recovery actions for recoverable errors.
 * 
 * **Validates: Requirements 12.1, 12.2, 12.3**
 */

import {
  DomainError,
  ValidationError,
  NetworkError,
  ServerError,
  UnknownError,
  NotFoundError,
  UnauthorizedError,
  BusinessRuleError,
} from '../../../domain/errors/DomainError';

/**
 * Recovery action type
 */
export interface RecoveryAction {
  readonly label: string;
  readonly action: 'retry' | 'offline' | 'login' | 'cancel';
}

/**
 * Get user-friendly error message
 * 
 * Converts domain errors into messages appropriate for end users.
 * Does not expose technical implementation details.
 * 
 * @param error - The error to convert
 * @returns User-friendly error message
 */
export function getErrorMessage(error: Error | DomainError): string {
  // Handle domain errors
  if (error instanceof DomainError) {
    // Validation errors already have user-friendly messages
    if (error instanceof ValidationError) {
      return error.message;
    }

    // Not found errors
    if (error instanceof NotFoundError) {
      return `${error.resourceType} not found. Please check and try again.`;
    }

    // Unauthorized errors
    if (error instanceof UnauthorizedError) {
      return error.requiredPermission
        ? `You don't have permission to perform this action. Required: ${error.requiredPermission}`
        : 'You are not authorized to perform this action. Please log in.';
    }

    // Business rule errors
    if (error instanceof BusinessRuleError) {
      return error.message;
    }

    // Network errors
    if (error instanceof NetworkError) {
      if (error.statusCode === 0 || !error.statusCode) {
        return 'Unable to connect to the server. Please check your internet connection.';
      }
      return 'Network error occurred. Please check your connection and try again.';
    }

    // Server errors
    if (error instanceof ServerError) {
      if (error.statusCode >= 500) {
        return 'The server encountered an error. Please try again later.';
      }
      if (error.statusCode === 404) {
        return 'The requested resource was not found.';
      }
      if (error.statusCode === 403) {
        return 'Access denied. You do not have permission to access this resource.';
      }
      if (error.statusCode === 401) {
        return 'Authentication required. Please log in to continue.';
      }
      return 'A server error occurred. Please try again.';
    }

    // Unknown errors
    if (error instanceof UnknownError) {
      return 'An unexpected error occurred. Please try again.';
    }

    // Generic domain error
    return error.message || 'An error occurred. Please try again.';
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    // Don't expose technical details in production
    if (process.env.NODE_ENV === 'production') {
      return 'An unexpected error occurred. Please try again.';
    }
    return error.message;
  }

  // Fallback for unknown error types
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Get recovery actions for an error
 * 
 * Determines what actions the user can take to recover from an error.
 * Only returns actions for recoverable errors.
 * 
 * @param error - The error to analyze
 * @returns Array of recovery actions (empty if not recoverable)
 */
export function getRecoveryActions(error: Error | DomainError): RecoveryAction[] {
  // Non-domain errors are not recoverable
  if (!(error instanceof DomainError)) {
    return [];
  }

  // Non-recoverable errors have no actions
  if (!error.recoverable) {
    return [];
  }

  const actions: RecoveryAction[] = [];

  // Network errors can be retried or worked around with offline mode
  if (error instanceof NetworkError) {
    actions.push({ label: 'Try Again', action: 'retry' });
    actions.push({ label: 'Work Offline', action: 'offline' });
    return actions;
  }

  // Server errors (5xx) can be retried
  if (error instanceof ServerError && error.statusCode >= 500) {
    actions.push({ label: 'Try Again', action: 'retry' });
    return actions;
  }

  // Unauthorized errors can be resolved by logging in
  if (error instanceof UnauthorizedError) {
    actions.push({ label: 'Log In', action: 'login' });
    actions.push({ label: 'Cancel', action: 'cancel' });
    return actions;
  }

  // Validation errors can be fixed by correcting input
  if (error instanceof ValidationError) {
    // No specific actions - user should correct the form
    return [];
  }

  // Generic recoverable error - offer retry
  actions.push({ label: 'Try Again', action: 'retry' });
  return actions;
}

/**
 * Classify error type
 * 
 * Determines the category of an error for logging and handling purposes.
 * 
 * @param error - The error to classify
 * @returns Error type classification
 */
export function classifyError(
  error: Error | DomainError
): 'validation' | 'network' | 'server' | 'unknown' {
  if (error instanceof DomainError) {
    return error.type;
  }

  // Try to infer type from standard errors
  if (error instanceof TypeError || error instanceof RangeError) {
    return 'validation';
  }

  return 'unknown';
}

/**
 * Check if error is recoverable
 * 
 * @param error - The error to check
 * @returns True if the error is recoverable
 */
export function isRecoverable(error: Error | DomainError): boolean {
  if (error instanceof DomainError) {
    return error.recoverable;
  }
  return false;
}
