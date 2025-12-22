export class TenantConfigDto {
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
      domain?: string[];
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


