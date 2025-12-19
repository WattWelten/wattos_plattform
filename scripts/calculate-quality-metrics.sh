#!/bin/bash
set -euo pipefail

# Code Quality Metrics Calculator
# Berechnet Qualitäts-Metriken für die Plattform

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="${SCRIPT_DIR}/../docs/QUALITY_METRICS.md"

echo "Calculating code quality metrics..."
echo ""

# Metriken sammeln
TOTAL_FILES=0
TOTAL_LINES=0
TOTAL_FUNCTIONS=0
TOTAL_COMPLEXITY=0
ESLINT_ERRORS=0
ESLINT_WARNINGS=0
TYPE_ERRORS=0
TODO_COUNT=0
FIXME_COUNT=0

# TypeScript/JavaScript Dateien zählen
TS_FILES=$(find . -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/build/*" | wc -l)
JS_FILES=$(find . -type f \( -name "*.js" -o -name "*.jsx" \) ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/build/*" | wc -l)
TOTAL_FILES=$((TS_FILES + JS_FILES))

# Zeilen zählen
TOTAL_LINES=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/build/*" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")

# TODO/FIXME zählen
TODO_COUNT=$(grep -r "TODO" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules | grep -v dist | wc -l || echo "0")
FIXME_COUNT=$(grep -r "FIXME" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules | grep -v dist | wc -l || echo "0")

# ESLint Metriken (wenn verfügbar)
if command -v pnpm &> /dev/null; then
  ESLINT_OUTPUT=$(pnpm lint 2>&1 || true)
  ESLINT_ERRORS=$(echo "$ESLINT_OUTPUT" | grep -c "error" || echo "0")
  ESLINT_WARNINGS=$(echo "$ESLINT_OUTPUT" | grep -c "warning" || echo "0")
fi

# TypeScript Metriken (wenn verfügbar)
if command -v pnpm &> /dev/null; then
  TYPE_OUTPUT=$(pnpm type-check 2>&1 || true)
  TYPE_ERRORS=$(echo "$TYPE_OUTPUT" | grep -c "error TS" || echo "0")
fi

# Code Coverage (wenn verfügbar)
COVERAGE=0
if [ -f "coverage/lcov.info" ]; then
  COVERAGE=$(grep -oP '^Lines\s+:\s+\K[\d.]+' coverage/lcov.info 2>/dev/null | head -1 || echo "0")
fi

# Berechne Durchschnitts-Metriken
if [ $TOTAL_FILES -gt 0 ]; then
  AVG_LINES_PER_FILE=$((TOTAL_LINES / TOTAL_FILES))
else
  AVG_LINES_PER_FILE=0
fi

# Erstelle Output-Datei
cat > "$OUTPUT_FILE" << EOF
# Code Quality Metrics

> **Automatisch generiert** - Diese Metriken werden automatisch berechnet.
> **Letzte Aktualisierung:** $(date +"%Y-%m-%d %H:%M:%S")

## Übersicht

Diese Metriken geben einen Überblick über die Code-Qualität der WattOS KI Plattform.

## Metriken

### Code-Statistiken

| Metrik | Wert | Ziel | Status |
|--------|------|------|--------|
| **Total Files** | $TOTAL_FILES | - | - |
| **Total Lines** | $TOTAL_LINES | - | - |
| **Avg Lines/File** | $AVG_LINES_PER_FILE | <500 | $([ $AVG_LINES_PER_FILE -lt 500 ] && echo "✅" || echo "⚠️") |
| **TypeScript Files** | $TS_FILES | - | - |
| **JavaScript Files** | $JS_FILES | - | - |

### Code-Qualität

| Metrik | Wert | Ziel | Status |
|--------|------|------|--------|
| **ESLint Errors** | $ESLINT_ERRORS | 0 | $([ $ESLINT_ERRORS -eq 0 ] && echo "✅" || echo "❌") |
| **ESLint Warnings** | $ESLINT_WARNINGS | <10 | $([ $ESLINT_WARNINGS -lt 10 ] && echo "✅" || echo "⚠️") |
| **TypeScript Errors** | $TYPE_ERRORS | 0 | $([ $TYPE_ERRORS -eq 0 ] && echo "✅" || echo "❌") |
| **Code Coverage** | ${COVERAGE}% | >80% | $(( $(echo "$COVERAGE >= 80" | bc -l 2>/dev/null || echo "0") )) && echo "✅" || echo "⚠️") |

### Technical Debt

| Metrik | Wert | Ziel | Status |
|--------|------|------|--------|
| **TODO Comments** | $TODO_COUNT | <50 | $([ $TODO_COUNT -lt 50 ] && echo "✅" || echo "⚠️") |
| **FIXME Comments** | $FIXME_COUNT | <10 | $([ $FIXME_COUNT -lt 10 ] && echo "✅" || echo "⚠️") |
| **Total Technical Debt** | $((TODO_COUNT + FIXME_COUNT)) | <60 | $([ $((TODO_COUNT + FIXME_COUNT)) -lt 60 ] && echo "✅" || echo "⚠️") |

## Qualitäts-Score

EOF

# Berechne Qualitäts-Score (0-100)
SCORE=100

# Abzüge für Fehler
SCORE=$((SCORE - ESLINT_ERRORS * 5))
SCORE=$((SCORE - TYPE_ERRORS * 10))
SCORE=$((SCORE - (ESLINT_WARNINGS / 2)))

# Abzüge für Technical Debt
SCORE=$((SCORE - (TODO_COUNT / 5)))
SCORE=$((SCORE - FIXME_COUNT))

# Abzüge für Coverage
if [ -n "$COVERAGE" ] && [ "$COVERAGE" != "0" ]; then
  COVERAGE_INT=${COVERAGE%.*}
  if [ $COVERAGE_INT -lt 80 ]; then
    SCORE=$((SCORE - (80 - COVERAGE_INT)))
  fi
fi

# Stelle sicher, dass Score zwischen 0 und 100 liegt
if [ $SCORE -lt 0 ]; then
  SCORE=0
elif [ $SCORE -gt 100 ]; then
  SCORE=100
fi

# Score-Bewertung
if [ $SCORE -ge 90 ]; then
  SCORE_STATUS="✅ Excellent"
  SCORE_EMOJI="🟢"
elif [ $SCORE -ge 75 ]; then
  SCORE_STATUS="✅ Good"
  SCORE_EMOJI="🟡"
elif [ $SCORE -ge 60 ]; then
  SCORE_STATUS="⚠️  Needs Improvement"
  SCORE_EMOJI="🟠"
else
  SCORE_STATUS="❌ Critical"
  SCORE_EMOJI="🔴"
fi

cat >> "$OUTPUT_FILE" << EOF
**Overall Quality Score:** $SCORE/100 $SCORE_EMOJI

**Status:** $SCORE_STATUS

### Score-Breakdown

- **Base Score:** 100
- **ESLint Errors:** -$((ESLINT_ERRORS * 5)) (5 points per error)
- **TypeScript Errors:** -$((TYPE_ERRORS * 10)) (10 points per error)
- **ESLint Warnings:** -$((ESLINT_WARNINGS / 2)) (0.5 points per warning)
- **Technical Debt:** -$((TODO_COUNT / 5 + FIXME_COUNT)) (based on TODO/FIXME count)
- **Coverage Penalty:** $([ -n "$COVERAGE" ] && [ "$COVERAGE" != "0" ] && [ ${COVERAGE%.*} -lt 80 ] && echo "-$((80 - ${COVERAGE%.*}))" || echo "0") (if coverage < 80%)

## Trends

> **Hinweis:** Trend-Analyse erfordert historische Daten. Diese werden in zukünftigen Versionen hinzugefügt.

## Empfehlungen

EOF

# Generiere Empfehlungen basierend auf Metriken
if [ $ESLINT_ERRORS -gt 0 ]; then
  echo "- 🔴 **Kritisch:** $ESLINT_ERRORS ESLint Fehler beheben" >> "$OUTPUT_FILE"
fi

if [ $TYPE_ERRORS -gt 0 ]; then
  echo "- 🔴 **Kritisch:** $TYPE_ERRORS TypeScript Fehler beheben" >> "$OUTPUT_FILE"
fi

if [ $ESLINT_WARNINGS -gt 10 ]; then
  echo "- ⚠️  **Wichtig:** ESLint Warnings reduzieren (aktuell: $ESLINT_WARNINGS)" >> "$OUTPUT_FILE"
fi

if [ $TODO_COUNT -gt 50 ]; then
  echo "- ⚠️  **Wichtig:** TODO Kommentare adressieren (aktuell: $TODO_COUNT)" >> "$OUTPUT_FILE"
fi

if [ $FIXME_COUNT -gt 10 ]; then
  echo "- ⚠️  **Wichtig:** FIXME Kommentare beheben (aktuell: $FIXME_COUNT)" >> "$OUTPUT_FILE"
fi

if [ -n "$COVERAGE" ] && [ "$COVERAGE" != "0" ]; then
  COVERAGE_INT=${COVERAGE%.*}
  if [ $COVERAGE_INT -lt 80 ]; then
    echo "- ⚠️  **Wichtig:** Code Coverage erhöhen (aktuell: ${COVERAGE}%, Ziel: >80%)" >> "$OUTPUT_FILE"
  fi
fi

if [ $AVG_LINES_PER_FILE -gt 500 ]; then
  echo "- 💡 **Empfehlung:** Große Dateien aufteilen (Durchschnitt: $AVG_LINES_PER_FILE Zeilen/Datei)" >> "$OUTPUT_FILE"
fi

cat >> "$OUTPUT_FILE" << 'EOF'

## Nächste Schritte

1. Review der Metriken
2. Priorisierung der Verbesserungen
3. Kontinuierliche Überwachung
4. Trend-Analyse über Zeit

---

**Hinweis:** Diese Metriken werden automatisch generiert. Für detaillierte Analyse siehe:
- ESLint Reports: `pnpm lint`
- TypeScript Reports: `pnpm type-check`
- Coverage Reports: `pnpm test:unit --coverage`

EOF

echo "✅ Quality metrics calculated: $OUTPUT_FILE"
echo ""
echo "Summary:"
echo "  - Quality Score: $SCORE/100 $SCORE_EMOJI"
echo "  - ESLint Errors: $ESLINT_ERRORS"
echo "  - TypeScript Errors: $TYPE_ERRORS"
echo "  - Technical Debt: $((TODO_COUNT + FIXME_COUNT)) items"












