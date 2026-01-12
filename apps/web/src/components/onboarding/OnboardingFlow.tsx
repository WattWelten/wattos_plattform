'use client';

import { useState, useEffect } from 'react';
import { OnboardingWizard, OnboardingStep } from '@wattweiser/ui';
import { Bot, Database, Settings, CheckCircle } from 'lucide-react';
import { useRouter } from '@/i18n/routing';

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Willkommen bei WattOS',
    description: 'Lassen Sie uns Ihnen helfen, loszulegen',
    content: (
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
            <CheckCircle className="h-10 w-10 text-primary-600" />
          </div>
        </div>
        <p className="text-center text-gray-600">
          In den nächsten Schritten zeigen wir Ihnen, wie Sie Ihre ersten Assistants erstellen,
          Knowledge Bases einrichten und die Plattform optimal nutzen können.
        </p>
      </div>
    ),
  },
  {
    id: 'assistants',
    title: 'Assistants erstellen',
    description: 'Erstellen Sie Ihren ersten KI-Assistenten',
    content: (
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
            <Bot className="h-10 w-10 text-primary-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">Was sind Assistants?</h3>
          <p className="text-sm text-gray-600">
            Assistants sind KI-gestützte Agenten, die Sie für verschiedene Aufgaben konfigurieren können.
            Sie können mit Knowledge Bases verbunden werden, um kontextbezogene Antworten zu geben.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
            <li>Erstellen Sie benutzerdefinierte System-Prompts</li>
            <li>Verbinden Sie mit Knowledge Bases</li>
            <li>Testen Sie in der Test Console</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'knowledge-bases',
    title: 'Knowledge Bases einrichten',
    description: 'Fügen Sie Wissen zu Ihren Assistants hinzu',
    content: (
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
            <Database className="h-10 w-10 text-primary-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">Knowledge Bases</h3>
          <p className="text-sm text-gray-600">
            Knowledge Bases speichern Ihre Dokumente und ermöglichen es Assistants, auf dieses Wissen
            zuzugreifen und präzise Antworten zu geben.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
            <li>Laden Sie Dateien hoch (PDF, DOCX, TXT, MD)</li>
            <li>Crawlen Sie Websites</li>
            <li>Automatische Chunking und Embeddings</li>
          </ul>
        </div>
      </div>
    ),
  },
];

export function OnboardingFlow() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
    router.push('/assistants'); // next-intl fügt Locale automatisch hinzu
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  if (!showOnboarding) {
    return null;
  }

  return (
    <OnboardingWizard
      steps={ONBOARDING_STEPS}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}
