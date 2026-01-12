/**
 * Agents API Client
 */

import { getValidAccessToken } from '../auth/token-refresh';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Agent {
  id: string;
  tenantId: string;
  name: string;
  role: string;
  roleType: string;
  tools?: string[];
  ragConfig?: Record<string, any>;
  personaConfig?: Record<string, any>;
  toolsConfig?: any[];
  policiesConfig?: Record<string, any>;
  kpiConfig?: Record<string, any>;
  characterId?: string;
  personaId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentRequest {
  name: string;
  role: string;
  roleType: string;
  tools?: string[];
  ragConfig?: Record<string, any>;
  personaConfig?: Record<string, any>;
  toolsConfig?: any[];
  policiesConfig?: Record<string, any>;
  kpiConfig?: Record<string, any>;
  characterId?: string;
  personaId?: string;
}

export interface UpdateAgentRequest extends Partial<CreateAgentRequest> {}

/**
 * Helper: Authenticated fetch mit automatischem Token-Refresh
 */
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getValidAccessToken();
  if (!token) {
    throw new Error('Nicht authentifiziert. Bitte melden Sie sich erneut an.');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    credentials: 'include', // Wichtig für Cookie-basierte Auth
  });

  // Token abgelaufen, versuche Refresh
  if (response.status === 401) {
    const refreshedToken = await getValidAccessToken();
    if (refreshedToken) {
      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshedToken}`,
          ...options.headers,
        },
        credentials: 'include', // Wichtig für Cookie-basierte Auth
      });
    }
    // Refresh fehlgeschlagen, redirect zu Login
    if (typeof window !== 'undefined') {
      window.location.href = '/de/login';
    }
    throw new Error('Session abgelaufen. Bitte melden Sie sich erneut an.');
  }

  return response;
}

/**
 * Alle Agents abrufen
 */
export async function getAgents(): Promise<Agent[]> {
  const response = await authenticatedFetch(`${API_URL}/api/admin/agents`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Fehler beim Abrufen der Agents' }));
    throw new Error(error.message || 'Fehler beim Abrufen der Agents');
  }

  return response.json();
}

/**
 * Agent erstellen
 */
export async function createAgent(data: CreateAgentRequest): Promise<Agent> {
  const response = await authenticatedFetch(`${API_URL}/api/admin/agents`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Agent-Erstellung fehlgeschlagen' }));
    throw new Error(error.message || 'Agent-Erstellung fehlgeschlagen');
  }

  return response.json();
}

/**
 * Agent aktualisieren
 */
export async function updateAgent(id: string, data: UpdateAgentRequest): Promise<Agent> {
  const response = await authenticatedFetch(`${API_URL}/api/admin/agents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Agent-Aktualisierung fehlgeschlagen' }));
    throw new Error(error.message || 'Agent-Aktualisierung fehlgeschlagen');
  }

  return response.json();
}

/**
 * Agent löschen
 */
export async function deleteAgent(id: string): Promise<void> {
  const response = await authenticatedFetch(`${API_URL}/api/admin/agents/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Agent-Löschung fehlgeschlagen' }));
    throw new Error(error.message || 'Agent-Löschung fehlgeschlagen');
  }
}

/**
 * Agent abrufen
 */
export async function getAgent(id: string): Promise<Agent> {
  const response = await authenticatedFetch(`${API_URL}/api/admin/agents/${id}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Fehler beim Abrufen des Agents' }));
    throw new Error(error.message || 'Fehler beim Abrufen des Agents');
  }

  return response.json();
}
