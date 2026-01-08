import { describe, it, expect } from 'vitest';
import { sanitizeToolSchema, convertToOpenAIToolFormat, validateToolSerialization, validateRequestWithTools } from '../tool-serializer';

describe('sanitizeToolSchema', () => {
  it('should return default schema for null/undefined', () => {
    expect(sanitizeToolSchema(null)).toEqual({ type: 'object', properties: {} });
    expect(sanitizeToolSchema(undefined)).toEqual({ type: 'object', properties: {} });
  });

  it('should sanitize valid schema', () => {
    const schema = { type: 'object', properties: { name: { type: 'string' } } };
    const result = sanitizeToolSchema(schema);
    expect(result).toHaveProperty('type', 'object');
    expect(result).toHaveProperty('properties');
  });

  it('should remove functions from schema', () => {
    const schema = { type: 'object', properties: { func: () => {} } };
    const result = sanitizeToolSchema(schema);
    expect(result.properties).not.toHaveProperty('func');
  });

  it('should handle circular references', () => {
    const schema: any = { type: 'object', properties: {} };
    schema.self = schema;
    const result = sanitizeToolSchema(schema);
    expect(result).toHaveProperty('type', 'object');
  });
});

describe('convertToOpenAIToolFormat', () => {
  it('should convert ToolDefinition to OpenAI format', () => {
    const tools = [{
      id: 'test',
      name: 'testTool',
      description: 'Test tool',
      schema: { type: 'object', properties: {} }
    }];
    const result = convertToOpenAIToolFormat(tools);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('type', 'function');
    expect(result[0].function).toHaveProperty('name', 'testTool');
  });

  it('should return empty array for invalid tools', () => {
    expect(convertToOpenAIToolFormat([])).toEqual([]);
    expect(convertToOpenAIToolFormat(null as any)).toEqual([]);
  });
});

describe('validateToolSerialization', () => {
  it('should return true for valid tools', () => {
    const tools = [{
      id: 'test',
      name: 'testTool',
      description: 'Test',
      schema: { type: 'object', properties: {} }
    }];
    expect(validateToolSerialization(tools)).toBe(true);
  });

  it('should return false for invalid tools', () => {
    expect(validateToolSerialization(null as any)).toBe(false);
  });
});

describe('validateRequestWithTools', () => {
  it('should return true for valid request', () => {
    const request = {
      tools: [{
        id: 'test',
        name: 'testTool',
        schema: { type: 'object', properties: {} }
      }]
    };
    expect(validateRequestWithTools(request)).toBe(true);
  });

  it('should return false for invalid request', () => {
    expect(validateRequestWithTools(null as any)).toBe(false);
  });
});
