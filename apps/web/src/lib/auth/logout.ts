/**
 * Keycloak Logout Flow
 */

import { getKeycloakConfig } from './keycloak';

/**
 * Führt Logout durch
 */
export async function logout(): Promise<void> {
  const config = getKeycloakConfig();

  // Entferne gespeicherte Token mit zentraler Funktion
  if (typeof window !== 'undefined') {
    const { clearAuthTokens } = await import('./token-storage');
    clearAuthTokens();
    sessionStorage.removeItem('auth_redirect');
  }

  // Keycloak Logout URL
  const logoutUrl = `${config.issuer}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  )}`;

  // Redirect zu Keycloak Logout
  if (typeof window !== 'undefined') {
    window.location.href = logoutUrl;
  }
}
