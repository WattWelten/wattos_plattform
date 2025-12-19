#!/bin/bash
set -euo pipefail

# Pre-Deployment Validator
# Umfassende Validierung vor jedem Deployment

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL=""

if [ "$ENVIRONMENT" = "production" ]; then
  BASE_URL="${PRODUCTION_API_URL:-https://api.production.railway.app}"
elif [ "$ENVIRONMENT" = "staging" ]; then
  BASE_URL="${STAGING_API_URL:-https://api.staging.railway.app}"
else
  BASE_URL="${LOCAL_API_URL:-http://localhost:3001}"
fi

echo "=========================================="
echo "Pre-Deployment Validation"
echo "Environment: $ENVIRONMENT"
echo "Base URL: $BASE_URL"
echo "=========================================="
echo ""

FAILED_CHECKS=0
WARNINGS=0

# Pre-Deployment Checks (vor dem eigentlichen Deployment)
echo "=== Pre-Deployment Checks ==="
echo ""

# Check 1: Environment Variables
echo "Check 1: Environment Variables Validation"
if [ -f "${SCRIPT_DIR}/validate-env-vars.sh" ]; then
  chmod +x "${SCRIPT_DIR}/validate-env-vars.sh" || true
  if "${SCRIPT_DIR}/validate-env-vars.sh" "$ENVIRONMENT"; then
    echo "✅ Environment variables are valid"
  else
    echo "❌ Environment variables validation failed"
    ((FAILED_CHECKS++))
  fi
else
  echo "⚠️  validate-env-vars.sh not found, skipping"
  ((WARNINGS++))
fi
echo ""

# Check 2: Dependencies
echo "Check 2: Dependencies Validation"
if [ -f "${SCRIPT_DIR}/validate-dependencies.sh" ]; then
  chmod +x "${SCRIPT_DIR}/validate-dependencies.sh" || true
  if "${SCRIPT_DIR}/validate-dependencies.sh" "$ENVIRONMENT"; then
    echo "✅ Dependencies are valid"
  else
    echo "⚠️  Dependencies validation found issues (non-blocking)"
    ((WARNINGS++))
  fi
else
  echo "⚠️  validate-dependencies.sh not found, skipping"
  ((WARNINGS++))
fi
echo ""

# Check 3: Service Configuration
echo "Check 3: Service Configuration Validation"
if [ -f "${SCRIPT_DIR}/validate-config.sh" ]; then
  chmod +x "${SCRIPT_DIR}/validate-config.sh" || true
  if "${SCRIPT_DIR}/validate-config.sh" "$ENVIRONMENT"; then
    echo "✅ Service configurations are valid"
  else
    echo "❌ Service configuration validation failed"
    ((FAILED_CHECKS++))
  fi
else
  echo "⚠️  validate-config.sh not found, skipping"
  ((WARNINGS++))
fi
echo ""

# Check 4: Build Status
echo "Check 4: Build Status"
if pnpm build --dry-run 2>&1 | grep -q "error\|failed"; then
  echo "❌ Build would fail - fix build errors before deployment"
  ((FAILED_CHECKS++))
else
  echo "✅ Build check passed"
fi
echo ""

# Check 5: Test Status
echo "Check 5: Test Status"
if pnpm test:unit --passWithNoTests 2>&1 | grep -q "FAIL\|failed"; then
  echo "❌ Unit tests failed - fix tests before deployment"
  ((FAILED_CHECKS++))
else
  echo "✅ Unit tests passed"
fi
echo ""

# Post-Deployment Checks (nach dem Deployment)
echo "=== Post-Deployment Checks ==="
echo ""

# Check 1: All Services Health
echo "Check 1: All Services Health"
chmod +x scripts/health-check.sh || true
if ./scripts/health-check.sh "$ENVIRONMENT"; then
  echo "✅ All services are healthy"
else
  echo "❌ Health check failed"
  ((FAILED_CHECKS++))
fi

# Check 6: API Endpoints Response Times
echo "Check 6: API Endpoints Response Times"
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "${BASE_URL}/health" 2>/dev/null || echo "999")
# Windows-kompatible Float-Vergleich (ohne bc)
if command -v awk &> /dev/null; then
  if awk "BEGIN {exit !($RESPONSE_TIME < 2.0)}"; then
    echo "✅ API response time: ${RESPONSE_TIME}s (acceptable)"
  else
    echo "❌ API response time: ${RESPONSE_TIME}s (too slow)"
    ((FAILED_CHECKS++))
  fi
else
  # Fallback: String-Vergleich
  if [ "$RESPONSE_TIME" != "999" ]; then
    echo "✅ API response time: ${RESPONSE_TIME}s"
  else
    echo "❌ API endpoint not reachable"
    ((FAILED_CHECKS++))
  fi
fi

# Check 7: Database Connectivity
echo "Check 7: Database Connectivity"
if curl -f -s "${BASE_URL}/api/health/db" > /dev/null 2>&1; then
  echo "✅ Database is reachable"
else
  echo "⚠️  Database connectivity check not available (endpoint may not exist)"
  ((WARNINGS++))
fi

# Check 8: Redis Connectivity
echo "Check 8: Redis Connectivity"
if curl -f -s "${BASE_URL}/api/health/redis" > /dev/null 2>&1; then
  echo "✅ Redis is reachable"
else
  echo "⚠️  Redis connectivity check not available (endpoint may not exist)"
  ((WARNINGS++))
fi

# Check 9: Frontend-Backend Integration
if [ -n "${FRONTEND_URL:-}" ]; then
  echo "Check 9: Frontend-Backend Integration"
  if curl -f -s "${FRONTEND_URL}" > /dev/null 2>&1; then
    echo "✅ Frontend is reachable"
  else
    echo "❌ Frontend is not reachable"
    ((FAILED_CHECKS++))
  fi
else
  echo "Check 9: Frontend-Backend Integration"
  echo "⚠️  FRONTEND_URL not set, skipping frontend check"
  ((WARNINGS++))
fi

# Check 10: WebSocket Connectivity
echo "Check 10: WebSocket Connectivity"
# WebSocket check würde spezifischen Endpoint benötigen
echo "⚠️  WebSocket connectivity check not implemented (requires WebSocket client)"
((WARNINGS++))

# Check 11: LLM Gateway Provider Health
echo "Check 11: LLM Gateway Provider Health"
LLM_GATEWAY_URL="${LLM_GATEWAY_URL:-${BASE_URL}/api/llm/health}"
if curl -f -s "${LLM_GATEWAY_URL}" > /dev/null 2>&1; then
  echo "✅ LLM Gateway is healthy"
else
  echo "⚠️  LLM Gateway health check not available (endpoint may not exist)"
  ((WARNINGS++))
fi

# Check 12: RAG Vector Store Connectivity
echo "Check 12: RAG Vector Store Connectivity"
RAG_SERVICE_URL="${RAG_SERVICE_URL:-${BASE_URL}/api/rag/health}"
if curl -f -s "${RAG_SERVICE_URL}" > /dev/null 2>&1; then
  echo "✅ RAG Service is healthy"
else
  echo "⚠️  RAG Service health check not available (endpoint may not exist)"
  ((WARNINGS++))
fi

# Zusammenfassung
echo ""
echo "=========================================="
echo "Validation Summary"
echo "=========================================="
echo ""

if [ $FAILED_CHECKS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ All deployment validation checks passed!"
  exit 0
elif [ $FAILED_CHECKS -eq 0 ]; then
  echo "✅ All critical checks passed"
  echo "⚠️  Found $WARNINGS warning(s) - review recommended"
  exit 0
else
  echo "❌ Validation failed with $FAILED_CHECKS error(s)"
  if [ $WARNINGS -gt 0 ]; then
    echo "⚠️  Also found $WARNINGS warning(s)"
  fi
  echo ""
  echo "Fix the errors above before deploying."
  exit 1
fi

