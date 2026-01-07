'use client';

import '../types/react-three-fiber-global';
import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarV2Props } from './types';
import {
  buildMorphDict,
  setViseme,
  decayAll,
  enableMorphTargets,
  filterMorphTracks,
  enhanceEyeMaterial,
} from './morph-handler';

/**
 * Avatar V2 Component
 * 
 * Hauptkomponente für Avatar-Rendering mit Three.js/R3F
 */
export function AvatarV2({
  config,
  visemes,
  audioUrl,
  onAnimationComplete,
  onError,
}: AvatarV2Props) {
  // Visemes können als Array<{viseme: string, timestamp: number, weight: number}> oder number[] sein
  const visemeEvents: Array<{ viseme: string; timestamp: number; weight: number }> | undefined = 
    Array.isArray(visemes) && visemes.length > 0 && typeof visemes[0] === 'object' && visemes[0] !== null && 'viseme' in visemes[0]
      ? (visemes as unknown as Array<{ viseme: string; timestamp: number; weight: number }>)
      : undefined;
  const groupRef = useRef<THREE.Group>(null);
  const morphDictRef = useRef<Map<string, { mesh: THREE.SkinnedMesh; idx: number }[]>>(new Map());

  // GLTF-Modell laden (falls vorhanden)
  const { scene: gltfScene, animations: gltfAnimations } = useGLTF(
    config.model.url || '/models/default-avatar.gltf',
    true,
  );

  // Morph-Tracks aus Animationen filtern
  const filteredAnimations = useMemo(() => {
    return filterMorphTracks(gltfAnimations);
  }, [gltfAnimations]);

  // Animationen mit gefilterten Clips
  const { actions, mixer } = useAnimations(filteredAnimations, groupRef);

  // Morph-Dictionary aufbauen und Materialien konfigurieren
  useEffect(() => {
    if (gltfScene) {
      // Materialien morph-fähig machen
      enableMorphTargets(gltfScene);
      
      // Augen-Material verbessern
      enhanceEyeMaterial(gltfScene);
      
      // Morph-Dictionary aufbauen
      morphDictRef.current = buildMorphDict(gltfScene);
      
      // Dev-Testfunktion registrieren
      if (typeof window !== 'undefined') {
        (window as any).testViseme = (visemeName: string, w = 1) => {
          setViseme(morphDictRef.current, visemeName, w);
        };
        console.info(
          'Morph-Setup aktiv. Dev-Konsole: testViseme("viseme_aa"), testViseme("viseme_pp"), testViseme("viseme_th")',
        );
      }
    }
  }, [gltfScene]);

  // Audio-Ref für Viseme-Sync
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioStartTimeRef = useRef<number>(0);

  // Lip-Sync Animation mit timestamp-basierter Viseme-Synchronisation
  useFrame((state: any, delta: number) => {
    if (!gltfScene || !groupRef.current) return;

    // Decay für alle Morph Targets (Glättung)
    decayAll(morphDictRef.current, 0.1);

    // Visemes mit Audio-Sync anwenden
    if (visemeEvents && visemeEvents.length > 0 && audioRef.current) {
      // Audio-Zeit ermitteln (synchronisiert mit Audio-Playback)
      const audioTime = audioRef.current.currentTime;
      const currentTime = audioTime * 1000; // in ms

      // Viseme-Event für aktuelle Zeit finden
      const currentViseme = visemeEvents.find((v, i) => {
        const prevViseme = i > 0 && visemeEvents ? visemeEvents[i - 1] : undefined;
        const prevTimestamp = prevViseme ? prevViseme.timestamp : 0;
        return currentTime >= prevTimestamp && currentTime < v.timestamp;
      });

      if (currentViseme) {
        // Viseme-Mapping (MBP/FV/TH/AA-Visemes)
        const visemeMap: Record<string, string> = {
          MBP: 'viseme_mm',
          FV: 'viseme_ff',
          TH: 'viseme_th',
          AA: 'viseme_aa',
          // Fallback-Mapping
          PP: 'viseme_pp',
          II: 'viseme_ii',
          UU: 'viseme_uu',
          EE: 'viseme_ee',
          OO: 'viseme_oo',
          DD: 'viseme_dd',
          KK: 'viseme_kk',
          CH: 'viseme_ch',
          SS: 'viseme_ss',
          NN: 'viseme_nn',
          RR: 'viseme_rr',
        };

        const visemeName = visemeMap[currentViseme.viseme] || 'viseme_aa';
        setViseme(morphDictRef.current, visemeName, currentViseme.weight);
      }
    } else if (visemeEvents && visemeEvents.length > 0) {
      // Fallback: Zeit-basierte Viseme (wenn kein Audio)
      const time = state.clock.elapsedTime;
      const visemeIndex = Math.floor((time * 10) % visemeEvents.length);
      const viseme = visemeEvents[visemeIndex];
      
      if (viseme && viseme.weight > 0.1) {
        const visemeMap: Record<string, string> = {
          MBP: 'viseme_mm',
          FV: 'viseme_ff',
          TH: 'viseme_th',
          AA: 'viseme_aa',
        };
        const visemeName = visemeMap[viseme.viseme] || 'viseme_aa';
        setViseme(morphDictRef.current, visemeName, viseme.weight);
      }
    }

    // Animation-Mixer aktualisieren
    if (mixer) {
      mixer.update(delta);
    }
  });

  // Audio-Integration mit Viseme-Sync
  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audioStartTimeRef.current = Date.now();

      audio.play().catch((error: Error) => {
        if (onError) {
          onError(error);
        }
      });

      const handleEnded = () => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
        audioRef.current = null;
      };

      const handleError = (error: Error) => {
        if (onError) {
          onError(error);
        }
        audioRef.current = null;
      };

      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError as any);

      return () => {
        audio.pause();
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError as any);
        audioRef.current = null;
      };
    }
    return undefined;
  }, [audioUrl, onAnimationComplete, onError]);

  // Idle-Animation starten
  useEffect(() => {
    if (actions && config.avatar.animations?.idle?.enabled) {
      const idleAction = actions[config.avatar.animations.idle.animation || 'idle'];
      if (idleAction) {
        idleAction.play();
        idleAction.setLoop(THREE.LoopRepeat, Infinity);
      }
    }
  }, [actions, config]);

  // Avatar-Position, Rotation, Scale anwenden
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...config.avatar.position);
      groupRef.current.rotation.set(...config.avatar.rotation);
      groupRef.current.scale.set(...config.avatar.scale);
    }
  }, [config]);

  return (
    // @ts-ignore - Three.js JSX elements from @react-three/fiber
    <group ref={groupRef}>
      {config.model.url ? (
        // @ts-ignore
        <primitive object={gltfScene} />
      ) : (
        // Fallback: Box-Primitive
        // @ts-ignore
        <mesh>
          {/* @ts-ignore */}
          <boxGeometry args={[1, 2, 1]} />
          {/* @ts-ignore */}
          <meshStandardMaterial
            color={config.avatar.material?.color || '#4a90e2'}
            metalness={config.avatar.material?.metalness || 0.3}
            roughness={config.avatar.material?.roughness || 0.7}
          />
        {/* @ts-ignore */}
        </mesh>
      )}
    {/* @ts-ignore */}
    </group>
  );
}
