'use client';

import { AppleCard } from '@wattweiser/ui';

'use client';

import { useQuery } from '@tanstack/react-query';
import { AppleCard } from '@wattweiser/ui';

export default function SearchPage() {
  const { data: searchMetrics, isLoading } = useQuery({
    queryKey: ['search-metrics'],
    queryFn: async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/rag/metrics`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch search metrics');
      }
      return await response.json();
    },
  });

  const mrrAtK = searchMetrics?.mrrAtK ?? 0;
  const recall = searchMetrics?.recall ?? 0;
  const topSources = searchMetrics?.topSources ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Search & RAG</h1>
        <p className="text-gray-600 mt-2">RAG-KPIs und Top-Hits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AppleCard>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">MRR@k</p>
            <p className="text-3xl font-bold text-gray-900">{mrrAtK.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Mean Reciprocal Rank</p>
          </div>
        </AppleCard>

        <AppleCard>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Recall</p>
            <p className="text-3xl font-bold text-gray-900">
              {(recall * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500">Retrieval Accuracy</p>
          </div>
        </AppleCard>

        <AppleCard>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Top-Quellen</p>
            <p className="text-3xl font-bold text-gray-900">{topSources}</p>
            <p className="text-xs text-gray-500">Aktive Quellen</p>
          </div>
        </AppleCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppleCard padding="lg">
          <h2 className="text-xl font-semibold mb-4">Top-Hits</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <p className="text-sm font-medium text-gray-900">
                  Dokument {i}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Relevanz: {(0.9 - i * 0.1).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </AppleCard>

        <AppleCard padding="lg">
          <h2 className="text-xl font-semibold mb-4">Veraltete Artikel</h2>
          <div className="text-gray-400 text-center py-8">
            Liste veralteter Artikel wird hier angezeigt
          </div>
        </AppleCard>
      </div>

      <AppleCard padding="lg">
        <h2 className="text-xl font-semibold mb-4">Top-Queries</h2>
        <div className="space-y-2">
          {['Wie beantrage ich...', 'Wo finde ich...', 'Was benötige ich für...'].map(
            (query, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <span className="text-sm text-gray-700">{query}</span>
                <span className="text-xs text-gray-500">{10 - i * 2}x</span>
              </div>
            ),
          )}
        </div>
      </AppleCard>
    </div>
  );
}

