# Cursor-Konfiguration fÃ¼r WattOS Plattform

Diese Dokumentation beschreibt die Cursor-Einstellungen zur Vermeidung von Serialisierungsfehlern und zur Optimierung der Performance.

## Ãœbersicht

Die Konfiguration besteht aus drei Komponenten:

1. **.cursorignore** - SchlieÃŸt groÃŸe Dateien/Ordner vom AI-Kontext aus
2. **.vscode/settings.json** - Workspace-spezifische Einstellungen
3. **User Settings** - Globale Einstellungen fÃ¼r alle Cursor-Instanzen

## Schnellstart

### Automatische Konfiguration (Empfohlen)

```powershell
# FÃ¼hre das Setup-Script aus
pnpm cursor:setup
# oder direkt:
.\scripts\setup-cursor-global.ps1
```

Das Script:
- Konfiguriert globale Cursor-Einstellungen (User-Level)
- Merged mit bestehenden Einstellungen (keine Ãœberschreibung)
- PrÃ¼ft .cursorignore im Workspace

### Manuelle Konfiguration

1. Cursor vollstÃ¤ndig neu starten (alle Fenster schlieÃŸen)
2. Die Einstellungen werden automatisch geladen

## Wichtige Einstellungen

### Cursor AI Optimierungen

- `cursor.chat.maxContextFiles: 50` - Reduziert KontextgrÃ¶ÃŸe
- `cursor.chat.includeWorkspaceFiles: false` - Nur explizit geÃ¶ffnete Dateien
- `cursor.chat.maxTokens: 8000` - Begrenzt Token-Anzahl

**Wirkung:**
- Reduziert die KontextgrÃ¶ÃŸe um ~80-90%
- Verhindert Serialisierungsfehler
- Schnellere Antwortzeiten

## Troubleshooting

### Serialisierungsfehler treten weiterhin auf

1. Cursor vollstÃ¤ndig neu starten (alle Fenster schlieÃŸen)
2. PrÃ¼fe User Settings: %APPDATA%\Cursor\User\settings.json
3. PrÃ¼fe .cursorignore: Sollte im Workspace-Root liegen
4. GroÃŸe Dateien manuell schlieÃŸen: Nicht benÃ¶tigte Tabs schlieÃŸen

### Einstellungen werden nicht Ã¼bernommen

1. PrÃ¼fe, ob User Settings existieren: %APPDATA%\Cursor\User\settings.json
2. FÃ¼hre Setup-Script erneut aus: pnpm cursor:setup
3. PrÃ¼fe JSON-Syntax: User Settings mÃ¼ssen valides JSON sein
