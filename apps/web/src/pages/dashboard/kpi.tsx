/**
 * KPI Dashboard Seite
 * 
 * Zeigt alle KPIs für den aktuellen Tenant
 */

import { useState } from 'react';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { TenantSwitcher } from '@/components/dashboard/TenantSwitcher';

export default function KpiDashboardPage() {
  const [tenantId, setTenantId] = useState<string>('musterlandkreis');
  const [range, setRange] = useState<'today' | '7d' | '30d'>('7d');

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
          <TenantSwitcher
            currentTenantId={tenantId}
            onTenantChange={setTenantId}
          />
          <select
            value={range}
            onChange={(e) =>
              setRange(e.target.value as 'today' | '7d' | '30d')
            }
            className="px-4 py-2 border rounded-lg"
          >
            <option value="today">Heute</option>
            <option value="7d">7 Tage</option>
            <option value="30d">30 Tage</option>
          </select>
        </div>
      </div>

      <KpiCards tenantId={tenantId} range={range} />
    </div>
  );
}
