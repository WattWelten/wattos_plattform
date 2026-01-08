/**
 * Keycloak Logout Flow
 */

import { getKeycloakConfig } from './keycloak';

/**
 * Führt Logout durch
 */
export async function logout(): Promise<void> {
  const config = getKeycloakConfig();

  // Entferne gespeicherte Token
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
    sessionStorage.removeItem('auth_redirect');
    
    // Entferne Cookie
    document.cookie = 'wattweiser_auth_token=; path=/; max-age=0';
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
