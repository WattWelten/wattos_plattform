/**
 * Dashboard API Client
 */

import { z } from 'zod';
import { authenticatedFetch } from './authenticated-fetch';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type KpiRange = 'today' | '7d' | '30d';

// Zod Schemas für Type-Safety und Runtime-Validierung
const KpiRangeSchema = z.enum(['today', '7d', '30d']);

const TopTopicSchema = z.object({
  topic: z.string(),
  count: z.number().int().nonnegative(),
});

export const KpiResultSchema = z.object({
  tenantId: z.string().uuid(),
  range: KpiRangeSchema,
  answered: z.number().int().nonnegative(),
  selfServiceRate: z.number().min(0).max(1),
  fullySolved: z.number().int().nonnegative(),
  timeSavedHours: z.number().nonnegative(),
  fteSaved: z.number().nonnegative(),
  afterHoursPercent: z.number().min(0).max(100),
  topTopics: z.array(TopTopicSchema),
  coverageRate: z.number().min(0).max(100),
  p95LatencyMs: z.number().int().nonnegative(),
  csat: z.number().min(0).max(5),
});

export type KpiResult = z.infer<typeof KpiResultSchema>;

const WidgetPositionSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const WidgetConfigSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  position: WidgetPositionSchema,
  config: z.record(z.unknown()),
});

const DashboardLayoutSchema = z.object({
  widgets: z.array(WidgetConfigSchema),
  columns: z.number().int().positive().optional(),
  rows: z.number().int().positive().optional(),
});

export const DashboardSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1),
  layout: DashboardLayoutSchema,
  isDefault: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Dashboard = z.infer<typeof DashboardSchema>;
export type DashboardLayout = z.infer<typeof DashboardLayoutSchema>;
export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;
export type WidgetPosition = z.infer<typeof WidgetPositionSchema>;


const CreateDashboardRequestSchema = z.object({
  name: z.string().min(1).max(255),
  layout: DashboardLayoutSchema,
  isDefault: z.boolean().optional().default(false),
});

const UpdateDashboardRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  layout: DashboardLayoutSchema.optional(),
  isDefault: z.boolean().optional(),
});

export type CreateDashboardRequest = z.infer<typeof CreateDashboardRequestSchema>;
export type UpdateDashboardRequest = z.infer<typeof UpdateDashboardRequestSchema>;


/**
 * KPIs abrufen
 */
export async function getKpis(range: KpiRange = '7d'): Promise<KpiResult> {
  // Validiere Range-Parameter
  const validatedRange = KpiRangeSchema.parse(range);
  
  const response = await authenticatedFetch(`${API_URL}/api/analytics/kpi?range=${validatedRange}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Fehler beim Abrufen der KPIs' }));
    throw new Error(error.message || 'Fehler beim Abrufen der KPIs');
  }

  const data = await response.json();
  // Runtime-Validierung mit Zod
  return KpiResultSchema.parse(data);
}

/**
 * Dashboard abrufen
 */
export async function getDashboard(dashboardId?: string): Promise<Dashboard> {
  const url = dashboardId
    ? `${API_URL}/api/dashboard?dashboardId=${dashboardId}`
    : `${API_URL}/api/dashboard`;
  const response = await authenticatedFetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Fehler beim Abrufen des Dashboards' }));
    throw new Error(error.message || 'Fehler beim Abrufen des Dashboards');
  }

  const data = await response.json();
  // Runtime-Validierung mit Zod
  return DashboardSchema.parse(data);
}

/**
 * Dashboard erstellen
 */
export async function createDashboard(data: CreateDashboardRequest): Promise<Dashboard> {
  // Validiere Request-Daten
  const validatedData = CreateDashboardRequestSchema.parse(data);
  
  const response = await authenticatedFetch(`${API_URL}/api/dashboard`, {
    method: 'POST',
    body: JSON.stringify(validatedData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Fehler beim Erstellen des Dashboards' }));
    throw new Error(error.message || 'Fehler beim Erstellen des Dashboards');
  }

  const result = await response.json();
  return DashboardSchema.parse(result);
}

/**
 * Dashboard aktualisieren
 */
export async function updateDashboard(id: string, data: UpdateDashboardRequest): Promise<Dashboard> {
  // Validiere UUID und Request-Daten
  z.string().uuid().parse(id);
  const validatedData = UpdateDashboardRequestSchema.parse(data);
  
  const response = await authenticatedFetch(`${API_URL}/api/dashboard/${id}`, {
    method: 'PUT',
    body: JSON.stringify(validatedData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Fehler beim Aktualisieren des Dashboards' }));
    throw new Error(error.message || 'Fehler beim Aktualisieren des Dashboards');
  }

  const result = await response.json();
  return DashboardSchema.parse(result);
}

/**
 * Dashboard löschen
 */
export async function deleteDashboard(id: string): Promise<void> {
  // Validiere UUID
  z.string().uuid().parse(id);
  
  const response = await authenticatedFetch(`${API_URL}/api/dashboard/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Fehler beim Löschen des Dashboards' }));
    throw new Error(error.message || 'Fehler beim Löschen des Dashboards');
  }
}
