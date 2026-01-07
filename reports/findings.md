# Findings - WattOS Plattform

**Erstellt:** 2025-01-05  
**Letzter Commit:** 57b584 - fix: replace PrismaClient with PrismaService  
**Status:** Phase 0 - Snapshot & Inventur

---

## P0 - Kritisch (Sofort beheben)

### 1. Port-Konflikt: crawler-service und llm-gateway
**Datei:** 
- pps/services/crawler-service/src/main.ts:35
- pps/services/llm-gateway/src/main.ts:27

**Problem:** Beide Services verwenden Port 3015 als Default.

**Impact:** Beide Services kÃ¶nnen nicht gleichzeitig laufen.

**LÃ¶sung:** 
- crawler-service: Port 3015 beibehalten
- llm-gateway: Port auf 3017 Ã¤ndern (oder via ENV konfigurierbar machen)

---

### 2. In-Memory State verhindert Horizontal Scaling
**Datei:** packages/core/src/orchestrator/state.service.ts:25-26

**Problem:** 
`	ypescript
private states: Map<string, SessionState> = new Map();
private stateHistory: Map<string, Event[]> = new Map();
`

**Impact:** Session-States sind nur in einer Instanz verfÃ¼gbar. Bei mehreren Instanzen gehen Sessions verloren.

**LÃ¶sung:** State in Redis/DB persistieren. Siehe Phase 11.5.

---

### 3. Prisma Connection Pool nicht konfiguriert
**Datei:** packages/db/src/prisma.service.ts:35-37

**Problem:** PrismaClient wird ohne Connection Pool Limits erstellt:
`	ypescript
this.client = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
`

**Impact:** Bei Horizontal Scaling kann Connection Pool Exhaustion auftreten.

**LÃ¶sung:** Connection Pool Limits konfigurieren:
`	ypescript
this.client = new PrismaClient({
  log: ...,
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection Pool Limits
  // Prisma verwendet DATABASE_URL Parameter: ?connection_limit=10&pool_timeout=20
});
`

**Referenz:** Prisma Connection Pooling via URL-Parameter: ?connection_limit=10&pool_timeout=20

---

### 4. Fehlende Health-Checks
**Dateien:**
- pps/services/chat-service/src/main.ts - Kein Health-Endpoint
- pps/services/rag-service/src/main.ts - Kein Health-Endpoint
- pps/services/agent-service/src/main.ts - Kein Health-Endpoint
- pps/services/crawler-service/src/main.ts - Kein Health-Endpoint
- pps/services/voice-service/src/main.ts - Kein Health-Endpoint

**Problem:** Nur Gateway hat dokumentierte Health-Endpoints. Andere Services haben keine.

**Impact:** Load Balancer kÃ¶nnen Health nicht prÃ¼fen. Kubernetes Readiness/Liveness Probes fehlen.

**LÃ¶sung:** Health-Module fÃ¼r alle Services implementieren (siehe Gateway als Vorlage).

---

### 5. Hardcoded localhost URLs als Fallback
**Dateien:**
- pps/gateway/src/auth/token-blacklist.service.ts:24 - edis://localhost:6379
- pps/services/rag-service/src/vector-store/vector-store.service.ts:33 - http://localhost:9200
- pps/web/src/app/[locale]/chat/chat-content.tsx:35 - ws://localhost:3006/chat
- pps/customer-portal/src/lib/api.ts:3 - http://localhost:3001

**Problem:** Hardcoded localhost URLs als Fallback verhindern korrekte Konfiguration in Production.

**Impact:** Services kÃ¶nnen in Production nicht korrekt verbinden, wenn ENV-Variablen fehlen.

**LÃ¶sung:** Fail-fast bei fehlenden ENV-Variablen (siehe Phase 3).

---

## P1 - Wichtig (Bald beheben)

### 6. In-Memory Event History (mit Redis-Option)
**Datei:** packages/core/src/compliance/audit-replay.service.ts:30-31

**Problem:** 
`	ypescript
private eventHistory: Map<string, Event[]> = new Map(); // In-Memory Cache
private replaySessions: Map<string, ReplaySession> = new Map();
`

**Status:** Redis-Option vorhanden, aber In-Memory als Fallback. Bei mehreren Instanzen nicht konsistent.

**Impact:** Event History kann zwischen Instanzen unterschiedlich sein.

**LÃ¶sung:** Redis als Required machen oder DB-Persistierung.

---

### 7. Fehlende Input-Validierung (Zod)
**Dateien:**
- pps/services/chat-service/src/** - DTOs ohne Zod-Validierung
- pps/services/crawler-service/src/** - URLs nicht validiert
- pps/services/rag-service/src/** - Query-Parameter nicht validiert

**Problem:** DTOs verwenden nur NestJS ValidationPipe, aber keine explizite Zod-Schemas.

**Impact:** Unsichere Inputs kÃ¶nnen durchkommen.

**LÃ¶sung:** Zod-Schemas fÃ¼r alle DTOs (siehe Phase 2).

---

### 8. Fehlende Tests
**Status:** Viele Services haben keine Tests.

**Impact:** Keine Sicherheit bei Refactoring.

**LÃ¶sung:** Unit/Integration Tests implementieren (siehe Phase 10).

---

### 9. WebSocket State nicht externalisiert
**Datei:** pps/services/chat-service/src/websocket/**

**Problem:** WebSocket-Verbindungen sind pro Instanz. Bei mehreren Instanzen kÃ¶nnen Clients nicht alle Nachrichten empfangen.

**Impact:** Horizontal Scaling fÃ¼r WebSocket nicht mÃ¶glich.

**LÃ¶sung:** Redis Adapter fÃ¼r Socket.io (siehe Phase 11.5).

---

### 10. Fehlende Resource Limits
**Dateien:**
- docker-compose.yml - Keine CPU/Memory Limits
- pps/*/src/main.ts - Keine MAX_CONCURRENT_REQUESTS Limits

**Problem:** Services kÃ¶nnen unbegrenzt Ressourcen verbrauchen.

**Impact:** Ein Service kann das gesamte System Ã¼berlasten.

**LÃ¶sung:** Resource Limits in Docker/K8s und ENV-Variablen (siehe Phase 11.5).

---

## P2 - Nice-to-have (Optimierungen)

### 11. TODOs in Schema
**Datei:** packages/db/schema.prisma:39-44, 274

**Problem:** Kommentierte Models (KBArticle, F13Config, Dashboard, Widget, AlertRule, Alert).

**Impact:** Unklar ob diese Features geplant sind.

**LÃ¶sung:** Entweder implementieren oder entfernen.

---

### 12. Fehlende OpenAPI-Specs
**Status:** Nur Gateway hat Swagger. Andere Services nicht.

**Impact:** Keine automatische API-Dokumentation.

**LÃ¶sung:** OpenAPI-Specs generieren (siehe Phase 4).

---

### 13. Fehlende ENV-Schemas pro Service
**Status:** Nur zentraler Validator in packages/config/src/env-validator.ts.

**Problem:** Services haben keine eigenen ENV-Schemas fÃ¼r Fail-Fast.

**Impact:** Fehler werden erst zur Laufzeit erkannt.

**LÃ¶sung:** ENV-Schemas pro Service (siehe Phase 3).

---

### 14. Code-Duplikation
**Dateien:**
- pps/services/*/src/main.ts - Ã„hnliche Bootstrap-Logik
- pps/services/*/src/**/dto/** - Ã„hnliche DTO-Strukturen

**Problem:** Viel Code-Duplikation zwischen Services.

**Impact:** Wartungsaufwand, Inkonsistenzen.

**LÃ¶sung:** Shared Bootstrap-Module, gemeinsame DTOs.

---

## Skalierungs-Hindernisse (P0/P1)

### P0 - Verhindert Horizontal Scaling
1. **In-Memory Session State** (packages/core/src/orchestrator/state.service.ts:25)
2. **WebSocket ohne Redis Adapter** (pps/services/chat-service/src/websocket/**)
3. **Connection Pool nicht konfiguriert** (packages/db/src/prisma.service.ts:35)

### P1 - Skalierungs-Risiken
1. **In-Memory Event History** (packages/core/src/compliance/audit-replay.service.ts:30)
2. **Fehlende Resource Limits** (Docker/K8s)
3. **Fehlende Health-Checks** (Load Balancer kÃ¶nnen nicht prÃ¼fen)

---

## Zusammenfassung

- **P0 Issues:** 5 (Port-Konflikt, In-Memory State, Connection Pool, Health-Checks, Hardcoded URLs)
- **P1 Issues:** 5 (Event History, Input-Validierung, Tests, WebSocket, Resource Limits)
- **P2 Issues:** 4 (TODOs, OpenAPI, ENV-Schemas, Code-Duplikation)

**NÃ¤chste Schritte:**
1. Port-Konflikt beheben (P0)
2. In-Memory State â†’ Redis/DB (P0)
3. Connection Pool konfigurieren (P0)
4. Health-Checks implementieren (P0)
5. Hardcoded URLs entfernen (P0)
