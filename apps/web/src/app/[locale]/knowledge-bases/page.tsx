'use client';

import { useState } from 'react';
import { AppShell, Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, EmptyState, Skeleton, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@wattweiser/ui';
import { Plus, Search, Database, FileText, Globe2, Upload, Trash2, Edit, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  sourceType: 'file' | 'website' | 'mixed';
  createdAt: string;
  updatedAt: string;
}

export default function KnowledgeBasesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: knowledgeBases, isLoading } = useQuery<KnowledgeBase[]>({
    queryKey: ['knowledge-bases'],
    queryFn: async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/knowledge-spaces`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch knowledge bases');
      }
      return response.json();
    },
  });

  const filteredKnowledgeBases = knowledgeBases?.filter(
    (kb) =>
      kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kb.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Knowledge Bases</h1>
            <p className="mt-2 text-lg text-gray-600">
              Verwalten Sie Ihre Wissensdatenbanken und Dokumente
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="gap-2">
              <Upload className="h-5 w-5" />
              Datei hochladen
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <Globe2 className="h-5 w-5" />
              Website crawlen
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Neue Knowledge Base
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Knowledge Bases durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Knowledge Bases List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} variant="elevated">
                <CardContent className="p-6">
                  <Skeleton className="mb-4 h-6 w-1/4" />
                  <Skeleton className="mb-2 h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredKnowledgeBases && filteredKnowledgeBases.length > 0 ? (
          <Card variant="elevated">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead>Dokumente</TableHead>
                  <TableHead>Quelltyp</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKnowledgeBases.map((kb) => (
                  <TableRow key={kb.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                          <Database className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{kb.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600 line-clamp-1">{kb.description || 'Keine Beschreibung'}</p>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                        <FileText className="h-4 w-4" />
                        {kb.documentCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                        {kb.sourceType === 'file' ? 'Dateien' : kb.sourceType === 'website' ? 'Website' : 'Gemischt'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600">
                        {new Date(kb.createdAt).toLocaleDateString('de-DE')}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <EmptyState
            icon={<Database className="h-8 w-8 text-gray-400" />}
            title="Keine Knowledge Bases gefunden"
            description={
              searchQuery
                ? 'Versuchen Sie es mit einer anderen Suche.'
                : 'Erstellen Sie Ihre erste Knowledge Base, um zu beginnen.'
            }
            action={
              !searchQuery && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Neue Knowledge Base
                </Button>
              )
            }
          />
        )}
      </div>
    </div>
  );
}
