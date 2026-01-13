/**
 * Zentrale Authenticated Fetch Funktion
 * Unterstützt MVP-Mode (kein Token nötig) und normalen Auth-Mode
 */

import { getValidAccessToken } from '../auth/token-refresh';

/**
 * Authenticated fetch mit automatischem Token-Refresh und Retry-Logic
 * Im MVP-Mode wird kein Token benötigt (Gateway setzt Mock-User)
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  retries = 3,
): Promise<Response> {
  const disableAuth = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // MVP-Mode: Kein Token nötig (Gateway setzt Mock-User)
  if (!disableAuth) {
    const token = await getValidAccessToken();
    if (!token) {
      throw new Error('Nicht authentifiziert. Bitte melden Sie sich erneut an.');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const fetchWithRetry = async (attempt: number): Promise<Response> => {
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Wichtig für Cookie-basierte Auth
        signal: options.signal || AbortSignal.timeout(30000), // 30s Timeout
      });

      // Token abgelaufen, versuche Refresh (nur wenn nicht MVP-Mode)
      if (response.status === 401 && !disableAuth && attempt < retries) {
        const refreshedToken = await getValidAccessToken();
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`;
          return fetchWithRetry(attempt + 1);
        }
        // Refresh fehlgeschlagen, redirect zu Login
        if (typeof window !== 'undefined') {
          const locale = window.location.pathname.split('/')[1] || 'de';
          window.location.href = `/${locale}/login`;
        }
        throw new Error('Session abgelaufen. Bitte melden Sie sich erneut an.');
      }

      return response;
    } catch (error) {
      // Network error oder Timeout - retry mit exponential backoff (nur wenn nicht MVP-Mode)
      if (attempt < retries && error instanceof Error && !disableAuth) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(attempt + 1);
      }
      throw error;
    }
  };

  return fetchWithRetry(0);
}
