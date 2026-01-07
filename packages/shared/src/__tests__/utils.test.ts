import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sleep, retry, formatBytes, sanitizeFilename, generateId, isValidEmail } from '../utils';

describe('Utils', () => {
  describe('sleep', () => {
    it('should wait for specified milliseconds', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();
      const elapsed = end - start;

      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some margin
      expect(elapsed).toBeLessThan(150);
    });

    it('should return a promise', () => {
      const result = sleep(10);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('retry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await retry(fn, 3, 100);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');

      const resultPromise = retry(fn, 3, 100);

      // Fast-forward time for retry delay
      await vi.advanceTimersByTimeAsync(100);

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries', async () => {
      const error = new Error('persistent failure');
      const fn = vi.fn().mockRejectedValue(error);

      const resultPromise = retry(fn, 2, 100);

      // Fast-forward time for all retries
      await vi.advanceTimersByTimeAsync(300);

      await expect(resultPromise).rejects.toThrow('persistent failure');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use exponential backoff', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockRejectedValueOnce(new Error('fail2'))
        .mockResolvedValueOnce('success');

      const resultPromise = retry(fn, 3, 100);

      // First retry after 100ms
      await vi.advanceTimersByTimeAsync(100);
      // Second retry after 200ms (doubled)
      await vi.advanceTimersByTimeAsync(200);

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('should format bytes', () => {
      expect(formatBytes(500)).toContain('Bytes');
    });

    it('should format kilobytes', () => {
      const result = formatBytes(1024);
      expect(result).toContain('KB');
      expect(parseFloat(result)).toBeCloseTo(1, 1);
    });

    it('should format megabytes', () => {
      const result = formatBytes(1024 * 1024);
      expect(result).toContain('MB');
      expect(parseFloat(result)).toBeCloseTo(1, 1);
    });

    it('should format gigabytes', () => {
      const result = formatBytes(1024 * 1024 * 1024);
      expect(result).toContain('GB');
      expect(parseFloat(result)).toBeCloseTo(1, 1);
    });

    it('should handle large numbers', () => {
      const result = formatBytes(1024 * 1024 * 1024 * 2.5);
      expect(result).toContain('GB');
      expect(parseFloat(result)).toBeCloseTo(2.5, 1);
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize filename with special characters', () => {
      expect(sanitizeFilename('test file (1).pdf')).toBe('test_file__1__pdf');
    });

    it('should convert to lowercase', () => {
      expect(sanitizeFilename('TEST_FILE.PDF')).toBe('test_file_pdf');
    });

    it('should preserve allowed characters', () => {
      expect(sanitizeFilename('test-Ã¤Ã¶Ã¼-æ–‡ä»¶.pdf')).toBe('test-___-___pdf');
    });

    it('should handle empty string', () => {
      expect(sanitizeFilename('')).toBe('');
    });

    it('should handle unicode characters', () => {
      expect(sanitizeFilename('test-Ã¤Ã¶Ã¼-æ–‡ä»¶.pdf')).toBe('test-___-___pdf');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
    });

    it('should generate ID with timestamp', () => {
      const id = generateId();
      const parts = id.split('-');

      expect(parts.length).toBeGreaterThanOrEqual(2);
      expect(Number.parseInt(parts[0], 10)).toBeGreaterThan(0);
    });

    it('should generate ID with random part', () => {
      const id = generateId();
      const parts = id.split('-');

      expect(parts[1]).toBeDefined();
      expect(parts[1].length).toBeGreaterThan(0);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('invalid@example')).toBe(false);
      expect(isValidEmail('invalid.example.com')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@test.com')).toBe(false);
      expect(isValidEmail('test@.com')).toBe(false);
    });
  });
});











































