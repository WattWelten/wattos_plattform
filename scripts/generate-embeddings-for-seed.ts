#!/usr/bin/env tsx
/**
 * Generiert Embeddings für Seed-Daten
 * Ruft RAG-Service auf, um Embeddings für vorhandene Chunks zu generieren
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:3005';
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3001';

async function generateEmbeddingsForSeed() {
  console.log('🔮 Starting embedding generation for seed data...\n');

  try {
    // 1. Finde alle Dokumente aus Seed-Script
    const seedDocuments = await prisma.document.findMany({
      where: {
        metadata: {
          path: ['demo'],
          equals: true,
        },
      },
      include: {
        knowledgeSpace: true,
        chunks: {
          where: {
            embedding: null,
          },
        },
      },
    });

    if (seedDocuments.length === 0) {
      console.log('✅ No seed documents found.');
      return;
    }

    console.log(`📊 Found ${seedDocuments.length} seed documents\n`);

    // 2. Für jedes Dokument: Re-Ingestion über RAG-Service
    // Da RAG-Service File-Upload erwartet, müssen wir die Dokumente als Dateien bereitstellen
    // ODER: Direkt über DocumentProcessor API (falls vorhanden)
    
    // Für MVP: Dokumente werden beim nächsten Upload automatisch mit Embeddings verarbeitet
    // Embeddings können auch manuell über RAG-Service Ingestion-Endpoint generiert werden
    
    console.log('💡 Embeddings werden beim nächsten Dokument-Upload automatisch generiert.');
    console.log('   Für sofortige Generierung: Dokumente über RAG-Service Ingestion-Endpoint hochladen.\n');
    
    console.log(`📋 Dokumente ohne Embeddings:`);
    for (const doc of seedDocuments) {
      const chunksWithoutEmbeddings = doc.chunks.length;
      console.log(`  - ${doc.fileName}: ${chunksWithoutEmbeddings} Chunks ohne Embeddings`);
    }

    console.log(`\n✅ Analysis completed.`);
    console.log(`\n💡 To generate embeddings:`);
    console.log(`   1. Start RAG-Service: cd apps/services/rag-service && pnpm dev`);
    console.log(`   2. Upload documents via: POST ${GATEWAY_URL}/api/rag/ingestion/file`);
    console.log(`   3. Or use RAG-Service directly: POST ${RAG_SERVICE_URL}/ingestion/file`);
  } catch (error) {
    console.error('❌ Embedding generation analysis failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

generateEmbeddingsForSeed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
