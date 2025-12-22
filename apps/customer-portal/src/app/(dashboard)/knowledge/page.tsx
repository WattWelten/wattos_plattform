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

export default function KnowledgePage() {
  const { tenantId } = useAuthContext();
  const [sources, setSources] = useState<Source[]>([]);
  const [crawls, setCrawls] = useState<Crawl[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      await triggerCrawl(tenantId);
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
    try {
      await deleteArtifact(artifactId);
      setArtifacts(artifacts.filter((a) => a.id !== artifactId));
    } catch (err: any) {
      console.error('Failed to delete artifact:', err);
      setError(err.message || 'Fehler beim Löschen des Artefakts');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Knowledge</h1>
        <p className="text-gray-600 mt-2">Quellen, Crawls und Artefakte</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-error-50 border border-error-200 rounded-lg text-error-700" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppleCard padding="lg">
          <h2 className="text-xl font-semibold mb-4">Quellen</h2>
          {isLoading ? (
            <div className="text-gray-400 text-center py-8" aria-label="Lädt Quellen...">
              Lädt Quellen...
            </div>
          ) : sources.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              Keine Quellen konfiguriert
            </div>
          ) : (
            <div className="space-y-2">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">{source.url}</p>
                    <p className="text-xs text-gray-500">{source.type}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
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

        <AppleCard padding="lg">
          <h2 className="text-xl font-semibold mb-4">Crawls</h2>
          <div className="space-y-4">
            {crawls.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                Keine Crawls vorhanden
              </div>
            ) : (
              <div className="space-y-2">
                {crawls.slice(0, 5).map((crawl) => (
                  <div
                    key={crawl.id}
                    className="p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {new Date(crawl.startedAt).toLocaleString('de-DE')}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
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
              className="w-full"
              onClick={handleTriggerCrawl}
              disabled={isTriggering}
              aria-label="Crawler jetzt starten"
              aria-busy={isTriggering}
            >
              {isTriggering ? 'Läuft...' : 'Jetzt neu indexieren'}
            </AppleButton>
          </div>
        </AppleCard>
      </div>

      <AppleCard padding="lg">
        <h2 className="text-xl font-semibold mb-4">Artefakte</h2>
        {artifacts.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            Keine Artefakte vorhanden
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    URL
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Erstellt
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody>
                {artifacts.map((artifact) => (
                  <tr
                    key={artifact.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-sm">{artifact.name}</td>
                    <td className="py-3 px-4 text-sm">
                      <a
                        href={artifact.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-500 hover:underline"
                      >
                        {artifact.url.substring(0, 50)}...
                      </a>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(artifact.createdAt).toLocaleDateString('de-DE')}
                    </td>
                    <td className="py-3 px-4">
                      <AppleButton
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteArtifact(artifact.id)}
                        aria-label={`Artefakt ${artifact.name} löschen`}
                      >
                        Löschen
                      </AppleButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AppleCard>
    </div>
  );
}

