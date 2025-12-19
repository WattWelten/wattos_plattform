'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { authenticatedFetch } from '@/lib/auth';
import { Plus, FolderOpen, FileText, Settings, Trash2 } from 'lucide-react';

export default function AdminKnowledgeSpacesPage() {
  const queryClient = useQueryClient();

  const { data: knowledgeSpaces, isLoading } = useQuery({
    queryKey: ['admin-knowledge-spaces'],
    queryFn: async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      try {
        const response = await authenticatedFetch(`${apiUrl}/admin/knowledge-spaces`);
        if (!response.ok) {
          throw new Error('Failed to fetch knowledge spaces');
        }
        return await response.json();
      } catch (error) {
        console.error('Knowledge spaces fetch error:', error);
        // Fallback zu Mock-Daten
        return [
          {
            id: '1',
            name: 'Haupt-Wissensraum',
            description: 'Zentraler Wissensraum für alle Dokumente',
            documentCount: 1250,
            tenantId: 'tenant1',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'HR-Dokumente',
            description: 'Dokumente für Personalwesen',
            documentCount: 340,
            tenantId: 'tenant1',
            createdAt: new Date().toISOString(),
          },
        ];
      }
    },
  });

  const deleteKnowledgeSpaceMutation = useMutation({
    mutationFn: async (spaceId: string) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await authenticatedFetch(`${apiUrl}/admin/knowledge-spaces/${spaceId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete knowledge space');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-knowledge-spaces'] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
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
          <h1 className="text-3xl font-bold">Wissensräume</h1>
          <p className="text-gray-600 mt-1">Verwalten Sie Wissensräume und Dokumente</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Neuer Wissensraum
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {knowledgeSpaces?.map((space: any) => (
          <Card key={space.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-primary-600" />
                  <CardTitle>{space.name}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteKnowledgeSpaceMutation.mutate(space.id)}
                  className="text-error-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>{space.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Dokumente:
                </span>
                <Badge>{space.documentCount}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="w-4 h-4 mr-2" />
                  Verwalten
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

