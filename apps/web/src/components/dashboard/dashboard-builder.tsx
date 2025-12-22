'use client';

import React, { useState, useEffect } from 'react';
// TODO: Implement DashboardWidget, WidgetLibrary, and DashboardLayout components
// import { DashboardWidget } from './dashboard-widget';
// import { WidgetLibrary } from './widget-library';
// import { DashboardLayout } from './dashboard-layout';

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

  // TODO: These functions will be used when DashboardLayout is implemented
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unusedRemoveWidget = handleRemoveWidget;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unusedUpdateWidget = handleUpdateWidget;

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
        {/* TODO: Implement WidgetLibrary and DashboardLayout components */}
        <div className="p-4 border rounded">
          <p className="text-gray-500">Widget Library (TODO: Implement)</p>
          <button onClick={() => handleAddWidget('overview')} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
            Add Overview Widget
          </button>
        </div>

        <div className="p-4 border rounded mt-4">
          <p className="text-gray-500">Dashboard Layout (TODO: Implement)</p>
          <p className="text-sm text-gray-400 mt-2">Widgets: {widgets.length}</p>
        </div>
      </div>
    </div>
  );
}
