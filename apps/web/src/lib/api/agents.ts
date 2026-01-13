/**
 * Agents API Client
 */

import { authenticatedFetch } from './authenticated-fetch';

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
