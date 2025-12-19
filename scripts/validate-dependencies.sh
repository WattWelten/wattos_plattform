#!/bin/bash
set -euo pipefail

# Dependencies Validator
# Validiert Dependencies auf Vulnerabilities und veraltete Versionen

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENVIRONMENT="${1:-production}"

echo "Validating dependencies for environment: $ENVIRONMENT"
echo ""

FAILED_VALIDATIONS=0
WARNINGS=0

# Prüfe ob pnpm installiert ist
if ! command -v pnpm &> /dev/null; then
  echo "Error: pnpm is required but not installed."
  echo "Installation: npm install -g pnpm"
  exit 1
fi

# 1. Dependency Audit
echo "=== Dependency Vulnerability Check ==="
echo ""

if pnpm audit --audit-level=moderate 2>/dev/null; then
  echo "✅ No critical or moderate vulnerabilities found"
else
  echo "⚠️  Found vulnerabilities in dependencies"
  echo "⚠️  Run 'pnpm audit' for details"
  ((WARNINGS++))
fi

echo ""

# 2. Outdated Dependencies Check
echo "=== Outdated Dependencies Check ==="
echo ""

OUTDATED=$(pnpm outdated 2>/dev/null || echo "")

if [ -z "$OUTDATED" ]; then
  echo "✅ All dependencies are up to date"
else
  echo "⚠️  Found outdated dependencies:"
  echo "$OUTDATED" | head -20
  echo ""
  echo "⚠️  Run 'pnpm outdated' for full list"
  ((WARNINGS++))
fi

echo ""

# 3. Lock File Check
echo "=== Lock File Check ==="
echo ""

if [ -f "pnpm-lock.yaml" ]; then
  echo "✅ pnpm-lock.yaml exists"
  
  # Prüfe ob lock file aktuell ist
  if pnpm install --frozen-lockfile --dry-run 2>&1 | grep -q "error"; then
    echo "❌ Lock file is out of sync with package.json"
    echo "❌ Run 'pnpm install' to update lock file"
    ((FAILED_VALIDATIONS++))
  else
    echo "✅ Lock file is in sync with package.json"
  fi
else
  echo "❌ pnpm-lock.yaml not found"
  echo "❌ Run 'pnpm install' to generate lock file"
  ((FAILED_VALIDATIONS++))
fi

echo ""

# 4. Node Version Check
echo "=== Node Version Check ==="
echo ""

REQUIRED_NODE_VERSION=$(node -p "require('./package.json').engines?.node || '>=18.0.0'")
CURRENT_NODE_VERSION=$(node --version | sed 's/v//')

echo "Required Node version: $REQUIRED_NODE_VERSION"
echo "Current Node version: v$CURRENT_NODE_VERSION"

# Einfache Version-Check (vereinfacht)
if node --version | grep -qE "v(18|20|22)"; then
  echo "✅ Node version is compatible"
else
  echo "⚠️  Node version may not be compatible"
  echo "⚠️  Recommended: Node.js 18.x, 20.x, or 22.x"
  ((WARNINGS++))
fi

echo ""

# 5. pnpm Version Check
echo "=== pnpm Version Check ==="
echo ""

REQUIRED_PNPM_VERSION=$(node -p "require('./package.json').engines?.pnpm || '>=8.0.0'")
CURRENT_PNPM_VERSION=$(pnpm --version)

echo "Required pnpm version: $REQUIRED_PNPM_VERSION"
echo "Current pnpm version: $CURRENT_PNPM_VERSION"

if pnpm --version | grep -qE "^8\."; then
  echo "✅ pnpm version is compatible"
else
  echo "⚠️  pnpm version may not be compatible"
  echo "⚠️  Recommended: pnpm 8.x"
  ((WARNINGS++))
fi

echo ""

# Zusammenfassung
echo "=== Validation Summary ==="
echo ""

if [ $FAILED_VALIDATIONS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ All dependency validations passed!"
  exit 0
elif [ $FAILED_VALIDATIONS -eq 0 ]; then
  echo "⚠️  Validation completed with $WARNINGS warning(s)"
  echo "⚠️  Warnings are non-blocking but should be reviewed"
  exit 0
else
  echo "❌ Validation failed with $FAILED_VALIDATIONS error(s)"
  if [ $WARNINGS -gt 0 ]; then
    echo "⚠️  Also found $WARNINGS warning(s)"
  fi
  exit 1
fi












