'use client';

import React, { useState } from 'react';
import { DashboardWidget } from './dashboard-widget';
import { useDragAndDrop } from '../hooks/use-drag-and-drop';

interface DashboardLayoutProps {
  widgets: any[];
  selectedWidget: string | null;
  onSelectWidget: (widgetId: string | null) => void;
  onUpdateWidget: (widgetId: string, updates: any) => void;
  onRemoveWidget: (widgetId: string) => void;
}

/**
 * Dashboard Layout Component
 * 
 * Grid-basiertes Layout mit Drag & Drop
 */
export function DashboardLayout({
  widgets,
  selectedWidget,
  onSelectWidget,
  onUpdateWidget,
  onRemoveWidget,
}: DashboardLayoutProps) {
  const { handleDragStart, handleDragOver, handleDrop } = useDragAndDrop(
    widgets,
    onUpdateWidget,
  );

  return (
    <div
      className="dashboard-layout"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '16px',
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {widgets.map((widget) => (
        <div
          key={widget.id}
          draggable
          onDragStart={(e) => handleDragStart(e, widget.id)}
          style={{
            gridColumn: `span ${widget.position?.w || 6}`,
            gridRow: `span ${widget.position?.h || 4}`,
          }}
        >
          <DashboardWidget
            widget={widget}
            isSelected={selectedWidget === widget.id}
            onSelect={() => onSelectWidget(widget.id)}
            onUpdate={(updates) => onUpdateWidget(widget.id, updates)}
            onRemove={() => onRemoveWidget(widget.id)}
          />
        </div>
      ))}
    </div>
  );
}

