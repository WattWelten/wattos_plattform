import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeText, validateUrl, sanitizePath } from '../sanitize';

describe('sanitizeHtml', () => {
  it('should sanitize HTML on server-side (no window)', () => {
    const html = '<script>alert(\"xss\")</script><p>Safe content</p>';
    const result = sanitizeHtml(html);
    // Server-side entfernt alle HTML-Tags
    expect(result).toBe('Safe content');
  });

  it('should remove all HTML tags on server-side', () => {
    const html = '<div><b>Bold</b><i>Italic</i></div>';
    const result = sanitizeHtml(html);
    expect(result).toBe('BoldItalic');
  });

  it('should handle empty string', () => {
    const result = sanitizeHtml('');
    expect(result).toBe('');
  });

  it('should handle plain text without HTML', () => {
    const text = 'Plain text without HTML tags';
    const result = sanitizeHtml(text);
    expect(result).toBe(text);
  });
});

describe('sanitizeText', () => {
  it('should remove null bytes', () => {
    const text = 'Text\0with\0null\0bytes';
    const result = sanitizeText(text);
    expect(result).toBe('Textwithnullbytes');
  });

  it('should remove control characters except newline, carriage return, tab', () => {
    const text = 'Text\x01\x02\x03\n\r\tNormal';
    const result = sanitizeText(text);
    expect(result).toBe('Text\n\r\tNormal');
  });

  it('should trim whitespace', () => {
    const text = '  Text with spaces  ';
    const result = sanitizeText(text);
    expect(result).toBe('Text with spaces');
  });
});

describe('validateUrl', () => {
  it('should validate HTTP URLs', () => {
    expect(validateUrl('http://example.com')).toBe(true);
  });

  it('should validate HTTPS URLs', () => {
    expect(validateUrl('https://example.com')).toBe(true);
  });

  it('should reject javascript: URLs', () => {
    expect(validateUrl('javascript:alert(1)')).toBe(false);
  });

  it('should reject data: URLs', () => {
    expect(validateUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('should reject invalid URLs', () => {
    expect(validateUrl('not-a-url')).toBe(false);
  });
});

describe('sanitizePath', () => {
  it('should remove path traversal sequences', () => {
    // sanitizePath entfernt .. und ersetzt durch nichts
    const result = sanitizePath('../../../etc/passwd');
    expect(result).not.toContain('..');
    expect(result).toContain('etc');
  });

  it('should remove leading slashes', () => {
    // sanitizePath entfernt fÃ¼hrende Slashes
    const result = sanitizePath('/absolute/path');
    expect(result).not.toMatch(/^\/+/);
  });

  it('should replace invalid characters with underscore', () => {
    expect(sanitizePath('file<name>')).toBe('file_name_');
  });
});
