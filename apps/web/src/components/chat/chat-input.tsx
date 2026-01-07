'use client';

import { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2" role="form" aria-label="Nachrichteneingabe">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Nachricht eingeben..."
        className="flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
        rows={1}
        disabled={disabled}
        aria-label="Nachrichteneingabe"
        aria-describedby="chat-input-help"
        aria-required="true"
      />
      <span id="chat-input-help" className="sr-only">
        Drücken Sie Enter zum Senden, Shift+Enter für neue Zeile
      </span>
      <Button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        aria-label="Nachricht senden"
      >
        <Send className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only">Senden</span>
      </Button>
    </div>
  );
}


