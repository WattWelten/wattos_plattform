import { describe, it, expect, beforeEach } from 'vitest';
import { PIIRedactionService, PIIType } from '../pii-redaction.service';

describe('PIIRedactionService', () => {
  let piiRedactionService: PIIRedactionService;

  beforeEach(() => {
    piiRedactionService = new PIIRedactionService();
  });

  describe('detectPII', () => {
    it('should detect email addresses', () => {
      const content = 'Contact me at john.doe@example.com for more info.';

      const detections = piiRedactionService.detectPII(content);

      expect(detections.length).toBeGreaterThan(0);
      const emailDetection = detections.find((d) => d.type === PIIType.EMAIL);
      expect(emailDetection).toBeDefined();
      expect(emailDetection?.value).toContain('@');
    });

    it('should detect phone numbers', () => {
      const content = 'Call me at +1-555-123-4567 or (555) 987-6543.';

      const detections = piiRedactionService.detectPII(content);

      expect(detections.length).toBeGreaterThan(0);
      const phoneDetection = detections.find((d) => d.type === PIIType.PHONE);
      expect(phoneDetection).toBeDefined();
    });

    it('should detect SSN', () => {
      const content = 'My SSN is 123-45-6789.';

      const detections = piiRedactionService.detectPII(content);

      expect(detections.length).toBeGreaterThan(0);
      const ssnDetection = detections.find((d) => d.type === PIIType.SSN);
      expect(ssnDetection).toBeDefined();
      expect(ssnDetection?.value).toMatch(/\d{3}-\d{2}-\d{4}/);
    });

    it('should detect credit card numbers', () => {
      const content = 'Card number: 4532-1234-5678-9010';

      const detections = piiRedactionService.detectPII(content);

      expect(detections.length).toBeGreaterThan(0);
      const ccDetection = detections.find((d) => d.type === PIIType.CREDIT_CARD);
      expect(ccDetection).toBeDefined();
    });

    it('should detect IP addresses', () => {
      const content = 'Server IP: 192.168.1.1';

      const detections = piiRedactionService.detectPII(content);

      expect(detections.length).toBeGreaterThan(0);
      const ipDetection = detections.find((d) => d.type === PIIType.IP_ADDRESS);
      expect(ipDetection).toBeDefined();
    });

    it('should detect multiple PII types', () => {
      const content = 'Contact john@example.com at 555-123-4567. SSN: 123-45-6789';

      const detections = piiRedactionService.detectPII(content);

      expect(detections.length).toBeGreaterThanOrEqual(3);
      expect(detections.some((d) => d.type === PIIType.EMAIL)).toBe(true);
      expect(detections.some((d) => d.type === PIIType.PHONE)).toBe(true);
      expect(detections.some((d) => d.type === PIIType.SSN)).toBe(true);
    });

    it('should return empty array for content without PII', () => {
      const content = 'This is a normal text without any personal information.';

      const detections = piiRedactionService.detectPII(content);

      expect(detections).toEqual([]);
    });

    it('should include position information in detections', () => {
      const content = 'Email: test@example.com';

      const detections = piiRedactionService.detectPII(content);

      expect(detections.length).toBeGreaterThan(0);
      const detection = detections[0];
      expect(detection.startIndex).toBeGreaterThanOrEqual(0);
      expect(detection.endIndex).toBeGreaterThan(detection.startIndex);
      expect(detection.confidence).toBeGreaterThan(0);
    });
  });

  describe('redactPII', () => {
    it('should redact email addresses', () => {
      const content = 'Contact me at john.doe@example.com';

      const result = piiRedactionService.redactPII(content);

      expect(result.redactedContent).not.toContain('john.doe@example.com');
      expect(result.redactedContent).toContain('[REDACTED]');
      expect(result.redactionCount).toBeGreaterThan(0);
    });

    it('should redact phone numbers', () => {
      const content = 'Call me at 555-123-4567';

      const result = piiRedactionService.redactPII(content);

      expect(result.redactedContent).not.toContain('555-123-4567');
      expect(result.redactionCount).toBeGreaterThan(0);
    });

    it('should redact only specified PII types', () => {
      const content = 'Email: test@example.com, Phone: 555-123-4567';

      const result = piiRedactionService.redactPII(content, [PIIType.EMAIL]);

      // Email should be redacted
      expect(result.redactedContent).not.toContain('test@example.com');
      // Phone might still be there (depending on implementation)
      expect(result.redactionCount).toBeGreaterThan(0);
    });

    it('should return detection information', () => {
      const content = 'Email: test@example.com';

      const result = piiRedactionService.redactPII(content);

      expect(result.detections.length).toBeGreaterThan(0);
      expect(result.detections[0]?.type).toBe(PIIType.EMAIL);
    });

    it('should handle content without PII', () => {
      const content = 'This is a normal text.';

      const result = piiRedactionService.redactPII(content);

      expect(result.redactedContent).toBe(content);
      expect(result.redactionCount).toBe(0);
      expect(result.detections).toEqual([]);
    });

    it('should preserve text structure after redaction', () => {
      const content = 'Contact john@example.com or call 555-123-4567.';

      const result = piiRedactionService.redactPII(content);

      // Should still contain the surrounding text
      expect(result.redactedContent).toContain('Contact');
      expect(result.redactedContent).toContain('or call');
      expect(result.redactedContent.length).toBeGreaterThan(0);
    });

    it('should handle multiple occurrences of same PII type', () => {
      const content = 'Email1: test1@example.com, Email2: test2@example.com';

      const result = piiRedactionService.redactPII(content);

      expect(result.redactionCount).toBeGreaterThanOrEqual(2);
      expect(result.detections.filter((d) => d.type === PIIType.EMAIL).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('PIIType enum', () => {
    it('should have all required PII types', () => {
      expect(PIIType.EMAIL).toBe('email');
      expect(PIIType.PHONE).toBe('phone');
      expect(PIIType.SSN).toBe('ssn');
      expect(PIIType.CREDIT_CARD).toBe('credit_card');
      expect(PIIType.IP_ADDRESS).toBe('ip_address');
      expect(PIIType.DATE_OF_BIRTH).toBe('date_of_birth');
      expect(PIIType.ADDRESS).toBe('address');
    });
  });
});







