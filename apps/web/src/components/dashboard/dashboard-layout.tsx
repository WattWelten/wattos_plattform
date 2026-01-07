'use client';

import React, { useState } from 'react';
import { DashboardWidget } from './dashboard-widget';

interface Widget {
  id: string;
  type: string;
  name: string;
  config: any;
  position: { x: number; y: number; w: number; h: number };
}

interface DashboardLayoutProps {
  widgets: Widget[];
  selectedWidget?: string | null;
  onSelectWidget?: (id: string) => void;
  onRemoveWidget?: (id: string) => void;
  onUpdateWidget?: (id: string, updates: any) => void;
  onMoveWidget?: (id: string, newPosition: { x: number; y: number }) => void;
  onResizeWidget?: (id: string, newSize: { w: number; h: number }) => void;
}

/**
 * Dashboard Layout Component
 * 
 * Grid-basiertes Layout für Dashboard-Widgets mit Drag & Drop
 */
export function DashboardLayout({
  widgets,
  selectedWidget,
  onSelectWidget,
  onRemoveWidget,
  onUpdateWidget,
  onMoveWidget,
}: DashboardLayoutProps) {
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

  // Berechne Grid-Größe basierend auf Widget-Positionen
  const maxX = Math.max(...widgets.map((w) => w.position.x + w.position.w), 12);
  const maxY = Math.max(...widgets.map((w) => w.position.y + w.position.h), 8);

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedWidget || !onMoveWidget) return;

    // Berechne neue Position basierend auf Drop-Position
    const gridX = Math.floor((e.clientX - e.currentTarget.getBoundingClientRect().left) / 100);
    const gridY = Math.floor((e.clientY - e.currentTarget.getBoundingClientRect().top) / 100);

    onMoveWidget(draggedWidget, { x: gridX, y: gridY });
    setDraggedWidget(null);
  };

  return (
    <div
      className="dashboard-layout p-4 border rounded-lg bg-gray-50 min-h-[600px]"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${maxX}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${maxY}, minmax(100px, auto))`,
        }}
      >
        {widgets.map((widget) => (
          <div
            key={widget.id}
            draggable
            onDragStart={(e) => handleDragStart(e, widget.id)}
            style={{
              gridColumn: `${widget.position.x + 1} / span ${widget.position.w}`,
              gridRow: `${widget.position.y + 1} / span ${widget.position.h}`,
            }}
          >
            <DashboardWidget
              id={widget.id}
              type={widget.type}
              name={widget.name}
              config={widget.config}
              position={widget.position}
              selected={selectedWidget === widget.id}
              {...(onSelectWidget !== undefined && { onSelect: onSelectWidget })}
              {...(onRemoveWidget !== undefined && { onRemove: onRemoveWidget })}
              {...(onUpdateWidget !== undefined && { onUpdate: onUpdateWidget })}
            />
          </div>
        ))}
      </div>

      {widgets.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-400">
          <p>No widgets yet. Add widgets from the library.</p>
        </div>
      )}
    </div>
  );
}

