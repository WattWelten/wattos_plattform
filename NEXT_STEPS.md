# Naechste Schritte - WattOS Plattform

## Prioritaeten

### 1. Services starten
- Docker: pnpm dev:stack
- Gateway: cd apps/gateway && pnpm dev
- Web: cd apps/web && pnpm dev

### 2. E2E-Tests
- cd apps/web && pnpm test:e2e

### 3. Embeddings generieren
- RAG-Service starten
- Dokumente ueber Gateway hochladen

### 4. Dashboard mit echten Daten
- API-Endpoints implementieren
- Mock-Daten ersetzen

Siehe STATUS.md fuer aktuellen Stand.
