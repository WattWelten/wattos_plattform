'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
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
  const groupRef = useRef<THREE.Group>(null);
  const clockRef = useRef(new THREE.Clock());
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

  // Lip-Sync Animation mit Morph-Handling
  useFrame((state, delta) => {
    if (!gltfScene || !groupRef.current) return;

    // Decay für alle Morph Targets (Glättung)
    decayAll(gltfScene, delta, 12);

    // Visemes anwenden
    if (visemes && visemes.length > 0) {
      const time = state.clock.elapsedTime;
      const visemeIndex = Math.floor((time * 10) % visemes.length);
      const visemeValue = visemes[visemeIndex] || 0;

      // Viseme-Mapping (vereinfacht - kann erweitert werden)
      const visemeNames = [
        'viseme_aa',
        'viseme_ii',
        'viseme_uu',
        'viseme_ee',
        'viseme_oo',
        'viseme_pp',
        'viseme_ff',
        'viseme_th',
        'viseme_dd',
        'viseme_kk',
        'viseme_ch',
        'viseme_ss',
        'viseme_nn',
        'viseme_rr',
        'viseme_mm',
      ];

      if (visemeValue > 0.1) {
        // Aktiviere entsprechenden Viseme
        const visemeName = visemeNames[visemeIndex % visemeNames.length] || 'viseme_aa';
        setViseme(morphDictRef.current, visemeName, visemeValue);
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
