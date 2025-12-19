#!/bin/bash
set -euo pipefail

# Intelligente Log-Analyse für GitHub Actions und Railway
# Erkennt Fehlermuster und generiert Lösungsvorschläge

ENVIRONMENT=${1:-production}
SOURCE=${2:-all}  # all, github, railway
SERVICE=${3:-}    # Optional: spezifischer Service
REPORT_DIR="log-analysis-$(date +%Y%m%d-%H%M%S)"
REPORT_FILE="$REPORT_DIR/analysis-report.md"
ERRORS_FILE="$REPORT_DIR/errors.json"
SOLUTIONS_FILE="$REPORT_DIR/solutions.md"
PATTERNS_FILE="$REPORT_DIR/patterns.json"

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fehler-Sammlung
declare -a CRITICAL_ERRORS=()
declare -a WARNINGS=()
declare -a INFO=()
declare -A ERROR_PATTERNS=()
declare -A SOLUTIONS=()

# Services aus services-config.json
SERVICES=(
  "api-gateway"
  "chat-service"
  "rag-service"
  "agent-service"
  "llm-gateway"
  "tool-service"
  "customer-intelligence-service"
  "crawler-service"
  "voice-service"
  "avatar-service"
  "character-service"
  "admin-service"
  "summary-service"
  "feedback-service"
  "metaverse-service"
  "ingestion-service"
)

# Helper Functions
log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✅${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠️${NC} $1"; }
log_error() { echo -e "${RED}❌${NC} $1"; }
log_section() { echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

# Initialisierung
init_report() {
  mkdir -p "$REPORT_DIR"
  
  cat > "$REPORT_FILE" <<EOF
# Intelligente Log-Analyse Report

**Datum:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Umgebung:** $ENVIRONMENT
**Quelle:** $SOURCE
**Service:** ${SERVICE:-alle}

## Zusammenfassung

EOF

  echo "[]" > "$ERRORS_FILE"
  log_success "Report-Verzeichnis erstellt: $REPORT_DIR"
}

# Fehlermuster definieren
define_error_patterns() {
  # Build-Fehler
  ERROR_PATTERNS["build_npm_error"]="npm ERR|pnpm ERR|npm install failed"
  ERROR_PATTERNS["build_compile_error"]="compilation error|TypeScript error|build failed"
  ERROR_PATTERNS["build_dependency_error"]="dependency|module not found|package.*not found"
  
  # Environment-Fehler
  ERROR_PATTERNS["env_missing"]="undefined|missing|required|env var not set|environment variable"
  ERROR_PATTERNS["env_invalid"]="invalid.*env|wrong.*env|env.*error"
  
  # Port-Fehler
  ERROR_PATTERNS["port_conflict"]="port.*already.*in.*use|EADDRINUSE|bind.*error|address already in use"
  
  # Database-Fehler
  ERROR_PATTERNS["db_connection"]="connection refused|ECONNREFUSED|database.*connection|connection.*failed"
  ERROR_PATTERNS["db_migration"]="migration.*failed|migration.*error|prisma.*error"
  
  # Service-Discovery-Fehler
  ERROR_PATTERNS["service_not_found"]="service.*not found|URL.*not found|404|connection timeout"
  ERROR_PATTERNS["service_unavailable"]="503|service unavailable|502|bad gateway"
  
  # Memory/Resource-Fehler
  ERROR_PATTERNS["memory_error"]="out of memory|OOM|memory limit exceeded|heap.*overflow"
  ERROR_PATTERNS["resource_error"]="resource.*limit|quota.*exceeded|rate.*limit"
  
  # Start-Fehler
  ERROR_PATTERNS["start_error"]="cannot.*start|failed.*start|startup.*error|application.*failed"
  
  # Health-Check-Fehler
  ERROR_PATTERNS["health_failed"]="health.*failed|health.*error|/health.*404|/health.*500"
}

# Lösungsvorschläge definieren
define_solutions() {
  SOLUTIONS["build_npm_error"]="1. Prüfe package.json Dependencies
2. Führe aus: npm install --legacy-peer-deps
3. Prüfe Node.js Version (sollte 20 sein)
4. Lösche node_modules und package-lock.json, dann npm install"

  SOLUTIONS["build_compile_error"]="1. Prüfe TypeScript-Fehler: npm run build
2. Prüfe tsconfig.json Konfiguration
3. Prüfe auf fehlende Type-Definitionen
4. Führe Type-Check aus: npx tsc --noEmit"

  SOLUTIONS["env_missing"]="1. Prüfe .railway-secrets.env Datei
2. Setze fehlende ENV-Vars in Railway Dashboard
3. Prüfe services-config.json für erforderliche Variablen
4. Führe aus: ./scripts/setup-railway-env-vars.sh"

  SOLUTIONS["port_conflict"]="1. Prüfe ob mehrere Instanzen laufen
2. Prüfe PORT env var (Railway setzt diese automatisch)
3. Verwende process.env.PORT statt hardcoded Ports
4. Prüfe railway.json startCommand"

  SOLUTIONS["db_connection"]="1. Prüfe DATABASE_URL env var
2. Prüfe ob PostgreSQL Service läuft
3. Prüfe Network-Zugriff zu Database
4. Teste Connection: railway variables --service <service> | grep DATABASE_URL"

  SOLUTIONS["db_migration"]="1. Prüfe Prisma Migration Status
2. Führe Migration aus: npx prisma migrate deploy
3. Prüfe Prisma Schema auf Fehler
4. Prüfe Database-Zugriffsrechte"

  SOLUTIONS["service_not_found"]="1. Prüfe ob Service deployed ist
2. Prüfe Service-URLs: ./scripts/sync-service-urls.sh
3. Prüfe Service Discovery Konfiguration
4. Prüfe Health-Check: curl https://<service-url>/health"

  SOLUTIONS["memory_error"]="1. Erhöhe Memory-Limit in Railway Dashboard
2. Prüfe auf Memory-Leaks im Code
3. Prüfe Service-Resource-Usage
4. Optimiere Code (z.B. Streaming für große Daten)"

  SOLUTIONS["start_error"]="1. Prüfe Start-Command in railway.json
2. Prüfe Logs für detaillierte Fehlermeldung
3. Prüfe ob alle Dependencies installiert sind
4. Teste Start lokal: npm run start:prod"

  SOLUTIONS["health_failed"]="1. Prüfe ob Service läuft: railway logs --service <service>
2. Prüfe Health-Endpoint: /health, /health/liveness, /health/readiness
3. Prüfe Service-Dependencies (DB, Redis, etc.)
4. Warte 60-90s nach Deployment für Service-Start"
}

# GitHub Actions Logs sammeln
collect_github_logs() {
  log_section
  log_info "Sammle GitHub Actions Logs..."
  
  if [ ! -d ".github" ]; then
    log_warning "GitHub Actions nicht gefunden (kein .github Verzeichnis)"
    return 1
  fi
  
  mkdir -p "$REPORT_DIR/github"
  
  # Versuche GitHub CLI falls verfügbar
  if command -v gh &> /dev/null; then
    log_info "Verwende GitHub CLI für Log-Sammlung..."
    
    # Sammle Workflow-Runs
    gh run list --limit 10 --json databaseId,workflowName,status,conclusion > "$REPORT_DIR/github/workflow-runs.json" 2>&1 || true
    
    # Sammle Logs für fehlgeschlagene Runs
    while IFS= read -r run_id; do
      if [ -n "$run_id" ]; then
        gh run view "$run_id" --log > "$REPORT_DIR/github/run-${run_id}.log" 2>&1 || true
      fi
    done < <(gh run list --limit 5 --json databaseId,conclusion --jq '.[] | select(.conclusion == "failure") | .databaseId' 2>/dev/null || echo "")
    
    log_success "GitHub Actions Logs gesammelt"
  else
    log_warning "GitHub CLI nicht installiert - Logs müssen manuell gesammelt werden"
    log_info "Installiere GitHub CLI: brew install gh (macOS) oder apt-get install gh (Linux)"
    log_info "Oder sammle Logs manuell von: https://github.com/$GITHUB_REPOSITORY/actions"
  fi
}

# Railway Logs sammeln
collect_railway_logs() {
  log_section
  log_info "Sammle Railway Logs..."
  
  if ! command -v railway &> /dev/null; then
    log_error "Railway CLI ist nicht installiert"
    log_info "Installiere: npm install -g @railway/cli"
    return 1
  fi
  
  # Prüfe Authentifizierung
  if ! railway whoami &> /dev/null 2>&1; then
    log_error "Nicht bei Railway eingeloggt"
    log_info "Führe aus: railway login"
    return 1
  fi
  
  mkdir -p "$REPORT_DIR/railway"
  
  local services_to_check=("${SERVICES[@]}")
  if [ -n "$SERVICE" ]; then
    services_to_check=("$SERVICE")
  fi
  
  for service in "${services_to_check[@]}"; do
    log_info "Sammle Logs für $service..."
    
    # Build-Logs
    railway logs --service "$service" --deployment latest --tail 500 > "$REPORT_DIR/railway/${service}-build.log" 2>&1 || true
    
    # Runtime-Logs (letzte 200 Zeilen)
    railway logs --service "$service" --tail 200 > "$REPORT_DIR/railway/${service}-runtime.log" 2>&1 || true
    
    # Service-Status
    railway service "$service" > "$REPORT_DIR/railway/${service}-status.txt" 2>&1 || true
  done
  
  log_success "Railway Logs gesammelt"
}

# Analysiere Log-Datei
analyze_log_file() {
  local log_file=$1
  local service_name=$2
  local log_type=$3  # build, runtime, github
  
  if [ ! -f "$log_file" ] || [ ! -s "$log_file" ]; then
    return 0
  fi
  
  log_info "Analysiere $log_type Logs für $service_name..."
  
  # Prüfe alle Fehlermuster
  for pattern_name in "${!ERROR_PATTERNS[@]}"; do
    local pattern="${ERROR_PATTERNS[$pattern_name]}"
    
    if grep -qiE "$pattern" "$log_file" 2>/dev/null; then
      local error_lines=$(grep -iE "$pattern" "$log_file" | head -5)
      local error_count=$(grep -icE "$pattern" "$log_file" || echo "0")
      
      # Kategorisiere nach Schweregrad
      case "$pattern_name" in
        build_*|start_error|db_connection|memory_error)
          CRITICAL_ERRORS+=("$service_name: $pattern_name ($error_count Vorkommen)")
          ;;
        *)
          WARNINGS+=("$service_name: $pattern_name ($error_count Vorkommen)")
          ;;
      esac
      
      # Speichere Fehler-Details
      {
        echo "  - **$service_name** ($log_type): $pattern_name"
        echo "    - Vorkommen: $error_count"
        echo "    - Beispiele:"
        echo "$error_lines" | sed 's/^/      - /'
        echo ""
      } >> "$REPORT_FILE"
      
      # Lösungsvorschlag hinzufügen
      if [ -n "${SOLUTIONS[$pattern_name]:-}" ]; then
        {
          echo "### Lösung für $service_name: $pattern_name"
          echo ""
          echo "${SOLUTIONS[$pattern_name]}"
          echo ""
        } >> "$SOLUTIONS_FILE"
      fi
    fi
  done
}

# Haupt-Analyse
main_analysis() {
  log_section
  log_info "Starte intelligente Log-Analyse..."
  
  # GitHub Actions Logs analysieren
  if [ "$SOURCE" = "all" ] || [ "$SOURCE" = "github" ]; then
    if [ -d "$REPORT_DIR/github" ]; then
      for log_file in "$REPORT_DIR/github"/*.log; do
        if [ -f "$log_file" ]; then
          analyze_log_file "$log_file" "github-actions" "github"
        fi
      done
    fi
  fi
  
  # Railway Logs analysieren
  if [ "$SOURCE" = "all" ] || [ "$SOURCE" = "railway" ]; then
    if [ -d "$REPORT_DIR/railway" ]; then
      for service in "${SERVICES[@]}"; do
        if [ -n "$SERVICE" ] && [ "$service" != "$SERVICE" ]; then
          continue
        fi
        
        # Build-Logs
        if [ -f "$REPORT_DIR/railway/${service}-build.log" ]; then
          analyze_log_file "$REPORT_DIR/railway/${service}-build.log" "$service" "build"
        fi
        
        # Runtime-Logs
        if [ -f "$REPORT_DIR/railway/${service}-runtime.log" ]; then
          analyze_log_file "$REPORT_DIR/railway/${service}-runtime.log" "$service" "runtime"
        fi
      done
    fi
  fi
}

# Generiere finalen Report
generate_final_report() {
  log_section
  log_info "Generiere finalen Report..."
  
  {
    echo ""
    echo "## Fehler-Zusammenfassung"
    echo ""
    echo "### Kritische Fehler (${#CRITICAL_ERRORS[@]})"
    echo ""
    
    if [ ${#CRITICAL_ERRORS[@]} -eq 0 ]; then
      echo "✅ Keine kritischen Fehler gefunden"
    else
      for i in "${!CRITICAL_ERRORS[@]}"; do
        echo "$((i+1)). ${CRITICAL_ERRORS[$i]}"
      done
    fi
    
    echo ""
    echo "### Warnungen (${#WARNINGS[@]})"
    echo ""
    
    if [ ${#WARNINGS[@]} -eq 0 ]; then
      echo "✅ Keine Warnungen gefunden"
    else
      for i in "${!WARNINGS[@]}"; do
        echo "$((i+1)). ${WARNINGS[$i]}"
      done
    fi
    
    echo ""
    echo "---"
    echo ""
    echo "## Lösungsvorschläge"
    echo ""
    echo "Siehe [Lösungsvorschläge]($SOLUTIONS_FILE) für detaillierte Anleitungen."
    echo ""
    echo "## Nächste Schritte"
    echo ""
    echo "1. **Kritische Fehler beheben:** Beginne mit den oben genannten kritischen Fehlern"
    echo "2. **Lösungsvorschläge umsetzen:** Folge den Anleitungen in $SOLUTIONS_FILE"
    echo "3. **Service-spezifische Checks:** Prüfe einzelne Services: \`railway logs --service <service>\`"
    echo "4. **Health Checks:** Führe Health-Checks aus: \`./scripts/post-deployment-health-check.sh $ENVIRONMENT\`"
    echo "5. **Re-Deployment:** Nach Fehlerbehebung: \`./scripts/deploy-railway.sh $ENVIRONMENT\`"
    echo ""
  } >> "$REPORT_FILE"
  
  log_success "Report generiert: $REPORT_FILE"
}

# Main Execution
main() {
  echo ""
  log_section
  echo -e "${CYAN}🔍 Intelligente Log-Analyse${NC}"
  log_section
  echo ""
  
  # Initialisierung
  init_report
  define_error_patterns
  define_solutions
  
  # Log-Sammlung
  if [ "$SOURCE" = "all" ] || [ "$SOURCE" = "github" ]; then
    collect_github_logs || true
  fi
  
  if [ "$SOURCE" = "all" ] || [ "$SOURCE" = "railway" ]; then
    collect_railway_logs || true
  fi
  
  # Analyse
  main_analysis
  
  # Report generieren
  generate_final_report
  
  # Zusammenfassung
  echo ""
  log_section
  echo -e "${CYAN}📊 Analyse abgeschlossen${NC}"
  log_section
  echo ""
  echo "📁 Report-Verzeichnis: $REPORT_DIR"
  echo "📄 Haupt-Report: $REPORT_FILE"
  echo "💡 Lösungen: $SOLUTIONS_FILE"
  echo ""
  echo "**Zusammenfassung:**"
  echo " ❌ Kritische Fehler: ${#CRITICAL_ERRORS[@]}"
  echo " ⚠️ Warnungen: ${#WARNINGS[@]}"
  echo ""
  
  if [ ${#CRITICAL_ERRORS[@]} -eq 0 ] && [ ${#WARNINGS[@]} -eq 0 ]; then
    log_success "Keine Probleme gefunden! 🎉"
    exit 0
  elif [ ${#CRITICAL_ERRORS[@]} -eq 0 ]; then
    log_warning "Nur Warnungen - System sollte funktionieren"
    exit 0
  else
    log_error "Kritische Fehler gefunden - sofortige Behebung erforderlich"
    exit 1
  fi
}

# Script ausführen
main "$@"






