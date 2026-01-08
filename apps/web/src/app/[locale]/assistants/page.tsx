'use client';

import { useState } from 'react';
import { AppShell, Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, EmptyState, Skeleton } from '@wattweiser/ui';
import { Plus, Search, Bot, Settings, Trash2, Edit, Play, HelpCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useGuidedTourContext } from '@/components/onboarding/GuidedTourProvider';

interface Assistant {
  id: string;
  name: string;
  description: string;
  model: string;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export default function AssistantsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { startTour } = useGuidedTourContext();

  const assistantsTourSteps = [
    {
      id: 'assistants-header',
      target: '[data-tour="assistants-header"]',
      title: 'Assistants Übersicht',
      description: 'Hier sehen Sie alle Ihre erstellten Assistants. Klicken Sie auf "Neuer Assistant" um einen neuen zu erstellen.',
      position: 'bottom' as const,
    },
    {
      id: 'assistants-search',
      target: '[data-tour="assistants-search"]',
      title: 'Assistants durchsuchen',
      description: 'Verwenden Sie die Suche, um schnell bestimmte Assistants zu finden.',
      position: 'bottom' as const,
    },
    {
      id: 'assistants-grid',
      target: '[data-tour="assistants-grid"]',
      title: 'Assistant-Karten',
      description: 'Jede Karte zeigt einen Assistant mit Status, Beschreibung und Aktionen.',
      position: 'top' as const,
    },
  ];

  const { data: assistants, isLoading } = useQuery<Assistant[]>({
    queryKey: ['assistants'],
    queryFn: async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/agents`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch assistants');
      }
      return response.json();
    },
  });

  const filteredAssistants = assistants?.filter(
    (assistant) =>
      assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assistant.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between" data-tour="assistants-header">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Assistants</h1>
            <p className="mt-2 text-lg text-gray-600">
              Verwalten Sie Ihre KI-Assistenten und Agenten
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => startTour(assistantsTourSteps)}
              className="gap-2"
            >
              <HelpCircle className="h-5 w-5" />
              Tour starten
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              size="lg"
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              Neuer Assistant
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6" data-tour="assistants-search">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Assistants durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Assistants Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} variant="elevated">
                <CardContent className="p-6">
                  <Skeleton className="mb-4 h-6 w-3/4" />
                  <Skeleton className="mb-2 h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAssistants && filteredAssistants.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" data-tour="assistants-grid">
            {filteredAssistants.map((assistant) => (
              <Card key={assistant.id} variant="elevated" className="group hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                        <Bot className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{assistant.name}</CardTitle>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              assistant.status === 'active'
                                ? 'bg-success-100 text-success-800'
                                : assistant.status === 'inactive'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-warning-100 text-warning-800'
                            }`}
                          >
                            {assistant.status === 'active' ? 'Aktiv' : assistant.status === 'inactive' ? 'Inaktiv' : 'Entwurf'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 line-clamp-2">
                    {assistant.description}
                  </CardDescription>
                  <div className="mb-4 text-sm text-gray-600">
                    <p className="font-medium">Model: {assistant.model}</p>
                    <p className="text-xs text-gray-500">
                      Erstellt: {new Date(assistant.createdAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="flex-1 gap-2">
                      <Play className="h-4 w-4" />
                      Testen
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-error-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Bot className="h-8 w-8 text-gray-400" />}
            title="Keine Assistants gefunden"
            description={
              searchQuery
                ? 'Versuchen Sie es mit einer anderen Suche.'
                : 'Erstellen Sie Ihren ersten Assistant, um zu beginnen.'
            }
            action={
              !searchQuery && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Neuer Assistant
                </Button>
              )
            }
          />
        )}
      </div>
    </div>
  );
}
