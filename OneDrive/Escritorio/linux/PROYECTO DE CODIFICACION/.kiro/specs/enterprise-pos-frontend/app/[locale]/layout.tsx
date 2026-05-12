import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import '../globals.css';
import { locales } from '../../src/i18n';
import { ErrorBoundary } from '../../src/adapters/ui/components/ErrorBoundary';
import { OfflineIndicator } from '../../src/adapters/ui/components/OfflineIndicator';
import { ServiceWorkerRegistration } from '../../src/adapters/ui/components/ServiceWorkerRegistration';
import { SaleProvider } from '../../src/adapters/ui/context/SaleContext';
import { AuthProvider } from '../../src/adapters/ui/context/AuthContext';
import { OfflineProvider } from '../../src/adapters/ui/context/OfflineContext';

export const metadata: Metadata = {
  title: 'Enterprise POS System',
  description: 'Production-ready Point of Sale system',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate locale - usar default si no es válido
  const validLocale = locales.includes(locale as any) ? locale : 'en';

  // Get messages for the locale
  const messages = await getMessages();

  return (
    <html lang={validLocale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ErrorBoundary>
          <NextIntlClientProvider messages={messages}>
            <AuthProvider>
              <OfflineProvider>
                <SaleProvider>
                  <ServiceWorkerRegistration />
                  {children}
                  <OfflineIndicator />
                </SaleProvider>
              </OfflineProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
