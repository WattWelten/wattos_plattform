-- Migration: Add pgvector extension and indexes for Chunk embeddings
-- This migration creates vector indexes for efficient similarity search

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create IVFFlat index for approximate nearest neighbor search
-- IVFFlat is faster but less accurate than HNSW
-- Suitable for large datasets (> 1M vectors)
-- Note: Requires at least 1000 vectors for optimal performance
CREATE INDEX IF NOT EXISTS chunks_embedding_ivfflat_idx 
ON "Chunk" 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create HNSW index for high-accuracy similarity search
-- HNSW is more accurate but slower than IVFFlat
-- Suitable for smaller datasets or when accuracy is critical
-- Note: HNSW requires more memory but provides better recall
CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_idx 
ON "Chunk" 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create composite index for tenant-based vector search
-- This allows efficient filtering by documentId before vector search
CREATE INDEX IF NOT EXISTS chunks_document_embedding_idx 
ON "Chunk" (documentId, embedding vector_cosine_ops);

-- Create index for knowledge space filtering
-- Allows efficient filtering by knowledge space before vector search
CREATE INDEX IF NOT EXISTS chunks_knowledge_space_idx 
ON "Chunk" (documentId)
INCLUDE (embedding);

-- Add comment for documentation
COMMENT ON INDEX chunks_embedding_ivfflat_idx IS 'IVFFlat index for fast approximate similarity search. Rebuild after bulk inserts.';
COMMENT ON INDEX chunks_embedding_hnsw_idx IS 'HNSW index for high-accuracy similarity search. Better recall than IVFFlat.';
COMMENT ON INDEX chunks_document_embedding_idx IS 'Composite index for tenant-filtered vector search.';
COMMENT ON INDEX chunks_knowledge_space_idx IS 'Covering index for knowledge space filtering with embeddings.';
