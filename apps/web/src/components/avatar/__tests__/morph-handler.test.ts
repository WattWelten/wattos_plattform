/**
 * Morph Handler Unit Tests
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  buildMorphDict,
  setViseme,
  decayAll,
  enableMorphTargets,
  filterMorphTracks,
} from '../morph-handler';

describe('morph-handler', () => {
  describe('buildMorphDict', () => {
    it('should build morph dictionary from scene', () => {
      const scene = new THREE.Scene();
      const mesh = new THREE.SkinnedMesh(
        new THREE.BoxGeometry(),
        new THREE.MeshStandardMaterial(),
      );
      mesh.morphTargetDictionary = { viseme_aa: 0, viseme_pp: 1 };
      mesh.morphTargetInfluences = [0, 0];
      mesh.name = 'Head_Mesh';
      scene.add(mesh);

      const dict = buildMorphDict(scene);
      expect(dict.has('viseme_aa')).toBe(true);
      expect(dict.has('viseme_pp')).toBe(true);
    });
  });

  describe('setViseme', () => {
    it('should set viseme influence', () => {
      const scene = new THREE.Scene();
      const mesh = new THREE.SkinnedMesh(
        new THREE.BoxGeometry(),
        new THREE.MeshStandardMaterial(),
      );
      mesh.morphTargetDictionary = { viseme_aa: 0 };
      mesh.morphTargetInfluences = [0];
      mesh.name = 'Head_Mesh';
      scene.add(mesh);

      const dict = buildMorphDict(scene);
      setViseme(dict, 'viseme_aa', 1.0);
      expect(mesh.morphTargetInfluences![0]).toBeGreaterThan(0);
    });
  });

  describe('decayAll', () => {
    it('should decay all morph influences', () => {
      const scene = new THREE.Scene();
      const mesh = new THREE.SkinnedMesh(
        new THREE.BoxGeometry(),
        new THREE.MeshStandardMaterial(),
      );
      mesh.morphTargetInfluences = [1.0, 0.5];
      scene.add(mesh);

      decayAll(scene, 0.016, 12); // ~60fps delta
      expect(mesh.morphTargetInfluences![0]).toBeLessThan(1.0);
      expect(mesh.morphTargetInfluences![1]).toBeLessThan(0.5);
    });
  });

  describe('filterMorphTracks', () => {
    it('should filter morph tracks from animations', () => {
      const clip = new THREE.AnimationClip('test', 1, [
        new THREE.NumberKeyframeTrack('mesh.morphTargetInfluences[0]', [0], [1]),
        new THREE.NumberKeyframeTrack('mesh.position.x', [0], [0]),
      ]);

      const filtered = filterMorphTracks([clip]);
      expect(filtered[0].tracks.length).toBe(1);
      expect(filtered[0].tracks[0].name).toBe('mesh.position.x');
    });
  });

  describe('enableMorphTargets', () => {
    it('should enable morph targets on materials', () => {
      const scene = new THREE.Scene();
      const material = new THREE.MeshStandardMaterial();
      const mesh = new THREE.SkinnedMesh(new THREE.BoxGeometry(), material);
      scene.add(mesh);

      enableMorphTargets(scene);
      expect(material.morphTargets).toBe(true);
      expect(material.morphNormals).toBe(true);
      expect(material.skinning).toBe(true);
    });
  });
});

