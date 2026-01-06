import { authenticatedFetch } from './auth';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper für API-Calls mit Error-Handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const response = await authenticatedFetch(`${apiUrl}/api${endpoint}`, options);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: `HTTP ${response.status}: ${response.statusText}` 
      }));
      throw new Error(error.message || `Request failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    if (error.message === 'Nicht authentifiziert') {
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    throw error;
  }
}

export interface OverviewMetrics {
  sessionsPerDay: number;
  fcr: number;
  p95Latency: number;
  contentFreshness: number;
  ragMetrics?: {
    totalSearches: number;
    avgScore: number;
    topQueries: Array<{ query: string; count: number }>;
  };
}

export async function getOverviewMetrics(
  tenantId: string,
): Promise<OverviewMetrics> {
  return apiRequest<OverviewMetrics>(`/admin/metrics?tenantId=${tenantId}`);
}

export interface Conversation {
  id: string;
  sessionId: string;
  startedAt: string;
  messageCount: number;
  score?: number;
}

export async function getConversations(
  tenantId: string,
  limit?: number,
  offset?: number,
): Promise<Conversation[]> {
  const params = new URLSearchParams({ tenantId });
  if (limit) params.append('limit', limit.toString());
  if (offset) params.append('offset', offset.toString());
  return apiRequest<Conversation[]>(`/admin/conversations?${params}`);
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  latencyMs?: number;
}

export async function getConversationMessages(
  conversationId: string,
  tenantId: string,
): Promise<ConversationMessage[]> {
  return apiRequest<ConversationMessage[]>(
    `/admin/conversations/${conversationId}/messages?tenantId=${tenantId}`,
  );
}

export interface Source {
  id: string;
  url: string;
  type: string;
  enabled: boolean;
}

export async function getSources(tenantId: string): Promise<Source[]> {
  return apiRequest<Source[]>(`/admin/sources?tenantId=${tenantId}`);
}

export interface Crawl {
  id: string;
  startedAt: string;
  finishedAt?: string;
  pages: number;
  delta: number;
  status: string;
}

export async function getCrawls(tenantId: string): Promise<Crawl[]> {
  return apiRequest<Crawl[]>(`/admin/crawls?tenantId=${tenantId}`);
}

export async function triggerCrawl(_tenantId: string, url: string): Promise<void> {
  await apiRequest(`/admin/crawls/trigger`, {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

export interface Artifact {
  id: string;
  name: string;
  url: string;
  hash?: string;
  createdAt: string;
}

export async function getArtifacts(tenantId: string): Promise<Artifact[]> {
  return apiRequest<Artifact[]>(`/admin/artifacts?tenantId=${tenantId}`);
}

export async function deleteArtifact(artifactId: string): Promise<void> {
  await apiRequest(`/admin/artifacts/${artifactId}`, {
    method: 'DELETE',
  });
}

export interface TenantConfig {
  tenant_id: string;
  character: string;
  locales: string[];
  sources: {
    allow_domains: string[];
    patterns: string[];
  };
  crawler: {
    schedule_cron: string;
    delta_etag: boolean;
    max_pages: number;
  };
  retrieval: {
    two_stage: boolean;
    top_k: number;
    filters: {
      domain: string[];
    };
  };
  skills: string[];
  answer_policy: {
    style: string;
    show_sources: boolean;
    show_date: boolean;
    max_tokens: number;
  };
  tts: {
    voice: string;
    visemes: boolean;
    rate: number;
    pitch: number;
  };
  escalation: {
    phone?: string;
    email?: string;
  };
}

export async function getTenantConfig(tenantId: string): Promise<TenantConfig> {
  return apiRequest<TenantConfig>(`/admin/tenants/${tenantId}/config`);
}

export async function updateTenantConfig(
  tenantId: string,
  config: TenantConfig,
): Promise<void> {
  await apiRequest(`/admin/tenants/${tenantId}/config`, {
    method: 'PUT',
    body: JSON.stringify(config),
  });
}

export interface VisemeEvent {
  viseme: 'MBP' | 'FV' | 'TH' | 'AA';
  timestamp: number;
}

export async function getVisemeEvents(
  tenantId: string,
  conversationId?: string,
): Promise<VisemeEvent[]> {
  const params = new URLSearchParams({ tenantId });
  if (conversationId) params.append('conversationId', conversationId);
  return apiRequest<VisemeEvent[]>(`/admin/events?${params}&type=viseme`);
}
