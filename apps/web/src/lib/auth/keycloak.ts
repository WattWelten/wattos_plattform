/**
 * Keycloak Client Configuration
 * Konfiguration für Keycloak OIDC-Client mit PKCE
 */

export interface KeycloakConfig {
  issuer: string;
  clientId: string;
  redirectUri: string;
}

export function getKeycloakConfig(): KeycloakConfig {
  const issuer = process.env.NEXT_PUBLIC_AUTH_ISSUER || 'http://localhost:8080/realms/wattos';
  const clientId = process.env.NEXT_PUBLIC_AUTH_CLIENT_ID || 'web';
  const redirectUri =
    typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'http://localhost:3000/auth/callback';

  return {
    issuer,
    clientId,
    redirectUri,
  };
}

/**
 * Generiert Code Verifier und Code Challenge für PKCE
 */
export async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  // Generiere zufälligen Code Verifier (43-128 Zeichen)
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // Generiere Code Challenge (SHA256 Hash von Code Verifier)
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return { codeVerifier, codeChallenge };
}

/**
 * Speichert PKCE-Werte im Session Storage
 */
export function storePKCE(codeVerifier: string, state: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    sessionStorage.setItem('pkce_state', state);
  }
}

/**
 * Holt PKCE-Werte aus Session Storage
 */
export function getStoredPKCE(): { codeVerifier: string | null; state: string | null } {
  if (typeof window === 'undefined') {
    return { codeVerifier: null, state: null };
  }
  return {
    codeVerifier: sessionStorage.getItem('pkce_code_verifier'),
    state: sessionStorage.getItem('pkce_state'),
  };
}

/**
 * Entfernt PKCE-Werte aus Session Storage
 */
export function clearPKCE(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('pkce_code_verifier');
    sessionStorage.removeItem('pkce_state');
  }
}

/**
 * Generiert State-Parameter für OAuth-Flow
 */
export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
