'use client';

import { useQuery } from '@tanstack/react-query';
import { BentoGrid } from '@/components/dashboard/BentoGrid';
import { KPITile } from '@/components/dashboard/KPITile';
import { useGuidedTourContext } from '@/components/onboarding/GuidedTourProvider';
import { 
  MessageSquare, 
  ThumbsUp, 
  DollarSign, 
  FileText, 
  Bot, 
  Activity 
} from 'lucide-react';
import { getAgents } from '@/lib/api/agents';

export default function DashboardPage() {
  const { startTour } = useGuidedTourContext();
  
  // Mock-Daten für MVP (später durch echte API-Calls ersetzen)
  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => getAgents().catch(() => []),
  });

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

  const kpis = [
    {
      title: 'Conversations',
      value: '1,234',
      description: 'Gesamt Konversationen',
      icon: MessageSquare,
      trend: { value: 12, label: 'vs. letzter Monat', positive: true },
      href: '/de/analytics',
    },
    {
      title: 'Quality',
      value: '94%',
      description: '👍-Quote',
      icon: ThumbsUp,
      trend: { value: 3, label: 'vs. letzter Monat', positive: true },
      href: '/de/analytics',
    },
    {
      title: 'Costs',
      value: '€234',
      description: 'Token-Kosten (30d)',
      icon: DollarSign,
      trend: { value: -5, label: 'vs. letzter Monat', positive: true },
      href: '/de/analytics',
    },
    {
      title: 'Sources',
      value: '42',
      description: 'Indexierte Quellen',
      icon: FileText,
      href: '/de/knowledge-bases',
    },
    {
      title: 'Agents',
      value: agents?.length || 0,
      description: 'Veröffentlichte Agents',
      icon: Bot,
      href: '/de/assistants',
    },
    {
      title: 'System Health',
      value: '99.9%',
      description: 'Uptime (30d)',
      icon: Activity,
      trend: { value: 0.1, label: 'vs. letzter Monat', positive: true },
      href: '/de/admin',
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
        </div>

        <div data-tour="kpi-tiles">

        <BentoGrid>
          {kpis.map((kpi) => (
            <KPITile
              key={kpi.title}
              title={kpi.title}
              value={kpi.value}
              description={kpi.description}
              icon={kpi.icon}
              trend={kpi.trend}
              href={kpi.href}
            />
          ))}
        </BentoGrid>
        </div>
      </div>
    </div>
  );
}
