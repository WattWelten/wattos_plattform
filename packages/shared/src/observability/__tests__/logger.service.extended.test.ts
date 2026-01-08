import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StructuredLoggerService } from '../logger.service';
import { ConfigService } from '@nestjs/config';

// Mock pino
const mockPinoLogger = {
  child: vi.fn().mockReturnThis(),
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  trace: vi.fn(),
};

vi.mock('pino', () => {
  const mockIsoTime = () => "[" + new Date().toISOString() + "]";
  return {
    default: vi.fn(() => mockPinoLogger),
    stdTimeFunctions: {
      isoTime: mockIsoTime,
    },
  };
});


describe.skip('StructuredLoggerService - Extended Tests', () => {
  // Tests will be added here
});