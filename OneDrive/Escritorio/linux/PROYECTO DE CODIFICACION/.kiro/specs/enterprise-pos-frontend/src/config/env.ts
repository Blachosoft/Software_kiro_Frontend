/**
 * Environment configuration
 * Centralizes access to environment variables with type safety
 */

export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api',
  environment: process.env.NODE_ENV || 'development',
  enableOfflineMode: process.env.NEXT_PUBLIC_ENABLE_OFFLINE === 'true',
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
} as const;

export type Environment = 'development' | 'production' | 'test';

export const isDevelopment = env.environment === 'development';
export const isProduction = env.environment === 'production';
export const isTest = env.environment === 'test';
