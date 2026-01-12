'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { NextIntlClientProvider } from 'next-intl';
import { useState, useEffect } from 'react';
import { GuidedTourProvider } from '@/components/onboarding/GuidedTourProvider';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { TenantProvider } from '@/contexts/tenant.context';
import { getValidAccessToken, isTokenExpired, refreshAccessTokenSilently } from '@/lib/auth/token-refresh';
import { ReactDevTools } from '@/components/dev/ReactDevTools';
import { getLoginUrl } from '@/lib/auth/redirect';

export function Providers({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: string;
  messages: Record<string, unknown>;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  // Automatischer Token-Refresh mit Silent-Refresh
  useEffect(() => {
    const checkToken = async () => {
      if (typeof window === 'undefined') return;
      
      // Prüfe zuerst ob Token vorhanden ist
      const hasToken = localStorage.getItem('access_token');
      if (!hasToken) {
        return; // Kein Token = nicht eingeloggt, kein Refresh nötig
      }
      
      // Versuche Silent-Refresh (2min vor Ablauf)
      try {
        const refreshed = await refreshAccessTokenSilently();
        if (refreshed) {
          return; // Token wurde erfolgreich aktualisiert
        }
      } catch (error) {
        // Ignoriere Fehler beim Silent-Refresh (wird bereits in refreshAccessTokenSilently behandelt)
        if (process.env.NODE_ENV === 'development') {
          console.debug('Silent refresh error (ignored):', error);
        }
      }

      // Falls Silent-Refresh nicht möglich war, prüfe ob Token abgelaufen ist
      if (isTokenExpired()) {
        try {
          await getValidAccessToken();
        } catch (error) {
          // Token-Refresh fehlgeschlagen, redirect zu Login
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const locale = currentPath.split('/')[1] || 'de'; // Extract current locale or default
            window.location.href = getLoginUrl(locale, currentPath, true); // Redirect with locale
          }
        }
      }
    };

    // Sofort prüfen
    checkToken();

    // Dann alle 2 Minuten (für Silent-Refresh)
    const interval = setInterval(checkToken, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <TenantProvider>
            <GuidedTourProvider>
              <ReactDevTools />
              <OnboardingFlow />
              {children}
            </GuidedTourProvider>
          </TenantProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}


