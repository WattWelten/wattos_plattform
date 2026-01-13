/**
 * Analytics API Client
 */

import { z } from 'zod';
import { authenticatedFetch } from './authenticated-fetch';
import { KpiRange, KpiRangeSchema } from './dashboard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Zod Schemas für Type-Safety
export const AnalyticsDataSchema = z.object({
  tenantId: z.string().uuid(),
  timeRange: z.string(),
}).passthrough(); // Erlaubt zusätzliche Properties

export type AnalyticsData = z.infer<typeof AnalyticsDataSchema>;

const KpiMetricsSchema = z.object({
  tenantId: z.string().uuid(),
  range: KpiRangeSchema,
  metrics: z.record(z.unknown()),
  timestamp: z.string().datetime(),
});

export type KpiMetrics = z.infer<typeof KpiMetricsSchema>;

const KpiAlertSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  metric: z.string(),
  threshold: z.number(),
  currentValue: z.number(),
  severity: z.enum(['warning', 'error', 'critical']),
  message: z.string(),
  timestamp: z.string().datetime(),
});

export type KpiAlert = z.infer<typeof KpiAlertSchema>;


/**
 * Analytics-Daten abrufen
 */
export async function getAnalytics(timeRange: string = '7d'): Promise<AnalyticsData> {
  const response = await authenticatedFetch(`${API_URL}/api/analytics?timeRange=${timeRange}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Fehler beim Abrufen der Analytics-Daten' }));
    throw new Error(error.message || 'Fehler beim Abrufen der Analytics-Daten');
  }

  const data = await response.json();
  return AnalyticsDataSchema.parse(data);
}

/**
 * KPI-Metriken exportieren
 */
export async function getKpiMetrics(range: KpiRange = '7d'): Promise<KpiMetrics> {
  const validatedRange = KpiRangeSchema.parse(range);
  const response = await authenticatedFetch(`${API_URL}/api/analytics/kpi/metrics?range=${validatedRange}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Fehler beim Abrufen der KPI-Metriken' }));
    throw new Error(error.message || 'Fehler beim Abrufen der KPI-Metriken');
  }

  const data = await response.json();
  return KpiMetricsSchema.parse(data);
}

/**
 * KPI-Alerts abrufen
 */
export async function getKpiAlerts(): Promise<KpiAlert[]> {
  const response = await authenticatedFetch(`${API_URL}/api/analytics/kpi/alerts`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Fehler beim Abrufen der KPI-Alerts' }));
    throw new Error(error.message || 'Fehler beim Abrufen der KPI-Alerts');
  }

  const data = await response.json();
  return z.array(KpiAlertSchema).parse(data);
}
