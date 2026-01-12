/**
 * Request Interfaces für Type-Safety
 */

import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  tenantId?: string;
  [key: string]: any;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  tenantId?: string;
}
