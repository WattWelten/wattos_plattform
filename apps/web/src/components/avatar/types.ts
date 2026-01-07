/**
 * Avatar V2 Types
 */

export interface AvatarV2SceneConfig {
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
      normalMap?: string;
      aoMap?: string;
    };
    animations?: {
      lipSync?: {
        enabled: boolean;
        property: string;
        range: [number, number];
        smoothness?: number;
        precision?: number;
      };
      gestures?: {
        enabled: boolean;
        types: string[];
        smoothness?: number;
      };
      idle?: {
        enabled: boolean;
        animation: string;
        loop?: boolean;
      };
      expressions?: {
        enabled: boolean;
        types: string[];
      };
    };
  };
  quality?: {
    textureResolution?: '1k' | '2k' | '4k';
    enablePBR?: boolean;
    targetFPS?: number;
  };
  renderSettings?: {
    antialiasing?: boolean;
    shadowMap?: boolean;
    toneMapping?: string;
  };
}

export interface AvatarV2Props {
  config: AvatarV2SceneConfig;
  visemes?: number[];
  audioUrl?: string;
  onAnimationComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface AvatarSceneProps {
  sceneConfig: AvatarV2SceneConfig;
  visemes?: number[] | undefined;
  audioUrl?: string | undefined;
  onAnimationComplete?: (() => void) | undefined;
  onError?: ((error: Error) => void) | undefined;
  enableControls?: boolean | undefined;
  enableEnvironment?: boolean | undefined;
  className?: string | undefined;
}

export interface AvatarV2ContainerProps {
  agentId: string;
  text?: string;
  voiceId?: string;
  onAnimationComplete?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  enableControls?: boolean;
  enableEnvironment?: boolean;
}
