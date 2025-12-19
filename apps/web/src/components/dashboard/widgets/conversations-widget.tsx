'use client';

import React from 'react';

interface ConversationsWidgetProps {
  data?: any;
  config?: any;
}

export function ConversationsWidget({ data, config }: ConversationsWidgetProps) {
  if (!data) {
    return <div>Loading conversations...</div>;
  }

  return (
    <div className="conversations-widget">
      <h3>Recent Conversations</h3>
      <div className="conversations-list">
        {data.conversations?.slice(0, config?.limit || 10).map((conv: any) => (
          <div key={conv.id} className="conversation-item">
            <div className="conversation-date">
              {new Date(conv.createdAt).toLocaleDateString()}
            </div>
            <div className="conversation-messages">{conv.messageCount} messages</div>
          </div>
        ))}
      </div>
    </div>
  );
}

