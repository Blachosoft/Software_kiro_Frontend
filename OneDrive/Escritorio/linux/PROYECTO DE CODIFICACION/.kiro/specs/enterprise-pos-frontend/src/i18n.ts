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

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  // Si no es válido, usar el locale por defecto en lugar de notFound()
  const validLocale = locale && locales.includes(locale as Locale) ? locale : defaultLocale;

  return {
    locale: validLocale as string,
    messages: (await import(`../messages/${validLocale}.json`)).default,
  };
});
