'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useLocale } from 'next-intl';
import { saveAuthTokens } from '@/lib/auth/token-storage';
import { getLoginRedirect } from '@/lib/auth/redirect';

const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Prüfe API-URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      if (!apiUrl) {
        throw new Error('API-URL nicht konfiguriert');
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Login Debug:', { apiUrl, email: data.email });
      }
      
      // Timeout für Request (30 Sekunden)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.email, // API erwartet 'username'
          password: data.password,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = 'Anmeldung fehlgeschlagen';
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
        } catch {
          // JSON-Parsing fehlgeschlagen, verwende Standard-Fehlermeldung
          if (response.status === 401) {
            errorMessage = 'Ungültige Anmeldedaten';
          } else if (response.status === 500) {
            errorMessage = 'Serverfehler. Bitte versuchen Sie es später erneut.';
          } else if (response.status >= 500) {
            errorMessage = 'Serverfehler. Bitte versuchen Sie es später erneut.';
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Debug: Logge API-Response
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Login API Response:', {
          hasAccessToken: !!result.access_token,
          hasRefreshToken: !!result.refresh_token,
          hasUser: !!result.user,
          resultKeys: Object.keys(result),
          result: result,
        });
      }
      
      // Token konsistent speichern (localStorage + Cookie)
      if (result.access_token) {
        // Extrahiere User aus Response oder Token
        const user = result.user || {
          id: result.sub || result.id || '',
          email: result.email || data.email,
          name: result.name,
          roles: result.roles || ['user'],
          tenantId: result.tenantId || '',
        };

        // Speichere Token mit zentraler Funktion
        // API gibt standardmäßig kein expiresIn zurück, verwende Default 3600s
        const expiresIn = result.expiresIn || result.expires_in || 3600;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Saving tokens:', {
            hasAccessToken: !!result.access_token,
            hasRefreshToken: !!result.refresh_token,
            expiresIn,
            user: user,
          });
        }
        
        saveAuthTokens(
          {
            accessToken: result.access_token,
            refreshToken: result.refresh_token || result.refreshToken,
            expiresIn: expiresIn,
          },
          user
        );
        
        // Debug: Prüfe ob Token gespeichert wurde
        if (process.env.NODE_ENV === 'development') {
          setTimeout(() => {
            const savedToken = localStorage.getItem('access_token');
            const savedUser = localStorage.getItem('wattweiser_user');
            console.log('🔍 Token nach Speicherung:', {
              hasToken: !!savedToken,
              tokenLength: savedToken?.length,
              hasUser: !!savedUser,
              user: savedUser ? JSON.parse(savedUser) : null,
            });
          }, 100);
        }
      } else {
        throw new Error('Kein Access Token erhalten');
      }

      toast({
        title: 'Erfolgreich angemeldet',
        description: 'Sie werden weitergeleitet...',
      });

      // Redirect mit zentraler Logik (berücksichtigt Query-Parameter)
      const redirectTo = getLoginRedirect(locale, '/chat');
      
      // Debug-Logging (nur in Development)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Login Redirect Debug:', {
          locale,
          defaultPath: '/chat',
          redirectTo,
          windowLocation: window.location.pathname,
          searchParams: window.location.search,
          routerType: typeof router,
          routerPush: typeof router.push,
        });
      }
      
      // Fallback falls redirectTo ungültig ist
      // redirectTo enthält bereits OHNE Locale (next-intl fügt sie automatisch hinzu)
      if (!redirectTo || redirectTo === 'undefined' || redirectTo.trim() === '') {
        console.error('❌ Invalid redirect path, using fallback:', redirectTo);
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Attempting router.push("/chat")');
        }
        router.push('/chat'); // OHNE Locale - next-intl fügt sie hinzu
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Attempting router.push:', redirectTo);
        }
        router.push(redirectTo); // OHNE Locale - next-intl fügt sie hinzu
      }
      
      // Debug: Prüfe ob Navigation stattgefunden hat
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          console.log('🔍 After router.push - Current location:', {
            pathname: window.location.pathname,
            href: window.location.href,
          });
        }, 500);
      }
    } catch (error: any) {
      let errorMessage = 'Bitte überprüfen Sie Ihre Anmeldedaten.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Zeitüberschreitung. Bitte überprüfen Sie Ihre Internetverbindung.';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
      }

      toast({
        title: 'Anmeldung fehlgeschlagen',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Anmelden
          </CardTitle>
          <CardDescription className="text-center">
            Geben Sie Ihre Anmeldedaten ein, um fortzufahren
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(onSubmit)(e);
            }} 
            className="space-y-4"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="ihre@email.de"
                {...register('email')}
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-red-600" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-red-600" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <a
                href={`/${locale}/forgot-password`}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Passwort vergessen?
              </a>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-gray-600">
            <p className="mb-2">DSGVO-konform • EU-Hosting • Ihre Daten bleiben sicher</p>
          </div>
          <div className="text-sm text-center">
            <span className="text-gray-600">Noch kein Konto? </span>
            <a href={`/${locale}/register`} className="text-blue-600 hover:text-blue-700 hover:underline">
              Jetzt registrieren
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
