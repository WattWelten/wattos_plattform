CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE "Chunk" ADD COLUMN IF NOT EXISTS embedding_vec vector(1536);
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS chunk_embedding_hnsw ON "Chunk" USING hnsw (embedding_vec vector_cosine_ops);
EXCEPTION WHEN undefined_object THEN
  RAISE NOTICE 'hnsw extension not available; skipping index';
END $$;
