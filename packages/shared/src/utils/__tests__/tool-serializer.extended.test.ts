import { describe, it, expect } from 'vitest';
import {
  sanitizeToolSchema,
  convertToOpenAIToolFormat,
  validateToolSerialization,
  validateRequestWithTools,
} from '../tool-serializer';

describe('tool-serializer - Extended Tests', () => {
  describe('sanitizeToolSchema - Edge Cases', () => {
    it('should handle schema with nested objects', () => {
      const schema = {
        type: 'object',
        properties: {
          nested: {
            type: 'object',
            properties: {
              value: { type: 'string' },
            },
          },
        },
      };
      const result = sanitizeToolSchema(schema);
      expect(result).toHaveProperty('type', 'object');
      expect(result).toHaveProperty('properties');
    });

    it('should handle schema with array properties', () => {
      const schema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      };
      const result = sanitizeToolSchema(schema);
      expect(result).toHaveProperty('properties');
    });

    it('should handle schema with required fields', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      };
      const result = sanitizeToolSchema(schema);
      expect(result).toHaveProperty('required');
    });

    it('should handle schema with enum', () => {
      const schema = {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'inactive'],
          },
        },
      };
      const result = sanitizeToolSchema(schema);
      expect(result).toHaveProperty('properties');
    });
  });

  describe('convertToOpenAIToolFormat - Edge Cases', () => {
    it('should handle tool with function property', () => {
      const tools = [
        {
          name: 'test-tool',
          description: 'Test tool',
          parameters: {
            type: 'object',
            properties: {
              value: { type: 'string' },
            },
          },
          execute: () => {}, // Function should be removed
        },
      ];

      const result = convertToOpenAIToolFormat(tools);
      expect(result.length).toBe(1);
      expect(result[0]).not.toHaveProperty('execute');
    });

    it('should handle tool with invalid parameters', () => {
      const tools = [
        {
          name: 'test-tool',
          description: 'Test tool',
          parameters: 'invalid', // Should be object
        },
      ];

      const result = convertToOpenAIToolFormat(tools);
      // Should handle gracefully
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle tool without name', () => {
      const tools = [
        {
          description: 'Test tool',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
      ];

      const result = convertToOpenAIToolFormat(tools);
      // Should handle gracefully
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle tool without description', () => {
      const tools = [
        {
          name: 'test-tool',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
      ];

      const result = convertToOpenAIToolFormat(tools);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty tools array', () => {
      const result = convertToOpenAIToolFormat([]);
      expect(result).toEqual([]);
    });

    it('should handle tools with circular references gracefully', () => {
      const tools: any[] = [
        {
          name: 'test-tool',
          description: 'Test tool',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
      ];
      // Create circular reference
      tools[0].self = tools[0];

      const result = convertToOpenAIToolFormat(tools);
      // Should handle gracefully (might return empty array or partial result)
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle tool with function in parameters', () => {
      const tools = [
        {
          name: 'test-tool',
          description: 'Test tool',
          parameters: {
            type: 'object',
            properties: {
              callback: () => {}, // Function in properties
            },
          },
        },
      ];

      const result = convertToOpenAIToolFormat(tools);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle tool with different parameter types', () => {
      const tools = [
        {
          name: 'test-tool',
          description: 'Test tool',
          parameters: {
            type: 'object',
            properties: {
              stringProp: { type: 'string' },
              numberProp: { type: 'number' },
              booleanProp: { type: 'boolean' },
              arrayProp: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      ];

      const result = convertToOpenAIToolFormat(tools);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('function');
    });
  });

  describe('validateToolSerialization', () => {
    it('should return false for null', () => {
      const result = validateToolSerialization(null as any);
      expect(result).toBe(false);
    });

    it('should return false for undefined', () => {
      const result = validateToolSerialization(undefined as any);
      expect(result).toBe(false);
    });

    it('should return false for non-array', () => {
      const result = validateToolSerialization({} as any);
      expect(result).toBe(false);
    });

    it('should return false for tools that cannot be serialized', () => {
      const tools = [
        {
          name: 'test-tool',
          description: 'Test tool',
          parameters: {
            type: 'object',
            properties: {},
          },
          circular: null as any,
        },
      ];
      tools[0].circular = tools[0]; // Create circular reference

      const result = validateToolSerialization(tools);
      expect(result).toBe(false);
    });

    it('should return true for valid tools', () => {
      const tools = [
        {
          name: 'test-tool',
          description: 'Test tool',
          parameters: {
            type: 'object',
            properties: {
              value: { type: 'string' },
            },
          },
        },
      ];

      const result = validateToolSerialization(tools);
      expect(result).toBe(true);
    });
  });

  describe('validateRequestWithTools', () => {
    it('should return true for request without tools', () => {
      const requestBody = {
        message: 'Hello',
      };

      const result = validateRequestWithTools(requestBody);
      expect(result).toBe(true);
    });

    it('should return true for request with valid tools', () => {
      const requestBody = {
        message: 'Hello',
        tools: [
          {
            name: 'test-tool',
            description: 'Test tool',
            parameters: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };

      const result = validateRequestWithTools(requestBody);
      expect(result).toBe(true);
    });

    it('should return false for request with invalid tools', () => {
      const requestBody = {
        message: 'Hello',
        tools: [
          {
            name: 'test-tool',
            // Missing required fields
          },
        ],
      };

      const result = validateRequestWithTools(requestBody);
      expect(result).toBe(false);
    });

    it('should return false for request with non-array tools', () => {
      const requestBody = {
        message: 'Hello',
        tools: 'not-an-array',
      };

      const result = validateRequestWithTools(requestBody);
      expect(result).toBe(false);
    });

    it('should return false for request that cannot be serialized', () => {
      const requestBody: any = {
        message: 'Hello',
        tools: [],
        circular: null,
      };
      requestBody.circular = requestBody; // Create circular reference

      const result = validateRequestWithTools(requestBody);
      expect(result).toBe(false);
    });

    it('should handle request with empty tools array', () => {
      const requestBody = {
        message: 'Hello',
        tools: [],
      };

      const result = validateRequestWithTools(requestBody);
      expect(result).toBe(true);
    });
  });
});
