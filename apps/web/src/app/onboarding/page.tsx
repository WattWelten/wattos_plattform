'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Database, Bot } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createCharacter } from '@/lib/api/characters';
import { createKnowledgeSpace } from '@/lib/api/knowledge-spaces';
import { getAuthToken } from '@/lib/auth';

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

interface OnboardingData {
  tenantName: string;
  tenantType: 'kmu' | 'schule' | 'verwaltung';
  knowledgeSpaceName: string;
  agentType: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [data, setData] = useState<OnboardingData>({
    tenantName: '',
    tenantType: 'kmu',
    knowledgeSpaceName: '',
    agentType: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (step < 5) {
      setStep((s) => (s + 1) as OnboardingStep);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as OnboardingStep);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Nicht angemeldet. Bitte melden Sie sich erneut an.');
      }

      // 1. Knowledge Space erstellen
      let knowledgeSpaceId: string | undefined;
      if (data.knowledgeSpaceName) {
        const knowledgeSpace = await createKnowledgeSpace(
          {
            name: data.knowledgeSpaceName,
            description: `Wissensraum für ${data.tenantName}`,
          },
          token,
        );
        knowledgeSpaceId = knowledgeSpace.id;
      }

      // 2. Character erstellen (basierend auf Agent-Typ)
      const characterRole = data.agentType || 'assistant';
      const systemPrompts: Record<string, string> = {
        'it-support': 'Du bist ein hilfreicher IT-Support Assistent. Du hilfst Benutzern bei IT-Problemen und Fragen.',
        'sales': 'Du bist ein freundlicher Sales-Assistent. Du unterstützt Kunden bei Produktfragen und Verkaufsprozessen.',
        'marketing': 'Du bist ein kreativer Marketing-Assistent. Du hilfst bei Marketing-Aufgaben, Content-Erstellung und Kampagnen.',
      };

      const character = await createCharacter(
        {
          role: characterRole,
          agent: 'chatbot',
          system_prompt: systemPrompts[data.agentType] || 'Du bist ein hilfreicher Assistent.',
          knowledge_base: knowledgeSpaceId
            ? {
                knowledgeSpaceId,
              }
            : {},
        },
        token,
      );

      toast({
        title: 'Onboarding abgeschlossen!',
        description: `Character "${character.role}" wurde erfolgreich erstellt.`,
      });

      // Weiterleitung zum Chat mit dem neuen Character
      // Verwende window.location für direkte Navigation (außerhalb von [locale])
      window.location.href = `/de/chat?character=${character.role}`;
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Willkommen', icon: Sparkles },
    { number: 2, title: 'Organisation', icon: Database },
    { number: 3, title: 'Wissensraum', icon: Database },
    { number: 4, title: 'Agent', icon: Bot },
    { number: 5, title: 'Fertig', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, index) => {
              const Icon = s.icon;
              const isActive = step === s.number;
              const isCompleted = step > s.number;

              return (
                <div key={s.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        isCompleted
                          ? 'bg-success-500 border-success-500 text-white'
                          : isActive
                            ? 'bg-primary-500 border-primary-500 text-white'
                            : 'bg-white border-gray-300 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium ${
                        isActive ? 'text-primary-600' : 'text-gray-500'
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 ${
                        isCompleted ? 'bg-success-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              Schritt {step} von {steps.length}: {steps[step - 1]?.title || 'Unbekannt'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Willkommen bei WattWeiser! Lassen Sie uns gemeinsam starten.'}
              {step === 2 && 'Erzählen Sie uns etwas über Ihre Organisation.'}
              {step === 3 && 'Erstellen Sie Ihren ersten Wissensraum für Dokumente.'}
              {step === 4 && 'Wählen Sie einen vorkonfigurierten Agenten aus.'}
              {step === 5 && 'Alles fertig! Sie können jetzt starten.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Welcome */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Sparkles className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Willkommen bei WattWeiser</h3>
                  <p className="text-gray-600">
                    Ihre modulare, DSGVO-konforme KI-Plattform
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Multi-LLM</h4>
                    <p className="text-sm text-gray-600">
                      Nutzen Sie verschiedene KI-Modelle über eine einheitliche API
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">RAG</h4>
                    <p className="text-sm text-gray-600">
                      Integrieren Sie Ihr Unternehmenswissen in KI-Gespräche
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Digitale Mitarbeiter</h4>
                    <p className="text-sm text-gray-600">
                      Vorkonfigurierte Agenten für verschiedene Aufgaben
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Tenant Setup */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tenantName">Name Ihrer Organisation</Label>
                  <Input
                    id="tenantName"
                    placeholder="z.B. Musterfirma GmbH"
                    value={data.tenantName}
                    onChange={(e) => updateData({ tenantName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenantType">Organisationstyp</Label>
                  <Select
                    id="tenantType"
                    value={data.tenantType}
                    onChange={(e) => updateData({ tenantType: e.target.value as any })}
                  >
                    <option value="kmu">KMU / Mittelstand</option>
                    <option value="schule">Schule / Bildungseinrichtung</option>
                    <option value="verwaltung">Verwaltung / Behörde</option>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 3: Knowledge Space */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="knowledgeSpaceName">Name des Wissensraums</Label>
                  <Input
                    id="knowledgeSpaceName"
                    placeholder="z.B. IT-Dokumentation"
                    value={data.knowledgeSpaceName}
                    onChange={(e) => updateData({ knowledgeSpaceName: e.target.value })}
                  />
                  <p className="text-sm text-gray-500">
                    Sie können später weitere Wissensräume hinzufügen
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Agent */}
            {step === 4 && (
              <div className="space-y-4">
                <Label>Wählen Sie einen Agenten</Label>
                <div className="grid gap-4">
                  {[
                    { id: 'it-support', name: 'IT-Support Assist', desc: 'Hilft bei IT-Fragen und Problemen' },
                    { id: 'sales', name: 'Sales-Assistenz', desc: 'Unterstützt im Vertrieb' },
                    { id: 'marketing', name: 'Marketing-Assistenz', desc: 'Hilft bei Marketing-Aufgaben' },
                  ].map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => updateData({ agentType: agent.id })}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        data.agentType === agent.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h4 className="font-semibold mb-1">{agent.name}</h4>
                      <p className="text-sm text-gray-600">{agent.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Complete */}
            {step === 5 && (
              <div className="space-y-4 text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-success-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Alles fertig!</h3>
                <p className="text-gray-600 mb-6">
                  Ihre Plattform ist eingerichtet und bereit zur Nutzung.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="success">Organisation: {data.tenantName}</Badge>
                  <Badge variant="success">Wissensraum erstellt</Badge>
                  <Badge variant="success">Agent konfiguriert</Badge>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={step === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück
              </Button>
              {step < 5 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={
                    (step === 2 && !data.tenantName) ||
                    (step === 3 && !data.knowledgeSpaceName) ||
                    (step === 4 && !data.agentType)
                  }
                >
                  Weiter
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={isLoading}>
                  {isLoading ? 'Wird gespeichert...' : 'Fertigstellen'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


