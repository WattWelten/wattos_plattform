/**
 * Kaya Response Format
 * Struktur für Antworten
 */

export interface KayaResponse {
  answer: string;
  sources: Array<{
    url: string;
    title: string;
    date?: string;
  }>;
  steps?: string[];
  escalation?: {
    phone?: string;
    email?: string;
  };
}

export function formatKayaResponse(
  answer: string,
  sources: Array<{ url: string; title: string; date?: string }>,
  steps?: string[],
  escalation?: { phone?: string; email?: string },
): KayaResponse {
  return {
    answer,
    sources,
    steps,
    escalation,
  };
}

