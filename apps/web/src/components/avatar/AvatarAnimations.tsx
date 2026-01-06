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
      // Stoppe aktuelle Animation
      if (currentAnimation && actions[currentAnimation]) {
        actions[currentAnimation].fadeOut(0.3);
      }

      // Starte neue Animation
      if (actions[targetAnimation]) {
        actions[targetAnimation].reset().fadeIn(0.3).play();
        setCurrentAnimation(targetAnimation);

        // Animation Complete Callback
        if (onAnimationComplete) {
          const handleComplete = () => {
            onAnimationComplete();
            actions[targetAnimation!].removeEventListener('finished', handleComplete);
          };
          actions[targetAnimation].addEventListener('finished', handleComplete);
        }
      }
    }
  }, [animationType, isTalking, actions, currentAnimation, animations, onAnimationComplete]);

  // Animation Loop
  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta);
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
    onAnimationComplete,
  });

  return <primitive object={scene} />;
}

