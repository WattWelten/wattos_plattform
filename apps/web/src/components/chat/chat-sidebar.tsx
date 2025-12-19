'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarHeader, SidebarItem } from '@/components/ui/sidebar';
import { useChatStore } from '@/hooks/use-chat-store';
import { MessageSquare, Plus, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ChatSidebarProps {
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
}

export function ChatSidebar({ onClose, onSelectChat }: ChatSidebarProps) {
  const { chatHistory, currentChatId, setCurrentChatId, clearMessages, setChatHistory } = useChatStore();
  const [hoveredChat, setHoveredChat] = useState<string | null>(null);

  const handleNewChat = () => {
    setCurrentChatId(null);
    clearMessages();
    onSelectChat('');
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    onSelectChat(chatId);
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatHistory(chatHistory.filter((chat) => chat.id !== chatId));
    if (currentChatId === chatId) {
      handleNewChat();
    }
  };

  return (
    <Sidebar className="w-64 border-r">
      <SidebarHeader>
        <div className="flex items-center justify-between w-full">
          <h2 className="text-lg font-semibold">Chat-Verlauf</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
              className="h-8 w-8 p-0"
              aria-label="Neuer Chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              aria-label="Sidebar schließen"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="space-y-1">
          {chatHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>Keine Chats vorhanden</p>
              <p className="text-xs mt-1">Erstellen Sie einen neuen Chat</p>
            </div>
          ) : (
            chatHistory.map((chat) => (
              <div
                key={chat.id}
                className="relative group"
                onMouseEnter={() => setHoveredChat(chat.id)}
                onMouseLeave={() => setHoveredChat(null)}
              >
                <SidebarItem
                  active={currentChatId === chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className="pr-10"
                >
                  <div className="flex flex-col gap-1 w-full">
                    <div className="font-medium text-sm truncate">{chat.title}</div>
                    <div className="text-xs text-gray-500 truncate">{chat.lastMessage}</div>
                    <div className="text-xs text-gray-400">
                      {format(new Date(chat.updatedAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </div>
                  </div>
                </SidebarItem>
                {hoveredChat === chat.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Chat löschen"
                  >
                    <Trash2 className="h-3 w-3 text-error-500" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
