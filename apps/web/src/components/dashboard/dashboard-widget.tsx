'use client';

import React from 'react';
import { X, Settings } from 'lucide-react';

interface DashboardWidgetProps {
  id: string;
  type: string;
  name: string;
  config: any;
  position: { x: number; y: number; w: number; h: number };
  selected?: boolean;
  onSelect?: (id: string) => void;
  onRemove?: (id: string) => void;
  onUpdate?: (id: string, updates: any) => void;
  children?: React.ReactNode;
}

/**
 * Dashboard Widget Component
 * 
 * Einzelnes Widget im Dashboard mit Drag & Drop Support
 */
export function DashboardWidget({
  id,
  type,
  name,
  config,
  position,
  selected = false,
  onSelect,
  onRemove,
  onUpdate,
  children,
}: DashboardWidgetProps) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(id);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(id);
    }
  };

  const handleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdate) {
      // Öffne Settings-Dialog (kann später erweitert werden)
      const newConfig = prompt('Widget Configuration (JSON):', JSON.stringify(config, null, 2));
      if (newConfig) {
        try {
          const parsed = JSON.parse(newConfig);
          onUpdate(id, { config: parsed });
        } catch (error) {
          console.error('Invalid JSON:', error);
        }
      }
    }
  };

  return (
    <div
      className={`dashboard-widget relative border-2 rounded-lg p-4 bg-white shadow-sm cursor-move ${
        selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      }`}
      style={{
        gridColumn: `span ${position.w}`,
        gridRow: `span ${position.h}`,
      }}
      onClick={handleClick}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">{name}</h3>
        <div className="flex gap-1">
          <button
            onClick={handleSettings}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleRemove}
            className="p-1 text-gray-400 hover:text-red-600"
            title="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Widget Content */}
      <div className="widget-content">
        {children || (
          <div className="text-gray-400 text-sm">
            Widget: {type}
          </div>
        )}
      </div>
    </div>
  );
}

