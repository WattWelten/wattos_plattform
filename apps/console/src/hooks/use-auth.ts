'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getUser,
  login as authLogin,
  logout as authLogout,
  isAuthenticated,
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
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = getUser();
        if (currentUser && isAuthenticated()) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth load error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const { user: loggedInUser } = await authLogin(email, password);
        setUser(loggedInUser);
        router.push('/overview');
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
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  const checkRole = useCallback(
    (role: string): boolean => {
      return user?.roles.includes(role) ?? false;
    },
    [user],
  );

  const checkAnyRole = useCallback(
    (roles: string[]): boolean => {
      return roles.some((role) => user?.roles.includes(role)) ?? false;
    },
    [user],
  );

  return {
    user,
    isLoading,
    isAuthenticated: isAuthenticated() && user !== null,
    login,
    logout,
    checkRole,
    checkAnyRole,
  };
}



