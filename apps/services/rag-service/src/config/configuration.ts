export default () => ({
  port: parseInt(process.env.PORT || '3005', 10),
  env: process.env.NODE_ENV || 'development',
  vectorStore: {
    type: process.env.VECTOR_STORE_TYPE || 'pgvector', // pgvector | opensearch
    pgvector: {
      connectionString: process.env.DATABASE_URL,
    },
    opensearch: {
      node: process.env.OPENSEARCH_NODE || 'http://localhost:9200',
      auth: {
        username: process.env.OPENSEARCH_USERNAME,
        password: process.env.OPENSEARCH_PASSWORD,
      },
    },
  },
  embeddings: {
    provider: process.env.EMBEDDINGS_PROVIDER || 'openai', // openai | ollama | local
    model: process.env.EMBEDDINGS_MODEL || 'text-embedding-3-small',
    apiKey: process.env.OPENAI_API_KEY,
    dimensions: parseInt(process.env.EMBEDDINGS_DIMENSIONS || '1536', 10),
  },
  search: {
    defaultTopK: parseInt(process.env.DEFAULT_TOP_K || '5', 10),
    maxTopK: parseInt(process.env.MAX_TOP_K || '20', 10),
    minScore: parseFloat(process.env.MIN_SCORE || '0.7', 10),
  },
});


