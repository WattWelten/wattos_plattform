/**
 * Morph Handler für Avatar Visemes
 * 
 * Verwaltet Morph Targets für Lip-Sync mit Head/Teeth/Tongue-Lookup
 */

import * as THREE from 'three';

// ===== Types =====
type MorphEntry = { mesh: THREE.SkinnedMesh; idx: number };

// Mesh-Gewichte für verschiedene Visemes
const MESH_WEIGHTS: Partial<Record<string, [number, number, number]>> = {
  viseme_pp: [1.0, 0.1, 0.0], // Head, Teeth, Tongue
  viseme_ff: [0.9, 0.1, 0.0],
  viseme_th: [0.7, 0.0, 0.3], // Zunge sichtbar
  viseme_dd: [0.95, 0.05, 0.1],
  viseme_kk: [0.95, 0.05, 0.1],
  viseme_ch: [0.95, 0.05, 0.05],
  viseme_aa: [1.0, 0.0, 0.0], // Offener Mund
  viseme_ii: [0.8, 0.0, 0.0],
  viseme_oo: [0.9, 0.0, 0.0],
  viseme_uu: [0.85, 0.0, 0.0],
  viseme_ee: [0.8, 0.0, 0.0],
  viseme_ss: [0.7, 0.1, 0.0],
  viseme_nn: [0.75, 0.0, 0.0],
  viseme_rr: [0.8, 0.0, 0.0],
  viseme_mm: [0.9, 0.0, 0.0],
};

/**
 * Baut Morph-Dictionary aus Scene
 */
export function buildMorphDict(root: THREE.Object3D): Map<string, MorphEntry[]> {
  const dict = new Map<string, MorphEntry[]>();
  
  root.traverse((o) => {
    if (o instanceof THREE.SkinnedMesh && o.morphTargetDictionary && o.morphTargetInfluences) {
      for (const [name, idx] of Object.entries(o.morphTargetDictionary)) {
        const key = name.toLowerCase();
        if (!dict.has(key)) {
          dict.set(key, []);
        }
        dict.get(key)!.push({ mesh: o, idx: Number(idx) });
      }
    }
  });
  
  return dict;
}

/**
 * Setzt Viseme mit Head/Teeth/Tongue-Gewichtung
 */
export function setViseme(
  dict: Map<string, MorphEntry[]>,
  name: string,
  weight: number,
): void {
  const key = name.toLowerCase();
  const entries = dict.get(key);
  if (!entries || entries.length === 0) {
    return;
  }
  
  const W = MESH_WEIGHTS[key] ?? [1.0, 0.0, 0.0]; // Default: nur Head
  
  // Filtere nach Mesh-Namen
  const head = entries.filter((e) => /head/i.test(e.mesh.name));
  const teeth = entries.filter((e) => /teeth/i.test(e.mesh.name));
  const tongue = entries.filter((e) => /tongue/i.test(e.mesh.name));
  
  // Fallback: Wenn keine spezifischen Meshes gefunden, alle verwenden
  const applyTo = (arr: MorphEntry[], w: number) => {
    if (arr.length > 0) {
      arr.forEach((e) => {
        if (e.mesh.morphTargetInfluences) {
          e.mesh.morphTargetInfluences[e.idx] = Math.max(
            e.mesh.morphTargetInfluences[e.idx] || 0,
            w,
          );
        }
      });
    }
  };
  
  applyTo(head.length > 0 ? head : entries, weight * W[0]);
  applyTo(teeth, weight * W[1]);
  applyTo(tongue, weight * W[2]);
}

/**
 * Decay für alle Morph Targets (Glättung)
 */
export function decayAll(root: THREE.Object3D, dt: number, lambda = 12): void {
  const k = Math.exp(-lambda * dt);
  
  root.traverse((o) => {
    if (o instanceof THREE.SkinnedMesh && o.morphTargetInfluences) {
      const inf = o.morphTargetInfluences;
      for (let i = 0; i < inf.length; i++) {
        inf[i] *= k;
      }
    }
  });
}

/**
 * Macht Materialien morph-fähig
 */
export function enableMorphTargets(root: THREE.Object3D): void {
  root.traverse((o) => {
    if (o instanceof THREE.SkinnedMesh && o.material) {
      const materials = Array.isArray(o.material) ? o.material : [o.material];
      materials.forEach((m: any) => {
        if (m.isMaterial) {
          m.morphTargets = true;
          m.morphNormals = true;
          m.skinning = true;
          m.needsUpdate = true;
        }
      });
    }
  });
}

/**
 * Filtert Morph-Tracks aus Animationen
 */
export function filterMorphTracks(
  animations: THREE.AnimationClip[],
): THREE.AnimationClip[] {
  return animations.map((clip) => {
    const filteredTracks = clip.tracks.filter(
      (track) => !track.name.includes('morphTargetInfluences'),
    );
    return new THREE.AnimationClip(clip.name, clip.duration, filteredTracks);
  });
}

/**
 * Verbessert Augen-Material
 */
export function enhanceEyeMaterial(scene: THREE.Object3D): void {
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh && /eye/i.test(o.name)) {
      const currentMat = o.material as any;
      const newMat = new THREE.MeshPhysicalMaterial({
        map: currentMat?.map,
        normalMap: currentMat?.normalMap,
        roughness: 0.05,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        ior: 1.38,
      });
      newMat.color.set('#9EC6FF'); // Dezentes Blau
      newMat.needsUpdate = true;
      o.material = newMat;
    }
  });
}

