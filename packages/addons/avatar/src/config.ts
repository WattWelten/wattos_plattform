/**
 * Avatar Configuration
 */

export interface AvatarConfig {
  avatarRepoUrl?: string;
  avaturnApiUrl?: string;
  avaturnApiKey?: string;
  enableMorphs: boolean;
  enableRigs: boolean;
  defaultQuality: 'standard' | 'premium';
  quality?: {
    textureResolution: string;
    enablePBR: boolean;
  };
}

export const defaultAvatarConfig: AvatarConfig = {
  enableMorphs: true,
  enableRigs: true,
  defaultQuality: 'premium',
  quality: {
    textureResolution: '2K',
    enablePBR: true,
  },
};

