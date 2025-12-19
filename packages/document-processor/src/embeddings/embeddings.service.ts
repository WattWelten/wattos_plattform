import { EmbeddingOptions } from '../interfaces/document-processor.interface';

/**
 * Embeddings Service
 * Generiert Embeddings für Dokument-Chunks
 */
export class EmbeddingsService {
  /**
   * Embedding generieren
   */
  async generateEmbedding(
    text: string,
    options: EmbeddingOptions,
  ): Promise<number[]> {
    switch (options.provider) {
      case 'openai':
        return this.generateOpenAIEmbedding(text, options);

      case 'ollama':
        return this.generateOllamaEmbedding(text, options);

      case 'local':
        // TODO: Lokale Embedding-Modelle
        throw new Error('Local embeddings not yet implemented');

      default:
        throw new Error(`Unknown embedding provider: ${options.provider}`);
    }
  }

  /**
   * Batch-Embeddings generieren
   */
  async generateBatchEmbeddings(
    texts: string[],
    options: EmbeddingOptions,
  ): Promise<number[][]> {
    // Für OpenAI: Batch-API nutzen
    if (options.provider === 'openai') {
      return this.generateOpenAIBatchEmbeddings(texts, options);
    }

    // Für andere: Sequenziell
    const embeddings: number[][] = [];
    for (const text of texts) {
      const embedding = await this.generateEmbedding(text, options);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  /**
   * OpenAI Embedding generieren
   */
  private async generateOpenAIEmbedding(
    text: string,
    options: EmbeddingOptions,
  ): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI embedding failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  /**
   * OpenAI Batch-Embeddings generieren
   */
  private async generateOpenAIBatchEmbeddings(
    texts: string[],
    options: EmbeddingOptions,
  ): Promise<number[][]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'text-embedding-3-small',
        input: texts,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI batch embedding failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  }

  /**
   * Ollama Embedding generieren
   */
  private async generateOllamaEmbedding(
    text: string,
    options: EmbeddingOptions,
  ): Promise<number[]> {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

    const response = await fetch(`${ollamaUrl}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || 'nomic-embed-text',
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding;
  }
}


