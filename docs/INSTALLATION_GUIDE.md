# WattOS Plattform - Installationsanleitung

Diese Anleitung fÃ¼hrt Sie Schritt fÃ¼r Schritt durch die Installation, den Build-Prozess und lokale Tests der WattOS Plattform.

## Voraussetzungen

Bevor Sie beginnen, stellen Sie sicher, dass folgende Software installiert ist:

### Erforderlich

- **Node.js** >= 20.9.0
  ```bash
  node --version
  ```
  
- **pnpm** >= 9.0.0
  ```bash
  pnpm --version
  # Falls nicht installiert: npm install -g pnpm
  ```

- **PostgreSQL** 16+ (mit pgvector Extension)
  ```bash
  psql --version
  ```

- **Redis** 7+
  ```bash
  redis-cli --version
  ```

### Optional

- **Docker & Docker Compose** (fÃ¼r Container-Deployment)
  ```bash
  docker --version
  docker compose version
  ```

## Phase 1: Voraussetzungen prÃ¼fen

### 1.1 Node.js Version prÃ¼fen

```bash
node --version
# Sollte >= 20.9.0 sein
```

Falls die Version zu niedrig ist, installieren Sie Node.js von [nodejs.org](https://nodejs.org/).

### 1.2 pnpm Version prÃ¼fen

```bash
pnpm --version
# Sollte >= 9.0.0 sein
```

Falls pnpm nicht installiert ist:

```bash
npm install -g pnpm
```

### 1.3 PostgreSQL prÃ¼fen

```bash
psql --version
# Sollte >= 16.0 sein
```

Stellen Sie sicher, dass PostgreSQL lÃ¤uft:

```bash
# Windows (PowerShell)
Get-Service -Name postgresql*

# Linux/Mac
sudo systemctl status postgresql
# oder
brew services list | grep postgresql
```

### 1.4 Redis prÃ¼fen

```bash
redis-cli --version
# Sollte >= 7.0 sein
```

Stellen Sie sicher, dass Redis lÃ¤uft:

```bash
# Windows (PowerShell)
Get-Service -Name redis*

# Linux/Mac
sudo systemctl status redis
# oder
brew services list | grep redis
```

### 1.5 pgvector Extension installieren

Die PostgreSQL-Erweiterung `pgvector` ist fÃ¼r den Vector Store erforderlich:

```bash
# In PostgreSQL verbinden
psql -U postgres -d wattos_plattform

# Extension installieren
CREATE EXTENSION IF NOT EXISTS vector;
```

## Phase 2: Repository Setup

### 2.1 Repository klonen (falls neu)

```bash
git clone https://github.com/WattWelten/wattos_plattform.git
cd wattos_plattform
```

### 2.2 Git-Status prÃ¼fen

```bash
git status
```

Stellen Sie sicher, dass keine unerwarteten Ã„nderungen vorhanden sind.

## Phase 3: Dependencies installieren

### 3.1 Dependencies installieren

```bash
pnpm install
```

Dieser Befehl installiert alle Dependencies fÃ¼r alle Workspace-Pakete.

**Erwartete Ausgabe:**
- Keine Fehler
- MÃ¶gliche Warnungen Ã¼ber deprecated subdependencies (nicht kritisch)
- Keine zyklischen Dependencies (bereits behoben)

### 3.2 Bei Installationsfehlern

Falls Fehler auftreten:

```bash
# 1. pnpm Cache bereinigen
pnpm clean:cache

# 2. Erneut installieren
pnpm install
```

Falls weiterhin Probleme auftreten:

```bash
# Umfassendes Cleanup
pnpm clean:all

# Erneut installieren
pnpm install
```

## Phase 4: Umgebungsvariablen konfigurieren

### 4.1 .env Datei erstellen

```bash
# PrÃ¼fen ob .env.example existiert
ls .env.example

# .env Datei erstellen/kopieren
cp .env.example .env
# oder manuell erstellen
```

### 4.2 Wichtige Umgebungsvariablen setzen

Ã–ffnen Sie die `.env` Datei und setzen Sie folgende Variablen:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/wattos_plattform

# Redis
REDIS_URL=redis://localhost:6379

# API Gateway
API_GATEWAY_PORT=3001
JWT_SECRET=your-secret-key-here-min-32-chars

# Services URLs (optional, Standard-Ports werden verwendet)
CHAT_SERVICE_URL=http://localhost:3006
RAG_SERVICE_URL=http://localhost:3007
AGENT_SERVICE_URL=http://localhost:3008

# LLM Provider Keys (optional fÃ¼r lokale Tests)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
GOOGLE_API_KEY=your-google-key
```

**Wichtig:**
- `JWT_SECRET` sollte mindestens 32 Zeichen lang und zufÃ¤llig sein
- `DATABASE_URL` muss auf eine laufende PostgreSQL-Instanz zeigen
- `REDIS_URL` muss auf eine laufende Redis-Instanz zeigen

### 4.3 Umgebungsvariablen validieren

```bash
# PrÃ¼fen ob .env Datei existiert
ls .env

# PrÃ¼fen ob wichtige Variablen gesetzt sind (optional)
grep DATABASE_URL .env
grep REDIS_URL .env
grep JWT_SECRET .env
```

## Phase 5: Datenbank-Setup

### 5.1 PostgreSQL-Verbindung testen

```bash
# Mit psql verbinden
psql -U postgres -d wattos_plattform

# Falls Datenbank nicht existiert, erstellen:
# CREATE DATABASE wattos_plattform;
```

### 5.2 Datenbank-Migrationen ausfÃ¼hren

```bash
pnpm db:migrate
```

Dieser Befehl fÃ¼hrt alle Prisma-Migrationen aus und erstellt die Datenbank-Struktur.

**Erwartete Ausgabe:**
- Migrationen werden erfolgreich ausgefÃ¼hrt
- Keine Fehler

### 5.3 Migration-Status prÃ¼fen

```bash
# Optional: Prisma Studio Ã¶ffnen um Datenbank zu prÃ¼fen
npx prisma studio
```

## Phase 6: Build-Prozess

### 6.1 Type-Check

```bash
pnpm type-check
```

Dieser Befehl prÃ¼ft alle TypeScript-Dateien auf Typfehler.

**Erwartete Ausgabe:**
- Keine Type-Fehler
- Alle Packages erfolgreich geprÃ¼ft

### 6.2 Lint

```bash
pnpm lint
```

Dieser Befehl prÃ¼ft den Code auf Linting-Fehler.

**Bei Fehlern:**
```bash
# Automatisch beheben (wenn mÃ¶glich)
pnpm lint:fix
```

### 6.3 Build

**Option 1: Alle Packages bauen**
```bash
pnpm build
```

**Option 2: Nur MVP-Services bauen (schneller)**
```bash
pnpm build:mvp
```

Dieser Befehl baut:
- Gateway
- Web Frontend
- Chat Service
- Agent Service
- RAG Service
- Avatar Service
- Voice Service
- Crawler Service

**Erwartete Ausgabe:**
- Alle Packages erfolgreich gebaut
- Keine Build-Fehler

### 6.4 Bei Build-Fehlern

```bash
# Build-Artefakte bereinigen
pnpm clean:build

# Erneut bauen
pnpm build
```

## Phase 7: Lokale Tests

### 7.1 Unit Tests

```bash
pnpm test:unit
```

Dieser Befehl fÃ¼hrt alle Unit-Tests aus.

**Erwartete Ausgabe:**
- Alle Tests erfolgreich
- Coverage-Report (optional)

### 7.2 Integration Tests

**Hinweis:** Integration-Tests erfordern laufende Services.

```bash
# Services starten (in separatem Terminal)
pnpm dev:mvp

# In anderem Terminal: Integration Tests
pnpm test:integration
```

### 7.3 E2E Tests (optional)

```bash
# E2E Tests mit Playwright
pnpm test:e2e
```

**Hinweis:** E2E-Tests erfordern eine vollstÃ¤ndig laufende Umgebung.

## Phase 8: Entwicklungsserver starten

### 8.1 Services starten

**Option 1: Alle Services starten**
```bash
pnpm dev
```

**Option 2: Nur MVP-Services starten (empfohlen fÃ¼r Entwicklung)**
```bash
pnpm dev:mvp
```

Dieser Befehl startet:
- Gateway (Port 3001)
- Web Frontend (Port 3000)
- Chat Service (Port 3006)
- Agent Service (Port 3008)
- RAG Service (Port 3007)
- Avatar Service (Port 3015)
- Voice Service (Port 3016)
- Crawler Service (Port 3017)

### 8.2 Health Checks

```bash
# Health Check Script (falls verfÃ¼gbar)
pnpm smoke
```

### 8.3 Services prÃ¼fen

**Gateway API Dokumentation:**
- Ã–ffnen Sie: http://localhost:3001/api/docs
- Swagger UI sollte angezeigt werden

**Web Frontend:**
- Ã–ffnen Sie: http://localhost:3000
- Web-App sollte geladen werden

**Service Health Endpoints:**
- Gateway: http://localhost:3001/health
- Chat Service: http://localhost:3006/health
- Agent Service: http://localhost:3008/health
- RAG Service: http://localhost:3007/health

## Validierung nach Installation

### Checkliste

- [ ] Alle Dependencies installiert ohne Fehler
- [ ] Type-Check erfolgreich (`pnpm type-check`)
- [ ] Lint erfolgreich (`pnpm lint`)
- [ ] Build erfolgreich (`pnpm build` oder `pnpm build:mvp`)
- [ ] Datenbank-Migrationen erfolgreich (`pnpm db:migrate`)
- [ ] Services starten ohne Fehler (`pnpm dev:mvp`)
- [ ] Gateway erreichbar (http://localhost:3001/api/docs)
- [ ] Web-App erreichbar (http://localhost:3000)
- [ ] Unit Tests erfolgreich (`pnpm test:unit`)

## Troubleshooting

### Problem: pnpm Installation-Fehler

**Symptom:** Fehler beim `pnpm install`

**LÃ¶sung:**
```bash
# 1. pnpm Cache bereinigen
pnpm clean:cache

# 2. Erneut installieren
pnpm install
```

Falls weiterhin Probleme:
```bash
# Umfassendes Cleanup
pnpm clean:all

# Erneut installieren
pnpm install
```

### Problem: Build-Fehler

**Symptom:** Fehler beim `pnpm build`

**LÃ¶sung:**
```bash
# 1. Build-Artefakte bereinigen
pnpm clean:build

# 2. Erneut bauen
pnpm build
```

Falls Type-Fehler:
```bash
# Type-Check ausfÃ¼hren
pnpm type-check

# Fehler beheben und erneut bauen
pnpm build
```

### Problem: Zyklische Dependencies

**Symptom:** Warnung Ã¼ber zyklische Dependencies

**LÃ¶sung:**
Dieses Problem wurde bereits behoben. Falls es weiterhin auftritt:
```bash
# Dependencies neu installieren
pnpm clean:cache
pnpm install
```

### Problem: Port-Konflikte

**Symptom:** Port bereits belegt (z.B. Port 3001)

**LÃ¶sung:**
1. Port in `.env` Datei Ã¤ndern:
   ```env
   API_GATEWAY_PORT=3002
   ```

2. Oder anderen Prozess beenden:
   ```bash
   # Windows (PowerShell)
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -ti:3001 | xargs kill
   ```

### Problem: Datenbank-Verbindung

**Symptom:** Fehler bei `pnpm db:migrate`

**LÃ¶sung:**
1. PostgreSQL lÃ¤uft prÃ¼fen:
   ```bash
   # Windows
   Get-Service -Name postgresql*
   
   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. `DATABASE_URL` in `.env` prÃ¼fen:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/wattos_plattform
   ```

3. Datenbank existiert prÃ¼fen:
   ```bash
   psql -U postgres -l | grep wattos_plattform
   ```

4. Falls Datenbank nicht existiert:
   ```bash
   psql -U postgres
   CREATE DATABASE wattos_plattform;
   ```

### Problem: Redis-Verbindung

**Symptom:** Fehler bei Service-Start (Redis-Verbindung)

**LÃ¶sung:**
1. Redis lÃ¤uft prÃ¼fen:
   ```bash
   # Windows
   Get-Service -Name redis*
   
   # Linux/Mac
   sudo systemctl status redis
   ```

2. `REDIS_URL` in `.env` prÃ¼fen:
   ```env
   REDIS_URL=redis://localhost:6379
   ```

3. Redis-Verbindung testen:
   ```bash
   redis-cli ping
   # Sollte "PONG" zurÃ¼ckgeben
   ```

### Problem: Services starten nicht

**Symptom:** Services starten nicht oder crashen sofort

**LÃ¶sung:**
1. Logs prÃ¼fen:
   ```bash
   # In Terminal wo Services laufen
   # Fehler sollten in der Konsole angezeigt werden
   ```

2. Umgebungsvariablen prÃ¼fen:
   ```bash
   # .env Datei prÃ¼fen
   cat .env
   ```

3. Dependencies prÃ¼fen:
   ```bash
   pnpm install
   ```

4. Build prÃ¼fen:
   ```bash
   pnpm build:mvp
   ```

## NÃ¤chste Schritte

Nach erfolgreicher Installation:

1. **Dokumentation lesen:**
   - [Architektur-Ãœbersicht](./ARCHITECTURE_OVERVIEW.md)
   - [Developer Setup](./DEVELOPER_SETUP.md)
   - [Environment Variables](./ENVIRONMENT_VARIABLES.md)

2. **Erste Schritte:**
   - Web-App Ã¶ffnen: http://localhost:3000
   - API-Dokumentation: http://localhost:3001/api/docs
   - Admin-Konsole erkunden

3. **Entwicklung:**
   - Code-Standards: [Code Quality Standards](./CODE_QUALITY_STANDARDS.md)
   - Contributing: [Contributing Guide](../CONTRIBUTING.md)

## Support

Bei Problemen:

1. PrÃ¼fen Sie diese Anleitung
2. PrÃ¼fen Sie die [Troubleshooting-Sektion](#troubleshooting)
3. PrÃ¼fen Sie die [Runbooks](./runbooks/) fÃ¼r spezifische Probleme
4. Erstellen Sie ein Issue auf GitHub