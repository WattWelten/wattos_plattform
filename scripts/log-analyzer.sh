#!/bin/bash
set -euo pipefail

COMMAND=${1:-help}
LOG_DIR=${2:-logs}

case "$COMMAND" in
  "collect")
    echo "Collecting logs from Railway..."
    
    if ! command -v railway &> /dev/null; then
      echo "❌ Railway CLI is not installed"
      exit 1
    fi
    
    mkdir -p "$LOG_DIR"
    
    # Collect logs from all services
    SERVICES=(
      "api-gateway"
      "chat-service"
      "rag-service"
      "agent-service"
      "llm-gateway"
      "customer-intelligence-service"
      "crawler-service"
      "voice-service"
      "avatar-service"
    )
    
    for service in "${SERVICES[@]}"; do
      echo "Collecting logs from $service..."
      railway logs --service "$service" > "$LOG_DIR/${service}.log" 2>&1 || true
    done
    
    echo "✅ Logs collected to $LOG_DIR/"
    ;;
  
  "analyze")
    echo "Analyzing logs from $LOG_DIR..."
    
    if [ ! -d "$LOG_DIR" ]; then
      echo "❌ Log directory not found: $LOG_DIR"
      exit 1
    fi
    
    # Count errors
    ERROR_COUNT=0
    for logfile in "$LOG_DIR"/*.log; do
      if [ -f "$logfile" ]; then
        ERRORS=$(grep -i "error\|exception\|failed\|fatal" "$logfile" | wc -l || echo "0")
        ERROR_COUNT=$((ERROR_COUNT + ERRORS))
      fi
    done
    
    echo "Total errors found: $ERROR_COUNT"
    ;;
  
  "detect-errors")
    echo "Detecting errors in logs from $LOG_DIR..."
    
    if [ ! -d "$LOG_DIR" ]; then
      echo "❌ Log directory not found: $LOG_DIR"
      exit 1
    fi
    
    CRITICAL_ERRORS=()
    
    for logfile in "$LOG_DIR"/*.log; do
      if [ -f "$logfile" ]; then
        # Look for critical error patterns
        if grep -qi "fatal\|panic\|out of memory\|connection refused" "$logfile"; then
          SERVICE=$(basename "$logfile" .log)
          CRITICAL_ERRORS+=("$SERVICE")
        fi
      fi
    done
    
    if [ ${#CRITICAL_ERRORS[@]} -gt 0 ]; then
      echo "❌ Critical errors detected in: ${CRITICAL_ERRORS[*]}"
      exit 1
    else
      echo "✅ No critical errors detected"
    fi
    ;;
  
  "report")
    echo "Generating log report from $LOG_DIR..."
    
    if [ ! -d "$LOG_DIR" ]; then
      echo "❌ Log directory not found: $LOG_DIR"
      exit 1
    fi
    
    echo "# Log Analysis Report"
    echo "Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
    echo ""
    echo "## Summary"
    echo ""
    
    # Count errors per service
    for logfile in "$LOG_DIR"/*.log; do
      if [ -f "$logfile" ]; then
        SERVICE=$(basename "$logfile" .log)
        ERROR_COUNT=$(grep -ic "error\|exception" "$logfile" || echo "0")
        WARN_COUNT=$(grep -ic "warn" "$logfile" || echo "0")
        echo "- **$SERVICE**: $ERROR_COUNT errors, $WARN_COUNT warnings"
      fi
    done
    ;;
  
  "metrics")
    echo "Collecting performance metrics..."
    # This would integrate with Railway metrics API
    echo "Metrics collection not yet implemented"
    ;;
  
  "daily-report")
    echo "Generating daily report..."
    # Generate comprehensive daily report
    ./scripts/log-analyzer.sh report logs/ > daily-report.md
    echo "Daily report generated: daily-report.md"
    ;;
  
  *)
    echo "Usage: $0 [collect|analyze|detect-errors|report|metrics|daily-report] [log-dir]"
    exit 1
    ;;
esac












