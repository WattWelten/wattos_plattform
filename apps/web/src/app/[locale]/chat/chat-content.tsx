'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/components/chat/chat-message';
import { ChatInput } from '@/components/chat/chat-input';
import { LazyChatSidebar as ChatSidebar, LazyCommandPalette as CommandPalette } from '@/components/lazy-loading';
import { LLMSwitcher } from '@/components/chat/llm-switcher';
import { EmptyState } from '@/components/ui/empty-state';
import { MessageSquare } from 'lucide-react';
import { useChatStore } from '@/hooks/use-chat-store';
import { io, Socket } from 'socket.io-client';

export default function ChatPageContent() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [currentModel, setCurrentModel] = useState('gpt-4');
  const [currentProvider, setCurrentProvider] = useState('openai');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    addMessage,
    updateStreamingMessage,
    finalizeStreamingMessage,
    currentChatId,
    setCurrentChatId,
    addChatHistory,
  } = useChatStore();

  useEffect(() => {
    // WebSocket-Verbindung aufbauen
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3006/chat', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket');
    });

    newSocket.on('message_response', (data: any) => {
      finalizeStreamingMessage(data.citations);
      addChatHistory({
        id: currentChatId || 'new',
        title: data.content.substring(0, 50) + '...',
        lastMessage: data.content,
        updatedAt: new Date(),
      });
    });

    newSocket.on('stream_chunk', (data: any) => {
      // Streaming-Chunk verarbeiten
      if (data.content) {
        updateStreamingMessage(data.content);
      }
    });

    newSocket.on('stream_end', (data: any) => {
      finalizeStreamingMessage(data.citations);
    });

    newSocket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    // Chat beitreten, wenn Chat-ID vorhanden
    if (socket && currentChatId) {
      socket.emit('join_chat', { chatId: currentChatId });
    }
  }, [socket, currentChatId]);

  useEffect(() => {
    // Scroll zu letzter Nachricht
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Command Palette mit Cmd+K öffnen
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSendMessage = async (message: string) => {
    if (!socket) return;

    // Neue Chat-ID erstellen, falls nicht vorhanden
    const chatId = currentChatId || `chat_${Date.now()}`;
    if (!currentChatId) {
      setCurrentChatId(chatId);
    }

    // User-Nachricht hinzufügen
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: message,
      createdAt: new Date(),
    });

    // Nachricht über WebSocket senden
    socket.emit('message', {
      chatId,
      message,
      model: currentModel,
      provider: currentProvider,
    });
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      {showSidebar && (
        <ChatSidebar
          onClose={() => setShowSidebar(false)}
          onSelectChat={(chatId) => setCurrentChatId(chatId)}
        />
      )}

      {/* Main Chat Area with 9:16 Layout */}
      <div className="flex-1 flex flex-col">
        {/* Avatar Section (oben) - 9:16 Aspect Ratio */}
        <div
          className="relative w-full"
          style={{
            aspectRatio: '9/16',
            maxHeight: '56.25vh', // 9/16 = 56.25%
          }}
          role="region"
          aria-label="Avatar Anzeige"
        >
          {/* CSS-Mask-Fade: Sanfter Übergang zum Chat */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              maskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
            }}
            aria-hidden="true"
          />
          
          {/* Avatar Scene Placeholder */}
          <div className="w-full h-full bg-gradient-to-b from-blue-50 to-gray-50 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <MessageSquare className="w-16 h-16 mx-auto mb-2" />
              <p className="text-sm">Avatar wird geladen...</p>
            </div>
          </div>
        </div>

        {/* Chat Section (unten) */}
        <div
          className="flex-1 flex flex-col min-h-0 overflow-hidden relative"
          role="region"
          aria-label="Chat Bereich"
        >
          {/* CSS-Mask-Fade: Sanfter Übergang vom Avatar */}
          <div
            className="absolute top-0 left-0 right-0 h-8 pointer-events-none z-10"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)',
              background: 'linear-gradient(to bottom, rgba(249, 250, 251, 0) 0%, rgba(249, 250, 251, 1) 100%)',
            }}
            aria-hidden="true"
          />
          
          {/* Header */}
        <header className="border-b p-4 bg-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {!showSidebar && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSidebar(true)}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              )}
              <h1 className="text-2xl font-bold">Chat</h1>
            </div>
            <div className="flex items-center gap-4">
              <LLMSwitcher
                currentModel={currentModel}
                currentProvider={currentProvider}
                onModelChange={(model, provider) => {
                  setCurrentModel(model);
                  setCurrentProvider(provider);
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCommandPalette(true)}
                className="text-sm"
                aria-label="Befehls-Palette öffnen"
              >
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                  ⌘K
                </kbd>
              </Button>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-success-500' : 'bg-error-500'
                  }`}
                  aria-label={isConnected ? 'Verbunden' : 'Nicht verbunden'}
                />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Verbunden' : 'Nicht verbunden'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Keine Nachrichten"
              description="Starten Sie eine Unterhaltung, indem Sie eine Nachricht eingeben."
            />
          ) : (
            messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

          {/* Input */}
          <div className="border-t p-4 bg-white">
            <ChatInput onSend={handleSendMessage} disabled={!isConnected} />
          </div>
        </div>
      </div>

      {/* Command Palette */}
      {showCommandPalette && (
        <CommandPalette onClose={() => setShowCommandPalette(false)} />
      )}
    </div>
  );
}

