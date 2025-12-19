'use client';

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarV2Props } from './types';

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
  const groupRef = useRef<THREE.Group>(null);

  // GLTF-Modell laden (falls vorhanden)
  const { scene: gltfScene, animations: gltfAnimations } = useGLTF(
    config.model.url || '/models/default-avatar.gltf',
    true,
  );

  // Animationen
  const { actions, mixer } = useAnimations(gltfAnimations, groupRef);

  // Lip-Sync Animation
  useFrame((state, delta) => {
    if (visemes && visemes.length > 0 && groupRef.current) {
      const time = state.clock.elapsedTime;
      const visemeIndex = Math.floor((time * 10) % visemes.length);
      const visemeValue = visemes[visemeIndex] || 0;

      // Morph Target für Lip-Sync
      if (gltfScene) {
        gltfScene.traverse((child) => {
          if (child instanceof THREE.SkinnedMesh) {
            const morphTargetInfluences = child.morphTargetInfluences;
            if (morphTargetInfluences && morphTargetInfluences.length > 0) {
              // Erste Morph Target für Mund-Öffnung
              morphTargetInfluences[0] = visemeValue;
            }
          }
        });
      }
    }

    // Animation-Mixer aktualisieren
    if (mixer) {
      mixer.update(delta);
    }
  });

  // Audio-Integration
  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch((error) => {
        if (onError) {
          onError(error);
        }
      });

      audio.addEventListener('ended', () => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      });

      return () => {
        audio.pause();
        audio.removeEventListener('ended', () => {});
      };
    }
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
    <group ref={groupRef}>
      {config.model.url ? (
        <primitive object={gltfScene} />
      ) : (
        // Fallback: Box-Primitive
        <mesh>
          <boxGeometry args={[1, 2, 1]} />
          <meshStandardMaterial
            color={config.avatar.material?.color || '#4a90e2'}
            metalness={config.avatar.material?.metalness || 0.3}
            roughness={config.avatar.material?.roughness || 0.7}
          />
        </mesh>
      )}
    </group>
  );
}

