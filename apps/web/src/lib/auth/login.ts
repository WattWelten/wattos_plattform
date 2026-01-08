/**
 * Keycloak Login Flow mit PKCE
 */

import { getKeycloakConfig, generatePKCE, storePKCE, generateState, getStoredPKCE, clearPKCE } from './keycloak';

export interface LoginOptions {
  redirectTo?: string;
}

/**
 * Initiert Keycloak Login-Flow mit PKCE
 */
export async function initiateLogin(options: LoginOptions = {}): Promise<void> {
  const config = getKeycloakConfig();
  const { codeVerifier, codeChallenge } = await generatePKCE();
  const state = generateState();

  // Speichere Code Verifier und State für späteren Token-Exchange
  storePKCE(codeVerifier, state);

  // Speichere Redirect-URL
  if (options.redirectTo && typeof window !== 'undefined') {
    sessionStorage.setItem('auth_redirect', options.redirectTo);
  }

  // Baue Authorization URL
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid profile email roles',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const authUrl = `${config.issuer}/protocol/openid-connect/auth?${params.toString()}`;

  // Redirect zu Keycloak
  if (typeof window !== 'undefined') {
    window.location.href = authUrl;
  }
}

/**
 * Verarbeitet Authorization Code und tauscht ihn gegen Token
 */
export async function handleAuthCallback(code: string, state: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const config = getKeycloakConfig();
  const { codeVerifier, state: storedState } = getStoredPKCE();

  // Validiere State
  if (state !== storedState) {
    throw new Error('Invalid state parameter');
  }

  if (!codeVerifier) {
    throw new Error('Code verifier not found');
  }

  // Tausche Authorization Code gegen Token
  const tokenUrl = `${config.issuer}/protocol/openid-connect/token`;
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    code,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Token exchange failed' }));
    throw new Error(error.error_description || error.error || 'Token exchange failed');
  }

  const tokenData = await response.json();

  // Speichere Token in localStorage und Cookie
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', tokenData.access_token);
    localStorage.setItem('refresh_token', tokenData.refresh_token);
    localStorage.setItem('token_expires_at', String(Date.now() + tokenData.expires_in * 1000));
    
    // Setze Cookie für Middleware (Server-seitige Validierung)
    document.cookie = `wattweiser_auth_token=${tokenData.access_token}; path=/; max-age=${tokenData.expires_in}; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`;
  }

  // Entferne PKCE-Werte
  clearPKCE();

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
  };
}

/**
 * Holt gespeicherten Access Token
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('access_token');
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
