'use client';

import { Suspense, useEffect } from 'react';
import { AvatarScene } from './AvatarScene';
import { AvatarSceneSkeleton } from './AvatarSceneSkeleton';
import { useAvatarV2 } from '@/hooks/use-avatar-v2';
import { AvatarV2SceneConfig } from './types';

/**
 * Avatar V2 Container
 * 
 * Container-Komponente für Avatar V2 mit Backend-Integration
 */
export interface AvatarV2ContainerProps {
  agentId: string;
  text?: string;
  voiceId?: string;
  onAnimationComplete?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  enableControls?: boolean;
  enableEnvironment?: boolean;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export function AvatarV2Container({
  agentId,
  text,
  voiceId,
  onAnimationComplete,
  onError,
  className,
  enableControls = true,
  enableEnvironment = true,
  onCanvasReady,
}: AvatarV2ContainerProps) {
  const {
    sceneConfig,
    visemes,
    audioUrl,
    isLoadingConfig,
    generateAvatar,
  } = useAvatarV2(agentId);

  // Avatar generieren wenn Text vorhanden
  useEffect(() => {
    if (text && agentId) {
      generateAvatar(text, voiceId).catch((error: unknown) => {
        if (onError) {
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      });
    }
  }, [text, agentId, voiceId, generateAvatar, onError]);

  if (isLoadingConfig || !sceneConfig) {
    return <AvatarSceneSkeleton />;
  }

  return (
    <div className={className}>
      <Suspense fallback={<AvatarSceneSkeleton />}>
        <AvatarScene
          sceneConfig={sceneConfig as AvatarV2SceneConfig}
          {...(visemes !== undefined && { visemes })}
          {...(audioUrl !== undefined && { audioUrl })}
          {...(onAnimationComplete && { onAnimationComplete })}
          {...(onError && { onError })}
          enableControls={enableControls}
          enableEnvironment={enableEnvironment}
          {...(onCanvasReady && { onCanvasReady })}
        />
      </Suspense>
    </div>
  );
}
