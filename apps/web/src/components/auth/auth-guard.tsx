'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from 'next-intl';
import { getLoginUrl } from '@/lib/auth/redirect';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requireAnyRole?: boolean;
  redirectTo?: string;
}

/**
 * Client-Side Auth Guard
 * Schützt Routen vor unauthentifiziertem Zugriff
 */
export function AuthGuard({
  children,
  requiredRoles = [],
  requireAnyRole = false,
  redirectTo = '/login',
}: AuthGuardProps) {
  const disableAuth = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';
  const { user, isLoading, isAuthenticated, checkRole, checkAnyRole } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  // MVP-Mode: Überspringe Auth-Prüfung
  if (disableAuth) {
    return <>{children}</>;
  }

  useEffect(() => {
    if (isLoading) return;

    // Check authentication
    if (!isAuthenticated || !user) {
      // Erstelle Login-Pfad OHNE Locale (next-intl fügt sie hinzu)
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const loginPath = getLoginUrl(locale, currentPath, false); // false = für router.push()
      router.push(loginPath);
      return;
    }

    // Check roles if required
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requireAnyRole
        ? checkAnyRole(requiredRoles)
        : requiredRoles.every((role) => checkRole(role));

      if (!hasRequiredRole) {
        router.push('/unauthorized'); // next-intl fügt Locale automatisch hinzu
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRoles, requireAnyRole, checkRole, checkAnyRole, router, redirectTo, locale]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect
  }

  // Check roles
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requireAnyRole
      ? checkAnyRole(requiredRoles)
      : requiredRoles.every((role) => checkRole(role));

    if (!hasRequiredRole) {
      return null; // Will redirect
    }
  }

  return <>{children}</>;
}

