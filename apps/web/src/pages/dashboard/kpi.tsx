/**
 * KPI Dashboard Seite
 * 
 * Zeigt alle KPIs für den aktuellen Tenant
 * Tenant-ID wird aus Context extrahiert (nicht manuell wählbar)
 */

import { useState } from 'react';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { useTenant } from '@/contexts/tenant.context';
import { KpiRange } from '@/lib/api/dashboard';

export default function KpiDashboardPage() {
  const { tenantId, isLoading, error } = useTenant();
  const [range, setRange] = useState<KpiRange>('7d');

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Lade Tenant-Informationen...</p>
        </div>
      </div>
    );
  }

  if (error || !tenantId) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <p className="font-semibold text-destructive">Fehler</p>
          <p className="text-sm text-muted-foreground">
            {error || 'Tenant-ID konnte nicht geladen werden. Bitte melden Sie sich erneut an.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">KPI Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Übersicht über alle Key Performance Indicators
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

      <KpiCards range={range} />
    </div>
  );
}
