/**
 * KPI Dashboard-Kacheln
 * 
 * Zeigt die 8 Haupt-KPIs + P95 Latenz + CSAT in modernen Karten
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@wattweiser/ui';
import { getKpis, KpiResult, KpiRange } from '@/lib/api/dashboard';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useEffect } from 'react';

interface KpiCardsProps {
  range?: KpiRange;
}

export function KpiCards({ range = '7d' }: KpiCardsProps) {
  const { toast } = useToast();
  
  const {
    data: kpis,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['kpis', range],
    queryFn: () => getKpis(range),
    staleTime: 60 * 1000, // 1 Minute
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error: Error) => {
      toast({
        title: 'Fehler beim Laden der KPIs',
        description: error.message || 'Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
    },
  });

  // Zeige Toast bei Fehler (nur einmal)
  useEffect(() => {
    if (error && !isLoading) {
      // Toast wird bereits in onError gezeigt, aber für manuelle Retries
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      if (errorMessage.includes('Nicht authentifiziert') || errorMessage.includes('Session abgelaufen')) {
        // Redirect wird bereits in API-Client gehandhabt
        return;
      }
    }
  }, [error, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Lade KPIs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <div className="text-center">
          <p className="font-semibold text-destructive">Fehler beim Laden der KPIs</p>
          <p className="text-sm text-muted-foreground mt-2">
            {error instanceof Error ? error.message : 'Unbekannter Fehler'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        Keine Daten verfügbar
      </div>
    );
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
