'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { NextIntlClientProvider } from 'next-intl';
import { useState, useEffect } from 'react';
import { GuidedTourProvider } from '@/components/onboarding/GuidedTourProvider';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { getValidAccessToken, isTokenExpired } from '@/lib/auth/token-refresh';

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

  // Automatischer Token-Refresh
  useEffect(() => {
    const checkToken = async () => {
      if (typeof window === 'undefined') return;
      
      if (isTokenExpired()) {
        try {
          await getValidAccessToken();
        } catch (error) {
          // Token-Refresh fehlgeschlagen, redirect zu Login
          if (typeof window !== 'undefined') {
            window.location.href = '/de/login';
          }
        }
      }
    };

    // Sofort prüfen
    checkToken();

    // Dann alle 5 Minuten
    const interval = setInterval(checkToken, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <GuidedTourProvider>
            <OnboardingFlow />
            {children}
          </GuidedTourProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}


