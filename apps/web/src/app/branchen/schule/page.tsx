'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, GraduationCap, BookOpen, Users, Shield } from 'lucide-react';

export default function SchulePage() {
  const useCases = [
    {
      title: 'Lernunterstützung',
      description: 'KI-Assistenten helfen Schülern bei Fragen und erklären komplexe Themen.',
      icon: GraduationCap,
    },
    {
      title: 'Lehrplanverwaltung',
      description: 'Intelligente Verwaltung von Unterrichtsmaterialien und Dokumenten.',
      icon: BookOpen,
    },
    {
      title: 'Elternkommunikation',
      description: 'Automatisierte Kommunikation mit Eltern und schnelle Antworten.',
      icon: Users,
    },
    {
      title: 'Datenschutz',
      description: 'DSGVO-konforme Lösung speziell für Bildungseinrichtungen.',
      icon: Shield,
    },
  ];

  const features = [
    'Sichere, DSGVO-konforme Plattform',
    'Einfache Integration in bestehende Systeme',
    'Schulungsmaterialien und Support',
    'Spezielle Preise für Bildungseinrichtungen',
    'EU-Hosting garantiert',
    'Deutscher Support',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-500 to-primary-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white">
              Für Schulen & Bildungseinrichtungen
            </Badge>
            <h1 className="text-5xl font-bold mb-6">
              KI-gestützte Bildung für die Zukunft
            </h1>
            <p className="text-xl mb-8 text-primary-100">
              Moderne KI-Plattform speziell für Schulen. Unterstützt Lehrer und Schüler
              mit intelligenten Assistenten und sicheren, datenschutzkonformen Lösungen.
            </p>
            <div className="flex gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">Jetzt starten</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" asChild>
                <Link href="/kontakt">Demo vereinbaren</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Anwendungsfälle für Schulen</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            So nutzen Bildungseinrichtungen unsere Plattform
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <CardTitle>{useCase.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{useCase.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Warum WattWeiser für Schulen?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Entwickelt mit Fokus auf Bildung und Datenschutz
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Bereit für Ihre Schule?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Starten Sie noch heute mit Ihrer kostenlosen Testversion
          </p>
          <Button size="lg" asChild>
            <Link href="/register">Kostenlos testen</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}


