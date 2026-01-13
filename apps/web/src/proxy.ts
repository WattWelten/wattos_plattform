import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

/**
 * Verify user has admin role via API
 * Returns false on any error to allow graceful degradation
 */
async function verifyAdminRole(token: string): Promise<boolean> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return false;
    }

    const userData = await response.json();
    const roles = userData.roles || [];
    return roles.some(
      (role: string) =>
        role.toLowerCase() === 'admin' ||
        role.toLowerCase() === 'administrator' ||
        role === 'ADMIN',
    );
  } catch (error) {
    return false;
  }
}

// Protected routes (without locale prefix)
// MVP-Mode: Wenn DISABLE_AUTH=true, sind keine Routen geschützt
// WICHTIG: Environment-Variablen werden zur Build-Zeit geladen!
const disableAuth = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';
const protectedRoutes = disableAuth ? [] : ['/chat', '/admin', '/onboarding'];
const adminRoutes = disableAuth ? [] : ['/admin'];

// Debug-Logging (nur in Development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 [Proxy] MVP-Mode:', {
    disableAuth,
    NEXT_PUBLIC_DISABLE_AUTH: process.env.NEXT_PUBLIC_DISABLE_AUTH,
    protectedRoutes,
    adminRoutes,
  });
}

export default async function proxy(request: NextRequest) {
  // First, let next-intl handle the request
  const response = await intlMiddleware(request);
  
  // If it's a redirect, return it immediately
  if (response.status === 307 || response.status === 308) {
    return response;
  }

  const { pathname } = request.nextUrl;
  
  // Extract locale from pathname
  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0];
  
  // Only proceed with auth checks if we have a valid locale
  if (!locale || !routing.locales.includes(locale as any)) {
    return response;
  }
  
  // Get path without locale
  const pathWithoutLocale = segments.length > 1 
    ? '/' + segments.slice(1).join('/') 
    : '/';

  // MVP-Mode: Überspringe alle Auth-Checks
  if (disableAuth) {
    return response;
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathWithoutLocale.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathWithoutLocale.startsWith(route));

  // Get auth token from cookies (prüfe beide Cookie-Namen für Rückwärtskompatibilität)
  const authToken = request.cookies.get('access_token')?.value 
    || request.cookies.get('wattweiser_auth_token')?.value;

  // Skip auth check für Auth-Callback
  if (pathWithoutLocale.startsWith('/auth/callback')) {
    return response;
  }

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin access
  if (isAdminRoute && authToken) {
    const hasAdminRole = await verifyAdminRole(authToken);
    if (!hasAdminRole) {
      const unauthorizedUrl = new URL(`/${locale}/unauthorized`, request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
