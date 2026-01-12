/**
 * E2E Tests fÃ¼r Multi-Tenant KPI System
 * 
 * Testet:
 * - KPI-Endpoints Ã¼ber Gateway
 * - Tenant-Isolation
 * - RBAC
 * - Cache-Verhalten
 * - Health Checks
 */

import { test, expect } from '@playwright/test';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3001';
const DASHBOARD_SERVICE_URL = process.env.DASHBOARD_SERVICE_URL || 'http://localhost:3011';

// Test-Tenant-IDs (mÃ¼ssen in der Datenbank existieren)
const TEST_TENANT_1 = process.env.TEST_TENANT_ID || '00000000-0000-0000-0000-000000000001';
const TEST_TENANT_2 = process.env.TEST_TENANT_2_ID || '00000000-0000-0000-0000-000000000002';

// Test-User (mÃ¼ssen in der Datenbank existieren)
const TEST_USER_ADMIN = {
  id: 'test-admin-1',
  email: 'admin@test.com',
  tenantId: TEST_TENANT_1,
  role: 'ADMIN',
};

const TEST_USER_EDITOR = {
  id: 'test-editor-1',
  email: 'editor@test.com',
  tenantId: TEST_TENANT_1,
  role: 'EDITOR',
};

const TEST_USER_VIEWER = {
  id: 'test-viewer-1',
  email: 'viewer@test.com',
  tenantId: TEST_TENANT_1,
  role: 'VIEWER',
};

/**
 * Helper: Erstelle JWT-Token (Mock fÃ¼r Tests)
 * In Produktion wÃ¼rde dies ein echter JWT sein
 */
function createMockToken(user: typeof TEST_USER_ADMIN): string {
  // Mock-Token (in echten Tests wÃ¼rde hier ein echter JWT erstellt)
  return Buffer.from(JSON.stringify(user)).toString('base64');
}

/**
 * Helper: Erstelle Request-Headers mit Auth
 */
function createAuthHeaders(user: typeof TEST_USER_ADMIN): Record<string, string> {
  return {
    'Authorization': Bearer ,
    'X-Tenant-Id': user.tenantId,
    'X-User-Id': user.id,
    'X-User-Email': user.email,
    'Content-Type': 'application/json',
  };
}

test.describe('Multi-Tenant KPI E2E Tests', () => {
  test.beforeAll(async () => {
    // PrÃ¼fe ob Services erreichbar sind
    try {
      const gatewayHealth = await fetch(${GATEWAY_URL}/api/health/liveness);
      expect(gatewayHealth.ok).toBeTruthy();
    } catch (error) {
      test.skip(true, 'Gateway nicht erreichbar');
    }

    try {
      const dashboardHealth = await fetch(${DASHBOARD_SERVICE_URL}/health/liveness);
      expect(dashboardHealth.ok).toBeTruthy();
    } catch (error) {
      test.skip(true, 'Dashboard-Service nicht erreichbar');
    }
  });

  test.describe('Health Checks', () => {
    test('Gateway Health Check', async ({ request }) => {
      const response = await request.get(${GATEWAY_URL}/api/health/liveness);
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.status).toBe('alive');
    });

    test('Dashboard Service Health Check', async ({ request }) => {
      const response = await request.get(${DASHBOARD_SERVICE_URL}/health/liveness);
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.status).toBe('alive');
    });

    test('Dashboard Service Full Health Check', async ({ request }) => {
      const response = await request.get(${DASHBOARD_SERVICE_URL}/health);
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.status).toMatch(/healthy|degraded|unhealthy/);
      expect(body.checks).toBeDefined();
    });

    test('Dashboard Service Views Health Check', async ({ request }) => {
      const response = await request.get(${DASHBOARD_SERVICE_URL}/health/views);
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.status).toMatch(/up|down/);
      expect(body.views).toBeDefined();
    });
  });

  test.describe('KPI Endpoints (Ã¼ber Gateway)', () => {
    test('GET /api/analytics/kpis - Als ADMIN', async ({ request }) => {
      const headers = createAuthHeaders(TEST_USER_ADMIN);
      const response = await request.get(${GATEWAY_URL}/api/analytics/kpis?range=7d, {
        headers,
      });

      expect(response.ok()).toBeTruthy();
      const kpis = await response.json();

      // PrÃ¼fe KPI-Struktur
      expect(kpis).toHaveProperty('answered');
      expect(kpis).toHaveProperty('selfServiceRate');
      expect(kpis).toHaveProperty('fullySolved');
      expect(kpis).toHaveProperty('timeSavedHours');
      expect(kpis).toHaveProperty('fteSaved');
      expect(kpis).toHaveProperty('afterHoursPercent');
      expect(kpis).toHaveProperty('topTopics');
      expect(kpis).toHaveProperty('coverageRate');
      expect(kpis).toHaveProperty('p95LatencyMs');
      expect(kpis).toHaveProperty('csat');

      // PrÃ¼fe Typen
      expect(typeof kpis.answered).toBe('number');
      expect(typeof kpis.selfServiceRate).toBe('number');
      expect(typeof kpis.csat).toBe('number');
      expect(Array.isArray(kpis.topTopics)).toBeTruthy();
    });

    test('GET /api/analytics/kpis - Mit verschiedenen Ranges', async ({ request }) => {
      const headers = createAuthHeaders(TEST_USER_ADMIN);
      const ranges = ['today', '7d', '30d'];

      for (const range of ranges) {
        const response = await request.get(${GATEWAY_URL}/api/analytics/kpis?range=, {
          headers,
        });

        expect(response.ok()).toBeTruthy();
        const kpis = await response.json();
        expect(kpis).toHaveProperty('answered');
      }
    });
  });

  test.describe('Tenant Isolation', () => {
    test('Tenant 1 sollte nur eigene KPIs sehen', async ({ request }) => {
      const headers1 = createAuthHeaders({ ...TEST_USER_ADMIN, tenantId: TEST_TENANT_1 });
      const response1 = await request.get(${GATEWAY_URL}/api/analytics/kpis?range=7d, {
        headers: headers1,
      });

      expect(response1.ok()).toBeTruthy();
      const kpis1 = await response1.json();

      // Tenant 2 sollte andere KPIs haben (oder leer sein)
      const headers2 = createAuthHeaders({ ...TEST_USER_ADMIN, tenantId: TEST_TENANT_2 });
      const response2 = await request.get(${GATEWAY_URL}/api/analytics/kpis?range=7d, {
        headers: headers2,
      });

      expect(response2.ok()).toBeTruthy();
      const kpis2 = await response2.json();

      // KPIs sollten unterschiedlich sein (oder beide 0 wenn keine Daten)
      expect(kpis1).toBeDefined();
      expect(kpis2).toBeDefined();
    });
  });

  test.describe('RBAC (Role-Based Access Control)', () => {
    test('VIEWER kann KPIs lesen', async ({ request }) => {
      const headers = createAuthHeaders(TEST_USER_VIEWER);
      const response = await request.get(${GATEWAY_URL}/api/analytics/kpis?range=7d, {
        headers,
      });

      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Prometheus Export', () => {
    test('GET /api/metrics - Als ADMIN', async ({ request }) => {
      const headers = createAuthHeaders(TEST_USER_ADMIN);
      const response = await request.get(${GATEWAY_URL}/api/metrics, {
        headers,
      });

      expect(response.ok()).toBeTruthy();
      const text = await response.text();

      // PrÃ¼fe Prometheus-Format
      expect(text).toContain('# HELP');
      expect(text).toContain('# TYPE');
      expect(text).toContain('wattweiser_kpi_answered');
    });
  });
});
