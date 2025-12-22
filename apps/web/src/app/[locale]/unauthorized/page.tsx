import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Link as I18nLink } from '@/i18n/routing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function UnauthorizedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // const t = await getTranslations('Common');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Zugriff verweigert</CardTitle>
          <CardDescription>
            Sie haben keine Berechtigung, auf diese Seite zuzugreifen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Bitte wenden Sie sich an Ihren Administrator, wenn Sie glauben, dass dies ein Fehler ist.
          </p>
          <div className="flex gap-2 justify-center">
            <I18nLink href="/chat" locale={locale}>
              <Button variant="outline">Zurück zum Chat</Button>
            </I18nLink>
            <I18nLink href="/" locale={locale}>
              <Button>Zur Startseite</Button>
            </I18nLink>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

