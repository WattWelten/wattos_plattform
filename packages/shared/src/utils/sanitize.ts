/**
 * XSS-Schutz: Sanitization für User-Input
 */

/**
 * Sanitize HTML-String (für Chat-Messages, die als HTML gerendert werden)
 * Verwendet DOMPurify für sichere HTML-Sanitization
 */
export function sanitizeHtml(html: string): string {
  // DOMPurify wird lazy geladen, um Bundle-Größe zu reduzieren
  // Type-Guard für Browser-Umgebung
  if (typeof globalThis !== 'undefined' && 'window' in globalThis && typeof (globalThis as any).window !== 'undefined') {
    try {
      // Client-side: DOMPurify verwenden
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const DOMPurify = require('dompurify');
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'target'],
      });
    } catch {
      // Fallback wenn DOMPurify nicht verfügbar
    }
  }
  // Server-side: Basis-Sanitization (entferne alle HTML-Tags)
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize Plain-Text (entfernt potenziell gefährliche Zeichen)
 */
export function sanitizeText(text: string): string {
  // Entferne Null-Bytes, Control-Characters (außer \n, \r, \t)
  return text
    .replace(/\0/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Validate URL (verhindert javascript:, data:, etc.)
 */
export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Nur HTTP/HTTPS erlauben
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitize File Path (verhindert Path-Traversal)
 */
export function sanitizePath(path: string): string {
  // Entferne .. und absolute Pfade
  return path
    .replace(/\.\./g, '')
    .replace(/^\/+/, '')
    .replace(/[<>:"|?*\x00-\x1F]/g, '_');
}

