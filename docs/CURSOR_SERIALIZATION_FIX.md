# Cursor Serialisierungsfehler - Behebungsanleitung

## Problem
Der Fehler `ConnectError: [internal] Serialization error in aiserver.v1.StreamUnifiedChatRequestWithTools` tritt auf, wenn Cursor versucht, eine Anfrage an den AI-Server zu serialisieren. Dies ist ein interner Cursor-Fehler, nicht ein Problem mit dem Projektcode.

## Durchgeführte Schritte

### ✅ Phase 1: Schnelle Fixes (abgeschlossen)

1. **Cursor-Cache gelöscht**
   - Cache-Verzeichnis: `%APPDATA%\Cursor\Cache`
   - CachedData-Verzeichnis: `%APPDATA%\Cursor\CachedData`

2. **Workspace-Einstellungen geprüft**
   - Kein `.vscode/settings.json` gefunden (OK)
   - Kein `.cursor/` Verzeichnis gefunden (OK)

3. **Cursor-Einstellungen gesichert**
   - Backup von `%APPDATA%\Cursor\User\settings.json` erstellt (falls vorhanden)

### ⏳ Phase 2: Manuelle Schritte (ausstehend)

4. **Cursor-Logs prüfen**
   - Öffnen Sie die Developer Tools: `Help > Toggle Developer Tools`
   - Gehen Sie zum Tab "Console"
   - Suchen Sie nach weiteren Fehlermeldungen
   - Notieren Sie alle Fehler für die Analyse

5. **Cursor-Einstellungen zurücksetzen (falls nötig)**
   - Falls der Fehler weiterhin auftritt:
     - Sichern Sie `%APPDATA%\Cursor\User\settings.json` (Backup wurde bereits erstellt)
     - Benennen Sie die Datei temporär um (z.B. `settings.json.old`)
     - Starten Sie Cursor neu
     - Prüfen Sie, ob der Fehler verschwindet

6. **Erweiterungen deaktivieren (falls nötig)**
   - Falls der Fehler weiterhin auftritt:
     - Deaktivieren Sie alle Cursor-Erweiterungen temporär
     - Starten Sie Cursor neu
     - Prüfen Sie, ob der Fehler verschwindet
     - Aktivieren Sie Erweiterungen einzeln wieder, um die problematische zu identifizieren

### 🔄 Phase 3: Letzte Maßnahmen (falls nötig)

7. **Cursor neu installieren**
   - Aktuelle Version deinstallieren
   - Neueste Version von [cursor.sh](https://cursor.sh) herunterladen
   - Neu installieren
   - Workspace erneut öffnen

## Nächste Schritte

1. **Cursor neu starten**
   - Schließen Sie alle Cursor-Fenster vollständig
   - Starten Sie Cursor neu
   - Öffnen Sie den Workspace `D:\WattOS_Plattform`

2. **Fehler reproduzieren**
   - Versuchen Sie, die Aktion auszuführen, die den Fehler verursacht hat
   - Prüfen Sie, ob der Fehler weiterhin auftritt

3. **Developer Tools prüfen**
   - Öffnen Sie `Help > Toggle Developer Tools`
   - Prüfen Sie die Console auf Fehlermeldungen
   - Notieren Sie alle relevanten Fehler

## Präventive Maßnahmen

- **Große Dateien vermeiden**: Sehr große Dateien (>10MB) können Serialisierungsprobleme verursachen
- **Zirkuläre Referenzen vermeiden**: In Konfigurationsdateien keine zirkulären Referenzen
- **Regelmäßige Updates**: Cursor auf neueste Version halten
- **Cache regelmäßig löschen**: Bei Problemen den Cache löschen

## Diagnose-Informationen

Falls der Fehler weiterhin auftritt, sammeln Sie folgende Informationen:

- Wann tritt der Fehler auf? (beim Öffnen, bei bestimmten Aktionen, zufällig?)
- Welche Dateien sind geöffnet?
- Gibt es große Dateien im Workspace?
- Welche Cursor-Version wird verwendet?
- Gibt es weitere Fehlermeldungen in den Developer Tools?

## Erwartetes Ergebnis

Nach erfolgreicher Behebung sollte Cursor wieder normal funktionieren und Anfragen an den AI-Server ohne Serialisierungsfehler verarbeiten können.

## Automatisierung

Ein PowerShell-Skript zur automatischen Cache-Bereinigung wurde erstellt:
- `scripts/fix-cursor-serialization.ps1`

Führen Sie es aus mit:
```powershell
powershell -ExecutionPolicy Bypass -File "scripts\fix-cursor-serialization.ps1"
```

**WICHTIG**: Schließen Sie Cursor vor der Ausführung des Skripts!


