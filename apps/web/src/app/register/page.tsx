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
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
    email: z.string().email('Ungültige E-Mail-Adresse'),
    password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
    confirmPassword: z.string(),
    tenantType: z.enum(['kmu', 'schule', 'verwaltung'], {
      message: 'Bitte wählen Sie einen Typ aus',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
          tenantType: data.tenantType,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Registrierung fehlgeschlagen' }));
        throw new Error(error.message || 'Registrierung fehlgeschlagen');
      }

      const result = await response.json();
      
      // Token speichern falls vorhanden
      if (result.access_token) {
        document.cookie = `wattweiser_auth_token=${result.access_token}; path=/; max-age=3600; SameSite=Lax`;
      }

      toast({
        title: 'Registrierung erfolgreich',
        description: 'Sie werden zum Onboarding weitergeleitet...',
      });

      // Redirect zum Onboarding
      window.location.href = '/de/onboarding';
    } catch (error: any) {
      toast({
        title: 'Registrierung fehlgeschlagen',
        description: error.message || 'Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Konto erstellen
          </CardTitle>
          <CardDescription className="text-center">
            Erstellen Sie Ihr Konto, um zu starten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Max Mustermann"
                {...register('name')}
                aria-invalid={errors.name ? 'true' : 'false'}
              />
              {errors.name && (
                <p className="text-sm text-error-600" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="ihre@email.de"
                {...register('email')}
                aria-invalid={errors.email ? 'true' : 'false'}
              />
              {errors.email && (
                <p className="text-sm text-error-600" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantType">Organisationstyp</Label>
              <Select
                id="tenantType"
                {...register('tenantType')}
                aria-invalid={errors.tenantType ? 'true' : 'false'}
              >
                <option value="">Bitte wählen...</option>
                <option value="kmu">KMU / Mittelstand</option>
                <option value="schule">Schule / Bildungseinrichtung</option>
                <option value="verwaltung">Verwaltung / Behörde</option>
              </Select>
              {errors.tenantType && (
                <p className="text-sm text-error-600" role="alert">
                  {errors.tenantType.message}
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
              />
              {errors.password && (
                <p className="text-sm text-error-600" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-error-600" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="text-xs text-gray-600 space-y-2">
              <p>
                Mit der Registrierung stimmen Sie unseren{' '}
                <Link href="/datenschutz" className="text-primary-600 hover:underline">
                  Datenschutzbestimmungen
                </Link>{' '}
                und den{' '}
                <Link href="/agb" className="text-primary-600 hover:underline">
                  AGB
                </Link>{' '}
                zu.
              </p>
              <p className="flex items-start gap-2">
                <span className="text-success-600">✓</span>
                <span>DSGVO-konform • EU-Hosting • Ihre Daten bleiben sicher</span>
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Wird erstellt...' : 'Konto erstellen'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-center">
            <span className="text-gray-600">Bereits ein Konto? </span>
            <Link href="/login" className="text-primary-600 hover:text-primary-700 hover:underline">
              Anmelden
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}


