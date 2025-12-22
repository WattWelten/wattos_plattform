/**
 * Auth Utilities für Console
 * Identisch zu customer-portal
 */

const AUTH_TOKEN_KEY = 'wattweiser_auth_token';

export interface User {
  id: string;
  email: string;
  name?: string;
  roles: string[];
  tenantId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export function setAuthTokens(tokens: AuthTokens): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_TOKEN_KEY, tokens.accessToken);
    if (tokens.refreshToken) {
      localStorage.setItem(`${AUTH_TOKEN_KEY}_refresh`, tokens.refreshToken);
    }
    localStorage.setItem(`${AUTH_TOKEN_KEY}_expires`, tokens.expiresAt.toString());
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearAuthTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(`${AUTH_TOKEN_KEY}_refresh`);
    localStorage.removeItem(`${AUTH_TOKEN_KEY}_expires`);
  }
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const userStr = localStorage.getItem('wattweiser_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function setUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('wattweiser_user', JSON.stringify(user));
  }
}

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
    body: JSON.stringify({ username: email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login fehlgeschlagen' }));
    throw new Error(error.message || 'Login fehlgeschlagen');
  }

  const data = await response.json();
  
  const tokens: AuthTokens = {
    accessToken: data.access_token || data.accessToken,
    refreshToken: data.refresh_token || data.refreshToken || '',
    expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
  };

  setAuthTokens(tokens);
  
  const user: User = data.user || {
    id: data.sub || '',
    email: data.email || email,
    name: data.name,
    roles: data.roles || ['admin'],
    tenantId: data.tenantId || '',
  };
  
  setUser(user);

  return { user, tokens };
}

export async function logout(): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const token = getAuthToken();
  
  try {
    if (token) {
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearAuthTokens();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wattweiser_user');
    }
  }
}

export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  
  const expiresAt = localStorage.getItem(`${AUTH_TOKEN_KEY}_expires`);
  if (expiresAt && parseInt(expiresAt) < Date.now()) {
    clearAuthTokens();
    return false;
  }
  
  return true;
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getAuthToken();

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

