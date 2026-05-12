/**
 * LoggingService Port
 * 
 * Defines the contract for application logging.
 * This is a port interface in hexagonal architecture - implementations
 * are provided by adapters in the infrastructure layer.
 * 
 * NO framework dependencies allowed in this file.
 */

/**
 * Log level type
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log entry metadata
 */
export interface LogMetadata {
  readonly timestamp: Date;
  readonly level: LogLevel;
  readonly message: string;
  readonly context?: Record<string, unknown>;
  readonly error?: Error;
  readonly userId?: string;
}

/**
 * Service interface for logging
 * Defines operations for application logging and error tracking
 */
export interface LoggingService {
  /**
   * Logs a debug message
   * @param message - The log message
   * @param context - Additional context (optional)
   */
  debug(message: string, context?: Record<string, unknown>): void;

  /**
   * Logs an info message
   * @param message - The log message
   * @param context - Additional context (optional)
   */
  info(message: string, context?: Record<string, unknown>): void;

  /**
   * Logs a warning message
   * @param message - The log message
   * @param context - Additional context (optional)
   */
  warn(message: string, context?: Record<string, unknown>): void;

  /**
   * Logs an error message
   * @param message - The log message
   * @param error - The error object (optional)
   * @param context - Additional context (optional)
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void;

  /**
   * Sets the current user context for logs
   * @param userId - The user ID
   */
  setUser(userId: string): void;

  /**
   * Clears the current user context
   */
  clearUser(): void;

  /**
   * Flushes any pending logs
   * @returns Promise resolving when flush is complete
   */
  flush(): Promise<void>;
}
