import { test, expect } from '@playwright/test';
test('tenant-scoped KPI endpoint works (mock auth)', async ({ request }) => {
  const res = await request.get('http://localhost:4000/api/analytics/kpi?range=7d', { headers: { 'x-tenant-id': 'musterlandkreis' } });
  expect(res.ok()).toBeTruthy(); const json = await res.json();
  expect(json.tenantId).toBe('musterlandkreis'); expect(json).toHaveProperty('answered');
});
