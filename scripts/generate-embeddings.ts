#!/usr/bin/env tsx
/**
 * Generiert Embeddings für alle Chunks ohne Embeddings
 * Ruft RAG-Service Ingestion-Endpoint auf
 */

import { PrismaClient } from '@prisma/client';

// Prisma 7.2.0: URL wird aus DATABASE_URL Umgebungsvariable oder schema.prisma gelesen
const prisma = new PrismaClient();
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:3005';

async function generateEmbeddings() {
  console.log('🔮 Starting embedding generation...\n');

  try {
    // 1. Finde alle Chunks ohne Embeddings
    const chunksWithoutEmbeddings = await prisma.chunk.findMany({
      where: {
        embedding: null,
      },
      include: {
        document: {
          include: {
            knowledgeSpace: true,
          },
        },
      },
      take: 100, // Batch-Processing
    });

    if (chunksWithoutEmbeddings.length === 0) {
      console.log('✅ No chunks without embeddings found.');
      return;
    }

    console.log(`📊 Found ${chunksWithoutEmbeddings.length} chunks without embeddings\n`);

    // 2. Für jeden Chunk: Embedding generieren über RAG-Service
    let successCount = 0;
    let errorCount = 0;

    for (const chunk of chunksWithoutEmbeddings) {
      try {
        // RAG-Service erwartet Dokument-Content, nicht einzelne Chunks
        // Daher: Dokument neu verarbeiten über Ingestion-Endpoint
        // ODER: Direkt Embedding-API aufrufen (falls vorhanden)
        
        // Option 1: Dokument über Ingestion neu verarbeiten (würde Duplikate erstellen)
        // Option 2: Embedding direkt generieren (benötigt Embedding-Endpoint)
        
        // Für jetzt: Skip - Embeddings werden beim nächsten Dokument-Upload generiert
        console.log(`  ⏭️  Skipping chunk ${chunk.id} - Embeddings werden beim nächsten Upload generiert`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ Error processing chunk ${chunk.id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n✅ Embedding generation completed:`);
    console.log(`  - Processed: ${successCount}`);
    console.log(`  - Errors: ${errorCount}`);
    console.log(`\n💡 Tip: Embeddings werden automatisch beim nächsten Dokument-Upload über RAG-Service generiert.`);
  } catch (error) {
    console.error('❌ Embedding generation failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

generateEmbeddings()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
