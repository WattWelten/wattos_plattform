import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsArray()
  permissions?: string[];
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  permissions?: string[];
}

export class AssignRoleDto {
  @IsString()
  userId!: string;

  @IsString()
  roleId!: string;
}


