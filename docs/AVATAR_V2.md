# Avatar V2 Dokumentation

## Übersicht

Avatar V2 ist eine **Three.js/R3F (React Three Fiber)**-basierte Avatar-Implementierung für WattOS V2. Sie ersetzt die bisherige Babylon.js-basierte Lösung und bietet bessere Performance, Flexibilität und React-Integration.

## Morph-Handling & Visemes

### Morph-Targets aktivieren

Nach GLB-Load werden automatisch alle Materialien morph-fähig gemacht:

```typescript
import { enableMorphTargets } from '@/components/avatar/morph-handler';

// Materialien konfigurieren
enableMorphTargets(scene);
// → morphTargets: true
// → morphNormals: true
// → skinning: true
```

### Viseme-Mapping

15+ Visemes werden unterstützt:

- **viseme_aa** - Offener Mund
- **viseme_pp** - Geschlossener Mund
- **viseme_ff** - Unterlippe bei Zähnen
- **viseme_th** - Zunge sichtbar
- **viseme_dd** - Zungenspitze
- **viseme_kk** - Gaumen
- **viseme_ch** - Zischlaute
- **viseme_ii, viseme_oo, viseme_uu, viseme_ee** - Vokale
- **viseme_ss, viseme_nn, viseme_rr, viseme_mm** - Konsonanten

### Head/Teeth/Tongue-Lookup

Visemes werden mit Mesh-Gewichtung angewendet:

```typescript
const MESH_WEIGHTS = {
  viseme_pp: [1.0, 0.1, 0.0],  // Head, Teeth, Tongue
  viseme_th: [0.7, 0.0, 0.3],  // Zunge sichtbar
  // ...
};
```

### Decay/Glättung

Morph-Targets werden automatisch geglättet:

```typescript
decayAll(scene, delta, lambda = 12); // λ≈12 für moderate Glättung
```

### Dev-Tests

In der Browser-Konsole:

```javascript
testViseme('viseme_aa');  // Mund öffnen
testViseme('viseme_pp');  // Mund schließen
testViseme('viseme_th');  // Zunge zeigen
```

### Lab-Route

QA-Seite für Avatar-Tests: `/lab/avatar`

- FPS-Counter
- Viseme-Buttons für alle 15 Visemes
- Performance-Overlay
- Dev-Konsole-Tests

## Architektur

### Three.js/R3F Stack

```
Avatar V2 Service → TTS Service → Audio + Visemes → Scene Config → Frontend (R3F)
```

### Komponenten

1. **AvatarV2Service** - Backend-Service für Avatar-Generierung
2. **TTS-Integration** - Text-to-Speech für Audio-Generierung
3. **Viseme-Generierung** - Lip-Sync-Daten aus Audio
4. **Scene-Config** - Three.js/R3F Scene-Konfiguration
5. **Event-basierte Kommunikation** - Avatar-Events über Event-Bus

## Avatar V2 Service

### Funktionen

#### 1. Avatar generieren

```typescript
const response = await avatarV2Service.generateAvatar(agentId, text, {
  voiceId: 'default',
  language: 'de',
  generateVisemes: true,
});

// Response:
// {
//   agentId: 'agent-123',
//   audioUrl: 'data:audio/mpeg;base64,...',
//   audioData: Buffer,
//   sceneConfig: AvatarV2SceneConfig,
//   visemes: [0.1, 0.2, ...],
//   metadata: { text, voiceId, language }
// }
```

#### 2. Scene Config abrufen

```typescript
const sceneConfig = await avatarV2Service.getSceneConfig(agentId);
```

#### 3. Scene Config aktualisieren

```typescript
const updated = await avatarV2Service.updateSceneConfig(agentId, {
  avatar: {
    position: [0, 1, 0],
    material: {
      color: '#ff0000',
    },
  },
});
```

#### 4. Animationen steuern

```typescript
// Animation starten
await avatarV2Service.startAnimation(agentId, 'speech', {
  duration: 5000,
  loop: false,
});

// Animation beenden
await avatarV2Service.stopAnimation(agentId);
```

## Scene Configuration

### Struktur

```typescript
interface AvatarV2SceneConfig {
  agentId: string;
  model: {
    type: 'gltf' | 'fbx' | 'obj' | 'primitive';
    url?: string;
    fallback?: 'box' | 'sphere' | 'plane';
  };
  scene: {
    camera: {
      position: [number, number, number];
      target: [number, number, number];
      fov: number;
    };
    lights: Array<{
      type: 'ambient' | 'directional' | 'point' | 'spot';
      position?: [number, number, number];
      color?: string;
      intensity?: number;
    }>;
    background?: {
      color?: string;
      environment?: string;
    };
  };
  avatar: {
    position: [number, number, number];
    scale: [number, number, number];
    rotation: [number, number, number];
    material?: {
      type: 'standard' | 'physical' | 'toon';
      color?: string;
      metalness?: number;
      roughness?: number;
    };
    animations?: {
      lipSync?: {
        enabled: boolean;
        property: string;
        range: [number, number];
      };
      gestures?: {
        enabled: boolean;
        types: string[];
      };
      idle?: {
        enabled: boolean;
        animation: string;
      };
    };
  };
}
```

### Beispiel-Konfiguration

```typescript
{
  agentId: 'agent-123',
  model: {
    type: 'gltf',
    url: 'https://example.com/avatar.gltf',
    fallback: 'box',
  },
  scene: {
    camera: {
      position: [0, 2, -5],
      target: [0, 0, 0],
      fov: 50,
    },
    lights: [
      {
        type: 'ambient',
        color: '#ffffff',
        intensity: 0.5,
      },
      {
        type: 'directional',
        position: [-1, 1, -1],
        color: '#ffffff',
        intensity: 0.8,
      },
    ],
    background: {
      color: '#1a1a2e',
    },
  },
  avatar: {
    position: [0, 0, 0],
    scale: [1, 1, 1],
    rotation: [0, 0, 0],
    material: {
      type: 'standard',
      color: '#4a90e2',
      metalness: 0.3,
      roughness: 0.7,
    },
    animations: {
      lipSync: {
        enabled: true,
        property: 'mouthOpen',
        range: [0, 0.1],
      },
      gestures: {
        enabled: true,
        types: ['nod', 'shake', 'point'],
      },
      idle: {
        enabled: true,
        animation: 'breathing',
      },
    },
  },
}
```

## Frontend-Integration (R3F)

### React Three Fiber Component

```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Avatar } from './Avatar';

function AvatarScene({ sceneConfig, audioUrl, visemes }) {
  return (
    <Canvas camera={{ position: sceneConfig.scene.camera.position, fov: sceneConfig.scene.camera.fov }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[-1, 1, -1]} intensity={0.8} />
      <Environment preset="sunset" />
      <Avatar config={sceneConfig.avatar} visemes={visemes} />
      <OrbitControls target={sceneConfig.scene.camera.target} />
    </Canvas>
  );
}
```

### Avatar Component

```tsx
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

function Avatar({ config, visemes }) {
  const { scene } = useGLTF(config.model.url || '/default-avatar.gltf');
  const meshRef = useRef();

  // Lip-Sync Animation
  useFrame(() => {
    if (visemes && visemes.length > 0) {
      const currentViseme = visemes[Math.floor(Date.now() / 100) % visemes.length];
      meshRef.current.morphTargetInfluences[0] = currentViseme;
    }
  });

  return (
    <primitive
      ref={meshRef}
      object={scene}
      position={config.position}
      scale={config.scale}
      rotation={config.rotation}
    />
  );
}
```

## Event-basierte Kommunikation

### Avatar-Events

- `avatar.animation.started` - Animation gestartet
- `avatar.animation.completed` - Animation abgeschlossen
- `avatar.lip-sync.updated` - Lip-Sync aktualisiert

### Event-Payload

```typescript
{
  id: 'event-uuid',
  type: 'avatar.animation.started',
  domain: 'avatar',
  action: 'animation.started',
  timestamp: 1234567890,
  sessionId: 'session-123',
  tenantId: 'tenant-123',
  payload: {
    animationType: 'speech',
    audioData: Buffer,
    visemeData: [0.1, 0.2, ...],
  },
  metadata: {
    agentId: 'agent-123',
    text: 'Hello, world!',
  },
}
```

## Integration mit Media-Agent

Der Media-Agent nutzt Avatar V2 für Avatar-Generierung:

```typescript
// Media-Agent
async generateAvatarV2(agentId: string, text: string) {
  return await this.avatarV2Service.generateAvatar(agentId, text);
}
```

## Migration von Babylon.js

### Unterschiede

| Feature | Babylon.js | Three.js/R3F |
|---------|------------|--------------|
| Rendering | Canvas/WebGL | WebGL (via R3F) |
| React-Integration | Extern | Native (R3F) |
| Scene-Config | JSON | TypeScript Interface |
| Performance | Gut | Sehr gut |
| Community | Groß | Sehr groß |

### Migration-Schritte

1. **Scene-Config migrieren**: Babylon.js Config → Three.js/R3F Config
2. **Frontend-Komponenten**: Babylon.js → React Three Fiber
3. **Event-Handling**: Unverändert (Event-Bus)
4. **TTS-Integration**: Unverändert

## Best Practices

### 1. Scene-Config Caching

Scene-Configs werden gecacht:

```typescript
// Config wird einmal geladen und gecacht
const config = await avatarV2Service.getSceneConfig(agentId);
```

### 2. Viseme-Optimierung

Visemes sollten optimiert werden:

```typescript
// Visemes nur generieren wenn nötig
const response = await avatarV2Service.generateAvatar(agentId, text, {
  generateVisemes: true, // Nur wenn Lip-Sync benötigt
});
```

### 3. Animation-Performance

Animationen sollten effizient sein:

```typescript
// Kurze Animationen für bessere Performance
await avatarV2Service.startAnimation(agentId, 'speech', {
  duration: 5000, // Max. 5 Sekunden
  loop: false,
});
```

## Weiterführende Dokumentation

- [Core Platform](./WATTOS_V2_CORE_PLATFORM.md)
- [Multimodal Runtime](./packages/core/src/multimodal/)
- [Media-Agent](./AGENTS_IMPLEMENTATION.md#4-media-agent)
- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)

