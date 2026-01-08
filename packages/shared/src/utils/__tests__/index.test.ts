import { describe, it, expect } from 'vitest';
import { sleep, retry, formatBytes, sanitizeFilename, generateId, isValidEmail } from '../index';

describe('sleep', () => {
  it('should wait for specified milliseconds', async () => {
    const start = Date.now();
    await sleep(100);
    const duration = Date.now() - start;
    expect(duration).toBeGreaterThanOrEqual(90);
    expect(duration).toBeLessThan(150);
  });
});

describe('retry', () => {
  it('should retry on failure', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Fail');
      }
      return 'success';
    };
    const result = await retry(fn, 3, 10);
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should throw error after max retries', async () => {
    const fn = async () => {
      throw new Error('Persistent failure');
    };
    await expect(retry(fn, 2, 10)).rejects.toThrow('Persistent failure');
  });
});

describe('formatBytes', () => {
  it('should format bytes', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });
});

describe('sanitizeFilename', () => {
  it('should sanitize filename', () => {
    // sanitizeFilename entfernt alle nicht-alphanumerischen Zeichen außer Bindestrich
    // Der Punkt wird auch entfernt, daher wird .txt zu _txt
    expect(sanitizeFilename('test file.txt')).toContain('test');
    expect(sanitizeFilename('test file.txt')).toContain('file');
    expect(sanitizeFilename('test file.txt')).not.toContain(' ');
    expect(sanitizeFilename('Test@File#123.txt')).toContain('test');
    expect(sanitizeFilename('Test@File#123.txt')).toContain('file');
    expect(sanitizeFilename('Test@File#123.txt')).toContain('123');
  });
});

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
  });
});

describe('isValidEmail', () => {
  it('should validate correct email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
  });
});
