import { Injectable, Logger } from '@nestjs/common';

/**
 * Data Validator Service
 * 
 * Validiert gecrawlte Daten
 */
@Injectable()
export class DataValidatorService {
  private readonly logger = new Logger(DataValidatorService.name);

  /**
   * Daten validieren
   */
  async validateData(crawledData: any[]): Promise<any[]> {
    this.logger.debug(`Validating ${crawledData.length} crawled pages`);

    const validatedData = [];

    for (const page of crawledData) {
      if (this.isValidPage(page)) {
        validatedData.push(page);
      } else {
        this.logger.warn(`Invalid page skipped: ${page.url}`, {
          reasons: this.getValidationErrors(page),
        });
      }
    }

    this.logger.log(`Validated ${validatedData.length} of ${crawledData.length} pages`);
    return validatedData;
  }

  /**
   * Prüfen ob Seite gültig ist
   */
  private isValidPage(page: any): boolean {
    // Mindestanforderungen
    if (!page.url || !page.title || !page.content) {
      return false;
    }

    // Mindestlänge des Inhalts
    if (page.content.length < 100) {
      return false;
    }

    // Titel sollte nicht leer sein
    if (page.title.trim().length === 0) {
      return false;
    }

    // URL sollte gültig sein
    try {
      new URL(page.url);
    } catch {
      return false;
    }

    return true;
  }

  /**
   * Validierungsfehler abrufen
   */
  private getValidationErrors(page: any): string[] {
    const errors: string[] = [];

    if (!page.url) {
      errors.push('Missing URL');
    }
    if (!page.title) {
      errors.push('Missing title');
    }
    if (!page.content) {
      errors.push('Missing content');
    }
    if (page.content && page.content.length < 100) {
      errors.push('Content too short');
    }
    if (page.title && page.title.trim().length === 0) {
      errors.push('Title is empty');
    }

    try {
      new URL(page.url);
    } catch {
      errors.push('Invalid URL');
    }

    return errors;
  }
}


