'use client';

import { useEffect, useState } from 'react';
import { AppleCard } from '@wattweiser/ui';
import { type ConversationMessage, getConversationMessages } from '@/lib/api';
import { Loading } from './loading';
import { MessageCircle, User, Bot, Clock } from 'lucide-react';

interface ConversationReplayProps {
  conversationId: string;
  tenantId: string;
}

export function ConversationReplay({
  conversationId,
  tenantId,
}: ConversationReplayProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId || !tenantId) return;

    setIsLoading(true);
    setError(null);

    // getConversationMessages API call implementiert
    getConversationMessages(conversationId, tenantId)
      .then((data: ConversationMessage[]) => {
        setMessages(data);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message || 'Failed to load conversation messages');
        setIsLoading(false);
      });
  }, [conversationId, tenantId]);

  if (isLoading) {
    return (
      <AppleCard padding="lg">
        <Loading text="Lädt Gespräch..." />
      </AppleCard>
    );
  }

  if (error) {
    return (
      <AppleCard padding="lg">
        <div className="p-4 bg-error-50 border border-error-200 rounded-lg text-error-700" role="alert">
          {error}
        </div>
      </AppleCard>
    );
  }

  if (messages.length === 0) {
    return (
      <AppleCard padding="lg">
        <div className="text-center py-8 text-gray-400">
          Keine Nachrichten gefunden
        </div>
      </AppleCard>
    );
  }

  return (
    <AppleCard padding="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="h-5 w-5 text-gray-600" aria-hidden="true" />
          <h2 className="text-xl font-semibold">Conversation Replay</h2>
        </div>

        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex gap-4 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-primary-50 text-primary-900'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 ${
                      message.role === 'user' ? 'order-2' : 'order-1'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Bot className="h-5 w-5" aria-hidden="true" />
                    )}
                  </div>
                  <div
                    className={`flex-1 ${message.role === 'user' ? 'order-1' : 'order-2'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">
                        {message.role === 'user' ? 'Benutzer' : 'Kaya'}
                      </span>
                      {message.timestamp && (
                        <time
                          dateTime={message.timestamp}
                          className="text-xs text-gray-500 flex items-center gap-1"
                        >
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {new Date(message.timestamp).toLocaleTimeString('de-DE')}
                        </time>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.latencyMs && (
                      <div className="mt-2 text-xs text-gray-500">
                        Latenz: {message.latencyMs}ms
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppleCard>
  );
}



