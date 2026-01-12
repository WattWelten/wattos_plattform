'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  Button, 
  Input, 
  EmptyState, 
  Skeleton,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter
} from '@wattweiser/ui';
import { Plus, Search, Bot, Settings, Trash2, Edit, Info as HelpCircleIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGuidedTourContext } from '@/components/onboarding/GuidedTourProvider';
import { getAgents, createAgent, deleteAgent, type Agent, type CreateAgentRequest } from '@/lib/api/agents';
import { useToast } from '@/components/ui/use-toast';

export default function AssistantsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'de';
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateAgentRequest>({
    name: '',
    role: '',
    roleType: 'it-support',
  });
  const { startTour } = useGuidedTourContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const { data: agents, isLoading } = useQuery<Agent[]>({
    queryKey: ['assistants'],
    queryFn: async () => {
      return await getAgents();
    },
  });

  const createAgentMutation = useMutation({
    mutationFn: (data: CreateAgentRequest) => createAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '', role: '', roleType: 'it-support' });
      toast({
        title: 'Erfolgreich',
        description: 'Assistant wurde erstellt.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteAgentMutation = useMutation({
    mutationFn: (id: string) => deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      toast({
        title: 'Erfolgreich',
        description: 'Assistant wurde gelöscht.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreateAgent = () => {
    if (!formData.name || !formData.role) {
      toast({
        title: 'Fehler',
        description: 'Bitte füllen Sie alle Pflichtfelder aus.',
        variant: 'destructive',
      });
      return;
    }
    createAgentMutation.mutate(formData);
  };

  const handleDeleteAgent = (id: string) => {
    if (confirm('Möchten Sie diesen Assistant wirklich löschen?')) {
      deleteAgentMutation.mutate(id);
    }
  };

  const filteredAgents = agents?.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.role.toLowerCase().includes(searchQuery.toLowerCase())
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
              <HelpCircleIcon className="h-5 w-5" />
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
        ) : filteredAgents && filteredAgents.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" data-tour="assistants-grid">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} variant="elevated" className="group hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                        <Bot className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{agent.name}</CardTitle>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary-100 text-primary-800">
                            {agent.roleType}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 line-clamp-2">
                    {agent.role}
                  </CardDescription>
                  <div className="mb-4 text-sm text-gray-600">
                    <p className="font-medium">Rolle: {agent.role}</p>
                    <p className="text-xs text-gray-500">
                      Erstellt: {new Date(agent.createdAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 gap-2"
                      onClick={() => router.push(`/test-console?agentId=${agent.id}`)}
                    >
                      Testen
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push(`/assistants/${agent.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push(`/assistants/${agent.id}/settings`)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteAgent(agent.id)}
                      disabled={deleteAgentMutation.isPending}
                    >
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

        {/* Create Modal */}
        <Modal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <ModalContent onClose={() => setIsCreateModalOpen(false)}>
            <ModalHeader>
              <ModalTitle>Neuer Assistant</ModalTitle>
              <ModalDescription>
                Erstellen Sie einen neuen KI-Assistenten
              </ModalDescription>
            </ModalHeader>
            <div className="space-y-4 py-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Kunden-Support Bot"
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Rolle/Beschreibung *
                </label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Kurze Beschreibung der Rolle"
                />
              </div>
              <div>
                <label htmlFor="roleType" className="block text-sm font-medium text-gray-700 mb-1">
                  Typ
                </label>
                <select
                  id="roleType"
                  value={formData.roleType}
                  onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="it-support">IT-Support</option>
                  <option value="sales">Sales</option>
                  <option value="marketing">Marketing</option>
                  <option value="legal">Legal</option>
                  <option value="meeting">Meeting</option>
                </select>
              </div>
            </div>
            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setFormData({ name: '', role: '', roleType: 'it-support' });
                }}
              >
                Abbrechen
              </Button>
              <Button 
                onClick={handleCreateAgent} 
                disabled={createAgentMutation.status === 'pending'}
              >
                {createAgentMutation.status === 'pending' ? 'Erstelle...' : 'Erstellen'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}
