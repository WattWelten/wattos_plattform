# GitHub Advanced Security für CodeQL

## Problem

CodeQL Code Scanning erfordert **GitHub Advanced Security**, das für öffentliche Repositories kostenlos ist, aber für private Repositories aktiviert werden muss.

## Fehlermeldung

```
Advanced Security must be enabled for this repository to use code scanning.
```

## Lösung

### Für öffentliche Repositories

✅ **Automatisch aktiviert** - Keine Aktion erforderlich

### Für private Repositories

**Option 1: Advanced Security aktivieren (Empfohlen)**

1. Gehe zu Repository → **Settings** → **Code security and analysis**
2. Scrolle zu **"GitHub Advanced Security"**
3. Klicke **"Enable"** für:
   - ✅ Code scanning
   - ✅ Secret scanning (optional)
   - ✅ Dependency review (optional)

**Kosten:**
- Für private Repositories: $21 pro Repository/Monat
- Für öffentliche Repositories: **Kostenlos**

**Option 2: CodeQL Workflow deaktivieren (Temporär)**

Falls Advanced Security nicht aktiviert werden soll:

1. Gehe zu `.github/workflows/security.yml`
2. Kommentiere CodeQL Job aus oder entferne ihn
3. Oder: Füge `if: false` hinzu

**Option 3: CodeQL nur für öffentliche Repositories**

```yaml
code-scan:
  if: github.event.repository.private == false
  # ... CodeQL Steps
```

## Aktuelle Konfiguration

Der Workflow verwendet jetzt:
- ✅ `github/codeql-action/init@v4`
- ✅ `github/codeql-action/analyze@v4`
- ✅ `github/codeql-action/upload-sarif@v4`
- ✅ `continue-on-error: true` (non-blocking, falls Advanced Security nicht aktiviert)

## Nächste Schritte

1. **Prüfe Repository-Typ:**
   - Öffentlich → Advanced Security ist automatisch aktiviert
   - Privat → Aktivieren in Settings oder Workflow deaktivieren

2. **Falls Advanced Security aktiviert:**
   - CodeQL Scans funktionieren automatisch
   - Ergebnisse erscheinen in Security Tab

3. **Falls Advanced Security nicht aktiviert:**
   - Workflow läuft durch (dank `continue-on-error`)
   - CodeQL Steps werden übersprungen
   - Andere Security Scans (Trivy, npm audit) funktionieren weiterhin

## Referenzen

- [GitHub Advanced Security](https://docs.github.com/en/code-security/getting-started/github-security-features)
- [CodeQL Action v4](https://github.blog/changelog/2025-10-28-upcoming-deprecation-of-codeql-action-v3/)
- [Actions/upload-artifact v4](https://github.blog/changelog/2024-04-16-deprecation-notice-v3-of-the-artifact-actions/)






