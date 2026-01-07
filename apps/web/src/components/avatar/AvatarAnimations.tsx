'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

interface AvatarAnimationsProps {
  modelUrl: string;
  animationType?: 'idle' | 'talking' | 'listening' | 'thinking';
  isTalking?: boolean;
  onAnimationComplete?: () => void;
}

/**
 * Avatar Animations Hook
 * 
 * Verwaltet Avatar-Animationen basierend auf State
 */
export function useAvatarAnimations({
  modelUrl,
  animationType = 'idle',
  isTalking = false,
  onAnimationComplete,
}: AvatarAnimationsProps) {
  const { scene, animations } = useGLTF(modelUrl);
  const { actions, mixer } = useAnimations(animations, scene);
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);
  const animationCompleteTriggeredRef = useRef<boolean>(false);

  // Speichere onAnimationComplete in Ref für useFrame
  useEffect(() => {
    onCompleteRef.current = onAnimationComplete || null;
    animationCompleteTriggeredRef.current = false;
  }, [onAnimationComplete]);

  // Animation basierend auf State auswählen
  useEffect(() => {
    let targetAnimation: string | null = null;

    if (isTalking) {
      targetAnimation = 'talking' in actions ? 'talking' : animations[0]?.name || null;
    } else {
      switch (animationType) {
        case 'talking':
          targetAnimation = 'talking' in actions ? 'talking' : animations[0]?.name || null;
          break;
        case 'listening':
          targetAnimation = 'listening' in actions ? 'listening' : 'idle' in actions ? 'idle' : animations[0]?.name || null;
          break;
        case 'thinking':
          targetAnimation = 'thinking' in actions ? 'thinking' : 'idle' in actions ? 'idle' : animations[0]?.name || null;
          break;
        default:
          targetAnimation = 'idle' in actions ? 'idle' : animations[0]?.name || null;
      }
    }

    if (targetAnimation && targetAnimation !== currentAnimation) {
      // Reset completion flag für neue Animation
      animationCompleteTriggeredRef.current = false;

      // Stoppe aktuelle Animation
      if (currentAnimation && actions[currentAnimation]) {
        actions[currentAnimation].fadeOut(0.3);
      }

      // Starte neue Animation
      const action = actions[targetAnimation];
      if (action) {
        action.reset().fadeIn(0.3).play();
        setCurrentAnimation(targetAnimation);

        // Verwende Mixer-Event für Animation Complete (wenn verfügbar)
        if (onAnimationComplete && mixer) {
          const handleFinished = (event: THREE.Event & { action: THREE.AnimationAction }) => {
            // Prüfe ob es die richtige Animation ist
            if (event.action === action && !animationCompleteTriggeredRef.current) {
              animationCompleteTriggeredRef.current = true;
              onAnimationComplete();
            }
          };

          mixer.addEventListener('finished', handleFinished);

          // Cleanup-Funktion
          return () => {
            if (mixer) {
              mixer.removeEventListener('finished', handleFinished);
            }
          };
        }
      }
    }

    // Expliziter Return für alle Code-Pfade
    return undefined;
  }, [animationType, isTalking, actions, currentAnimation, animations, onAnimationComplete, mixer]);

  // Animation Loop mit Fallback-Überwachung für Animation Complete
  useFrame((_state, delta) => {
    if (mixer) {
      mixer.update(delta);
    }

    // Fallback: Manuelle Überwachung wenn Mixer-Events nicht funktionieren
    if (currentAnimation && actions[currentAnimation] && onCompleteRef.current && !animationCompleteTriggeredRef.current) {
      const action = actions[currentAnimation];
      // Prüfe ob Animation beendet ist (nur für non-looping Animationen)
      if (!action.loop && action.time >= action.getClip().duration && action.isRunning()) {
        animationCompleteTriggeredRef.current = true;
        onCompleteRef.current();
      }
    }
  });

  return {
    scene,
    currentAnimation,
    actions,
    mixer,
  };
}

/**
 * Avatar Animations Component
 * 
 * Wrapper Component für Avatar-Animationen
 */
export function AvatarAnimations({
  modelUrl,
  animationType = 'idle',
  isTalking = false,
  onAnimationComplete,
}: AvatarAnimationsProps) {
  const { scene } = useAvatarAnimations({
    modelUrl,
    animationType,
    isTalking,
    ...(onAnimationComplete !== undefined && { onAnimationComplete }),
  });

  return <primitive object={scene} />;
}

