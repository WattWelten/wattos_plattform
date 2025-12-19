/**
 * Auth Utilities
 * Token-Management, Session-Handling, API-Calls
 */

const AUTH_TOKEN_KEY = 'wattweiser_auth_token';
const REFRESH_TOKEN_KEY = 'wattweiser_refresh_token';
const USER_KEY = 'wattweiser_user';

export interface User {
  id: string;
  email: string;
  name?: string;
  roles: string[];
  tenantId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Token im LocalStorage speichern
 */
export function setAuthTokens(tokens: AuthTokens): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  localStorage.setItem('wattweiser_expires_at', tokens.expiresAt.toString());
}

/**
 * Token aus LocalStorage abrufen
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Refresh Token abrufen
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Token löschen
 */
export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('wattweiser_expires_at');
  localStorage.removeItem(USER_KEY);
}

/**
 * Prüfen ob Token abgelaufen ist
 */
export function isTokenExpired(): boolean {
  if (typeof window === 'undefined') return true;
  const expiresAt = localStorage.getItem('wattweiser_expires_at');
  if (!expiresAt) return true;
  return Date.now() >= parseInt(expiresAt, 10);
}

/**
 * User im LocalStorage speichern
 */
export function setUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * User aus LocalStorage abrufen
 */
export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

/**
 * Login API-Call
 */
export async function login(
  email: string,
  password: string,
): Promise<{ user: User; tokens: AuthTokens }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const response = await fetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username: email, password }), // API erwartet 'username'
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login fehlgeschlagen' }));
    throw new Error(error.message || 'Login fehlgeschlagen');
  }

  const data = await response.json();
  
  // API gibt access_token zurück, nicht accessToken
  const tokens: AuthTokens = {
    accessToken: data.access_token || data.accessToken,
    refreshToken: data.refresh_token || data.refreshToken || '',
    expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
  };

  setAuthTokens(tokens);
  
  // User aus Token oder Response extrahieren
  const user: User = data.user || {
    id: data.sub || '',
    email: data.email || email,
    name: data.name,
    roles: data.roles || ['user'],
    tenantId: data.tenantId || '',
  };
  
  setUser(user);

  return { user, tokens };
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const token = getAuthToken();

  if (token) {
    try {
      await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      // Ignore errors on logout
      console.error('Logout error:', error);
    }
  }

  clearAuthTokens();
}

/**
 * Token aktualisieren
 */
export async function refreshAuthToken(): Promise<AuthTokens | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const response = await fetch(`${apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearAuthTokens();
      return null;
    }

    const data = await response.json();
    const tokens: AuthTokens = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || refreshToken,
      expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
    };

    setAuthTokens(tokens);
    return tokens;
  } catch (error) {
    clearAuthTokens();
    return null;
  }
}

/**
 * Prüfen ob User authentifiziert ist
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  return !isTokenExpired();
}

/**
 * Prüfen ob User eine bestimmte Rolle hat
 */
export function hasRole(role: string): boolean {
  const user = getUser();
  if (!user) return false;
  return user.roles.includes(role);
}

/**
 * Prüfen ob User eine der Rollen hat
 */
export function hasAnyRole(roles: string[]): boolean {
  const user = getUser();
  if (!user) return false;
  return roles.some((role) => user.roles.includes(role));
}

/**
 * API-Request mit Auth-Token
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  let token = getAuthToken();

  // Token aktualisieren falls abgelaufen
  if (!token || isTokenExpired()) {
    const newTokens = await refreshAuthToken();
    token = newTokens?.accessToken || token;
  }

  if (!token) {
    throw new Error('Nicht authentifiziert');
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

