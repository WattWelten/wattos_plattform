/**
 * Conversations API Client
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Conversation {
  thread_id: string;
  role: string;
  messages?: ConversationMessage[];
}

export interface ConversationMessage {
  role: string;
  content: string;
  citations?: any[];
  created_at: string;
}

export interface CreateConversationRequest {
  role: string;
}

export interface SendMessageRequest {
  thread_id: string;
  message: string;
  search_tool_config?: {
    strategy?: 'two_stage' | 'single_stage';
    top_k?: number;
  };
}

export interface SendMessageResponse {
  thread_id: string;
  role: string;
  message: string;
  citations?: any[];
}

/**
 * Conversation erstellen
 */
export async function createConversation(
  data: CreateConversationRequest,
  token: string,
): Promise<Conversation> {
  const response = await fetch(`${API_URL}/api/v1/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Conversation-Erstellung fehlgeschlagen' }));
    throw new Error(error.message || 'Conversation-Erstellung fehlgeschlagen');
  }

  return response.json();
}

/**
 * Conversation abrufen
 */
export async function getConversation(threadId: string, token: string): Promise<Conversation> {
  const response = await fetch(`${API_URL}/api/v1/conversations/${threadId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Fehler beim Abrufen der Conversation');
  }

  return response.json();
}

/**
 * Nachricht senden
 */
export async function sendMessage(
  data: SendMessageRequest,
  token: string,
): Promise<SendMessageResponse> {
  const response = await fetch(`${API_URL}/api/v1/conversations/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Nachricht konnte nicht gesendet werden' }));
    throw new Error(error.message || 'Nachricht konnte nicht gesendet werden');
  }

  return response.json();
}

