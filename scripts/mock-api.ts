/**
 * Mock API Server für lokale Tests
 * Simuliert Chat, Session, TTS, Log, Delete-Artifact, search_tool_config Endpoints
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 4001;

app.use(cors());
app.use(express.json());

// Mock Chat Endpoint
app.post('/api/v1/chat', (req, res) => {
  const { message, thread_id } = req.body ?? {};
  
  // Simuliere Lipsync-Timeline
  const lipsync = [
    { t: 0.10, id: 'MBP', w: 1 },
    { t: 0.50, id: 'FV', w: 1 },
    { t: 0.90, id: 'TH', w: 1 },
    { t: 1.30, id: 'AA', w: 1 },
    { t: 1.70, id: 'PP', w: 0.8 },
    { t: 2.10, id: 'SIL', w: 0 },
  ];

  return res.json({
    id: 'mock-123',
    thread_id: thread_id || 'mock-thread-123',
    reply: `Echo: ${message ?? 'Hallo'}`,
    lipsync,
    citations: [],
    metadata: {
      model: 'mock-model',
      tokens: 50,
      latency: 100,
    },
  });
});

// Mock Session Endpoint
app.get('/api/v1/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  return res.json({
    session_id: sessionId,
    user_id: 'mock-user-123',
    created_at: new Date().toISOString(),
    metadata: {},
  });
});

app.post('/api/v1/session', (req, res) => {
  return res.json({
    session_id: 'mock-session-123',
    user_id: 'mock-user-123',
    created_at: new Date().toISOString(),
    metadata: {},
  });
});

// Mock TTS Endpoint
app.post('/api/v1/tts', (req, res) => {
  const { text, voice_id } = req.body ?? {};
  
  // Simuliere Audio-Response (Base64-encoded silence)
  const mockAudio = Buffer.from('UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=').toString('base64');
  
  return res.json({
    audio_url: `data:audio/wav;base64,${mockAudio}`,
    duration: 2.5,
    voice_id: voice_id || 'default',
    text,
  });
});

// Mock Log Endpoint
app.post('/api/v1/log', (req, res) => {
  return res.json({
    success: true,
    log_id: 'mock-log-123',
  });
});

// Mock Delete Artifact Endpoint
app.delete('/api/v1/artifacts/:artifactId', (req, res) => {
  const { artifactId } = req.params;
  return res.json({
    success: true,
    artifact_id: artifactId,
    deleted_at: new Date().toISOString(),
  });
});

// Mock Search Tool Config Endpoint
app.get('/api/v1/tools/search_tool_config', (req, res) => {
  return res.json({
    enabled: true,
    max_results: 5,
    similarity_threshold: 0.7,
    vector_store: 'pgvector',
  });
});

// Mock Conversations Endpoint
app.post('/api/v1/conversations', (req, res) => {
  const { role } = req.body ?? {};
  return res.json({
    thread_id: 'mock-thread-123',
    role: role || 'user',
    messages: [],
    created_at: new Date().toISOString(),
  });
});

app.get('/api/v1/conversations/:threadId', (req, res) => {
  const { threadId } = req.params;
  return res.json({
    thread_id: threadId,
    role: 'user',
    messages: [
      {
        role: 'user',
        content: 'Hello',
        created_at: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
  });
});

app.post('/api/v1/conversations/message', (req, res) => {
  const { thread_id, message } = req.body ?? {};
  return res.json({
    thread_id: thread_id || 'mock-thread-123',
    role: 'ai',
    message: `Echo: ${message ?? 'Hello'}`,
    created_at: new Date().toISOString(),
  });
});

// Health Check
app.get('/health', (req, res) => {
  return res.json({
    status: 'ok',
    service: 'mock-api',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock API Server running on http://localhost:${PORT}`);
  console.log(`📝 Endpoints:`);
  console.log(`   POST /api/v1/chat`);
  console.log(`   GET  /api/v1/session/:sessionId`);
  console.log(`   POST /api/v1/session`);
  console.log(`   POST /api/v1/tts`);
  console.log(`   POST /api/v1/log`);
  console.log(`   DELETE /api/v1/artifacts/:artifactId`);
  console.log(`   GET  /api/v1/tools/search_tool_config`);
  console.log(`   POST /api/v1/conversations`);
  console.log(`   GET  /api/v1/conversations/:threadId`);
  console.log(`   POST /api/v1/conversations/message`);
  console.log(`   GET  /health`);
});

