'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Tabs, TabsList, TabsTrigger, TabsContent, Skeleton } from '@wattweiser/ui';
import { TrendingDown, MessageSquare, Zap, DollarSign, Users, RefreshCw, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, BarChart, PieChart } from '@/components/charts/lazy-charts';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/analytics?timeRange=${timeRange}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      return response.json();
    },
  });

  const stats = analyticsData?.stats || {
    totalCalls: 0,
    totalCost: 0,
    avgLatency: 0,
    errorRate: 0,
    activeUsers: 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-2 text-lg text-gray-600">
              Detaillierte Einblicke in Ihre Plattform-Nutzung
            </p>
          </div>
          <div className="flex gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="24h">Letzte 24 Stunden</option>
              <option value="7d">Letzte 7 Tage</option>
              <option value="30d">Letzte 30 Tage</option>
              <option value="90d">Letzte 90 Tage</option>
            </select>
            <Button variant="outline" size="lg" onClick={() => refetch()} className="gap-2">
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <FileText className="h-5 w-5" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">API Calls</p>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-8 w-20" />
                  ) : (
                    <p className="mt-1 text-2xl font-bold text-gray-900">{stats.totalCalls.toLocaleString()}</p>
                  )}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                  <MessageSquare className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gesamtkosten</p>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-8 w-20" />
                  ) : (
                    <p className="mt-1 text-2xl font-bold text-gray-900">€{stats.totalCost.toFixed(2)}</p>
                  )}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-100">
                  <DollarSign className="h-6 w-6 text-success-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ø Latenz</p>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-8 w-20" />
                  ) : (
                    <p className="mt-1 text-2xl font-bold text-gray-900">{stats.avgLatency}ms</p>
                  )}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-100">
                  <Zap className="h-6 w-6 text-warning-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fehlerrate</p>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-8 w-20" />
                  ) : (
                    <p className="mt-1 text-2xl font-bold text-gray-900">{stats.errorRate}%</p>
                  )}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error-100">
                  <TrendingDown className="h-6 w-6 text-error-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktive Nutzer</p>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-8 w-20" />
                  ) : (
                    <p className="mt-1 text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                  )}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                  <Users className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="usage">Nutzung</TabsTrigger>
            <TabsTrigger value="costs">Kosten</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>API Calls über Zeit</CardTitle>
                  <CardDescription>Anzahl der API-Aufrufe im ausgewählten Zeitraum</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <LineChart 
                      data={analyticsData?.usageData || []} 
                      dataKey="date"
                      lines={[
                        { key: 'calls', name: 'API Calls', color: '#0073E6' },
                        { key: 'cost', name: 'Kosten', color: '#00C49F' },
                      ]}
                    />
                  )}
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Kostenverteilung</CardTitle>
                  <CardDescription>Kosten nach Provider</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <PieChart data={analyticsData?.costDistribution || []} />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Nutzungsstatistiken</CardTitle>
                <CardDescription>Detaillierte Nutzungsdaten</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-96 w-full" />
                ) : (
                  <BarChart 
                    data={analyticsData?.usageData || []} 
                    dataKey="date"
                    bars={[
                      { key: 'calls', name: 'API Calls', color: '#0073E6' },
                    ]}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs" className="space-y-6">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Kostenanalyse</CardTitle>
                <CardDescription>Detaillierte Kostenaufschlüsselung</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-96 w-full" />
                ) : (
                  <LineChart 
                    data={analyticsData?.costData || []} 
                    dataKey="date"
                    lines={[
                      { key: 'total', name: 'Gesamtkosten', color: '#FF8042' },
                      { key: 'api', name: 'API Kosten', color: '#8884d8' },
                    ]}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Performance-Metriken</CardTitle>
                <CardDescription>Latenz und Fehlerrate über Zeit</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-96 w-full" />
                ) : (
                  <LineChart 
                    data={analyticsData?.performanceData || []} 
                    dataKey="date"
                    lines={[
                      { key: 'latency', name: 'Latenz (ms)', color: '#00C49F' },
                      { key: 'errorRate', name: 'Fehlerrate (%)', color: '#FF8042' },
                    ]}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
