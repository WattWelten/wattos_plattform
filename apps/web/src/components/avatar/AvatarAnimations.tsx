'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Avatar Animations Hook
 * 
 * Verwaltet Avatar-Animationen (Gestures, Idle, etc.)
 */
export function useAvatarAnimations(
  animations: {
    gestures?: {
      enabled: boolean;
      types: string[];
    };
    idle?: {
      enabled: boolean;
      animation: string;
    };
  },
  meshRef: React.RefObject<THREE.Mesh | THREE.SkinnedMesh>,
) {
  const animationState = useRef({
    currentGesture: null as string | null,
    gestureStartTime: 0,
    idleAnimation: null as THREE.AnimationAction | null,
  });

  // Idle-Animation
  useEffect(() => {
    if (animations.idle?.enabled && meshRef.current) {
      // Placeholder für Idle-Animation
      // In Production: Animation aus GLTF-Modell laden
      animationState.current.idleAnimation = null;
    }
  }, [animations.idle, meshRef]);

  // Gesture-Animation
  useFrame((state) => {
    if (animations.gestures?.enabled && meshRef.current) {
      const time = state.clock.elapsedTime;

      // Beispiel: Nod-Geste (Kopf nicken)
      if (animations.gestures.types.includes('nod')) {
        const nodCycle = Math.sin(time * 2) * 0.1;
        if (meshRef.current.rotation) {
          meshRef.current.rotation.x = nodCycle;
        }
      }

      // Beispiel: Shake-Geste (Kopf schütteln)
      if (animations.gestures.types.includes('shake')) {
        const shakeCycle = Math.sin(time * 4) * 0.1;
        if (meshRef.current.rotation) {
          meshRef.current.rotation.y = shakeCycle;
        }
      }
    }
  });

  return animationState.current;
}


