import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  NetworkError,
  ServerError,
  UnknownError,
  NotFoundError,
  UnauthorizedError,
  BusinessRuleError,
} from '../DomainError';

describe('Domain Error Classes', () => {
  describe('ValidationError', () => {
    it('should create validation error with message', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.type).toBe('validation');
      expect(error.recoverable).toBe(true);
      expect(error.name).toBe('ValidationError');
    });

    it('should create validation error with field and constraint', () => {
      const error = new ValidationError('Email is invalid', 'email', 'format');

      expect(error.message).toBe('Email is invalid');
      expect(error.field).toBe('email');
      expect(error.constraint).toBe('format');
    });

    it('should be instance of Error', () => {
      const error = new ValidationError('Invalid input');

      expect(error).toBeInstanceOf(Error);
    });

    it('should have stack trace', () => {
      const error = new ValidationError('Invalid input');

      expect(error.stack).toBeDefined();
    });
  });

  describe('NetworkError', () => {
    it('should create network error with message', () => {
      const error = new NetworkError('Connection failed');

      expect(error.message).toBe('Connection failed');
      expect(error.type).toBe('network');
      expect(error.recoverable).toBe(true);
      expect(error.name).toBe('NetworkError');
    });

    it('should create network error with status code', () => {
      const error = new NetworkError('Request timeout', 408);

      expect(error.message).toBe('Request timeout');
      expect(error.statusCode).toBe(408);
    });

    it('should create network error with original error', () => {
      const originalError = new Error('Socket timeout');
      const error = new NetworkError('Connection failed', undefined, originalError);

      expect(error.originalError).toBe(originalError);
    });
  });

  describe('ServerError', () => {
    it('should create server error with 5xx status (recoverable)', () => {
      const error = new ServerError('Internal server error', 500);

      expect(error.message).toBe('Internal server error');
      expect(error.type).toBe('server');
      expect(error.statusCode).toBe(500);
      expect(error.recoverable).toBe(true);
      expect(error.name).toBe('ServerError');
    });

    it('should create server error with 4xx status (not recoverable)', () => {
      const error = new ServerError('Bad request', 400);

      expect(error.message).toBe('Bad request');
      expect(error.statusCode).toBe(400);
      expect(error.recoverable).toBe(false);
    });

    it('should create server error with original error', () => {
      const originalError = new Error('Database connection failed');
      const error = new ServerError('Internal server error', 500, originalError);

      expect(error.originalError).toBe(originalError);
    });

    it('should mark 503 as recoverable', () => {
      const error = new ServerError('Service unavailable', 503);

      expect(error.recoverable).toBe(true);
    });

    it('should mark 404 as not recoverable', () => {
      const error = new ServerError('Not found', 404);

      expect(error.recoverable).toBe(false);
    });
  });

  describe('UnknownError', () => {
    it('should create unknown error with message', () => {
      const error = new UnknownError('Something went wrong');

      expect(error.message).toBe('Something went wrong');
      expect(error.type).toBe('unknown');
      expect(error.recoverable).toBe(false);
      expect(error.name).toBe('UnknownError');
    });

    it('should create unknown error with original error', () => {
      const originalError = new Error('Unexpected error');
      const error = new UnknownError('Something went wrong', originalError);

      expect(error.originalError).toBe(originalError);
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with resource details', () => {
      const error = new NotFoundError('Product not found', 'Product', 'prod-123');

      expect(error.message).toBe('Product not found');
      expect(error.type).toBe('validation');
      expect(error.recoverable).toBe(false);
      expect(error.resourceType).toBe('Product');
      expect(error.resourceId).toBe('prod-123');
      expect(error.name).toBe('NotFoundError');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create unauthorized error with message', () => {
      const error = new UnauthorizedError('Access denied');

      expect(error.message).toBe('Access denied');
      expect(error.type).toBe('validation');
      expect(error.recoverable).toBe(true);
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should create unauthorized error with required permission', () => {
      const error = new UnauthorizedError('Access denied', 'sales:create');

      expect(error.message).toBe('Access denied');
      expect(error.requiredPermission).toBe('sales:create');
    });
  });

  describe('BusinessRuleError', () => {
    it('should create business rule error with rule name', () => {
      const error = new BusinessRuleError(
        'Cannot complete sale without items',
        'sale-must-have-items'
      );

      expect(error.message).toBe('Cannot complete sale without items');
      expect(error.type).toBe('validation');
      expect(error.recoverable).toBe(false);
      expect(error.rule).toBe('sale-must-have-items');
      expect(error.name).toBe('BusinessRuleError');
    });
  });

  describe('Error inheritance', () => {
    it('should allow catching all domain errors', () => {
      const errors = [
        new ValidationError('Validation failed'),
        new NetworkError('Network failed'),
        new ServerError('Server failed', 500),
        new UnknownError('Unknown failed'),
      ];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.type).toBeDefined();
        expect(typeof error.recoverable).toBe('boolean');
      });
    });

    it('should allow type-specific error handling', () => {
      const error = new ValidationError('Invalid email');

      if (error.type === 'validation') {
        expect(error.recoverable).toBe(true);
      }
    });
  });
});
