import { IsString, IsOptional, IsObject, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CreateVideoDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  avatarId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  agentId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
