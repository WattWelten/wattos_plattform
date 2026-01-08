'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { authenticatedFetch } from '@/lib/auth';
import { Plus, Settings, CheckCircle, XCircle } from 'lucide-react';

export default function AdminProvidersPage() {
  const queryClient = useQueryClient();
  // selectedProvider wird für zukünftige Edit-Funktionalität verwendet
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  // Verhindere "unused variable" Warnung - wird für zukünftige Edit-Funktionalität benötigt
  if (process.env.NODE_ENV === 'development' && selectedProvider) {
    // Debug: selectedProvider wird verwendet
  }

  const { data: providers, isLoading } = useQuery({
    queryKey: ['admin-providers'],
    queryFn: async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      try {
        const response = await authenticatedFetch(`${apiUrl}/admin/providers`);
        if (!response.ok) {
          throw new Error('Failed to fetch providers');
        }
        return await response.json();
      } catch (error) {
        console.error('Providers fetch error:', error);
        throw error; // Lassen React Query das Error-Handling übernehmen
      }
    },
  });

  const toggleProviderMutation = useMutation({
    mutationFn: async ({ providerId, enabled }: { providerId: string; enabled: boolean }) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await authenticatedFetch(`${apiUrl}/admin/providers/${providerId}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) {
        throw new Error('Failed to update provider');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">LLM-Provider</h1>
          <p className="text-gray-600 mt-1">Verwalten Sie LLM-Provider und API-Keys</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Neuer Provider
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers?.map((provider: any) => (
          <Card key={provider.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{provider.name}</CardTitle>
                <Badge variant={provider.status === 'active' ? 'default' : 'secondary'}>
                  {provider.status === 'active' ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <XCircle className="w-3 h-3 mr-1" />
                  )}
                  {provider.status}
                </Badge>
              </div>
              <CardDescription>{provider.type}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API-Key konfiguriert:</span>
                {provider.hasApiKey ? (
                  <CheckCircle className="w-4 h-4 text-success-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-error-500" />
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedProvider(provider.id)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Konfigurieren
                </Button>
                <Button
                  variant={provider.status === 'active' ? 'destructive' : 'default'}
                  size="sm"
                  onClick={() =>
                    toggleProviderMutation.mutate({
                      providerId: provider.id,
                      enabled: provider.status !== 'active',
                    })
                  }
                >
                  {provider.status === 'active' ? 'Deaktivieren' : 'Aktivieren'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

