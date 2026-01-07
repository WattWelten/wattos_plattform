/**
 * Avatar Chat Layout Component
 * 
 * 9:16 Layout: Avatar oben, Chat unten mit CSS-Mask-Fade
 * DPR Desktop ≤2.0, Mobile ≤1.5
 */

'use client';

import { ReactNode } from 'react';
import { AvatarScene } from '@/components/avatar';
import { AvatarV2SceneConfig } from '@/components/avatar/types';

interface AvatarChatLayoutProps {
  avatarConfig: AvatarV2SceneConfig;
  visemes?: Array<{ viseme: string; timestamp: number; weight: number }> | number[];
  audioUrl?: string;
  children: ReactNode; // Chat-Komponenten
  className?: string;
}

export function AvatarChatLayout({
  avatarConfig,
  visemes,
  audioUrl,
  children,
  className = '',
}: AvatarChatLayoutProps) {
  return (
    <div
      className={`flex flex-col h-screen w-full overflow-hidden ${className}`}
      role="main"
      aria-label="Avatar Chat Interface"
    >
      {/* Avatar Section (oben) - 9:16 Aspect Ratio */}
      <div
        className="relative w-full"
        style={{
          aspectRatio: '9/16',
          maxHeight: '56.25vh', // 9/16 = 56.25%
        }}
        role="region"
        aria-label="Avatar Anzeige"
      >
        {/* CSS-Mask-Fade: Sanfter Übergang zum Chat */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            maskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
          }}
          aria-hidden="true"
        />
        
        {/* Avatar Scene */}
        <div className="w-full h-full">
          <AvatarScene
            sceneConfig={avatarConfig}
            {...(Array.isArray(visemes) && visemes.length > 0 && typeof visemes[0] === 'number'
              ? { visemes: visemes as number[] }
              : {})}
            {...(audioUrl !== undefined && { audioUrl })}
            enableControls={false}
            enableEnvironment={true}
          />
        </div>
      </div>

      {/* Chat Section (unten) */}
      <div
        className="flex-1 flex flex-col min-h-0 overflow-hidden"
        role="region"
        aria-label="Chat Bereich"
      >
        {/* CSS-Mask-Fade: Sanfter Übergang vom Avatar */}
        <div
          className="absolute top-0 left-0 right-0 h-8 pointer-events-none z-10"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)',
            background: 'linear-gradient(to bottom, rgba(249, 250, 251, 0) 0%, rgba(249, 250, 251, 1) 100%)',
          }}
          aria-hidden="true"
        />
        
        {children}
      </div>
    </div>
  );
}

