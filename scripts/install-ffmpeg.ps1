# FFmpeg Installation Script für Windows (PowerShell)
# Erfordert Chocolatey

Write-Host "🎥 FFmpeg Installation für Video-Service" -ForegroundColor Cyan

# Prüfe ob Chocolatey installiert ist
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Chocolatey nicht gefunden." -ForegroundColor Red
    Write-Host ""
    Write-Host "Installiere Chocolatey:" -ForegroundColor Yellow
    Write-Host "  Set-ExecutionPolicy Bypass -Scope Process -Force;"
    Write-Host "  [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072;"
    Write-Host "  iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    Write-Host ""
    Write-Host "Oder lade FFmpeg manuell herunter:" -ForegroundColor Yellow
    Write-Host "  https://ffmpeg.org/download.html"
    exit 1
}

Write-Host "📦 Installiere FFmpeg via Chocolatey..." -ForegroundColor Yellow
choco install ffmpeg -y

# Verify Installation
if (Get-Command ffmpeg -ErrorAction SilentlyContinue) {
    Write-Host "✅ FFmpeg erfolgreich installiert!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Version:" -ForegroundColor Cyan
    ffmpeg -version | Select-Object -First 1
    ffprobe -version | Select-Object -First 1
} else {
    Write-Host "❌ FFmpeg Installation fehlgeschlagen" -ForegroundColor Red
    exit 1
}
