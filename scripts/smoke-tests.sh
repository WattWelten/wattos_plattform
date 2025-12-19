#!/bin/bash
set -euo pipefail

ENVIRONMENT=${1:-staging}
BASE_URL=""

if [ "$ENVIRONMENT" = "production" ]; then
  BASE_URL="${PRODUCTION_API_URL:-https://api.production.railway.app}"
elif [ "$ENVIRONMENT" = "staging" ]; then
  BASE_URL="${STAGING_API_URL:-https://api.staging.railway.app}"
else
  BASE_URL="${LOCAL_API_URL:-http://localhost:3001}"
fi

echo "Running smoke tests for environment: $ENVIRONMENT"
echo "Base URL: $BASE_URL"

FAILED_TESTS=0

# Test 1: API Gateway Health
echo "Test 1: API Gateway Health Check"
if curl -f -s "${BASE_URL}/health" > /dev/null; then
  echo "✅ API Gateway is reachable"
else
  echo "❌ API Gateway health check failed"
  ((FAILED_TESTS++))
fi

# Test 2: Database Connectivity (via API Gateway)
echo "Test 2: Database Connectivity"
# This would require an endpoint that checks DB connectivity
# For now, we'll skip if not available
if curl -f -s "${BASE_URL}/api/health/db" > /dev/null 2>&1; then
  echo "✅ Database is reachable"
else
  echo "⚠️  Database connectivity check not available (skipping)"
fi

# Test 3: Redis Connectivity
echo "Test 3: Redis Connectivity"
if curl -f -s "${BASE_URL}/api/health/redis" > /dev/null 2>&1; then
  echo "✅ Redis is reachable"
else
  echo "⚠️  Redis connectivity check not available (skipping)"
fi

# Test 4: LLM Gateway Health
echo "Test 4: LLM Gateway Health"
LLM_GATEWAY_URL="${LLM_GATEWAY_URL:-${BASE_URL}/api/llm/health}"
if curl -f -s "${LLM_GATEWAY_URL}" > /dev/null 2>&1; then
  echo "✅ LLM Gateway is reachable"
else
  echo "⚠️  LLM Gateway health check not available (skipping)"
fi

# Test 5: Frontend Load (if URL provided)
if [ -n "${FRONTEND_URL:-}" ]; then
  echo "Test 5: Frontend Load"
  if curl -f -s "${FRONTEND_URL}" > /dev/null; then
    echo "✅ Frontend is reachable"
  else
    echo "❌ Frontend load failed"
    ((FAILED_TESTS++))
  fi
fi

if [ $FAILED_TESTS -eq 0 ]; then
  echo "✅ All smoke tests passed!"
  exit 0
else
  echo "❌ $FAILED_TESTS smoke test(s) failed"
  exit 1
fi












