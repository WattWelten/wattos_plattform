/**
 * Safe JSON Utilities
 * 
 * Bietet sichere JSON-Parsing und -Serialisierung mit:
 * - Error-Handling
 * - ReDoS-Schutz (maximale String-Länge)
 * - Type-Safety
 */

/**
 * Konfiguration für Safe JSON
 */
export interface SafeJsonOptions {
  /**
   * Maximale String-Länge für JSON-Input (ReDoS-Schutz)
   * @default 10_000_000 (10MB)
   */
  maxLength?: number;
  
  /**
   * Fallback-Wert bei Parse-Fehler
   */
  fallback?: unknown;
  
  /**
   * Strict-Mode: Wirft Fehler statt Fallback zu verwenden
   * @default false
   */
  strict?: boolean;
}

/**
 * Safe JSON Parse mit Error-Handling
 * 
 * @param jsonString - JSON-String zum Parsen
 * @param options - Optionen für Safe JSON
 * @returns Parsed object oder Fallback
 * @throws Error wenn strict=true und Parsing fehlschlägt
 */
export function safeJsonParse<T = unknown>(
  jsonString: string,
  options: SafeJsonOptions = {}
): T {
  const {
    maxLength = 10_000_000, // 10MB default
    fallback = null,
    strict = false,
  } = options;

  // ReDoS-Schutz: Maximale String-Länge prüfen
  if (jsonString.length > maxLength) {
    const error = new Error(
      `JSON string exceeds maximum length of ${maxLength} characters`
    );
    if (strict) {
      throw error;
    }
    return fallback as T;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch (error) {
    const parseError = error instanceof Error 
      ? error 
      : new Error('Unknown JSON parse error');
    
    if (strict) {
      throw new Error(`JSON parse failed: ${parseError.message}`);
    }
    
    return fallback as T;
  }
}

/**
 * Safe JSON Stringify mit Error-Handling
 * 
 * @param value - Wert zum Stringifizieren
 * @param options - Optionen für Safe JSON
 * @returns JSON-String oder Fallback
 * @throws Error wenn strict=true und Stringify fehlschlägt
 */
export function safeJsonStringify(
  value: unknown,
  options: SafeJsonOptions & { 
    /**
     * JSON.stringify options (space, replacer)
     */
    space?: string | number;
    replacer?: (key: string, value: unknown) => unknown;
  } = {}
): string {
  const {
    fallback = 'null' as string,
    strict = false,
    space,
    replacer,
  } = options;

  try {
    const stringified = JSON.stringify(value, replacer, space);
    
    // ReDoS-Schutz: Maximale String-Länge prüfen
    if (stringified.length > (options.maxLength ?? 10_000_000)) {
      const error = new Error(
        `JSON stringified value exceeds maximum length of ${options.maxLength ?? 10_000_000} characters`
      );
      if (strict) {
        throw error;
      }
      return fallback as string;
    }
    
    return stringified;
  } catch (error) {
    const stringifyError = error instanceof Error 
      ? error 
      : new Error('Unknown JSON stringify error');
    
    if (strict) {
      throw new Error(`JSON stringify failed: ${stringifyError.message}`);
    }
    
    return fallback as string;
  }
}

/**
 * Safe JSON Parse mit Zod-Validierung
 * 
 * @param jsonString - JSON-String zum Parsen
 * @param schema - Zod-Schema zur Validierung
 * @param options - Optionen für Safe JSON
 * @returns Validated object
 * @throws Error wenn Parsing oder Validierung fehlschlägt
 */
export function safeJsonParseWithSchema<T>(
  jsonString: string,
  schema: { parse: (data: unknown) => T },
  options: SafeJsonOptions & { strict?: true } = { strict: true }
): T {
  const parsed = safeJsonParse(jsonString, options);
  return schema.parse(parsed);
}

