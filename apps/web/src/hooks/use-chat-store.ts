import { create } from 'zustand';
import { ChatMessage, Citation } from '@/types/chat';

interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: Date;
}

interface ChatStore {
  currentChatId: string | null;
  messages: ChatMessage[];
  chatHistory: ChatHistory[];
  streamingMessageId: string | null;
  setCurrentChatId: (chatId: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  updateStreamingMessage: (content: string) => void;
  finalizeStreamingMessage: (citations?: Citation[]) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  addChatHistory: (chat: ChatHistory) => void;
  setChatHistory: (history: ChatHistory[]) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  currentChatId: null,
  messages: [],
  chatHistory: [],
  streamingMessageId: null,
  setCurrentChatId: (chatId) => set({ currentChatId: chatId }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  updateStreamingMessage: (content) =>
    set((state) => {
      if (state.streamingMessageId) {
        const updatedMessages = state.messages.map((msg) =>
          msg.id === state.streamingMessageId
            ? { ...msg, content: msg.content + content }
            : msg,
        );
        return { messages: updatedMessages };
      } else {
        // Neue Streaming-Nachricht erstellen
        const newMessage: ChatMessage = {
          id: `stream_${Date.now()}`,
          role: 'assistant',
          content,
          createdAt: new Date(),
        };
        return {
          messages: [...state.messages, newMessage],
          streamingMessageId: newMessage.id,
        };
      }
    }),
  finalizeStreamingMessage: (citations) =>
    set((state) => {
      if (state.streamingMessageId) {
        const updatedMessages = state.messages.map((msg) => {
          if (msg.id === state.streamingMessageId) {
            const updated: ChatMessage = {
              ...msg,
              isStreaming: false,
            };
            if (citations !== undefined) {
              updated.citations = citations;
            }
            return updated;
          }
          return msg;
        });
        return { messages: updatedMessages, streamingMessageId: null };
      }
      return { streamingMessageId: null };
    }),
  setMessages: (messages) => set({ messages }),
  clearMessages: () => set({ messages: [], streamingMessageId: null }),
  addChatHistory: (chat) =>
    set((state) => ({
      chatHistory: [chat, ...state.chatHistory.filter((c) => c.id !== chat.id)],
    })),
  setChatHistory: (history) => set({ chatHistory: history }),
}));

