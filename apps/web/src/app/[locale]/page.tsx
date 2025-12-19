import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Link as I18nLink } from '@/i18n/routing';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('Index');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">WattWeiser</div>
          <nav className="flex gap-4">
            <I18nLink href="/lösungen" locale={locale}>
              {t('Common.solutions')}
            </I18nLink>
            <I18nLink href="/branchen" locale={locale}>
              {t('Common.industries')}
            </I18nLink>
            <I18nLink href="/ressourcen" locale={locale}>
              {t('Common.resources')}
            </I18nLink>
            <I18nLink href="/partner" locale={locale}>
              {t('Common.partners')}
            </I18nLink>
            <I18nLink href="/kontakt" locale={locale}>
              {t('Common.contact')}
            </I18nLink>
          </nav>
          <div className="flex gap-2">
            <I18nLink href="/login" locale={locale}>
              <Button variant="ghost">{t('Common.login')}</Button>
            </I18nLink>
            <I18nLink href="/register" locale={locale}>
              <Button>{t('Common.register')}</Button>
            </I18nLink>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">{t('heroHeading')}</h1>
          <p className="text-xl text-gray-600 mb-8">{t('heroSubheading')}</p>
          <div className="flex gap-4 justify-center">
            <I18nLink href="/register" locale={locale}>
              <Button size="lg">{t('getStarted')}</Button>
            </I18nLink>
            <I18nLink href="/lösungen" locale={locale}>
              <Button size="lg" variant="outline">
                {t('learnMore')}
              </Button>
            </I18nLink>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t('featuresTitle')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">
                {t('feature1Title')}
              </h3>
              <p className="text-gray-600">{t('feature1Description')}</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">
                {t('feature2Title')}
              </h3>
              <p className="text-gray-600">{t('feature2Description')}</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">
                {t('feature3Title')}
              </h3>
              <p className="text-gray-600">{t('feature3Description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 WattWeiser. {t('Common.copyright')}</p>
        </div>
      </footer>
    </div>
  );
}

