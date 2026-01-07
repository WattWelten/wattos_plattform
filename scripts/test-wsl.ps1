# PowerShell Wrapper fÃ¼r WSL Test Script
param([string]$Package = "")
$ErrorActionPreference = "Stop"
Write-Host "ðŸ§ª Starte Tests in WSL..." -ForegroundColor Cyan
if ($Package) {
    wsl bash scripts/test-wsl.sh $Package
} else {
    wsl bash scripts/test-wsl.sh
}
Write-Host "âœ… Tests abgeschlossen." -ForegroundColor Green
