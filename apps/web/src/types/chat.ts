export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  createdAt: Date;
  isStreaming?: boolean;
}

export interface Citation {
  documentId?: string;
  chunkId: string;
  content: string;
  score?: number;
  metadata?: Record<string, any>;
}

export interface Chat {
  id: string;
  userId: string;
  tenantId: string;
  title?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

