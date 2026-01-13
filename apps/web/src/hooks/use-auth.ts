'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  login as authLogin,
  logout as authLogout,
  getUser,
  isAuthenticated,
  hasRole,
  hasAnyRole,
  refreshAuthToken,
  type User,
} from '@/lib/auth';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkRole: (role: string) => boolean;
  checkAnyRole: (roles: string[]) => boolean;
  refresh: () => Promise<void>;
}

/**
 * MVP-Mode Mock-User
 */
const MVP_MOCK_USER: User = {
  id: 'mvp-user',
  email: 'mvp@wattweiser.com',
  name: 'MVP Demo User',
  roles: ['ADMIN', 'USER'],
  tenantId: 'default',
};

export function useAuth(): UseAuthReturn {
  const disableAuth = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';
  const [user, setUser] = useState<User | null>(disableAuth ? MVP_MOCK_USER : null);
  const [isLoading, setIsLoading] = useState(!disableAuth);
  const router = useRouter();

  // Initial load
  useEffect(() => {
    // MVP-Mode: Mock-User sofort setzen
    if (disableAuth) {
      setIsLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        const currentUser = getUser();
        if (currentUser && isAuthenticated()) {
          setUser(currentUser);
        } else if (isAuthenticated()) {
          // Token exists but user not in localStorage, try to refresh
          const tokens = await refreshAuthToken();
          if (tokens) {
            // User should be set by refresh, reload
            const refreshedUser = getUser();
            setUser(refreshedUser);
          }
        }
      } catch (error) {
        console.error('Auth load error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [disableAuth]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const { user: loggedInUser } = await authLogin(email, password);
        setUser(loggedInUser);
        router.push('/chat');
      } catch (error) {
        throw error;
      }
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await authLogout();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if API call fails
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  const refresh = useCallback(async () => {
    try {
      const tokens = await refreshAuthToken();
      if (tokens) {
        const refreshedUser = getUser();
        setUser(refreshedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Refresh error:', error);
      setUser(null);
    }
  }, []);

  return {
    user: disableAuth ? MVP_MOCK_USER : user,
    isLoading,
    isAuthenticated: disableAuth ? true : (isAuthenticated() && user !== null),
    login,
    logout,
    checkRole: (role: string) => hasRole(role),
    checkAnyRole: (roles: string[]) => hasAnyRole(roles),
    refresh,
  };
}

