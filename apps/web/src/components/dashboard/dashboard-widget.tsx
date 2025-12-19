'use client';

import React from 'react';
import { OverviewWidget } from './widgets/overview-widget';
import { ConversationsWidget } from './widgets/conversations-widget';
import { AgentsWidget } from './widgets/agents-widget';
import { AnalyticsWidget } from './widgets/analytics-widget';
import { MetricsWidget } from './widgets/metrics-widget';
import { KBSyncWidget } from './widgets/kb-sync-widget';

interface DashboardWidgetProps {
  widget: any;
  data?: any;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdate?: (updates: any) => void;
  onRemove?: () => void;
}

/**
 * Dashboard Widget Component
 * 
 * Rendert verschiedene Widget-Typen
 */
export function DashboardWidget({
  widget,
  data,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
}: DashboardWidgetProps) {
  const renderWidget = () => {
    switch (widget.type) {
      case 'overview':
        return <OverviewWidget data={data} config={widget.config} />;
      case 'conversations':
        return <ConversationsWidget data={data} config={widget.config} />;
      case 'agents':
        return <AgentsWidget data={data} config={widget.config} />;
      case 'analytics':
        return <AnalyticsWidget data={data} config={widget.config} />;
      case 'metrics':
        return <MetricsWidget data={data} config={widget.config} />;
      case 'kb-sync':
        return <KBSyncWidget data={data} config={widget.config} />;
      default:
        return <div>Unknown widget type: {widget.type}</div>;
    }
  };

  return (
    <div
      className={`dashboard-widget ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      style={{
        gridColumn: `span ${widget.position?.w || 6}`,
        gridRow: `span ${widget.position?.h || 4}`,
      }}
    >
      {isSelected && (
        <div className="widget-controls">
          <button onClick={onRemove}>Remove</button>
        </div>
      )}
      {renderWidget()}
    </div>
  );
}

