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

// ============================================
// AVATAR APIs
// ============================================

export interface Avatar {
  id: string;
  name: string;
  glbUrl: string;
  thumbnailUrl: string | null;
  characterId: string | null;
  source: string;
  createdAt: string;
}

export async function getAvatars(tenantId: string): Promise<Avatar[]> {
  return apiRequest<Avatar[]>(`/v1/avatars/tenant/${tenantId}`);
}

export async function createAvatar(
  tenantId: string,
  imageFile: File,
  name: string,
  characterId?: string,
): Promise<Avatar> {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('tenantId', tenantId);
  formData.append('name', name);
  if (characterId) {
    formData.append('characterId', characterId);
  }

  const response = await authenticatedFetch(`${apiUrl}/api/v1/avatars/create`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      message: `HTTP ${response.status}: ${response.statusText}` 
    }));
    throw new Error(error.message || `Request failed: ${response.statusText}`);
  }

  return response.json();
}

// ============================================
// VIDEO APIs
// ============================================

export interface Video {
  id: string;
  tenantId: string;
  avatarId: string;
  agentId?: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  fileSize: number;
  format: string;
  resolution: string;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export async function uploadVideo(
  tenantId: string,
  avatarId: string,
  videoFile: Blob,
  title: string,
  metadata?: Record<string, unknown>,
): Promise<Video> {
  const formData = new FormData();
  formData.append('video', videoFile, `avatar-video-${Date.now()}.webm`);
  formData.append('tenantId', tenantId);
  formData.append('avatarId', avatarId);
  formData.append('title', title);
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  const response = await authenticatedFetch(`${apiUrl}/api/v1/videos/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      message: `HTTP ${response.status}: ${response.statusText}` 
    }));
    throw new Error(error.message || `Request failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getVideos(tenantId: string): Promise<Video[]> {
  return apiRequest<Video[]>(`/v1/videos?tenantId=${tenantId}`);
}

export async function getVideo(videoId: string, tenantId: string): Promise<Video> {
  return apiRequest<Video>(`/v1/videos/${videoId}?tenantId=${tenantId}`);
}

export async function deleteVideo(videoId: string, tenantId: string): Promise<void> {
  await apiRequest(`/v1/videos/${videoId}?tenantId=${tenantId}`, {
    method: 'DELETE',
  });
}

export async function downloadVideo(videoId: string, tenantId: string): Promise<Blob> {
  const response = await authenticatedFetch(`${apiUrl}/api/v1/videos/${videoId}/download?tenantId=${tenantId}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      message: `HTTP ${response.status}: ${response.statusText}` 
    }));
    throw new Error(error.message || `Request failed: ${response.statusText}`);
  }

  return response.blob();
}
