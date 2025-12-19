#!/bin/bash
# Comprehensive Test Script für alle Services
# Führt alle Test-Suites aus und generiert Reports

set -euo pipefail

echo "🧪 WattOS Plattform - Comprehensive Test Suite"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test Results
PASSED=0
FAILED=0
SKIPPED=0

# Function to run test and track results
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "${YELLOW}▶ Running: ${test_name}${NC}"
    if eval "$test_command"; then
        echo -e "${GREEN}✅ ${test_name} PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ ${test_name} FAILED${NC}"
        ((FAILED++))
        return 1
    fi
}

# Start Mock-API Server in background
echo "🚀 Starting Mock-API Server..."
pnpm mock:start > /tmp/mock-api.log 2>&1 &
MOCK_PID=$!
sleep 3

# Check if Mock-API is running
if ! curl -f -s http://localhost:4001/health > /dev/null; then
    echo -e "${RED}❌ Mock-API Server failed to start${NC}"
    kill $MOCK_PID 2>/dev/null || true
    exit 1
fi
echo -e "${GREEN}✅ Mock-API Server running (PID: $MOCK_PID)${NC}"
echo ""

# 1. Lint
echo "📝 Step 1: Linting..."
run_test "Lint" "pnpm lint" || echo "⚠️  Lint warnings (non-blocking)"

# 2. Type Check
echo ""
echo "🔷 Step 2: Type Checking..."
run_test "Type Check" "pnpm type-check" || echo "⚠️  Type check warnings (non-blocking)"

# 3. Build
echo ""
echo "🔨 Step 3: Building..."
run_test "Build" "pnpm build" || echo "⚠️  Build warnings (non-blocking)"

# 4. Unit Tests
echo ""
echo "🧪 Step 4: Unit Tests..."
run_test "Unit Tests" "pnpm test:unit" || echo "⚠️  Unit tests failed (non-blocking)"

# 5. Integration Tests
echo ""
echo "🔗 Step 5: Integration Tests..."
run_test "Integration Tests" "pnpm test:integration" || echo "⚠️  Integration tests failed (non-blocking)"

# 6. E2E Tests (optional, can be skipped if frontend not running)
echo ""
echo "🎭 Step 6: E2E Tests..."
if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
    run_test "E2E Tests" "pnpm test:e2e" || echo "⚠️  E2E tests failed (non-blocking)"
else
    echo -e "${YELLOW}⏭️  E2E Tests SKIPPED (Frontend not running on port 3000)${NC}"
    ((SKIPPED++))
fi

# 7. Performance Tests
echo ""
echo "⚡ Step 7: Performance Tests..."
run_test "Performance Tests" "pnpm test:perf" || echo "⚠️  Performance tests failed (non-blocking)"

# Stop Mock-API Server
echo ""
echo "🛑 Stopping Mock-API Server..."
kill $MOCK_PID 2>/dev/null || true
wait $MOCK_PID 2>/dev/null || true

# Summary
echo ""
echo "=============================================="
echo "📊 Test Summary"
echo "=============================================="
echo -e "${GREEN}✅ Passed: ${PASSED}${NC}"
echo -e "${RED}❌ Failed: ${FAILED}${NC}"
echo -e "${YELLOW}⏭️  Skipped: ${SKIPPED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Check logs above.${NC}"
    exit 1
fi

