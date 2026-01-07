/**
 * Lab Route für Testing
 * 
 * Test-Umgebung für Avatar, Visemes, Chat-Features
 */

'use client';

import { useState } from 'react';
import { AvatarScene } from '@/components/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AvatarV2SceneConfig } from '@/components/avatar/types';

export default function LabPage() {
  const [visemes, setVisemes] = useState<Array<{ viseme: string; timestamp: number; weight: number }>>([]);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);

  // Test Avatar Config
  const avatarConfig: AvatarV2SceneConfig = {
    agentId: 'test-agent',
    model: {
      type: 'gltf' as const,
      url: '/models/default-avatar.gltf',
    },
    avatar: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      animations: { idle: { enabled: true, animation: 'idle' } },
    },
    scene: {
      camera: {
        position: [0, 1.6, 5],
        target: [0, 1.6, 0],
        fov: 50,
      },
      lights: [
        { type: 'ambient', intensity: 0.5 },
        { type: 'directional', position: [5, 5, 5], intensity: 1 },
      ],
      background: { color: '#f3f4f6' },
    },
  };

  // Test Visemes generieren
  const generateTestVisemes = () => {
    const testVisemes: Array<{ viseme: string; timestamp: number; weight: number }> = [];
    const visemeTypes = ['MBP', 'FV', 'TH', 'AA', 'PP', 'II', 'UU', 'EE', 'OO'];
    
    for (let i = 0; i < 50; i++) {
      testVisemes.push({
        viseme: visemeTypes[i % visemeTypes.length] || 'AA',
        timestamp: i * 100, // 100ms intervals
        weight: 0.5 + Math.random() * 0.5, // 0.5-1.0
      });
    }
    
    setVisemes(testVisemes);
  };

  // Test Audio laden
  const handleTestAudio = () => {
    // Placeholder: In Production würde hier eine echte Audio-URL verwendet
    setAudioUrl('/audio/test-tts.mp3');
    setIsPlaying(true);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Lab - Testing Environment</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Avatar Test Area */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Avatar Test</h2>
          <div className="aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden mb-4">
            <AvatarScene
              sceneConfig={avatarConfig}
              {...(visemes.length > 0 ? { visemes: visemes.map(v => v.weight) } : {})}
              {...(audioUrl !== undefined && { audioUrl })}
              enableControls={true}
              enableEnvironment={true}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={generateTestVisemes}>Test Visemes generieren</Button>
            <Button onClick={handleTestAudio} disabled={isPlaying}>
              Test Audio abspielen
            </Button>
          </div>
        </Card>

        {/* Viseme Debug Info */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Viseme Debug</h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Visemes: {visemes.length}
            </p>
            {visemes.length > 0 && (
              <div className="max-h-64 overflow-y-auto">
                <pre className="text-xs bg-gray-50 p-2 rounded">
                  {JSON.stringify(visemes.slice(0, 10), null, 2)}
                  {visemes.length > 10 && '...'}
                </pre>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Console Instructions */}
      <Card className="p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">Dev Console Commands</h2>
        <div className="space-y-2 text-sm">
          <p>
            <code className="bg-gray-100 px-2 py-1 rounded">testViseme('viseme_aa', 1.0)</code> - Test einzelner Viseme
          </p>
          <p>
            <code className="bg-gray-100 px-2 py-1 rounded">testViseme('viseme_pp', 0.8)</code> - Test Viseme mit Gewichtung
          </p>
          <p>
            <code className="bg-gray-100 px-2 py-1 rounded">testViseme('viseme_th', 0.5)</code> - Test TH-Viseme
          </p>
        </div>
      </Card>
    </div>
  );
}

