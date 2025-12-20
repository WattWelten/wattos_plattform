'use client';

import React, { useState, useEffect } from 'react';
import { DashboardWidget } from './dashboard-widget';
import { WidgetLibrary } from './widget-library';
import { DashboardLayout } from './dashboard-layout';

interface DashboardBuilderProps {
  tenantId: string;
  dashboardId?: string;
  onSave?: (layout: any) => void;
}

/**
 * Dashboard Builder Component
 * 
 * Low-Code Dashboard-Builder mit Drag & Drop
 */
export function DashboardBuilder({
  tenantId,
  dashboardId,
  onSave,
}: DashboardBuilderProps) {
  const [widgets, setWidgets] = useState<any[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (dashboardId) {
      loadDashboard();
    } else {
      loadDefaultDashboard();
    }
  }, [dashboardId, tenantId]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/v1/dashboards/${dashboardId}?tenantId=${tenantId}`,
      );
      const data = await response.json();
      setWidgets(data.layout?.widgets || []);
    } catch (error) {
      // Error-Handling: In Production sollte hier ein Logger verwendet werden
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load dashboard:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadDefaultDashboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/v1/dashboards?tenantId=${tenantId}`,
      );
      const data = await response.json();
      const defaultDashboard = data.find((d: any) => d.isDefault);
      if (defaultDashboard) {
        setWidgets(defaultDashboard.layout?.widgets || []);
      }
    } catch (error) {
      // Error-Handling: In Production sollte hier ein Logger verwendet werden
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load default dashboard:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const layout = { widgets };
      if (onSave) {
        onSave(layout);
      } else if (dashboardId) {
        await fetch(`/api/v1/dashboards/${dashboardId}?tenantId=${tenantId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ layout }),
        });
      } else {
        await fetch(`/api/v1/dashboards?tenantId=${tenantId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'My Dashboard',
            layout,
            isDefault: false,
          }),
        });
      }
    } catch (error) {
      // Error-Handling: In Production sollte hier ein Logger verwendet werden
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to save dashboard:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && widgets.length === 0) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-builder">
      <div className="dashboard-builder-header">
        <h2>Dashboard Builder</h2>
        <button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Dashboard'}
        </button>
      </div>

      <div className="dashboard-builder-content">
        <WidgetLibrary onAddWidget={handleAddWidget} />

        <DashboardLayout
          widgets={widgets}
          selectedWidget={selectedWidget}
          onSelectWidget={setSelectedWidget}
          onUpdateWidget={handleUpdateWidget}
          onRemoveWidget={handleRemoveWidget}
        />
      </div>
    </div>
  );
}
