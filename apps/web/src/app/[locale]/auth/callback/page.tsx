'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { handleAuthCallback } from '@/lib/auth/login';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { useLocale } from 'next-intl';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchParams) return;
    
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(`Authentication error: ${errorParam}`);
      setTimeout(() => {
        router.push('/login'); // next-intl fügt Locale automatisch hinzu
      }, 3000);
      return;
    }

    if (!code || !state) {
      setError('Missing authorization code or state');
      setTimeout(() => {
        router.push('/login'); // next-intl fügt Locale automatisch hinzu
      }, 3000);
      return;
    }

    // Verarbeite Authorization Callback
    handleAuthCallback(code, state)
      .then(() => {
        // Redirect mit zentraler Logik (berücksichtigt sessionStorage)
        const redirectTo = getLoginRedirect(locale, '/dashboard');
        router.push(redirectTo);
      })
      .catch((err) => {
        setError(err.message || 'Authentication failed');
        setTimeout(() => {
          router.push('/login'); // next-intl fügt Locale automatisch hinzu
        }, 3000);
      });
  }, [searchParams, router, locale]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
