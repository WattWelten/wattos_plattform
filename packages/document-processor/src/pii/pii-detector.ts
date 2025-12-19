import { PiiDetectionResult, PiiEntity } from '../interfaces/document-processor.interface';

/**
 * PII Detector
 * Erkennt und redactiert persönlich identifizierbare Informationen
 */
export class PiiDetector {
  private patterns: Map<string, RegExp> = new Map();

  constructor() {
    this.initializePatterns();
  }

  /**
   * PII-Patterns initialisieren
   */
  private initializePatterns(): void {
    // E-Mail
    this.patterns.set(
      'email',
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    );

    // Telefonnummer (DE-Format)
    this.patterns.set(
      'phone',
      /\b(\+49|0)[1-9]\d{1,14}\b/g,
    );

    // IBAN
    this.patterns.set(
      'iban',
      /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g,
    );

    // Kreditkarte
    this.patterns.set(
      'credit_card',
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    );

    // Deutsche Postleitzahl
    this.patterns.set('postal_code', /\b\d{5}\b/g);

    // Geburtsdatum (DD.MM.YYYY oder DD/MM/YYYY)
    this.patterns.set(
      'birthdate',
      /\b\d{1,2}[./]\d{1,2}[./]\d{4}\b/g,
    );

    // Sozialversicherungsnummer (DE-Format)
    this.patterns.set('ssn', /\b\d{11}\b/g);
  }

  /**
   * PII erkennen und redactieren
   */
  detectAndRedact(text: string): PiiDetectionResult {
    const entities: PiiEntity[] = [];
    let redactedContent = text;
    const detectedTypes: string[] = [];

    // Alle Patterns durchgehen
    this.patterns.forEach((pattern, type) => {
      const matches = [...text.matchAll(pattern)];

      if (matches.length > 0) {
        detectedTypes.push(type);

        // Matches in umgekehrter Reihenfolge ersetzen (um Indizes nicht zu verschieben)
        for (let i = matches.length - 1; i >= 0; i--) {
          const match = matches[i];
          const start = match.index!;
          const end = start + match[0].length;

          entities.push({
            type,
            value: match[0],
            start,
            end,
          });

          // Redactieren
          redactedContent =
            redactedContent.substring(0, start) +
            `[${type.toUpperCase()}_REDACTED]` +
            redactedContent.substring(end);
        }
      }
    });

    return {
      detected: detectedTypes.length > 0,
      types: detectedTypes,
      redactedContent,
      entities,
    };
  }

  /**
   * Nur PII erkennen (ohne Redaction)
   */
  detectOnly(text: string): PiiEntity[] {
    const entities: PiiEntity[] = [];

    this.patterns.forEach((pattern, type) => {
      const matches = [...text.matchAll(pattern)];

      matches.forEach((match) => {
        entities.push({
          type,
          value: match[0],
          start: match.index!,
          end: match.index! + match[0].length,
        });
      });
    });

    return entities;
  }
}


