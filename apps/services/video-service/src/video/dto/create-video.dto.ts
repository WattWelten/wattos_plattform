import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateVideoDto {
  @IsString()
  tenantId: string;

  @IsString()
  avatarId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  agentId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
