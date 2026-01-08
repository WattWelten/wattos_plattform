#!/bin/bash

# WattOS Plattform - Lokales Setup-Skript (Linux/macOS/WSL)
# Prüft Voraussetzungen, startet Docker Services und führt Setup aus

set -e

# Farben für Terminal-Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}WattOS Plattform - Lokales Setup${NC}\n"

# Funktionen
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 gefunden"
        return 0
    else
        echo -e "${RED}✗${NC} $1 nicht gefunden"
        return 1
    fi
}

wait_for_service() {
    local host=$1
    local port=$2
    local service=$3
    local max_attempts=30
    local attempt=0
    
    echo -e "${BLUE}Warte auf $service...${NC}"
    while [ $attempt -lt $max_attempts ]; do
        if nc -z "$host" "$port" 2>/dev/null || timeout 1 bash -c "echo > /dev/tcp/$host/$port" 2>/dev/null; then
            echo -e "${GREEN}✓${NC} $service ist bereit"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    echo -e "${RED}✗${NC} $service ist nicht bereit nach $max_attempts Versuchen"
    return 1
}

# 1. Prüfe Voraussetzungen
echo -e "${BLUE}1. Prüfe Voraussetzungen...${NC}"
MISSING_DEPS=0

check_command node || MISSING_DEPS=1
check_command pnpm || MISSING_DEPS=1
check_command docker || MISSING_DEPS=1

# Prüfe docker-compose (kann docker compose sein)
if docker compose version &>/dev/null || docker-compose version &>/dev/null; then
    echo -e "${GREEN}✓${NC} docker compose gefunden"
else
    echo -e "${RED}✗${NC} docker compose nicht gefunden"
    MISSING_DEPS=1
fi

if [ $MISSING_DEPS -eq 1 ]; then
    echo -e "\n${RED}Fehlende Abhängigkeiten gefunden!${NC}"
    echo -e "${YELLOW}Bitte installiere die fehlenden Tools:${NC}"
    echo -e "  - Node.js >= 20.9.0: https://nodejs.org/"
    echo -e "  - pnpm >= 9.0.0: npm install -g pnpm"
    echo -e "  - Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Prüfe Node.js Version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1,2)
REQUIRED_VERSION="20.9"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo -e "${RED}✗${NC} Node.js Version $NODE_VERSION gefunden, aber >= $REQUIRED_VERSION erforderlich"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js Version: $(node -v)"

# Prüfe pnpm Version
PNPM_VERSION=$(pnpm -v | cut -d'.' -f1)
if [ "$PNPM_VERSION" -lt 9 ]; then
    echo -e "${RED}✗${NC} pnpm Version $(pnpm -v) gefunden, aber >= 9.0.0 erforderlich"
    exit 1
fi
echo -e "${GREEN}✓${NC} pnpm Version: $(pnpm -v)\n"

# 2. Erstelle .env aus .env.example falls nicht vorhanden
echo -e "${BLUE}2. Prüfe .env Datei...${NC}"
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓${NC} .env aus .env.example erstellt"
        echo -e "${YELLOW}⚠${NC} Bitte bearbeite .env und passe die Werte an (besonders JWT_SECRET und API Keys)"
    else
        echo -e "${YELLOW}⚠${NC} .env.example nicht gefunden, erstelle .env manuell"
    fi
else
    echo -e "${GREEN}✓${NC} .env bereits vorhanden"
fi
echo ""

# 3. Installiere Dependencies
echo -e "${BLUE}3. Installiere Dependencies...${NC}"
pnpm install
echo -e "${GREEN}✓${NC} Dependencies installiert\n"

# 4. Starte Docker Compose Services
echo -e "${BLUE}4. Starte Docker Compose Services...${NC}"
if [ -f docker-compose.yml ]; then
    if docker compose version &>/dev/null; then
        docker compose up -d
    else
        docker-compose up -d
    fi
    echo -e "${GREEN}✓${NC} Docker Compose Services gestartet"
    
    # Warte auf Services
    wait_for_service localhost 5432 "PostgreSQL" || true
    wait_for_service localhost 6379 "Redis" || true
else
    echo -e "${YELLOW}⚠${NC} docker-compose.yml nicht gefunden"
    echo -e "${YELLOW}⚠${NC} Bitte starte PostgreSQL und Redis manuell"
fi
echo ""

# 5. Führe Datenbank-Migrationen aus
echo -e "${BLUE}5. Führe Datenbank-Migrationen aus...${NC}"
if command -v pnpm &> /dev/null; then
    pnpm db:migrate || {
        echo -e "${YELLOW}⚠${NC} Migrationen fehlgeschlagen, aber Setup wird fortgesetzt"
    }
else
    echo -e "${YELLOW}⚠${NC} pnpm nicht verfügbar, Migrationen übersprungen"
fi
echo ""

# 6. Type-Check (optional)
echo -e "${BLUE}6. Führe Type-Check aus...${NC}"
if command -v pnpm &> /dev/null; then
    pnpm type-check || {
        echo -e "${YELLOW}⚠${NC} Type-Check mit Fehlern, aber Setup wird fortgesetzt"
    }
else
    echo -e "${YELLOW}⚠${NC} pnpm nicht verfügbar, Type-Check übersprungen"
fi
echo ""

# Zusammenfassung
echo -e "${CYAN}Setup abgeschlossen!${NC}\n"
echo -e "${GREEN}Nächste Schritte:${NC}"
echo -e "  1. Bearbeite .env und setze JWT_SECRET und API Keys"
echo -e "  2. Starte die Services: ${CYAN}pnpm dev:mvp${NC}"
echo -e "  3. Prüfe Health: ${CYAN}pnpm smoke${NC}"
echo ""
