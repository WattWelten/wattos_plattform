export interface VideoResponseDto {
  id: string;
  tenantId: string;
  avatarId: string;
  agentId?: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  fileSize: number;
  format: string;
  resolution: string;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
