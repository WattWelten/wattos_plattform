'use client';

import React from 'react';

interface WidgetLibraryProps {
  onAddWidget: (widgetType: string) => void;
}

const WIDGET_TYPES = [
  { type: 'overview', name: 'Overview', icon: '📊' },
  { type: 'conversations', name: 'Conversations', icon: '💬' },
  { type: 'agents', name: 'Agents', icon: '🤖' },
  { type: 'analytics', name: 'Analytics', icon: '📈' },
  { type: 'metrics', name: 'Metrics', icon: '⚡' },
  { type: 'kb-sync', name: 'KB Sync', icon: '🔄' },
];

/**
 * Widget Library Component
 * 
 * Zeigt verfügbare Widget-Typen zum Hinzufügen
 */
export function WidgetLibrary({ onAddWidget }: WidgetLibraryProps) {
  return (
    <div className="widget-library">
      <h3>Widget Library</h3>
      <div className="widget-list">
        {WIDGET_TYPES.map((widget) => (
          <div
            key={widget.type}
            className="widget-item"
            onClick={() => onAddWidget(widget.type)}
          >
            <span className="widget-icon">{widget.icon}</span>
            <span className="widget-name">{widget.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

