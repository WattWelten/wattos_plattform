'use client';

import { useState, useEffect, useCallback } from 'react';
import { AvatarV2SceneConfig } from '@/components/avatar/types';

interface UseAvatarV2Return {
  sceneConfig: AvatarV2SceneConfig | null;
  visemes: number[] | undefined;
  audioUrl: string | undefined;
  isPlaying: boolean;
  isLoadingConfig: boolean;
  generateAvatar: (text: string, voiceId?: string) => Promise<void>;
}

/**
 * Avatar V2 Hook
 * 
 * Hook für Avatar-Konfiguration und -Generierung
 */
export function useAvatarV2(agentId: string): UseAvatarV2Return {
  const [sceneConfig, setSceneConfig] = useState<AvatarV2SceneConfig | null>(null);
  const [visemes, setVisemes] = useState<number[] | undefined>(undefined);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Konfiguration laden
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const disableAuth = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        // MVP-Mode: Kein Token nötig (Gateway setzt Mock-User)
        if (!disableAuth) {
          const { getValidAccessToken } = await import('@/lib/auth/token-refresh');
          const token = await getValidAccessToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        }
        
        const response = await fetch(`/api/v1/agents/${agentId}/avatar-config`, {
          method: 'GET',
          headers,
          credentials: 'include',
        });
        if (response.ok) {
          const config = await response.json();
          setSceneConfig(config);
        } else {
          // Fallback-Konfiguration
          setSceneConfig({
            agentId,
            model: {
              type: 'primitive',
              fallback: 'box',
            },
            scene: {
              camera: {
                position: [0, 1.6, 3],
                target: [0, 0, 0],
                fov: 50,
              },
              lights: [
                { type: 'ambient', intensity: 0.5 },
                { type: 'directional', position: [1, 1, 1], intensity: 0.8 },
              ],
            },
            avatar: {
              position: [0, 0, 0],
              scale: [1, 1, 1],
              rotation: [0, 0, 0],
            },
          });
        }
      } catch (error) {
        console.error('Failed to load avatar config:', error);
        // Fallback-Konfiguration bei Fehler
        setSceneConfig({
          agentId,
          model: {
            type: 'primitive',
            fallback: 'box',
          },
          scene: {
            camera: {
              position: [0, 1.6, 3],
              target: [0, 0, 0],
              fov: 50,
            },
            lights: [
              { type: 'ambient', intensity: 0.5 },
              { type: 'directional', position: [1, 1, 1], intensity: 0.8 },
            ],
          },
          avatar: {
            position: [0, 0, 0],
            scale: [1, 1, 1],
            rotation: [0, 0, 0],
          },
        });
      } finally {
        setIsLoadingConfig(false);
      }
    };

    if (agentId) {
      loadConfig();
    }
  }, [agentId]);

  const generateAvatar = useCallback(async (text: string, voiceId?: string) => {
    setIsPlaying(true);
    try {
      const disableAuth = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // MVP-Mode: Kein Token nötig (Gateway setzt Mock-User)
      if (!disableAuth) {
        const { getValidAccessToken } = await import('@/lib/auth/token-refresh');
        const token = await getValidAccessToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      
      const response = await fetch(`/api/v1/agents/${agentId}/generate-avatar`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ text, voiceId }),
      });

      if (response.ok) {
        const data = await response.json();
        setVisemes(data.visemes);
        setAudioUrl(data.audioUrl);
      } else {
        throw new Error('Failed to generate avatar');
      }
    } catch (error) {
      console.error('Failed to generate avatar:', error);
      throw error;
    } finally {
      setIsPlaying(false);
    }
  }, [agentId]);

  return {
    sceneConfig,
    visemes,
    audioUrl,
    isPlaying,
    isLoadingConfig,
    generateAvatar,
  };
}


