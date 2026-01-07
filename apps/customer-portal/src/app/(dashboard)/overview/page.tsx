/**
 * Overview Dashboard
 * 
 * Apple Design: Elegant KPI overview with journey-based UX
 */

'use client';

import { useEffect, useState } from 'react';
import { AppleCard } from '@wattweiser/ui';
import { KPICard } from '@/components/dashboard/kpi-card';
import { JourneyStep } from '@/components/dashboard/journey-step';
import {
  getOverviewMetrics,
  type OverviewMetrics,
} from '@/lib/api';
import { useAuthContext } from '@/contexts/auth-context';
import {
  TrendingUp,
  MessageSquare,
  Zap,
  RefreshCw,
  Search,
  Settings,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OverviewPage() {
  const { tenantId } = useAuthContext();
  const router = useRouter();
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
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

  // Journey Steps
  const journeySteps = [
    {
      step: 1,
      title: 'Konfiguration',
      description: 'Tenant-Einstellungen und No-Code Config',
      icon: Settings,
      status: 'completed' as const,
      route: '/settings',
    },
    {
      step: 2,
      title: 'Knowledge Base',
      description: 'Quellen crawlen und indexieren',
      icon: Search,
      status: 'active' as const,
      route: '/knowledge',
    },
    {
      step: 3,
      title: 'Avatar & Voice',
      description: 'Avatar konfigurieren und Visemes testen',
      icon: MessageSquare,
      status: 'upcoming' as const,
      route: '/avatar-voice',
    },
    {
      step: 4,
      title: 'Conversations',
      description: 'Chat-Verlauf analysieren',
      icon: MessageSquare,
      status: 'upcoming' as const,
      route: '/conversations',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
          <p className="text-gray-600 mt-2">Dashboard & KPIs</p>
        </div>
        <AppleCard padding="lg">
          <div className="text-gray-400 text-center py-12">Lädt Metriken...</div>
        </AppleCard>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Overview</h1>
        <p className="text-lg text-gray-600">
          Willkommen zurück! Hier ist eine Übersicht Ihrer KPIs und Journey.
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

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Sessions pro Tag"
            value={metrics.sessionsPerDay}
            change={{
              value: 12.5,
              label: 'vs. letzte Woche',
              trend: 'up',
            }}
            icon={TrendingUp}
            description="Aktive Nutzersessions"
          />
          <KPICard
            title="First Contact Resolution"
            value={`${(metrics.fcr * 100).toFixed(1)}%`}
            change={{
              value: 5.2,
              label: 'vs. letzte Woche',
              trend: 'up',
            }}
            icon={Zap}
            description="Fragen im ersten Kontakt gelöst"
          />
          <KPICard
            title="P95 Latency"
            value={`${metrics.p95Latency}ms`}
            change={{
              value: -8.3,
              label: 'vs. letzte Woche',
              trend: 'down',
            }}
            icon={RefreshCw}
            description="95. Perzentil Antwortzeit"
          />
          <KPICard
            title="Content Freshness"
            value={`${(metrics.contentFreshness * 100).toFixed(0)}%`}
            change={{
              value: 2.1,
              label: 'vs. letzte Woche',
              trend: 'up',
            }}
            icon={Search}
            description="Aktualität der Inhalte"
          />
        </div>
      )}

      {/* RAG Metrics */}
      {metrics?.ragMetrics && (
        <AppleCard variant="elevated" padding="lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">RAG Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Gesamte Suchen</p>
              <p className="text-3xl font-bold text-gray-900">
                {metrics.ragMetrics.totalSearches}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Durchschnittlicher Score</p>
              <p className="text-3xl font-bold text-gray-900">
                {metrics.ragMetrics.avgScore.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Top Queries</p>
              <div className="space-y-2 mt-2">
                {metrics.ragMetrics.topQueries.slice(0, 3).map((query, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{query.query}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {query.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AppleCard>
      )}

      {/* Journey Steps */}
      <AppleCard variant="elevated" padding="lg" className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Ihre Journey</h2>
        <div className="space-y-4">
          {journeySteps.map((step) => (
            <JourneyStep
              key={step.step}
              step={step.step}
              title={step.title}
              description={step.description}
              icon={step.icon}
              status={step.status}
              onClick={() => router.push(step.route)}
            />
          ))}
        </div>
      </AppleCard>
    </div>
  );
}
