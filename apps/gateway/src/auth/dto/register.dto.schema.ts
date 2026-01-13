/**
 * Zod Schema für RegisterDto
 */

import { z } from 'zod';

export enum TenantType {
  KMU = 'kmu',
  SCHULE = 'schule',
  VERWALTUNG = 'verwaltung',
}

export const RegisterDtoSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must not exceed 255 characters')
    .refine(
      (val: string) => {
        // Sanitize: Entferne gefährliche Zeichen
        return !/[<>\"'&]/.test(val);
      },
      { message: 'Name contains invalid characters' }
    ),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must not exceed 255 characters')
    .refine(
      (val: string) => {
        // Sanitize: Entferne gefährliche Zeichen
        return !/[<>\"'&]/.test(val);
      },
      { message: 'Email contains invalid characters' }
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
  tenantType: z.nativeEnum(TenantType),
});

export type RegisterDtoType = z.infer<typeof RegisterDtoSchema>;
