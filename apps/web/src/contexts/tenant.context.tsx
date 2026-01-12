/**
 * Tenant Context
 * 
 * Stellt Tenant-ID aus JWT Token bereit
 * Verhindert manuelles Tenant-Switching für bessere Security
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getValidAccessToken } from '@/lib/auth/token-refresh';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  tenantId?: string;
  userId?: string;
  sub?: string;
  email?: string;
  [key: string]: any;
}

interface TenantContextType {
  tenantId: string | null;
  isLoading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  isLoading: true,
  error: null,
});

interface TenantProviderProps {
  children: ReactNode;
}

/**
 * Extrahiert Tenant-ID aus JWT Token
 */
function extractTenantIdFromToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return null;
    }

    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.tenantId || null;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenantId() {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Versuche Tenant-ID aus JWT zu extrahieren
        const tokenTenantId = extractTenantIdFromToken();
        if (tokenTenantId) {
          setTenantId(tokenTenantId);
          setIsLoading(false);
          return;
        }

        // 2. Fallback: Prüfe ob Token vorhanden ist
        const token = await getValidAccessToken();
        if (!token) {
          setError('Kein gültiger Token gefunden. Bitte melden Sie sich an.');
          setIsLoading(false);
          return;
        }

        // 3. Versuche erneut nach Token-Refresh
        const refreshedTenantId = extractTenantIdFromToken();
        if (refreshedTenantId) {
          setTenantId(refreshedTenantId);
        } else {
          setError('Tenant-ID konnte nicht aus Token extrahiert werden.');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
        setError(`Fehler beim Laden der Tenant-ID: ${errorMessage}`);
        console.error('Tenant context error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTenantId();

    // Listener für Token-Änderungen (z.B. nach Login)
    const handleStorageChange = () => {
      loadTenantId();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Prüfe alle 30 Sekunden, ob Token aktualisiert wurde
    const interval = setInterval(() => {
      const newTenantId = extractTenantIdFromToken();
      if (newTenantId !== tenantId) {
        setTenantId(newTenantId);
      }
    }, 30000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [tenantId]);

  return (
    <TenantContext.Provider value={{ tenantId, isLoading, error }}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook zum Zugriff auf Tenant-Context
 */
export function useTenant(): TenantContextType {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
