#!/bin/bash
set -euo pipefail

# Sammelt GitHub Actions Workflow-Logs

OUTPUT_DIR=${1:-logs/github}
WORKFLOW=${2:-}  # Optional: spezifischer Workflow

mkdir -p "$OUTPUT_DIR"

log_info() { echo "ℹ $1"; }
log_success() { echo "✅ $1"; }
log_error() { echo "❌ $1"; }

# Prüfe GitHub CLI
if ! command -v gh &> /dev/null; then
  log_error "GitHub CLI (gh) ist nicht installiert"
  log_info "Installiere: brew install gh (macOS) oder apt-get install gh (Linux)"
  exit 1
fi

# Prüfe Authentifizierung
if ! gh auth status &> /dev/null; then
  log_error "Nicht bei GitHub authentifiziert"
  log_info "Führe aus: gh auth login"
  exit 1
fi

log_info "Sammle GitHub Actions Logs..."

# Sammle Workflow-Runs
gh run list --limit 20 --json databaseId,workflowName,status,conclusion,createdAt > "$OUTPUT_DIR/workflow-runs.json" 2>&1 || true

# Sammle Logs für fehlgeschlagene Runs
failed_runs=$(gh run list --limit 10 --json databaseId,workflowName,conclusion --jq '.[] | select(.conclusion == "failure") | .databaseId' 2>/dev/null || echo "")

if [ -n "$failed_runs" ]; then
  while IFS= read -r run_id; do
    if [ -n "$run_id" ]; then
      log_info "Sammle Logs für Run: $run_id"
      gh run view "$run_id" --log > "$OUTPUT_DIR/run-${run_id}.log" 2>&1 || true
    fi
  done <<< "$failed_runs"
fi

# Sammle spezifischen Workflow falls angegeben
if [ -n "$WORKFLOW" ]; then
  log_info "Sammle Logs für Workflow: $WORKFLOW"
  gh run list --workflow "$WORKFLOW" --limit 5 --json databaseId --jq '.[].databaseId' | while read -r run_id; do
    if [ -n "$run_id" ]; then
      gh run view "$run_id" --log > "$OUTPUT_DIR/workflow-${WORKFLOW}-${run_id}.log" 2>&1 || true
    fi
  done
fi

log_success "GitHub Actions Logs gesammelt: $OUTPUT_DIR"






