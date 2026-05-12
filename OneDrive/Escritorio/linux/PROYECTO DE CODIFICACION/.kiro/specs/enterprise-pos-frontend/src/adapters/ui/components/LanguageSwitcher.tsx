/**
 * LanguageSwitcher Component
 * 
 * Allows users to switch between supported languages.
 * Persists language preference to LocalStorage.
 * 
 * **Validates: Requirements 19.2, 19.3, 19.5**
 */


'use client';
import { locales } from '@/src/i18n';

import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (newLocale: string) => {
    // Persist language preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-locale', newLocale);
    }

    // Reemplazar el primer segmento de la ruta por el nuevo locale
    const segments = pathname.split('/').filter(Boolean);
    if (locales.includes(segments[0])) {
      segments[0] = newLocale;
    } else {
      segments.unshift(newLocale);
    }
    const newPath = '/' + segments.join('/');
    router.replace(newPath);
  };

  return (
    <div className="language-switcher">
      <label htmlFor="language-select" className="sr-only">
        {t('common.selectLanguage')}
      </label>
      <select
        id="language-select"
        value={locale}
        onChange={(e) => handleLanguageChange(e.target.value)}
        disabled={isPending}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        aria-label={t('common.selectLanguage')}
      >
        <option value="en">English</option>
        <option value="es">Español</option>
      </select>
    </div>
  );
}
