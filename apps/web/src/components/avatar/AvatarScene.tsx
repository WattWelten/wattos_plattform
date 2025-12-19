'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { AvatarV2 } from './AvatarV2';
import { AvatarSceneProps } from './types';
import { AvatarSceneSkeleton } from './AvatarSceneSkeleton';

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
}: AvatarSceneProps) {
  return (
    <div className="w-full h-full relative">
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]} // Device Pixel Ratio für Retina-Displays
        performance={{ min: 0.5 }} // Performance-Monitoring
      >
        <Suspense fallback={null}>
          {/* Camera */}
          <PerspectiveCamera
            makeDefault
            position={sceneConfig.scene.camera.position}
            fov={sceneConfig.scene.camera.fov}
          />

          {/* Lights */}
          {sceneConfig.scene.lights.map((light, index) => {
            switch (light.type) {
              case 'ambient':
                return (
                  <ambientLight
                    key={index}
                    color={light.color || '#ffffff'}
                    intensity={light.intensity || 0.5}
                  />
                );
              case 'directional':
                return (
                  <directionalLight
                    key={index}
                    position={light.position || [0, 1, 0]}
                    color={light.color || '#ffffff'}
                    intensity={light.intensity || 0.8}
                  />
                );
              case 'point':
                return (
                  <pointLight
                    key={index}
                    position={light.position || [0, 1, 0]}
                    color={light.color || '#ffffff'}
                    intensity={light.intensity || 1}
                  />
                );
              case 'spot':
                return (
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
            <Environment preset="sunset" background={sceneConfig.scene.background?.color} />
          )}

          {/* Avatar */}
          <AvatarV2
            config={sceneConfig}
            visemes={visemes}
            audioUrl={audioUrl}
            onAnimationComplete={onAnimationComplete}
            onError={onError}
          />

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

