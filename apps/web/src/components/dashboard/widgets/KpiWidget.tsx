/**
 * KPI Widget Component
 * 
 * Zeigt KPI-Daten mit Chart-Optionen und Trend-Anzeige
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@wattweiser/ui';
import { getKpis, KpiRange } from '@/lib/api/dashboard';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface KpiWidgetProps {
  kpiType: 'answered' | 'selfServiceRate' | 'fullySolved' | 'csat' | 'coverageRate';
  range?: KpiRange;
  showChart?: boolean;
  showTrend?: boolean;
  compareRange?: KpiRange; // Für Trend-Vergleich
}

export function KpiWidget({
  kpiType,
  range = '7d',
  showChart = false,
  showTrend = true,
  compareRange,
}: KpiWidgetProps) {
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['kpis', range],
    queryFn: () => getKpis(range),
    staleTime: 60 * 1000,
  });

  const { data: compareKpis } = useQuery({
    queryKey: ['kpis', compareRange],
    queryFn: () => compareRange ? getKpis(compareRange) : null,
    enabled: !!compareRange && showTrend,
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!kpis) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Keine Daten verfügbar
        </CardContent>
      </Card>
    );
  }

  const getKpiValue = () => {
    switch (kpiType) {
      case 'answered':
        return kpis.answered;
      case 'selfServiceRate':
        return (kpis.selfServiceRate * 100).toFixed(1) + '%';
      case 'fullySolved':
        return kpis.fullySolved;
      case 'csat':
        return kpis.csat.toFixed(1);
      case 'coverageRate':
        return (kpis.coverageRate * 100).toFixed(1) + '%';
      default:
        return 0;
    }
  };

  const getKpiLabel = () => {
    switch (kpiType) {
      case 'answered':
        return 'Beantwortete Anfragen';
      case 'selfServiceRate':
        return 'Self-Service-Quote';
      case 'fullySolved':
        return 'Vollständig gelöst';
      case 'csat':
        return 'CSAT Score';
      case 'coverageRate':
        return 'Abdeckungsgrad';
      default:
        return '';
    }
  };

  const getTrend = () => {
    if (!showTrend || !compareKpis || !compareRange) return null;

    const current = kpis[kpiType] as number;
    const previous = compareKpis[kpiType] as number;
    const diff = current - previous;
    const percentChange = previous !== 0 ? ((diff / previous) * 100) : 0;

    return {
      value: Math.abs(percentChange).toFixed(1),
      positive: diff >= 0,
      diff,
    };
  };

  const trend = getTrend();

  // Mock-Daten für Chart (später durch echte Zeitreihen-Daten ersetzen)
  const chartData = [
    { date: 'Mo', value: kpis.answered * 0.8 },
    { date: 'Di', value: kpis.answered * 0.9 },
    { date: 'Mi', value: kpis.answered * 0.95 },
    { date: 'Do', value: kpis.answered },
    { date: 'Fr', value: kpis.answered * 1.1 },
    { date: 'Sa', value: kpis.answered * 0.7 },
    { date: 'So', value: kpis.answered * 0.6 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{getKpiLabel()}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{getKpiValue()}</span>
            {trend && (
              <div className={`flex items-center gap-1 text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.positive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{trend.value}%</span>
                <span className="text-muted-foreground">vs. {compareRange}</span>
              </div>
            )}
          </div>

          {showChart && (
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
