'use client';

import React from 'react';

interface AgentsWidgetProps {
  data?: any;
  config?: any;
}

export function AgentsWidget({ data, config }: AgentsWidgetProps) {
  if (!data) {
    return <div>Loading agents...</div>;
  }

  return (
    <div className="agents-widget">
      <h3>Agents</h3>
      <div className="agents-stats">
        <div className="stat">
          <div className="stat-value">{data.total || 0}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat">
          <div className="stat-value">{data.active || 0}</div>
          <div className="stat-label">Active</div>
        </div>
      </div>
      <div className="agents-list">
        {data.agents?.slice(0, 5).map((agent: any) => (
          <div key={agent.id} className="agent-item">
            <div className="agent-name">{agent.name}</div>
            <div className={`agent-status ${agent.status}`}>{agent.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


