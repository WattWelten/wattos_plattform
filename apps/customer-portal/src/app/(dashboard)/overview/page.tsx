'use client';

import { useEffect, useState } from 'react';
import { AppleCard } from '@wattweiser/ui';
import { getOverviewMetrics } from '@/lib/api';
import { LineChart } from '@/components/charts/line-chart';
import { useAuthContext } from '@/contexts/auth-context';

export default function OverviewPage() {
  const { tenantId } = useAuthContext();
  const [metrics, setMetrics] = useState({
    sessionsPerDay: 0,
    fcr: 0,
    p95Latency: 0,
    contentFreshness: 0,
  });
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    
    setIsLoading(true);
    setError(null);
    getOverviewMetrics(tenantId)
      .then(setMetrics)
      .catch((err) => {
        console.error('Failed to load metrics:', err);
        setError(err.message || 'Fehler beim Laden der Metriken');
      })
      .finally(() => setIsLoading(false));
  }, [tenantId]);

  // Mock data for charts
  const chartData = [
    { date: 'Mo', sessions: 12, latency: 450 },
    { date: 'Di', sessions: 15, latency: 420 },
    { date: 'Mi', sessions: 18, latency: 480 },
    { date: 'Do', sessions: 14, latency: 410 },
    { date: 'Fr', sessions: 20, latency: 390 },
    { date: 'Sa', sessions: 8, latency: 500 },
    { date: 'So', sessions: 10, latency: 460 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
          <p className="text-gray-600 mt-2">KPIs und Metriken auf einen Blick</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="7d">Letzte 7 Tage</option>
          <option value="30d">Letzte 30 Tage</option>
          <option value="90d">Letzte 90 Tage</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-error-50 border border-error-200 rounded-lg text-error-700" role="alert">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AppleCard>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Sessions/Tag</p>
            {isLoading ? (
              <div className="h-10 bg-gray-200 animate-pulse rounded" aria-label="Lädt..." />
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics.sessionsPerDay}
                </p>
                <p className="text-xs text-gray-500">+0% vs. gestern</p>
              </>
            )}
          </div>
        </AppleCard>

        <AppleCard>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">FCR</p>
            <p className="text-3xl font-bold text-gray-900">
              {metrics.fcr.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">First Contact Resolution</p>
          </div>
        </AppleCard>

        <AppleCard>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">p95 Latenz</p>
            <p className="text-3xl font-bold text-gray-900">
              {metrics.p95Latency}ms
            </p>
            <p className="text-xs text-gray-500">95. Perzentil</p>
          </div>
        </AppleCard>

        <AppleCard>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Content-Frische</p>
            <p className="text-3xl font-bold text-gray-900">
              {metrics.contentFreshness} Tage
            </p>
            <p className="text-xs text-gray-500">Median-Alter</p>
          </div>
        </AppleCard>
      </div>

      {/* Charts */}
      <AppleCard padding="lg">
        <h2 className="text-xl font-semibold mb-4">Zeitserien</h2>
        <LineChart
          data={chartData}
          dataKey="date"
          lines={[
            { key: 'sessions', name: 'Sessions', color: '#0073E6' },
            { key: 'latency', name: 'Latenz (ms)', color: '#10B981' },
          ]}
        />
      </AppleCard>
    </div>
  );
}

