/**
 * Analytics API Client
 */

import { z } from 'zod';
import { getValidAccessToken } from '../auth/token-refresh';
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
 * Helper: Authenticated fetch mit automatischem Token-Refresh
 */
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getValidAccessToken();
  if (!token) {
    throw new Error('Nicht authentifiziert. Bitte melden Sie sich erneut an.');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    credentials: 'include', // Wichtig für Cookie-basierte Auth
    signal: AbortSignal.timeout(30000), // 30s Timeout
  });

  // Token abgelaufen, versuche Refresh
  if (response.status === 401) {
    const refreshedToken = await getValidAccessToken();
    if (refreshedToken) {
      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshedToken}`,
          ...options.headers,
        },
        credentials: 'include', // Wichtig für Cookie-basierte Auth
        signal: AbortSignal.timeout(30000),
      });
    }
    // Refresh fehlgeschlagen, redirect zu Login
    if (typeof window !== 'undefined') {
      window.location.href = '/de/login';
    }
    throw new Error('Session abgelaufen. Bitte melden Sie sich erneut an.');
  }

  return response;
}

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
