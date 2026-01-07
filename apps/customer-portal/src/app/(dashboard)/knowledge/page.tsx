'use client';

import { useEffect, useState } from 'react';
import { AppleCard, AppleButton } from '@wattweiser/ui';
import {
  getSources,
  getCrawls,
  getArtifacts,
  triggerCrawl,
  deleteArtifact,
  type Source,
  type Crawl,
  type Artifact,
} from '@/lib/api';
import { useAuthContext } from '@/contexts/auth-context';
import { ArtifactCard } from '@/components/dashboard/artifact-card';
import { Search, RefreshCw, FileText } from 'lucide-react';

export default function KnowledgePage() {
  const { tenantId } = useAuthContext();
  const [sources, setSources] = useState<Source[]>([]);
  const [crawls, setCrawls] = useState<Crawl[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingArtifactId, setDeletingArtifactId] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    
    setIsLoading(true);
    setError(null);
    Promise.all([
      getSources(tenantId).then(setSources),
      getCrawls(tenantId).then(setCrawls),
      getArtifacts(tenantId).then(setArtifacts),
    ]).catch((err) => {
      console.error('Failed to load knowledge data:', err);
      setError(err.message || 'Fehler beim Laden der Daten');
    }).finally(() => setIsLoading(false));
  }, [tenantId]);

  const handleTriggerCrawl = async () => {
    if (!tenantId) return;
    setIsTriggering(true);
    try {
      await triggerCrawl(tenantId, '');
      // Reload crawls
      const updatedCrawls = await getCrawls(tenantId);
      setCrawls(updatedCrawls);
    } catch (err: any) {
      console.error('Failed to trigger crawl:', err);
      setError(err.message || 'Fehler beim Starten des Crawls');
    } finally {
      setIsTriggering(false);
    }
  };

  const handleDeleteArtifact = async (artifactId: string) => {
    if (!confirm('Artefakt wirklich löschen?')) return;
    setDeletingArtifactId(artifactId);
    try {
      await deleteArtifact(artifactId);
      setArtifacts(artifacts.filter((a) => a.id !== artifactId));
    } catch (err: any) {
      console.error('Failed to delete artifact:', err);
      setError(err.message || 'Fehler beim Löschen des Artefakts');
    } finally {
      setDeletingArtifactId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-300">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Knowledge</h1>
        <p className="text-lg text-gray-600">
          Verwalten Sie Ihre Quellen, Crawls und Artefakte
        </p>
      </div>

      {error && (
        <div
          className="p-4 bg-error-50 border border-error-200 rounded-xl text-error-700 animate-in fade-in slide-in-from-left-4 duration-300"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sources Card */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '100ms' }}>
          <AppleCard variant="elevated" padding="lg" className="h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-50 rounded-lg">
                <Search className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold">Quellen</h2>
            </div>
          {isLoading ? (
            <div className="text-gray-400 text-center py-8" aria-label="Lädt Quellen...">
              Lädt Quellen...
            </div>
          ) : sources.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              Keine Quellen konfiguriert
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map((source, idx) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-left-4"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {source.url}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{source.type}</p>
                  </div>
                  <span
                    className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                      source.enabled
                        ? 'bg-success-100 text-success-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {source.enabled ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
              ))}
            </div>
          )}
          </AppleCard>
        </div>

        {/* Crawls Card */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '200ms' }}>
          <AppleCard variant="elevated" padding="lg" className="h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-50 rounded-lg">
                <RefreshCw className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold">Crawls</h2>
            </div>
          <div className="space-y-4">
            {crawls.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                Keine Crawls vorhanden
              </div>
            ) : (
              <div className="space-y-3">
                {crawls.slice(0, 5).map((crawl, idx) => (
                  <div
                    key={crawl.id}
                    className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-left-4"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(crawl.startedAt).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span
                        className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                          crawl.status === 'completed'
                            ? 'bg-success-100 text-success-700'
                            : crawl.status === 'running'
                              ? 'bg-warning-100 text-warning-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {crawl.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {crawl.pages} Seiten, {crawl.delta} neu/geändert
                    </div>
                  </div>
                ))}
              </div>
            )}
            <AppleButton
              variant="outline"
              className="w-full mt-4"
              onClick={handleTriggerCrawl}
              disabled={isTriggering}
              aria-label="Crawler jetzt starten"
              aria-busy={isTriggering}
            >
              {isTriggering ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Läuft...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Jetzt neu indexieren
                </>
              )}
            </AppleButton>
          </div>
          </AppleCard>
        </div>
      </div>

      {/* Artifacts Card */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '300ms' }}>
        <AppleCard variant="elevated" padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-50 rounded-lg">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold">Artefakte</h2>
            {artifacts.length > 0 && (
              <span className="ml-auto text-sm text-gray-500">
                {artifacts.length} {artifacts.length === 1 ? 'Artefakt' : 'Artefakte'}
              </span>
            )}
          </div>
          {artifacts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">Keine Artefakte vorhanden</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {artifacts.map((artifact) => (
                <ArtifactCard
                  key={artifact.id}
                  artifact={artifact}
                  onDelete={handleDeleteArtifact}
                  isDeleting={deletingArtifactId === artifact.id}
                />
              ))}
            </div>
          )}
        </AppleCard>
      </div>
    </div>
  );
}

