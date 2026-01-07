/**
 * Zod Schema für LoginDto
 */

import { z } from 'zod';

export const LoginDtoSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(255, 'Username must not exceed 255 characters')
    .refine(
      (val: string) => {
        // Sanitize: Entferne gefährliche Zeichen
        return !/[<>\"'&]/.test(val);
      },
      { message: 'Username contains invalid characters' }
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
});

export type LoginDtoType = z.infer<typeof LoginDtoSchema>;
