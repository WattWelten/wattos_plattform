# Nächste Schritte - WattOS_Plattform Optimierung

## ✅ Bereits durchgeführt

1. **.gitignore erweitert**
   - `*.tsbuildinfo` hinzugefügt
   - Analyse-Verzeichnisse (`*-analysis-*/`) hinzugefügt
   - Log-Dateien hinzugefügt

2. **pnpm-workspace.yaml optimiert**
   - Redundante Definitionen entfernt
   - Sollte node_modules von 44 auf 1 reduzieren

## 🔧 Noch zu erledigen

### 1. Cleanup ausführen

```powershell
# Dry-Run (zeigt was gelöscht würde)
.\scripts\cleanup-project.ps1 -DryRun

# Tatsächlich bereinigen
.\scripts\cleanup-project.ps1
```

**Bereinigt:**
- 7 Analyse-Verzeichnisse
- 49 Build-Verzeichnisse
- tsbuildinfo Dateien
- Log-Dateien

### 2. Struktur korrigieren: apps/apps/ löschen

**Problem:** `apps/apps/services/` enthält 16 Services, die alle auch in `apps/services/` existieren.

**Lösung:**
```powershell
# Prüfen
Get-ChildItem apps\apps\services -Directory

# Löschen (wenn sicher)
Remove-Item -Path "apps\apps" -Recurse -Force
```

**Warnung:** Nur ausführen, wenn sichergestellt ist, dass alle Services auch in `apps/services/` existieren!

### 3. Dependencies neu installieren

Nach der `pnpm-workspace.yaml` Änderung müssen Dependencies neu installiert werden:

```powershell
# Alte node_modules löschen
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "pnpm-lock.yaml" -Force -ErrorAction SilentlyContinue

# Neu installieren
pnpm install

# Prüfen ob nur noch 1 node_modules existiert
Get-ChildItem -Recurse -Directory -Filter "node_modules" | Where-Object { $_.FullName -notmatch 'node_modules.*node_modules' } | Measure-Object
```

**Erwartetes Ergebnis:** Nur noch 1 node_modules Verzeichnis (im Root)

### 4. Cursor neu starten

Nach allen Änderungen:
- Cursor vollständig schließen
- Cursor neu starten
- Prüfen ob Serialisierungsfehler behoben sind

## 📊 Erwartete Verbesserungen

| Metrik | Vorher | Nachher | Verbesserung |
|--------|--------|---------|-------------|
| node_modules Verzeichnisse | 44 | 1 | -98% |
| Dateien (ohne node_modules) | ~4.500 | ~3.500 | -22% |
| Build-Artefakte im Repo | 49 | 0 | -100% |
| Temporäre Dateien | 7+ | 0 | -100% |

## ⚠️ Wichtige Hinweise

1. **Backup erstellen** vor größeren Änderungen
2. **Git Status prüfen** vor Commits
3. **Tests ausführen** nach Dependencies-Neuinstallation
4. **Cursor neu starten** nach allen Änderungen
