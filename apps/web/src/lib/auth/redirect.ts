/**
 * Zentrale Redirect-Logik für Login
 * Berücksichtigt Query-Parameter, sessionStorage und Locale
 */

/**
 * Bestimmt die Redirect-URL nach erfolgreichem Login
 * 
 * WICHTIG: Gibt Pfad OHNE Locale zurück, da next-intl router.push() 
 * die Locale automatisch hinzufügt
 * 
 * Priorität:
 * 1. Query-Parameter 'redirect'
 * 2. sessionStorage 'auth_redirect' (für OIDC Flow)
 * 3. Default-Pfad
 */
export function getLoginRedirect(locale: string, defaultPath: string = '/chat'): string {
  if (typeof window === 'undefined') {
    return defaultPath; // OHNE Locale - next-intl fügt sie hinzu
  }

  // 1. Prüfe Query-Parameter
  const urlParams = new URLSearchParams(window.location.search);
  const redirect = urlParams.get('redirect');
  if (redirect) {
    // Dekodiere URL-encoded Pfad
    const decodedRedirect = decodeURIComponent(redirect);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 getLoginRedirect - Query param:', {
        redirect,
        decodedRedirect,
        locale,
      });
    }
    
    // Entferne Locale falls vorhanden (next-intl fügt sie automatisch hinzu)
    if (decodedRedirect.startsWith(`/${locale}/`)) {
      const result = decodedRedirect.substring(locale.length + 1); // Entferne '/de'
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Removed locale from redirect:', result);
      }
      return result;
    }
    if (decodedRedirect.startsWith('/de/') || decodedRedirect.startsWith('/en/')) {
      const segments = decodedRedirect.split('/').filter(Boolean);
      if (segments.length > 1 && (segments[0] === 'de' || segments[0] === 'en')) {
        const result = '/' + segments.slice(1).join('/');
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Removed locale from redirect:', result);
        }
        return result;
      }
    }
    // Pfad OHNE Locale zurückgeben (next-intl fügt sie hinzu)
    const result = decodedRedirect.startsWith('/') ? decodedRedirect : `/${decodedRedirect}`;
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Using decoded redirect as-is:', result);
    }
    return result;
  }

  // 2. Prüfe sessionStorage (für OIDC Flow)
  const authRedirect = sessionStorage.getItem('auth_redirect');
  if (authRedirect) {
    sessionStorage.removeItem('auth_redirect');
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 getLoginRedirect - sessionStorage:', authRedirect);
    }
    // Entferne Locale falls vorhanden
    if (authRedirect.startsWith(`/${locale}/`)) {
      return authRedirect.substring(locale.length + 1);
    }
    if (authRedirect.startsWith('/de/') || authRedirect.startsWith('/en/')) {
      const segments = authRedirect.split('/').filter(Boolean);
      if (segments.length > 1 && (segments[0] === 'de' || segments[0] === 'en')) {
        return '/' + segments.slice(1).join('/');
      }
    }
    return authRedirect.startsWith('/') ? authRedirect : `/${authRedirect}`;
  }

  // 3. Default - OHNE Locale (next-intl fügt sie automatisch hinzu)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 getLoginRedirect - Using default:', defaultPath);
  }
  return defaultPath;
}

/**
 * Erstellt Login-URL mit Redirect-Parameter
 * 
 * WICHTIG: Für router.push() von next-intl OHNE Locale verwenden,
 * da next-intl die Locale automatisch hinzufügt.
 * Für direkte Links (href) MIT Locale verwenden.
 * 
 * @param locale - Locale (wird für direkte Links verwendet)
 * @param redirectTo - Pfad OHNE Locale (wird für router.push() verwendet)
 * @param forDirectLink - true für direkte Links (href), false für router.push()
 */
export function getLoginUrl(locale: string, redirectTo?: string, forDirectLink: boolean = false): string {
  // Für router.push() OHNE Locale (next-intl fügt sie hinzu)
  if (!forDirectLink) {
    const loginPath = '/login';
    if (redirectTo) {
      // Entferne Locale aus redirectTo falls vorhanden
      let cleanRedirect = redirectTo;
      if (redirectTo.startsWith(`/${locale}/`)) {
        cleanRedirect = redirectTo.substring(locale.length + 1);
      } else if (redirectTo.startsWith('/de/') || redirectTo.startsWith('/en/')) {
        const segments = redirectTo.split('/').filter(Boolean);
        if (segments.length > 1 && (segments[0] === 'de' || segments[0] === 'en')) {
          cleanRedirect = '/' + segments.slice(1).join('/');
        }
      }
      return `${loginPath}?redirect=${encodeURIComponent(cleanRedirect)}`;
    }
    return loginPath;
  }
  
  // Für direkte Links MIT Locale
  const loginUrl = `/${locale}/login`;
  if (redirectTo) {
    return `${loginUrl}?redirect=${encodeURIComponent(redirectTo)}`;
  }
  return loginUrl;
}
