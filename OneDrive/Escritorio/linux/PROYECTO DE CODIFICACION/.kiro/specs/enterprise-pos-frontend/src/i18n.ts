/**
 * Internationalization Configuration
 * 
 * Configures next-intl for the application with support for English and Spanish.
 * 
 * **Validates: Requirements 19.1, 19.4**
 */

import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Supported locales
export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ requestLocale }) => {
  // next-intl provides the locale via requestLocale in App Router
  const requestedLocale = await requestLocale;
  const validLocale = requestedLocale && locales.includes(requestedLocale as Locale)
    ? requestedLocale
    : defaultLocale;

  return {
    locale: validLocale as string,
    messages: (await import(`../messages/${validLocale}.json`)).default,
  };
});
