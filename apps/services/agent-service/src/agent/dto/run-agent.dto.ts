import { IsString, IsOptional } from 'class-validator';

export class RunAgentDto {
  @IsString()
  input: string;

  @IsOptional()
  @IsString()
  userId?: string;
}


