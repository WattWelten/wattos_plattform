/**
 * Keycloak Token Refresh
 */

import { getKeycloakConfig } from './keycloak';

/**
 * Aktualisiert Access Token mit Refresh Token
 */
export async function refreshAccessToken(): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const config = getKeycloakConfig();

  if (typeof window === 'undefined') {
    throw new Error('Token refresh only available in browser');
  }

  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const tokenUrl = `${config.issuer}/protocol/openid-connect/token`;
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.clientId,
    refresh_token: refreshToken,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    // Refresh Token ist ungültig, lösche alle Token
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
    throw new Error('Token refresh failed');
  }

  const tokenData = await response.json();

  // Speichere neue Token
  localStorage.setItem('access_token', tokenData.access_token);
  if (tokenData.refresh_token) {
    localStorage.setItem('refresh_token', tokenData.refresh_token);
  }
  localStorage.setItem('token_expires_at', String(Date.now() + tokenData.expires_in * 1000));
  
  // Aktualisiere Cookie
  document.cookie = `access_token=${tokenData.access_token}; path=/; max-age=${tokenData.expires_in}; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`;

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || refreshToken,
    expiresIn: tokenData.expires_in,
  };
}

/**
 * Holt gültigen Access Token (refresht automatisch falls nötig)
 */
export async function getValidAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const accessToken = localStorage.getItem('access_token');
  const expiresAt = localStorage.getItem('token_expires_at');

  // Prüfe ob Token abgelaufen ist (mit 5 Minuten Puffer)
  if (!accessToken || !expiresAt || Date.now() >= parseInt(expiresAt, 10) - 5 * 60 * 1000) {
    try {
      const refreshed = await refreshAccessToken();
      return refreshed.accessToken;
    } catch (error) {
      // Refresh fehlgeschlagen, lösche Token
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expires_at');
      return null;
    }
  }

  return accessToken;
}

/**
 * Prüft ob Token abgelaufen ist
 */
export function isTokenExpired(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  const expiresAt = localStorage.getItem('token_expires_at');
  if (!expiresAt) {
    return true;
  }
  return Date.now() >= parseInt(expiresAt, 10);
}
