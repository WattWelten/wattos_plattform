/**
 * Zod Validation Pipe für NestJS
 * 
 * Validiert Request-Bodies mit Zod-Schemas
 */

import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError, ZodIssue } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: ZodIssue) => ({
          path: err.path.map(String).join('.'),
          message: err.message,
        }));
        
        throw new BadRequestException({
          message: 'Validation failed',
          errors,
        });
      }
      
      throw new BadRequestException('Invalid request data');
    }
  }
}

