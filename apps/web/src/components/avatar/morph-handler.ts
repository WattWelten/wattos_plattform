/**
 * Morph Handler
 * 
 * Utilities für Morph-Target-Manipulation (Avaturn T2)
 */

import * as THREE from 'three';

export interface MorphDictEntry {
  mesh: THREE.SkinnedMesh;
  idx: number;
}

/**
 * Build Morph Dictionary
 * Erstellt ein Dictionary für Morph-Targets
 */
export function buildMorphDict(
  scene: THREE.Scene | THREE.Group | THREE.Object3D,
): Map<string, MorphDictEntry[]> {
  const morphDict = new Map<string, MorphDictEntry[]>();

  scene.traverse((object) => {
    if (object instanceof THREE.SkinnedMesh && object.morphTargetDictionary) {
      Object.entries(object.morphTargetDictionary).forEach(([name, idx]) => {
        if (!morphDict.has(name)) {
          morphDict.set(name, []);
        }
        morphDict.get(name)?.push({ mesh: object, idx });
      });
    }
  });

  return morphDict;
}

/**
 * Set Viseme
 * Setzt einen Viseme-Wert auf Morph-Targets
 */
export function setViseme(
  morphDict: Map<string, MorphDictEntry[]>,
  visemeName: string,
  weight: number,
): void {
  const entries = morphDict.get(visemeName);
  if (entries) {
    entries.forEach(({ mesh, idx }) => {
      if (mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences[idx] = weight;
      }
    });
  }
}

/**
 * Decay All Morph Targets
 * Reduziert alle Morph-Target-Werte
 */
export function decayAll(
  morphDict: Map<string, MorphDictEntry[]>,
  decayRate: number = 0.1,
): void {
  morphDict.forEach((entries) => {
    entries.forEach(({ mesh, idx }) => {
      if (mesh.morphTargetInfluences) {
        const current = mesh.morphTargetInfluences[idx] || 0;
        mesh.morphTargetInfluences[idx] = Math.max(0, current - decayRate);
      }
    });
  });
}

/**
 * Enable Morph Targets
 * Aktiviert Morph-Targets auf einem Mesh oder Scene/Group
 */
export function enableMorphTargets(scene: THREE.Scene | THREE.Group | THREE.SkinnedMesh): void {
  if (scene instanceof THREE.SkinnedMesh) {
    if (scene.morphTargetInfluences) {
      scene.morphTargetInfluences.fill(0);
    }
  } else {
    scene.traverse((object) => {
      if (object instanceof THREE.SkinnedMesh && object.morphTargetInfluences) {
        object.morphTargetInfluences.fill(0);
      }
    });
  }
}

/**
 * Filter Morph Tracks
 * Filtert Morph-Tracks aus Animationen (Avaturn T2: keine GLB-Morph-Tracks zur Laufzeit überschreiben)
 */
export function filterMorphTracks(animations: THREE.AnimationClip[]): THREE.AnimationClip[] {
  return animations.map((clip) => {
    const tracks = clip.tracks.filter((track) => {
      // Filtere Morph-Tracks heraus
      return !track.name.includes('morphTargetInfluences');
    });
    return new THREE.AnimationClip(clip.name, clip.duration, tracks);
  });
}

/**
 * Enhance Eye Material
 * Verbessert das Augen-Material für bessere Darstellung
 */
export function enhanceEyeMaterial(scene: THREE.Scene | THREE.Group | THREE.SkinnedMesh): void {
  if (scene instanceof THREE.SkinnedMesh) {
    if (scene.material instanceof THREE.MeshStandardMaterial) {
      scene.material.metalness = 0.1;
      scene.material.roughness = 0.2;
      scene.material.emissive = new THREE.Color(0x000000);
    }
  } else {
    scene.traverse((object) => {
      if (object instanceof THREE.SkinnedMesh && object.material instanceof THREE.MeshStandardMaterial) {
        object.material.metalness = 0.1;
        object.material.roughness = 0.2;
        object.material.emissive = new THREE.Color(0x000000);
      }
    });
  }
}

