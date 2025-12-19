#!/bin/bash
# Auto-Analyse Script für GitHub Actions Steps
# Analysiert Step-Logs, erkennt Fehlermuster und generiert Lösungsvorschläge

set -uo pipefail

JOB_NAME="${1:-unknown}"
STEP_NAME="${2:-unknown}"
LOG_FILE="${3:-}"

# Output-Datei für GitHub Actions Step Summary
SUMMARY_FILE="${GITHUB_STEP_SUMMARY:-/dev/stdout}"

# Farben für lokale Ausgabe
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Fehler-Sammlung
declare -a ERRORS=()
declare -a SOLUTIONS=()
declare -a WARNINGS=()

# Funktionen
log_info() {
  echo -e "${BLUE}ℹ${NC} $1" >&2
}

log_error() {
  echo -e "${RED}❌${NC} $1" >&2
}

log_warning() {
  echo -e "${YELLOW}⚠️${NC} $1" >&2
}

log_success() {
  echo -e "${GREEN}✅${NC} $1" >&2
}

# Analysiere Logs auf Fehlermuster
analyze_logs() {
  local log_content=""
  
  # Hole Logs (falls nicht als Parameter übergeben)
  if [ -z "$LOG_FILE" ] || [ ! -f "$LOG_FILE" ]; then
    # Versuche Logs aus GitHub Actions zu lesen
    if [ -n "${GITHUB_ACTIONS:-}" ]; then
      # Logs werden über GitHub Actions API verfügbar sein
      log_content=""
    fi
  else
    log_content=$(cat "$LOG_FILE" 2>/dev/null || echo "")
  fi
  
  if [ -z "$log_content" ]; then
    log_warning "Keine Logs zum Analysieren gefunden"
    return 0
  fi
  
  # Fehlermuster erkennen und Lösungen generieren
  
  # 1. Railway Authentication Fehler
  if echo "$log_content" | grep -qi "Process completed with exit code 1" && \
     echo "$log_content" | grep -qi "railway login"; then
    ERRORS+=("Railway Authentication fehlgeschlagen")
    SOLUTIONS+=("Prüfe RAILWAY_TOKEN in GitHub Secrets")
    SOLUTIONS+=("Teste Login lokal: \`echo \"\$TOKEN\" | railway login\`")
    SOLUTIONS+=("Verwende alternative Login-Methode: \`railway login --token \"\$TOKEN\"\`")
    SOLUTIONS+=("Setze RAILWAY_TOKEN als Environment Variable: \`export RAILWAY_TOKEN=\"\$TOKEN\" && railway whoami\`")
  fi
  
  # 2. Railway CLI nicht gefunden
  if echo "$log_content" | grep -qi "railway.*not found\|railway.*command not found"; then
    ERRORS+=("Railway CLI nicht installiert")
    SOLUTIONS+=("Installiere Railway CLI: \`npm install -g @railway/cli\`")
    SOLUTIONS+=("Prüfe ob Node.js installiert ist: \`node --version\`")
  fi
  
  # 3. Build Errors
  if echo "$log_content" | grep -qi "npm ERR\|pnpm ERR\|build.*fail\|compile.*error"; then
    ERRORS+=("Build-Fehler erkannt")
    SOLUTIONS+=("Prüfe package.json auf fehlende Dependencies")
    SOLUTIONS+=("Führe lokal aus: \`npm install\` oder \`pnpm install\`")
    SOLUTIONS+=("Prüfe Build-Command in railway.json")
    SOLUTIONS+=("Prüfe Node.js Version (sollte 20 sein)")
  fi
  
  # 4. Service nicht gefunden
  if echo "$log_content" | grep -qi "service.*not found\|service.*does not exist"; then
    ERRORS+=("Service nicht in Railway gefunden")
    SOLUTIONS+=("Erstelle Service in Railway Dashboard")
    SOLUTIONS+=("Oder: \`railway service create <service-name>\`")
    SOLUTIONS+=("Prüfe ob Project verlinkt ist: \`railway link\`")
  fi
  
  # 5. Project Token nicht gefunden
  if echo "$log_content" | grep -qi "Project Token not found\|not linked to a project"; then
    ERRORS+=("Railway Project nicht verlinkt")
    SOLUTIONS+=("Linke Project: \`railway link <PROJECT_ID>\`")
    SOLUTIONS+=("Prüfe PROJECT_ID: \`a97f01bc-dc80-4941-b911-ed7ebb3efa7a\`")
    SOLUTIONS+=("Setze RAILWAY_PROJECT_ID in GitHub Secrets")
  fi
  
  # 6. Port-Konflikte
  if echo "$log_content" | grep -qi "port.*already.*in.*use\|EADDRINUSE"; then
    ERRORS+=("Port bereits in Verwendung")
    SOLUTIONS+=("Prüfe ob anderer Service auf Port läuft")
    SOLUTIONS+=("Railway setzt automatisch PORT env var - verwende \`process.env.PORT\`")
    SOLUTIONS+=("Prüfe railway.json auf hardcoded Ports")
  fi
  
  # 7. Environment Variables fehlen
  if echo "$log_content" | grep -qi "required.*variable.*not set\|missing.*environment"; then
    ERRORS+=("Environment Variables fehlen")
    SOLUTIONS+=("Prüfe erforderliche ENV-Vars in services-config.json")
    SOLUTIONS+=("Setze Variablen: \`railway variables set <VAR>=<value> --service <service>\`")
    SOLUTIONS+=("Prüfe Shared Variables im Railway Dashboard")
  fi
  
  # 8. jq nicht gefunden
  if echo "$log_content" | grep -qi "jq.*not found\|jq.*command not found"; then
    WARNINGS+=("jq nicht installiert")
    SOLUTIONS+=("Installiere jq: \`sudo apt-get install -y jq\`")
    SOLUTIONS+=("Oder verwende Node.js für JSON-Parsing")
  fi
  
  # 9. Permission Denied
  if echo "$log_content" | grep -qi "Permission denied\|EACCES"; then
    ERRORS+=("Berechtigungsfehler")
    SOLUTIONS+=("Prüfe Dateiberechtigungen: \`chmod +x scripts/*.sh\`")
    SOLUTIONS+=("Prüfe ob Script ausführbar ist")
  fi
  
  # 10. Timeout
  if echo "$log_content" | grep -qi "timeout\|timed out"; then
    WARNINGS+=("Timeout erkannt")
    SOLUTIONS+=("Erhöhe Timeout-Wert")
    SOLUTIONS+=("Prüfe Netzwerkverbindung")
    SOLUTIONS+=("Prüfe ob Service antwortet")
  fi
  
  # 11. Database Connection Error
  if echo "$log_content" | grep -qi "database.*connection\|DATABASE_URL.*invalid\|ECONNREFUSED.*5432"; then
    ERRORS+=("Datenbank-Verbindungsfehler")
    SOLUTIONS+=("Prüfe DATABASE_URL Environment Variable")
    SOLUTIONS+=("Prüfe ob PostgreSQL Service in Railway läuft")
    SOLUTIONS+=("Prüfe Railway Service-Links")
  fi
  
  # 12. Redis Connection Error
  if echo "$log_content" | grep -qi "redis.*connection\|REDIS_URL.*invalid\|ECONNREFUSED.*6379"; then
    ERRORS+=("Redis-Verbindungsfehler")
    SOLUTIONS+=("Prüfe REDIS_URL Environment Variable")
    SOLUTIONS+=("Prüfe ob Redis Service in Railway läuft")
    SOLUTIONS+=("Prüfe Railway Service-Links")
  fi
}

# Generiere Lösungsvorschläge
generate_solutions() {
  {
    echo "## 🔍 Fehler-Analyse: $STEP_NAME"
    echo ""
    echo "**Job:** \`$JOB_NAME\`"
    echo "**Step:** \`$STEP_NAME\`"
    echo ""
    
    if [ ${#ERRORS[@]} -eq 0 ] && [ ${#WARNINGS[@]} -eq 0 ]; then
      echo "✅ Keine Fehler erkannt"
      echo ""
      return 0
    fi
    
    if [ ${#ERRORS[@]} -gt 0 ]; then
      echo "### ❌ Fehler erkannt:"
      echo ""
      for i in "${!ERRORS[@]}"; do
        echo "$((i+1)). ${ERRORS[$i]}"
      done
      echo ""
    fi
    
    if [ ${#WARNINGS[@]} -gt 0 ]; then
      echo "### ⚠️ Warnungen:"
      echo ""
      for i in "${!WARNINGS[@]}"; do
        echo "$((i+1)). ${WARNINGS[$i]}"
      done
      echo ""
    fi
    
    if [ ${#SOLUTIONS[@]} -gt 0 ]; then
      echo "### 💡 Lösungsvorschläge:"
      echo ""
      for i in "${!SOLUTIONS[@]}"; do
        echo "$((i+1)). ${SOLUTIONS[$i]}"
      done
      echo ""
    fi
    
    echo "---"
    echo ""
  } >> "$SUMMARY_FILE"
}

# Main
main() {
  log_info "Analysiere Step-Logs: $JOB_NAME → $STEP_NAME"
  
  analyze_logs
  generate_solutions
  
  if [ ${#ERRORS[@]} -gt 0 ]; then
    log_error "${#ERRORS[@]} Fehler erkannt"
    log_info "Lösungsvorschläge wurden in Step Summary geschrieben"
    return 1
  elif [ ${#WARNINGS[@]} -gt 0 ]; then
    log_warning "${#WARNINGS[@]} Warnungen erkannt"
    return 0
  else
    log_success "Keine Fehler erkannt"
    return 0
  fi
}

main "$@"

