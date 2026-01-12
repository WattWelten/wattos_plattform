'use client';

import { useEffect } from 'react';

/**
 * React DevTools Standalone Integration
 * 
 * Lädt React DevTools Standalone für besseres Debugging in Development.
 * Funktioniert zusätzlich zur Browser-Erweiterung und ist besonders nützlich für:
 * - E2E Test Debugging
 * - CI/CD Environments
 * - Mobile/Remote Debugging
 * 
 * @see https://react.dev/learn/react-developer-tools
 */
export function ReactDevTools() {
  useEffect(() => {
    // Nur in Development-Mode laden
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Nur im Browser ausführen
    if (typeof window === 'undefined') {
      return;
    }

    // Prüfe ob React DevTools Standalone bereits geladen ist
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      return;
    }

    // Lade React DevTools Standalone (läuft auf Port 8097)
    const script = document.createElement('script');
    script.src = 'http://localhost:8097';
    script.async = true;
    script.onerror = () => {
      // Fehler ist OK - Standalone Server läuft nicht
      // Browser-Erweiterung wird stattdessen verwendet
      console.debug('[React DevTools] Standalone nicht verfügbar, verwende Browser-Erweiterung');
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup beim Unmount
      const existingScript = document.querySelector('script[src="http://localhost:8097"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return null;
}
