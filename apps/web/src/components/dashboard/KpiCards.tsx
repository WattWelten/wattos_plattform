/**
 * KPI Dashboard-Kacheln
 * 
 * Zeigt die 8 Haupt-KPIs + P95 Latenz + CSAT in modernen Karten
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@wattweiser/ui';

interface KpiData {
  answered: number;
  selfServiceRate: number;
  fullySolved: number;
  timeSavedHours: number;
  fteSaved: number;
  afterHoursPercent: number;
  topTopics: Array<{ topic: string; count: number }>;
  coverageRate: number;
  p95LatencyMs: number;
  csat: number;
}

interface KpiCardsProps {
  tenantId: string;
  range?: 'today' | '7d' | '30d';
}

export function KpiCards({ tenantId, range = '7d' }: KpiCardsProps) {
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKpis() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/analytics/kpi/${tenantId}?range=${range}`,
        );
        if (!response.ok) {
          throw new Error('Failed to fetch KPIs');
        }
        const data = await response.json();
        setKpis(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchKpis();
  }, [tenantId, range]);

  if (loading) {
    return <div>Lade KPIs...</div>;
  }

  if (error) {
    return <div>Fehler: {error}</div>;
  }

  if (!kpis) {
    return <div>Keine Daten verfügbar</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Anzahl beantworteter Anfragen */}
      <Card>
        <CardHeader>
          <CardTitle>Beantwortete Anfragen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{kpis.answered}</div>
          <p className="text-sm text-muted-foreground">Im Zeitraum</p>
        </CardContent>
      </Card>

      {/* Self-Service-Quote */}
      <Card>
        <CardHeader>
          <CardTitle>Self-Service-Quote</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {(kpis.selfServiceRate * 100).toFixed(1)}%
          </div>
          <p className="text-sm text-muted-foreground">
            {kpis.fullySolved} vollständig gelöst
          </p>
        </CardContent>
      </Card>

      {/* Zeitersparnis */}
      <Card>
        <CardHeader>
          <CardTitle>Zeitersparnis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {kpis.timeSavedHours.toFixed(1)}h
          </div>
          <p className="text-sm text-muted-foreground">
            {kpis.fteSaved.toFixed(2)} FTE gespart
          </p>
        </CardContent>
      </Card>

      {/* Außerhalb Öffnungszeiten */}
      <Card>
        <CardHeader>
          <CardTitle>Außerhalb Öffnungszeiten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {kpis.afterHoursPercent.toFixed(1)}%
          </div>
          <p className="text-sm text-muted-foreground">Nach 18 Uhr / WE</p>
        </CardContent>
      </Card>

      {/* Top-5 Themen */}
      <Card>
        <CardHeader>
          <CardTitle>Top-5 Themen</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {kpis.topTopics.slice(0, 5).map((topic, idx) => (
              <li key={idx} className="flex justify-between">
                <span>{topic.topic}</span>
                <span className="font-semibold">{topic.count}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Abdeckungsgrad */}
      <Card>
        <CardHeader>
          <CardTitle>Abdeckungsgrad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {(kpis.coverageRate * 100).toFixed(1)}%
          </div>
          <p className="text-sm text-muted-foreground">Top-Themen abgedeckt</p>
        </CardContent>
      </Card>

      {/* P95 Latenz */}
      <Card>
        <CardHeader>
          <CardTitle>P95 Latenz</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {kpis.p95LatencyMs.toFixed(0)}ms
          </div>
          <p className="text-sm text-muted-foreground">95. Perzentil</p>
        </CardContent>
      </Card>

      {/* CSAT */}
      <Card>
        <CardHeader>
          <CardTitle>CSAT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{kpis.csat.toFixed(1)}</div>
          <p className="text-sm text-muted-foreground">von 5.0</p>
        </CardContent>
      </Card>
    </div>
  );
}
