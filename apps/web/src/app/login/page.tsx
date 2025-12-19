'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertIcon } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.email, // API erwartet 'username'
          password: data.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Anmeldung fehlgeschlagen' }));
        throw new Error(error.message || 'Anmeldung fehlgeschlagen');
      }

      const result = await response.json();
      
      // Token speichern
      if (result.access_token) {
        document.cookie = `wattweiser_auth_token=${result.access_token}; path=/; max-age=3600; SameSite=Lax`;
      }

      toast({
        title: 'Erfolgreich angemeldet',
        description: 'Sie werden weitergeleitet...',
      });

      // Redirect nach erfolgreichem Login
      window.location.href = '/de/chat';
    } catch (error: any) {
      toast({
        title: 'Anmeldung fehlgeschlagen',
        description: error.message || 'Bitte überprüfen Sie Ihre Anmeldedaten.',
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                <p id="email-error" className="text-sm text-error-600" role="alert">
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
                <p id="password-error" className="text-sm text-error-600" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Link
                href="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
              >
                Passwort vergessen?
              </Link>
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
            <Link href="/register" className="text-primary-600 hover:text-primary-700 hover:underline">
              Jetzt registrieren
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}


