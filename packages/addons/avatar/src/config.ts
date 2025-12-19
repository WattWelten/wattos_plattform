/**
 * Avatar Addon Configuration
 */
export interface AvatarConfig {
  avatarRepoUrl?: string;
  avaturnApiKey?: string;
  avaturnApiUrl?: string;
  quality: {
    textureResolution: '1K' | '2K' | '4K';
    enablePBR: boolean;
    targetFPS: number;
  };
  processing: {
    enableCaching: boolean;
    cacheTTL: number;
    maxConcurrentProcessing: number;
  };
}

export const defaultAvatarConfig: AvatarConfig = {
  avatarRepoUrl: process.env.AVATAR_REPO_URL || 'https://api.avatar-repo.com',
  avaturnApiKey: process.env.AVATURN_API_KEY,
  avaturnApiUrl: process.env.AVATURN_API_URL || 'https://api.avaturn.me',
  quality: {
    textureResolution: '4K',
    enablePBR: true,
    targetFPS: 60,
  },
  processing: {
    enableCaching: true,
    cacheTTL: 3600000, // 1 Stunde
    maxConcurrentProcessing: 3,
  },
};


