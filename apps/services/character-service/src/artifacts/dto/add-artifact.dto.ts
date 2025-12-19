import { IsString, IsOptional } from 'class-validator';

export class AddArtifactDto {
  @IsString()
  character: string; // role

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  url: string;

  @IsString()
  @IsOptional()
  storage_type?: string; // local | s3 | url
}

