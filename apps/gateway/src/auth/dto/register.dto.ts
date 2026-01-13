import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsEnum } from 'class-validator';

export enum TenantType {
  KMU = 'kmu',
  SCHULE = 'schule',
  VERWALTUNG = 'verwaltung',
}

export class RegisterDto {
  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'User password',
    example: 'securePassword123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({
    description: 'Tenant type',
    enum: TenantType,
    example: TenantType.KMU,
  })
  @IsEnum(TenantType)
  @IsNotEmpty()
  tenantType!: TenantType;
}
