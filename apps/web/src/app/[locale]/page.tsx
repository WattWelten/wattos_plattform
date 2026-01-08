import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Link as I18nLink } from '@/i18n/routing';
import { 
  MessageSquare, 
  Brain, 
  Bot, 
  Wrench, 
  User, 
  Mic, 
  Globe, 
  Sparkles,
  Settings,
  Zap,
  Shield,
  ArrowRight,
  Play
} from 'lucide-react';

/**
 * Service-Konfiguration
 * Definiert alle verfügbaren Services mit ihren Eigenschaften
 */
const SERVICES = [
  {
    id: 'chat',
    name: 'Chat Service',
    description: 'Echtzeit-Chat mit WebSocket/SSE Support',
    icon: MessageSquare,
    href: '/chat',
    color: 'bg-blue-500',
    status: 'available'
  },
  {
    id: 'rag',
    name: 'RAG Service',
    description: 'Retrieval-Augmented Generation für intelligente Antworten',
    icon: Brain,
    href: '/lab',
    color: 'bg-purple-500',
    status: 'available'
  },
  {
    id: 'agent',
    name: 'Agent Service',
    description: 'Intelligente Agenten mit LangGraph',
    icon: Bot,
    href: '/admin',
    color: 'bg-green-500',
    status: 'available'
  },
  {
    id: 'avatar',
    name: 'Avatar Service',
    description: '3D-Avatare mit Viseme-Synchronisation',
    icon: User,
    href: '/lab/avatar',
    color: 'bg-pink-500',
    status: 'available'
  },
  {
    id: 'voice',
    name: 'Voice Service',
    description: 'Sprachsynthese und -erkennung',
    icon: Mic,
    href: '/lab',
    color: 'bg-orange-500',
    status: 'available'
  },
  {
    id: 'crawler',
    name: 'Crawler Service',
    description: 'Web-Crawling und Content-Extraktion',
    icon: Globe,
    href: '/admin',
    color: 'bg-indigo-500',
    status: 'available'
  },
  {
    id: 'admin',
    name: 'Admin Service',
    description: 'Verwaltung und Konfiguration',
    icon: Settings,
    href: '/admin',
    color: 'bg-gray-500',
    status: 'available'
  },
  {
    id: 'tool',
    name: 'Tool Service',
    description: 'Externe Tools und Integrationen',
    icon: Wrench,
    href: '/admin',
    color: 'bg-yellow-500',
    status: 'available'
  }
] as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Separate Translation-Instanzen für verschiedene Namespaces
  const tIndex = await getTranslations('Index');
  const tCommon = await getTranslations('common');

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <I18nLink 
              href="/" 
              locale={locale}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                WattWeiser
              </span>
            </I18nLink>
            <nav className="hidden md:flex gap-6 items-center">
              <I18nLink 
                href="/lösungen" 
                locale={locale}
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                {tCommon('solutions')}
              </I18nLink>
              <I18nLink 
                href="/branchen" 
                locale={locale}
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                {tCommon('industries')}
              </I18nLink>
              <I18nLink 
                href="/ressourcen" 
                locale={locale}
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                {tCommon('resources')}
              </I18nLink>
              <I18nLink 
                href="/kontakt" 
                locale={locale}
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                {tCommon('contact')}
              </I18nLink>
            </nav>
            <div className="flex gap-3 items-center">
              <I18nLink href="/login" locale={locale}>
                <Button variant="ghost" className="text-sm">
                  {tCommon('login')}
                </Button>
              </I18nLink>
              <I18nLink href="/register" locale={locale}>
                <Button className="text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  {tCommon('register')}
                </Button>
              </I18nLink>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-sm font-medium text-blue-700 mb-8">
            <Sparkles className="w-4 h-4" />
            <span>KI-Plattform der nächsten Generation</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent leading-tight">
            {tIndex('heroHeading')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            {tIndex('heroSubheading')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <I18nLink href="/register" locale={locale}>
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
              >
                {tIndex('getStarted')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </I18nLink>
            <I18nLink href="/chat" locale={locale}>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 border-2 hover:bg-gray-50"
              >
                <Play className="mr-2 w-5 h-5" />
                Live Demo testen
              </Button>
            </I18nLink>
          </div>
        </div>
      </section>

      {/* Services Overview - Main Feature */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Alle Services im Überblick
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Testen Sie alle verfügbaren Services direkt von hier aus. Jeder Service ist sofort einsatzbereit.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <I18nLink
                  key={service.id}
                  href={service.href}
                  locale={locale}
                  className="group relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <div className={`w-12 h-12 ${service.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {service.description}
                  </p>
                  <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                    <span>Service testen</span>
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  {service.status === 'available' && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Verfügbar
                      </span>
                    </div>
                  )}
                </I18nLink>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Schnellstart</h2>
            <p className="text-blue-100 mb-8 text-lg">
              Beginnen Sie sofort mit der Nutzung unserer Plattform
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <I18nLink 
                href="/chat" 
                locale={locale} 
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-6 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              >
                <MessageSquare className="w-8 h-8 mb-3" />
                <h3 className="font-semibold mb-2">Chat starten</h3>
                <p className="text-sm text-blue-100">Direkt mit KI chatten</p>
              </I18nLink>
              <I18nLink 
                href="/lab" 
                locale={locale} 
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-6 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              >
                <Sparkles className="w-8 h-8 mb-3" />
                <h3 className="font-semibold mb-2">Lab erkunden</h3>
                <p className="text-sm text-blue-100">Experimentieren & testen</p>
              </I18nLink>
              <I18nLink 
                href="/admin" 
                locale={locale} 
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-6 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              >
                <Settings className="w-8 h-8 mb-3" />
                <h3 className="font-semibold mb-2">Admin-Konsole</h3>
                <p className="text-sm text-blue-100">Verwaltung & Einstellungen</p>
              </I18nLink>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              {tIndex('featuresTitle')}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  {tIndex('feature1Title')}
                </h3>
                <p className="text-gray-600 leading-relaxed">{tIndex('feature1Description')}</p>
              </div>
              <div className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  {tIndex('feature2Title')}
                </h3>
                <p className="text-gray-600 leading-relaxed">{tIndex('feature2Description')}</p>
              </div>
              <div className="p-8 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border border-green-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  {tIndex('feature3Title')}
                </h3>
                <p className="text-gray-600 leading-relaxed">{tIndex('feature3Description')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">WattWeiser</span>
            </div>
            <p className="text-gray-600 mb-6">
              &copy; 2025 WattWeiser. {tCommon('copyright')}
            </p>
            <div className="flex justify-center gap-6 text-sm text-gray-500">
              <I18nLink href="/lösungen" locale={locale} className="hover:text-blue-600 transition-colors">
                {tCommon('solutions')}
              </I18nLink>
              <I18nLink href="/branchen" locale={locale} className="hover:text-blue-600 transition-colors">
                {tCommon('industries')}
              </I18nLink>
              <I18nLink href="/ressourcen" locale={locale} className="hover:text-blue-600 transition-colors">
                {tCommon('resources')}
              </I18nLink>
              <I18nLink href="/kontakt" locale={locale} className="hover:text-blue-600 transition-colors">
                {tCommon('contact')}
              </I18nLink>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
