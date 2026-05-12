/**
 * LanguageSwitcher Component
 * 
 * Allows users to switch between supported languages.
 * Persists language preference to LocalStorage.
 * 
 * **Validates: Requirements 19.2, 19.3, 19.5**
 */

'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (newLocale: string) => {
    // Persist language preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-locale', newLocale);
    }

    // Update the URL with the new locale
    startTransition(() => {
      // Remove the current locale from the pathname
      const pathnameWithoutLocale = pathname.replace(`/${locale}`, '');
      router.replace(`/${newLocale}${pathnameWithoutLocale}`);
    });
  };

  return (
    <div className="language-switcher">
      <label htmlFor="language-select" className="sr-only">
        Select Language
      </label>
      <select
        id="language-select"
        value={locale}
        onChange={(e) => handleLanguageChange(e.target.value)}
        disabled={isPending}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        aria-label="Language selector"
      >
        <option value="en">English</option>
        <option value="es">Español</option>
      </select>
    </div>
  );
}
