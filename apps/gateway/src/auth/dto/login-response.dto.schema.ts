/**
 * Zod Schema für LoginResponseDto
 */

import { z } from 'zod';

export const LoginResponseDtoSchema = z.object({
  access_token: z.string().min(1, 'Access token is required'),
  token_type: z.string().default('Bearer'),
  expires_in: z.number().int().positive(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    username: z.string().min(1),
  }),
});

export type LoginResponseDtoType = z.infer<typeof LoginResponseDtoSchema>;



