/**
 * Knowledge Spaces API Client
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface KnowledgeSpace {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeSpaceRequest {
  name: string;
  description?: string;
  settings?: Record<string, any>;
}

/**
 * Knowledge Space erstellen
 */
export async function createKnowledgeSpace(
  data: CreateKnowledgeSpaceRequest,
  token: string,
): Promise<KnowledgeSpace> {
  const response = await fetch(`${API_URL}/api/admin/knowledge-spaces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Knowledge Space-Erstellung fehlgeschlagen' }));
    throw new Error(error.message || 'Knowledge Space-Erstellung fehlgeschlagen');
  }

  return response.json();
}














