/**
 * Utility Functions für Agent SDK
 */

/**
 * Token-Count schätzen (ca. 4 Zeichen pro Token)
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Message zu String konvertieren
 */
export function messageToString(message: { role: string; content: string }): string {
  return `${message.role}: ${message.content}`;
}

/**
 * Delay (für Retry-Logik)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exponential Backoff
 */
export async function exponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt < maxRetries - 1) {
        const delayMs = baseDelay * Math.pow(2, attempt);
        await delay(delayMs);
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}


