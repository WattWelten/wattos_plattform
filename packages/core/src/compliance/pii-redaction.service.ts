import { Injectable, Logger } from '@nestjs/common';

/**
 * PII Types
 */
export enum PIIType {
  EMAIL = 'email',
  PHONE = 'phone',
  SSN = 'ssn',
  CREDIT_CARD = 'credit_card',
  IP_ADDRESS = 'ip_address',
  DATE_OF_BIRTH = 'date_of_birth',
  ADDRESS = 'address',
}

/**
 * PII Detection Result
 */
export interface PIIDetection {
  type: PIIType;
  value: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

/**
 * PII Redaction Service
 * 
 * Erkennt und redigiert PII (Personally Identifiable Information)
 */
@Injectable()
export class PIIRedactionService {
  private readonly logger = new Logger(PIIRedactionService.name);

  /**
   * PII Patterns (RegExp)
   */
  private readonly patterns: Record<PIIType, RegExp> = {
    [PIIType.EMAIL]: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    [PIIType.PHONE]: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    [PIIType.SSN]: /\b\d{3}-\d{2}-\d{4}\b/g,
    [PIIType.CREDIT_CARD]: /\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g,
    [PIIType.IP_ADDRESS]: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    [PIIType.DATE_OF_BIRTH]: /\b\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}\b/g,
    [PIIType.ADDRESS]: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/gi,
  };

  /**
   * PII in Text erkennen
   */
  detectPII(content: string): PIIDetection[] {
    const detections: PIIDetection[] = [];

    Object.entries(this.patterns).forEach(([type, pattern]) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        detections.push({
          type: type as PIIType,
          value: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          confidence: 0.9, // Pattern-basierte Erkennung
        });
      }
    });

    // Sortiere nach Position (von hinten nach vorne für sichere Ersetzung)
    detections.sort((a, b) => b.startIndex - a.startIndex);

    return detections;
  }

  /**
   * PII redigieren
   */
  redactPII(content: string, piiTypes?: PIIType[]): {
    redactedContent: string;
    detections: PIIDetection[];
    redactionCount: number;
  } {
    const allDetections = this.detectPII(content);
    
    // Filter nach PII-Typen (wenn spezifiziert)
    const detections = piiTypes
      ? allDetections.filter((d) => piiTypes.includes(d.type))
      : allDetections;

    let redactedContent = content;
    let redactionCount = 0;

    // Ersetze von hinten nach vorne (um Indizes nicht zu verschieben)
    detections.forEach((detection) => {
      const redaction = this.getRedactionPlaceholder(detection.type);
      redactedContent =
        redactedContent.substring(0, detection.startIndex) +
        redaction +
        redactedContent.substring(detection.endIndex);
      redactionCount++;
    });

    this.logger.debug(`PII redaction completed`, {
      originalLength: content.length,
      redactedLength: redactedContent.length,
      redactionCount,
    });

    return {
      redactedContent,
      detections,
      redactionCount,
    };
  }

  /**
   * Redaction Placeholder basierend auf PII-Typ
   */
  private getRedactionPlaceholder(type: PIIType): string {
    const placeholders: Record<PIIType, string> = {
      [PIIType.EMAIL]: '[EMAIL_REDACTED]',
      [PIIType.PHONE]: '[PHONE_REDACTED]',
      [PIIType.SSN]: '[SSN_REDACTED]',
      [PIIType.CREDIT_CARD]: '[CARD_REDACTED]',
      [PIIType.IP_ADDRESS]: '[IP_REDACTED]',
      [PIIType.DATE_OF_BIRTH]: '[DOB_REDACTED]',
      [PIIType.ADDRESS]: '[ADDRESS_REDACTED]',
    };

    return placeholders[type] || '[REDACTED]';
  }

  /**
   * Prüfe ob Text PII enthält
   */
  containsPII(content: string, piiTypes?: PIIType[]): boolean {
    const detections = this.detectPII(content);
    if (piiTypes) {
      return detections.some((d) => piiTypes.includes(d.type));
    }
    return detections.length > 0;
  }
}

