'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

interface VisemeData {
  timestamp: number;
  viseme: string;
  intensity: number;
}

interface LipSyncProps {
  audioUrl?: string;
  visemes?: VisemeData[];
  morphTargets?: Record<string, number>;
  isPlaying?: boolean;
  onVisemeUpdate?: (viseme: string, intensity: number) => void;
}

/**
 * Lip Sync Hook
 * 
 * Synchronisiert Avatar-Lippenbewegungen mit Audio/Visemes
 */
export function useLipSync({
  audioUrl,
  visemes = [],
  morphTargets,
  isPlaying = false,
  onVisemeUpdate,
}: LipSyncProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentVisemeRef = useRef<VisemeData | null>(null);

  // Audio Setup
  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  // Viseme Animation Loop
  useFrame(() => {
    if (!isPlaying || visemes.length === 0) return;

    const currentTime = audioRef.current?.currentTime || 0;

    // Finde aktuellen Viseme basierend auf Timestamp
    const currentViseme = visemes.find(
      (v, index) => {
        const nextViseme = visemes[index + 1];
        return (
          currentTime >= v.timestamp &&
          (index === visemes.length - 1 || (nextViseme !== undefined && currentTime < nextViseme.timestamp))
        );
      },
    );

    if (currentViseme && currentViseme !== currentVisemeRef.current) {
      currentVisemeRef.current = currentViseme;

      // Update Morph Targets
      if (morphTargets && onVisemeUpdate) {
        onVisemeUpdate(currentViseme.viseme, currentViseme.intensity);
      }
    }
  });

  // Audio Playback Control
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((error) => {
          console.error('Failed to play audio:', error);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  return {
    currentViseme: currentVisemeRef.current,
    audioElement: audioRef.current,
  };
}

/**
 * Lip Sync Component
 * 
 * Wrapper Component für Lip Sync Funktionalität
 */
export function LipSync({
  audioUrl,
  visemes = [],
  morphTargets,
  isPlaying = false,
  onVisemeUpdate,
}: LipSyncProps) {
  useLipSync({
    ...(audioUrl !== undefined && { audioUrl }),
    visemes,
    ...(morphTargets !== undefined && { morphTargets }),
    isPlaying,
    ...(onVisemeUpdate !== undefined && { onVisemeUpdate }),
  });

  return null; // Diese Component rendert nichts, sie verwaltet nur State
}

/**
 * Viseme Types (basierend auf OVR Lip Sync)
 */
export const VISEME_TYPES = [
  'sil',
  'PP',
  'FF',
  'TH',
  'DD',
  'kk',
  'CH',
  'SS',
  'nn',
  'RR',
  'aa',
  'E',
  'ih',
  'oh',
  'ou',
] as const;

export type VisemeType = (typeof VISEME_TYPES)[number];

/**
 * Viseme Mapping für deutsche Phoneme
 */
export const VISEME_MAP: Record<string, VisemeType> = {
  // Vokale
  a: 'aa',
  e: 'E',
  i: 'ih',
  o: 'oh',
  u: 'ou',
  // Konsonanten
  p: 'PP',
  b: 'PP',
  f: 'FF',
  v: 'FF',
  t: 'DD',
  d: 'DD',
  k: 'kk',
  g: 'kk',
  ch: 'CH',
  s: 'SS',
  z: 'SS',
  n: 'nn',
  m: 'PP',
  r: 'RR',
  l: 'RR',
  // Default
  default: 'sil',
};

