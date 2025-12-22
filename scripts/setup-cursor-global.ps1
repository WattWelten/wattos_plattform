# Setup Cursor Global Settings
# Dieses Script konfiguriert Cursor-Einstellungen fuer alle Instanzen (User-Level)

$ErrorActionPreference = "Stop"

Write-Host "Konfiguriere Cursor-Einstellungen fuer alle Instanzen..." -ForegroundColor Cyan

# Cursor User Settings Pfad (Windows)
$cursorUserSettingsPath = "$env:APPDATA\Cursor\User\settings.json"
$cursorUserSettingsDir = Split-Path -Parent $cursorUserSettingsPath

# Erstelle Verzeichnis falls nicht vorhanden
if (-not (Test-Path $cursorUserSettingsDir)) {
    New-Item -ItemType Directory -Path $cursorUserSettingsDir -Force | Out-Null
    Write-Host "[OK] Cursor User Settings Verzeichnis erstellt" -ForegroundColor Green
}

# Lade bestehende User Settings oder erstelle neue
$userSettings = @{}
if (Test-Path $cursorUserSettingsPath) {
    try {
        $existingContent = Get-Content $cursorUserSettingsPath -Raw -Encoding UTF8 | ConvertFrom-Json -AsHashtable
        if ($existingContent) {
            $userSettings = $existingContent
            Write-Host "[OK] Bestehende User Settings geladen" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "[WARN] Konnte bestehende Settings nicht parsen, erstelle neue" -ForegroundColor Yellow
    }
}

# Optimierte Cursor-Einstellungen (werden mit Workspace-Settings zusammengefuehrt)
$cursorOptimizations = @{
    # Cursor AI Optimierungen - REDUZIERT KONTEXTGROESSE
    "cursor.chat.maxContextFiles" = 50
    "cursor.chat.includeWorkspaceFiles" = $false
    "cursor.chat.maxTokens" = 8000
    
    # Performance Optimierungen
    "files.watcherExclude" = @{
        "**/.git/objects/**" = $true
        "**/.git/subtree-cache/**" = $true
        "**/node_modules/**" = $true
        "**/.pnpm-store/**" = $true
        "**/dist/**" = $true
        "**/build/**" = $true
        "**/.next/**" = $true
        "**/.turbo/**" = $true
        "**/coverage/**" = $true
        "**/.cache/**" = $true
        "**/logs/**" = $true
        "**/*.log" = $true
        "**/reports/**" = $true
    }
    
    "search.exclude" = @{
        "**/node_modules" = $true
        "**/dist" = $true
        "**/build" = $true
        "**/.next" = $true
        "**/.turbo" = $true
        "**/coverage" = $true
        "**/.cache" = $true
        "**/logs" = $true
        "**/*.log" = $true
        "**/reports" = $true
        "**/pnpm-lock.yaml" = $true
        "**/package-lock.json" = $true
        "**/yarn.lock" = $true
        "**/.git" = $true
        "**/migrations" = $true
    }
    
    # TypeScript Optimierungen (reduziert Overhead)
    "typescript.preferences.includePackageJsonAutoImports" = "off"
    "typescript.suggest.autoImports" = $false
    "typescript.updateImportsOnFileMove.enabled" = "never"
    "javascript.updateImportsOnFileMove.enabled" = "never"
    
    # Editor Optimierungen
    "editor.wordBasedSuggestions" = "off"
    "editor.quickSuggestions" = @{
        "other" = "off"
        "comments" = "off"
        "strings" = "off"
    }
    
    # Performance
    "files.maxMemoryForLargeFilesMB" = 4096
    "extensions.autoUpdate" = $false
    "extensions.autoCheckUpdates" = $false
    
    # Git Optimierungen
    "git.autofetch" = $false
    "git.autoRepositoryDetection" = $false
}

# Merge mit bestehenden Settings (User-Settings haben Prioritaet)
foreach ($key in $cursorOptimizations.Keys) {
    if (-not $userSettings.ContainsKey($key)) {
        $userSettings[$key] = $cursorOptimizations[$key]
    }
    elseif ($userSettings[$key] -is [Hashtable] -and $cursorOptimizations[$key] -is [Hashtable]) {
        # Merge verschachtelte Hashtables
        foreach ($subKey in $cursorOptimizations[$key].Keys) {
            if (-not $userSettings[$key].ContainsKey($subKey)) {
                $userSettings[$key][$subKey] = $cursorOptimizations[$key][$subKey]
            }
        }
    }
}

# Speichere User Settings
try {
    $jsonContent = $userSettings | ConvertTo-Json -Depth 10
    Set-Content -Path $cursorUserSettingsPath -Value $jsonContent -Encoding UTF8
    Write-Host "[OK] Cursor User Settings aktualisiert: $cursorUserSettingsPath" -ForegroundColor Green
}
catch {
    Write-Host "[FEHLER] Fehler beim Speichern der User Settings: $_" -ForegroundColor Red
    exit 1
}

# Pruefe .cursorignore im aktuellen Workspace
# Versuche Workspace-Root zu finden (entweder vom Script-Pfad oder vom aktuellen Verzeichnis)
$workspaceRoot = if ($PSScriptRoot) { 
    $PSScriptRoot | Split-Path -Parent | Split-Path -Parent 
} else { 
    $PWD.Path 
}
$cursorIgnorePath = Join-Path $workspaceRoot ".cursorignore"

if (Test-Path $cursorIgnorePath) {
    Write-Host "[OK] .cursorignore gefunden im Workspace" -ForegroundColor Green
}
else {
    Write-Host "[WARN] .cursorignore nicht gefunden im Workspace" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Cursor-Einstellungen erfolgreich konfiguriert!" -ForegroundColor Green
Write-Host ""
Write-Host "Naechste Schritte:" -ForegroundColor Cyan
Write-Host "   1. Cursor vollstaendig neu starten (alle Fenster schliessen)" -ForegroundColor White
Write-Host "   2. Die Einstellungen gelten jetzt fuer ALLE Cursor-Instanzen" -ForegroundColor White
Write-Host "   3. Bei Problemen: Pruefe $cursorUserSettingsPath" -ForegroundColor White
Write-Host ""
