/**
 * Artifact Card Component
 * 
 * Apple Design: Elegant artifact display with delete action
 */

'use client';

import { AppleCard, AppleButton } from '@wattweiser/ui';
import { Trash2, ExternalLink, Calendar } from 'lucide-react';
import { Artifact } from '@/lib/api';

interface ArtifactCardProps {
  artifact: Artifact;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function ArtifactCard({
  artifact,
  onDelete,
  isDeleting = false,
}: ArtifactCardProps) {
  return (
    <div className="animate-in fade-in zoom-in-95 duration-200">
      <AppleCard
        variant="outlined"
        padding="md"
        className="hover:shadow-lg transition-all duration-300"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
              {artifact.name}
            </h3>
            {(artifact as any).description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {(artifact as any).description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(artifact.createdAt).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {artifact.url && (
                <a
                  href={artifact.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="truncate max-w-[200px]">Link öffnen</span>
                </a>
              )}
            </div>
          </div>
          <AppleButton
            variant="destructive"
            size="sm"
            onClick={() => onDelete(artifact.id)}
            disabled={isDeleting}
            className="flex-shrink-0"
            aria-label={`Artefakt ${artifact.name} löschen`}
          >
            <Trash2 className="w-4 h-4" />
          </AppleButton>
        </div>
      </AppleCard>
    </div>
  );
}

