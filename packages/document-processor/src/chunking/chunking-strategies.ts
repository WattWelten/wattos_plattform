import { DocumentChunk, ChunkingOptions } from '../interfaces/document-processor.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Chunking Strategies
 * Verschiedene Strategien zum Aufteilen von Dokumenten in Chunks
 */
export class ChunkingStrategies {
  /**
   * Fixed-Size Chunking
   * Teilt Dokument in gleich große Chunks
   */
  static fixedSize(
    content: string,
    documentId: string,
    options: ChunkingOptions,
  ): DocumentChunk[] {
    const chunkSize = options.chunkSize || 1000;
    const overlap = options.chunkOverlap || 200;
    const chunks: DocumentChunk[] = [];

    let start = 0;
    let chunkIndex = 0;

    while (start < content.length) {
      const end = Math.min(start + chunkSize, content.length);
      const chunkContent = content.substring(start, end);

      chunks.push({
        id: uuidv4(),
        documentId,
        content: chunkContent,
        chunkIndex: chunkIndex++,
        startChar: start,
        endChar: end,
        metadata: {
          strategy: 'fixed',
          chunkSize,
          overlap,
        },
      });

      start = end - overlap;
    }

    return chunks;
  }

  /**
   * Sentence-Based Chunking
   * Teilt Dokument an Satzgrenzen
   */
  static sentenceBased(
    content: string,
    documentId: string,
    options: ChunkingOptions,
  ): DocumentChunk[] {
    const chunkSize = options.chunkSize || 1000;
    const sentences = this.splitIntoSentences(content);
    const chunks: DocumentChunk[] = [];

    let currentChunk: string[] = [];
    let currentLength = 0;
    let chunkIndex = 0;
    let startChar = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const sentenceLength = sentence.length;

      if (currentLength + sentenceLength > chunkSize && currentChunk.length > 0) {
        // Aktuellen Chunk speichern
        const chunkContent = currentChunk.join(' ');
        chunks.push({
          id: uuidv4(),
          documentId,
          content: chunkContent,
          chunkIndex: chunkIndex++,
          startChar,
          endChar: startChar + chunkContent.length,
          metadata: {
            strategy: 'sentence',
            sentenceCount: currentChunk.length,
          },
        });

        startChar += chunkContent.length + 1;
        currentChunk = [];
        currentLength = 0;
      }

      currentChunk.push(sentence);
      currentLength += sentenceLength + 1; // +1 für Leerzeichen
    }

    // Letzten Chunk speichern
    if (currentChunk.length > 0) {
      const chunkContent = currentChunk.join(' ');
      chunks.push({
        id: uuidv4(),
        documentId,
        content: chunkContent,
        chunkIndex: chunkIndex++,
        startChar,
        endChar: startChar + chunkContent.length,
        metadata: {
          strategy: 'sentence',
          sentenceCount: currentChunk.length,
        },
      });
    }

    return chunks;
  }

  /**
   * Paragraph-Based Chunking
   * Teilt Dokument an Absatzgrenzen
   */
  static paragraphBased(
    content: string,
    documentId: string,
    options: ChunkingOptions,
  ): DocumentChunk[] {
    const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const chunks: DocumentChunk[] = [];

    let chunkIndex = 0;
    let startChar = 0;

    paragraphs.forEach((paragraph, index) => {
      chunks.push({
        id: uuidv4(),
        documentId,
        content: paragraph.trim(),
        chunkIndex: chunkIndex++,
        startChar,
        endChar: startChar + paragraph.length,
        metadata: {
          strategy: 'paragraph',
          paragraphIndex: index,
        },
      });

      startChar += paragraph.length + 2; // +2 für \n\n
    });

    return chunks;
  }

  /**
   * Split into sentences
   */
  private static splitIntoSentences(text: string): string[] {
    // Einfache Satzgrenzen-Erkennung (kann erweitert werden)
    return text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
}


