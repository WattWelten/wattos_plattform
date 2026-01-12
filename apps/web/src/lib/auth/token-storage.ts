/**
 * Zentrale Token-Speicherung
 * Konsistente Speicherung von Auth-Tokens in localStorage und Cookies
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  roles?: string[];
  tenantId?: string;
}

/**
 * Speichert Auth-Tokens konsistent in localStorage und Cookie
 */
export function saveAuthTokens(tokens: AuthTokens, user?: User): void {
  if (typeof window === 'undefined') return;

  // localStorage (für Client-Side Zugriff)
  localStorage.setItem('access_token', tokens.accessToken);
  if (tokens.refreshToken) {
    localStorage.setItem('refresh_token', tokens.refreshToken);
  }
  localStorage.setItem('token_expires_at', String(Date.now() + tokens.expiresIn * 1000));

  // Cookie (für Middleware/Server-Side Zugriff)
  const isSecure = window.location.protocol === 'https:';
  document.cookie = `access_token=${tokens.accessToken}; path=/; max-age=${tokens.expiresIn}; SameSite=Lax; ${isSecure ? 'Secure;' : ''}`;

  // User-Informationen
  if (user) {
    localStorage.setItem('wattweiser_user', JSON.stringify(user));
  }
}

/**
 * Entfernt alle Auth-Tokens
 */
export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;

  // localStorage
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token_expires_at');
  localStorage.removeItem('wattweiser_user');

  // Cookie
  document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'wattweiser_auth_token=; path=/; max-age=0; SameSite=Lax';
}

/**
 * Holt Access Token aus localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

/**
 * Holt Refresh Token aus localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}

/**
 * Prüft ob Token abgelaufen ist
 */
export function isTokenExpired(): boolean {
  if (typeof window === 'undefined') return true;
  const expiresAt = localStorage.getItem('token_expires_at');
  if (!expiresAt) return true;
  return Date.now() >= parseInt(expiresAt, 10);
}
