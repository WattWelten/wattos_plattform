'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

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
  const { user, isLoading, isAuthenticated, checkRole, checkAnyRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Check authentication
    if (!isAuthenticated || !user) {
      router.push(redirectTo);
      return;
    }

    // Check roles if required
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requireAnyRole
        ? checkAnyRole(requiredRoles)
        : requiredRoles.every((role) => checkRole(role));

      if (!hasRequiredRole) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRoles, requireAnyRole, checkRole, checkAnyRole, router, redirectTo]);

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

