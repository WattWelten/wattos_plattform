#!/bin/bash
set -euo pipefail

# Erkennt Fehlermuster in Logs und kategorisiert sie

LOG_FILE=${1:-}
OUTPUT_FILE=${2:-patterns.json}

if [ -z "$LOG_FILE" ] || [ ! -f "$LOG_FILE" ]; then
  echo "❌ Log-Datei nicht gefunden: $LOG_FILE"
  echo "Usage: $0 <log-file> [output-file]"
  exit 1
fi

# Fehlermuster mit Kategorien
declare -A PATTERNS=(
  # Build-Fehler (Kritisch)
  ["build_npm_error"]="npm ERR|pnpm ERR|npm install failed"
  ["build_compile_error"]="compilation error|TypeScript error|build failed"
  ["build_dependency_error"]="dependency|module not found|package.*not found"
  
  # Environment-Fehler (Kritisch)
  ["env_missing"]="undefined|missing|required|env var not set|environment variable"
  ["env_invalid"]="invalid.*env|wrong.*env|env.*error"
  
  # Port-Fehler (Kritisch)
  ["port_conflict"]="port.*already.*in.*use|EADDRINUSE|bind.*error"
  
  # Database-Fehler (Kritisch)
  ["db_connection"]="connection refused|ECONNREFUSED|database.*connection"
  ["db_migration"]="migration.*failed|migration.*error|prisma.*error"
  
  # Service-Discovery-Fehler (Warnung)
  ["service_not_found"]="service.*not found|URL.*not found|404"
  ["service_unavailable"]="503|service unavailable|502|bad gateway"
  
  # Memory/Resource-Fehler (Kritisch)
  ["memory_error"]="out of memory|OOM|memory limit exceeded"
  ["resource_error"]="resource.*limit|quota.*exceeded|rate.*limit"
  
  # Start-Fehler (Kritisch)
  ["start_error"]="cannot.*start|failed.*start|startup.*error"
  
  # Health-Check-Fehler (Warnung)
  ["health_failed"]="health.*failed|health.*error|/health.*404"
)

# JSON-Output vorbereiten
echo "{" > "$OUTPUT_FILE"
echo "  \"log_file\": \"$LOG_FILE\"," >> "$OUTPUT_FILE"
echo "  \"analyzed_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"," >> "$OUTPUT_FILE"
echo "  \"patterns\": [" >> "$OUTPUT_FILE"

first=true
for pattern_name in "${!PATTERNS[@]}"; do
  pattern="${PATTERNS[$pattern_name]}"
  
  # Prüfe Pattern
  matches=$(grep -iE "$pattern" "$LOG_FILE" 2>/dev/null | wc -l || echo "0")
  
  if [ "$matches" -gt 0 ]; then
    # Kategorisiere nach Schweregrad
    severity="warning"
    case "$pattern_name" in
      build_*|start_error|db_connection|memory_error|env_*|port_*)
        severity="critical"
        ;;
    esac
    
    # Beispiel-Zeilen
    examples=$(grep -iE "$pattern" "$LOG_FILE" | head -3 | jq -R . | jq -s . 2>/dev/null || echo "[]")
    
    if [ "$first" = true ]; then
      first=false
    else
      echo "," >> "$OUTPUT_FILE"
    fi
    
    {
      echo "    {"
      echo "      \"name\": \"$pattern_name\","
      echo "      \"severity\": \"$severity\","
      echo "      \"matches\": $matches,"
      echo "      \"examples\": $examples"
      echo -n "    }"
    } >> "$OUTPUT_FILE"
  fi
done

echo "" >> "$OUTPUT_FILE"
echo "  ]" >> "$OUTPUT_FILE"
echo "}" >> "$OUTPUT_FILE"

echo "✅ Fehlermuster erkannt und gespeichert: $OUTPUT_FILE"






