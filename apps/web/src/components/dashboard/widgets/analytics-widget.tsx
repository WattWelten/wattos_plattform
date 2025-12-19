'use client';

import React from 'react';

interface AnalyticsWidgetProps {
  data?: any;
  config?: any;
}

export function AnalyticsWidget({ data, config }: AnalyticsWidgetProps) {
  if (!data) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="analytics-widget">
      <h3>Analytics</h3>
      <div className="analytics-kpis">
        <div className="kpi">
          <div className="kpi-label">Completion Rate</div>
          <div className="kpi-value">
            {data.kpis?.completionRate?.toFixed(1) || 0}%
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">KB Sync Rate</div>
          <div className="kpi-value">
            {data.kpis?.kbSyncRate?.toFixed(1) || 0}%
          </div>
        </div>
      </div>
      {data.trends && (
        <div className="analytics-trends">
          <div className="trend">
            <span>Conversations: </span>
            <span className={`trend-${data.trends.conversations?.trend}`}>
              {data.trends.conversations?.trend}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

