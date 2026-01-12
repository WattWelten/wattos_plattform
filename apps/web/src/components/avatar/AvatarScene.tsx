'use client';

import { Suspense, useMemo, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarV2 } from './AvatarV2';
import { AvatarErrorBoundary } from './AvatarErrorBoundary';
import { AvatarSceneProps } from './types';
import { getCappedDPR } from '@/lib/performance';

/**
 * Check if device is mobile
 */
function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * Camera Component für R3F
 * Erstellt und konfiguriert die PerspectiveCamera explizit
 */
function CameraSetup({ 
  sceneConfig,
  onCanvasReady,
}: { 
  sceneConfig: AvatarSceneProps['sceneConfig'];
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}) {
  const { set, gl, size } = useThree(); // size statt gl.domElement verwenden
  
  useEffect(() => {
    // Prüfe ob gl.domElement verfügbar ist
    if (!gl || !gl.domElement || gl.domElement.width === 0 || size.width === 0) {
      return; // Warte auf nächsten Render
    }
    
    // Canvas-Ref an Parent weitergeben
    if (onCanvasReady && gl.domElement) {
      onCanvasReady(gl.domElement);
    }
    
    // Erstelle explizit eine PerspectiveCamera
    const aspect = size.width / size.height || 1; // Verwende size statt gl.domElement
    const camera = new THREE.PerspectiveCamera(
      sceneConfig.scene.camera.fov,
      aspect,
      0.1,
      1000
    );
    
    // Setze Position und Target
    camera.position.set(...sceneConfig.scene.camera.position);
    camera.lookAt(...sceneConfig.scene.camera.target);
    camera.updateProjectionMatrix();
    
    // Setze als Default Camera
    set({ camera });
    
    return () => {
      // Cleanup
      camera.dispose();
    };
  }, [set, gl, size, sceneConfig, onCanvasReady]); // size in dependencies
  
  return null;
}

/**
 * Avatar Scene Component
 * 
 * Three.js/R3F Scene für Avatar-Rendering
 */
export function AvatarScene({
  sceneConfig,
  visemes,
  audioUrl,
  onAnimationComplete,
  onError,
  enableControls = true,
  enableEnvironment = true,
  onCanvasReady,
}: AvatarSceneProps & { onCanvasReady?: (canvas: HTMLCanvasElement) => void }) {
  const mobile = useMemo(() => isMobile(), []);

  return (
    <div className="w-full h-full relative" role="img" aria-label="3D Avatar">
      <Canvas
        gl={{
          antialias: !mobile, // SSAO deaktiviert auf Mobile
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, getCappedDPR()]} // DPR-Cap: Desktop ≤2.0, Mobile ≤1.5
        performance={{ min: 0.5 }} // Performance-Monitoring
      >
        <Suspense fallback={null}>
          {/* Camera - manuell mit useThree Hook */}
          <CameraSetup sceneConfig={sceneConfig} onCanvasReady={onCanvasReady} />

          {/* Lights */}
          {sceneConfig.scene.lights.map((light, index) => {
            switch (light.type) {
              case 'ambient':
                return (
                  // @ts-ignore - Three.js JSX elements from @react-three/fiber
                  <ambientLight
                    key={index}
                    color={light.color || '#ffffff'}
                    intensity={light.intensity || 0.5}
                  />
                );
              case 'directional':
                return (
                  // @ts-ignore
                  <directionalLight
                    key={index}
                    position={light.position || [0, 1, 0]}
                    color={light.color || '#ffffff'}
                    intensity={light.intensity || 0.8}
                  />
                );
              case 'point':
                return (
                  // @ts-ignore
                  <pointLight
                    key={index}
                    position={light.position || [0, 1, 0]}
                    color={light.color || '#ffffff'}
                    intensity={light.intensity || 1}
                  />
                );
              case 'spot':
                return (
                  // @ts-ignore
                  <spotLight
                    key={index}
                    position={light.position || [0, 1, 0]}
                    color={light.color || '#ffffff'}
                    intensity={light.intensity || 1}
                  />
                );
              default:
                return null;
            }
          })}

          {/* Environment (HDRI) */}
          {enableEnvironment && (
            <Environment preset="sunset" background={sceneConfig.scene.background?.color ? true : false} />
          )}

          {/* Avatar */}
          <AvatarErrorBoundary onError={onError}>
            <AvatarV2
              config={sceneConfig}
              {...(visemes !== undefined && { visemes })}
              {...(audioUrl !== undefined && { audioUrl })}
              {...(onAnimationComplete && { onAnimationComplete })}
              {...(onError && { onError })}
            />
          </AvatarErrorBoundary>

          {/* Controls */}
          {enableControls && (
            <OrbitControls
              target={sceneConfig.scene.camera.target}
              enablePan={false}
              enableZoom={true}
              enableRotate={true}
              minDistance={2}
              maxDistance={10}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
