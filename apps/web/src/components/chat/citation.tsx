'use client';

import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink } from 'lucide-react';

import { Citation as CitationType } from '@/types/chat';

interface CitationProps {
  citation: CitationType & {
    id?: string;
    documentName?: string;
    chunkIndex?: number;
    url?: string;
  };
  variant?: 'default' | 'light';
}

export function Citation({ citation, variant = 'default' }: CitationProps) {
  const isLight = variant === 'light';

  return (
    <div
      className={`rounded-md p-3 border ${
        isLight
          ? 'bg-white/10 border-white/20'
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
      } transition-colors`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText className={`w-4 h-4 ${isLight ? 'text-white' : 'text-gray-600'}`} />
            <span
              className={`text-sm font-medium truncate ${
                isLight ? 'text-white' : 'text-gray-900'
              }`}
            >
              {citation.documentName || citation.metadata?.fileName || 'Dokument'}
            </span>
            {citation.score && (
              <Badge
                variant="secondary"
                className={`text-xs ${isLight ? 'bg-white/20 text-white' : ''}`}
              >
                {Math.round(citation.score * 100)}%
              </Badge>
            )}
          </div>
          <p
            className={`text-sm line-clamp-2 ${
              isLight ? 'text-white/90' : 'text-gray-600'
            }`}
          >
            {citation.content}
          </p>
        </div>
        {citation.url && (
          <a
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-shrink-0 p-1 rounded hover:bg-opacity-20 transition-colors ${
              isLight
                ? 'text-white hover:bg-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            aria-label={`${citation.documentName} öffnen`}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
