import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { DocumentProcessorService } from '@wattweiser/document-processor';
import { PrismaClient } from '@wattweiser/db';

/**
 * Document Worker
 * Verarbeitet Dokument-Ingestion-Jobs aus BullMQ
 */

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
});

const prisma = new PrismaClient();
const processor = new DocumentProcessorService();

const worker = new Worker(
  'document-ingestion',
  async (job) => {
    console.log(`Processing document job: ${job.id}`);

    const { documentId, content, knowledgeSpaceId, chunkingOptions, embeddingOptions } = job.data;

    try {
      // Dokument verarbeiten
      const result = await processor.processDocument(
        content,
        documentId,
        chunkingOptions || { strategy: 'sentence', chunkSize: 1000, chunkOverlap: 200 },
        embeddingOptions || { provider: 'openai', model: 'text-embedding-3-small' },
        true, // PII-Redaction aktiviert
      );

      // Chunks in DB speichern
      for (const chunk of result.chunks) {
        await prisma.chunk.create({
          data: {
            id: chunk.id,
            documentId: chunk.documentId,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            metadata: chunk.metadata as any,
            embedding: chunk.embedding,
          },
        });
      }

      // Dokument-Status aktualisieren
      // TODO: Dokument-Status in DB aktualisieren

      console.log(`Document processed successfully: ${documentId}`);
      return { success: true, chunksCreated: result.chunks.length };
    } catch (error: any) {
      console.error(`Document processing failed: ${error.message}`);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5, // Max. 5 Jobs parallel
  },
);

worker.on('completed', (job) => {
  console.log(`Job completed: ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`Job failed: ${job?.id} - ${err.message}`);
});

console.log('Document worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  await worker.close();
  await redis.quit();
  await prisma.$disconnect();
  process.exit(0);
});


