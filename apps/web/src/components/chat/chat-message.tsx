'use client';

import { ChatMessage as ChatMessageType } from '@/types/chat';
import { Citation } from '@/components/chat/citation';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isStreaming = (message as any).isStreaming !== false;

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      role="article"
      aria-label={`Nachricht von ${isUser ? 'Benutzer' : 'Assistent'}`}
      aria-live={isStreaming ? 'polite' : 'off'}
      aria-atomic="true"
    >
      <div
        className={`max-w-3xl rounded-lg p-4 shadow-sm ${
          isUser
            ? 'bg-primary-500 text-white'
            : 'bg-white border border-gray-200 text-gray-900'
        }`}
      >
        {/* Content with streaming indicator */}
        <div className="whitespace-pre-wrap break-words">
          {message.content}
          {isStreaming && (
            <span
              className="inline-block w-2 h-4 ml-1 bg-current animate-pulse"
              aria-label="Wird geschrieben..."
            />
          )}
        </div>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div
            className={`mt-4 pt-4 ${
              isUser ? 'border-t border-white/20' : 'border-t border-gray-200'
            }`}
          >
            <div
              className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
                isUser ? 'text-white' : 'text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              Quellen ({message.citations.length})
            </div>
            <div className="space-y-2">
              {message.citations.map((citation, index) => (
                <Citation
                  key={index}
                  citation={citation}
                  variant={isUser ? 'light' : 'default'}
                />
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div
          className={`text-xs mt-3 ${
            isUser ? 'text-white/70' : 'text-gray-500'
          }`}
        >
          {format(new Date(message.createdAt), 'HH:mm', { locale: de })}
        </div>
      </div>
    </div>
  );
}

