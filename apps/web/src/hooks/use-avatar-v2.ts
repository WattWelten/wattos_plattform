'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AvatarV2SceneConfig } from '@/components/avatar/types';

/**
 * Avatar V2 Hook
 * 
 * Hook für Avatar V2 Integration mit Backend
 */
export function useAvatarV2(agentId: string | undefined) {
  const [visemes, setVisemes] = useState<number[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);

  // Scene Config abrufen
  const { data: sceneConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['avatar-v2', 'scene-config', agentId],
    queryFn: async () => {
      if (!agentId) {
        return null;
      }

      const response = await axios.get(
        `/api/v1/avatar/v2/scene-config/${agentId}`,
      );

      return response.data as AvatarV2SceneConfig;
    },
    enabled: !!agentId,
  });

  // Avatar generieren
  const generateAvatar = useCallback(
    async (text: string, voiceId?: string) => {
      if (!agentId) {
        throw new Error('Agent ID is required');
      }

      setIsPlaying(true);

      try {
        const response = await axios.post(`/api/v1/avatar/v2/generate`, {
          agentId,
          text,
          voiceId,
          generateVisemes: true,
        });

        setAudioUrl(response.data.audioUrl);
        setVisemes(response.data.visemes || []);

        return response.data;
      } catch (error) {
        console.error('Failed to generate avatar:', error);
        throw error;
      } finally {
        setIsPlaying(false);
      }
    },
    [agentId],
  );

  // Animation starten
  const startAnimation = useCallback(
    async (animationType: string, options?: { duration?: number; loop?: boolean }) => {
      if (!agentId) {
        return;
      }

      try {
        await axios.post(`/api/v1/avatar/v2/animation/start`, {
          agentId,
          animationType,
          ...options,
        });
      } catch (error) {
        console.error('Failed to start animation:', error);
      }
    },
    [agentId],
  );

  // Animation stoppen
  const stopAnimation = useCallback(async () => {
    if (!agentId) {
      return;
    }

    try {
      await axios.post(`/api/v1/avatar/v2/animation/stop`, {
        agentId,
      });
    } catch (error) {
      console.error('Failed to stop animation:', error);
    }
  }, [agentId]);

  return {
    sceneConfig,
    visemes,
    audioUrl,
    isPlaying,
    isLoadingConfig,
    generateAvatar,
    startAnimation,
    stopAnimation,
  };
}

