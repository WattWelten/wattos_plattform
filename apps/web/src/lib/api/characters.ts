/**
 * Character API Client
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Character {
  id: string;
  role: string;
  agent: string;
  voice_id?: string;
  voice_model?: string;
  system_prompt?: string;
  custom_parameters?: Record<string, any>;
  knowledge_base?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateCharacterRequest {
  role: string;
  agent?: string;
  voice_id?: string;
  voice_model?: string;
  system_prompt?: string;
  custom_parameters?: Record<string, any>;
  knowledge_base?: Record<string, any>;
}

/**
 * Character erstellen
 */
export async function createCharacter(
  data: CreateCharacterRequest,
  token: string,
): Promise<Character> {
  const response = await fetch(`${API_URL}/api/v1/characters`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Character-Erstellung fehlgeschlagen' }));
    throw new Error(error.message || 'Character-Erstellung fehlgeschlagen');
  }

  return response.json();
}

/**
 * Alle Characters abrufen
 */
export async function listCharacters(token: string): Promise<Character[]> {
  const response = await fetch(`${API_URL}/api/v1/characters`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Fehler beim Abrufen der Characters');
  }

  return response.json();
}

/**
 * Character nach role abrufen
 */
export async function getCharacterByRole(role: string, token: string): Promise<Character> {
  const response = await fetch(`${API_URL}/api/v1/characters/${encodeURIComponent(role)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Character mit role "${role}" nicht gefunden`);
  }

  return response.json();
}

