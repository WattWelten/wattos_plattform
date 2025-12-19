/**
 * Server-Side Auth Utilities
 * Für Middleware und Server Components
 */

import { cookies } from 'next/headers';

export interface ServerUser {
  id: string;
  email: string;
  name?: string;
  roles: string[];
  tenantId: string;
}

const AUTH_TOKEN_KEY = 'wattweiser_auth_token';

/**
 * Auth-Token aus Cookies abrufen (Server-Side)
 */
export async function getServerAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_KEY)?.value || null;
}

/**
 * User-Info vom API-Gateway abrufen (Server-Side)
 */
export async function getServerUser(): Promise<ServerUser | null> {
  const token = await getServerAuthToken();
  if (!token) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const response = await fetch(`${apiUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const user = await response.json();
    return user as ServerUser;
  } catch (error) {
    console.error('Server auth error:', error);
    return null;
  }
}

/**
 * Prüfen ob User authentifiziert ist (Server-Side)
 */
export async function isServerAuthenticated(): Promise<boolean> {
  const user = await getServerUser();
  return user !== null;
}

/**
 * Prüfen ob User eine Rolle hat (Server-Side)
 */
export async function serverHasRole(role: string): Promise<boolean> {
  const user = await getServerUser();
  if (!user) return false;
  return user.roles.includes(role);
}

/**
 * Prüfen ob User eine der Rollen hat (Server-Side)
 */
export async function serverHasAnyRole(roles: string[]): Promise<boolean> {
  const user = await getServerUser();
  if (!user) return false;
  return roles.some((role) => user.roles.includes(role));
}

