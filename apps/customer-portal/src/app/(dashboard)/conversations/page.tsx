'use client';

import { useEffect, useState } from 'react';
import { AppleCard, AppleButton } from '@wattweiser/ui';
import { getConversations, type Conversation } from '@/lib/api';
import { useAuthContext } from '@/contexts/auth-context';
import { useSSE } from '@/hooks/use-sse';
import { ConversationsTable } from '@/components/conversations-table';
import { ConversationReplay } from '@/components/conversation-replay';

export default function ConversationsPage() {
  const { tenantId } = useAuthContext();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    if (!tenantId) return;
    
    setIsLoading(true);
    setError(null);
    getConversations(tenantId)
      .then(setConversations)
      .catch((err) => {
        console.error('Failed to load conversations:', err);
        setError(err.message || 'Fehler beim Laden der Gespräche');
      })
      .finally(() => setIsLoading(false));
  }, [tenantId]);

  // SSE for live updates (polling-based via SSE endpoint)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const sseUrl = tenantId 
    ? `${apiUrl}/api/admin/conversations/stream` 
    : null;

  useSSE(sseUrl, {
    onMessage: (data) => {
      if (data.type === 'conversations' && Array.isArray(data.data)) {
        setConversations(data.data);
      }
    },
    onError: (err) => {
      console.error('SSE error:', err);
    },
  });

  const exportCSV = () => {
    const csv = [
      ['ID', 'Session ID', 'Gestartet', 'Nachrichten', 'Score'].join(','),
      ...conversations.map((c) =>
        [
          c.id,
          c.sessionId,
          c.startedAt,
          c.messageCount,
          c.score || '',
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversations-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Conversations</h1>
        <p className="text-gray-600 mt-2">Live-Gespräche und Replay</p>
      </div>

      <AppleCard padding="lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Gespräche</h2>
            <AppleButton 
              variant="outline" 
              onClick={exportCSV}
              aria-label="Gespräche als CSV exportieren"
            >
              Export CSV
            </AppleButton>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-error-50 border border-error-200 rounded-lg text-error-700" role="alert">
              {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="text-gray-400 text-center py-12" aria-label="Lädt Gespräche...">
              Lädt Gespräche...
            </div>
          ) : (
            <ConversationsTable
              data={conversations}
              onSelectConversation={setSelectedConversation}
            />
          )}
        </div>
      </AppleCard>

      {selectedConversation && tenantId && (
        <ConversationReplay
          conversationId={selectedConversation}
          tenantId={tenantId}
        />
      )}
    </div>
  );
}

