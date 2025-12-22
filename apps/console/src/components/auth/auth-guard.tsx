'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requireAnyRole?: boolean;
  redirectTo?: string;
}

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

    if (!isAuthenticated || !user) {
      router.push(redirectTo);
      return;
    }

    if (requiredRoles.length > 0) {
      const hasRole = requireAnyRole
        ? checkAnyRole(requiredRoles)
        : requiredRoles.every((role) => checkRole(role));

      if (!hasRole) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRoles, requireAnyRole, checkRole, checkAnyRole, router, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Lädt...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (requiredRoles.length > 0) {
    const hasRole = requireAnyRole
      ? checkAnyRole(requiredRoles)
      : requiredRoles.every((role) => checkRole(role));

    if (!hasRole) {
      return null;
    }
  }

  return <>{children}</>;
}

