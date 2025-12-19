import { IsString, IsNotEmpty } from 'class-validator';

export class DefineCharacterDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  prompt: string;
}


