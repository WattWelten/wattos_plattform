'use client';

import React from 'react';

interface KBSyncWidgetProps {
  data?: any;
  config?: any;
}

export function KBSyncWidget({ data, config }: KBSyncWidgetProps) {
  if (!data) {
    return <div>Loading KB sync...</div>;
  }

  return (
    <div className="kb-sync-widget">
      <h3>KB Sync Status</h3>
      <div className="kb-sync-stats">
        <div className="stat">
          <div className="stat-value">{data.total || 0}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat">
          <div className="stat-value">{data.synced || 0}</div>
          <div className="stat-label">Synced</div>
        </div>
        <div className="stat">
          <div className="stat-value">{data.pending || 0}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat">
          <div className="stat-value">{data.error || 0}</div>
          <div className="stat-label">Error</div>
        </div>
      </div>
      <div className="kb-sync-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${data.syncRate || 0}%` }}
          />
        </div>
        <div className="progress-label">
          {data.syncRate?.toFixed(1) || 0}% synced
        </div>
      </div>
    </div>
  );
}


