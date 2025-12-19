import { IsString, IsOptional } from 'class-validator';

export class CreateChatDto {
  @IsString()
  userId: string;

  @IsString()
  tenantId: string;

  @IsOptional()
  @IsString()
  title?: string;
}


