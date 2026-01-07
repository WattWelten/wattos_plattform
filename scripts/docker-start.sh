#!/bin/bash
# scripts/docker-start.sh
# Startet Docker Compose fÃ¼r MVP-Entwicklungsumgebung (WSL/Linux)
# Automatisiert mit Admin-Rechte-PrÃ¼fung

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Farben fÃ¼r Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}ðŸ³ Starting Docker services for MVP development stack...${NC}"
echo ""

# PrÃ¼fe ob wir in WSL sind
if grep -qEi "(Microsoft|WSL)" /proc/version &> /dev/null ; then
    echo -e "${YELLOW}ðŸ“¦ WSL environment detected${NC}"
    # PrÃ¼fe ob Docker Desktop lÃ¤uft (WSL Integration)
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}âŒ Docker is not running.${NC}"
        echo -e "${YELLOW}   Please ensure Docker Desktop is running and WSL integration is enabled.${NC}"
        echo -e "${YELLOW}   Docker Desktop â†’ Settings â†’ Resources â†’ WSL Integration â†’ Enable${NC}"
        exit 1
    fi
else
    # Native Linux - prÃ¼fe ob Docker daemon lÃ¤uft
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}âŒ Docker daemon is not running.${NC}"
        echo -e "${YELLOW}   Attempting to start Docker daemon...${NC}"
        # Versuche Docker zu starten (benÃ¶tigt sudo)
        if command -v sudo > /dev/null 2>&1; then
            sudo systemctl start docker 2>/dev/null || {
                echo -e "${RED}   Failed to start Docker. Please run: sudo systemctl start docker${NC}"
                exit 1
            }
            # FÃ¼ge aktuellen User zur docker-Gruppe hinzu (falls nÃ¶tig)
            if ! groups | grep -q docker; then
                echo -e "${YELLOW}   Adding user to docker group (requires password)...${NC}"
                sudo usermod -aG docker "$USER" || true
            fi
        else
            echo -e "${RED}   Please start Docker manually or install sudo.${NC}"
            exit 1
        fi
    fi
fi

# PrÃ¼fe ob docker-compose verfÃ¼gbar ist
COMPOSE_CMD="docker compose"
if ! docker compose version > /dev/null 2>&1; then
    if command -v docker-compose > /dev/null 2>&1; then
        COMPOSE_CMD="docker-compose"
    else
        echo -e "${RED}âŒ Docker Compose is not available.${NC}"
        echo -e "${YELLOW}   Install Docker Compose V2 or docker-compose V1${NC}"
        exit 1
    fi
fi

# PrÃ¼fe ob Ports bereits belegt sind
check_port() {
    local port=$1
    local service=$2
    if command -v netstat > /dev/null 2>&1; then
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            echo -e "${YELLOW}âš ï¸  Port $port is already in use (may be from previous Docker container)${NC}"
        fi
    elif command -v ss > /dev/null 2>&1; then
        if ss -tuln 2>/dev/null | grep -q ":$port "; then
            echo -e "${YELLOW}âš ï¸  Port $port is already in use (may be from previous Docker container)${NC}"
        fi
    fi
}

check_port 5432 "PostgreSQL"
check_port 6379 "Redis"

# Starte Services im Hintergrund
echo -e "${CYAN}ðŸ“¦ Starting PostgreSQL (with pgvector) and Redis...${NC}"
$COMPOSE_CMD up -d

# Warte auf Healthchecks
echo ""
echo -e "${YELLOW}â³ Waiting for services to be healthy (max 30s)...${NC}"

timeout=30
healthy=false
while [ $timeout -gt 0 ]; do
    if $COMPOSE_CMD ps 2>/dev/null | grep -q "healthy"; then
        healthy=true
        break
    fi
    sleep 1
    timeout=$((timeout-1))
    echo -n "."
done
echo ""

if [ "$healthy" = true ]; then
    echo -e "${GREEN}âœ… All services are healthy!${NC}"
elif $COMPOSE_CMD ps 2>/dev/null | grep -q "Up"; then
    echo -e "${YELLOW}âš ï¸  Services are running but health checks may still be pending...${NC}"
    echo -e "${YELLOW}   Run 'docker compose ps' to check status${NC}"
else
    echo -e "${RED}âŒ Some services failed to start.${NC}"
    echo -e "${YELLOW}   Check logs with: $COMPOSE_CMD logs${NC}"
    $COMPOSE_CMD ps
    exit 1
fi

echo ""
echo -e "${CYAN}ðŸ“Š Service Status:${NC}"
$COMPOSE_CMD ps

echo ""
echo -e "${CYAN}ðŸ”— Service URLs:${NC}"
echo "   PostgreSQL: localhost:5432"
echo "   Redis: localhost:6379"
echo ""
echo -e "${CYAN}ðŸ“ Useful commands:${NC}"
echo "   View logs:    $COMPOSE_CMD logs -f"
echo "   Stop:         $COMPOSE_CMD down"
echo "   Stop + Volumes: $COMPOSE_CMD down -v"
echo "   Status:       $COMPOSE_CMD ps"
echo ""
echo -e "${GREEN}âœ… Docker stack is ready for development!${NC}"
