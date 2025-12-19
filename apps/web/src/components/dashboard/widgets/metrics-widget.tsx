'use client';

import React from 'react';

interface MetricsWidgetProps {
  data?: any;
  config?: any;
}

export function MetricsWidget({ data, config }: MetricsWidgetProps) {
  if (!data) {
    return <div>Loading metrics...</div>;
  }

  return (
    <div className="metrics-widget">
      <h3>Metrics</h3>
      <div className="metrics-list">
        {data.metrics?.system && (
          <div className="metric-group">
            <h4>System</h4>
            <div className="metric-item">
              CPU: {data.metrics.system.cpu || 0}%
            </div>
            <div className="metric-item">
              Memory: {data.metrics.system.memory || 0}%
            </div>
          </div>
        )}
        {data.metrics?.business && (
          <div className="metric-group">
            <h4>Business</h4>
            <div className="metric-item">
              Conversations: {data.metrics.business.conversations || 0}
            </div>
            <div className="metric-item">
              Agents: {data.metrics.business.agents || 0}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

