import { describe, it, expect } from 'vitest';
import { safeJsonParse, safeJsonStringify, safeJsonParseWithSchema } from '../safe-json';
import { z } from 'zod';

describe('safeJsonParse', () => {
  it('should parse valid JSON', () => {
    const result = safeJsonParse('{\"key\":\"value\"}');
    expect(result).toEqual({ key: 'value' });
  });

  it('should return fallback on parse error', () => {
    const result = safeJsonParse('invalid json', { fallback: { error: true } });
    expect(result).toEqual({ error: true });
  });

  it('should throw error in strict mode', () => {
    expect(() => {
      safeJsonParse('invalid json', { strict: true });
    }).toThrow();
  });

  it('should reject JSON exceeding maxLength', () => {
    const longJson = '{\"key\":\"' + 'x'.repeat(10_000_001) + '\"}';
    const result = safeJsonParse(longJson, { maxLength: 10_000_000, fallback: { tooLong: true } });
    expect(result).toEqual({ tooLong: true });
  });
});

describe('safeJsonStringify', () => {
  it('should stringify objects', () => {
    const result = safeJsonStringify({ key: 'value' });
    expect(result).toBe('{\"key\":\"value\"}');
  });

  it('should return fallback on stringify error', () => {
    const circular: any = {};
    circular.self = circular;
    const result = safeJsonStringify(circular, { fallback: 'circular error' });
    expect(result).toBe('circular error');
  });

  it('should throw error in strict mode', () => {
    const circular: any = {};
    circular.self = circular;
    expect(() => {
      safeJsonStringify(circular, { strict: true });
    }).toThrow();
  });
});

describe('safeJsonParseWithSchema', () => {
  const testSchema = z.object({
    name: z.string(),
    age: z.number(),
  });

  it('should parse and validate JSON with schema', () => {
    const json = '{\"name\":\"John\",\"age\":30}';
    const result = safeJsonParseWithSchema(json, testSchema);
    expect(result).toEqual({ name: 'John', age: 30 });
  });

  it('should throw error on invalid schema', () => {
    const json = '{\"name\":\"John\",\"age\":\"30\"}';
    expect(() => {
      safeJsonParseWithSchema(json, testSchema);
    }).toThrow();
  });
});
