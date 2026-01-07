import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Protected routes that require authentication
const protectedRoutes = ['/chat', '/admin', '/onboarding'];
const adminRoutes = ['/admin'];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = pathname.split('/')[1] || routing.defaultLocale;
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathWithoutLocale.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathWithoutLocale.startsWith(route));
  // const isPublicRoute = publicRoutes.some((route) => pathWithoutLocale === route || pathWithoutLocale.startsWith(route));

  // Get auth token from cookies
  const authToken = request.cookies.get('wattweiser_auth_token')?.value;

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin access
  if (isAdminRoute && authToken) {
    // TODO: Verify user has admin role via API
    // For now, we'll let the AuthGuard handle role checks on the client side
    // In production, you should verify the token and roles server-side
  }

  // Apply i18n middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};

