/**
 * Error Message Utilities Tests
 * 
 * Tests error message generation, recovery actions, and error classification.
 * 
 * **Validates: Requirements 12.1, 12.2, 12.3**
 */

import { describe, it, expect } from 'vitest';
import {
  getErrorMessage,
  getRecoveryActions,
  classifyError,
  isRecoverable,
} from '../errorMessages';
import {
  ValidationError,
  NetworkError,
  ServerError,
  UnknownError,
  NotFoundError,
  UnauthorizedError,
  BusinessRuleError,
} from '../../../../domain/errors/DomainError';

describe('getErrorMessage', () => {
  describe('Validation Errors', () => {
    it('should return validation error message as-is', () => {
      const error = new ValidationError('Name is required', 'name');
      expect(getErrorMessage(error)).toBe('Name is required');
    });

    it('should handle validation error with field and constraint', () => {
      const error = new ValidationError(
        'Email must be valid',
        'email',
        'format'
      );
      expect(getErrorMessage(error)).toBe('Email must be valid');
    });
  });

  describe('Network Errors', () => {
    it('should return connection message for network error without status', () => {
      const error = new NetworkError('Connection failed');
      expect(getErrorMessage(error)).toBe(
        'Unable to connect to the server. Please check your internet connection.'
      );
    });

    it('should return connection message for network error with status 0', () => {
      const error = new NetworkError('Connection failed', 0);
      expect(getErrorMessage(error)).toBe(
        'Unable to connect to the server. Please check your internet connection.'
      );
    });

    it('should return generic network message for network error with status', () => {
      const error = new NetworkError('Timeout', 408);
      expect(getErrorMessage(error)).toBe(
        'Network error occurred. Please check your connection and try again.'
      );
    });
  });

  describe('Server Errors', () => {
    it('should return server error message for 5xx errors', () => {
      const error = new ServerError('Internal server error', 500);
      expect(getErrorMessage(error)).toBe(
        'The server encountered an error. Please try again later.'
      );
    });

    it('should return not found message for 404 errors', () => {
      const error = new ServerError('Not found', 404);
      expect(getErrorMessage(error)).toBe(
        'The requested resource was not found.'
      );
    });

    it('should return access denied message for 403 errors', () => {
      const error = new ServerError('Forbidden', 403);
      expect(getErrorMessage(error)).toBe(
        'Access denied. You do not have permission to access this resource.'
      );
    });

    it('should return authentication message for 401 errors', () => {
      const error = new ServerError('Unauthorized', 401);
      expect(getErrorMessage(error)).toBe(
        'Authentication required. Please log in to continue.'
      );
    });

    it('should return generic server message for other 4xx errors', () => {
      const error = new ServerError('Bad request', 400);
      expect(getErrorMessage(error)).toBe(
        'A server error occurred. Please try again.'
      );
    });
  });

  describe('Not Found Errors', () => {
    it('should return not found message with resource type', () => {
      const error = new NotFoundError('Product not found', 'Product', 'prod-123');
      expect(getErrorMessage(error)).toBe(
        'Product not found. Please check and try again.'
      );
    });
  });

  describe('Unauthorized Errors', () => {
    it('should return unauthorized message without permission', () => {
      const error = new UnauthorizedError('Not authorized');
      expect(getErrorMessage(error)).toBe(
        'You are not authorized to perform this action. Please log in.'
      );
    });

    it('should return unauthorized message with required permission', () => {
      const error = new UnauthorizedError(
        'Not authorized',
        'sales:create'
      );
      expect(getErrorMessage(error)).toBe(
        "You don't have permission to perform this action. Required: sales:create"
      );
    });
  });

  describe('Business Rule Errors', () => {
    it('should return business rule error message', () => {
      const error = new BusinessRuleError(
        'Cannot complete sale without items',
        'sale-has-items'
      );
      expect(getErrorMessage(error)).toBe(
        'Cannot complete sale without items'
      );
    });
  });

  describe('Unknown Errors', () => {
    it('should return generic message for unknown errors', () => {
      const error = new UnknownError('Something went wrong');
      expect(getErrorMessage(error)).toBe(
        'An unexpected error occurred. Please try again.'
      );
    });
  });

  describe('Standard JavaScript Errors', () => {
    it('should return generic message in production for standard errors', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true, configurable: true });

      const error = new Error('TypeError: Cannot read property');
      expect(getErrorMessage(error)).toBe(
        'An unexpected error occurred. Please try again.'
      );

      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true, configurable: true });
    });

    it('should return error message in development for standard errors', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true, configurable: true });

      const error = new Error('TypeError: Cannot read property');
      expect(getErrorMessage(error)).toBe('TypeError: Cannot read property');

      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true, configurable: true });
    });
  });

  describe('Unknown Error Types', () => {
    it('should return generic message for unknown error types', () => {
      const error = 'string error' as any;
      expect(getErrorMessage(error)).toBe(
        'An unexpected error occurred. Please try again.'
      );
    });
  });
});

describe('getRecoveryActions', () => {
  describe('Network Errors', () => {
    it('should return retry and offline actions for network errors', () => {
      const error = new NetworkError('Connection failed');
      const actions = getRecoveryActions(error);

      expect(actions).toHaveLength(2);
      expect(actions[0]).toEqual({ label: 'Try Again', action: 'retry' });
      expect(actions[1]).toEqual({ label: 'Work Offline', action: 'offline' });
    });
  });

  describe('Server Errors', () => {
    it('should return retry action for 5xx server errors', () => {
      const error = new ServerError('Internal error', 500);
      const actions = getRecoveryActions(error);

      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual({ label: 'Try Again', action: 'retry' });
    });

    it('should return no actions for 4xx server errors (not recoverable)', () => {
      const error = new ServerError('Bad request', 400);
      const actions = getRecoveryActions(error);

      expect(actions).toHaveLength(0);
    });
  });

  describe('Unauthorized Errors', () => {
    it('should return login and cancel actions for unauthorized errors', () => {
      const error = new UnauthorizedError('Not authorized');
      const actions = getRecoveryActions(error);

      expect(actions).toHaveLength(2);
      expect(actions[0]).toEqual({ label: 'Log In', action: 'login' });
      expect(actions[1]).toEqual({ label: 'Cancel', action: 'cancel' });
    });
  });

  describe('Validation Errors', () => {
    it('should return no actions for validation errors', () => {
      const error = new ValidationError('Invalid input', 'field');
      const actions = getRecoveryActions(error);

      expect(actions).toHaveLength(0);
    });
  });

  describe('Non-Recoverable Errors', () => {
    it('should return no actions for not found errors', () => {
      const error = new NotFoundError('Not found', 'Product', 'prod-123');
      const actions = getRecoveryActions(error);

      expect(actions).toHaveLength(0);
    });

    it('should return no actions for business rule errors', () => {
      const error = new BusinessRuleError('Rule violated', 'rule-1');
      const actions = getRecoveryActions(error);

      expect(actions).toHaveLength(0);
    });

    it('should return no actions for unknown errors', () => {
      const error = new UnknownError('Unknown error');
      const actions = getRecoveryActions(error);

      expect(actions).toHaveLength(0);
    });
  });

  describe('Standard JavaScript Errors', () => {
    it('should return no actions for standard errors', () => {
      const error = new Error('Standard error');
      const actions = getRecoveryActions(error);

      expect(actions).toHaveLength(0);
    });
  });
});

describe('classifyError', () => {
  it('should classify validation errors', () => {
    const error = new ValidationError('Invalid', 'field');
    expect(classifyError(error)).toBe('validation');
  });

  it('should classify network errors', () => {
    const error = new NetworkError('Connection failed');
    expect(classifyError(error)).toBe('network');
  });

  it('should classify server errors', () => {
    const error = new ServerError('Server error', 500);
    expect(classifyError(error)).toBe('server');
  });

  it('should classify unknown errors', () => {
    const error = new UnknownError('Unknown');
    expect(classifyError(error)).toBe('unknown');
  });

  it('should classify TypeError as validation', () => {
    const error = new TypeError('Type error');
    expect(classifyError(error)).toBe('validation');
  });

  it('should classify RangeError as validation', () => {
    const error = new RangeError('Range error');
    expect(classifyError(error)).toBe('validation');
  });

  it('should classify standard errors as unknown', () => {
    const error = new Error('Standard error');
    expect(classifyError(error)).toBe('unknown');
  });
});

describe('isRecoverable', () => {
  it('should return true for recoverable domain errors', () => {
    const error = new NetworkError('Connection failed');
    expect(isRecoverable(error)).toBe(true);
  });

  it('should return false for non-recoverable domain errors', () => {
    const error = new UnknownError('Unknown');
    expect(isRecoverable(error)).toBe(false);
  });

  it('should return false for standard errors', () => {
    const error = new Error('Standard error');
    expect(isRecoverable(error)).toBe(false);
  });
});
