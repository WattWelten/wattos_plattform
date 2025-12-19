'use client';

import React from 'react';

interface OverviewWidgetProps {
  data?: any;
  config?: any;
}

export function OverviewWidget({ data, config }: OverviewWidgetProps) {
  if (!data) {
    return <div>Loading overview...</div>;
  }

  return (
    <div className="overview-widget">
      <h3>Overview</h3>
      <div className="overview-stats">
        <div className="stat">
          <div className="stat-value">{data.conversations || 0}</div>
          <div className="stat-label">Conversations</div>
        </div>
        <div className="stat">
          <div className="stat-value">{data.agents || 0}</div>
          <div className="stat-label">Agents</div>
        </div>
        <div className="stat">
          <div className="stat-value">{data.kbArticles || 0}</div>
          <div className="stat-label">KB Articles</div>
        </div>
        <div className="stat">
          <div className="stat-value">
            {data.kbSyncStatus?.syncRate?.toFixed(1) || 0}%
          </div>
          <div className="stat-label">KB Sync Rate</div>
        </div>
      </div>
    </div>
  );
}


