'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { WidgetLibrary } from './widget-library';
import { DashboardLayout } from './dashboard-layout';
import { getDashboard, createDashboard, updateDashboard, Dashboard, DashboardLayout as DashboardLayoutType } from '@/lib/api/dashboard';
import { useTenant } from '@/contexts/tenant.context';

/**
 * Dashboard Builder Component
 * 
 * Low-Code Dashboard-Builder mit Drag & Drop
 */
export function DashboardBuilder({
  dashboardId,
  onSave,
}: DashboardBuilderProps) {
  const { tenantId, isLoading: tenantLoading } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [widgets, setWidgets] = useState<any[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

  // Lade Dashboard
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard', dashboardId],
    queryFn: () => dashboardId ? getDashboard(dashboardId) : getDashboard(),
    enabled: !!tenantId && !tenantLoading,
    onSuccess: (data) => {
      setWidgets(data.layout?.widgets || []);
    },
  });

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (layout: DashboardLayoutType) => {
      if (dashboardId && dashboard) {
        return updateDashboard(dashboardId, { layout });
      } else {
        return createDashboard({
          name: 'My Dashboard',
          layout,
          isDefault: false,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Erfolgreich',
        description: 'Dashboard wurde gespeichert.',
      });
      if (onSave) {
        onSave(dashboard?.layout || { widgets: [] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Speichern des Dashboards.',
        variant: 'destructive',
      });
    },
  });

  const handleAddWidget = (widgetType: string) => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      position: { x: 0, y: widgets.length * 4, w: 6, h: 4 },
      config: {},
    };
    setWidgets([...widgets, newWidget]);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(widgets.filter((w) => w.id !== widgetId));
  };

  const handleUpdateWidget = (widgetId: string, updates: any) => {
    setWidgets(
      widgets.map((w) => (w.id === widgetId ? { ...w, ...updates } : w)),
    );
  };

  const handleSave = () => {
    const layout: DashboardLayoutType = { widgets };
    saveMutation.mutate(layout);
  };

  if (tenantLoading || (isLoading && widgets.length === 0)) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Lade Dashboard...</p>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">Tenant-ID nicht verfügbar.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-builder">
      <div className="dashboard-builder-header flex items-center justify-between mb-4 p-4 bg-white rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold">Dashboard Builder</h2>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveMutation.isPending ? 'Speichere...' : 'Dashboard speichern'}
        </button>
      </div>

      <div className="dashboard-builder-content grid grid-cols-12 gap-4">
        {/* Widget Library */}
        <div className="col-span-3">
          <WidgetLibrary onAddWidget={handleAddWidget} />
        </div>

        {/* Dashboard Layout */}
        <div className="col-span-9">
          <DashboardLayout
            widgets={widgets}
            selectedWidget={selectedWidget}
            onSelectWidget={setSelectedWidget}
            onRemoveWidget={handleRemoveWidget}
            onUpdateWidget={handleUpdateWidget}
            onMoveWidget={(id, newPosition) => {
              const widget = widgets.find((w) => w.id === id);
              if (widget) {
                handleUpdateWidget(id, {
                  position: { ...widget.position, ...newPosition },
                });
              }
            }}
            onResizeWidget={(id, newSize) => {
              const widget = widgets.find((w) => w.id === id);
              if (widget) {
                handleUpdateWidget(id, {
                  position: { ...widget.position, ...newSize },
                });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
