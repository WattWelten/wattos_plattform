'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, BarChart, PieChart } from '@/components/charts/lazy-charts';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Users, MessageSquare, Zap, DollarSign, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Real-time Updates mit React Query
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['dashboard', timeRange],
    queryFn: async () => {
      // TODO: API-Call zum Admin-Service
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        stats: {
          activeUsers: 1234,
          chatsToday: 567,
          llmCalls: 12345,
          totalCost: 1234.56,
          growth: {
            users: 12,
            chats: 8,
            calls: 15,
            cost: -5,
          },
        },
        usageData: [
          { date: 'Mo', chats: 120, agents: 45, rag: 89 },
          { date: 'Di', chats: 145, agents: 52, rag: 102 },
          { date: 'Mi', chats: 132, agents: 48, rag: 95 },
          { date: 'Do', chats: 167, agents: 61, rag: 118 },
          { date: 'Fr', chats: 189, agents: 73, rag: 134 },
          { date: 'Sa', chats: 98, agents: 32, rag: 67 },
          { date: 'So', chats: 76, agents: 28, rag: 54 },
        ],
        providerData: [
          { provider: 'OpenAI', usage: 45, cost: 567.89 },
          { provider: 'Azure', usage: 30, cost: 345.12 },
          { provider: 'Anthropic', usage: 20, cost: 234.56 },
          { provider: 'Ollama', usage: 5, cost: 0 },
        ],
        costDistribution: [
          { name: 'Chat', value: 45 },
          { name: 'RAG', value: 30 },
          { name: 'Agents', value: 20 },
          { name: 'Embeddings', value: 5 },
        ],
      };
    },
    refetchInterval: autoRefresh ? 30000 : false, // Alle 30 Sekunden aktualisieren
  });

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetch]);

  if (!dashboardData) {
    return null;
  }

  const { stats, usageData, providerData, costDistribution } = dashboardData;

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-1">Übersicht über Ihre Plattform-Nutzung</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
            aria-label="Aktualisieren"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
          <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="24h">Letzte 24 Stunden</option>
            <option value="7d">Letzte 7 Tage</option>
            <option value="30d">Letzte 30 Tage</option>
            <option value="90d">Letzte 90 Tage</option>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Nutzer</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              {stats.growth.users > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-success-500" />
                  <span className="text-success-600">+{stats.growth.users}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3 text-error-500" />
                  <span className="text-error-600">{stats.growth.users}%</span>
                </>
              )}
              <span>zum Vormonat</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chats heute</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.chatsToday.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              {stats.growth.chats > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-success-500" />
                  <span className="text-success-600">+{stats.growth.chats}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3 text-error-500" />
                  <span className="text-error-600">{stats.growth.chats}%</span>
                </>
              )}
              <span>zum Vortag</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LLM-Aufrufe</CardTitle>
            <Zap className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.llmCalls.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              {stats.growth.calls > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-success-500" />
                  <span className="text-success-600">+{stats.growth.calls}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3 text-error-500" />
                  <span className="text-error-600">{stats.growth.calls}%</span>
                </>
              )}
              <span>zum Vormonat</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtkosten</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalCost.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              {stats.growth.cost < 0 ? (
                <>
                  <TrendingDown className="w-3 h-3 text-success-500" />
                  <span className="text-success-600">{Math.abs(stats.growth.cost)}% weniger</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-3 h-3 text-error-500" />
                  <span className="text-error-600">+{stats.growth.cost}%</span>
                </>
              )}
              <span>zum Vormonat</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Nutzung über Zeit</CardTitle>
            <CardDescription>Chats, Agents und RAG-Aufrufe</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart
              data={usageData}
              dataKey="date"
              lines={[
                { key: 'chats', name: 'Chats', color: '#0073E6' },
                { key: 'agents', name: 'Agents', color: '#10B981' },
                { key: 'rag', name: 'RAG', color: '#F59E0B' },
              ]}
            />
          </CardContent>
        </Card>

        {/* Provider Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Provider-Nutzung</CardTitle>
            <CardDescription>Aufrufe nach LLM-Provider</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={providerData}
              dataKey="provider"
              bars={[
                { key: 'usage', name: 'Aufrufe', color: '#0073E6' },
              ]}
            />
          </CardContent>
        </Card>

        {/* Cost Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Kostenverteilung</CardTitle>
            <CardDescription>Kosten nach Kategorie</CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart data={costDistribution} />
          </CardContent>
        </Card>

        {/* Provider Costs */}
        <Card>
          <CardHeader>
            <CardTitle>Provider-Kosten</CardTitle>
            <CardDescription>Kosten nach Provider</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={providerData}
              dataKey="provider"
              bars={[
                { key: 'cost', name: 'Kosten (€)', color: '#EF4444' },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
