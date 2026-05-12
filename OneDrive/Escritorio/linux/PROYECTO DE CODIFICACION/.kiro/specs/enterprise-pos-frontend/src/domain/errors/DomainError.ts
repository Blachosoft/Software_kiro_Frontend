/**
 * Domain Error Classes
 * 
 * Framework-independent error classes for domain-level errors.
 * These errors represent business rule violations and exceptional conditions.
 */

/**
 * Error type classification
 */
export type ErrorType = 'validation' | 'network' | 'server' | 'unknown';

/**
 * Base domain error class
 * All domain errors extend from this class
 */
export abstract class DomainError extends Error {
  abstract readonly type: ErrorType;
  abstract readonly recoverable: boolean;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation Error
 * Thrown when business rules or data validation fails
 * These errors are recoverable - user can fix input and retry
 */
export class ValidationError extends DomainError {
  readonly type = 'validation' as const;
  readonly recoverable = true;

  constructor(
    message: string,
    public readonly field?: string,
    public readonly constraint?: string
  ) {
    super(message);
  }
}

/**
 * Network Error
 * Thrown when network communication fails
 * These errors are recoverable - operation can be retried
 */
export class NetworkError extends DomainError {
  readonly type = 'network' as const;
  readonly recoverable = true;

  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
  }
}

/**
 * Server Error
 * Thrown when server returns an error response
 * These errors may or may not be recoverable depending on status code
 */
export class ServerError extends DomainError {
  readonly type = 'server' as const;
  readonly recoverable: boolean;

  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly originalError?: Error
  ) {
    super(message);
    // 5xx errors are typically recoverable (retry), 4xx are not
    this.recoverable = statusCode >= 500;
  }
}

/**
 * Unknown Error
 * Thrown for unexpected errors that don't fit other categories
 * These errors are typically not recoverable
 */
export class UnknownError extends DomainError {
  readonly type = 'unknown' as const;
  readonly recoverable = false;

  constructor(
    message: string,
    public readonly originalError?: Error
  ) {
    super(message);
  }
}

/**
 * Not Found Error
 * Thrown when a requested resource is not found
 * These errors are not recoverable - resource doesn't exist
 */
export class NotFoundError extends DomainError {
  readonly type = 'validation' as const;
  readonly recoverable = false;

  constructor(
    message: string,
    public readonly resourceType: string,
    public readonly resourceId: string
  ) {
    super(message);
  }
}

/**
 * Unauthorized Error
 * Thrown when user lacks authentication or authorization
 * These errors may be recoverable if user can authenticate
 */
export class UnauthorizedError extends DomainError {
  readonly type = 'validation' as const;
  readonly recoverable = true;

  constructor(
    message: string,
    public readonly requiredPermission?: string
  ) {
    super(message);
  }
}

/**
 * Business Rule Error
 * Thrown when a business rule is violated
 * These errors are not recoverable - operation violates business logic
 */
export class BusinessRuleError extends DomainError {
  readonly type = 'validation' as const;
  readonly recoverable = false;

  constructor(
    message: string,
    public readonly rule: string
  ) {
    super(message);
  }
}
