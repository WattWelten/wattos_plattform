'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Lip Sync Hook
 * 
 * Synchronisiert Avatar-Mundbewegungen mit Audio
 */
export function useLipSync(
  visemes: number[] | undefined,
  audioElement: HTMLAudioElement | null,
  meshRef: React.RefObject<THREE.Mesh | THREE.SkinnedMesh>,
) {
  const visemeIndexRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Audio Context initialisieren
  useEffect(() => {
    if (audioElement && !audioContextRef.current) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaElementSource(audioElement);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        source.connect(analyser);
        analyser.connect(audioContext.destination);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
      } catch (error) {
        console.warn('Failed to initialize AudioContext:', error);
      }
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [audioElement]);

  // Lip-Sync Animation
  useFrame(() => {
    if (!meshRef.current || !visemes || visemes.length === 0) {
      return;
    }

    let visemeValue = 0;

    // Visemes aus Array verwenden (falls vorhanden)
    if (visemes.length > 0) {
      const time = Date.now() / 100; // 10ms Schritte
      visemeIndexRef.current = Math.floor(time % visemes.length);
      visemeValue = visemes[visemeIndexRef.current] || 0;
    }

    // Audio-Analyse für Real-time Lip-Sync (falls AudioContext verfügbar)
    if (analyserRef.current && audioElement && !audioElement.paused) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Niedrige Frequenzen für Mund-Öffnung verwenden
      const lowFreq = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
      const normalizedValue = Math.min(lowFreq / 255, 1);

      // Viseme-Wert mit Audio-Analyse kombinieren
      visemeValue = Math.max(visemeValue, normalizedValue * 0.5);
    }

    // Morph Target anwenden
    if (meshRef.current instanceof THREE.SkinnedMesh) {
      const morphTargetInfluences = meshRef.current.morphTargetInfluences;
      if (morphTargetInfluences && morphTargetInfluences.length > 0) {
        // Erste Morph Target für Mund-Öffnung
        morphTargetInfluences[0] = visemeValue;
      }
    } else if (meshRef.current instanceof THREE.Mesh) {
      // Fallback: Scale für einfache Mund-Animation
      const scaleY = 1 + visemeValue * 0.2;
      meshRef.current.scale.y = scaleY;
    }
  });
}


