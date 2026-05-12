/**
 * Next.js Middleware
 * 
 * Handles:
 * - Internationalization (locale detection and routing)
 * 
 * **Validates: Requirements 19.1**
 */

import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/i18n';

// Create the i18n middleware - SIN autenticación para desarrollo
export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
