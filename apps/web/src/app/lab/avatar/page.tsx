'use client';

import { useState } from 'react';
import { AvatarScene } from '@/components/avatar/AvatarScene';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Avatar Lab Page
 * 
 * Test-Seite für Avatar-Morphs und Visemes
 */
export default function AvatarLabPage() {
  const [fps, setFps] = useState(0);
  const [activeViseme, setActiveViseme] = useState<string | null>(null);

  // Viseme-Namen für Tests
  const visemes = [
    'viseme_aa',
    'viseme_pp',
    'viseme_ff',
    'viseme_th',
    'viseme_dd',
    'viseme_kk',
    'viseme_ch',
    'viseme_ii',
    'viseme_oo',
    'viseme_uu',
    'viseme_ee',
    'viseme_ss',
    'viseme_nn',
    'viseme_rr',
    'viseme_mm',
  ];

  // Test-Funktion für Visemes
  const testViseme = (visemeName: string) => {
    if (typeof window !== 'undefined' && (window as any).testViseme) {
      (window as any).testViseme(visemeName, 1.0);
      setActiveViseme(visemeName);
      setTimeout(() => setActiveViseme(null), 2000);
    } else {
      console.warn('testViseme function not available. Make sure Avatar is loaded.');
    }
  };

  // FPS-Counter (vereinfacht)
  const updateFPS = () => {
    let lastTime = performance.now();
    let frameCount = 0;
    const countFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      if (currentTime >= lastTime + 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }
      requestAnimationFrame(countFPS);
    };
    countFPS();
  };

  useState(() => {
    updateFPS();
  });

  // Default Avatar-Config
  const defaultConfig = {
    agentId: 'lab-avatar',
    model: {
      type: 'gltf' as const,
      url: '/models/Kaya_original.glb', // Anpassen falls nötig
      fallback: 'box' as const,
    },
    scene: {
      camera: {
        position: [0, 1.6, 3] as [number, number, number],
        target: [0, 1.6, 0] as [number, number, number],
        fov: 50,
      },
      lights: [
        {
          type: 'ambient' as const,
          color: '#ffffff',
          intensity: 0.5,
        },
        {
          type: 'directional' as const,
          position: [5, 5, 5] as [number, number, number],
          color: '#ffffff',
          intensity: 0.8,
        },
      ],
      background: {
        color: '#1a1a1a',
      },
    },
    avatar: {
      position: [0, 0, 0] as [number, number, number],
      scale: [1, 1, 1] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      animations: {
        idle: {
          enabled: true,
          animation: 'idle',
        },
      },
    },
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar mit Controls */}
      <aside className="w-80 border-r border-gray-700 bg-gray-800 p-4 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">Avatar Lab</h1>
        
        {/* FPS Counter */}
        <Card className="mb-4 bg-gray-700 border-gray-600">
          <CardHeader>
            <CardTitle className="text-sm">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fps} <span className="text-sm text-gray-400">FPS</span>
            </div>
          </CardContent>
        </Card>

        {/* Viseme Tests */}
        <Card className="mb-4 bg-gray-700 border-gray-600">
          <CardHeader>
            <CardTitle className="text-sm">Viseme Tests</CardTitle>
            <CardDescription className="text-gray-400">
              Klicke auf einen Viseme-Button, um ihn zu testen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {visemes.map((viseme) => (
                <Button
                  key={viseme}
                  variant={activeViseme === viseme ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => testViseme(viseme)}
                  className="text-xs"
                >
                  {viseme.replace('viseme_', '')}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card className="bg-gray-700 border-gray-600">
          <CardHeader>
            <CardTitle className="text-sm">Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-400 mb-2">
              Öffne die Browser-Konsole und verwende:
            </p>
            <code className="block text-xs bg-gray-800 p-2 rounded mb-2">
              testViseme('viseme_aa')
            </code>
            <code className="block text-xs bg-gray-800 p-2 rounded">
              testViseme('viseme_pp')
            </code>
          </CardContent>
        </Card>
      </aside>

      {/* Main Avatar View */}
      <main className="flex-1 relative">
        <div className="absolute inset-0">
          <AvatarScene
            sceneConfig={defaultConfig}
            enableControls={true}
            enableEnvironment={true}
          />
        </div>
        
        {/* Overlay Info */}
        <div className="absolute top-4 left-4 bg-black/50 px-3 py-2 rounded text-sm">
          <div>9:16 Layout</div>
          <div className="text-xs text-gray-400">Desktop: ≥45 FPS, Mobile: ≥30 FPS</div>
        </div>
      </main>
    </div>
  );
}

