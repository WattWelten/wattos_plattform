'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { useGuidedTourContext } from '@/components/onboarding/GuidedTourProvider';
import { getAgents } from '@/lib/api/agents';
import { getKpis, KpiRange } from '@/lib/api/dashboard';

export default function DashboardPage() {
  const { startTour } = useGuidedTourContext();
  const [range, setRange] = useState<KpiRange>('7d');
  const queryClient = useQueryClient();
  
  // Agents für zusätzliche Info (optional)
  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => getAgents().catch(() => []),
  });

  // Cache-Warming: Prefetch häufig genutzte Ranges
  useEffect(() => {
    const prefetchRanges: KpiRange[] = ['today', '7d', '30d'];
    prefetchRanges.forEach((r) => {
      if (r !== range) {
        queryClient.prefetchQuery({
          queryKey: ['kpis', r],
          queryFn: () => getKpis(r),
          staleTime: 60 * 1000,
        });
      }
    });
  }, [range, queryClient]);

  const dashboardTourSteps = [
    {
      id: 'dashboard-header',
      target: '[data-tour="dashboard-header"]',
      title: 'Dashboard Übersicht',
      description: 'Hier sehen Sie alle wichtigen KPIs Ihrer Plattform auf einen Blick.',
      position: 'bottom' as const,
    },
    {
      id: 'kpi-tiles',
      target: '[data-tour="kpi-tiles"]',
      title: 'KPI-Kacheln',
      description: 'Klicken Sie auf eine Kachel, um detaillierte Informationen zu sehen.',
      position: 'top' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between" data-tour="dashboard-header">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-lg text-gray-600">
              Übersicht über Ihre KI-Plattform
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as KpiRange)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              <option value="today">Heute</option>
              <option value="7d">7 Tage</option>
              <option value="30d">30 Tage</option>
            </select>
          </div>
        </div>

        <div data-tour="kpi-tiles">
          <KpiCards range={range} />
        </div>
      </div>
    </div>
  );
}
