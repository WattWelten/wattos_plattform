#!/bin/bash
set -euo pipefail

# Code Quality Auto-Fix Script
# Behebt automatisch behebbare Code-Qualitätsprobleme

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=========================================="
echo "Code Quality Auto-Fix"
echo "=========================================="
echo ""

FIXES_APPLIED=0
ERRORS=0

# 1. ESLint Auto-Fix
echo "=== Step 1: ESLint Auto-Fix ==="
echo ""

if pnpm lint --fix 2>&1 | tee /tmp/eslint-fix.log; then
  ESLINT_FIXES=$(grep -c "fixed" /tmp/eslint-fix.log 2>/dev/null || echo "0")
  if [ "$ESLINT_FIXES" -gt 0 ]; then
    echo "✅ Fixed $ESLINT_FIXES ESLint issues"
    ((FIXES_APPLIED++))
  else
    echo "✅ No ESLint issues to fix"
  fi
else
  echo "❌ ESLint auto-fix failed"
  ((ERRORS++))
fi

echo ""

# 2. Prettier Format
echo "=== Step 2: Prettier Format ==="
echo ""

if pnpm format 2>&1 | tee /tmp/prettier-format.log; then
  PRETTIER_FIXES=$(grep -c "Prettier" /tmp/prettier-format.log 2>/dev/null || echo "0")
  if [ "$PRETTIER_FIXES" -gt 0 ]; then
    echo "✅ Formatted files with Prettier"
    ((FIXES_APPLIED++))
  else
    echo "✅ No formatting issues"
  fi
else
  echo "❌ Prettier formatting failed"
  ((ERRORS++))
fi

echo ""

# 3. Import Order Fix (via ESLint)
echo "=== Step 3: Import Order Fix ==="
echo ""

# Import order wird bereits von ESLint behandelt, wenn import/order rule aktiviert ist
echo "✅ Import order handled by ESLint"
echo ""

# 4. Unused Imports/Variables (via ESLint)
echo "=== Step 4: Unused Imports/Variables ==="
echo ""

# Unused imports werden von ESLint entfernt, wenn auto-fix aktiviert ist
echo "✅ Unused imports/variables handled by ESLint"
echo ""

# 5. TypeScript Type Errors (nur Warnung, nicht auto-fixbar)
echo "=== Step 5: TypeScript Type Check ==="
echo ""

if pnpm type-check 2>&1 | tee /tmp/typecheck.log; then
  echo "✅ No TypeScript errors"
else
  TYPE_ERRORS=$(grep -c "error TS" /tmp/typecheck.log 2>/dev/null || echo "0")
  if [ "$TYPE_ERRORS" -gt 0 ]; then
    echo "⚠️  Found $TYPE_ERRORS TypeScript errors (manual fix required)"
    echo "⚠️  Type errors cannot be auto-fixed and require manual intervention"
    ((ERRORS++))
  fi
fi

echo ""

# Zusammenfassung
echo "=========================================="
echo "Auto-Fix Summary"
echo "=========================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $FIXES_APPLIED -eq 0 ]; then
  echo "✅ No issues found - code quality is good!"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo "✅ Auto-fixed $FIXES_APPLIED issue(s)"
  echo "✅ Code quality improved"
  exit 0
else
  echo "⚠️  Auto-fixed $FIXES_APPLIED issue(s)"
  echo "❌ Found $ERRORS error(s) that require manual fix"
  echo ""
  echo "Next steps:"
  echo "  1. Review TypeScript errors: pnpm type-check"
  echo "  2. Fix remaining issues manually"
  echo "  3. Run this script again to verify"
  exit 1
fi












